import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './OnlineUsers.css';

const OnlineUsers = ({ socket }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [userDetails, setUserDetails] = useState({});

  useEffect(() => {
    if (!socket) return;

    const fetchUserDetails = async (userId) => {
      try {
        const response = await fetch(`/user/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setUserDetails(prev => ({ ...prev, [userId]: data }));
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    socket.on('user_status_change', ({ userId, status }) => {
      setOnlineUsers(prev => {
        if (status === 'online' && !prev.includes(userId)) {
          fetchUserDetails(userId);
          return [...prev, userId];
        } else if (status === 'offline') {
          return prev.filter(id => id !== userId);
        }
        return prev;
      });
    });

    // Fetch initial online users
    const fetchOnlineUsers = async () => {
      try {
        const response = await fetch('/users/online', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setOnlineUsers(data.map(user => user._id));
        data.forEach(user => {
          setUserDetails(prev => ({ ...prev, [user._id]: user }));
        });
      } catch (error) {
        console.error('Error fetching online users:', error);
      }
    };

    fetchOnlineUsers();

    return () => {
      socket.off('user_status_change');
    };
  }, [socket]);

  return (
    <div className="online-users-container">
      <h3 className="online-users-title">Active Now</h3>
      <div className="online-users-list">
        {onlineUsers
          .filter(userId => userId !== currentUser._id)
          .map(userId => {
            const user = userDetails[userId];
            return user ? (
              <Link 
                to={`/messages/${userId}`} 
                key={userId} 
                className="online-user-item"
              >
                <div className="online-user-avatar">
                  <img 
                    src={user.profilePic || "/default-avatar.png"} 
                    alt={user.username} 
                  />
                  <span className="online-indicator"></span>
                </div>
                <span className="online-username">{user.username}</span>
              </Link>
            ) : null;
          })}
        {onlineUsers.length <= 1 && (
          <div className="no-online-users">
            No active users right now
          </div>
        )}
      </div>
    </div>
  );
};

export default OnlineUsers;
