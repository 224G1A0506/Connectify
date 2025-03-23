import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './StoryViewer.css';

const StoryViewer = () => {
  const { userId } = useParams();
  const [stories, setStories] = useState([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef(null);
  const navigate = useNavigate();
  const storyDuration = 5000; // 5 seconds per story

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("jwt");
        if (!token) {
          navigate("/signup");
          return;
        }

        const response = await fetch(`/api/stories/${userId}`, {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setStories(result.stories);
        setUser(result.user);
        
        // Mark story as seen
        if (result.stories.length > 0) {
          markAsSeen(result.stories[0]._id);
        }
      } catch (err) {
        console.error("Error fetching stories:", err);
        toast.error("Failed to load stories");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();

    // Cleanup progress interval when component unmounts
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [userId, navigate]);

  useEffect(() => {
    // Reset progress and clear any existing interval when changing stories
    setProgress(0);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    // Start progress for current story
    if (stories.length > 0) {
      // Mark the current story as seen
      markAsSeen(stories[currentStoryIndex]._id);

      // Set up progress interval
      const intervalTime = 50; // Update progress every 50ms
      const totalSteps = storyDuration / intervalTime;
      const incrementPerStep = 100 / totalSteps;

      progressInterval.current = setInterval(() => {
        setProgress(prevProgress => {
          if (prevProgress >= 100) {
            clearInterval(progressInterval.current);
            // Move to next story after progress completes
            if (currentStoryIndex < stories.length - 1) {
              setCurrentStoryIndex(currentStoryIndex + 1);
            } else {
              // If this is the last story, navigate back
              setTimeout(() => navigate(-1), 100);
            }
            return 0;
          }
          return prevProgress + incrementPerStep;
        });
      }, intervalTime);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentStoryIndex, stories.length, navigate]);

  const markAsSeen = async (storyId) => {
    try {
      const token = localStorage.getItem("jwt");
      await fetch(`/api/story/seen/${storyId}`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
        },
      });
    } catch (err) {
      console.error("Error marking story as seen:", err);
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      // Navigate to previous user's stories if available
      navigate(-1);
    }
  };

  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      // Navigate to next user's stories if available or go back
      navigate(-1);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="story-viewer-loading">
        <div className="story-loading-spinner"></div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="story-viewer-container">
        <div className="story-no-content">
          <h3>No stories available</h3>
          <button onClick={handleClose}>Close</button>
        </div>
      </div>
    );
  }

  const currentStory = stories[currentStoryIndex];
  const isImage = currentStory.mediaType === 'image';
  const formattedTime = new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="story-viewer-container">
      {/* Progress bars */}
      <div className="story-progress-container">
        {stories.map((_, index) => (
          <div key={index} className="story-progress-bar-container">
            <div 
              className="story-progress-bar"
              style={{ 
                width: index === currentStoryIndex ? `${progress}%` : 
                       index < currentStoryIndex ? '100%' : '0%'
              }}
            ></div>
          </div>
        ))}
      </div>

      {/* User info */}
      <div className="story-header">
        <div className="story-user-info">
          <img 
            src={user?.Photo || "https://cdn-icons-png.flaticon.com/128/3177/3177440.png"} 
            alt={user?.name} 
            className="story-user-pic"
          />
          <div className="story-user-details">
            <p className="story-username">{user?.name}</p>
            <p className="story-time">{formattedTime}</p>
          </div>
        </div>
        <button className="story-close-btn" onClick={handleClose}>×</button>
      </div>

      {/* Story content */}
      <div className="story-content">
        {isImage ? (
          <img src={currentStory.media} alt="Story" className="story-media" />
        ) : (
          <video 
            src={currentStory.media} 
            autoPlay 
            muted={false} 
            className="story-media"
            onPlay={() => {
              if (progressInterval.current) clearInterval(progressInterval.current);
            }}
            onEnded={handleNextStory}
          />
        )}

        {/* Text overlay if exists */}
        {currentStory.text && (
          <div className="story-text-overlay">
            {currentStory.text}
          </div>
        )}
      </div>

      {/* Navigation controls */}
      <div className="story-navigation">
        <div className="story-nav-button story-prev" onClick={handlePrevStory}></div>
        <div className="story-nav-button story-next" onClick={handleNextStory}></div>
      </div>
    </div>
  );
};

export default StoryViewer;