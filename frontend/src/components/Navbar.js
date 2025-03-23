import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import "./Navbar.css";
import { useTheme } from '../context/ThemeContext';
import { FaBars, FaTimes } from "react-icons/fa";

export default function Navbar({ login }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const { setModalOpen } = useContext(LoginContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';

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
          <Link to="/messages" className="nav-link" title="Messages">
            <span className="material-symbols-outlined">chat</span>
          </Link>
          <Link 
            to="" 
            className="nav-link" 
            title="Logout"
            onClick={() => {
              localStorage.removeItem("jwt");
              localStorage.removeItem("user");
              setModalOpen(true);
              navigate("/");
            }}
          >
            <span className="material-symbols-outlined">logout</span>
          </Link>
        </>
      );
    }
    return null;
  };

  return (
    <>
      <div className={`navbar ${isDarkMode ? "dark-mode" : "light-mode"}`}>
        <div className="navbar-content">
          <Link to="/" className="logo-link">
            <span style={{
              fontSize: '24px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #00c6ff, #0072ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Connectify
            </span>
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

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu">
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
      <div className="navbar-spacer"></div>
    </>
  );
}