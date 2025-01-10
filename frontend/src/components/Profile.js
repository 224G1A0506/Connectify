import React, { useEffect, useState } from "react";
import PostDetail from "./PostDetail";
import "./Profile.css";
import ProfilePic from "./ProfilePic";

export default function Profile() {
  const picLink = "https://cdn-icons-png.flaticon.com/128/3177/3177440.png";
  const [pic, setPic] = useState([]);
  const [show, setShow] = useState(false);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState("");
  const [changePic, setChangePic] = useState(false);
  const [error, setError] = useState(null);

  const toggleDetails = (posts) => {
    setShow(!show);
    setPosts(posts);
  };

  const changeprofile = () => {
    setChangePic(!changePic);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/user/${JSON.parse(localStorage.getItem("user"))._id}`,
          {
            headers: {
              Authorization: "Bearer " + localStorage.getItem("jwt"),
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.json();
        setPic(result.post);
        setUser(result.user);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data. Please try again later.");
      }
    };

    fetchData();
  }, []);

  return (
    <div className="profile">
      <div className="profile-frame">
        <div className="profile-pic">
          <img
            onClick={changeprofile}
            src={user.Photo ? user.Photo : picLink}
            alt="Profile"
          />
        </div>
        <div className="profile-data">
          <h1>{JSON.parse(localStorage.getItem("user")).name}</h1>
          <div className="profile-info" style={{ display: "flex" }}>
            <p>{pic.length} posts</p>
            <p>{user.followers ? user.followers.length : "0"} followers</p>
            <p>{user.following ? user.following.length : "0"} following</p>
          </div>
        </div>
      </div>
      <hr style={{ width: "90%", opacity: "0.8", margin: "25px auto" }} />
      {error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="gallery">
          {pic.map((pics) => (
            <img
              key={pics._id}
              src={pics.photo}
              onClick={() => toggleDetails(pics)}
              className="item"
              alt="Post"
            />
          ))}
        </div>
      )}
      {show && <PostDetail item={posts} toggleDetails={toggleDetails} />}
      {changePic && <ProfilePic changeprofile={changeprofile} />}
    </div>
  );
}