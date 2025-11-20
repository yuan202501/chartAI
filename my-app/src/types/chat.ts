/**
 * Chat message types and interfaces - TypeScript version
 */

export interface ChatMessagePart {
  type: 'text' | 'image' | 'file';
  text?: string;
  url?: string;
  mimeType?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: ChatMessagePart[];
  text?: string; // Legacy support
  timestamp?: number;
  isStreaming?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  status: 'ready' | 'loading' | 'streaming' | 'error';
  error: Error | null;
  input: string;
  selectedModel: string;
}

export interface ChatConfig {
  apiEndpoint: string;
  maxRetries?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface Tool {
  name: string;
  icon: string;
  hasDot?: boolean;
  onClick?: () => void;
}

export const ChatStatus = {
  READY: 'ready' as const,
  LOADING: 'loading' as const,
  STREAMING: 'streaming' as const,
  ERROR: 'error' as const,
};

export const MessageRole = {
  USER: 'user' as const,
  ASSISTANT: 'assistant' as const,
  SYSTEM: 'system' as const,
};

export const ContentType = {
  TEXT: 'text' as const,
  IMAGE: 'image' as const,
  FILE: 'file' as const,
};

export type ChatStatusType = typeof ChatStatus[keyof typeof ChatStatus];
export type MessageRoleType = typeof MessageRole[keyof typeof MessageRole];
export type ContentTypeType = typeof ContentType[keyof typeof ContentType];