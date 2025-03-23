import React from 'react';
import './MessageBubble.css';
import { Paperclip, RefreshCw } from 'lucide-react';

const MessageBubble = ({ message, isOwn, onRetry }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Handle cases where message object might be malformed
  if (!message) {
    return null;
  }

  // Determine the correct avatar source - handle both object and string sender IDs
  const getSenderAvatar = () => {
    if (message.senderId && typeof message.senderId === 'object' && message.senderId.profilePic) {
      return message.senderId.profilePic;
    }
    
    return message.senderAvatar || "/default-avatar.png";
  };

  return (
    <div className={`message-bubble-container ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && (
        <div className="message-avatar">
          <img 
            src={getSenderAvatar()} 
            alt="sender"
            onError={(e) => { e.target.src = "/default-avatar.png"; }} // Fallback for broken images
          />
        </div>
      )}
      <div className={`message-content ${message.pending ? 'pending' : ''} ${message.failed ? 'failed' : ''}`}>
        {message.fileUrl && (
          <div className="file-content">
            {message.fileType?.startsWith('image/') ? (
              <img 
                src={message.fileUrl} 
                alt="Shared content" 
                className="shared-image"
                onClick={() => window.open(message.fileUrl, '_blank')}
                onError={(e) => { e.target.src = "/default-image.png"; }} // Fallback for broken images
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
          <p className="message-text">{message.message || ''}</p>
          <div className="message-info">
            <span className="message-time">
              {formatTime(message.timestamp)}
            </span>
            {isOwn && (
              <span className="message-status">
                {message.failed ? (
                  <button className="retry-button" onClick={onRetry}>
                    <RefreshCw size={14} /> Retry
                  </button>
                ) : message.pending ? (
                  <span className="pending-status">Sending...</span>
                ) : message.isRead ? (
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