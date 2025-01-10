import React, { createContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import Profie from "./components/Profile";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Createpost from "./components/Createpost";
import { LoginContext } from "./context/LoginContext";
import Modal from "./components/Modal";
import UserProfie from "./components/UserProfile";
import MyFolliwngPost from "./components/MyFollowingPost";
import SearchResults from "./components/SearchResults";
import "./App.css"; // Make sure your CSS file is imported

function App() {
  const [userLogin, setUserLogin] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Step 1: Check for dark mode preference from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("theme");
    if (savedMode === "dark") {
      setIsDarkMode(true);
      document.body.classList.add("dark-mode"); // Apply dark mode class to body
    } else {
      setIsDarkMode(false);
      document.body.classList.remove("dark-mode"); // Remove dark mode class
    }
  }, []);

  // Step 2: Toggle dark mode and store preference in localStorage
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      // Step 3: Save the selected theme to localStorage
      localStorage.setItem("theme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  return (
    <BrowserRouter>
      <div className="App">
        <LoginContext.Provider value={{ setUserLogin, setModalOpen }}>
          <Navbar login={userLogin} toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route exact path="/profile" element={<Profie />} />
            <Route path="/createPost" element={<Createpost />} />
            <Route path="/profile/:userid" element={<UserProfie />} />
            <Route path="/followingpost" element={<MyFolliwngPost />} />
            <Route path="/user/:id" element={<UserProfie />} />
            <Route path="/search" element={<SearchResults />} />
          </Routes>
          <ToastContainer theme="dark" />
          {modalOpen && <Modal setModalOpen={setModalOpen} />}
        </LoginContext.Provider>
      </div>
    </BrowserRouter>
  );
}

export default App;
