import React from 'react';
import './MessageBubble.css';
import { Paperclip } from 'lucide-react';

const MessageBubble = ({ message, isOwn }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className={`message-bubble-container ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && (
        <div className="message-avatar">
          <img 
            src={message.senderAvatar || "/default-avatar.png"} 
            alt="sender"
          />
        </div>
      )}
      <div className="message-content">
        {message.fileUrl && (
          <div className="file-content">
            {message.fileType?.startsWith('image/') ? (
              <img 
                src={message.fileUrl} 
                alt="Shared content" 
                className="shared-image"
                onClick={() => window.open(message.fileUrl, '_blank')}
              />
            ) : (
              <a 
                href={message.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="file-download"
              >
                <Paperclip size={16} />
                Download File
              </a>
            )}
          </div>
        )}
        <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
          <p className="message-text">{message.message}</p>
          <div className="message-info">
            <span className="message-time">
              {formatTime(message.timestamp)}
            </span>
            {isOwn && (
              <span className="message-status">
                {message.isRead ? (
                  <span className="read-status">✓✓</span>
                ) : (
                  <span className="sent-status">✓</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;