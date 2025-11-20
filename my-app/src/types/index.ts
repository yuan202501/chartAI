// 基础类型定义
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | MessagePart[];
  timestamp: Date;
  createdAt?: Date;
  parts?: MessagePart[];
  metadata?: MessageMetadata;
  error?: {
    message: string;
    code?: string;
  };
  model?: string;
  tokenCount?: number;
}

export interface MessagePart {
  type: 'text' | 'image' | 'file' | 'tool';
  content?: string;
  text?: string;
  metadata?: Record<string, any>;
}

export interface MessageMetadata {
  model?: string;
  tokens?: number;
  duration?: number;
  error?: string;
}

export interface AIModel {
  value: string;
  label: string;
  description?: string;
  capabilities?: string[];
}

export interface ChatConfig {
  maxMessageLength: number;
  maxMessagesHistory: number;
  streamingTimeout: number;
  defaultModel: string;
}

export interface APIConfig {
  baseURL: string;
  endpoints: {
    chat: string;
    models: string;
  };
  timeout: number;
  maxRetries: number;
}

export interface Notification {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

export interface Tool {
  name: string;
  icon: string;
  id: string;
  hasDot?: boolean;
  action?: () => void;
}

// 组件 Props 类型
export interface ChatContainerProps {
  title?: string;
  apiEndpoint: string;
  selectedModel: string;
  models?: AIModel[];
  onModelChange?: (model: string) => void;
  predefinedTools?: any[];
  enableVoice?: boolean;
  enableFileUpload?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (response: any) => void;
  styles?: React.CSSProperties;
}

export interface MessageProps {
  message: Message;
  isStreaming?: boolean;
  isLastMessage?: boolean;
  showTimestamp?: boolean;
  maxWidth?: string;
}

export interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  selectedModel?: string;
  models?: AIModel[];
  onModelChange?: (model: string) => void;
  enableVoice?: boolean;
  enableFileUpload?: boolean;
  maxLength?: number;
  showCharCounter?: boolean;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  isRecording?: boolean;
  onFileSelect?: (files: File[]) => void;
  acceptedFileTypes?: string[];
  styles?: React.CSSProperties;
}

export interface ToolButtonProps {
  icon: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
}

// Hook 类型
export interface UseChatReturn {
  messages: Message[];
  input: string;
  isLoading: boolean;
  error: Error | null;
  isStreaming: boolean;
  sendMessage: (message: string) => Promise<void>;
  setInput: (value: string) => void;
  clearMessages: () => void;
  abortRequest: () => void;
  retryLastMessage: () => void;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  currentInput: string;
  isRecording: boolean;
  selectedFiles: File[];
}

// API 响应类型
export interface ChatResponse {
  message: string;
  model: string;
  tokens?: number;
  duration?: number;
}

export interface ModelResponse {
  models: AIModel[];
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

// 工具函数类型
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'text' | 'image' | 'file' | 'tool';
export type NotificationType = 'success' | 'error' | 'info';
export type ToolVariant = 'primary' | 'secondary' | 'danger';
export type ToolSize = 'small' | 'medium' | 'large';

// 泛型工具类型
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// 异步函数类型
export type AsyncFunction<T, R> = (arg: T) => Promise<R>;
export type VoidFunction = () => void;
export type PromiseVoidFunction = () => Promise<void>;

// 事件处理类型
export type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
export type FormEvent = React.FormEvent<HTMLFormElement>;
export type ClickEvent = React.MouseEvent<HTMLButtonElement>;
export type KeyboardEvent = React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>;