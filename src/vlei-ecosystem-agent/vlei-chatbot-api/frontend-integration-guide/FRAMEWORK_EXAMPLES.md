# Framework-Specific Implementation Examples

This document provides ready-to-use code snippets for implementing the confirmation workflow in different frontend frameworks.

---

## React + TypeScript Implementation

### Types (types/chat.ts)

```typescript
export interface PendingAction {
  actionId: string;
  functionName: string;
  pluginName: string;
  arguments?: Record<string, any>;
  description?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  conversationId: string;
  message: string;
  pendingActions?: PendingAction[];
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface ActionConfirmRequest {
  actionId: string;
  reason?: string;
}
```

### API Service (services/chatApi.ts)

```typescript
const API_BASE_URL = 'http://localhost:5184/api/chat';

export class ChatApiService {
  static async startConversation(userId: string): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to start conversation');
    }
    
    return response.json();
  }

  static async sendMessage(
    conversationId: string, 
    message: string
  ): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, message })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return response.json();
  }

  static async confirmAction(actionId: string, reason?: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/action/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId, reason })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to confirm action');
    }
  }

  static async rejectAction(actionId: string, reason?: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/action/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionId, reason })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject action');
    }
  }
}
```

### Main Chat Component (components/ChatBot.tsx)

```typescript
import React, { useState, useEffect } from 'react';
import { ChatApiService } from '../services/chatApi';
import { ChatMessage, PendingAction } from '../types/chat';
import { ConfirmationCard } from './ConfirmationCard';
import { MessageList } from './MessageList';

export const ChatBot: React.FC = () => {
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Start conversation on mount
    const initConversation = async () => {
      try {
        const response = await ChatApiService.startConversation('user-123');
        setConversationId(response.conversationId);
        
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Failed to start conversation:', error);
      }
    };

    initConversation();
  }, []);

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await ChatApiService.sendMessage(conversationId, input);
      
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(response.timestamp)
      });

      // Handle pending actions
      if (response.pendingActions && response.pendingActions.length > 0) {
        setPendingActions(prev => [...prev, ...response.pendingActions]);
      }
    } catch (error) {
      addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (actionId: string) => {
    setExecutingActions(prev => new Set(prev).add(actionId));

    try {
      await ChatApiService.confirmAction(actionId, 'User approved');
      
      // Remove from pending
      setPendingActions(prev => prev.filter(a => a.actionId !== actionId));
      
      addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: '✓ Action confirmed and executed successfully',
        timestamp: new Date()
      });
    } catch (error) {
      addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: `✗ Failed to confirm action: ${error.message}`,
        timestamp: new Date()
      });
    } finally {
      setExecutingActions(prev => {
        const next = new Set(prev);
        next.delete(actionId);
        return next;
      });
    }
  };

  const handleReject = async (actionId: string) => {
    try {
      await ChatApiService.rejectAction(actionId, 'User declined');
      
      setPendingActions(prev => prev.filter(a => a.actionId !== actionId));
      
      addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: '✗ Action cancelled by user',
        timestamp: new Date()
      });
    } catch (error) {
      addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: `✗ Failed to reject action: ${error.message}`,
        timestamp: new Date()
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chat-header">
        <h2>VLEI Ecosystem Agent</h2>
      </div>

      <div className="chat-messages">
        <MessageList messages={messages} />

        {/* Pending Actions */}
        {pendingActions.length > 0 && (
          <div className="pending-actions-section">
            <h3>Pending Actions ({pendingActions.length})</h3>
            {pendingActions.map(action => (
              <ConfirmationCard
                key={action.actionId}
                action={action}
                onConfirm={handleConfirm}
                onReject={handleReject}
                isExecuting={executingActions.has(action.actionId)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="chat-input">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
          rows={3}
        />
        <button 
          onClick={sendMessage} 
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? '⏳ Sending...' : '📤 Send'}
        </button>
      </div>
    </div>
  );
};
```

### Confirmation Card Component (components/ConfirmationCard.tsx)

