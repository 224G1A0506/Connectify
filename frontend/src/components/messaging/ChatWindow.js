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
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('jwt');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Initialize socket connection
  useEffect(() => {
    if (!token || !currentUser) {
      navigate('/signin');
      return;
    }

    // Only create a new socket if one doesn't exist
    if (!socketRef.current) {
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        query: {
          userId: currentUser._id
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        const chatRoom = [currentUser._id, userId].sort().join('-');
        newSocket.emit('join_chat', chatRoom);
        newSocket.emit('user_online', currentUser._id);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        if (error.message.includes('auth')) {
          navigate('/signin');
        }
      });

      // Set up message handling
      newSocket.on('receive_message', (newMessage) => {
        setMessages(prev => {
          // Prevent duplicate messages
          const messageExists = prev.some(msg => msg._id === newMessage._id);
          if (messageExists) return prev;
          return [...prev, newMessage];
        });

        if (newMessage.senderId === userId) {
          markMessagesAsRead(newSocket);
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
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, currentUser?._id, token, navigate]);

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
      
      const data = await response.json();
      setMessages(data);
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
          fileType: messageData.fileType
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
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', newMessage);
      }
      
      // Update messages state only if the message doesn't exist
      setMessages(prev => {
        const messageExists = prev.some(msg => msg._id === newMessage._id);
        if (messageExists) return prev;
        return [...prev, newMessage];
      });
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response?.status === 401) {
        navigate('/signin');
      }
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchUserDetails();
    fetchMessages();
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