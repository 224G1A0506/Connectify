import React, { useContext, useState } from "react";
import logo from "../img/logo12.png";
import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";

export default function Navbar({ login, toggleTheme, isDarkMode }) {
    const { setModalOpen } = useContext(LoginContext);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${searchQuery.trim()}`);
        }
    };

    const loginStatus = () => {
        const token = localStorage.getItem("jwt");
        if (login || token) {
            return (
                <>
                    <Link to="/profile" className="nav-link">
                        <li>
                            <span className="material-symbols-outlined">account_circle</span>
                        </li>
                    </Link>
                    <Link to="/createPost" className="nav-link">
                        <li>
                            <span className="material-symbols-outlined">add_box</span>
                        </li>
                    </Link>
                    <Link to="/followingpost" className="nav-link">
                        <li>
                            <span className="material-symbols-outlined">explore</span>
                        </li>
                    </Link>
                    <Link to="" className="nav-link">
                        <li onClick={() => setModalOpen(true)}>
                            <span className="material-symbols-outlined">logout</span>
                        </li>
                    </Link>
                </>
            );
        } else {
            return (
                <>
                    <Link to="/signup" className="nav-link">
                        <li>
                            <span className="material-symbols-outlined">person_add</span>
                        </li>
                    </Link>
                    <Link to="/signin" className="nav-link">
                        <li>
                            <span className="material-symbols-outlined">login</span>
                        </li>
                    </Link>
                </>
            );
        }
    };

    return (
        <div className={`navbar ${isDarkMode ? "dark-mode" : "light-mode"}`}>
            <div className="navbar-content">
                <Link to="/" className="logo-link">
                    <img src={logo} alt="logo" />
                </Link>
                <form className="nav-search" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="submit" className="search-btn">
                        <span className="material-symbols-outlined">search</span>
                    </button>
                </form>
                <ul className="nav-menu">{loginStatus()}</ul>
                <button className="theme-toggle-btn" onClick={toggleTheme}>
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                </button>
            </div>
        </div>
    );
}