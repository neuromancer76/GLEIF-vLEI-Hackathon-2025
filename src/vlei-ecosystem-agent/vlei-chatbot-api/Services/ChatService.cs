using Microsoft.Extensions.Configuration;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using MyCustomMCPServer.Tools;
using System.Text;

namespace vlei_chatbot_api.Services;

public interface IChatService
{
    Task<ChatServiceResponse> SendMessageAsync(string message, string? conversationId = null, IHttpContextAccessor? httpContextAccessor = null);
    Task<string> StartNewConversationAsync(string? initialMessage = null);
    void UpdateConversationHistory(string conversationId, ChatHistory chatHistory);
    ChatHistory? GetConversationHistory(string conversationId);
    bool ClearConversationHistory(string conversationId);
}

public class ChatServiceResponse
{
    public string ConversationId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public List<string>? ToolCalls { get; set; }  // List of tool names that were called
    public List<string>? EcosystemMessages { get; set; }  // User-friendly ecosystem call messages
    
    // Threading support for multi-topic conversations
    public string? ThreadId { get; set; }
    public string? ThreadTitle { get; set; }
    public string? ThreadIcon { get; set; }
    public bool IsThreadStart { get; set; }
    public List<ThreadSuggestion>? SuggestedThreads { get; set; }
}

