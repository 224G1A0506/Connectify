import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './ViewStories.css';

const ViewStories = () => {
  const { userId } = useParams();
  const [allStories, setAllStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [error, setError] = useState(null);
  const progressTimer = useRef(null);
  const navigate = useNavigate();
  const storyDuration = 5000; // 5 seconds per story

  useEffect(() => {
    const fetchAllStories = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("jwt");
        
        if (!token) {
          console.error("No JWT token found");
          toast.error("Please sign in to view stories");
          navigate("/signin");
          return;
        }

        console.log("Fetching stories...");
        const response = await fetch("/all-stories", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log("Stories fetched:", result);
        
        if (!Array.isArray(result) || result.length === 0) {
          setAllStories([]);
          return;
        }
        
        setAllStories(result);
        
        // Find index of the requested user
        if (userId) {
          const userIndex = result.findIndex(user => user._id === userId);
          if (userIndex !== -1) {
            setCurrentUserIndex(userIndex);
          }
        }
        
        // Mark first story as seen
        if (result.length > 0 && result[0]?.stories?.length > 0) {
          markAsSeen(result[0].stories[0]._id);
        }
      } catch (err) {
        console.error("Error fetching stories:", err);
        setError(err.message || "Failed to load stories");
        toast.error(err.message || "Failed to load stories");
      } finally {
        setLoading(false);
      }
    };

    fetchAllStories();
    
    // Cleanup function
    return () => {
      if (progressTimer.current) {
        clearTimeout(progressTimer.current);
      }
    };
  }, [userId, navigate]);

  useEffect(() => {
    // Auto-advance to next story after storyDuration
    if (!loading && allStories.length > 0) {
      progressTimer.current = setTimeout(handleNextStory, storyDuration);
    }
    
    return () => {
      if (progressTimer.current) {
        clearTimeout(progressTimer.current);
      }
    };
  }, [currentUserIndex, currentStoryIndex, loading, allStories.length]);

  const markAsSeen = async (storyId) => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) return;
      
      console.log("Marking story as seen:", storyId);
      const response = await fetch(`/story/seen/${storyId}`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
        },
      });
      
      if (!response.ok) {
        console.error("Failed to mark story as seen:", response.status);
      }
    } catch (err) {
      console.error("Error marking story as seen:", err);
    }
  };

  const handleNextStory = () => {
    if (progressTimer.current) {
      clearTimeout(progressTimer.current);
    }
    
    if (allStories.length === 0) return;
    
    const currentUser = allStories[currentUserIndex];
    if (!currentUser || !currentUser.stories || currentUser.stories.length === 0) {
      navigate(-1);
      return;
    }
    
    if (currentStoryIndex < currentUser.stories.length - 1) {
      // Move to next story of same user
      setCurrentStoryIndex(currentStoryIndex + 1);
      if (currentUser.stories[currentStoryIndex + 1]) {
        markAsSeen(currentUser.stories[currentStoryIndex + 1]._id);
      }
    } else if (currentUserIndex < allStories.length - 1) {
      // Move to first story of next user
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
      if (allStories[currentUserIndex + 1]?.stories[0]) {
        markAsSeen(allStories[currentUserIndex + 1].stories[0]._id);
      }
    } else {
      // End of all stories
      navigate(-1);
    }
  };

  const handlePrevStory = () => {
    if (progressTimer.current) {
      clearTimeout(progressTimer.current);
    }
    
    if (allStories.length === 0) return;
    
    if (currentStoryIndex > 0) {
      // Move to previous story of same user
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentUserIndex > 0) {
      // Move to last story of previous user
      const prevUserIndex = currentUserIndex - 1;
      setCurrentUserIndex(prevUserIndex);
      const prevUserStories = allStories[prevUserIndex]?.stories || [];
      setCurrentStoryIndex(Math.max(0, prevUserStories.length - 1));
    } else {
      // First story of first user, do nothing or loop to end
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="view-stories-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-stories-container">
        <div className="no-stories">
          <h3>Error: {error}</h3>
          <button onClick={handleClose}>Close</button>
        </div>
      </div>
    );
  }

  if (allStories.length === 0) {
    return (
      <div className="view-stories-container">
        <div className="no-stories">
          <h3>No stories available</h3>
          <button onClick={handleClose}>Close</button>
          <button onClick={() => navigate("/create-story")} className="mt-2">Create a Story</button>
        </div>
      </div>
    );
  }

  const currentUser = allStories[currentUserIndex];
  if (!currentUser || !currentUser.stories || currentUser.stories.length === 0) {
    return (
      <div className="view-stories-container">
        <div className="no-stories">
          <h3>No stories available for this user</h3>
          <button onClick={handleClose}>Close</button>
        </div>
      </div>
    );
  }

  const currentStory = currentUser.stories[currentStoryIndex];
  if (!currentStory) {
    return (
      <div className="view-stories-container">
        <div className="no-stories">
          <h3>Story not found</h3>
          <button onClick={handleClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="view-stories-container">
      <div className="stories-header">
        <div className="stories-progress">
          {currentUser.stories.map((_, index) => (
            <div 
              key={index} 
              className={`progress-bar ${index === currentStoryIndex ? 'active' : ''} ${index < currentStoryIndex ? 'completed' : ''}`}
            ></div>
          ))}
        </div>
        
        <div className="stories-user-info">
          <img 
            src={currentUser.Photo || currentUser.profilePic || "https://cdn-icons-png.flaticon.com/128/3177/3177440.png"} 
            alt={currentUser.name || currentUser.username} 
            className="stories-user-pic"
          />
          <p className="stories-username">{currentUser.name || currentUser.username}</p>
          <p className="stories-time">
            {new Date(currentStory.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
        
        <button className="stories-close-btn" onClick={handleClose}>×</button>
      </div>
      
      <div className="stories-content">
        {currentStory.mediaType === 'image' ? (
          <img 
            src={currentStory.media} 
            alt="Story" 
            className="stories-media" 
            onError={(e) => {
              console.error("Failed to load image:", e);
              e.target.src = "https://via.placeholder.com/400x600?text=Image+Not+Available";
            }}
          />
        ) : (
          <video 
            src={currentStory.media} 
            controls 
            autoPlay 
            className="stories-media"
            onError={(e) => {
              console.error("Failed to load video:", e);
              e.target.parentNode.innerHTML = "<div style='color:white;text-align:center;'>Video not available</div>";
            }}
          ></video>
        )}
        
        {currentStory.text && (
          <div 
            className={`stories-text ${currentStory.textPosition || 'center'}`}
            style={{ color: currentStory.textColor || '#ffffff' }}
          >
            {currentStory.text}
          </div>
        )}
      </div>
      
      <div className="stories-navigation">
        <div className="nav-left" onClick={handlePrevStory}></div>
        <div className="nav-right" onClick={handleNextStory}></div>
      </div>
    </div>
  );
};

export default ViewStories;