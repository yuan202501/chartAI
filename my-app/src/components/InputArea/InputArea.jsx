import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './InputArea.module.css';

/**
 * InputArea component props
 * @typedef {Object} InputAreaProps
 * @property {string} value - Input value
 * @property {function} onChange - Change handler
 * @property {function} onSubmit - Submit handler
 * @property {boolean} [disabled] - Disabled state
 * @property {boolean} [isLoading] - Loading state
 * @property {string} [placeholder] - Placeholder text
 * @property {string} [selectedModel] - Selected model
 * @property {Array} [models] - Available models
 * @property {function} [onModelChange] - Model change handler
 * @property {boolean} [enableVoice] - Enable voice input
 * @property {boolean} [enableFileUpload] - Enable file upload
 * @property {number} [maxLength] - Maximum input length
 * @property {boolean} [showCharCounter] - Show character counter
 * @property {function} [onVoiceStart] - Voice start handler
 * @property {function} [onVoiceEnd] - Voice end handler
 * @property {boolean} [isRecording] - Recording state
 * @property {function} [onFileSelect] - File select handler
 * @property {Array} [acceptedFileTypes] - Accepted file types
 * @property {Object} [styles] - Custom styles
 */

/**
 * InputArea component - Chat input with voice, file upload, and model selection
 * @param {InputAreaProps} props
 * @returns {JSX.Element}
 */
const InputArea = ({
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
  const [rows, setRows] = useState(1);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

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
  const handleChange = (e) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
      adjustTextareaHeight();
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
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
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0 && onFileSelect) {
      onFileSelect(files);
    }
  };

  // Handle file upload click
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle keydown events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
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
              {models.map(model => (
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

InputArea.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  placeholder: PropTypes.string,
  selectedModel: PropTypes.string,
  models: PropTypes.array,
  onModelChange: PropTypes.func,
  enableVoice: PropTypes.bool,
  enableFileUpload: PropTypes.bool,
  maxLength: PropTypes.number,
  showCharCounter: PropTypes.bool,
  onVoiceStart: PropTypes.func,
  onVoiceEnd: PropTypes.func,
  isRecording: PropTypes.bool,
  onFileSelect: PropTypes.func,
  acceptedFileTypes: PropTypes.array,
  styles: PropTypes.object
};

export default InputArea;