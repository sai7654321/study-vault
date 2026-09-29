import React from "react";

export function OnlineLearnersModal(props) {
  var isOpen = props.isOpen;
  var onClose = props.onClose;
  var learners = props.learners || [];
  var currentUserName = props.currentUserName;
  var onUpdateUserName = props.onUpdateUserName;
  var isAdmin = props.isAdmin;

  var [nameInput, setNameInput] = React.useState(currentUserName || "");
  var [isSaved, setIsSaved] = React.useState(false);

  React.useEffect(function() {
    setNameInput(currentUserName || "");
  }, [currentUserName]);

  if (!isOpen) {
    return null;
  }

  function handleNameSubmit(e) {
    e.preventDefault();
    var trimmed = nameInput.trim();
    if (trimmed) {
      onUpdateUserName(trimmed);
      setIsSaved(true);
      setTimeout(function() {
        setIsSaved(false);
      }, 2500);
    }
  }

  function getInitials(name) {
    if (!name) return "ST";
    var parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  var avatarColors = [
    "linear-gradient(135deg, #6366f1, #8b5cf6)",
    "linear-gradient(135deg, #06b6d4, #3b82f6)",
    "linear-gradient(135deg, #10b981, #059669)",
    "linear-gradient(135deg, #f59e0b, #ea580c)",
    "linear-gradient(135deg, #ec4899, #8b5cf6)",
    "linear-gradient(135deg, #8b5cf6, #d946ef)"
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content learners-modal-content"
        onClick={function(e) {
          e.stopPropagation();
        }}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="learners-header-icon-wrapper">
              <span className="learners-header-icon">👥</span>
              <span className="learners-live-dot"></span>
            </div>
            <div>
              <h3 className="modal-title">
                Active Learners ({learners.length} Online)
              </h3>
              <p className="modal-subtitle">
                Students and developers currently studying in StudyVault
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="modal-body learners-modal-body">
          {/* User Name Customization Card */}
          <div className="my-identity-card">
            <div className="identity-header">
              <span className="identity-label">👤 Your Display Name:</span>
              {isSaved ? <span className="saved-badge">✓ Saved!</span> : null}
            </div>
            <form className="identity-form" onSubmit={handleNameSubmit}>
              <input
                type="text"
                className="identity-input"
                placeholder="Enter your name (e.g. Rahul S.)..."
                value={nameInput}
                onChange={function(e) {
                  setNameInput(e.target.value);
                }}
                maxLength={30}
              />
              <button type="submit" className="identity-save-btn">
                Save
              </button>
            </form>
          </div>

          {/* Online Roster List */}
          <div className="learners-roster-section">
            <h4 className="roster-heading">
              <span>Currently Online</span>
              <span className="roster-count-badge">
                <span className="pulse-indicator"></span>
                {learners.length} Active Now
              </span>
            </h4>

            <div className="learners-list">
              {learners.map(function(learner, idx) {
                var isMe = learner.isCurrentUser;
                var colorGrad = avatarColors[idx % avatarColors.length];

                return (
                  <div
                    key={learner.id || idx}
                    className={"learner-item" + (isMe ? " is-me" : "")}
                  >
                    <div
                      className="learner-avatar"
                      style={{ background: colorGrad }}
                    >
                      <span>{getInitials(learner.name)}</span>
                      <span className="learner-online-dot"></span>
                    </div>

                    <div className="learner-info">
                      <div className="learner-name-row">
                        <span className="learner-name">
                          {learner.name}
                          {isMe ? " (You)" : ""}
                        </span>
                        {learner.isAdmin ? (
                          <span className="learner-admin-tag">👑 Owner</span>
                        ) : (
                          <span className="learner-student-tag">🎓 Student</span>
                        )}
                      </div>
                      <div className="learner-activity-row">
                        <span className="learner-activity">
                          {learner.activity || "Studying notes"}
                        </span>
                        <span className="learner-time">
                          • {learner.lastActive || "Just now"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer learners-modal-footer">
          <span className="live-sync-hint">
            🟢 Live presence synced in real time
          </span>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
