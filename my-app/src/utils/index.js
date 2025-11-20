/**
 * Utility functions for the chat application
 */

/**
 * Generate a unique ID for messages
 * @returns {string} Unique message ID
 */
export const generateMessageId = () => {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate a unique user message ID
 * @returns {string} Unique user message ID
 */
export const generateUserMessageId = () => {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Extract text content from message parts
 * @param {Array} parts - Message parts array
 * @returns {string} Extracted text content
 */
export const extractTextFromParts = (parts = []) => {
  if (!Array.isArray(parts) || parts.length === 0) {
    return '';
  }
  
  const textParts = parts.filter(part => part.type === 'text');
  return textParts
    .map(part => part.text || part.content || part.delta || '')
    .filter(text => text)
    .join('');
};

/**
 * Create a new chat message
 * @param {Object} options - Message options
 * @returns {Object} Formatted chat message
 */
export const createMessage = (options = {}) => {
  const {
    role = 'user',
    content = '',
    parts = [],
    timestamp = Date.now()
  } = options;

  const message = {
    id: role === 'user' ? generateUserMessageId() : generateMessageId(),
    role,
    timestamp,
    parts: parts.length > 0 ? parts : [{ type: 'text', text: content }]
  };

  // Add text property for legacy support
  if (content) {
    message.text = content;
  }

  return message;
};

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Format error messages for display
 * @param {Error|string} error - Error object or message
 * @returns {string} Formatted error message
 */
export const formatError = (error) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

/**
 * Check if input is valid for sending
 * @param {string} input - Input text
 * @returns {Object} Validation result
 */
export const validateInput = (input) => {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Input cannot be empty' };
  }
  
  if (trimmed.length > 4000) {
    return { isValid: false, error: 'Input too long (max 4000 characters)' };
  }
  
  return { isValid: true };
};

/**
 * Scroll to bottom of element with smooth animation
 * @param {HTMLElement} element - Element to scroll
 * @param {Object} options - Scroll options
 */
export const scrollToBottom = (element, options = {}) => {
  const { smooth = true, behavior = 'smooth' } = options;
  
  if (element) {
    element.scrollTo({
      top: element.scrollHeight,
      behavior: smooth ? behavior : 'auto'
    });
  }
};

/**
 * Parse streaming response data
 * @param {string} line - Raw line from streaming response
 * @returns {Object|null} Parsed data or null
 */
export const parseStreamData = (line) => {
  if (!line.trim()) return null;
  
  let jsonStr = '';
  
  // Handle different streaming formats
  if (line.startsWith('0:')) {
    jsonStr = line.substring(2);
  } else if (line.startsWith('d:')) {
    jsonStr = line.substring(2);
  } else if (line.startsWith('e:')) {
    jsonStr = line.substring(2);
  } else {
    return null;
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (parseError) {
    console.warn('Failed to parse stream data:', jsonStr, parseError);
    return null;
  }
};

/**
 * Local storage utilities
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Error writing to localStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Error removing from localStorage:', error);
    }
  }
};