import React from "react";
import studyVaultLogo from "../assets/logo.png";

export function WelcomeNameModal(props) {
  var isOpen = props.isOpen;
  var onSaveName = props.onSaveName;
  var initialName = props.initialName || "";

  var [name, setName] = React.useState(initialName);
  var [error, setError] = React.useState("");

  if (!isOpen) {
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    var trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name to continue.");
      return;
    }
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    setError("");
    onSaveName(trimmed);
  }

  return (
    <div className="modal-backdrop welcome-modal-backdrop">
      <div
        className="modal-content welcome-modal-content"
        onClick={function(e) {
          e.stopPropagation();
        }}
      >
        <div className="welcome-modal-header">
          <div className="welcome-logo-wrapper">
            <img
              src={studyVaultLogo}
              alt="StudyVault Logo"
              className="welcome-logo-img"
              width="64"
              height="64"
            />
            <span className="welcome-pulse-glow"></span>
          </div>
          <h2 className="welcome-title">Welcome to StudyVault! 🎓</h2>
          <p className="welcome-subtitle">
            Please enter your name to enter the study vault and access all PDFs &amp; interview notes.
          </p>
        </div>

        <form className="welcome-form" onSubmit={handleSubmit}>
          <div className="welcome-input-group">
            <label htmlFor="student-name-input" className="welcome-input-label">
              👤 Your Name
            </label>
            <div className="welcome-input-wrapper">
              <input
                id="student-name-input"
                type="text"
                className={"welcome-input" + (error ? " has-error" : "")}
                placeholder="e.g. Rahul Sharma, Priya..."
                value={name}
                onChange={function(e) {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                autoFocus
                maxLength={35}
              />
            </div>
            {error ? <span className="welcome-error-msg">{error}</span> : null}
          </div>

          <button type="submit" className="welcome-continue-btn">
            <span>Continue to Notes</span>
            <span className="btn-arrow" aria-hidden="true">→</span>
          </button>
        </form>

        <div className="welcome-footer-note">
          <span className="note-icon">🔒</span>
          <span>Your name is only visible to active learners currently in the study room.</span>
        </div>
      </div>
    </div>
  );
}
