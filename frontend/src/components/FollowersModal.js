import React from 'react';
import { Link } from 'react-router-dom';

const FollowersModal = ({ isOpen, onClose, title, users, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading-spinner"></div>
          ) : users && users.length > 0 ? (
            users.map(user => (
              <Link 
                to={`/user/${user._id}`}  // Updated route path
                key={user._id} 
                className="user-item"
                onClick={onClose}
              >
                <img 
                  src={user.Photo || "https://cdn-icons-png.flaticon.com/128/3177/3177440.png"} 
                  alt="profile"
                  onError={(e) => {
                    e.target.src = "https://cdn-icons-png.flaticon.com/128/3177/3177440.png";
                  }}
                />
                <div className="user-info">
                  <h3>{user.name}</h3>
                  {user.userName && <p>@{user.userName}</p>}
                </div>
              </Link>
            ))
          ) : (
            <p className="no-users">No {title.toLowerCase()} yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;
