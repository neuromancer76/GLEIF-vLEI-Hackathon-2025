using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;

namespace MyCustomMCPServer.Tools;

/// <summary>
/// Tool to initialize a new conversation topic thread.
/// </summary>
public class ConversationTopicTool
{
    // Static storage for thread metadata (in production, use a proper state management solution)
    private static readonly Dictionary<string, ConversationTopicMetadata> _threadMetadata = new();

    /// <summary>
    /// Creates a new conversation thread for the given topic name and returns its ID.
    /// </summary>
    [KernelFunction("create-conversation-topic")]
    [Description("Creates a new conversation thread for a specific topic when multiple topics are detected in the user's request. Call this function for each distinct topic before providing detailed responses.")]
    public Task<string> CreateConversationTopicAsync(
        [Description("The name/title of the topic to create a thread for (e.g., 'Office Stationery Supplies', 'IT Consulting Services')")] string topicName)
    {
        // Generate a unique thread ID for this topic
        var threadId = Guid.NewGuid().ToString();
        
        // Store metadata for later retrieval
        _threadMetadata[threadId] = new ConversationTopicMetadata
        {
            ThreadId = threadId,
            TopicName = topicName,
            CreatedAt = DateTime.UtcNow
        };
        
        return Task.FromResult(threadId);
    }

    /// <summary>
    /// Gets all thread metadata created during the current conversation.
    /// </summary>
    public static List<ConversationTopicMetadata> GetAllThreadMetadata()
    {
        return new List<ConversationTopicMetadata>(_threadMetadata.Values);
    }

    /// <summary>
    /// Gets thread metadata by thread ID.
    /// </summary>
    public static ConversationTopicMetadata? GetThreadMetadata(string threadId)
    {
        return _threadMetadata.TryGetValue(threadId, out var metadata) ? metadata : null;
    }

    /// <summary>
    /// Clears all thread metadata (useful for testing or conversation reset).
    /// </summary>
    public static void ClearThreadMetadata()
    {
        _threadMetadata.Clear();
    }
}

/// <summary>
/// Metadata about a conversation thread created by the LLM.
/// </summary>
public class ConversationTopicMetadata
{
    public string ThreadId { get; set; } = string.Empty;
    public string TopicName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}