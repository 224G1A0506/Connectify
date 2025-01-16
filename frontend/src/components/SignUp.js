import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { Loader2 } from "lucide-react";
import GoogleAuthButton from './GoogleAuthButton';
import logo from "../img/logo100 (3).png";
import "./SignUp.css";

export default function SignUp() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    userName: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    setStrength(score);
  };

  // Field validation
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value) return "Email is required";
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
          return "Please enter a valid email address";
        }
        return "";
      
      case 'name':
        if (!value.trim()) return "Name is required";
        if (value.length < 2) return "Name must be at least 2 characters";
        if (value.length > 50) return "Name must not exceed 50 characters";
        return "";
      
      case 'userName':
        if (!value.trim()) return "Username is required";
        if (value.length < 3) return "Username must be at least 3 characters";
        if (value.length > 30) return "Username must not exceed 30 characters";
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          return "Username can only contain letters, numbers, and underscores";
        }
        return "";
      
      case 'password':
        if (!value) return "Password is required";
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/.test(value)) {
          return "Password must include uppercase, lowercase, number, special character, and be at least 8 characters";
        }
        return "";
      
      default:
        return "";
    }
  };

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (submitAttempted) {
      setFormErrors(prev => ({
        ...prev,
        [name]: validateField(name, value)
      }));
    }

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    });
    return errors;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          name: formData.name.trim(),
          userName: formData.userName.trim(),
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422) {
          if (data.errors) {
            setFormErrors(data.errors);
          } else if (data.field) {
            setFormErrors({ [data.field]: data.error });
          }
          toast.error(data.error || "Please check your input");
        } else {
          throw new Error(data.error || "Signup failed");
        }
      } else {
        toast.success(data.message);
        setTimeout(() => {
          navigate("/signin");
        }, 1500);
      }
    } catch (error) {
      toast.error(error.message || "Failed to sign up. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    return ["Very Weak", "Weak", "Fair", "Good", "Strong"][strength] || "Very Weak";
  };

  return (
    <div className="signUp">
      <div className="form-container">
        <form ref={formRef} onSubmit={handleSubmit} className="form" noValidate>
          <img className="signUpLogo" src={logo} alt="Logo" />
          <h1 className="welcome-text">Welcome to Our Community</h1>
          
          <GoogleAuthButton />

          <div className="input-container">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              className={formErrors.email ? 'error' : ''}
              aria-label="Email"
              aria-invalid={!!formErrors.email}
            />
            {formErrors.email && (
              <span className="error-message" role="alert">{formErrors.email}</span>
            )}
          </div>

          <div className="input-container">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Full Name"
              className={formErrors.name ? 'error' : ''}
              aria-label="Full Name"
              aria-invalid={!!formErrors.name}
            />
            {formErrors.name && (
              <span className="error-message" role="alert">{formErrors.name}</span>
            )}
          </div>

          <div className="input-container">
            <input
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleInputChange}
              placeholder="Username"
              className={formErrors.userName ? 'error' : ''}
              aria-label="Username"
              aria-invalid={!!formErrors.userName}
            />
            {formErrors.userName && (
              <span className="error-message" role="alert">{formErrors.userName}</span>
            )}
          </div>

          <div className="input-container password-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              className={formErrors.password ? 'error' : ''}
              aria-label="Password"
              aria-invalid={!!formErrors.password}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar" role="meter" aria-label="Password strength">
                  {[...Array(5)].map((_, index) => (
                    <div
                      key={index}
                      className={`strength-segment ${index < strength ? 'active' : ''}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="strength-text">{getPasswordStrengthText()}</span>
              </div>
            )}
            {formErrors.password && (
              <span className="error-message" role="alert">{formErrors.password}</span>
            )}
          </div>

          <p className="terms-text">
            By signing up, you agree to our Terms, Privacy Policy and Cookies Policy.
          </p>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner">
                <Loader2 className="spinner" aria-hidden="true" />
                <span>Signing up...</span>
              </div>
            ) : (
              'Sign Up with Email'
            )}
          </button>
        </form>

        <div className="signin-container">
          <p className="signin-text">
            Already have an account?{" "}
            <Link to="/signin" className="signin-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}