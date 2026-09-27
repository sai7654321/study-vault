import React from "react";
import {
  getCategoryDetails,
  buildDrivePreviewUrl,
  buildDriveDirectDownloadUrl,
  buildDriveViewUrl,
  extractDriveId
} from "../utils/driveClassifier.js";

export function FileModal(props) {
  var file = props.file;
  var onClose = props.onClose;
  var onUpdateFileDriveId = props.onUpdateFileDriveId;
  var onCopyLink = props.onCopyLink;

  var [isLoading, setIsLoading] = React.useState(true);
  var [linkInput, setLinkInput] = React.useState("");

  // Handle escape key
  React.useEffect(function() {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return function() {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!file) {
    return null;
  }

  var categoryMeta = getCategoryDetails(file.category);
  var hasDriveId = Boolean(file.driveId && file.driveId.length > 5);
  var previewUrl = hasDriveId ? buildDrivePreviewUrl(file.driveId) : "";
  var downloadUrl = hasDriveId ? buildDriveDirectDownloadUrl(file.driveId) : "#";
  var driveViewUrl = hasDriveId ? buildDriveViewUrl(file.driveId) : "#";

  function handleIframeLoad() {
    setIsLoading(false);
  }

  function handleSaveLinkSubmit(event) {
    event.preventDefault();
    if (!linkInput) {
      return;
    }
    var extracted = extractDriveId(linkInput);
    if (extracted && onUpdateFileDriveId) {
      onUpdateFileDriveId(file.id, extracted);
      setIsLoading(true);
    }
  }

  function handleCopyCurrentLink() {
    onCopyLink(file);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content file-viewer-modal"
        onClick={function(event) {
          event.stopPropagation();
        }}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span
              className="modal-category-badge"
              style={{
                backgroundColor: categoryMeta.badgeBg,
                color: categoryMeta.color,
                borderColor: categoryMeta.color
              }}
            >
              <span className="badge-icon">{categoryMeta.icon}</span>
              <span>{categoryMeta.name}</span>
            </span>
            <h2 className="modal-file-name" title={file.name}>
              {file.name}
            </h2>
          </div>

          <div className="modal-controls">
            {hasDriveId ? (
              <a
                href={driveViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-action-btn"
                title="Open in Google Drive"
              >
                <span>Google Drive</span>
                <span>↗</span>
              </a>
            ) : null}

            {hasDriveId ? (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="modal-action-btn download-btn"
                title="Direct Download"
              >
                <span>Download</span>
                <span>⬇</span>
              </a>
            ) : null}

            <button
              type="button"
              className="modal-action-btn"
              onClick={handleCopyCurrentLink}
              title="Copy share link"
            >
              <span>Share</span>
              <span>🔗</span>
            </button>

            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              title="Close (Esc)"
            >
              ×
            </button>
          </div>
        </div>

        <div className="modal-body viewer-body">
          {hasDriveId ? (
            <div className="iframe-container">
              {isLoading ? (
                <div className="viewer-loader">
                  <div className="spinner"></div>
                  <p className="loading-text">Loading document smoothly from Google Drive...</p>
                  <p className="loading-subtext">Rendering high-resolution PDF preview</p>
                </div>
              ) : null}

              <iframe
                src={previewUrl}
                title={file.name}
                className={"pdf-iframe" + (isLoading ? " is-loading" : " is-ready")}
                onLoad={handleIframeLoad}
                allow="autoplay"
              />
            </div>
          ) : (
            <div className="no-drive-id-container">
              <div className="no-drive-icon">📄</div>
              <h3>Google Drive Link Needed</h3>
              <p>
                To render <strong>"{file.name}"</strong> directly in this previewer, we need its Google Drive link.
              </p>
              
              <div style={{ display: "flex", gap: "10px", marginTop: "8px", marginBottom: "16px" }}>
                <a
                  href="https://drive.google.com/drive/u/1/folders/1awA5Bnw1pleg3yr3TK7uPY7vsuYvQh9F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-action-btn download-btn"
                  style={{ textDecoration: "none", padding: "10px 18px", fontSize: "0.9rem" }}
                >
                  📂 Open "study" Folder in Drive ↗
                </a>
              </div>

              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "520px" }}>
                In Drive, right-click <strong>"{file.name}"</strong> &gt; <strong>Share</strong> &gt; <strong>Copy link</strong>, then paste it below to view it here anytime:
              </p>

              <form className="attach-link-form" onSubmit={handleSaveLinkSubmit}>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/d/1.../view?usp=sharing"
                  value={linkInput}
                  onChange={function(e) {
                    setLinkInput(e.target.value);
                  }}
                  className="link-input"
                />
                <button type="submit" className="save-link-btn">
                  Attach &amp; View
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
