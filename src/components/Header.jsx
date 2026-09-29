import React from "react";
import studyVaultLogo from "../assets/logo.png";

export function Header(props) {
  var searchQuery = props.searchQuery;
  var onSearchChange = props.onSearchChange;
  var onOpenAddModal = props.onOpenAddModal;
  var isAdmin = props.isAdmin;
  var adminUser = props.adminUser;
  var isOwnerDevice = props.isOwnerDevice;
  var onUnlockOwnerDevice = props.onUnlockOwnerDevice;
  var onOpenLoginModal = props.onOpenLoginModal;
  var onLogout = props.onLogout;
  var theme = props.theme;
  var onToggleTheme = props.onToggleTheme;
  var totalFiles = props.totalFiles;
  var visitorStats = props.visitorStats;

  // Stealth logo triple-click detection
  var logoClickCountRef = React.useRef(0);
  var logoClickTimerRef = React.useRef(null);

  function handleLogoClick() {
    logoClickCountRef.current = logoClickCountRef.current + 1;
    if (logoClickTimerRef.current) {
      clearTimeout(logoClickTimerRef.current);
    }
    if (logoClickCountRef.current >= 3) {
      logoClickCountRef.current = 0;
      if (onUnlockOwnerDevice) {
        onUnlockOwnerDevice();
      }
      if (onOpenLoginModal) {
        onOpenLoginModal();
      }
      return;
    }
    logoClickTimerRef.current = setTimeout(function() {
      logoClickCountRef.current = 0;
    }, 1200);
  }

  function handleInputChange(event) {
    onSearchChange(event.target.value);
  }

  function handleClearSearch() {
    onSearchChange("");
  }

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-group">
          <div
            className="brand-logo"
            onClick={handleLogoClick}
            style={{ cursor: "pointer" }}
            title="StudyVault"
          >
            <img
              src={studyVaultLogo}
              alt="StudyVault Logo"
              className="brand-logo-img"
              width="44"
              height="44"
              loading="eager"
            />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">StudyVault</h1>
            <p className="brand-subtitle">
              Public Notes &amp; Study Hub • {totalFiles} Resource{totalFiles === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="search-bar-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search SQL, Java, DSA, TCS notes, Aptitude..."
            value={searchQuery}
            onChange={handleInputChange}
          />
          {searchQuery ? (
            <button
              type="button"
              className="clear-search-btn"
              onClick={handleClearSearch}
              title="Clear search"
            >
              ×
            </button>
          ) : null}
        </div>

        <div className="header-actions">
          {isAdmin ? (
            <div className="admin-status-group">
              <span className="admin-badge" title={"Logged in as " + (adminUser && adminUser.email ? adminUser.email : "Admin")}>
                <span className="admin-dot">●</span>
                <span className="admin-email">{adminUser && adminUser.email ? adminUser.email.split("@")[0] : "Admin"}</span>
              </span>

              <button
                type="button"
                className="action-btn add-btn"
                onClick={onOpenAddModal}
                title="Add a new file or Drive link"
              >
                <span className="btn-icon">+</span>
                <span className="btn-label">Add Note</span>
              </button>

              <button
                type="button"
                className="admin-logout-btn"
                onClick={onLogout}
                title="Sign out of Admin session"
              >
                Logout
              </button>
            </div>
          ) : isOwnerDevice ? (
            <button
              type="button"
              className="action-btn login-btn"
              onClick={onOpenLoginModal}
              title="Admin login for site owner"
            >
              <span className="btn-icon">🔒</span>
              <span className="btn-label">Admin Login</span>
            </button>
          ) : null}

          {visitorStats && visitorStats.totalVisits > 0 ? (
            <div
              className="visitor-counter-badge"
              title={"Total Visits: " + visitorStats.totalVisits + " | Unique Learners: " + visitorStats.uniqueVisitors}
            >
              <span className="visitor-pulse-dot"></span>
              <span className="visitor-count-text">
                👥 {visitorStats.totalVisits.toLocaleString()}
              </span>
            </div>
          ) : null}

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </div>
    </header>
  );
}
