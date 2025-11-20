import React from 'react';
import PropTypes from 'prop-types';
import styles from './Message.module.css';

/**
 * Message component props
 * @typedef {Object} MessageProps
 * @property {Object} message - Message object
 * @property {boolean} [isStreaming] - Whether the message is streaming
 * @property {boolean} [isLastMessage] - Whether this is the last message
 */

/**
 * Streaming indicator component
 * @returns {JSX.Element}
 */
const StreamingIndicator = () => (
  <div className={styles['streaming-indicator']}>
    <PulseDot delay="0s" />
    <PulseDot delay="0.2s" />
    <PulseDot delay="0.4s" />
  </div>
);

/**
 * Pulse dot component
 * @param {Object} props
 * @param {string} props.delay - Animation delay
 * @returns {JSX.Element}
 */
const PulseDot = ({ delay }) => (
  <div 
    className={styles['pulse-dot']}
    style={{ animationDelay: delay }}
  />
);

/**
 * Message component - Displays chat messages
 * @param {MessageProps} props
 * @returns {JSX.Element}
 */
const Message = ({ message, isStreaming = false, isLastMessage = false }) => {
  const isUser = message.role === 'user';
  const hasError = message.error;
  
  // Extract text content from message parts
  const extractText = (content) => {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map(part => {
        if (typeof part === 'string') return part;
        if (part?.text) return part.text;
        return '';
      }).join('');
    }
    return content?.text || '';
  };

  const messageText = extractText(message.content);

  return (
    <div className={`${styles.message} ${isUser ? styles.user : styles.assistant} ${hasError ? styles.error : ''}`}>
      {/* Avatar */}
      <div className={styles.avatar}>
        {isUser ? (
          <div className={styles['user-avatar']}>👤</div>
        ) : (
          <div className={styles['assistant-avatar']}>🤖</div>
        )}
      </div>

      {/* Message content */}
      <div className={styles['message-content']}>
        <div className={styles['message-header']}>
          <span className={styles['message-role']}>
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className={styles['message-timestamp']}>
            {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
          </span>
        </div>

        <div className={styles['message-text']}>
          {hasError ? (
            <div className={styles['error-content']}>
              <div className={styles['error-icon']}>⚠️</div>
              <div className={styles['error-text']}>
                {message.error.message || 'An error occurred'}
              </div>
            </div>
          ) : (
            <>
              {messageText}
              {isStreaming && isLastMessage && (
                <StreamingIndicator />
              )}
            </>
          )}
        </div>

        {/* Message metadata */}
        <div className={styles['message-meta']}>
          {message.model && (
            <span className={styles['model-info']}>
              {message.model}
            </span>
          )}
          {message.tokenCount && (
            <span className={styles['token-info']}>
              {message.tokenCount} tokens
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

Message.propTypes = {
  message: PropTypes.object.isRequired,
  isStreaming: PropTypes.bool,
  isLastMessage: PropTypes.bool
};

export default Message;
export { StreamingIndicator, PulseDot };