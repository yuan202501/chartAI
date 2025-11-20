/**
 * Application constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  ENDPOINTS: {
    CHAT: '/api/chat',
    MODELS: '/api/models'
  },
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3
};

// Chat Configuration
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_MESSAGES_HISTORY: 100,
  STREAMING_TIMEOUT: 120000, // 2 minutes
  DEFAULT_MODEL: 'qwen-plus'
};

// UI Configuration
export const UI_CONFIG = {
  MAX_WIDTH: 1200,
  MESSAGE_MAX_WIDTH: '75%',
  ANIMATION_DURATION: 300,
  SCROLL_DEBOUNCE: 100
};

// Tool Configuration
export const TOOLS = [
  { name: 'AI生图', icon: '🖼️', id: 'image-generation' },
  { name: 'AI写作', icon: '✍️', id: 'ai-writing' },
  { name: 'AI PPT', icon: '📊', id: 'ai-ppt' },
  { name: 'AI编程', icon: '💻', id: 'ai-coding' },
  { name: '深入研究', icon: '🔍', id: 'deep-research' },
  { name: '测运势', icon: '😊', id: 'fortune' },
  { name: '更多', icon: '⋮', id: 'more', hasDot: true }
];

// Model Configuration
export const AI_MODELS = [
  { value: 'qwen-plus', label: 'Qwen Plus', description: 'Enhanced reasoning capabilities' },
  { value: 'qwen-turbo', label: 'Qwen Turbo', description: 'Fast response times' },
  { value: 'qwen-max', label: 'Qwen Max', description: 'Maximum performance' }
];

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  API_ERROR: '服务暂时不可用，请稍后重试',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  INVALID_INPUT: '输入内容无效，请检查后重试',
  STREAM_ERROR: '消息流中断，请稍后重试'
};

// Animation Configuration
export const ANIMATIONS = {
  FADE_IN: {
    duration: 300,
    delay: 100,
    easing: 'ease-in'
  },
  PULSE: {
    duration: 1400,
    easing: 'infinite'
  },
  BLINK: {
    duration: 1000,
    easing: 'infinite'
  }
};