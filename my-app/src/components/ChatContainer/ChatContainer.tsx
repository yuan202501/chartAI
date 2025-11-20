import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../../hooks/useChat';
import Message from '../Message/Message';
import InputArea from '../InputArea/InputArea';
import { ChatContainerProps, Message as IMessage, UseChatReturn } from '../../types';
import styles from './ChatContainer.module.css';

/**
 * ChatContainer component - Main chat interface
 */
const ChatContainer: React.FC<ChatContainerProps> = ({
  title = 'AI Assistant',
  apiEndpoint = '/api/chat',
  selectedModel = 'qwen-plus',
  models = [],
  onModelChange,
  predefinedTools = [],
  enableVoice = false,
  enableFileUpload = false,
  onError,
  onSuccess,
  styles: customStyles = {}
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [retryCount, setRetryCount] = useState(0);
  
  const {
    messages,
    input,
    isLoading,
    error,
    isStreaming,
    sendMessage,
    setInput,
    clearMessages,
    abortRequest,
    retryLastMessage
  } = useChat({
    apiEndpoint,
    selectedModel,
    onError: (error: Error) => {
      setConnectionStatus('error');
      onError?.(error);
    },
    onSuccess: (response: any) => {
      setConnectionStatus('connected');
      onSuccess?.(response);
    }
  }) as UseChatReturn;

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.target as HTMLDivElement;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setIsAtBottom(isNearBottom);
  }, []);

  // Connection status management
  useEffect(() => {
    if (error) {
      setConnectionStatus('error');
    } else if (isStreaming) {
      setConnectionStatus('connected');
    } else if (messages.length > 0) {
      setConnectionStatus('connected');
    }
  }, [error, isStreaming, messages.length]);

  const handleClearChat = () => {
    clearMessages();
    setConnectionStatus('connecting');
  };

  const handleAbort = () => {
    abortRequest();
    setConnectionStatus('connected');
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    retryLastMessage();
  };

  const handleSendMessage = (message: string) => {
    sendMessage(message);
    setIsAtBottom(true);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleModelChange = (model: string) => {
    onModelChange?.(model);
  };

  // Status indicator component
  const StatusIndicator: React.FC = () => {
    const getStatusDotClass = () => {
      switch (connectionStatus) {
        case 'connected': return styles.connected;
        case 'connecting': return styles.connecting;
        case 'error': return styles.error;
        default: return '';
      }
    };

    const getStatusText = () => {
      switch (connectionStatus) {
        case 'connected': return 'Connected';
        case 'connecting': return 'Connecting...';
        case 'error': return 'Connection failed';
        default: return 'Unknown';
      }
    };

    return (
      <div className={styles['status-indicator']}>
        <div className={`${styles['status-dot']} ${getStatusDotClass()}`}></div>
        <span>{getStatusText()}</span>
      </div>
    );
  };

  // Empty state component
  const EmptyState: React.FC = () => (
    <div className={styles['empty-state']}>
      <div className={styles['empty-state-icon']}>🤖</div>
      <h3 className={styles['empty-state-title']}>Welcome to AI Assistant</h3>
      <p className={styles['empty-state-description']}>
        Start a conversation by typing your message below. I'm here to help with any questions you have!
      </p>
    </div>
  );

  // Error state component
  const ErrorState: React.FC = () => (
    <div className={styles['error-state']}>
      <div className={styles['error-state-icon']}>⚠️</div>
      <h3 className={styles['error-state-title']}>Connection Error</h3>
      <p className={styles['error-state-description']}>
        {error?.message || 'Unable to connect to the AI service. Please check your connection and try again.'}
      </p>
      <div className={styles['error-state-actions']}>
        <button onClick={handleRetry} className={styles['header-button']}>
          Retry
        </button>
        <button onClick={handleClearChat} className={`${styles['header-button']} ${styles.danger}`}>
          Clear Chat
        </button>
      </div>
    </div>
  );

  // Loading state component
  const LoadingState: React.FC = () => (
    <div className={styles['loading-state']}>
      <div className={styles['loading-spinner']}></div>
      <div className={styles['loading-text']}>Connecting to AI service...</div>
    </div>
  );

  return (
    <div className={styles['chat-container']} style={customStyles}>
      {/* Header */}
      <div className={styles['chat-header']}>
        <h1 className={styles['chat-title']}>{title}</h1>
        <div className={styles['header-actions']}>
          {isLoading && (
            <button onClick={handleAbort} className={styles['header-button']}>
              Stop
            </button>
          )}
          <button onClick={handleClearChat} className={`${styles['header-button']} ${styles.danger}`}>
            Clear
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div 
        className={styles['messages-container']}
        onScroll={handleScroll}
      >
        {connectionStatus === 'connecting' && messages.length === 0 ? (
          <LoadingState />
        ) : connectionStatus === 'error' && messages.length === 0 ? (
          <ErrorState />
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((message: IMessage, index: number) => (
            <Message
              key={message.id}
              message={message}
              isStreaming={isStreaming && index === messages.length - 1}
              isLastMessage={index === messages.length - 1}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Status Bar */}
      {connectionStatus !== 'connecting' && (
        <div className={styles['status-bar']}>
          <StatusIndicator />
          <div className={styles['connection-info']}>
            {error && (
              <span className={styles['connection-error']}>
                Error: {error.message}
              </span>
            )}
            {retryCount > 0 && (
              <button onClick={handleRetry} className={styles['connection-retry']}>
                Retry ({retryCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className={styles['input-container']}>
        <InputArea
          value={input}
          onChange={handleInputChange}
          onSubmit={handleSendMessage}
          disabled={isLoading || connectionStatus === 'error'}
          isLoading={isLoading}
          placeholder="Type your message..."
          selectedModel={selectedModel}
          models={models}
          onModelChange={handleModelChange}
          enableVoice={enableVoice}
          enableFileUpload={enableFileUpload}
        />
      </div>
    </div>
  );
};

export default ChatContainer;