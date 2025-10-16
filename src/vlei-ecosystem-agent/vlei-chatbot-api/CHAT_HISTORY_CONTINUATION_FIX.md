# Chat History Continuation Fix

## Problem

When the user confirmed a tool execution, the conversation context was being lost. The backend would either:
1. Start a new conversation (losing all chat history), OR
2. Return raw tool results that the frontend would send back as a "new" message

This caused the AI to lose the context of:
- The original user question
- The reasoning that led to the tool call
- The conversation flow

## Root Cause

The issue was architectural:
1. **Filter intercepts tool call** → Stores action, returns placeholder
2. **User confirms** → Confirm endpoint executes tool
3. **Tool result returned** → Frontend sends as NEW message to chat endpoint
4. **ChatService creates new conversation** → Because conversationId not found in in-memory dictionary

Even when conversationId was preserved, the chat history was being recreated from scratch.

## Solution

**Store and continue the chat history directly in the ConfirmAction endpoint.**

### Key Changes

#### 1. AutoFunctionInvocationFilter - Store Chat History

```csharp
var pendingAction = new PendingAction
{
    // ... other properties
    FunctionContext = context,
    ChatHistorySnapshot = context.ChatHistory  // ✅ Store the chat history!
};
```

The `AutoFunctionInvocationContext` has a `ChatHistory` property that contains the full conversation up to that point.

#### 2. PendingAction Model - Add ChatHistorySnapshot

```csharp
public class PendingAction
{
    // ... existing properties
    public AutoFunctionInvocationContext? FunctionContext { get; set; }
    
    // CRITICAL: Store the chat history snapshot
    public ChatHistory? ChatHistorySnapshot { get; set; }
}
```

#### 3. ConfirmAction Endpoint - Continue Conversation

**Before:**
```csharp
// Execute function
var result = await kernel.InvokeAsync(...);

// Return raw result
return Ok(new { Result = result });
```

**After:**
```csharp
// Execute function
var functionResult = await kernel.InvokeAsync(...);

// Add tool result to chat history
var chatHistory = pendingAction.ChatHistorySnapshot;
chatHistory.AddMessage(AuthorRole.Tool, JsonSerializer.Serialize(resultValue));

// Continue the conversation - AI processes the tool result
var aiResponse = await chatCompletion.GetStreamingChatMessageContentsAsync(
    chatHistory,
    new OpenAIPromptExecutionSettings { FunctionChoiceBehavior = FunctionChoiceBehavior.Auto() },
    kernel
);

// Add AI response to chat history
chatHistory.AddAssistantMessage(aiResponse);

// Return the AI's natural language response
return Ok(new { 
    Message = aiResponse,  // ✅ Natural language!
    FunctionResult = resultValue  // Raw result for reference
});
```

#### 4. Frontend - Display AI Response Directly

**Before:**
```typescript
// Get raw result
const result = await SupplierApiService.confirmAction({ actionId });

// Send result back to AI as new message
const aiResponse = await SupplierApiService.sendChatMessage({
    message: `Tool result: ${JSON.stringify(result.result)}...`,
    conversationId: result.conversationId
});

// Display AI response
setMessages(prev => [...prev, aiResponse]);
```

**After:**
```typescript
// Get result (already processed by AI)
const result = await SupplierApiService.confirmAction({ actionId });

// Display AI's message directly
if (result.message) {
    const aiMessage: ChatMessage = {
        role: 'assistant',
        content: result.message,  // ✅ Already natural language!
        timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMessage]);
}
```

## Flow Comparison

### Before (Broken)

```
1. User: "What applications are available?"
2. AI wants to call SearchApplications()
3. Filter: Create pending action, return placeholder
4. Frontend: Show confirmation button
5. User clicks "Confirm"
6. ConfirmAction: Execute function → return raw JSON
7. Frontend: Send JSON back as new message to /api/chat/message
8. ChatService: conversationId not found → START NEW CONVERSATION ❌
9. AI sees: "Tool result: [{...}]" with NO context about why
10. AI confused: "I don't understand, what would you like me to do with this data?"
```

### After (Fixed)

```
1. User: "What applications are available?"
2. AI wants to call SearchApplications()
3. Filter: Create pending action, store ChatHistory, return placeholder
4. Frontend: Show confirmation button
5. User clicks "Confirm"
6. ConfirmAction:
   - Execute function → get raw JSON
   - Retrieve stored ChatHistory (has full conversation!)
   - Add tool result to ChatHistory as Tool message
   - Continue conversation with AI
   - AI sees tool result IN CONTEXT ✅
   - AI generates: "I found 2 applications for you..."
   - Return AI's natural language response
7. Frontend: Display AI response directly
8. User sees: "I found 2 applications: Supplier Portal and Insurance Offers Portal."
```

## Benefits

1. ✅ **Context preserved** - AI has full conversation history
2. ✅ **Proper tool result flow** - Added as Tool message to ChatHistory
3. ✅ **Natural language responses** - AI processes results immediately
4. ✅ **No extra round-trip** - Single confirmation call gets AI response
5. ✅ **Follows Semantic Kernel pattern** - Tool results added to ChatHistory
6. ✅ **No frontend workaround** - Backend handles everything

## Key Insights

### AutoFunctionInvocationContext.ChatHistory

The `AutoFunctionInvocationContext` provides access to the **current chat history** at the moment the filter is invoked. This is a reference to the same `ChatHistory` object being used in the conversation, so any changes to it will persist.

### AuthorRole.Tool

When a tool (function) is executed, the result should be added to the chat history with `AuthorRole.Tool`, not as a user or system message. This tells the AI that this is the result of a function call it requested.

```csharp
chatHistory.AddMessage(AuthorRole.Tool, JsonSerializer.Serialize(resultValue));
```

### Continuing the Conversation

After adding the tool result, we call `GetStreamingChatMessageContentsAsync` again with the same `ChatHistory`. The AI sees:
1. Original user question
2. Its own decision to call a tool
3. The tool result
4. Can now provide a natural language summary

## Testing

1. Start backend: `dotnet run`
2. Start frontend: `npm run dev`
3. Ask: "What applications are available?"
4. Click "Confirm"
5. **Expected:** "I found 2 applications for you: Supplier Portal for companies looking for suppliers, and Insurance Offers Portal for managing insurance offers."
6. **Not:** Raw JSON or "I don't understand" responses

## References

- [AutoFunctionInvocationContext.ChatHistory](https://learn.microsoft.com/en-us/dotnet/api/microsoft.semantickernel.autofunctioninvocationcontext.chathistory)
- [Chat History - Simulating function calls](https://learn.microsoft.com/en-us/semantic-kernel/concepts/ai-services/chat-completion/chat-history#simulating-function-calls)
- [Function Calling](https://learn.microsoft.com/en-us/semantic-kernel/concepts/ai-services/chat-completion/function-calling/)
