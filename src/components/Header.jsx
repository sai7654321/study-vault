import React from "react";

export function Header(props) {
  var searchQuery = props.searchQuery;
  var onSearchChange = props.onSearchChange;
  var onOpenAddModal = props.onOpenAddModal;
  var onOpenSyncModal = props.onOpenSyncModal;
  var theme = props.theme;
  var onToggleTheme = props.onToggleTheme;
  var totalFiles = props.totalFiles;

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
          <div className="brand-logo">
            <span className="logo-icon">📂</span>
          </div>
          <div className="brand-text">
            <h1 className="brand-title">StudyVault</h1>
            <p className="brand-subtitle">
              Public Notes & Study Hub • {totalFiles} Resource{totalFiles === 1 ? "" : "s"}
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
