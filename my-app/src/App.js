import React, { useState } from 'react';
import { ChatContainer } from './components';
import { AI_MODELS } from './constants';
import './styles/variables.css';
import './App.css';

function App() {
  const [selectedModel, setSelectedModel] = useState('qwen-plus');
  const [notifications, setNotifications] = useState([]);

  const handleError = (error) => {
    console.error('Chat error:', error);
    // Add notification for user
    const notification = {
      id: Date.now(),
      type: 'error',
      message: error.message || 'An error occurred',
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const handleSuccess = (response) => {
    console.log('Chat success:', response);
    // Optional: Add success notification
    if (response?.message) {
      const notification = {
        id: Date.now(),
        type: 'success',
        message: response.message,
        timestamp: new Date()
      };
      setNotifications(prev => [...prev, notification]);
      
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 3000);
    }
  };

  const handleModelChange = (model) => {
    setSelectedModel(model);
    console.log('Model changed to:', model);
  };

  return (
    <div className="App">
      {/* Global Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-container">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification notification-${notification.type}`}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}

      {/* Main Chat Container */}
      <ChatContainer
        title="AI Assistant"
        apiEndpoint="/api/chat"
        selectedModel={selectedModel}
        models={AI_MODELS}
        onModelChange={handleModelChange}
        enableVoice={true}
        enableFileUpload={true}
        onError={handleError}
        onSuccess={handleSuccess}
        styles={{
          maxWidth: '800px',
          margin: '0 auto',
          minHeight: '100vh',
          padding: '20px'
        }}
      />
    </div>
  );
}

export default App;
