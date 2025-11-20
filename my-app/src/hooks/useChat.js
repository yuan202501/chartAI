/**
 * Custom hook for managing chat state and operations
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  generateMessageId, 
  generateUserMessageId, 
  createMessage, 
  parseStreamData, 
  validateInput,
  formatError,
  extractTextFromParts 
} from '../utils';
import { API_CONFIG, CHAT_CONFIG, ERROR_MESSAGES } from '../constants';

/**
 * Custom hook for chat functionality
 * @param {Object} options - Hook options
 * @returns {Object} Chat state and methods
 */
export const useChat = (options = {}) => {
  const {
    apiEndpoint = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHAT}`,
    maxRetries = API_CONFIG.MAX_RETRIES,
    timeout = CHAT_CONFIG.STREAMING_TIMEOUT,
    onError = () => {},
    onSuccess = () => {}
  } = options;

  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState(null);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(CHAT_CONFIG.DEFAULT_MODEL);
  
  const abortControllerRef = useRef(null);
  const retryCountRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Send a message to the chat API
   */
  const sendMessage = useCallback(async (messageContent) => {
    // Validate input
    const validation = validateInput(typeof messageContent === 'string' ? messageContent : messageContent.text || '');
    if (!validation.isValid) {
      const error = new Error(validation.error);
      setError(error);
      onError(error);
      return;
    }

    // Create user message
    const userMessage = createMessage({
      role: 'user',
      content: typeof messageContent === 'string' ? messageContent : messageContent.text
    });

    // Add user message to state
    setMessages(prev => [...prev, userMessage]);
    setStatus('streaming');
    setError(null);
    setInput('');

    // Create assistant message placeholder
    const assistantMessageId = generateMessageId();
    const assistantMessage = createMessage({
      id: assistantMessageId,
      role: 'assistant',
      content: ''
    });
    
    setMessages(prev => [...prev, assistantMessage]);

    // Create AbortController
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: assistantMessageId,
          messages: [...messages, userMessage],
          model: selectedModel,
          trigger: 'submit-message'
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await processStreamResponse(response, assistantMessageId);
      
      // Reset retry count on success
      retryCountRef.current = 0;
      onSuccess();
      
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request aborted');
        setStatus('ready');
      } else {
        console.error('Chat error:', err);
        
        // Retry logic
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`Retrying... (${retryCountRef.current}/${maxRetries})`);
          
          // Remove the failed assistant message and retry
          setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
          
          // Retry after delay
          setTimeout(() => {
            sendMessage(messageContent);
          }, 1000 * retryCountRef.current);
          
        } else {
          // Max retries reached
          const formattedError = formatError(err);
          setError(formattedError);
          setStatus('ready');
          onError(formattedError);
          
          // Update assistant message with error
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && lastMsg.id === assistantMessageId) {
              lastMsg.error = formattedError;
              lastMsg.parts = [{ type: 'text', text: `抱歉，出现了错误: ${formattedError}` }];
            }
            return newMessages;
          });
        }
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [messages, apiEndpoint, maxRetries, onError, onSuccess, selectedModel]);

  /**
   * Process streaming response
   */
  const processStreamResponse = async (response, messageId) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentText = '';
    let textPartId = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const data = parseStreamData(line);
        if (!data) continue;

        try {
          if (data.type === 'start') {
            setStatus('streaming');
          } else if (data.type === 'text-start') {
            textPartId = data.id;
            currentText = '';
          } else if (data.type === 'text-delta') {
            if (data.id === textPartId && data.delta) {
              currentText += data.delta;
              updateAssistantMessage(messageId, currentText);
            }
          } else if (data.type === 'message' && data.message) {
            // 放宽匹配：不强制要求服务端 message.id 与本地一致
            const finalText =
              extractTextFromParts(data.message.parts || []) ||
              data.message.text ||
              data.message.content ||
              currentText;

            updateAssistantMessage(messageId, finalText);
          } else if (data.type === 'finish') {
            setStatus('ready');
          } else if (data.type === 'error') {
            throw new Error(data.error || 'Unknown error');
          }
        } catch (parseError) {
          console.warn('Failed to process stream data:', data, parseError);
        }
      }
    }

    // 处理缓冲区中最后一行（无换行的单块响应）
    if (buffer.trim()) {
      const data = parseStreamData(buffer);
      if (data) {
        try {
          if (data.type === 'message' && data.message) {
            const finalText =
              extractTextFromParts(data.message.parts || []) ||
              data.message.text ||
              data.message.content ||
              currentText;

            updateAssistantMessage(messageId, finalText);
          } else if (data.type === 'finish') {
            setStatus('ready');
          }
        } catch (parseError) {
          console.warn('Failed to process last buffer data:', data, parseError);
        }
      }
    }

    setStatus('ready');
  };

  /**
   * Update assistant message content
   */
  const updateAssistantMessage = (messageId, text) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const lastMsg = newMessages[newMessages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        newMessages[newMessages.length - 1] = {
          ...lastMsg,
          parts: [{ type: 'text', text }],
          text
        };
      }
      return newMessages;
    });
  };

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setStatus('ready');
  }, []);

  /**
   * Abort current request
   */
  const abortRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatus('ready');
    }
  }, []);

  return {
    messages,
    status,
    error,
    input,
    selectedModel,
    isLoading: status === 'streaming',
    isStreaming: status === 'streaming',
    setInput,
    setSelectedModel,
    sendMessage,
    clearMessages,
    abortRequest,
    retryLastMessage: () => {
      const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
      if (lastUserMessage) {
        sendMessage(lastUserMessage.parts?.[0]?.text || lastUserMessage.text);
      }
    }
  };
};

/**
 * Custom hook for managing chat history
 */
export const useChatHistory = (storageKey = 'chat-history') => {
  const [history, setHistory] = useState([]);

  const saveToHistory = useCallback((messages) => {
    const chatSession = {
      id: generateMessageId(),
      timestamp: Date.now(),
      messages: messages,
      title: messages[0]?.parts?.[0]?.text?.substring(0, 50) || 'New Chat'
    };
    
    setHistory(prev => [chatSession, ...prev.slice(0, 9)]); // Keep last 10
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const deleteFromHistory = useCallback((sessionId) => {
    setHistory(prev => prev.filter(session => session.id !== sessionId));
  }, []);

  return {
    history,
    saveToHistory,
    clearHistory,
    deleteFromHistory
  };
};