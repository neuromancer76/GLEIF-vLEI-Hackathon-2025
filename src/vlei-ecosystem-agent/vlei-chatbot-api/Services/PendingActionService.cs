using System.Collections.Concurrent;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;

namespace vlei_chatbot_api.Services;

public interface IPendingActionService
{
    void AddPendingAction(string actionId, PendingAction action);
    PendingAction? GetPendingAction(string actionId);
    bool RemovePendingAction(string actionId);
    IEnumerable<PendingAction> GetPendingActions(string conversationId);
}

public class PendingActionService : IPendingActionService
{
    private readonly ConcurrentDictionary<string, PendingAction> _pendingActions = new();

    public void AddPendingAction(string actionId, PendingAction action)
    {
        _pendingActions[actionId] = action;
    }

    public PendingAction? GetPendingAction(string actionId)
    {
        _pendingActions.TryGetValue(actionId, out var action);
        return action;
    }

    public bool RemovePendingAction(string actionId)
    {
        return _pendingActions.TryRemove(actionId, out _);
    }

    public IEnumerable<PendingAction> GetPendingActions(string conversationId)
    {
        return _pendingActions.Values.Where(a => a.ConversationId == conversationId);
    }
}

public class PendingAction
{
    public string ActionId { get; set; } = string.Empty;
    public string ConversationId { get; set; } = string.Empty;
    public string FunctionName { get; set; } = string.Empty;
    public string PluginName { get; set; } = string.Empty;
    public Dictionary<string, object?> Arguments { get; set; } = new();
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Store the function context for later execution
    public AutoFunctionInvocationContext? FunctionContext { get; set; }
    
    // Store the chat history snapshot at the time of interception
    // This allows us to continue the conversation from where it left off
    public ChatHistory? ChatHistorySnapshot { get; set; }
    
    // Track execution state and result
    public bool IsExecuting { get; set; } = false;
    public bool ExecutionCompleted { get; set; } = false;
    public object? ExecutionResult { get; set; } = null;
}