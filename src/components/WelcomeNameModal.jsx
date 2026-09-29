import React from "react";
import studyVaultLogo from "../assets/logo.png";

export function WelcomeNameModal(props) {
  var isOpen = props.isOpen;
  var onSaveName = props.onSaveName;
  var initialName = props.initialName || "";

  var [name, setName] = React.useState(initialName);
  var [error, setError] = React.useState("");
  var [step, setStep] = React.useState("input"); // "input" | "celebration"
  var [savedName, setSavedName] = React.useState("");

  React.useEffect(function() {
    setName(initialName || "");
    setStep("input");
  }, [initialName, isOpen]);

  // Auto-redirect timer after celebration
  React.useEffect(function() {
    if (step === "celebration" && savedName) {
      var timer = setTimeout(function() {
        onSaveName(savedName);
      }, 3500);
      return function() {
        clearTimeout(timer);
      };
    }
  }, [step, savedName, onSaveName]);

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
    setSavedName(trimmed);
    setStep("celebration");
  }

  function handleDirectEnter() {
    if (savedName) {
      onSaveName(savedName);
    }
  }

  function getInitials(str) {
    if (!str) return "SV";
    var parts = str.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  }

  var confettiColors = [
    "#6366f1",
    "#a855f7",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#eab308"
  ];

  var confettiItems = [];
  for (var i = 0; i < 35; i = i + 1) {
    var leftPercent = (i * 2.85).toFixed(1) + "%";
    var delaySec = (i * 0.05).toFixed(2) + "s";
    var durationSec = (1.8 + (i % 5) * 0.3).toFixed(2) + "s";
    var color = confettiColors[i % confettiColors.length];
    var isCircle = i % 3 === 0;
    var isStar = i % 7 === 0;

    confettiItems.push({
      id: i,
      left: leftPercent,
      delay: delaySec,
      duration: durationSec,
      color: color,
      isCircle: isCircle,
      isStar: isStar
    });
  }

  return (
    <div className="modal-backdrop welcome-modal-backdrop">
      {step === "celebration" ? (
        <div className="confetti-container" aria-hidden="true">
          {confettiItems.map(function(item) {
            return (
              <span
                key={item.id}
                className={"confetti-flake" + (item.isCircle ? " is-circle" : "")}
                style={{
                  left: item.left,
                  animationDelay: item.delay,
                  animationDuration: item.duration,
                  backgroundColor: item.color
                }}
              >
                {item.isStar ? "★" : null}
              </span>
            );
          })}
        </div>
      ) : null}

      <div
        className={"modal-content welcome-modal-content" + (step === "celebration" ? " is-celebrating" : "")}
        onClick={function(e) {
          e.stopPropagation();
        }}
      >
        {step === "input" ? (
          <div>
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
        ) : (
          <div className="welcome-celebration-view">
            {/* Animated Celebration Avatar */}
            <div className="celebration-avatar-wrapper">
              <div className="celebration-avatar">
                <span>{getInitials(savedName)}</span>
              </div>
              <div className="celebration-ring-burst"></div>
              <div className="celebration-sparkle-1">✨</div>
              <div className="celebration-sparkle-2">⭐</div>
              <div className="celebration-sparkle-3">🎉</div>
            </div>

            {/* Personalized Celebration Title */}
            <h2 className="celebration-title">
              Welcome aboard, <span className="celebration-highlight">{savedName}</span>! 🎉
            </h2>
            <p className="celebration-subtitle">
              Your personalized StudyVault is ready! Let's conquer your study goals together. 🚀
            </p>

            {/* Feature Perks Pills */}
            <div className="celebration-perks-list">
              <div className="celebration-perk-item perk-1">
                <span className="perk-icon">⚡</span>
                <span>Auto-Segregated Notes (Java, SQL, Full Stack, DSA)</span>
              </div>
              <div className="celebration-perk-item perk-2">
                <span className="perk-icon">📖</span>
                <span>Smooth In-Browser PDF Reader &amp; Fullscreen View</span>
              </div>
              <div className="celebration-perk-item perk-3">
                <span className="perk-icon">👥</span>
                <span>Connected to Live Active Learners Roster</span>
              </div>
            </div>

            {/* Enter Button & Auto Countdown Bar */}
            <div className="celebration-action-area">
              <button
                type="button"
                className="celebration-enter-btn"
                onClick={handleDirectEnter}
              >
                <span>Enter Study Vault Now</span>
                <span className="btn-arrow" aria-hidden="true">🚀</span>
              </button>
              <div className="celebration-progress-bar">
                <div className="celebration-progress-fill"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
