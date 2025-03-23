import React, { createContext, useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import VerifyOTP from "./components/VeriifyOTP";
import Home from "./components/Home";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import Profile from "./components/Profile";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Createpost from "./components/Createpost";
import { LoginContext } from "./context/LoginContext";
import Modal from "./components/Modal";
import UserProfile from "./components/UserProfile";
import MyFollowingPost from "./components/MyFollowingPost";
import SearchResults from "./components/SearchResults";
import { MessagingContainer } from './components/messaging';
import "./App.css";
import { ThemeProvider } from './context/ThemeContext';
import Stories from './components/Stories';  
import StoryCreation from './components/StoryCreation';
import StoryViewer from './components/StoryViewer';
import ViewStories from './components/ViewStories';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';

function App() {
  const [userLogin, setUserLogin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem("theme");
    if (savedMode === "dark") {
      setIsDarkMode(true);
      document.body.classList.add("dark-mode");
    } else {
      setIsDarkMode(false);
      document.body.classList.remove("dark-mode");
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("theme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent 
          userLogin={userLogin} 
          setUserLogin={setUserLogin} 
          modalOpen={modalOpen} 
          setModalOpen={setModalOpen} 
          isDarkMode={isDarkMode} 
          toggleTheme={toggleTheme} 
        />
      </BrowserRouter>
    </ThemeProvider>
  );
}

function AppContent({ userLogin, setUserLogin, modalOpen, setModalOpen, isDarkMode, toggleTheme }) {
  const location = useLocation();

  // Conditionally render Navbar based on the current route
  const showNavbar = !['/', '/signin', '/signup'].includes(location.pathname);
 
  return (
    <div className="App">
      <LoginContext.Provider value={{ setUserLogin, setModalOpen }}>
        {showNavbar && <Navbar login={userLogin} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={
            <div className="pt-0">
              <Stories />
              <Home />
            </div>
          } />
          <Route path="/followingpost" element={
            <div className="pt-0">
              <Stories />
              <MyFollowingPost />
            </div>
          } />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/createPost" element={<Createpost />} />
          {/* Remove duplicate routes and standardize parameter names */}
          <Route path="/profile/:userId" element={<UserProfile />} />
          {/* Remove /user/:userId route or make sure it's consistent with other routes */}
          <Route path="/search" element={<SearchResults />} />
          <Route path="/messages/*" element={<MessagingContainer />} />
          <Route path="/create-story" element={<StoryCreation />} />
          <Route path="/stories/:userId" element={<StoryViewer />} />
          <Route path="/view-stories/:userId" element={<ViewStories />} />
        </Routes>
        <ToastContainer theme="dark" />
        {modalOpen && <Modal setModalOpen={setModalOpen} />}
      </LoginContext.Provider>
    </div>
  );
}

export default App;