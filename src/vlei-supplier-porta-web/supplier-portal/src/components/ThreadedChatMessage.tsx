import React from 'react';
import type { ChatMessage } from '../types/chat';
import '../styles/threaded-chat.css';
import '../styles/messages.css';

export interface ThreadedChatMessageProps {
  thread: {
    id: string;
    title: string;
    icon: string;
    messages: ChatMessage[];
    isExpanded: boolean;
  };
  onToggle: (threadId: string) => void;
  formatTime: (date: Date) => string;
}

export const ThreadedChatMessage: React.FC<ThreadedChatMessageProps> = ({
  thread,
  onToggle,
  formatTime
}) => {
  const latestMessage = thread.messages[thread.messages.length - 1];
  const messageCount = thread.messages.length;

  const cleanHtmlContent = (html: string): string => {
    // Remove all newline characters (\n) and extra whitespace between tags
    return html
      .replace(/\n/g, '') // Remove all newlines
      .replace(/\s+</g, '<') // Remove whitespace before opening tags
      .replace(/>\s+/g, '>') // Remove whitespace after closing tags
      .trim();
  };

  return (
    <div className="chat-thread">
      {/* Thread Header - Always visible */}
      <div 
        className="thread-header"
        onClick={() => onToggle(thread.id)}
      >
        <div className="thread-icon">{thread.icon}</div>
        <div className="thread-info">
          <div className="thread-title">
            {thread.title}
            <span className="thread-count">{messageCount} message{messageCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="thread-preview">
            {latestMessage.content.substring(0, 60)}
            {latestMessage.content.length > 60 ? '...' : ''}
          </div>
        </div>
        <button className="thread-toggle-btn">
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none"
            style={{ 
              transform: thread.isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            <path d="M7 10L12 15L17 10H7Z" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* Thread Messages - Expandable */}
      {thread.isExpanded && (
        <div className="thread-messages">
          {thread.messages.map((message, index) => {
            const isUser = message.role === 'user';
            const isSystem = message.role === 'system';
            const isEcosystemCall = isSystem && message.content.startsWith('VLEI ECOSYSTEM CALL:');
            
            return (
              <div
                key={message.id}
                className={`thread-message ${
                  isUser ? 'user-message' : isSystem ? 'system-message' : 'assistant-message'
                } ${isEcosystemCall ? 'ecosystem-call-message' : ''}`}
              >
                {!isUser && !isSystem && (
                  <div className="message-avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="currentColor"/>
                    </svg>
                  </div>
                )}
                {isEcosystemCall && (
                  <div className="message-avatar ecosystem-avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M13.5 2C13.5 2 15 3.5 15 6.5C15 9.5 13.5 11 13.5 11H18.5C19.6 11 20.5 11.9 20.5 13V18C20.5 19.1 19.6 20 18.5 20H5.5C4.4 20 3.5 19.1 3.5 18V13C3.5 11.9 4.4 11 5.5 11H10.5C10.5 11 9 9.5 9 6.5C9 3.5 10.5 2 10.5 2H13.5Z" fill="#5DCEBC"/>
                    </svg>
                  </div>
                )}
                <div className="message-content-wrapper">
                  <div className={`message-bubble ${isEcosystemCall ? 'ecosystem-call' : ''}`}>
                    <div 
                      className="message-text" 
                      dangerouslySetInnerHTML={{ __html: cleanHtmlContent(message.content) }}
                    />
                  </div>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
                
                {/* Thread connector line (except for last message) */}
                {index < thread.messages.length - 1 && (
                  <div className="thread-connector"></div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
