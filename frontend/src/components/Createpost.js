import React, { useState, useEffect } from "react";
import "./Createpost.css";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";

export default function Createpost() {
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [url, setUrl] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Toast functions
  const notifyA = (msg) => toast.error(msg);
  const notifyB = (msg) => toast.success(msg);

  // Fetch current user details when component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/currentUser", {
          headers: {
            "Authorization": "Bearer " + localStorage.getItem("jwt")
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const result = await response.json();
        console.log("Current user data:", result); // Debugging: Log the response

        // Ensure the user data is correctly set
        if (result.user) {
          setUser(result.user); // Assuming the user data is nested under "user"
        } else {
          setUser(result); // If the user data is not nested
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        notifyA("Failed to load user profile");
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    // Save post to MongoDB
    if (url) {
      setLoading(false);
      fetch("/api/createPost", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + localStorage.getItem("jwt")
        },
        body: JSON.stringify({
          body,
          pic: url
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            notifyA(data.error);
          } else {
            notifyB("Successfully Posted");
            navigate("/");
          }
        })
        .catch(err => {
          console.log("Error creating post:", err);
          notifyA("Failed to create post");
        });
    }
  }, [url]);

  // Post image to Cloudinary
  const postDetails = () => {
    if (!image) {
      return notifyA("Please select an image");
    }
    if (!body.trim()) {
      return notifyA("Please add a caption");
    }

    setLoading(true);
    const data = new FormData();
    data.append("file", image);
    data.append("upload_preset", "insta-clone");
    data.append("cloud_name", "cantacloud2");

    fetch("https://api.cloudinary.com/v1_1/cantacloud9/image/upload", {
      method: "post",
      body: data
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Failed to upload image");
        }
        return res.json();
      })
      .then(data => {
        console.log("Cloudinary response:", data); // Debugging: Log Cloudinary response
        if (data.url) {
          setUrl(data.url);
        } else {
          throw new Error("No URL returned from Cloudinary");
        }
      })
      .catch(err => {
        console.log("Cloudinary error:", err);
        setLoading(false);
        notifyA("Failed to upload image: " + err.message);
      });
  };

  const loadfile = (event) => {
    var output = document.getElementById("output");
    output.src = URL.createObjectURL(event.target.files[0]);
    output.onload = function () {
      URL.revokeObjectURL(output.src); // Free memory
    };
  };

  return (
    <div className="createPost">
      {/* Header */}
      <div className="post-header">
        <h4 style={{ margin: "3px auto" }}>Create New Post</h4>
        <button
          id="post-btn"
          onClick={postDetails}
          disabled={loading}
        >
          {loading ? "Posting..." : "Share"}
        </button>
      </div>

      {/* Image Preview */}
      <div className="main-div">
        <img
          id="output"
          src="https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-image-512.png"
          alt="Preview"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            loadfile(event);
            setImage(event.target.files[0]);
          }}
        />
      </div>

      {/* Details */}
      <div className="details">
        <div className="card-header">
          <div className="card-pic">
            <img
              src={user?.Photo || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8cGVyc29ufGVufDB8MnwwfHw%3D&auto=format&fit=crop&w=500&q=60"}
              alt="User profile"
            />
          </div>
          <h5>{user?.name || "Loading..."}</h5>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          type="text"
          placeholder="Write a caption...."
        ></textarea>
      </div>
    </div>
  );
}