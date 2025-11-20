import React, { useState, useRef } from 'react';

export default function DeepSeekStyleChat() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('ready'); // 'ready' | 'loading' | 'streaming'
  const [error, setError] = useState(null);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('qwen-plus');
  const abortControllerRef = useRef(null);

  // 清理函数
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || status !== 'ready') return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      parts: [{ type: 'text', text: input }]
    };

    // 添加用户消息
    setMessages(prev => [...prev, userMessage]);
    setStatus('streaming');
    setError(null);
    setInput('');

    // 创建助手消息占位符
    const assistantMessageId = `msg-${Date.now()}`;
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      parts: [],
      text: ''
    };
    setMessages(prev => [...prev, assistantMessage]);

    // 创建 AbortController
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: assistantMessageId,
          messages: [...messages, userMessage],
          trigger: 'submit-message'
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
        buffer = lines.pop() || ''; // 保留最后不完整的行

        for (const line of lines) {
          if (!line.trim()) continue;

          // 解析 AI SDK 数据流格式: 0:{...} 或 d:{...} 或 e:{...}
          let jsonStr = '';
          if (line.startsWith('0:')) {
            jsonStr = line.substring(2);
          } else if (line.startsWith('d:')) {
            jsonStr = line.substring(2);
          } else if (line.startsWith('e:')) {
            jsonStr = line.substring(2);
          } else {
            continue;
          }

          try {
            const data = JSON.parse(jsonStr);
            console.log('Parsed chunk:', data);

            if (data.type === 'start') {
              // 流开始
              setStatus('streaming');
            } else if (data.type === 'text-start') {
              textPartId = data.id;
              currentText = '';
            } else if (data.type === 'text-delta') {
              if (data.id === textPartId && data.delta) {
                currentText += data.delta;
                // 更新助手消息
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant' && lastMsg.id === assistantMessageId) {
                    newMessages[newMessages.length - 1] = {
                      ...lastMsg,
                      parts: [{ type: 'text', text: currentText }],
                      text: currentText
                    };
                  }
                  return newMessages;
                });
              }
            } else if (data.type === 'message' && data.message) {
              // 完整消息更新
              if (data.message.id === assistantMessageId) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg && lastMsg.id === assistantMessageId) {
                    newMessages[newMessages.length - 1] = {
                      ...lastMsg,
                      ...data.message,
                      text: data.message.parts?.[0]?.text || currentText
                    };
                  }
                  return newMessages;
                });
              }
            } else if (data.type === 'finish') {
              setStatus('ready');
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Unknown error');
            }
          } catch (parseError) {
            console.warn('Failed to parse chunk:', jsonStr, parseError);
          }
        }
      }

      setStatus('ready');
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Error:', err);
        setError(err);
        setStatus('ready');
      }
    } finally {
      abortControllerRef.current = null;
    }
  };


  const tools = [
    { name: 'AI生图', icon: '🖼️' },
    { name: 'AI写作', icon: '✍️' },
    { name: 'AI PPT', icon: '📊' },
    { name: 'AI编程', icon: '💻' },
    { name: '深入研究', icon: '🔍' },
    { name: '测运势', icon: '😊' },
    { name: '更多', icon: '⋮', hasDot: true },
  ];

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: 20,
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      {/* Main content area */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative',
        minHeight: 'calc(100vh - 260px)'
      }}>

        {/* Error display */}
        {error && (
          <div style={{
            padding: 12,
            marginBottom: 16,
            backgroundColor: '#fee',
            borderRadius: 8,
            color: '#c33',
            fontSize: 14
          }}>
            ⚠️ 错误: {error.message || String(error)}
          </div>
        )}

        {/* Messages - AI Chat Style */}
        <div style={{ marginBottom: 24, maxHeight: '60vh', overflowY: 'auto' }}>
          {messages.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: '#999',
              fontSize: 14
            }}>
              {/* 开始对话，问我任何问题... */}
            </div>
          )}
          {messages.map((m, index) => {
            // 检查是否为流式响应中的最后一条助手消息
            const isStreaming = status === 'streaming' &&
              m.role === 'assistant' &&
              messages[messages.length - 1]?.id === m.id;

            // 获取文本内容 - 更全面的解析
            let textContent = '';
            if (Array.isArray(m.parts) && m.parts.length > 0) {
              // 从 parts 中提取所有文本内容
              const textParts = m.parts.filter(part => part.type === 'text');
              if (textParts.length > 0) {
                textContent = textParts
                  .map(part => {
                    // 支持不同的文本字段名
                    return part.text || part.content || part.delta || '';
                  })
                  .filter(text => text)
                  .join('');
              }
            }

            // 如果没有从 parts 中获取到内容，尝试从消息对象本身获取
            if (!textContent) {
              textContent = m.text || m.content || m.message?.content || '';
            }

            // 调试单个消息
            if (m.role === 'assistant' && !textContent) {
              console.warn('Empty assistant message:', m);
            }

            const isUser = m.role === 'user';

            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  marginBottom: 20,
                  animation: `fadeIn 0.3s ease-in`,
                  animationFillMode: 'both',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: isUser ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                  maxWidth: '75%'
                }}>

                  {/* Message Bubble */}
                  <div style={{
                    backgroundColor: isUser ? '#f0f0f0' : '#ffffff',
                    color: isUser ? '#333' : '#333',
                    padding: '12px 16px',
                    borderRadius: isUser
                      ? '18px 18px 4px 18px'
                      : '18px 18px 18px 4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    position: 'relative',
                    wordBreak: 'break-word',
                    lineHeight: 1.6
                  }}>
                    {/* Message Content */}
                    <div style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: 14
                    }}>
                      {textContent || (isStreaming ? '' : '(空内容)')}
                      {isStreaming && textContent === '' && (
                        <span style={{
                          display: 'inline-flex',
                          gap: 4,
                          alignItems: 'center'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: isUser ? '#fff' : '#1677ff',
                            animation: 'pulse 1.4s infinite',
                            animationDelay: '0s'
                          }} />
                          <span style={{
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: isUser ? '#fff' : '#1677ff',
                            animation: 'pulse 1.4s infinite',
                            animationDelay: '0.2s'
                          }} />
                          <span style={{
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: isUser ? '#fff' : '#1677ff',
                            animation: 'pulse 1.4s infinite',
                            animationDelay: '0.4s'
                          }} />
                        </span>
                      )}
                      {isStreaming && textContent && (
                        <span style={{
                          display: 'inline-block',
                          width: 2,
                          height: 16,
                          backgroundColor: isUser ? '#fff' : '#1677ff',
                          marginLeft: 4,
                          animation: 'blink 1s infinite',
                          verticalAlign: 'middle'
                        }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Streaming indicator */}
          {status === 'submitted' && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: 20
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                maxWidth: '75%'
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#10a37f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  flexShrink: 0
                }}>
                  AI
                </div>
                <div style={{
                  backgroundColor: '#f0f0f0',
                  padding: '12px 16px',
                  borderRadius: '18px 18px 18px 4px',
                  display: 'inline-flex',
                  gap: 4,
                  alignItems: 'center'
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#1677ff',
                    animation: 'pulse 1.4s infinite',
                    animationDelay: '0s'
                  }} />
                  <span style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#1677ff',
                    animation: 'pulse 1.4s infinite',
                    animationDelay: '0.2s'
                  }} />
                  <span style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#1677ff',
                    animation: 'pulse 1.4s infinite',
                    animationDelay: '0.4s'
                  }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 添加 CSS 动画 */}
      <style>{`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      <div 
        className='tools-container' 
        style={{
          border: '1px solid #ddd',
          borderRadius: 12,
          padding: 12,
          backgroundColor: '#fff',
          minHeight: '140px',
          position: 'fixed',
          left: '68px',
          right: '68px',
          bottom: '5px'
        }}
      >
        {/* Tool buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 6,
          paddingTop: 16,
          // borderTop: '1px solid #eee'
        }}>
          {tools.map((tool, idx) => (
            <button
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                border: '1px solid #f6f7fe',
                borderRadius: 20,
                background: '#f6f7fe',
                cursor: 'pointer',
                fontSize: 14,
                position: 'relative'
              }}
            >
              <span>{tool.icon}</span>
              <span>{tool.name}</span>
              {tool.hasDot && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  backgroundColor: '#ff4444',
                  borderRadius: '50%'
                }} />
              )}
            </button>
          ))}
        </div>
        {/* Input area */}
        <div>

          {/* 同一行：左侧 快捷标签/模型选择，右侧 输入框（独立显示） */}
          <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status !== 'ready'}
              placeholder="输入您的问题..."
              style={{
                flex: 1,
                padding: '12px 50px 12px 16px',
                border: '1px solid #fff',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none'
              }}
            />

            {/* 左侧：快捷按钮 + 模型选择（靠左对齐） */}
            <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', gap: 8, transform: 'translateY(100%)', }}>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: 20,
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: 14
              }}>
                <span style={{ fontSize: 16 }}>🔍</span>
                深度搜索
              </button>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: 20,
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: 14
              }}>
                DS-R1
                <span style={{ fontSize: 14 }}>⇄</span>
              </button>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 20, fontSize: 12, background: '#fff' }}
              >
                <option value="qwen-plus">Qwen Plus</option>
                <option value="qwen-turbo">Qwen Turbo</option>
                <option value="qwen-max">Qwen Max</option>
              </select>
            </div>
            <div style={{
              position: 'absolute',
              right: 8,
              top: '70%',
              transform: 'translateY(50%)',
              display: 'flex',
              gap: 8
            }}>
              <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>🎤</button>
              <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>📎</button>
              <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>🖼️</button>
              <button
                type="submit"
                disabled={status !== 'ready'}
                style={{
                  border: 'none',
                  background: '#1677ff',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: status === 'ready' ? 'pointer' : 'not-allowed',
                  opacity: status === 'ready' ? 1 : 0.5
                }}
              >
                ↑
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}

