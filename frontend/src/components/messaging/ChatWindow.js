import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import MessageBubble from './MessageBubble';
import ChatInput from './chatInput';
import OnlineUsers from './OnlineUsers';
import './ChatWindow.css';

const ChatWindow = () => {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserDetails, setOtherUserDetails] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('jwt');
  const currentUser = JSON.parse(localStorage.getItem('user'));
  
  // Use a Map for better performance with message deduplication
  const processedMessageIds = useRef(new Map());
  const pendingMessages = useRef(new Map());
  const reconnectAttempts = useRef(0);

  // Initialize socket connection
  useEffect(() => {
    if (!token || !currentUser) {
      navigate('/signin');
      return;
    }

    // Cleanup function to properly handle disconnects
    const cleanupSocket = () => {
      if (socketRef.current) {
        console.log('Cleaning up previous socket connection');
        // Remove all listeners to prevent duplicate handlers
        socketRef.current.off('receive_message');
        socketRef.current.off('typing_indicator');
        socketRef.current.off('messages_marked_read');
        socketRef.current.off('message_delivered');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };

    // Clean up any existing socket first
    cleanupSocket();

    // Create a new socket connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      query: {
        userId: currentUser._id
      }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
      
      const chatRoom = [currentUser._id, userId].sort().join('-');
      newSocket.emit('join_chat', chatRoom);
      newSocket.emit('user_online', currentUser._id);
      
      // Resend any pending messages that didn't get delivered
      pendingMessages.current.forEach((msgData, clientId) => {
        console.log('Resending pending message', clientId);
        newSocket.emit('send_message', msgData);
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionStatus('error');
      reconnectAttempts.current += 1;
      
      if (reconnectAttempts.current > 5) {
        if (error.message && error.message.includes('auth')) {
          navigate('/signin');
        }
      }
    });

    // Set up message handling with better deduplication
    newSocket.on('receive_message', (newMessage) => {
      console.log('Received message:', newMessage._id);
      
      // Skip processing if we've already seen this message
      if (processedMessageIds.current.has(newMessage._id)) {
        console.log('Skipping duplicate message:', newMessage._id);
        return;
      }
      
      // Add to processed map with timestamp for potential cleanup
      processedMessageIds.current.set(newMessage._id, Date.now());
      
      // Remove from pending if this was our message that got confirmed
      if (newMessage.clientMessageId && pendingMessages.current.has(newMessage.clientMessageId)) {
        pendingMessages.current.delete(newMessage.clientMessageId);
      }
      
      setMessages(prev => {
        // Double-check for duplicates before adding
        if (prev.some(msg => msg._id === newMessage._id)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      if (newMessage.senderId === userId) {
        markMessagesAsRead(newSocket);
      }
    });

    // Confirmation that recipient received the message
    newSocket.on('message_delivered', ({ messageId, receiverId }) => {
      console.log('Message delivered confirmation:', messageId);
      if (pendingMessages.current.has(messageId)) {
        pendingMessages.current.delete(messageId);
      }
    });

    // Set up typing indicator
    newSocket.on('typing_indicator', ({ userId: typingUserId, typing }) => {
      if (typingUserId === userId) {
        setIsTyping(typing);
      }
    });

    // Set up read receipts
    newSocket.on('messages_marked_read', ({ senderId, receiverId }) => {
      if (senderId === currentUser._id && receiverId === userId) {
        setMessages(prev => 
          prev.map(msg => msg.senderId === currentUser._id ? { ...msg, isRead: true } : msg)
        );
      }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Cleanup on component unmount or userId change
    return cleanupSocket;
  }, [userId, currentUser?._id, token, navigate]);

  // Clean up old processed message IDs periodically to prevent memory leaks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      
      processedMessageIds.current.forEach((timestamp, id) => {
        if (timestamp < oneHourAgo) {
          processedMessageIds.current.delete(id);
        }
      });
    }, 60 * 60 * 1000); // Run every hour
    
    return () => clearInterval(cleanupInterval);
  }, []);

  const fetchUserDetails = async () => {
    if (!token || !userId) return;

    try {
      const response = await fetch(`/api/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/signin');
          return;
        }
        throw new Error('Failed to fetch user details');
      }
      
      const data = await response.json();
      if (data) {
        setOtherUserDetails(data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/conversation/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        navigate('/signin');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the processed message IDs set with existing messages
      if (Array.isArray(data)) {
        data.forEach(msg => {
          if (msg && msg._id) {
            processedMessageIds.current.set(msg._id, Date.now());
          }
        });
        
        setMessages(data);
      }
      
      markMessagesAsRead(socketRef.current);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 401) {
        navigate('/signin');
      }
    }
  };

  const markMessagesAsRead = (socket) => {
    if (socket && socket.connected) {
      socket.emit('mark_messages_read', {
        senderId: userId,
        receiverId: currentUser._id
      });
    }
  };

  const handleSendMessage = async (messageData) => {
    if ((!messageData.text.trim() && !messageData.fileUrl) || !token) return;
  
    try {
      // Store in pending messages first
      pendingMessages.current.set(messageData.clientMessageId, {
        ...messageData,
        senderId: currentUser._id,
        receiverId: userId,
        isRead: false,
        timestamp: new Date().toISOString()
      });
      
      // Optimistically add to UI
      const optimisticMessage = {
        _id: 'temp-' + messageData.clientMessageId,
        message: messageData.text,
        fileUrl: messageData.fileUrl,
        fileType: messageData.fileType,
        senderId: currentUser._id,
        receiverId: userId,
        timestamp: new Date().toISOString(),
        isRead: false,
        clientMessageId: messageData.clientMessageId,
        pending: true
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
  
      // Send to server
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: userId,
          message: messageData.text,
          fileUrl: messageData.fileUrl,
          fileType: messageData.fileType,
          clientMessageId: messageData.clientMessageId
        })
      });
  
      if (response.status === 401) {
        navigate('/signin');
        return;
      }
  
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
  
      const newMessage = await response.json();
      
      // Add to processed set to prevent duplication
      processedMessageIds.current.set(newMessage._id, Date.now());
      
      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg._id === 'temp-' + messageData.clientMessageId ? { ...newMessage, clientMessageId: messageData.clientMessageId } : msg
      ));
      
      // If socket is connected, emit the message
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', {
          ...newMessage,
          clientMessageId: messageData.clientMessageId
        });
      } else {
        console.log('Socket not connected, message saved to pending');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error in UI by marking the optimistic message as failed
      setMessages(prev => prev.map(msg => 
        msg.clientMessageId === messageData.clientMessageId 
          ? { ...msg, failed: true } 
          : msg
      ));
      
      if (error.response?.status === 401) {
        navigate('/signin');
      }
    }
  };//Retry sending failed messages
  const handleRetryMessage = (clientMessageId) => {
    if (pendingMessages.current.has(clientMessageId)) {
      const messageData = pendingMessages.current.get(clientMessageId);
      
      // Remove the failed message
      setMessages(prev => prev.filter(msg => msg.clientMessageId !== clientMessageId));
      
      // Try sending again
      handleSendMessage(messageData);
    }
  };

  // Fetch initial data when userId changes
  useEffect(() => {
    if (userId) {
      // Clear processed messages when changing conversations
      processedMessageIds.current.clear();
      pendingMessages.current.clear();
      setMessages([]);
      fetchUserDetails();
      fetchMessages();
    }
  }, [userId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentUser || !token) {
    return null;
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        {otherUserDetails && (
          <>
            <img 
              src={otherUserDetails.profilePic || "/default-avatar.png"} 
              alt="Profile" 
              className="user-avatar"
            />
            <div className="user-info">
              <h3>{otherUserDetails.name}</h3>
              {isTyping && <p className="typing-indicator">typing...</p>}
              {connectionStatus !== 'connected' && (
                <p className="connection-status">
                  {connectionStatus === 'disconnected' ? 'Reconnecting...' : 'Connection error'}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="chat-messages">
        {messages.map(message => (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={message.senderId === currentUser._id}
            onRetry={message.failed ? () => handleRetryMessage(message.clientMessageId) : null}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput 
        onSendMessage={handleSendMessage}
        socket={socket}
        receiverId={userId}
      />
    </div>
  );
};

export default ChatWindow;