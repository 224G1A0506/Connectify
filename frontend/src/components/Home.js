import React, { useEffect, useState } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

export default function Home() {
  const picLink = "https://cdn-icons-png.flaticon.com/128/3177/3177440.png";
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [comments, setComments] = useState({}); // Separate state for comments
  const [show, setShow] = useState(false);
  const [item, setItem] = useState(null);

  const getCurrentUser = () => {
    try {
      const userString = localStorage.getItem("user");
      if (!userString) return null;
      return JSON.parse(userString);
    } catch (err) {
      console.error("Error parsing user data:", err);
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (!token) {
      navigate("./signup");
    }

    // Fetching all posts
    fetch("/allposts", {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
    })
      .then((res) => res.json())
      .then((result) => {
        console.log(result);
        setData(result);
      })
      .catch((err) => console.log(err));
  }, [navigate]);

  const toggleComment = (posts) => {
    if (show) {
      setShow(false);
      setItem(null);
    } else {
      setShow(true);
      setItem(posts);
    }
  };

  const likePost = async (id) => {
    try {
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
      const newData = data.map((posts) => {
        if (posts._id === result._id) {
          return result;
        }
        return posts;
      });
      setData(newData);
    } catch (error) {
      console.error("Error in likePost:", error);
      toast.error("Error liking post");
    }
  };

  const unlikePost = async (id) => {
    try {
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
      const newData = data.map((posts) => {
        if (posts._id === result._id) {
          return result;
        }
        return posts;
      });
      setData(newData);
    } catch (error) {
      console.error("Error in unlikePost:", error);
      toast.error("Error unliking post");
    }
  };

  const makeComment = (text, id) => {
    if (!text.trim()) {
      return toast.error("Comment cannot be empty");
    }

    fetch("/comment", {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("jwt"),
      },
      body: JSON.stringify({
        text: text,
        postId: id,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        const newData = data.map((posts) => {
          if (posts._id === result._id) {
            return result;
          } else {
            return posts;
          }
        });
        setData(newData);
        setComments({ ...comments, [id]: "" });
        toast.success("Comment posted");
      })
      .catch((err) => {
        console.error("Error posting comment:", err);
        toast.error("Error posting comment");
      });
  };

  return (
    <div className="home">
      {data.map((posts) => (
        <div className="card" key={posts._id}>
          <div className="card-header">
            <div className="card-pic">
              <img src={posts.postedBy?.Photo || picLink} alt="" />
            </div>
            <h5>
              <Link to={`/profile/${posts.postedBy?._id}`}>
                {posts.postedBy?.name}
              </Link>
            </h5>
          </div>

          <div className="card-image">
            <img src={posts.photo} alt="" />
          </div>

          <div className="card-content">
            {posts.likes.includes(getCurrentUser()?._id) ? (
              <span
                className="material-symbols-outlined material-symbols-outlined-red"
                onClick={() => unlikePost(posts._id)}
              >
                favorite
              </span>
            ) : (
              <span
                className="material-symbols-outlined"
                onClick={() => likePost(posts._id)}
              >
                favorite
              </span>
            )}

            <p>{posts.likes.length} Likes</p>
            <p>{posts.body}</p>
            <p
              style={{ fontWeight: "bold", cursor: "pointer" }}
              onClick={() => toggleComment(posts)}
            >
              View all comments
            </p>
          </div>

          <div className="add-comment">
            <span className="material-symbols-outlined">mood</span>
            <input
              type="text"
              placeholder="Add a comment"
              value={comments[posts._id] || ""}
              onChange={(e) =>
                setComments({ ...comments, [posts._id]: e.target.value })
              }
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

      {show && item && (
        <div className="showComment">
          <div className="container">
            <div className="postPic">
              <img src={item.photo} alt="" />
            </div>
            <div className="details">
              <div
                className="card-header"
                style={{ borderBottom: "1px solid #00000029" }}
              >
                <div className="card-pic">
                  <img src={item.postedBy?.Photo || picLink} alt="" />
                </div>
                <h5>{item.postedBy?.name}</h5>
              </div>

              <div
                className="comment-section"
                style={{ borderBottom: "1px solid #00000029" }}
              >
                {item.comments.map((comment, index) => (
                  <p className="comm" key={index}>
                    <span className="commenter" style={{ fontWeight: "bolder" }}>
                      {comment.postedBy?.name} {" "}
                    </span>
                    <span className="commentText">{comment.comment}</span>
                  </p>
                ))}
              </div>

              <div className="card-content">
                <p>{item.likes.length} Likes</p>
                <p>{item.body}</p>
              </div>

              <div className="add-comment">
                <span className="material-symbols-outlined">mood</span>
                <input
                  type="text"
                  placeholder="Add a comment"
                  value={comments[item._id] || ""}
                  onChange={(e) =>
                    setComments({ ...comments, [item._id]: e.target.value })
                  }
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
          <div className="close-comment" onClick={toggleComment}>
            <span className="material-symbols-outlined material-symbols-outlined-comment">
              close
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
