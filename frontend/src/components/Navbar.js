// Navbar.js
import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import "./Navbar.css";
import logo from "../img/logo100 (3).png";
import { MessageCircle } from 'lucide-react'; // Import the message icon


export default function Navbar({ login, toggleTheme, isDarkMode }) {
    const { setModalOpen } = useContext(LoginContext);
    const [searchQuery, setSearchQuery] = useState("");
    const [isVisible, setIsVisible] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we're on sign in or sign up pages
    const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';

    // Enhanced scroll effect for navbar
    useEffect(() => {
        let lastScroll = 0;
        let ticking = false;

        const handleScroll = () => {
            const currentScroll = window.pageYOffset;
            
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (currentScroll <= 0) {
                        setIsVisible(true);
                    } else if (currentScroll > lastScroll && !document.activeElement?.matches('.nav-search input')) {
                        setIsVisible(false);
                    } else {
                        setIsVisible(true);
                    }
                    lastScroll = currentScroll;
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
                    <Link to="/profile" className="nav-link" title="Profile">
                        <span className="material-symbols-outlined">account_circle</span>
                    </Link>
                    <Link to="/createPost" className="nav-link" title="Create Post">
                        <span className="material-symbols-outlined">add_box</span>
                    </Link>
                    <Link to="/followingpost" className="nav-link" title="Explore">
                        <span className="material-symbols-outlined">explore</span>
                    </Link>
                    <Link to="" className="nav-link" title="Logout">
                        <span 
                            className="material-symbols-outlined"
                            onClick={() => setModalOpen(true)}
                        >
                            logout
                        </span>
                    </Link>
                    <Link to="/messages" className="nav-icon">
  <MessageCircle size={24} />
</Link>
                </>
            );
        }
        return null;
    };

    return (
        <>
            <div className={`navbar ${isDarkMode ? "dark-mode" : "light-mode"} ${isVisible ? "" : "navbar-hidden"}`}>
                <div className="navbar-content">
                    <Link to="/" className="logo-link">
                        <img src={logo} alt="logo" />
                    </Link>
                    
                    {!isAuthPage && (
                        <form className="nav-search" onSubmit={handleSearch}>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </form>
                    )}

                    {!isAuthPage && (
                        <div className="nav-menu">
                            {loginStatus()}
                            <button 
                                className="theme-toggle-btn" 
                                onClick={toggleTheme}
                                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                <span className="material-symbols-outlined">
                                    {isDarkMode ? "light_mode" : "dark_mode"}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="navbar-spacer"></div>
        </>
    );
}