```typescript
import React, { useState } from 'react';
import { PendingAction } from '../types/chat';

interface ConfirmationCardProps {
  action: PendingAction;
  onConfirm: (actionId: string) => void;
  onReject: (actionId: string) => void;
  isExecuting: boolean;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  action,
  onConfirm,
  onReject,
  isExecuting
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const hasArguments = action.arguments && Object.keys(action.arguments).length > 0;

  return (
    <div className="confirmation-card">
      <div className="card-header">
        <span className="icon">🤖</span>
        <span className="title">Agent wants to perform an action</span>
      </div>

      <div className="card-body">
        <div className="field">
          <strong>Function:</strong>
          <code>{action.functionName}</code>
        </div>
        
        <div className="field">
          <strong>Plugin:</strong>
          <code>{action.pluginName}</code>
        </div>

        {action.description && (
          <div className="field description">
            <strong>Description:</strong>
            <p>{action.description}</p>
          </div>
        )}

        {hasArguments && (
          <div className="field">
            <button 
              className="btn-details" 
              onClick={() => setShowDetails(!showDetails)}
            >
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
            <span className="spinner">⏳</span>
            <span>Executing action...</span>
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
        <small>
          Created at: {new Date(action.createdAt).toLocaleTimeString()}
        </small>
      </div>
    </div>
  );
};
```

### Message List Component (components/MessageList.tsx)

```typescript
import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';

interface MessageListProps {
  messages: ChatMessage[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map(message => (
        <div 
          key={message.id} 
          className={`message message-${message.role}`}
        >
          <div className="message-header">
            <span className="role-icon">
              {message.role === 'user' ? '👤' : message.role === 'assistant' ? '🤖' : 'ℹ️'}
            </span>
            <span className="role-name">
              {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Agent' : 'System'}
            </span>
            <span className="timestamp">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <div className="message-content">
            {message.content}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
```

### Styles (styles/chatbot.css)

```css
.chatbot-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background: #f9fafb;
}

.chat-header {
  padding: 20px;
  background: #1f2937;
  color: white;
  text-align: center;
}

.chat-header h2 {
  margin: 0;
  font-size: 24px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: white;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  padding: 12px 16px;
  border-radius: 8px;
  max-width: 80%;
}

.message-user {
  align-self: flex-end;
  background: #3b82f6;
  color: white;
}

.message-assistant {
  align-self: flex-start;
  background: #e5e7eb;
  color: #1f2937;
}

.message-system {
  align-self: center;
  background: #fef3c7;
  color: #78350f;
  border: 1px solid #fbbf24;
  font-style: italic;
  max-width: 90%;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  opacity: 0.8;
}

.role-icon {
  font-size: 16px;
}

.role-name {
  font-weight: 600;
}

.timestamp {
  margin-left: auto;
  font-size: 11px;
}

.message-content {
  line-height: 1.5;
  white-space: pre-wrap;
}

.pending-actions-section {
  margin-top: 20px;
  padding: 16px;
  background: #fffbeb;
  border-radius: 8px;
  border: 2px solid #fbbf24;
}

.pending-actions-section h3 {
  margin: 0 0 16px 0;
  color: #92400e;
  font-size: 16px;
}

.confirmation-card {
  border: 2px solid #fbbf24;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.confirmation-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #fbbf24;
}

.confirmation-card .icon {
  font-size: 20px;
}

.confirmation-card .title {
  font-weight: 600;
  color: #92400e;
}

.confirmation-card .card-body {
  margin-bottom: 16px;
}

.confirmation-card .field {
  margin-bottom: 12px;
}

.confirmation-card .field strong {
  color: #78350f;
  margin-right: 8px;
  display: inline-block;
  min-width: 100px;
}

.confirmation-card .field code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.confirmation-card .description {
  padding: 12px;
  background: #f9fafb;
  border-radius: 4px;
  border-left: 3px solid #fbbf24;
}

.confirmation-card .description p {
  margin: 4px 0 0 0;
}

.confirmation-card .btn-details {
  background: transparent;
  border: 1px solid #d1d5db;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #6b7280;
  transition: all 0.2s;
}

.confirmation-card .btn-details:hover {
  background: #f3f4f6;
  color: #374151;
}

.confirmation-card .arguments {
  background: #1e293b;
  color: #e2e8f0;
  padding: 12px;
  border-radius: 4px;
  margin-top: 8px;
  overflow-x: auto;
  font-size: 12px;
  font-family: 'Courier New', monospace;
}

.confirmation-card .card-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.confirmation-card .btn-confirm {
  flex: 1;
  padding: 12px 20px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.confirmation-card .btn-confirm:hover {
  background: #059669;
}

.confirmation-card .btn-reject {
  flex: 1;
  padding: 12px 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.confirmation-card .btn-reject:hover {
  background: #dc2626;
}

.confirmation-card .executing {
  width: 100%;
  padding: 12px;
  text-align: center;
  background: #3b82f6;
  color: white;
  border-radius: 6px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
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
  border-top: 1px solid #fde68a;
  padding-top: 8px;
}

.chat-input {
  padding: 20px;
  background: #f3f4f6;
  border-top: 1px solid #d1d5db;
  display: flex;
  gap: 12px;
}

.chat-input textarea {
  flex: 1;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  resize: none;
  outline: none;
}

.chat-input textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.chat-input textarea:disabled {
  background: #e5e7eb;
  cursor: not-allowed;
}

.chat-input button {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.chat-input button:hover:not(:disabled) {
  background: #2563eb;
}

.chat-input button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
```

