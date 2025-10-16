# Confirmation Workflow - VS Code Copilot Style

## Overview

The chatbot API now implements a confirmation workflow similar to VS Code Copilot, where every Semantic Kernel tool call requires user confirmation before execution. This ensures users maintain control over all actions performed by the AI agent.

## Architecture

### Components

1. **AutoFunctionInvocationFilter** - Intercepts all Semantic Kernel function calls
2. **PendingActionService** - Manages pending actions waiting for confirmation
3. **ChatService** - Orchestrates chat and returns pending actions
4. **ChatController** - Provides REST endpoints for confirmation/rejection

### Flow Diagram

```
User sends message
     ↓
ChatService processes with Semantic Kernel
     ↓
SK wants to invoke a tool (e.g., registry-application-list)
     ↓
AutoFunctionInvocationFilter intercepts
     ↓
Creates PendingAction with unique ActionId
     ↓
Stores in PendingActionService
     ↓
Adds to HttpContext.Items["PendingActions"]
     ↓
Waits on TaskCompletionSource<bool> (5-minute timeout)
     ↓
ChatService retrieves pending actions from HttpContext
     ↓
Returns ChatResponse with pending actions to frontend
     ↓
Frontend displays confirmation UI
     ↓
User clicks Confirm or Reject
     ↓
Frontend calls /api/chat/action/confirm or /api/chat/action/reject
     ↓
Controller calls CompletionSource.SetResult(true/false)
     ↓
Filter unblocks and either:
  - Executes tool if confirmed (true)
  - Skips tool if rejected (false)
     ↓
Returns final result to user
```

## API Endpoints

### 1. Start Conversation
```http
POST /api/chat/start
Content-Type: application/json

{
  "userId": "user123"
}
```

Response:
```json
{
  "conversationId": "guid-here",
  "message": "Hello! How can I assist you today?",
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Send Message
```http
POST /api/chat/message
Content-Type: application/json

{
  "conversationId": "guid-here",
  "message": "List all applications in the VLEI registry"
}
```

Response (with pending action):
```json
{
  "conversationId": "guid-here",
  "message": "I found a tool that can list all applications. Do you want me to proceed?",
  "pendingActions": [
    {
      "actionId": "action-guid-1",
      "functionName": "registry-application-list",
      "pluginName": "ApplicationRegistryAccessTool",
      "arguments": {},
      "description": "List all applications from VLEI Registry",
      "createdAt": "2024-01-15T10:30:01Z"
    }
  ],
  "success": true,
  "timestamp": "2024-01-15T10:30:01Z"
}
```

### 3. Confirm Action
```http
POST /api/chat/action/confirm
Content-Type: application/json

{
  "actionId": "action-guid-1",
  "reason": "User approved"
}
```

Response:
```json
{
  "success": true,
  "message": "Action confirmed"
}
```

### 4. Reject Action
```http
POST /api/chat/action/reject
Content-Type: application/json

{
  "actionId": "action-guid-1",
  "reason": "User declined"
}
```

Response:
```json
{
  "success": true,
  "message": "Action rejected"
}
```

## Frontend Integration

### React Example

```typescript
import React, { useState } from 'react';

interface PendingAction {
  actionId: string;
  functionName: string;
  pluginName: string;
  arguments?: Record<string, any>;
  description?: string;
  createdAt: string;
}

interface ChatResponse {
  conversationId: string;
  message: string;
  pendingActions?: PendingAction[];
  success: boolean;
  timestamp: string;
}

