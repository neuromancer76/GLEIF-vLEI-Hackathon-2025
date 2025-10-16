# VS Code Copilot Integration Prompt - Confirmation Workflow

## Context for Copilot

I have a chatbot frontend (React/Vue/Angular) that currently calls a backend API at `http://localhost:5184/api/chat`. The backend has been updated to implement a **VS Code Copilot-style confirmation workflow** where all AI tool executions require user approval before proceeding.

## What Changed in the Backend API

### Before (Old Response)
```json
POST /api/chat/message
Response:
{
  "conversationId": "guid",
  "message": "Here are the applications...",
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### After (New Response with Pending Actions)
```json
POST /api/chat/message
Response:
{
  "conversationId": "guid",
  "message": "I need to call the registry-application-list function. Do you approve?",
  "pendingActions": [
    {
      "actionId": "unique-guid",
      "functionName": "registry-application-list",
      "pluginName": "ApplicationRegistryAccessTool",
      "arguments": {},
      "description": "List all applications from VLEI Registry",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## What I Need You to Do

Please update my frontend application to:

1. **Handle the new `pendingActions` field** in the chat response
2. **Display a confirmation UI** (similar to VS Code Copilot) when pending actions are present
3. **Call the new confirmation endpoints** when user approves/rejects
4. **Show a loading/waiting state** while the action executes after confirmation
5. **Display the final results** after the action completes

## New API Endpoints to Integrate

### Confirm Action
```http
POST /api/chat/action/confirm
Content-Type: application/json

{
  "actionId": "unique-guid",
  "reason": "User approved"  // optional
}

Response:
{
  "success": true,
  "message": "Action confirmed"
}
```

### Reject Action
```http
POST /api/chat/action/reject
Content-Type: application/json

{
  "actionId": "unique-guid",
  "reason": "User declined"  // optional
}

Response:
{
  "success": true,
  "message": "Action rejected"
}
```

## UI/UX Requirements - VS Code Copilot Style

### 1. Confirmation Card Design
When `pendingActions` array is not empty, display a confirmation card for each action:

```
┌─────────────────────────────────────────────────────┐
│ 🤖 Agent wants to perform an action                │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Function: registry-application-list                │
│ Plugin: ApplicationRegistryAccessTool              │
│                                                     │
│ Description:                                        │
│ List all applications from VLEI Registry           │
│                                                     │
│ Arguments:                                          │
│ (none)                                             │
│                                                     │
│ [✓ Allow]  [✗ Deny]  [📋 View Details]            │
└─────────────────────────────────────────────────────┘
```

### 2. Visual States

- **Pending State**: Show yellow/amber indicator, action card visible
- **Confirming State**: Show loading spinner, "Executing..." message
- **Completed State**: Hide action card, show result in chat
- **Rejected State**: Hide action card, show "Action cancelled" message

### 3. User Flow

```
User sends message
     ↓
Bot responds with pending action
     ↓
Show confirmation card with "Allow" and "Deny" buttons
     ↓
User clicks "Allow"
     ↓
Call POST /api/chat/action/confirm
     ↓
Show loading indicator "Executing..."
     ↓
Backend executes tool and returns result
     ↓
Display final result in chat
```

## TypeScript Types to Add

```typescript
// Add to your existing types file
export interface PendingAction {
  actionId: string;
  functionName: string;
  pluginName: string;
  arguments?: Record<string, any>;
  description?: string;
  createdAt: string;
}

export interface ChatResponse {
  conversationId: string;
  message: string;
  pendingActions?: PendingAction[];  // NEW FIELD
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface ActionConfirmRequest {
  actionId: string;
  reason?: string;
}
```

## State Management Requirements

Add to your component/store state:

```typescript
const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());
```

## Implementation Checklist

Please implement the following changes:

- [ ] Update the `ChatResponse` interface to include `pendingActions?: PendingAction[]`
- [ ] Add `PendingAction` and `ActionConfirmRequest` type definitions
- [ ] Update the message sending logic to check for `pendingActions` in response
- [ ] Create a `ConfirmationCard` component to display pending actions
- [ ] Implement `confirmAction(actionId)` function that calls `/api/chat/action/confirm`
- [ ] Implement `rejectAction(actionId)` function that calls `/api/chat/action/reject`
- [ ] Add state management for pending and executing actions
- [ ] Show loading indicator while action is executing after confirmation
- [ ] Handle timeout (actions expire after 5 minutes)
- [ ] Add error handling for already processed/expired actions
- [ ] Update the chat UI to show confirmation cards inline with messages
- [ ] Add visual indicators (icons, colors) for pending/executing/completed states
- [ ] Implement "View Details" expandable section for action arguments (if present)

## Example React Implementation Pattern

```typescript
// In your chat component
const sendMessage = async (message: string) => {
  const response = await fetch('http://localhost:5184/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, message })
  });

  const data: ChatResponse = await response.json();
  
  // Add bot message to chat
  addMessage({ role: 'assistant', content: data.message });
  
  // NEW: Check for pending actions
  if (data.pendingActions && data.pendingActions.length > 0) {
    setPendingActions(data.pendingActions);
  }
};

const confirmAction = async (actionId: string) => {
  // Show loading state
  setExecutingActions(prev => new Set(prev).add(actionId));
  
  try {
    const response = await fetch('http://localhost:5184/api/chat/action/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId })
    });

    if (response.ok) {
      // Remove from pending
      setPendingActions(prev => prev.filter(a => a.actionId !== actionId));
      
      // Add confirmation message
      addMessage({ 
        role: 'system', 
        content: '✓ Action confirmed. Executing...' 
      });
      
      // The backend will execute and results will appear in next message
    } else {
      const error = await response.json();
      addMessage({ 
        role: 'system', 
        content: `✗ Failed to confirm: ${error.error}` 
      });
    }
  } finally {
    setExecutingActions(prev => {
      const next = new Set(prev);
      next.delete(actionId);
      return next;
    });
  }
};

const rejectAction = async (actionId: string) => {
  const response = await fetch('http://localhost:5184/api/chat/action/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionId })
  });

  if (response.ok) {
    setPendingActions(prev => prev.filter(a => a.actionId !== actionId));
    addMessage({ 
      role: 'system', 
      content: '✗ Action cancelled by user' 
    });
  }
};
```

## Component Structure Suggestion

```typescript
// ConfirmationCard.tsx
interface ConfirmationCardProps {
  action: PendingAction;
  onConfirm: (actionId: string) => void;
  onReject: (actionId: string) => void;
  isExecuting: boolean;
}

const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  action,
  onConfirm,
  onReject,
  isExecuting
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="confirmation-card">
      <div className="card-header">
        <span className="icon">🤖</span>
        <span className="title">Agent wants to perform an action</span>
      </div>
      
      <div className="card-body">
        <div className="field">
          <strong>Function:</strong> {action.functionName}
        </div>
        <div className="field">
          <strong>Plugin:</strong> {action.pluginName}
        </div>
        
        {action.description && (
          <div className="field description">
            {action.description}
          </div>
        )}
        
        {action.arguments && Object.keys(action.arguments).length > 0 && (
          <div className="field">
            <button onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? '▼' : '▶'} View Arguments
            </button>
            {showDetails && (
              <pre className="arguments">
                {JSON.stringify(action.arguments, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
      
      <div className="card-actions">
        {isExecuting ? (
          <div className="executing">
            <span className="spinner">⏳</span> Executing...
          </div>
        ) : (
          <>
            <button 
              className="btn-confirm" 
              onClick={() => onConfirm(action.actionId)}
            >
              ✓ Allow
            </button>
            <button 
              className="btn-reject" 
              onClick={() => onReject(action.actionId)}
            >
              ✗ Deny
            </button>
          </>
        )}
      </div>
      
      <div className="card-footer">
        <small>Created: {new Date(action.createdAt).toLocaleTimeString()}</small>
      </div>
    </div>
  );
};
```

## Styling Suggestions (CSS)

```css
.confirmation-card {
  border: 2px solid #fbbf24; /* amber border */
  border-radius: 8px;
  padding: 16px;
  margin: 12px 0;
  background: #fffbeb; /* light amber background */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.confirmation-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  color: #92400e;
}

.confirmation-card .icon {
  font-size: 20px;
}

.confirmation-card .card-body {
  margin-bottom: 16px;
}

.confirmation-card .field {
  margin-bottom: 8px;
}

.confirmation-card .field strong {
  color: #78350f;
  margin-right: 8px;
}

.confirmation-card .description {
  padding: 8px;
  background: white;
  border-radius: 4px;
  margin-top: 8px;
}

.confirmation-card .arguments {
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 4px;
  margin-top: 8px;
  overflow-x: auto;
  font-size: 12px;
}

.confirmation-card .card-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.confirmation-card .btn-confirm {
  flex: 1;
  padding: 10px 16px;
  background: #10b981; /* green */
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.confirmation-card .btn-confirm:hover {
  background: #059669;
}

.confirmation-card .btn-reject {
  flex: 1;
  padding: 10px 16px;
  background: #ef4444; /* red */
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.confirmation-card .btn-reject:hover {
  background: #dc2626;
}

.confirmation-card .executing {
  width: 100%;
  padding: 10px;
  text-align: center;
  background: #3b82f6;
  color: white;
  border-radius: 6px;
  font-weight: 600;
}

.confirmation-card .spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.confirmation-card .card-footer {
  color: #78350f;
  font-size: 12px;
  text-align: right;
}
```

## Testing Scenarios

After implementation, please test:

1. **Simple Tool Call**: Send "List all applications" → See confirmation card → Click Allow → See results
2. **Multiple Actions**: Send message that triggers 2+ tools → See multiple confirmation cards
3. **Rejection Flow**: Send message → Click Deny → See cancellation message
4. **Timeout Handling**: Send message → Wait 5+ minutes → Try to confirm → See error
5. **Already Processed**: Send message → Click Allow → Try to click Allow again → See error
6. **Network Error**: Disconnect network → Try to confirm → See appropriate error message

## Success Criteria

The integration is complete when:

- ✅ All tool executions show confirmation UI before executing
- ✅ User can approve or deny each action
- ✅ Visual feedback is clear during each state (pending/executing/completed)
- ✅ Multiple pending actions are handled gracefully
- ✅ Errors are displayed in a user-friendly way
- ✅ The UI feels similar to VS Code Copilot confirmation experience
- ✅ No regression in existing chat functionality

## Additional Notes

- The backend will hold the tool execution and wait up to **5 minutes** for confirmation
- After confirmation, the tool executes on the backend and results appear automatically
- Each action can only be confirmed or rejected **once**
- The `arguments` field may be empty (`{}`) if the function takes no parameters
- Consider adding keyboard shortcuts (Enter = Confirm, Esc = Reject) for power users

## Questions to Consider

As you implement, consider:

1. Should pending actions persist across page refreshes? (Currently they don't)
2. Should there be a "Confirm All" button for multiple pending actions?
3. Should action cards be dismissible without confirming/rejecting?
4. Should there be sound/notification when pending action appears?
5. Should expired actions show a different visual state before removal?

## Getting Started

Start by:

1. Updating your TypeScript interfaces
2. Creating the `ConfirmationCard` component
3. Updating the message sending logic to handle `pendingActions`
4. Testing with a simple tool call
5. Refining the UI based on the experience

Good luck! Let me know if you need help with specific parts of the implementation.
