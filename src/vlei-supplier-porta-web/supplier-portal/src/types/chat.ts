// Chat types for AI chatbot integration

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  action?: ChatAction;
  attachment?: ChatAttachment;
  // Threading support
  threadId?: string;  // Groups related messages into threads
  threadTitle?: string;  // Display title for the thread (e.g., "Copper Fields Procurement")
  threadIcon?: string;  // Emoji or icon for the thread
  isThreadStart?: boolean;  // Marks the first message in a thread
  parentMessageId?: string;  // Reference to parent message if this is a reply
  metadata?: {
    isCollapsible?: boolean;
    isCollapsed?: boolean;
    actionId?: string;
    actionDetails?: {
      functionName: string;
      description?: string;
    };
  };
}

export interface ChatAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  content: string; // File content as text
  uploadedAt: Date;
}

export interface ChatAction {
  type: 'confirmation' | 'choice';
  actionId: string;
  prompt: string;
  options?: ChatActionOption[];
  pending?: boolean;
}

export interface ChatActionOption {
  label: string;
  value: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
}

// New types for VS Code Copilot-style confirmation workflow
export interface PendingAction {
  actionId: string;
  functionName: string;
  pluginName: string;
  arguments?: Record<string, any>;
  description?: string;
  createdAt: string;
}

export interface ActionConfirmRequest {
  actionId: string;
  reason?: string;
}

export interface ChatMessageRequest {
  message: string;
  conversationId?: string;
  userId?: string;
  context?: Record<string, any>;
  history?: ChatMessage[];
  attachment?: ChatAttachment;
}

export interface ChatMessageResponse {
  message: string;
  conversationId: string;
  timestamp: string;
  action?: ChatAction;
  toolCalls?: string[];  // Array of tool names that were called
  ecosystemMessages?: string[];  // User-friendly ecosystem call messages
  // Threading support
  threadId?: string;
  threadTitle?: string;
  threadIcon?: string;
  isThreadStart?: boolean;
  suggestedThreads?: ThreadSuggestion[];  // AI suggests creating threads for multiple topics
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

// Thread suggestion when AI detects multiple topics
export interface ThreadSuggestion {
  threadId: string;
  title: string;
  icon: string;
  description: string;
  relatedMessages: string[];  // Message IDs that belong to this thread
}

export interface ConversationContext {
  conversationId: string;
  userId: string;
  startedAt: Date;
  lastMessageAt: Date;
  metadata: Record<string, any>;
}