---

## Vue 3 + TypeScript Implementation

### Composable (composables/useChat.ts)

```typescript
import { ref, Ref } from 'vue';
import { ChatApiService } from '../services/chatApi';
import type { ChatMessage, PendingAction } from '../types/chat';

export function useChat() {
  const conversationId: Ref<string> = ref('');
  const messages: Ref<ChatMessage[]> = ref([]);
  const pendingActions: Ref<PendingAction[]> = ref([]);
  const executingActions: Ref<Set<string>> = ref(new Set());
  const isLoading: Ref<boolean> = ref(false);

  const initConversation = async () => {
    try {
      const response = await ChatApiService.startConversation('user-123');
      conversationId.value = response.conversationId;
      
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const addMessage = (message: ChatMessage) => {
    messages.value.push(message);
  };

  const sendMessage = async (input: string) => {
    if (!input.trim() || isLoading.value) return;

    addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    });

    isLoading.value = true;

    try {
      const response = await ChatApiService.sendMessage(conversationId.value, input);
      
      addMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(response.timestamp)
      });

      if (response.pendingActions && response.pendingActions.length > 0) {
        pendingActions.value.push(...response.pendingActions);
      }
    } catch (error: any) {
      addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      });
    } finally {
      isLoading.value = false;
    }
  };

  const confirmAction = async (actionId: string) => {
    executingActions.value.add(actionId);

    try {
      await ChatApiService.confirmAction(actionId, 'User approved');
      
      pendingActions.value = pendingActions.value.filter(a => a.actionId !== actionId);
      
      addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: '✓ Action confirmed and executed',
        timestamp: new Date()
      });
    } catch (error: any) {
      addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: `✗ Failed to confirm: ${error.message}`,
        timestamp: new Date()
      });
    } finally {
      executingActions.value.delete(actionId);
    }
  };

  const rejectAction = async (actionId: string) => {
    try {
      await ChatApiService.rejectAction(actionId, 'User declined');
      
      pendingActions.value = pendingActions.value.filter(a => a.actionId !== actionId);
      
      addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: '✗ Action cancelled',
        timestamp: new Date()
      });
    } catch (error: any) {
      addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: `✗ Failed to reject: ${error.message}`,
        timestamp: new Date()
      });
    }
  };

  return {
    conversationId,
    messages,
    pendingActions,
    executingActions,
    isLoading,
    initConversation,
    sendMessage,
    confirmAction,
    rejectAction
  };
}
```

### Chat Component (components/ChatBot.vue)

