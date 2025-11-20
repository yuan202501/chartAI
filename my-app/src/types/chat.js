/**
 * Chat message types and interfaces
 */

/**
 * @typedef {Object} ChatMessagePart
 * @property {'text' | 'image' | 'file'} type - The type of content
 * @property {string} text - The text content (for text type)
 * @property {string} [url] - URL for images or files
 * @property {string} [mimeType] - MIME type for files
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} id - Unique message identifier
 * @property {'user' | 'assistant' | 'system'} role - Message sender role
 * @property {ChatMessagePart[]} parts - Message content parts
 * @property {string} [text] - Plain text content (legacy support)
 * @property {number} [timestamp] - Message timestamp
 * @property {boolean} [isStreaming] - Whether message is being streamed
 */

/**
 * @typedef {Object} ChatState
 * @property {ChatMessage[]} messages - Array of chat messages
 * @property {'ready' | 'loading' | 'streaming'} status - Current chat status
 * @property {Error | null} error - Any error that occurred
 * @property {string} input - Current input value
 * @property {string} selectedModel - Selected AI model
 */

/**
 * @typedef {Object} ChatConfig
 * @property {string} apiEndpoint - API endpoint for chat
 * @property {number} [maxRetries] - Maximum retry attempts
 * @property {number} [timeout] - Request timeout in milliseconds
 * @property {Object} [headers] - Additional headers
 */

/**
 * @typedef {Object} Tool
 * @property {string} name - Tool name
 * @property {string} icon - Tool emoji/icon
 * @property {boolean} [hasDot] - Whether to show notification dot
 * @property {Function} [onClick] - Click handler
 */

export const ChatStatus = {
  READY: 'ready',
  LOADING: 'loading',
  STREAMING: 'streaming',
  ERROR: 'error'
};

export const MessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system'
};

export const ContentType = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file'
};