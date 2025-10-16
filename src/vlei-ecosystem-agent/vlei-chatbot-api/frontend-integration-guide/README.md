# Frontend Integration Guide

This folder contains comprehensive documentation for integrating the VLEI Chatbot API confirmation workflow into your frontend application.

## 📚 Documentation Files

### 1. [COPILOT_INTEGRATION_PROMPT.md](./COPILOT_INTEGRATION_PROMPT.md)
**Use with VS Code Copilot to automatically integrate the workflow**

This is a detailed prompt you can share with GitHub Copilot or Claude to automatically adapt your existing frontend. It contains:
- Complete context about what changed in the backend
- UI/UX requirements matching VS Code Copilot style
- TypeScript type definitions
- State management guidance
- Implementation checklist
- Example patterns and best practices

**How to use:** Open this file in VS Code, select all content (Ctrl+A), and use it as context when asking Copilot to integrate the confirmation workflow.

---

### 2. [QUICK_START.md](./QUICK_START.md)
**Get up and running in under 30 minutes**

A fast-track guide for developers who want to integrate the confirmation workflow quickly. Includes:
- Step-by-step integration (6 steps, ~30 minutes)
- Minimum viable implementation (~15 lines of code)
- Troubleshooting common issues
- Testing instructions

**Best for:** Experienced developers who want to get something working fast.

---

### 3. [FRAMEWORK_EXAMPLES.md](./FRAMEWORK_EXAMPLES.md)
**Production-ready code for React, Vue, and Angular**

Complete, copy-paste-ready implementations including:
- **React + TypeScript**: Full implementation with hooks, components, and styles
- **Vue 3 + TypeScript**: Composition API with composables and components
- **Angular**: Service-based architecture with RxJS observables

Each example includes:
- Type definitions
- API service layer
- Main chat component
- Confirmation card component
- Message list component
- Complete CSS styling

**Best for:** Teams starting a new project or doing a major refactor.

---

## 🚀 Quick Navigation

### I want to...

**...integrate this into my existing React app**
1. Read [QUICK_START.md](./QUICK_START.md) for overview
2. Copy code from [FRAMEWORK_EXAMPLES.md](./FRAMEWORK_EXAMPLES.md) → React section
3. Adapt to your existing structure

**...have Copilot do it for me**
1. Open [COPILOT_INTEGRATION_PROMPT.md](./COPILOT_INTEGRATION_PROMPT.md)
2. Select all content (Ctrl+A)
3. Ask Copilot: "Using this context, integrate the confirmation workflow into my chat component"

**...understand how the backend works**
- See [../CONFIRMATION_WORKFLOW.md](../CONFIRMATION_WORKFLOW.md) for backend architecture

**...test the API manually**
- Use [../test-confirmation-workflow.http](../test-confirmation-workflow.http) with REST Client extension

**...see it in action (before coding)**
- Run backend: `dotnet run` in `vlei-chatbot-api` folder
- Use the `.http` file to simulate the flow
- See responses with `pendingActions` field

---

## 🎯 Integration Overview

### What Changed?

The backend API now implements a **confirmation workflow** similar to VS Code Copilot:

```
Before:
User → Message → AI → Tool Executes → Response

After:
User → Message → AI → Pause ⏸️ → Show Confirmation → User Approves → Tool Executes → Response
```

### What You Need to Do

1. **Update types** - Add `pendingActions?: PendingAction[]` to `ChatResponse`
2. **Add state** - Track pending and executing actions
3. **Update UI** - Show confirmation cards when `pendingActions` is present
4. **Add endpoints** - Call `/api/chat/action/confirm` and `/action/reject`
5. **Handle states** - Show loading indicator during execution

### API Changes

**New response field:**
```json
{
  "conversationId": "...",
  "message": "...",
  "pendingActions": [    ← NEW!
    {
      "actionId": "unique-guid",
      "functionName": "registry-application-list",
      "pluginName": "ApplicationRegistryAccessTool",
      "arguments": {},
      "description": "List all applications",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "success": true
}
```

**New endpoints:**
- `POST /api/chat/action/confirm` - Approve and execute action
- `POST /api/chat/action/reject` - Cancel action

---

## 📋 Implementation Checklist

Use this checklist as you integrate:

### Backend Setup
- [ ] Backend API running on `http://localhost:5184`
- [ ] Can successfully call `/api/chat/message` endpoint
- [ ] CORS configured for your frontend domain

### Frontend Changes
- [ ] Added `PendingAction` interface to types
- [ ] Updated `ChatResponse` interface with `pendingActions?` field
- [ ] Added state for `pendingActions` array
- [ ] Added state for `executingActions` set
- [ ] Updated message sending to check for pending actions
- [ ] Created `confirmAction(actionId)` function
- [ ] Created `rejectAction(actionId)` function
- [ ] Created UI component for confirmation cards
- [ ] Added loading state for executing actions
- [ ] Tested with actual tool call

### UI/UX
- [ ] Confirmation card displays function name
- [ ] Confirmation card displays plugin name
- [ ] Confirmation card shows description (if present)
- [ ] Arguments are viewable (expandable section)
- [ ] Allow/Deny buttons are clearly visible
- [ ] Loading indicator shows during execution
- [ ] Success message shows after confirmation
- [ ] Cancellation message shows after rejection
- [ ] Expired/processed actions show appropriate error