// Thread suggestion when AI detects multiple topics in a single response
public class ThreadSuggestion
{
    public string ThreadId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class ChatService : IChatService
{
    private readonly Kernel _kernel;
    private readonly IChatCompletionService _chatCompletion;
    private readonly Dictionary<string, ChatHistory> _conversations;
    private readonly ILogger<ChatService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ChatService(
        Kernel kernel,
        IChatCompletionService chatCompletion,
        ILogger<ChatService> logger,
        IConfiguration configuration,
        IHttpContextAccessor httpContextAccessor)
    {
        _kernel = kernel;
        _chatCompletion = chatCompletion;
        _conversations = new Dictionary<string, ChatHistory>();
        _logger = logger;
        _configuration = configuration;
        _httpContextAccessor = httpContextAccessor;
        
        // Log instance creation to detect if multiple instances are created
        _logger.LogWarning("🏗️ NEW ChatService instance created! Instance HashCode: {HashCode}", this.GetHashCode());
    }

    public async Task<string> StartNewConversationAsync(string? initialMessage = null)
    {
        var conversationId = Guid.NewGuid().ToString();
        var chatHistory = new ChatHistory();
        
        // Load system messages from configuration prompt files
        var promptFolder = GetPromptFolder();
        if (Directory.Exists(promptFolder))
        {
            _logger.LogInformation("Loading system prompts from: {PromptFolder}", promptFolder);
            chatHistory.AddSystemMessage("You are a business expert. You can run query given the following grammar");
            
            var promptFiles = Directory.GetFiles(promptFolder, "*.md");
            _logger.LogInformation("Found {Count} prompt files", promptFiles.Length);
            
            foreach (var fileName in promptFiles)
            {
                _logger.LogDebug("Loading prompt file: {FileName}", Path.GetFileName(fileName));
                var content = await File.ReadAllTextAsync(fileName);
                chatHistory.AddSystemMessage(content);
            }
        }
        else
        {
            _logger.LogWarning("Prompt folder not found: {PromptFolder}. Using default system message only.", promptFolder);
            chatHistory.AddSystemMessage("You are a helpful VLEI ecosystem assistant.");
        }

        // Add initial user message if provided (company context)
        if (!string.IsNullOrWhiteSpace(initialMessage))
        {
            _logger.LogInformation("Adding initial user message with company context to conversation");
            chatHistory.AddUserMessage(initialMessage);
        }

        _conversations[conversationId] = chatHistory;
        _logger.LogInformation("Started new conversation: {ConversationId} with {MessageCount} messages", conversationId, chatHistory.Count);
        return conversationId;
    }

    public async Task<ChatServiceResponse> SendMessageAsync(string message, string? conversationId = null, IHttpContextAccessor? httpContextAccessor = null)
    {
        try
        {
            _logger.LogInformation("📨 SendMessageAsync called with conversationId: '{ConversationId}' (Instance: {HashCode})", 
                conversationId ?? "null", this.GetHashCode());
            
            // If no conversation ID provided, create a new one
            if (string.IsNullOrWhiteSpace(conversationId))
            {
                _logger.LogInformation("No conversationId provided, creating new conversation");
                conversationId = await StartNewConversationAsync();
            }

            // Get or create conversation
            if (!_conversations.TryGetValue(conversationId, out var chatHistory))
            {
                _logger.LogWarning("⚠️ Conversation '{ConversationId}' not found in dictionary. Current conversations: [{Conversations}]", 
                    conversationId, 
                    string.Join(", ", _conversations.Keys));
                _logger.LogError("🚨 CONVERSATION CONTEXT LOST! Creating NEW conversation will lose all previous history including tool execution results.");
                
                // IMPORTANT: We should use the existing conversationId but create new history
                // This maintains the conversationId for the client but loses chat history
                chatHistory = new ChatHistory();
                
                // Load system prompts for the new history
                var promptFolder = GetPromptFolder();
                if (Directory.Exists(promptFolder))
                {
                    chatHistory.AddSystemMessage("You are a business expert. You can run query given the following grammar");
                    var promptFiles = Directory.GetFiles(promptFolder, "*.md");
                    foreach (var fileName in promptFiles)
                    {
                        var content = await File.ReadAllTextAsync(fileName);
                        chatHistory.AddSystemMessage(content);
                    }
                }
                else
                {
                    chatHistory.AddSystemMessage("You are a helpful VLEI ecosystem assistant.");
                }
                
                _conversations[conversationId] = chatHistory;
                _logger.LogInformation("✅ Created new chat history for existing conversationId: {ConversationId}", conversationId);
            }
            else
            {
                _logger.LogInformation("✅ Found existing conversation '{ConversationId}' with {MessageCount} messages", 
                    conversationId, 
                    chatHistory.Count);
                
                // Log the last few messages for debugging
                _logger.LogInformation("📋 Last 5 messages in conversation history:");
                var recentMessages = chatHistory.Skip(Math.Max(0, chatHistory.Count - 5)).ToList();
                for (int i = 0; i < recentMessages.Count; i++)
                {
                    var msg = recentMessages[i];
                    var preview = msg.Content?.Substring(0, Math.Min(80, msg.Content?.Length ?? 0)) ?? "[No content]";
                    _logger.LogInformation("  [{Index}] Role: {Role} - {Preview}...", 
                        chatHistory.Count - recentMessages.Count + i, 
                        msg.Role, 
                        preview);
                }
            }

            // Store conversation ID in HTTP context for the filter
            if (_httpContextAccessor.HttpContext != null)
            {
                _httpContextAccessor.HttpContext.Items["ConversationId"] = conversationId;
            }

            // Add user message
            chatHistory.AddUserMessage(message);
            _logger.LogInformation("📝 Added user message to conversation. Total messages now: {Count}", chatHistory.Count);

            // Clear any previous tool calls from HTTP context
            if (_httpContextAccessor.HttpContext != null)
            {
                _httpContextAccessor.HttpContext.Items["ToolCalls"] = new List<string>();
                _httpContextAccessor.HttpContext.Items["PreExecutionMessages"] = new List<string>();
            }

            // Get response from semantic kernel
            var fullAssistantContent = new StringBuilder();
            
            await foreach (var content in _chatCompletion.GetStreamingChatMessageContentsAsync(
                chatHistory,
                new OpenAIPromptExecutionSettings { FunctionChoiceBehavior = FunctionChoiceBehavior.Auto() },
                _kernel))
            {
                if (!string.IsNullOrEmpty(content.Content))
                {
                    fullAssistantContent.Append(content.Content);
                }
            }

            var response = fullAssistantContent.ToString();
            
            // Add assistant response to history
            chatHistory.AddAssistantMessage(response);

            // Get tool calls from HTTP context
            var toolCalls = _httpContextAccessor.HttpContext?.Items["ToolCalls"] as List<string>;
            var preExecutionMessages = _httpContextAccessor.HttpContext?.Items["PreExecutionMessages"] as List<string>;
            
            // Debug logging for tool calls
            if (toolCalls != null && toolCalls.Any())
            {
                _logger.LogInformation("🔧 Found {Count} tool calls: {ToolCalls}", toolCalls.Count, string.Join(", ", toolCalls));
            }
            else
            {
                _logger.LogInformation("📝 No tool calls found in HTTP context");
            }

            // Use pre-execution messages if available (these are generated during function execution)
            // Otherwise fallback to generating them from tool calls
            var ecosystemMessages = preExecutionMessages?.Any() == true 
                ? preExecutionMessages
                : (toolCalls != null ? ToolCallMessageHelper.CreateEcosystemCallMessages(toolCalls) : null);
                
            // Debug logging for ecosystem messages
            if (ecosystemMessages != null && ecosystemMessages.Any())
            {
                _logger.LogInformation("💬 Using {Count} ecosystem messages (pre-execution: {IsPreExecution}):", 
                    ecosystemMessages.Count, preExecutionMessages?.Any() == true);
                foreach (var msg in ecosystemMessages)
                {
                    _logger.LogInformation("  - {Message}", msg);
                }
            }

            // Check if LLM called create-conversation-topic tool during execution
            var suggestedThreads = ExtractThreadsFromToolCalls(toolCalls, chatHistory);
            
            // Log thread detection results
            if (suggestedThreads != null && suggestedThreads.Any())
            {
                _logger.LogInformation("🧵 LLM created {Count} conversation threads via tool calls:", suggestedThreads.Count);
                foreach (var thread in suggestedThreads)
                {
                    _logger.LogInformation("  - {Icon} {Title} (ID: {ThreadId})", thread.Icon, thread.Title, thread.ThreadId);
                }
            }
            else
            {
                _logger.LogInformation("📝 No conversation threads created by LLM");
            }

            return new ChatServiceResponse
            {
                ConversationId = conversationId,
                Message = response,
                ToolCalls = toolCalls,
                EcosystemMessages = ecosystemMessages,
                SuggestedThreads = suggestedThreads
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing chat message");
            return new ChatServiceResponse
            {
                ConversationId = conversationId ?? string.Empty,
                Message = "I apologize, but I encountered an error while processing your request. Please try again."
            };
        }
    }

    public void UpdateConversationHistory(string conversationId, ChatHistory chatHistory)
    {
        _logger.LogInformation("📝 Updating conversation history for '{ConversationId}' with {MessageCount} messages (Instance: {HashCode})", 
            conversationId, chatHistory.Count, this.GetHashCode());
        _conversations[conversationId] = chatHistory;
        _logger.LogInformation("✅ After update, dictionary contains {Count} conversations: [{Keys}]",
            _conversations.Count,
            string.Join(", ", _conversations.Keys.Take(5)));
    }

    public ChatHistory? GetConversationHistory(string conversationId)
    {
        if (_conversations.TryGetValue(conversationId, out var chatHistory))
        {
            _logger.LogInformation("✅ Retrieved conversation history for '{ConversationId}' with {MessageCount} messages", 
                conversationId, chatHistory.Count);
            return chatHistory;
        }
        
        _logger.LogWarning("⚠️ Conversation '{ConversationId}' not found when retrieving history", conversationId);
        return null;
    }

    public bool ClearConversationHistory(string conversationId)
    {
        if (_conversations.ContainsKey(conversationId))
        {
            var messageCount = _conversations[conversationId].Count;
            _conversations.Remove(conversationId);
            
            // Also clear thread metadata for this conversation
            ConversationTopicTool.ClearThreadMetadata();
            
            _logger.LogInformation("🧹 Cleared conversation '{ConversationId}' with {MessageCount} messages. Total conversations: {TotalConversations}", 
                conversationId, messageCount, _conversations.Count);
            return true;
        }
        
        _logger.LogWarning("⚠️ Attempted to clear non-existent conversation '{ConversationId}'", conversationId);
        return false;
    }

    private string GetPromptFolder()
    {
        // First try to get from configuration (like console app)
        var promptFolder = _configuration.GetSection("AzureOpenAI")["PromptConfiguration"];
        
        if (!string.IsNullOrWhiteSpace(promptFolder))
        {
            _logger.LogDebug("Using prompt folder from configuration: {PromptFolder}", promptFolder);
            return promptFolder;
        }
        
        // Fallback to default location
        var defaultPath = Path.Combine(Directory.GetCurrentDirectory(), "ConfigurationPrompt");
        _logger.LogDebug("Using default prompt folder: {PromptFolder}", defaultPath);
        return defaultPath;
    }

    private List<ThreadSuggestion>? ExtractThreadsFromToolCalls(List<string>? toolCalls, ChatHistory chatHistory)
    {
        // Extract thread information from create-conversation-topic tool calls
        // The LLM should have called this tool for each topic it identified
        
        if (toolCalls == null || !toolCalls.Any())
        {
            return null;
        }

        var suggestions = new List<ThreadSuggestion>();

        // Check if create-conversation-topic was called
        if (toolCalls.Any(tc => tc.Contains("create-conversation-topic", StringComparison.OrdinalIgnoreCase)))
        {
            _logger.LogInformation("🔍 Found create-conversation-topic tool call(s)");
            
            // Retrieve thread metadata from the tool's static storage
            var allThreadMetadata = ConversationTopicTool.GetAllThreadMetadata();
            
            if (allThreadMetadata.Any())
            {
                foreach (var metadata in allThreadMetadata)
                {
                    suggestions.Add(new ThreadSuggestion
                    {
                        ThreadId = metadata.ThreadId,
                        Title = metadata.TopicName,
                        Icon = DetermineIconForTopic(metadata.TopicName),
                        Description = $"Conversation about {metadata.TopicName}"
                    });
                    
                    _logger.LogInformation("✅ Extracted thread from tool metadata: {ThreadId} - {Topic}", 
                        metadata.ThreadId, metadata.TopicName);
                }
                
                // Clear metadata after extraction to avoid duplicates in next conversation
                ConversationTopicTool.ClearThreadMetadata();
            }
            else
            {
                _logger.LogWarning("⚠️ create-conversation-topic was called but no metadata found in storage");
            }
        }

        return suggestions.Count > 0 ? suggestions : null;
    }

    private string DetermineIconForTopic(string topicName)
    {
        var lowerTopic = topicName.ToLower();
        
        if (lowerTopic.Contains("stationery") || lowerTopic.Contains("office") || lowerTopic.Contains("supplies"))
            return "📋";
        if (lowerTopic.Contains("it") || lowerTopic.Contains("consulting") || lowerTopic.Contains("technology"))
            return "💻";
        if (lowerTopic.Contains("catering") || lowerTopic.Contains("food") || lowerTopic.Contains("brunch"))
            return "🍴";
        if (lowerTopic.Contains("copper") || lowerTopic.Contains("metal") || lowerTopic.Contains("material"))
            return "🌾";
        
        return "🧵"; // Default
    }
}