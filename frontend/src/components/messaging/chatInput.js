import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image, Smile, Send, Paperclip, X } from 'lucide-react';
import './chatInput.css';

const ChatInput = ({ onSendMessage, socket, receiverId }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleTyping = () => {
    if (socket && socket.connected) {
      socket.emit('typing_start', { receiverId });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (socket.connected) {
          socket.emit('typing_stop', { receiverId });
        }
      }, 1000);
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file) => {
    if (file.type.startsWith('image/')) {
      setSelectedImage(URL.createObjectURL(file));
      setShowImagePreview(true);
    }
    setSelectedFile(file);
  };
  const handleSend = async () => {
    if ((!message.trim() && !selectedFile) || isSubmitting) return;
  
    try {
      setIsSubmitting(true);
      let fileUrl = null;
  
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const uploadResponse = await fetch('/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`
          }
        });
  
        if (!uploadResponse.ok) {
          throw new Error('File upload failed');
        }
  
        const { url } = await uploadResponse.json();
        fileUrl = url;
      }
  
      const messageData = {
        text: message.trim(), // Ensure message is trimmed
        fileUrl,
        fileType: selectedFile?.type,
        clientMessageId: Date.now().toString() + Math.random().toString(36).substr(2, 9) // Unique ID for deduplication
      };
      
      await onSendMessage(messageData); // Ensure this is called only once
  
      setMessage('');
      setSelectedFile(null);
      setSelectedImage(null);
      setShowImagePreview(false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="chat-input-wrapper"
      onDrop={handleFileDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {selectedFile && (
        <div className="file-preview">
          {showImagePreview ? (
            <div className="image-preview">
              <img src={selectedImage} alt="Preview" />
              <button 
                className="remove-file"
                onClick={() => {
                  setSelectedFile(null);
                  setSelectedImage(null);
                  setShowImagePreview(false);
                }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="file-info">
              <Paperclip size={16} />
              <span>{selectedFile.name}</span>
              <button 
                className="remove-file"
                onClick={() => setSelectedFile(null)}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="input-container">
        <button 
          className="attachment-button"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={20} />
        </button>

        <button 
          className="image-button"
          onClick={() => imageInputRef.current?.click()}
        >
          <Image size={20} />
        </button>

        <textarea
          value={message}
          onChange={handleMessageChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
          className="message-input"
        />

        <button 
          className={`send-button ${message.trim() || selectedFile ? 'active' : ''}`}
          onClick={handleSend}
          disabled={(!message.trim() && !selectedFile) || isSubmitting}
        >
          <Send size={20} />
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ChatInput;