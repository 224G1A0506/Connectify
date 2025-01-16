import React, { useEffect, useState, useContext } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import {LoginContext} from "../../context/LoginContext"

import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import OnlineUsers from './OnlineUsers';

const MessagingContainer = () => {
  const navigate = useNavigate();
  const { setUserLogin } = useContext(LoginContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('jwt'); // Changed from 'token' to 'jwt'
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        setIsAuthenticated(false);
        setIsLoading(false);
        setUserLogin(false);
        navigate('/signin');
        return;
      }

      try {
        const response = await fetch('/api/messages/verify-auth', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (response.ok && data.valid) {
          setIsAuthenticated(true);
          setUserLogin(true);
        } else {
          // Clear invalid credentials
          localStorage.removeItem('jwt');
          localStorage.removeItem('user');
          setUserLogin(false);
          navigate('/signin');
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        setUserLogin(false);
        setIsAuthenticated(false);
        navigate('/signin');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [navigate, setUserLogin]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="messaging-container" style={{ display: 'flex', height: '100vh' }}>
      <ChatList />
      <Routes>
        <Route 
          path=":userId" 
          element={
            <>
              <ChatWindow />
              <OnlineUsers />
            </>
          } 
        />
        <Route 
          path="/" 
          element={
            <div className="select-conversation">
              <h2>Select a conversation to start messaging</h2>
            </div>
          } 
        />
      </Routes>
    </div>
  );
};

export default MessagingContainer;
