import React, { useState, useContext } from "react";
import "./SIgnIn.css";
import logo from "../img/logo100 (3).png";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { LoginContext } from "../context/LoginContext";
import GoogleAuthButton from './GoogleAuthButton';

export default function SignIn() {
  const { setUserLogin } = useContext(LoginContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Toast functions
  const notifyA = (msg) => toast.error(msg);
  const notifyB = (msg) => toast.success(msg);

  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  const postData = async () => {
    if (isLoading) return;
  
    try {
      const response = await fetch("/signin", {
        method: "post",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });
  
      const data = await response.json();
  
      if (data.error) {
        notifyA(data.error);
      } else {
        notifyB("Signed In Successfully");
        localStorage.setItem("jwt", data.token); // Store token as 'jwt'
        localStorage.setItem("user", JSON.stringify(data.user));
        setUserLogin(true);
        navigate("/");
      }
    } catch (err) {
      notifyA("Something went wrong. Please try again.");
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      postData();
    }
  };

  return (
    <div className="signIn">
      <div>
        <div className="loginForm">
          <img className="signUpLogo" src={logo} alt="" />
          <div className="input-wrapper">
            <input 
              type="email" 
              name="email" 
              id="email" 
              value={email} 
              placeholder="Email" 
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="input-wrapper">
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <input 
            type="submit" 
            id="login-btn" 
            className={isLoading ? 'loading' : ''} 
            onClick={postData} 
            value={isLoading ? '' : 'Sign In'}
            disabled={isLoading}
          />
          <GoogleAuthButton />
        </div>
        <div className="loginForm2">
          Don't have an account?
          <Link to="/signup">
            <span>Sign Up</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
