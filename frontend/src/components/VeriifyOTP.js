import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import "./VerifyOTP.css"; // Create a CSS file for styling

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Get email from location state
  const email = location.state?.email;

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "OTP verification failed.");
      }

      toast.success(data.message || "Email verified successfully!");
      navigate("/signin"); // Redirect to sign-in page after successful verification
    } catch (error) {
      toast.error(error.message || "Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Email not found. Please try signing up again.");
      return;
    }

    setResendLoading(true);

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP.");
      }

      toast.success(data.message || "New OTP sent to your email.");
    } catch (error) {
      toast.error(error.message || "Failed to resend OTP. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="verify-otp-container">
      <div className="verify-otp-box">
        <h1>Verify Your Email</h1>
        <p>We've sent a 6-digit OTP to your email: <strong>{email}</strong></p>

        <div className="otp-input-container">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            maxLength={6}
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleVerifyOTP}
          disabled={isLoading || !otp || otp.length !== 6}
          className="verify-button"
        >
          {isLoading ? (
            <div className="loading-spinner">
              <Loader2 className="spinner" aria-hidden="true" />
              <span>Verifying...</span>
            </div>
          ) : (
            "Verify OTP"
          )}
        </button>

        <p className="resend-otp-text">
          Didn't receive the OTP?{" "}
          <button
            onClick={handleResendOTP}
            disabled={resendLoading}
            className="resend-button"
          >
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>
        </p>
      </div>
    </div>
  );
}