const ChatBot: React.FC = () => {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    const response = await fetch('http://localhost:5184/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId,
        message: input
      })
    });

    const data: ChatResponse = await response.json();
    
    setConversationId(data.conversationId);
    setMessages([...messages, `Bot: ${data.message}`]);
    
    if (data.pendingActions && data.pendingActions.length > 0) {
      setPendingActions(data.pendingActions);
    }
    
    setInput('');
  };

  const confirmAction = async (actionId: string) => {
    const response = await fetch('http://localhost:5184/api/chat/action/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId })
    });

    if (response.ok) {
      setPendingActions(pendingActions.filter(a => a.actionId !== actionId));
      setMessages([...messages, 'Action confirmed and executed.']);
    }
  };

  const rejectAction = async (actionId: string) => {
    const response = await fetch('http://localhost:5184/api/chat/action/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId })
    });

    if (response.ok) {
      setPendingActions(pendingActions.filter(a => a.actionId !== actionId));
      setMessages([...messages, 'Action rejected.']);
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg, idx) => <div key={idx}>{msg}</div>)}
      </div>

      {pendingActions.length > 0 && (
        <div className="pending-actions">
          <h3>Pending Actions</h3>
          {pendingActions.map(action => (
            <div key={action.actionId} className="action-card">
              <p><strong>Function:</strong> {action.functionName}</p>
              <p><strong>Plugin:</strong> {action.pluginName}</p>
              {action.description && <p>{action.description}</p>}
              {action.arguments && (
                <pre>{JSON.stringify(action.arguments, null, 2)}</pre>
              )}
              <button onClick={() => confirmAction(action.actionId)}>
                ✓ Confirm
              </button>
              <button onClick={() => rejectAction(action.actionId)}>
                ✗ Reject
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="input-area">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatBot;
```

## Configuration

### Timeout Settings

The default timeout for user confirmation is **5 minutes**. You can adjust this in `AutoFunctionInvocationFilter.cs`:

```csharp
private async Task<bool> WaitForConfirmationAsync(PendingAction pendingAction)
{
    // Change timeout here (currently 5 minutes)
    var timeout = TimeSpan.FromMinutes(5);
    
    // ... rest of implementation
}
```

### Appsettings Configuration

Make sure your `appsettings.json` contains:

```json
{
  "AzureOpenAI": {
    "Endpoint": "https://your-endpoint.openai.azure.com/",
    "DeploymentName": "gpt-4",
    "ApiKey": "your-api-key"
  },
  "VleiRegistry": {
    "BaseUrl": "http://localhost:5136"
  },
  "SupplierPortal": {
    "BaseUrl": "http://localhost:5178"
  },
  "PromptConfiguration": {
    "Path": "ConfigurationPrompt"
  }
}
```

## Testing

### Manual Testing with HTTP Client

You can use the provided `test-chat.http` file to test the endpoints:

```http
### Start conversation
POST http://localhost:5184/api/chat/start
Content-Type: application/json

{
  "userId": "test-user"
}

### Send message that triggers tool
POST http://localhost:5184/api/chat/message
Content-Type: application/json

{
  "conversationId": "{{conversationId}}",
  "message": "List all applications"
}

### Confirm action
POST http://localhost:5184/api/chat/action/confirm
Content-Type: application/json

{
  "actionId": "{{actionId}}"
}

### Reject action
POST http://localhost:5184/api/chat/action/reject
Content-Type: application/json

{
  "actionId": "{{actionId}}"
}
```

## Troubleshooting

### Action not found
- **Cause**: ActionId expired or already processed
- **Solution**: Check timeout settings and ensure frontend calls confirm/reject within timeout

### Filter not intercepting
- **Cause**: AutoFunctionInvocationFilter not registered properly
- **Solution**: Verify Program.cs has proper registration with dependencies

### Context lost between requests
- **Cause**: HttpContext not accessible in filter
- **Solution**: Ensure IHttpContextAccessor is registered and injected

### Pending actions not returned
- **Cause**: HttpContext.Items not shared properly
- **Solution**: Verify conversationId is stored and retrieved correctly

## Security Considerations

1. **Action Expiration**: Actions expire after 5 minutes to prevent stale confirmations
2. **Single Use**: Each action can only be confirmed/rejected once
3. **Thread Safety**: PendingActionService uses ConcurrentDictionary for thread-safe operations
4. **Authorization**: Add authentication/authorization middleware as needed for production

## Next Steps

1. Add authentication/authorization to endpoints
2. Implement action expiration notification to frontend
3. Add audit logging for all confirmations/rejections
4. Implement action queuing for multiple pending actions
5. Add unit tests for confirmation workflow
