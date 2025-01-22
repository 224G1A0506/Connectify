import React, { useEffect, useState, useCallback } from "react";
import "./Home.css";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useTheme } from '../context/ThemeContext';
import EmojiCommentInput from './EmojiCommentInput';

export default function Home() {
  const picLink = "https://cdn-icons-png.flaticon.com/128/3177/3177440.png";
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [comments, setComments] = useState({});
  const [show, setShow] = useState(false);
  const [item, setItem] = useState(null);
  const [isLiking, setIsLiking] = useState({});
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState({});
  const { isDarkMode } = useTheme();

  const getCurrentUser = useCallback(() => {
    try {
      const userString = localStorage.getItem("user");
      if (!userString) return null;
      return JSON.parse(userString);
    } catch (err) {
      console.error("Error parsing user data:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      navigate("/signup");
      return;
    }

    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch("/allposts", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching posts:", err);
        toast.error("Failed to load posts");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [navigate]);

  const followUser = async (userId) => {
    if (followLoading[userId]) return;

    try {
      setFollowLoading(prev => ({ ...prev, [userId]: true }));
      
      const response = await fetch("/follow", {
        method: "put",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("jwt"),
        },
        body: JSON.stringify({
          followId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update local storage
      localStorage.setItem("user", JSON.stringify(result.user));
      
      // Update posts data to reflect new following status
      setData(prevData => 
        prevData.map(post => ({
          ...post,
          postedBy: post.postedBy._id === userId 
            ? { ...post.postedBy, followers: [...post.postedBy.followers || [], getCurrentUser()?._id] }
            : post.postedBy
        }))
      );
      
      toast.success(`Following ${result.followUser.name}`);
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow user");
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const unfollowUser = async (userId) => {
    if (followLoading[userId]) return;

    try {
      setFollowLoading(prev => ({ ...prev, [userId]: true }));
      
      const response = await fetch("/unfollow", {
        method: "put",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("jwt"),
        },
        body: JSON.stringify({
          unfollowId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Update local storage
      localStorage.setItem("user", JSON.stringify(result.user));
      
      // Update posts data to reflect new following status
      setData(prevData => 
        prevData.map(post => ({
          ...post,
          postedBy: post.postedBy._id === userId 
            ? { ...post.postedBy, followers: post.postedBy.followers?.filter(id => id !== getCurrentUser()?._id) }
            : post.postedBy
        }))
      );
      
      toast.success(`Unfollowed ${result.unfollowUser.name}`);
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const likePost = async (id) => {
    if (isLiking[id]) return;

    try {
      setIsLiking(prev => ({ ...prev, [id]: true }));
      
      const likeButton = document.querySelector(`#like-${id}`);
      if (likeButton) {
        likeButton.style.transform = 'scale(1.3)';
        likeButton.style.color = '#ff3366';
        likeButton.style.textShadow = '0 0 20px rgba(255, 51, 102, 0.7)';
      }

      const response = await fetch("/like", {
        method: "put",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("jwt"),
        },
        body: JSON.stringify({ postId: id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(prevData => 
        prevData.map(posts => posts._id === result._id ? result : posts)
      );
    } catch (error) {
      console.error("Error in likePost:", error);
      toast.error("Error liking post");
    } finally {
      setTimeout(() => {
        const likeButton = document.querySelector(`#like-${id}`);
        if (likeButton) {
          likeButton.style.transform = 'scale(1)';
        }
        setIsLiking(prev => ({ ...prev, [id]: false }));
      }, 500);
    }
  };

  const unlikePost = async (id) => {
    if (isLiking[id]) return;

    try {
      setIsLiking(prev => ({ ...prev, [id]: true }));
      
      const likeButton = document.querySelector(`#like-${id}`);
      if (likeButton) {
        likeButton.style.transform = 'scale(0.8)';
      }

      const response = await fetch("/unlike", {
        method: "put",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("jwt"),
        },
        body: JSON.stringify({ postId: id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(prevData => 
        prevData.map(posts => posts._id === result._id ? result : posts)
      );
    } catch (error) {
      console.error("Error in unlikePost:", error);
      toast.error("Error unliking post");
    } finally {
      setTimeout(() => {
        const likeButton = document.querySelector(`#like-${id}`);
        if (likeButton) {
          likeButton.style.transform = 'scale(1)';
        }
        setIsLiking(prev => ({ ...prev, [id]: false }));
      }, 300);
    }
  };

  const makeComment = async (text, postId) => {
    if (!text?.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const response = await fetch("/comment", {
        method: "put",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("jwt"),
        },
        body: JSON.stringify({
          text: text,
          postId: postId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(prevData => 
        prevData.map(posts => posts._id === result._id ? result : posts)
      );
      setComments(prev => ({ ...prev, [postId]: "" }));
      toast.success("Comment posted!");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Error posting comment");
    }
  };

  const toggleComment = useCallback((post) => {
    if (show) {
      document.querySelector('.showComment').style.opacity = '0';
      setTimeout(() => {
        setShow(false);
        setItem(null);
      }, 300);
    } else {
      setItem(post);
      setShow(true);
    }
  }, [show]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading posts...</p>
      </div>
    );
  }

  return (
    <div className={`home ${isDarkMode ? "dark-mode" : "light-mode"}`}>
      {data.map((posts) => (
        <div className="card" key={posts._id}>
          <div className="card-header">
            <div className="card-pic">
              <Link to={`/profile/${posts.postedBy?._id}`}>
                <img 
                  src={posts.postedBy?.Photo || picLink} 
                  alt="profile pic"
                />
              </Link>
            </div>
            <div className="card-header-info">
              <h5>
                <Link to={`/profile/${posts.postedBy?._id}`}>
                  {posts.postedBy?.name || "Unknown User"}
                </Link>
              </h5>
              {getCurrentUser()?._id !== posts.postedBy?._id && (
                <button 
                  className={`follow-button ${posts.postedBy?.followers?.includes(getCurrentUser()?._id) ? 'following' : ''}`}
                  onClick={() => {
                    const isFollowing = posts.postedBy?.followers?.includes(getCurrentUser()?._id);
                    if (isFollowing) {
                      unfollowUser(posts.postedBy?._id);
                    } else {
                      followUser(posts.postedBy?._id);
                    }
                  }}
                  disabled={followLoading[posts.postedBy?._id]}
                >
                  {followLoading[posts.postedBy?._id] 
                    ? 'Loading...'
                    : posts.postedBy?.followers?.includes(getCurrentUser()?._id)
                      ? 'Following'
                      : 'Follow'}
                </button>
              )}
            </div>
          </div>

          <div className="card-image">
            <img src={posts.photo} alt="Post content" loading="lazy" />
          </div>

          <div className="card-content">
            <div className="interaction-buttons">
              {posts.likes.includes(getCurrentUser()?._id) ? (
                <span
                  id={`like-${posts._id}`}
                  className="material-symbols-outlined material-symbols-outlined-red"
                  onClick={() => !isLiking[posts._id] && unlikePost(posts._id)}
                >
                  favorite
                </span>
              ) : (
                <span
                  id={`like-${posts._id}`}
                  className="material-symbols-outlined"
                  onClick={() => !isLiking[posts._id] && likePost(posts._id)}
                >
                  favorite
                </span>
              )}
            </div>
            <p className="likes-count">{posts.likes.length} Likes</p>
            <p className="post-body">{posts.body}</p>
            
            <button className="view-comments-btn" onClick={() => toggleComment(posts)}>
              View all comments
            </button>

            {posts.comments.slice(-2).map((comment, index) => (
              <p className="comm" key={index}>
                <Link to={`/profile/${comment.postedBy?._id}`} className="commenter">
                  {comment.postedBy?.name || "Unknown User"}
                </Link>
                <span className="commentText">{comment.comment}</span>
              </p>
            ))}

            <div className="add-comment-wrapper">
              <EmojiCommentInput 
                value={comments[posts._id] || ""}
                onChange={(text) => setComments(prev => ({ ...prev, [posts._id]: text }))}
                onSubmit={() => makeComment(comments[posts._id], posts._id)}
                placeholder="Add a comment"
              />
            </div>
          </div>
        </div>
      ))}

      {show && item && (
        <div className="showComment">
          <div className="container">
            <div className="postPic">
              <img src={item.photo} alt="Post content" />
            </div>
            <div className="details">
              <div className="card-header">
                <div className="card-pic">
                  <Link to={`/profile/${item.postedBy?._id}`}>
                    <img 
                      src={item.postedBy?.Photo || picLink} 
                      alt="profile"
                    />
                  </Link>
                </div>
                <h5>
                  <Link to={`/profile/${item.postedBy?._id}`}>
                    {item.postedBy?.name || "Unknown User"}
                  </Link>
                </h5>
              </div>

              <div className="comment-section">
                {item.comments.map((comment, index) => (
                  <p className="comm" key={index}>
                    <Link to={`/profile/${comment.postedBy?._id}`} className="commenter">
                      {comment.postedBy?.name}
                    </Link>
                    <span className="commentText">{comment.comment}</span>
                  </p>
                ))}
              </div>

              <div className="add-comment-wrapper">
                <EmojiCommentInput 
                  value={comments[item._id] || ""}
                  onChange={(text) => setComments(prev => ({ ...prev, [item._id]: text }))}
                  onSubmit={() => {
                    makeComment(comments[item._id], item._id);
                    toggleComment();
                  }}
                  placeholder="Add a comment"
                />
              </div>
            </div>
          </div>
          <div className="close-comment" onClick={() => toggleComment()}>
            <span className="material-symbols-outlined material-symbols-outlined-comment">
              close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}