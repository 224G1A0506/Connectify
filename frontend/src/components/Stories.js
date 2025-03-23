import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Stories.css'; // Ensure you have this CSS file for additional styling

const Stories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const picLink = "https://cdn-icons-png.flaticon.com/128/3177/3177440.png";

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("jwt");
        if (!token) {
          navigate("/signup");
          return;
        }

        const response = await fetch("api/stories", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        const currentUser = JSON.parse(localStorage.getItem("user"));
        
        const processedStories = [{
          userId: currentUser._id,
          username: "Your Story",
          imageUrl: currentUser.Photo || picLink,
          isUser: true,
          hasStories: result.userStories.length > 0,
          stories: result.userStories
        }];
        
        const followedStories = result.followingStories.map(user => {
          const hasUnseenStory = user.stories.some(story => 
            !story.seenBy.includes(currentUser._id)
          );
          
          return {
            userId: user._id,
            username: user.name,
            imageUrl: user.Photo || picLink,
            hasUnseenStory,
            stories: user.stories
          };
        });
        
        setStories([...processedStories, ...followedStories]);
      } catch (err) {
        console.error("Error fetching stories:", err);
        toast.error("Failed to load stories");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [navigate]);

  const handleStoryClick = (userId) => {
    navigate(`/stories/${userId}`);
  };

  const handleCreateStory = () => {
    navigate('/create-story');
  };

  if (loading) {
    return (
      <div className="stories-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="stories-container">
      <div className="stories-scroll">
        {stories.map((story) => (
          <div key={story.userId} className="story-item">
            <button 
              className="story-button" 
              onClick={() => story.isUser && !story.hasStories ? handleCreateStory() : handleStoryClick(story.userId)}
            >
              <div className={`story-image-container ${
                story.hasUnseenStory 
                  ? 'unseen-story' 
                  : story.isUser
                  ? 'user-story'
                  : 'seen-story'
              }`}>
                <img
                  src={story.imageUrl}
                  alt={story.username}
                  className="story-image"
                />
                {story.isUser && (
                  <div className="add-story-icon">
                    <span>+</span>
                  </div>
                )}
              </div>
            </button>
            <span className="story-username">{story.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;