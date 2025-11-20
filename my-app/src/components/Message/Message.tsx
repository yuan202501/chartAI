import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './Message.module.css';
import { MessageProps, MessagePart } from '../../types';

/**
 * Streaming indicator component
 */
const StreamingIndicator: React.FC = () => (
  <div className={styles['streaming-indicator']}>
    <PulseDot delay="0s" />
    <PulseDot delay="0.2s" />
    <PulseDot delay="0.4s" />
  </div>
);

/**
 * Pulse dot component
 */
interface PulseDotProps {
  delay: string;
}

const PulseDot: React.FC<PulseDotProps> = ({ delay }) => (
  <div 
    className={styles['pulse-dot']}
    style={{ animationDelay: delay }}
  />
);

// 打印机样式文本组件：逐字输出并显示光标
const TypewriterText: React.FC<{
  text: string;
  speed?: number;
  active?: boolean;
}> = ({ text, speed = 20, active = true }) => {
  const [printed, setPrinted] = useState('');
  const targetRef = useRef(text);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    targetRef.current = text;
    // 如果目标文本比当前已打印的文本更长，则继续打印新增部分
    if (printed.length < text.length && active) {
      // 清理旧的 interval，避免重叠
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      intervalRef.current = window.setInterval(() => {
        setPrinted(prev => {
          const nextLen = Math.min(prev.length + 1, targetRef.current.length);
          if (nextLen === targetRef.current.length && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return targetRef.current.slice(0, nextLen);
        });
      }, speed);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [text, active, speed, printed.length]);

  // 初次渲染或失活时直接显示已有文本
  useEffect(() => {
    if (!active && printed !== text) {
      setPrinted(text);
    }
  }, [active, text, printed]);

  const showCaret = active || printed.length < text.length;

  return (
    <div className={styles.typewriter}>
      {printed}
      {showCaret && <span className={styles.caret} />}
    </div>
  );
};

/**
 * Message component - Displays chat messages
 */
const Message: React.FC<MessageProps> = ({ message, isStreaming = false, isLastMessage = false }) => {
  const isUser = message.role === 'user';
  const hasError = message.error;

  // 从 message.parts 或 message.content 提取文本（优先 parts）
  const extractMessageText = (msg: MessageProps['message']): string => {
    if (Array.isArray(msg.parts) && msg.parts.length > 0) {
      return msg.parts
        .map((part) => {
          if (typeof part === 'string') return part;
          return part?.text ?? part?.content ?? '';
        })
        .join('');
    }

    if (typeof msg.content === 'string') {
      return msg.content;
    }

    if (Array.isArray(msg.content)) {
      return msg.content
        .map((part: MessagePart | string) => {
          if (typeof part === 'string') return part;
          return part?.text ?? part?.content ?? '';
        })
        .join('');
    }

    return '';
  };

  const messageText = extractMessageText(message);

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
                {message.error?.message || 'An error occurred'}
              </div>
            </div>
          ) : (
            <>
              {isUser ? (
                // 用户消息直接显示
                <span>{messageText}</span>
              ) : (
                // 助手消息使用打印机样式；在流式或最后一条时启用动画
                <TypewriterText text={messageText} active={isStreaming || isLastMessage} />
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

export default Message;
export { StreamingIndicator, PulseDot };