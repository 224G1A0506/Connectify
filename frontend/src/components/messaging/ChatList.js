import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { io } from 'socket.io-client';
import './ChatList.css';

const formatMessageTime = (timestamp) => {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Unknown time';
  }
};

const ChatList = () => {
  const [conversations, setConversations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  // Enhanced token verification
  const verifyTokenAndGetUser = useCallback(() => {
    const token = localStorage.getItem('jwt'); // Changed from 'token' to 'jwt'
    const userStr = localStorage.getItem('user');
  
    if (!token || !userStr) {
      console.log('Missing authentication credentials');
      return null;
    }
  
    try {
      const user = JSON.parse(userStr);
      return { token, user };
    } catch (error) {
      console.error('Invalid user data:', error);
      return null;
    }
  }, []);
  
  

  // Fetch conversations with proper auth handling
  const fetchConversations = useCallback(async () => {
    const auth = verifyTokenAndGetUser();
    if (!auth) {
      navigate('/signin');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/messages/chats', {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/signin');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setConversations(data.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        ));
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [navigate, verifyTokenAndGetUser]);

  // Initialize socket connection
  useEffect(() => {
    const auth = verifyTokenAndGetUser();
    if (!auth) {
      navigate('/signin');
      return;
    }

    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token: auth.token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('user_online', auth.user._id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (error.message.includes('auth')) {
        navigate('/signin');
      }
    });

    newSocket.on('user_status_change', ({ userId, status }) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        if (status === 'online') {
          updated.add(userId);
        } else {
          updated.delete(userId);
        }
        return updated;
      });
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [navigate, verifyTokenAndGetUser]);

  // Initial data fetch
  useEffect(() => {
    const auth = verifyTokenAndGetUser();
    if (auth) {
      fetchConversations();
    } else {
      navigate('/signin');
    }
  }, [fetchConversations, navigate, verifyTokenAndGetUser]);

  // Search functionality
  const searchUsers = async (query) => {
    const auth = verifyTokenAndGetUser();
    if (!auth) {
      navigate('/signin');
      return;
    }

    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(`/api/messages/search/users?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        navigate('/signin');
        return;
      }

      if (!response.ok) throw new Error('Search failed');
      
      const users = await response.json();
      setSearchResults(users.filter(user => user._id !== auth.user._id));
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    window.searchTimeout = setTimeout(() => {
      searchUsers(query);
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearching(false);
  };
  const startConversation = async (userId) => {
    const auth = verifyTokenAndGetUser();
    if (!auth) {
      navigate('/signin');
      return;
    }
  
    try {
      const createResponse = await fetch('/api/messages/conversation/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: userId
        })
      });
  
      if (!createResponse.ok) {
        throw new Error('Failed to create conversation');
      }

      const result = await createResponse.json();
  
      // Navigate using the userId directly
      navigate(`/messages/${userId}`);
      clearSearch();
      
      // Refresh conversations list
      await fetchConversations();
    } catch (error) {
      console.error('Error starting conversation:', error);
      setError('Failed to start conversation. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
};
  if (loading) {
    return <div className="loading">Loading conversations...</div>;
  }

  return (
    <div className="chat-list-container">
      <div className="chat-list-header">
        <h2>Messages</h2>
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="clear-search">
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {searching && (
        <div className="search-loading">Searching...</div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {searchQuery && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map(user => (
            <div 
              key={user._id} 
              className="search-result-item"
              onClick={() => startConversation(user._id)}
            >
              <img 
                src={user.profilePic || "/default-avatar.png"} 
                alt={user.name} 
                className="user-avatar"
              />
              <div className="user-info">
                <h4>{user.name}</h4>
                <p>{user.username}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {searchQuery && searchResults.length === 0 && !searching && (
        <div className="no-results">No users found</div>
      )}

      {!searchQuery && (
        <div className="conversations">
          {conversations.length > 0 ? (
            conversations.map(conv => (
              <Link 
                to={`/messages/${conv._id}`} 
                key={conv._id}
                className="conversation-item"
              >
                <div className="conversation-avatar">
                  <img 
                    src={conv.user?.profilePic || "/default-avatar.png"} 
                    alt="Profile" 
                    className="profile-pic"
                  />
                  {onlineUsers.has(conv.user?._id) && (
                    <span className="online-indicator"></span>
                  )}
                </div>

                <div className="conversation-info">
                  <div className="conversation-header">
                    <h4 className="user-name">{conv.user?.name}</h4>
                    <span className="timestamp">
                      {formatMessageTime(conv.timestamp)}
                    </span>
                  </div>

                  <div className="conversation-preview">
                    <p className="last-message">
                      {conv.lastMessage || 'Start a conversation'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="unread-count">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="no-conversations">
              <p>No conversations yet</p>
              <p className="subtitle">
                Search for users to start messaging
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatList;