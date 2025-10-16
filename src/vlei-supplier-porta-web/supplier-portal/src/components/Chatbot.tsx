import React, { useState, useEffect, useRef } from 'react';
import { SupplierApiService } from '../services/apiService';
import type { ChatMessage, ChatMessageRequest, ChatAttachment } from '../types/chat';
import type { CompanyData } from '../types/api';
import { ThreadedChatMessage } from './ThreadedChatMessage';
import '../styles/chatbot.css';
import '../styles/messages.css';

export interface ChatbotProps {
  company: CompanyData;
  context?: Record<string, any>;
}

export const Chatbot: React.FC<ChatbotProps> = ({ company, context = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 380, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [uploadedAttachment, setUploadedAttachment] = useState<ChatAttachment | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null); // Track active thread for new messages
  const [threadSuggestions, setThreadSuggestions] = useState<any[]>([]); // Store thread suggestions
  const [showEmailPicker, setShowEmailPicker] = useState(false);
  const [availableEmails, setAvailableEmails] = useState<Array<{name: string, path: string}>>([]);
  const [selectedEmailPreview, setSelectedEmailPreview] = useState<{name: string, content: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to group messages by thread
  const groupMessagesByThread = () => {
    const threads = new Map<string, ChatMessage[]>();
    const unthreadedMessages: ChatMessage[] = [];

    messages.forEach(message => {
      if (message.threadId) {
        const threadMessages = threads.get(message.threadId) || [];
        threadMessages.push(message);
        threads.set(message.threadId, threadMessages);
      } else {
        unthreadedMessages.push(message);
      }
    });

    return { threads, unthreadedMessages };
  };

  const handleThreadToggle = (threadId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  const handleThreadSelect = (threadId: string, threadTitle: string, threadIcon: string) => {
    console.log('Thread selected:', { threadId, threadTitle, threadIcon });
    
    // Set the current thread for future messages
    setCurrentThreadId(threadId);
    
    // Expand this thread
    setExpandedThreads(prev => new Set([...prev, threadId]));
    
    // Add a system message indicating thread started
    const threadStartMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'system',
      content: `Started conversation: ${threadTitle}`,
      timestamp: new Date(),
      threadId,
      threadTitle,
      threadIcon,
      isThreadStart: true
    };
    
    setMessages(prev => [...prev, threadStartMessage]);
    
    // Clear thread suggestions since user selected one
    setThreadSuggestions([]);
  };

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize conversation when chat opens for the first time
    if (isOpen && messages.length === 0 && !conversationId) {
      const initializeConversation = async () => {
        try {
          // Start conversation with company context
          const response = await SupplierApiService.startConversation(company);
          setConversationId(response.conversationId);
          
          const welcomeMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: response.message,
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        } catch (error) {
          console.error('Error starting conversation:', error);
          
          // Fallback to simple welcome message
          const welcomeMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: `Hello ${company.companyName || 'there'}! 👋 I'm your AI assistant for the VLEI Ecosystem. How can I help you today?`,
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        }
      };
      
      initializeConversation();
    }
  }, [isOpen, messages.length, conversationId, company]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    setIsFullscreen(false);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setIsFullscreen(false);
  };

  const handleNewConversation = async () => {
    if (!conversationId) {
      // No conversation yet, just clear local state
      setMessages([]);
      setThreadSuggestions([]);
      setCurrentThreadId(null);
      setExpandedThreads(new Set());
      setUploadedAttachment(null);
      return;
    }

    // Confirm with user before clearing
    if (!window.confirm('Start a new conversation? This will clear the current conversation history.')) {
      return;
    }

    try {
      // Call backend to clear conversation
      await SupplierApiService.clearConversation(conversationId);
      
      // Clear local state
      setMessages([]);
      setThreadSuggestions([]);
      setCurrentThreadId(null);
      setExpandedThreads(new Set());
      setUploadedAttachment(null);
      
      // Generate new conversation ID and initialize
      const response = await SupplierApiService.startConversation(company);
      setConversationId(response.conversationId);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      console.log('New conversation started');
    } catch (error) {
      console.error('Error starting new conversation:', error);
      // Still clear local state even if backend call fails
      setMessages([]);
      setThreadSuggestions([]);
      setCurrentThreadId(null);
      setExpandedThreads(new Set());
      setUploadedAttachment(null);
      setConversationId('');
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (isFullscreen) return;
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || isFullscreen) return;

      const newWidth = window.innerWidth - e.clientX + 24;
      const newHeight = window.innerHeight - e.clientY + 24;

      setWindowSize({
        width: Math.max(320, Math.min(newWidth, window.innerWidth - 48)),
        height: Math.max(400, Math.min(newHeight, window.innerHeight - 48))
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isFullscreen]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if ((!textToSend && !uploadedAttachment) || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: textToSend || 'Email attachment uploaded',
      timestamp: new Date(),
      attachment: uploadedAttachment || undefined,
      threadId: currentThreadId || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    const currentAttachment = uploadedAttachment;
    setUploadedAttachment(null); // Clear attachment after sending
    setIsLoading(true);

    try {
      const request: ChatMessageRequest = {
        message: textToSend || 'Please analyze this email attachment',
        conversationId: conversationId || undefined,
        userId: company.lei,
        context: {
          companyName: company.companyName,
          lei: company.lei,
          ...context
        },
        history: messages.slice(-5), // Send last 5 messages for context
        attachment: currentAttachment || undefined
      };

      const response = await SupplierApiService.sendChatMessage(request);
      
      if (response.conversationId && !conversationId) {
        setConversationId(response.conversationId);
      }

      // Show ecosystem call messages BEFORE the assistant response
      const baseTimestamp = Date.now();
      let messageIdCounter = 0;

      if (response.ecosystemMessages && response.ecosystemMessages.length > 0) {
        // Add ecosystem messages first with staggered timing for better visibility
        response.ecosystemMessages.forEach((ecosystemMessage, index) => {
          setTimeout(() => {
            const ecosystemCallMessage: ChatMessage = {
              id: `msg_${baseTimestamp + messageIdCounter++}`,
              role: 'system' as const,
              content: ecosystemMessage,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, ecosystemCallMessage]);
          }, index * 200); // 200ms delay between each ecosystem message
        });
        
        // Add the assistant response after all ecosystem messages
        const totalDelay = response.ecosystemMessages.length * 200 + 300;
        setTimeout(() => {
          const assistantMessage: ChatMessage = {
            id: `msg_${baseTimestamp + messageIdCounter++}`,
            role: 'assistant',
            content: response.message,
            timestamp: new Date(response.timestamp),
            action: response.action,
            threadId: response.threadId,
            threadTitle: response.threadTitle,
            threadIcon: response.threadIcon,
            isThreadStart: response.isThreadStart
          };
          setMessages(prev => [...prev, assistantMessage]);
          
          // If thread suggestions detected, auto-expand the first thread
          if (response.suggestedThreads && response.suggestedThreads.length > 0) {
            const firstThreadId = response.suggestedThreads[0].threadId;
            setExpandedThreads(prev => new Set([...prev, firstThreadId]));
            
            console.log('Thread suggestions detected:', response.suggestedThreads);
          }
        }, totalDelay);
      } else {
        // No ecosystem messages, show assistant response immediately
        const assistantMessage: ChatMessage = {
          id: `msg_${baseTimestamp + messageIdCounter++}`,
          role: 'assistant',
          content: response.message,
          timestamp: new Date(response.timestamp),
          action: response.action,
          threadId: response.threadId,
          threadTitle: response.threadTitle,
          threadIcon: response.threadIcon,
          isThreadStart: response.isThreadStart
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // If thread suggestions detected, store them and show as options
        if (response.suggestedThreads && response.suggestedThreads.length > 0) {
          console.log('Thread suggestions detected:', response.suggestedThreads);
          setThreadSuggestions(response.suggestedThreads);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your message. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a text file or email file
    const allowedTypes = ['text/plain', 'message/rfc822', '.eml', '.txt', '.email'];
    const isValidType = allowedTypes.some(type => 
      file.type === type || file.name.toLowerCase().endsWith(type.replace('text/', '.'))
    );

    if (!isValidType) {
      alert('Please upload a text file or email file (.txt, .eml, .email)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const attachment: ChatAttachment = {
        id: `att_${Date.now()}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'text/plain',
        content,
        uploadedAt: new Date()
      };
      
      setUploadedAttachment(attachment);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const handleRemoveAttachment = () => {
    setUploadedAttachment(null);
  };

  const handleAttachmentClick = async () => {
    // Instead of opening file explorer, show custom email picker
    setShowEmailPicker(true);
    
    // Fetch available HTML email files from the backend
    try {
      const emails = await SupplierApiService.getAvailableEmails();
      setAvailableEmails(emails);
    } catch (error) {
      console.error('Error fetching emails:', error);
      // Fallback to hardcoded list for now
      setAvailableEmails([
        { name: 'alpha-net-email-template.html', path: '/emails/alpha-net-email-template.html' }
      ]);
    }
  };

  const handleEmailPreview = async (emailPath: string, emailName: string) => {
    try {
      const response = await fetch(emailPath);
      const htmlContent = await response.text();
      
      // Store the full HTML for preview
      setSelectedEmailPreview({
        name: emailName,
        content: htmlContent
      });
    } catch (error) {
      console.error('Error loading email preview:', error);
    }
  };

  const handleEmailUpload = () => {
    if (selectedEmailPreview) {
      // Extract content from the div with class "content" for upload
      const parser = new DOMParser();
      const doc = parser.parseFromString(selectedEmailPreview.content, 'text/html');
      const contentDiv = doc.querySelector('.content');
      const extractedContent = contentDiv?.innerHTML || selectedEmailPreview.content;
      
      const attachment: ChatAttachment = {
        id: `att_${Date.now()}`,
        fileName: selectedEmailPreview.name,
        fileSize: new Blob([extractedContent]).size,
        fileType: 'text/html',
        content: extractedContent,
        uploadedAt: new Date()
      };
      
      setUploadedAttachment(attachment);
      setShowEmailPicker(false);
      setSelectedEmailPreview(null);
    }
  };

  const handleEmailPickerClose = () => {
    setShowEmailPicker(false);
    setSelectedEmailPreview(null);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderAttachment = (attachment: ChatAttachment) => {
    return (
      <div className="message-attachment">
        <div className="attachment-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
          </svg>
        </div>
        <div className="attachment-info">
          <span className="attachment-title">{getFileNameWithoutExtension(attachment.fileName)}</span>
          <span className="attachment-filename">{attachment.fileName}</span>
          <span className="attachment-size">{formatFileSize(attachment.fileSize)}</span>
        </div>
      </div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileNameWithoutExtension = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  };

  const cleanHtmlContent = (html: string): string => {
    // Remove all newline characters (\n) and extra whitespace between tags
    return html
      .replace(/\n/g, '') // Remove all newlines
      .replace(/\s+</g, '<') // Remove whitespace before opening tags
      .replace(/>\s+/g, '>') // Remove whitespace after closing tags
      .trim();
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      {!isOpen && (
        <button className="chatbot-toggle" onClick={handleToggleChat}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
          </svg>
          <span className="chatbot-badge">AI</span>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div 
          ref={chatWindowRef}
          className={`chatbot-window ${isMinimized ? 'minimized' : ''} ${isFullscreen ? 'fullscreen' : ''}`}
          style={!isFullscreen && !isMinimized ? {
            width: `${windowSize.width}px`,
            height: `${windowSize.height}px`
          } : undefined}
        >
          {/* Resize Handle */}
          {!isFullscreen && !isMinimized && (
            <div className="chatbot-resize-handle" onMouseDown={handleResizeStart}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M4 15L9 20L4 20L4 15Z" fill="currentColor" opacity="0.5"/>
                <path d="M9 9L15 15L9 15L9 9Z" fill="currentColor" opacity="0.5"/>
                <path d="M15 4L20 9L15 9L15 4Z" fill="currentColor" opacity="0.5"/>
              </svg>
            </div>
          )}

          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="chatbot-header-text">
                <h3>AI Assistant</h3>
                <span className="chatbot-status">
                  <span className="status-dot"></span>
                  Online
                </span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button className="chatbot-header-btn" onClick={handleNewConversation} title="New Conversation">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16 13H13V16C13 16.55 12.55 17 12 17C11.45 17 11 16.55 11 16V13H8C7.45 13 7 12.55 7 12C7 11.45 7.45 11 8 11H11V8C11 7.45 11.45 7 12 7C12.55 7 13 7.45 13 8V11H16C16.55 11 17 11.45 17 12C17 12.55 16.55 13 16 13Z" fill="currentColor"/>
                </svg>
              </button>
              <button className="chatbot-header-btn" onClick={handleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                {isFullscreen ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M5 16H8V19H10V14H5V16ZM8 8H5V10H10V5H8V8ZM14 19H16V16H19V14H14V19ZM16 8V5H14V10H19V8H16Z" fill="currentColor"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M7 14H5V19H10V17H7V14ZM5 10H7V7H10V5H5V10ZM17 17H14V19H19V14H17V17ZM14 5V7H17V10H19V5H14Z" fill="currentColor"/>
                  </svg>
                )}
              </button>
              <button className="chatbot-header-btn" onClick={handleMinimize} title={isMinimized ? "Expand" : "Minimize"}>
                {isMinimized ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M7 14L12 9L17 14H7Z" fill="currentColor"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M7 10L12 15L17 10H7Z" fill="currentColor"/>
                  </svg>
                )}
              </button>
              <button className="chatbot-header-btn" onClick={handleClose} title="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="chatbot-messages">
              {(() => {
                const { threads, unthreadedMessages } = groupMessagesByThread();
                
                return (
                  <>
                    {/* Render unthreaded messages first */}
                    {unthreadedMessages.map((message) => {
                      const isEcosystemCall = message.role === 'system' && message.content.startsWith('VLEI ECOSYSTEM CALL:');
                      const messageClasses = `chat-message ${
                        message.role === 'user' 
                          ? 'user-message' 
                          : message.role === 'system' 
                            ? 'system-message' 
                            : 'assistant-message'
                      } ${isEcosystemCall ? 'ecosystem-call-message' : ''}`;
                      
                      return (
                        <div key={message.id} className={messageClasses}>
                          {message.role === 'assistant' && (
                            <div className="message-avatar">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="currentColor"/>
                              </svg>
                            </div>
                          )}
                          {isEcosystemCall && (
                            <div className="message-avatar ecosystem-avatar">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
                              {message.attachment && renderAttachment(message.attachment)}
                            </div>
                            <span className="message-time">{formatTime(message.timestamp)}</span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Render threaded messages */}
                    {Array.from(threads.entries()).map(([threadId, threadMessages]) => {
                      const firstMessage = threadMessages[0];
                      return (
                        <ThreadedChatMessage
                          key={threadId}
                          thread={{
                            id: threadId,
                            title: firstMessage.threadTitle || 'Conversation Thread',
                            icon: firstMessage.threadIcon || '🧵',
                            messages: threadMessages,
                            isExpanded: expandedThreads.has(threadId)
                          }}
                          onToggle={handleThreadToggle}
                          formatTime={formatTime}
                        />
                      );
                    })}
                    
                    {/* Render thread suggestions as clickable options */}
                    {threadSuggestions.length > 0 && (
                      <div className="thread-suggestions">
                        <div className="thread-suggestions-header">
                          <span className="thread-suggestions-icon">🧵</span>
                          <span className="thread-suggestions-title">Select a conversation:</span>
                        </div>
                        <div className="thread-suggestions-list">
                          {threadSuggestions.map((suggestion: any) => (
                            <button
                              key={suggestion.threadId}
                              className="thread-suggestion-btn"
                              onClick={() => handleThreadSelect(
                                suggestion.threadId,
                                suggestion.title,
                                suggestion.icon
                              )}
                            >
                              <span className="thread-suggestion-icon">{suggestion.icon}</span>
                              <span className="thread-suggestion-title">{suggestion.title}</span>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="thread-suggestion-arrow">
                                <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="currentColor"/>
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
              {isLoading && (
                  <div className="chat-message assistant-message">
                    <div className="message-avatar">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="message-content-wrapper">
                      <div className="message-bubble">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Attachment Preview */}
              {uploadedAttachment && (
                <div className="attachment-preview">
                  <div className="attachment-preview-content">
                    <div className="attachment-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div className="attachment-details">
                      <span className="attachment-title">{getFileNameWithoutExtension(uploadedAttachment.fileName)}</span>
                      <span className="attachment-filename">{uploadedAttachment.fileName}</span>
                    </div>
                    <button 
                      className="attachment-remove-btn"
                      onClick={handleRemoveAttachment}
                      title="Remove attachment"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="chatbot-input">
                <button
                  className="chatbot-attachment-btn"
                  onClick={handleAttachmentClick}
                  title="Upload email file"
                  disabled={isLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M16.5 6V17.5C16.5 19.71 14.71 21.5 12.5 21.5S8.5 19.71 8.5 17.5V5C8.5 3.62 9.62 2.5 11 2.5S13.5 3.62 13.5 5V15.5C13.5 16.05 13.05 16.5 12.5 16.5S11.5 16.05 11.5 15.5V6H10V15.5C10 16.88 11.12 18 12.5 18S15 16.88 15 15.5V5C15 2.79 13.21 1 11 1S7 2.79 7 5V17.5C7 20.54 9.46 23 12.5 23S18 20.54 18 17.5V6H16.5Z" fill="currentColor"/>
                  </svg>
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  className="chatbot-input-field"
                  placeholder={uploadedAttachment ? "Add a message about the email..." : "Type your message..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                />
                <button
                  className="chatbot-send-btn"
                  onClick={() => handleSendMessage()}
                  disabled={(!inputValue.trim() && !uploadedAttachment) || isLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
                  </svg>
                </button>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.eml,.email,.msg,text/plain,message/rfc822"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Powered by */}
              <div className="chatbot-footer">
                <span>Powered by Semantic Kernel AI</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Email Picker Modal */}
      {showEmailPicker && (
        <div className="email-picker-overlay" onClick={handleEmailPickerClose}>
          <div className="email-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="email-picker-header">
              <h3>Choose Email to Process</h3>
              <button className="email-picker-close" onClick={handleEmailPickerClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                </svg>
              </button>
            </div>

            <div className="email-picker-content">
              <div className="email-picker-list">
                <h4>Purchase request email queue</h4>
                {availableEmails.map((email, index) => (
                  <div 
                    key={index} 
                    className={`email-list-item ${selectedEmailPreview?.name === email.name ? 'selected' : ''}`}
                    onClick={() => handleEmailPreview(email.path, email.name)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"/>
                    </svg>
                    <span>{getFileNameWithoutExtension(email.name)}</span>
                  </div>
                ))}
              </div>

              <div className="email-picker-preview">
                <h4>Preview</h4>
                {selectedEmailPreview ? (
                  <div className="email-preview-content">
                    <div 
                      className="email-preview-html" 
                      dangerouslySetInnerHTML={{ __html: selectedEmailPreview.content }}
                    />
                  </div>
                ) : (
                  <div className="email-preview-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"/>
                    </svg>
                    <p>Select an email to preview</p>
                  </div>
                )}
              </div>
            </div>

            <div className="email-picker-footer">
              <button className="btn-secondary" onClick={handleEmailPickerClose}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleEmailUpload}
                disabled={!selectedEmailPreview}
              >
                Upload Email
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