### Polish (Optional)
- [ ] Keyboard shortcuts (Enter/Esc)
- [ ] Sound/notification on pending action
- [ ] Responsive design for mobile
- [ ] Accessibility (ARIA labels, focus management)
- [ ] Timeout warning (before 5 minutes)
- [ ] "Confirm All" for multiple actions

---

## 🧪 Testing Your Integration

### Manual Test Flow

1. **Start Backend**
   ```bash
   cd vlei-chatbot-api
   dotnet run
   # Should listen on http://localhost:5184
   ```

2. **Start Frontend**
   ```bash
   npm start  # or your dev command
   ```

3. **Send Test Message**
   - Type: "List all applications from the registry"
   - Expected: Bot responds with pending action card

4. **Test Confirmation**
   - Click "Allow" button
   - Expected: Loading indicator → Success message → Results appear

5. **Test Rejection**
   - Send another message to trigger tool
   - Click "Deny" button
   - Expected: Cancellation message, no results

### Automated Testing

If you have unit tests, add tests for:

```typescript
describe('Confirmation Workflow', () => {
  it('should display pending action when returned from API', () => {
    // Mock API response with pendingActions
    // Verify confirmation card appears
  });

  it('should call confirm endpoint when Allow clicked', () => {
    // Mock fetch
    // Click Allow button
    // Verify POST to /action/confirm
  });

  it('should remove pending action after confirmation', () => {
    // Confirm action
    // Verify pending action removed from state
  });

  it('should show loading state during execution', () => {
    // Confirm action
    // Verify loading indicator visible
  });
});
```

---

## 🎨 UI/UX Best Practices

### Visual Hierarchy

```
Priority 1: Allow/Deny Buttons (Primary CTAs)
Priority 2: Function Name & Description (What will happen)
Priority 3: Plugin Name (Source of action)
Priority 4: Arguments (Details, collapsible)
Priority 5: Timestamp (Context)
```

### Color Scheme (Suggested)

- **Pending State**: Amber/Yellow (`#fbbf24`) - Warning, needs attention
- **Allow Button**: Green (`#10b981`) - Positive action
- **Deny Button**: Red (`#ef4444`) - Negative action  
- **Executing**: Blue (`#3b82f6`) - Processing
- **Success**: Green (`#10b981`) - Completed
- **Error**: Red (`#ef4444`) - Failed

### Accessibility

- Use semantic HTML (`<button>`, not `<div onclick>`)
- Add ARIA labels: `aria-label="Confirm action"`
- Ensure keyboard navigation works
- Provide focus indicators
- Support screen readers

---

## 🔧 Troubleshooting

### Common Issues

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| Pending actions not showing | Not checking `pendingActions` field | Add check: `if (data.pendingActions?.length)` |
| "Action not found" error | Timeout exceeded (>5 min) | Confirm faster or increase timeout |
| CORS error | Frontend domain not allowed | Add domain to `AllowReactApp` policy |
| Double confirmation | Clicking button twice | Disable button during execution |
| Actions not removing | Not filtering state array | Use: `filter(a => a.actionId !== id)` |

### Debug Checklist

1. ✅ Open browser DevTools → Network tab
2. ✅ Send message that triggers tool
3. ✅ Check response contains `pendingActions` array
4. ✅ Verify state updates with pending action
5. ✅ Click Allow → Check POST to `/action/confirm`
6. ✅ Verify 200 response from confirm endpoint
7. ✅ Check state updates (pending action removed)

---

## 📖 Additional Resources

### Backend Documentation
- [CONFIRMATION_WORKFLOW.md](../CONFIRMATION_WORKFLOW.md) - Backend architecture
- [test-confirmation-workflow.http](../test-confirmation-workflow.http) - API testing

### Related Files
- `Program.cs` - DI configuration and CORS setup
- `AutoFunctionInvocationFilter.cs` - Interception logic
- `PendingActionService.cs` - Action storage and management
- `ChatService.cs` - Chat orchestration
- `ChatController.cs` - REST endpoints

---

## 💡 Tips & Tricks

### Development
- Use the `.http` files to test backend before integrating frontend
- Start with minimum viable implementation, then enhance UI
- Console.log the `pendingActions` to understand the data structure
- Test timeout by waiting >5 minutes before confirming

### Production
- Add analytics tracking for confirm/reject rates
- Log action executions for audit trail
- Consider adding "Undo" feature for certain actions
- Implement rate limiting to prevent abuse
- Add action history/audit log in UI

### User Experience
- Auto-scroll to pending action cards
- Add subtle animation when card appears
- Use sound/vibration on mobile for attention
- Show "Time remaining" countdown near 5-minute mark
- Allow batching multiple actions (Confirm All)

---

## 🤝 Contributing

If you improve the integration or find better patterns:

1. Update the relevant markdown file
2. Add examples or screenshots
3. Update this README if adding new files
4. Share with the team!

---

## 📝 License

Same as parent project.

---

**Need Help?** 
- Check backend logs for API errors
- Review browser console for frontend errors
- Test backend directly with `.http` files
- Ask in team chat with error screenshots

**Happy Coding! 🚀**