```vue
<template>
  <div class="chatbot-container">
    <div class="chat-header">
      <h2>VLEI Ecosystem Agent</h2>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <MessageList :messages="messages" />

      <div v-if="pendingActions.length > 0" class="pending-actions-section">
        <h3>Pending Actions ({{ pendingActions.length }})</h3>
        <ConfirmationCard
          v-for="action in pendingActions"
          :key="action.actionId"
          :action="action"
          :is-executing="executingActions.has(action.actionId)"
          @confirm="confirmAction"
          @reject="rejectAction"
        />
      </div>
    </div>

    <div class="chat-input">
      <textarea
        v-model="input"
        @keypress.enter.prevent="handleSend"
        placeholder="Type your message..."
        :disabled="isLoading"
        rows="3"
      />
      <button @click="handleSend" :disabled="isLoading || !input.trim()">
        {{ isLoading ? '⏳ Sending...' : '📤 Send' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useChat } from '../composables/useChat';
import ConfirmationCard from './ConfirmationCard.vue';
import MessageList from './MessageList.vue';

const {
  messages,
  pendingActions,
  executingActions,
  isLoading,
  initConversation,
  sendMessage,
  confirmAction,
  rejectAction
} = useChat();

const input = ref('');
const messagesContainer = ref<HTMLElement>();

const handleSend = async () => {
  if (!input.value.trim() || isLoading.value) return;
  
  await sendMessage(input.value);
  input.value = '';
};

onMounted(() => {
  initConversation();
});
</script>
```

---

## Angular Implementation

### Service (services/chat.service.ts)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface PendingAction {
  actionId: string;
  functionName: string;
  pluginName: string;
  arguments?: Record<string, any>;
  description?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  conversationId: string;
  message: string;
  pendingActions?: PendingAction[];
  success: boolean;
  error?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:5184/api/chat';
  
  private conversationId$ = new BehaviorSubject<string>('');
  private messages$ = new BehaviorSubject<ChatMessage[]>([]);
  private pendingActions$ = new BehaviorSubject<PendingAction[]>([]);
  private executingActions$ = new BehaviorSubject<Set<string>>(new Set());

  constructor(private http: HttpClient) {}

  get conversationId(): Observable<string> {
    return this.conversationId$.asObservable();
  }

  get messages(): Observable<ChatMessage[]> {
    return this.messages$.asObservable();
  }

  get pendingActions(): Observable<PendingAction[]> {
    return this.pendingActions$.asObservable();
  }

  get executingActions(): Observable<Set<string>> {
    return this.executingActions$.asObservable();
  }

  startConversation(userId: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/start`, { userId })
      .pipe(
        tap(response => {
          this.conversationId$.next(response.conversationId);
          this.addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.message,
            timestamp: new Date()
          });
        })
      );
  }

  sendMessage(message: string): Observable<ChatResponse> {
    const body = {
      conversationId: this.conversationId$.value,
      message
    };

    this.addMessage({
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    return this.http.post<ChatResponse>(`${this.apiUrl}/message`, body)
      .pipe(
        tap(response => {
          this.addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.message,
            timestamp: new Date(response.timestamp)
          });

          if (response.pendingActions && response.pendingActions.length > 0) {
            const current = this.pendingActions$.value;
            this.pendingActions$.next([...current, ...response.pendingActions]);
          }
        })
      );
  }

  confirmAction(actionId: string): Observable<any> {
    const executing = this.executingActions$.value;
    executing.add(actionId);
    this.executingActions$.next(new Set(executing));

    return this.http.post(`${this.apiUrl}/action/confirm`, { actionId })
      .pipe(
        tap(() => {
          this.removePendingAction(actionId);
          this.removeExecutingAction(actionId);
          
          this.addMessage({
            id: crypto.randomUUID(),
            role: 'system',
            content: '✓ Action confirmed and executed',
            timestamp: new Date()
          });
        })
      );
  }

  rejectAction(actionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/action/reject`, { actionId })
      .pipe(
        tap(() => {
          this.removePendingAction(actionId);
          
          this.addMessage({
            id: crypto.randomUUID(),
            role: 'system',
            content: '✗ Action cancelled by user',
            timestamp: new Date()
          });
        })
      );
  }

  private addMessage(message: ChatMessage): void {
    const current = this.messages$.value;
    this.messages$.next([...current, message]);
  }

  private removePendingAction(actionId: string): void {
    const current = this.pendingActions$.value;
    this.pendingActions$.next(current.filter(a => a.actionId !== actionId));
  }

  private removeExecutingAction(actionId: string): void {
    const executing = this.executingActions$.value;
    executing.delete(actionId);
    this.executingActions$.next(new Set(executing));
  }
}
```

---

These examples provide production-ready implementations for the three most popular frontend frameworks. Choose the one that matches your current stack and integrate it following the patterns shown.
