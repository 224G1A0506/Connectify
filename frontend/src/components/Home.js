import React, { useEffect, useState, useCallback } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

export default function Home() {
  const picLink = "https://cdn-icons-png.flaticon.com/128/3177/3177440.png";
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [comments, setComments] = useState({});
  const [show, setShow] = useState(false);
  const [item, setItem] = useState(null);
  const [isLiking, setIsLiking] = useState({});
  const [loading, setLoading] = useState(true);

  // Get current user with error handling
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

  // Input animations effect
  useEffect(() => {
    const inputs = document.querySelectorAll('.add-comment input');
    
    const handleFocus = (e) => {
      e.target.parentElement.style.transform = 'scale(1.02)';
      e.target.parentElement.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.4)';
    };
    
    const handleBlur = (e) => {
      e.target.parentElement.style.transform = 'scale(1)';
      e.target.parentElement.style.boxShadow = 'none';
    };
    
    inputs.forEach(input => {
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
    });
    
    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      });
    };
  }, []);

  // Fetch posts on component mount
  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      navigate("./signup");
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
        console.log("Fetched posts:", result); // Debug log
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

  // Handle profile navigation
  const handleProfileClick = (userId) => {
    if (!userId) {
      console.error("User ID is missing");
      toast.error("Unable to view profile");
      return;
    }
    navigate(`/profile/${userId}`);
  };


  // Enhanced like post function with animations
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
      toast.error("Error liking post", {
        style: {
          background: "rgba(0, 0, 0, 0.9)",
          color: "#fff",
          boxShadow: "0 0 20px rgba(255, 0, 0, 0.3)",
        }
      });
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

  // Enhanced unlike post function
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
      toast.error("Error unliking post", {
        style: {
          background: "rgba(0, 0, 0, 0.9)",
          color: "#fff",
          boxShadow: "0 0 20px rgba(255, 0, 0, 0.3)",
        }
      });
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

  // Enhanced makeComment function with animations
  const makeComment = async (text, id) => {
    if (!text?.trim()) {
      toast.error("Comment cannot be empty", {
        position: "top-center",
        style: {
          background: "rgba(0, 0, 0, 0.9)",
          color: "#fff",
          boxShadow: "0 0 20px rgba(255, 0, 0, 0.3)",
        }
      });
      return;
    }

    try {
      const commentSection = document.querySelector(".comment-section");
      if (commentSection) {
        commentSection.style.transform = "scale(0.98)";
        setTimeout(() => {
          commentSection.style.transform = "scale(1)";
        }, 200);
      }

      const response = await fetch("/comment", {
        method: "put",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("jwt"),
        },
        body: JSON.stringify({
          text: text,
          postId: id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setData(prevData => 
        prevData.map(posts => {
          if (posts._id === result._id) {
            setTimeout(() => {
              const newComment = document.querySelector(".comm:last-child");
              if (newComment) {
                newComment.style.animation = "commentFadeIn 0.5s ease forwards";
              }
            }, 0);
            return result;
          }
          return posts;
        })
      );
      
      setComments(prev => ({ ...prev, [id]: "" }));
      
      toast.success("Comment posted! ✨", {
        position: "top-center",
        style: {
          background: "rgba(0, 0, 0, 0.9)",
          color: "#fff",
          boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)",
        }
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Error posting comment", {
        style: {
          background: "rgba(0, 0, 0, 0.9)",
          color: "#fff",
          boxShadow: "0 0 20px rgba(255, 0, 0, 0.3)",
        }
      });
    }
  };

  // Toggle comment section with animation
  const toggleComment = useCallback((posts) => {
    if (show) {
      document.querySelector('.showComment').style.opacity = '0';
      setTimeout(() => {
        setShow(false);
        setItem(null);
      }, 300);
    } else {
      setItem(posts);
      setShow(true);
    }
  }, [show]);

  // Handle enter key press for comments
  const handleKeyPress = (e, postId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      makeComment(comments[postId], postId);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="home">
      {data.map((posts) => (
        <div className="card" key={posts._id}>
          {/* Card Header with Fixed Profile Link */}
          <div className="card-header">
            <div className="card-pic">
              <img 
                src={posts.postedBy?.Photo || picLink} 
                alt="profile" 
                onClick={() => handleProfileClick(posts.postedBy?._id)}
                style={{ cursor: 'pointer' }}
              />
            </div>
            <h5>
              {posts.postedBy?._id ? (
                <Link to={`/profile/${posts.postedBy._id}`}>
                  {posts.postedBy.name}
                </Link>
              ) : (
                <span>{posts.postedBy?.name || "Unknown User"}</span>
              )}
            </h5>
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
            <p 
              className="view-comments-btn"
              onClick={() => toggleComment(posts)}
            >
              View all comments ({posts.comments.length})
            </p>
          </div>

          {/* Comment Section */}
          <div className="add-comment">
            <span className="material-symbols-outlined">mood</span>
            <input
              type="text"
              placeholder="Add a comment"
              value={comments[posts._id] || ""}
              onChange={(e) =>
                setComments(prev => ({ ...prev, [posts._id]: e.target.value }))
              }
              onKeyPress={(e) => handleKeyPress(e, posts._id)}
            />
            <button
              className="comment"
              onClick={() => makeComment(comments[posts._id], posts._id)}
            >
              Post
            </button>
          </div>
        </div>
      ))}

      {/* Comments Modal */}
      {show && item && (
        <div className="showComment">
          <div className="container">
            <div className="postPic">
              <img src={item.photo} alt="Post content" />
            </div>
            <div className="details">
              {/* Comment Modal Header */}
              <div className="card-header">
                <div className="card-pic">
                  <img 
                    src={item.postedBy?.Photo || picLink} 
                    alt="profile"
                    onClick={() => handleProfileClick(item.postedBy?._id)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <h5>
                  {item.postedBy?._id ? (
                    <Link to={`/profile/${item.postedBy._id}`}>
                      {item.postedBy.name}
                    </Link>
                  ) : (
                    <span>{item.postedBy?.name || "Unknown User"}</span>
                  )}
                </h5>
              </div>

              {/* Comments List */}
              <div className="comment-section">
                {item.comments.map((comment, index) => (
                  <p className="comm" key={index}>
                    <span 
                      className="commenter"
                      onClick={() => handleProfileClick(comment.postedBy?._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {comment.postedBy?.name}
                    </span>
                    <span className="commentText">{comment.comment}</span>
                  </p>
                ))}
              </div>
              <div className="card-content">
                <p className="likes-count">{item.likes.length} Likes</p>
                <p className="post-body">{item.body}</p>
              </div>

              <div className="add-comment">
                <span className="material-symbols-outlined">mood</span>
                <input
                  type="text"
                  placeholder="Add a comment"
                  value={comments[item._id] || ""}
                  onChange={(e) =>
                    setComments(prev => ({ ...prev, [item._id]: e.target.value }))
                  }
                  onKeyPress={(e) => handleKeyPress(e, item._id)}
                />
                <button
                  className="comment"
                  onClick={() => {
                    makeComment(comments[item._id], item._id);
                    toggleComment();
                  }}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
          <div className="close-comment" onClick={() => setShow(false)}>
            <span className="material-symbols-outlined material-symbols-outlined-comment">
              close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}