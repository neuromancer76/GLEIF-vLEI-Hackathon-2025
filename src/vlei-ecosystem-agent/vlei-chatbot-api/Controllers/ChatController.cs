using Microsoft.AspNetCore.Mvc;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using System.Text;
using vlei_chatbot_api.Services;

namespace vlei_chatbot_api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatController> _logger;

    public ChatController(
        IChatService chatService, 
        ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _logger = logger;
    }

    [HttpPost("start")]
    public async Task<ActionResult<ChatResponse>> StartConversation([FromBody] StartConversationRequest? request = null)
    {
        try
        {
            var conversationId = await _chatService.StartNewConversationAsync(request?.InitialMessage);
            return Ok(new ChatResponse
            {
                ConversationId = conversationId,
                Message = "Hello! I'm your VLEI ecosystem assistant. How can I help you today?",
                Success = true,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting conversation");
            return StatusCode(500, new ChatResponse
            {
                Success = false,
                Error = "Failed to start conversation",
                Timestamp = DateTime.UtcNow
            });
        }
    }

    [HttpPost("message")]
    public async Task<ActionResult<ChatResponse>> SendMessage([FromBody] ChatRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Message) && request.Attachment == null)
            {
                return BadRequest(new ChatResponse
                {
                    Success = false,
                    Error = "Message or attachment is required",
                    Timestamp = DateTime.UtcNow
                });
            }

            // If there's an attachment, include its content in the message
            var messageToSend = request.Message;
            if (request.Attachment != null)
            {
                _logger.LogInformation("📎 Processing attachment: {FileName} ({FileSize} bytes)", 
                    request.Attachment.FileName, request.Attachment.FileSize);
                
                var attachmentHeader = $"\n\n[Email Attachment: {request.Attachment.FileName}]\n";
                var attachmentFooter = "\n[End of Email Attachment]\n";
                
                messageToSend = string.IsNullOrWhiteSpace(messageToSend) 
                    ? $"Please analyze this email attachment:{attachmentHeader}{request.Attachment.Content}{attachmentFooter}"
                    : $"{messageToSend}{attachmentHeader}{request.Attachment.Content}{attachmentFooter}";
            }

            var serviceResponse = await _chatService.SendMessageAsync(messageToSend, request.ConversationId);
            
            // Debug logging
            _logger.LogInformation("📤 ChatController response - ToolCalls: {ToolCallCount}, EcosystemMessages: {EcosystemMessageCount}", 
                serviceResponse.ToolCalls?.Count ?? 0, 
                serviceResponse.EcosystemMessages?.Count ?? 0);
            
            if (serviceResponse.EcosystemMessages != null && serviceResponse.EcosystemMessages.Any())
            {
                _logger.LogInformation("💬 Sending ecosystem messages to frontend:");
                foreach (var msg in serviceResponse.EcosystemMessages)
                {
                    _logger.LogInformation("  - {Message}", msg);
                }
            }
            
            var response = new ChatResponse
            {
                ConversationId = serviceResponse.ConversationId,
                Message = serviceResponse.Message,
                Success = true,
                Timestamp = DateTime.UtcNow,
                ToolCalls = serviceResponse.ToolCalls,  // Include tool calls if any
                EcosystemMessages = serviceResponse.EcosystemMessages,  // Include ecosystem messages
                ThreadId = serviceResponse.ThreadId,
                ThreadTitle = serviceResponse.ThreadTitle,
                ThreadIcon = serviceResponse.ThreadIcon,
                IsThreadStart = serviceResponse.IsThreadStart,
                SuggestedThreads = serviceResponse.SuggestedThreads?.Select(t => new ThreadSuggestionDto
                {
                    ThreadId = t.ThreadId,
                    Title = t.Title,
                    Icon = t.Icon,
                    Description = t.Description
                }).ToList()
            };
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing message");
            return StatusCode(500, new ChatResponse
            {
                Success = false,
                Error = "Failed to process message",
                Timestamp = DateTime.UtcNow
            });
        }
    }

    [HttpGet("context/{conversationId}")]
    public ActionResult<ConversationContextResponse> GetConversationContext(string conversationId)
    {
        try
        {
            var chatHistory = _chatService.GetConversationHistory(conversationId);
            
            if (chatHistory == null)
            {
                return NotFound(new ConversationContextResponse
                {
                    Success = false,
                    Error = "Conversation not found",
                    Timestamp = DateTime.UtcNow
                });
            }

            var messages = chatHistory.Select((msg, index) => new ContextMessage
            {
                Index = index,
                Role = msg.Role.Label,
                Content = msg.Content ?? string.Empty,
                Timestamp = DateTime.UtcNow // We don't have individual timestamps stored
            }).ToList();

            _logger.LogInformation("📋 Retrieved conversation context for '{ConversationId}' with {MessageCount} messages", 
                conversationId, messages.Count);

            return Ok(new ConversationContextResponse
            {
                ConversationId = conversationId,
                Messages = messages,
                TotalMessages = messages.Count,
                Success = true,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving conversation context for '{ConversationId}'", conversationId);
            return StatusCode(500, new ConversationContextResponse
            {
                Success = false,
                Error = "Failed to retrieve conversation context",
                Timestamp = DateTime.UtcNow
            });
        }
    }

    [HttpDelete("conversation/{conversationId}")]
    public ActionResult DeleteConversation(string conversationId)
    {
        try
        {
            var deleted = _chatService.ClearConversationHistory(conversationId);
            
            if (deleted)
            {
                _logger.LogInformation("🗑️ Conversation '{ConversationId}' history cleared", conversationId);
                return Ok(new { Success = true, Message = "Conversation history cleared" });
            }
            else
            {
                return NotFound(new { Success = false, Message = "Conversation not found" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing conversation '{ConversationId}'", conversationId);
            return StatusCode(500, new { Success = false, Message = "Failed to clear conversation" });
        }
    }

    [HttpPost("clear/{conversationId}")]
    public ActionResult ClearConversation(string conversationId)
    {
        try
        {
            var cleared = _chatService.ClearConversationHistory(conversationId);
            
            if (cleared)
            {
                _logger.LogInformation("🧹 Conversation '{ConversationId}' history cleared for new conversation", conversationId);
                return Ok(new { Success = true, Message = "Conversation cleared successfully" });
            }
            else
            {
                _logger.LogWarning("⚠️ Attempted to clear non-existent conversation '{ConversationId}'", conversationId);
                return NotFound(new { Success = false, Message = "Conversation not found" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing conversation '{ConversationId}'", conversationId);
            return StatusCode(500, new { Success = false, Message = "Failed to clear conversation" });
        }
    }
}

public class StartConversationRequest
{
    public string? InitialMessage { get; set; }
}

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public string? ConversationId { get; set; }
    public string? UserId { get; set; }
    public Dictionary<string, object>? Context { get; set; }
    public List<ChatMessage>? History { get; set; }
    public ChatAttachment? Attachment { get; set; }
}

public class ChatAttachment
{
    public string Id { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FileType { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
}

public class ChatMessage
{
    public string Id { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class ChatResponse
{
    public string? ConversationId { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? Error { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public List<string>? ToolCalls { get; set; }  // List of tool names that were called
    public List<string>? EcosystemMessages { get; set; }  // User-friendly ecosystem call messages
    public ChatAction? Action { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
    
    // Threading support
    public string? ThreadId { get; set; }
    public string? ThreadTitle { get; set; }
    public string? ThreadIcon { get; set; }
    public bool IsThreadStart { get; set; }
    public List<ThreadSuggestionDto>? SuggestedThreads { get; set; }
}

public class ThreadSuggestionDto
{
    public string ThreadId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class ChatAction
{
    public string Type { get; set; } = string.Empty;
    public string ActionId { get; set; } = string.Empty;
    public string Prompt { get; set; } = string.Empty;
    public List<ActionOption>? Options { get; set; }
    public bool Pending { get; set; } = true;
}

public class ActionOption
{
    public string Label { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Variant { get; set; }
}

public class PendingActionDto
{
    public required string ActionId { get; set; }
    public required string FunctionName { get; set; }
    public required string PluginName { get; set; }
    public Dictionary<string, object?>? Arguments { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ConversationContextResponse
{
    public string? ConversationId { get; set; }
    public List<ContextMessage> Messages { get; set; } = new List<ContextMessage>();
    public int TotalMessages { get; set; }
    public bool Success { get; set; }
    public string? Error { get; set; }
    public DateTime Timestamp { get; set; }
}

public class ContextMessage
{
    public int Index { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}