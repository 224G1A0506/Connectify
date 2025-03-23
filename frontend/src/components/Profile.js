import React, { useEffect, useState, useCallback } from "react";
import PostDetail from "./PostDetail";
import "./Profile.css";
import ProfilePic from "./ProfilePic";
import FollowersModal from "./FollowersModal";
import { useParams } from "react-router-dom";

export default function Profile() {
  const DEFAULT_PIC = "https://cdn-icons-png.flaticon.com/128/3177/3177440.png";
  const RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000;
  const { userid } = useParams();
  
  const [profileData, setProfileData] = useState({
    posts: [],
    user: null,
    selectedPost: null
  });

  const [modalState, setModalState] = useState({
    showPostDetail: false,
    showProfilePicChange: false,
    showFollowersModal: false,
    showFollowingModal: false
  });

  const [followData, setFollowData] = useState({
    followers: [],
    following: [],
    followerCount: 0,
    followingCount: 0
  });

  const [loadingStates, setLoadingStates] = useState({
    profile: true,
    modal: false,
    imageLoading: {},
    followData: false
  });

  const [error, setError] = useState({
    type: null,
    message: null,
    details: null
  });

  const fetchFollowData = useCallback(async (type, retryCount = RETRY_ATTEMPTS) => {
    try {
      setError(prev => ({ ...prev, [type]: null }));
      setLoadingStates(prev => ({ ...prev, followData: true }));
      
      const userData = JSON.parse(localStorage.getItem("user"));
      const targetUserId = userid || userData?._id;  // Use URL param if available, else logged-in user
      
      if (!targetUserId) {
        throw new Error("User ID not found");
      }

      const response = await fetch(`/api/user/${targetUserId}/${type}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("jwt")
        },
        method: "GET"
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response text: ${errorText}`);
        throw new Error(`Failed to fetch ${type} (Status: ${response.status})`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(`Error parsing ${type} JSON:`, jsonError);
        throw new Error(`Invalid ${type} data format received`);
      }
      
      if (!data || typeof data !== 'object') {
        throw new Error(`Invalid ${type} data received`);
      }

      setFollowData(prev => {
        const updatedData = {
          ...prev,
          [type]: data[type] || [],
        };
        
        if (type === 'followers') {
          updatedData.followerCount = data[type]?.length || 0;
        } else if (type === 'following') {
          updatedData.followingCount = data[type]?.length || 0;
        }
        
        return updatedData;
      });

    } catch (err) {
      console.error(`${type} fetch error:`, err);
      
      if (retryCount > 0) {
        console.log(`Retrying ${type} fetch... (${retryCount} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchFollowData(type, retryCount - 1);
      }

      setError({
        type,
        message: `Unable to load ${type} data. Please try again.`,
        details: err.message
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, followData: false }));
    }
  }, [userid]); 

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoadingStates(prev => ({ ...prev, profile: true }));
        
        const userData = JSON.parse(localStorage.getItem("user"));
        const targetUserId = userid || userData?._id;

        if (!targetUserId) {
          throw new Error("User ID not found");
        }

        const response = await fetch(`/api/user/${targetUserId}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("jwt")
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error response text: ${errorText}`);
          throw new Error(`Profile fetch failed: ${response.status}`);
        }

        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error("Error parsing profile JSON:", jsonError);
          throw new Error("Invalid profile data format received");
        }
        
        setProfileData({
          posts: result.post || [],
          user: result.user,
          selectedPost: null
        });

        if (result.user) {
          setFollowData(prev => ({
            ...prev,
            followerCount: result.user.followers?.length || 0,
            followingCount: result.user.following?.length || 0
          }));
        }

        // Fetch follow data only if profile data was successfully loaded
        await Promise.all([
          fetchFollowData('followers'),
          fetchFollowData('following')
        ]);

      } catch (err) {
        console.error("Profile fetch error:", err);
        setError({
          type: 'profile',
          message: "Failed to load profile. Please refresh the page.",
          details: err.message
        });
      } finally {
        setLoadingStates(prev => ({ ...prev, profile: false }));
      }
    };

    fetchProfileData();
  }, [fetchFollowData, userid]);

  const handleFollowersClick = useCallback(async () => {
    setModalState(prev => ({ ...prev, showFollowersModal: true }));
    await fetchFollowData('followers');
  }, [fetchFollowData]);

  const handleFollowingClick = useCallback(async () => {
    setModalState(prev => ({ ...prev, showFollowingModal: true }));
    await fetchFollowData('following');
  }, [fetchFollowData]);

  const togglePostDetail = useCallback((post = null) => {
    setModalState(prev => ({ ...prev, showPostDetail: !prev.showPostDetail }));
    setProfileData(prev => ({ ...prev, selectedPost: post }));
  }, []);

  const toggleProfilePicChange = useCallback(() => {
    setModalState(prev => ({ 
      ...prev, 
      showProfilePicChange: !prev.showProfilePicChange 
    }));
  }, []);

  const handleImageLoad = useCallback((id) => {
    setLoadingStates(prev => ({
      ...prev,
      imageLoading: { ...prev.imageLoading, [id]: true }
    }));
  }, []);

  if (loadingStates.profile) {
    return (
      <div className="profile">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile-frame">
        <div className="profile-pic">
          <img
            onClick={toggleProfilePicChange}
            src={profileData.user?.Photo || DEFAULT_PIC}
            alt="Profile"
            onError={(e) => {
              e.target.src = DEFAULT_PIC;
            }}
            onLoad={() => handleImageLoad('profile')}
          />
        </div>

        <div className="profile-data">
          <h1>{profileData.user?.name || 'User'}</h1>
          <div className="profile-info">
            <p>{profileData.posts.length} posts</p>
            <p 
              onClick={handleFollowersClick}
              style={{ cursor: 'pointer' }}
              className="follow-stat"
            >
              {followData.followerCount} followers
            </p>
            <p 
              onClick={handleFollowingClick}
              style={{ cursor: 'pointer' }}
              className="follow-stat"
            >
              {followData.followingCount} following
            </p>
          </div>
        </div>
      </div>

      {error.message && (
        <div className="error-message">
          <p>{error.message}</p>
          <button onClick={() => {
            setError({ type: null, message: null, details: null });
            fetchFollowData('followers');
            fetchFollowData('following');
          }} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      <div className="gallery">
        {profileData.posts.map((post) => (
          <img
            key={post._id}
            src={post.photo}
            onClick={() => togglePostDetail(post)}
            className="item"
            alt={post.body || "Post"}
            onLoad={() => handleImageLoad(post._id)}
          />
        ))}
      </div>

      {modalState.showPostDetail && (
        <PostDetail 
          item={profileData.selectedPost} 
          toggleDetails={togglePostDetail}
        />
      )}
      
      {modalState.showProfilePicChange && (
        <ProfilePic 
          changeprofile={toggleProfilePicChange}
        />
      )}

      <FollowersModal 
        isOpen={modalState.showFollowersModal}
        onClose={() => setModalState(prev => ({
          ...prev,
          showFollowersModal: false
        }))}
        title="Followers"
        users={followData.followers}
        loading={loadingStates.followData}
      />
      
      <FollowersModal 
        isOpen={modalState.showFollowingModal}
        onClose={() => setModalState(prev => ({
          ...prev,
          showFollowingModal: false
        }))}
        title="Following"
        users={followData.following}
        loading={loadingStates.followData}
      />
    </div>
  );
}