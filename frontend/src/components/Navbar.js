import React, { useContext } from "react";
import logo from "../img/logo12.png";
import "./Navbar.css";
import { Link } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";

export default function Navbar({ login }) {
  const { setModalOpen } = useContext(LoginContext);

  // Add this in the head of your HTML file or in your main layout component
  // <link href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined" rel="stylesheet" />

  const loginStatus = () => {
    const token = localStorage.getItem("jwt");
    if (login || token) {
      return [
        <>
          <Link to="/profile">
            <li><span className="material-symbols-outlined">account_circle</span></li>
          </Link>
          <Link to="/createPost">
            <li><span className="material-symbols-outlined">add_box</span></li>
          </Link>
          <Link to="/followingpost">
            <li><span className="material-symbols-outlined">explore</span></li>
          </Link>
          <Link to={""}>
            <li onClick={() => setModalOpen(true)}>
              <span className="material-symbols-outlined">logout</span>
            </li>
          </Link>
        </>,
      ];
    } else {
      return [
        <>
          <Link to="/signup">
            <li><span className="material-symbols-outlined">person_add</span></li>
          </Link>
          <Link to="/signin">
            <li><span className="material-symbols-outlined">login</span></li>
          </Link>
        </>,
      ];
    }
  };

  return (
    <div className="navbar">
      <Link to="/">
        <img src={logo} alt="logo" />
      </Link>
      <ul className="nav-menu">{loginStatus()}</ul>
    </div>
  );
}