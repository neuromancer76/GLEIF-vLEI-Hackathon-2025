# Quick Start Guide - Frontend Integration

This guide will help you integrate the confirmation workflow into your existing frontend in **under 30 minutes**.

## Prerequisites

- ✅ Backend API running on `http://localhost:5184`
- ✅ Existing frontend with chat functionality
- ✅ TypeScript support (recommended)

## Step-by-Step Integration

### Step 1: Update Your Types (5 minutes)

Add or update these interfaces in your types file:

```typescript
// Add to your existing chat types
export interface PendingAction {
  actionId: string;
  functionName: string;
  pluginName: string;
  arguments?: Record<string, any>;
  description?: string;
  createdAt: string;
}

// Update your ChatResponse interface
export interface ChatResponse {
  conversationId: string;
  message: string;
  pendingActions?: PendingAction[];  // ← ADD THIS
  success: boolean;
  error?: string;
  timestamp: string;
}
```

### Step 2: Add State for Pending Actions (3 minutes)

In your chat component, add:

```typescript
const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());
```

Or for Vue:
```typescript
const pendingActions = ref<PendingAction[]>([]);
const executingActions = ref<Set<string>>(new Set());
```

### Step 3: Update Message Sending Logic (5 minutes)

Find your existing message sending function and add pending action handling:

**Before:**
```typescript
const sendMessage = async (text: string) => {
  const response = await fetch('/api/chat/message', {
    method: 'POST',
    body: JSON.stringify({ conversationId, message: text })
  });
  
  const data = await response.json();
  addMessage(data.message);  // ← Old way
};
```

**After:**
```typescript
const sendMessage = async (text: string) => {
  const response = await fetch('http://localhost:5184/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, message: text })
  });
  
  const data = await response.json();
  addMessage(data.message);
  
  // ← ADD THIS
  if (data.pendingActions && data.pendingActions.length > 0) {
    setPendingActions(prev => [...prev, ...data.pendingActions]);
  }
};
```

### Step 4: Create API Functions for Confirm/Reject (5 minutes)

Add these two functions to your component or API service:

```typescript
const confirmAction = async (actionId: string) => {
  // Show executing state
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
      addMessage('✓ Action confirmed and executed');
    } else {
      const error = await response.json();
      addMessage(`✗ Error: ${error.error}`);
    }
  } finally {
    // Remove executing state
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
    addMessage('✗ Action cancelled by user');
  }
};
```

### Step 5: Create Simple Confirmation UI (10 minutes)

Add this to your chat UI, after your messages:

```tsx
{/* Add after your message list */}
{pendingActions.length > 0 && (
  <div style={{
    margin: '16px 0',
    padding: '16px',
    background: '#fffbeb',
    border: '2px solid #fbbf24',
    borderRadius: '8px'
  }}>
    <h3>⚠️ Pending Actions</h3>
    
    {pendingActions.map(action => (
      <div key={action.actionId} style={{
        background: 'white',
        padding: '12px',
        marginTop: '12px',
        borderRadius: '6px',
        border: '1px solid #fbbf24'
      }}>
        <p><strong>Function:</strong> {action.functionName}</p>
        <p><strong>Plugin:</strong> {action.pluginName}</p>
        {action.description && <p>{action.description}</p>}
        
        {executingActions.has(action.actionId) ? (
          <p style={{ color: '#3b82f6' }}>⏳ Executing...</p>
        ) : (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={() => confirmAction(action.actionId)}
              style={{
                flex: 1,
                padding: '10px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ✓ Allow
            </button>
            <button
              onClick={() => rejectAction(action.actionId)}
              style={{
                flex: 1,
                padding: '10px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ✗ Deny
            </button>
          </div>
        )}
      </div>
    ))}
  </div>
)}
```

### Step 6: Test It! (2 minutes)

1. Start your backend: `dotnet run` in `vlei-chatbot-api` folder
2. Start your frontend: `npm start` (or your dev command)
3. Send a message like: **"List all applications from the registry"**
4. You should see a confirmation card appear
5. Click "Allow" and see the action execute
6. Try clicking "Deny" on another action

---

## Minimum Viable Implementation

If you're in a hurry, here's the absolute minimum code to add:

```typescript
// 1. Add to state
const [pendingActions, setPendingActions] = useState([]);

// 2. Update sendMessage
const data = await response.json();
if (data.pendingActions?.length) setPendingActions(data.pendingActions);

// 3. Add confirm function
const confirm = async (id) => {
  await fetch('/api/chat/action/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionId: id })
  });
  setPendingActions(p => p.filter(a => a.actionId !== id));
};

// 4. Add UI
{pendingActions.map(a => (
  <div key={a.actionId}>
    <p>{a.functionName}</p>
    <button onClick={() => confirm(a.actionId)}>Allow</button>
  </div>
))}
```

That's it! This gives you basic confirmation workflow in ~15 lines of code.

---

## Troubleshooting

### "Pending actions not showing"
- ✅ Check that `data.pendingActions` is being logged
- ✅ Verify API is running on correct port (5184)
- ✅ Check CORS settings allow your frontend domain

### "Action not found when confirming"
- ✅ Ensure you're using the correct `actionId` from the response
- ✅ Check if more than 5 minutes passed (actions expire)
- ✅ Verify you're not trying to confirm twice

### "CORS error"
- ✅ Backend has CORS enabled for your frontend URL
- ✅ Check `Program.cs` in backend for CORS configuration
- ✅ Add your frontend URL to `AllowReactApp` policy

---

## Next Steps

Once basic integration works:

1. ✨ Improve UI styling (see `FRAMEWORK_EXAMPLES.md` for polished components)
2. ⌨️ Add keyboard shortcuts (Enter = Confirm, Esc = Reject)
3. 🔔 Add sound/notification when pending action appears
4. 📱 Make it responsive for mobile
5. ♿ Add accessibility (ARIA labels, focus management)
6. 🧪 Add unit tests for confirm/reject functions

---

## Full Example Integration

For complete, production-ready implementations with all features:

- **React**: See `FRAMEWORK_EXAMPLES.md` → React section
- **Vue**: See `FRAMEWORK_EXAMPLES.md` → Vue section  
- **Angular**: See `FRAMEWORK_EXAMPLES.md` → Angular section

---

## Support

If you get stuck:

1. Check backend logs for errors
2. Check browser console for network errors
3. Use `test-confirmation-workflow.http` to verify backend works
4. Review `CONFIRMATION_WORKFLOW.md` for API documentation

Happy coding! 🚀
