import React, { useState, useRef, useCallback, ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import styles from './InputArea.module.css';
import { InputAreaProps, AIModel } from '../../types';

/**
 * InputArea component - Chat input with voice, file upload, and model selection
 */
const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isLoading = false,
  placeholder = "Type your message...",
  selectedModel = '',
  models = [],
  onModelChange,
  enableVoice = false,
  enableFileUpload = false,
  maxLength = 4000,
  showCharCounter = true,
  onVoiceStart,
  onVoiceEnd,
  isRecording = false,
  onFileSelect,
  acceptedFileTypes = ['.txt', '.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'],
  styles: customStyles = {}
}) => {
  const [rows, setRows] = useState<number>(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newRows = Math.min(Math.max(Math.ceil(textarea.scrollHeight / 24), 1), 10);
      setRows(newRows);
      textarea.style.height = `${newRows * 24}px`;
    }
  }, []);

  // Handle input change
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
      adjustTextareaHeight();
    }
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.trim() && !disabled && !isLoading) {
      onSubmit(value.trim());
      adjustTextareaHeight();
    }
  };

  // Handle voice input
  const handleVoiceClick = () => {
    if (isRecording) {
      onVoiceEnd?.();
    } else {
      onVoiceStart?.();
    }
  };

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onFileSelect) {
      onFileSelect(files);
    }
  };

  // Handle file upload click
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle keydown events
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Character counter
  const charCount = value.length;
  const charRemaining = maxLength - charCount;
  const isNearLimit = charRemaining <= 100;

  return (
    <div className={styles['input-area']} style={customStyles}>
      <form onSubmit={handleSubmit} className={styles['input-form']}>
        {/* Controls row */}
        <div className={styles['input-controls']}>
          {/* Model selector */}
          {models.length > 0 ? (
            <select
              value={selectedModel}
              onChange={(e) => onModelChange?.(e.target.value)}
              className={styles['model-selector']}
              disabled={disabled}
            >
              {models.map((model: AIModel) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          ) : null}

          {/* Tool buttons */}
          <div className={styles['tool-buttons']}>
            {enableVoice ? (
              <button
                type="button"
                onClick={handleVoiceClick}
                className={`${styles['tool-button']} ${isRecording ? styles.recording : ''}`}
                disabled={disabled}
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? "⏹️" : "🎤"}
              </button>
            ) : null}

            {enableFileUpload ? (
              <button
                type="button"
                onClick={handleFileUploadClick}
                className={styles['tool-button']}
                disabled={disabled}
                title="Upload file"
              >
                📎
              </button>
            ) : null}
          </div>

          {/* Character counter */}
          {showCharCounter ? (
            <div className={`${styles['char-counter']} ${isNearLimit ? styles.warning : ''}`}>
              {charRemaining}
            </div>
          ) : null}
        </div>

        {/* Text input row */}
        <div className={styles['input-row']}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={styles['text-input']}
            maxLength={maxLength}
          />

          <button
            type="submit"
            disabled={!value.trim() || disabled || isLoading}
            className={styles['send-button']}
            title="Send message"
          >
            {isLoading ? "⏳" : "📤"}
          </button>
        </div>

        {/* Hidden file input */}
        {enableFileUpload ? (
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedFileTypes.join(',')}
            onChange={handleFileChange}
            className={styles['file-input']}
            style={{ display: 'none' }}
          />
        ) : null}
      </form>
    </div>
  );
};

export default InputArea;