/* eslint-disable no-undef */
import React from "react";
import { useNavigate } from "react-router-dom";
import "../style/error.css";

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="error-container">
      <div className="error-content">
        <h1 onClick={() => navigate("/")} className="error-title">
          Oops!
        </h1>
        <p className="error-message">Something went wrong. Please try again.</p>
        <button onClick={() => navigate("/")} className="error-button">
          Go Back to Home
        </button>
      </div>
    </div>
  );
}
