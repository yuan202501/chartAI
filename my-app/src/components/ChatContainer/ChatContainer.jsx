import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useChat } from '../../hooks';
import Message from '../Message/Message';
import InputArea from '../InputArea/InputArea';
import styles from './ChatContainer.module.css';

/**
 * ChatContainer component props
 * @typedef {Object} ChatContainerProps
 * @property {string} [title] - Chat title
 * @property {string} [apiEndpoint] - API endpoint URL
 * @property {string} [selectedModel] - Selected AI model
 * @property {Array} [models] - Available models
 * @property {function} [onModelChange] - Model change handler
 * @property {Array} [predefinedTools] - Predefined tools
 * @property {boolean} [enableVoice] - Enable voice input
 * @property {boolean} [enableFileUpload] - Enable file upload
 * @property {function} [onError] - Error handler
 * @property {function} [onSuccess] - Success handler
 * @property {Object} [styles] - Custom styles
 */

/**
 * ChatContainer component - Main chat interface
 * @param {ChatContainerProps} props
 * @returns {JSX.Element}
 */
const ChatContainer = ({
  title = 'AI Assistant',
  apiEndpoint = '/api/chat',
  selectedModel = 'gpt-3.5-turbo',
  models = [],
  onModelChange,
  predefinedTools = [],
  enableVoice = false,
  enableFileUpload = false,
  onError,
  onSuccess,
  styles: customStyles = {}
}) => {
  const messagesEndRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
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
    onError: (error) => {
      setConnectionStatus('error');
      onError?.(error);
    },
    onSuccess: (response) => {
      setConnectionStatus('connected');
      onSuccess?.(response);
    }
  });

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
  const handleScroll = useCallback((e) => {
    const container = e.target;
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

  const handleSendMessage = (message) => {
    sendMessage(message);
    setIsAtBottom(true);
  };

  const handleInputChange = (value) => {
    setInput(value);
  };

  const handleModelChange = (model) => {
    onModelChange?.(model);
  };

  // Status indicator component
  const StatusIndicator = () => {
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
  const EmptyState = () => (
    <div className={styles['empty-state']}>
      <div className={styles['empty-state-icon']}>🤖</div>
      <h3 className={styles['empty-state-title']}>Welcome to AI Assistant</h3>
      <p className={styles['empty-state-description']}>
        Start a conversation by typing your message below. I'm here to help with any questions you have!
      </p>
    </div>
  );

  // Error state component
  const ErrorState = () => (
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
  const LoadingState = () => (
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
          messages.map((message, index) => (
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

ChatContainer.propTypes = {
  title: PropTypes.string,
  apiEndpoint: PropTypes.string,
  selectedModel: PropTypes.string,
  models: PropTypes.array,
  onModelChange: PropTypes.func,
  predefinedTools: PropTypes.array,
  enableVoice: PropTypes.bool,
  enableFileUpload: PropTypes.bool,
  onError: PropTypes.func,
  onSuccess: PropTypes.func,
  styles: PropTypes.object
};

export default ChatContainer;