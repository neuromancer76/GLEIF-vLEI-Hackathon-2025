# Approval Workflow Refactoring - No Task.Run

## Summary

Refactored the approval workflow to follow **Microsoft's official Semantic Kernel pattern** from the documentation, eliminating the use of `Task.Run` background tasks.

## Official Pattern Reference

Based on: [Task automation with agents - Requiring user consent](https://learn.microsoft.com/en-us/semantic-kernel/concepts/plugins/using-task-automation-functions#requiring-user-consent)

### Key Principles

1. **Set context.Result and return** - Don't call `await next(context)` if approval is needed
2. **Store function context** - Save the context for later execution
3. **Execute on confirmation** - When user confirms, invoke the function directly

## Architecture

### Before (with Task.Run)

```
Filter → Create PendingAction → Set placeholder result → Return
                ↓
        Task.Run (background):
            Wait for confirmation
            Execute function
            Store result
```

**Problems:**
- Background task runs outside HTTP request context
- Result doesn't flow back through AI conversation
- Frontend gets raw JSON instead of natural language

### After (Microsoft Pattern)

```
Filter → Check if confirmed execution?
    NO  → Create PendingAction → Store context → Set placeholder → Return (don't call next)
    YES → Execute normally (call next)

ConfirmAction Endpoint:
    Get PendingAction
    Mark in HttpContext as confirmed
    Invoke function directly with kernel.InvokeAsync()
    Return result to frontend
    
Frontend:
    Receive result
    Send to AI for natural language processing
    Display AI response
```

## Changes Made

### 1. AutoFunctionInvocationFilter.cs

**Old approach:**
```csharp
context.Result = new FunctionResult(context.Function, waitingMessage);

_ = Task.Run(async () => {
    var confirmed = await WaitForConfirmationAsync(...);
    if (confirmed) {
        await next(context);
    }
});
```

**New approach:**
```csharp
// Check if this is a confirmed execution
var isConfirmedExecution = _httpContextAccessor.HttpContext?.Items["ConfirmedActionId"]?.ToString();

if (!string.IsNullOrEmpty(isConfirmedExecution))
{
    // Confirmed - execute normally
    await next(context);
    return;
}

// Not confirmed - create pending action
var pendingAction = new PendingAction { 
    FunctionContext = context  // Store context!
};
_pendingActionService.AddPendingAction(actionId, pendingAction);

// Set placeholder and return WITHOUT calling next()
context.Result = new FunctionResult(context.Function, waitingMessage);
```

### 2. PendingAction Model

**Added:**
```csharp
public AutoFunctionInvocationContext? FunctionContext { get; set; }
```

**Removed:**
```csharp
public TaskCompletionSource<bool> CompletionSource { get; set; }
```

### 3. ChatController.cs ConfirmAction Endpoint

**Old approach:**
```csharp
pendingAction.CompletionSource.SetResult(true);  // Signal background task

// Poll and wait for ExecutionCompleted
while (...) {
    if (pendingAction.ExecutionCompleted) {
        return Ok(new { Result = pendingAction.ExecutionResult });
    }
    await Task.Delay(500);
}
```

**New approach:**
```csharp
// Get kernel from DI
var kernel = HttpContext.RequestServices.GetRequiredService<Kernel>();

// Mark as confirmed
HttpContext.Items["ConfirmedActionId"] = request.ActionId;

// Execute function directly using stored context
var result = await kernel.InvokeAsync(
    pendingAction.FunctionContext.Function,
    pendingAction.FunctionContext.Arguments
);

// Return result immediately
return Ok(new { Result = result.GetValue<object>() });
```

### 4. Frontend (Chatbot.tsx)

**Added:**
```typescript
// Send result back to AI for natural language processing
const systemMessage = `The tool execution completed with the following result: ${JSON.stringify(resultValue)}. Please provide a natural language summary of this information to the user.`;

const aiResponse = await SupplierApiService.sendChatMessage({
    message: systemMessage,
    conversationId: result.conversationId,
    ...
});
```

## Benefits

1. ✅ **No background tasks** - Everything executes synchronously within HTTP request context
2. ✅ **Follows Microsoft's pattern** - Uses official Semantic Kernel approval workflow
3. ✅ **AI processes results** - Frontend sends execution result back to AI for natural language
4. ✅ **Cleaner code** - No polling, no Task.Run, no TaskCompletionSource
5. ✅ **Better error handling** - Exceptions are caught and returned immediately

## How It Works

1. **User asks question** → "What applications are available?"

2. **AI wants to call tool** → Filter intercepts

3. **Filter creates pending action** → Stores function context, returns placeholder

4. **Frontend shows confirmation** → User clicks "Confirm"

5. **ConfirmAction endpoint** → Retrieves stored context, executes function directly

6. **Result returned** → Frontend receives raw JSON result

7. **Frontend sends to AI** → "Please summarize this result..."

8. **AI responds** → "I found 2 applications: Supplier Portal and Insurance Offers Portal."

9. **User sees natural language** → Instead of raw JSON

## Testing

1. Start backend: `dotnet run`
2. Start frontend: `npm run dev`
3. Ask: "What applications are available?"
4. Click "Confirm" button
5. **Expected:** AI says "I found 2 applications..." (natural language)
6. **Not:** Raw JSON `[{"applicationId":"..."}, ...]`

## References

- [Microsoft Docs: Task automation with agents](https://learn.microsoft.com/en-us/semantic-kernel/concepts/plugins/using-task-automation-functions#requiring-user-consent)
- [Microsoft Docs: What are Filters?](https://learn.microsoft.com/en-us/semantic-kernel/concepts/enterprise-readiness/filters)
- [GitHub: Function Invocation Filter Examples](https://github.com/microsoft/semantic-kernel/blob/main/dotnet/samples/Concepts/Filtering)
