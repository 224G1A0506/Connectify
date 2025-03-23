import React, { useEffect, useState } from "react";
import PostDetail from "./PostDetail";
import "./Profile.css";
import { useParams } from "react-router-dom";

export default function UserProfile() {
  const DEFAULT_PIC = "https://cdn-icons-png.flaticon.com/128/3177/3177440.png";
  const { userId } = useParams(); // Make sure this matches the route parameter in App.js
  const [isFollow, setIsFollow] = useState(false);
  const [user, setUser] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // to follow user
  const followUser = (userId) => {
    fetch("/api/follow", {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
      body: JSON.stringify({
        followId: userId,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to follow user");
        return res.json();
      })
      .then((data) => {
        console.log(data);
        setIsFollow(true);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to follow user. Please try again.");
      });
  };

  // to unfollow user
  const unfollowUser = (userId) => {
    fetch("/api/unfollow", {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
      body: JSON.stringify({
        unfollowId: userId,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to unfollow user");
        return res.json();
      })
      .then((data) => {
        console.log(data);
        setIsFollow(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to unfollow user. Please try again.");
      });
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (!userId) {
      setError("User ID is missing");
      setLoading(false);
      return;
    }

    fetch(`/api/user/${userId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then(text => {
            console.error("Error response:", text);
            throw new Error(`Failed to fetch user data: ${res.status}`);
          });
        }
        return res.json();
      })
      .then((result) => {
        if (!result.user) throw new Error("User not found");
        
        console.log(result);
        setUser(result.user);
        // Fix the posts state assignment to match backend response structure
        setPosts(result.post || []);
        
        // Check if current user follows this profile
        const currentUserId = JSON.parse(localStorage.getItem("user"))?._id;
        if (currentUserId && result.user.followers?.includes(currentUserId)) {
          setIsFollow(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to load user profile");
        setLoading(false);
      });
  }, [userId, isFollow]);

  if (loading) return <div className="profile">Loading...</div>;
  if (error) return <div className="profile error">{error}</div>;
  if (!user) return <div className="profile">User not found</div>;

  return (
    <div className="profile">
      {/* Profile frame */}
      <div className="profile-frame">
        {/* profile-pic */}
        <div className="profile-pic">
          <img 
            src={user.Photo ? user.Photo : DEFAULT_PIC} 
            alt={`${user.name}'s profile`} 
          />
        </div>
        {/* profile-data */}
        <div className="profile-data">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h1>{user.name}</h1>
            {user._id !== JSON.parse(localStorage.getItem("user"))?._id && (
              <button
                className="followBtn"
                onClick={() => {
                  if (isFollow) {
                    unfollowUser(user._id);
                  } else {
                    followUser(user._id);
                  }
                }}
              >
                {isFollow ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>
          <div className="profile-info" style={{ display: "flex" }}>
            <p>{posts.length} posts</p>
            <p>{user.followers ? user.followers.length : "0"} followers</p>
            <p>{user.following ? user.following.length : "0"} following</p>
          </div>
        </div>
      </div>
      <hr
        style={{
          width: "90%",
          opacity: "0.8",
          margin: "25px auto",
        }}
      />
      {/* Gallery */}
      <div className="gallery">
        {posts.map((pics) => {
          return (
            <img
              key={pics._id}
              src={pics.photo}
              alt={pics.title || "Post image"}
              className="item"
            />
          );
        })}
      </div>
      {posts.length === 0 && (
        <div className="no-posts">No posts yet</div>
      )}
    </div>
  );
}