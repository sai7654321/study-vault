import React from "react";
import {
  getCategoryDetails,
  buildDriveDirectDownloadUrl,
  buildDriveViewUrl
} from "../utils/driveClassifier.js";

export function FileCard(props) {
  var file = props.file;
  var onPreview = props.onPreview;
  var onToggleStar = props.onToggleStar;
  var onCopyLink = props.onCopyLink;
  var onDelete = props.onDelete;
  var onEdit = props.onEdit;
  var isAdmin = props.isAdmin;

  var categoryMeta = getCategoryDetails(file.category);
  var hasDriveId = Boolean(file.driveId && file.driveId.length > 5);

  function handlePreviewClick() {
    onPreview(file);
  }

  function handleEditClick(event) {
    event.stopPropagation();
    if (onEdit) {
      onEdit(file);
    }
  }

  function handleDownloadClick(event) {
    event.stopPropagation();
    if (hasDriveId) {
      window.open(downloadUrl, "_blank");
    } else {
      onPreview(file);
    }
  }

  function handleStarClick(event) {
    event.stopPropagation();
    onToggleStar(file.id);
  }

  function handleCopyClick(event) {
    event.stopPropagation();
    onCopyLink(file);
  }

  function handleDeleteClick(event) {
    event.stopPropagation();
    if (onDelete) {
      onDelete(file.id);
    }
  }

  var defaultFolderUrl = "https://drive.google.com/drive/u/1/folders/1awA5Bnw1pleg3yr3TK7uPY7vsuYvQh9F";
  var downloadUrl = hasDriveId
    ? buildDriveDirectDownloadUrl(file.driveId)
    : defaultFolderUrl;
  var driveViewUrl = hasDriveId
    ? buildDriveViewUrl(file.driveId)
    : defaultFolderUrl;
  return (
    <article
      className="file-card"
      style={{
        "--cat-color": categoryMeta.color,
        "--cat-rgb": categoryMeta.rgb || "109, 40, 217"
      }}
    >
      <div className="card-top">
        <span
          className="category-badge"
          style={{
            backgroundColor: categoryMeta.badgeBg,
            color: categoryMeta.color,
            borderColor: categoryMeta.color
          }}
        >
          <span className="badge-icon">{categoryMeta.icon}</span>
          <span className="badge-text">{categoryMeta.name}</span>
        </span>

        <button
          type="button"
          className={"star-btn" + (file.starred ? " is-starred" : "")}
          onClick={handleStarClick}
          title={file.starred ? "Remove from favorites" : "Add to favorites"}
        >
          {file.starred ? "★" : "☆"}
        </button>
      </div>

      <div className="card-body" onClick={handlePreviewClick}>
        <div className="file-icon-wrapper" style={{ borderColor: categoryMeta.color }}>
          <span className="file-pdf-tag">PDF</span>
          <span className="file-main-icon">📄</span>
        </div>

        <div className="file-details">
          <h3 className="file-title" title={file.name}>
            {file.name}
          </h3>
          <p className="file-description">{file.description || "Public study notes and reference material."}</p>
        </div>
      </div>

      <div className="card-meta">
        <span className="meta-item">
          <span className="meta-icon">💾</span> {file.size || "PDF Document"}
        </span>
        <span className="meta-item">
          <span className="meta-icon">🕒</span> {file.uploadDate || "Recent"}
        </span>
      </div>

      <div className="card-footer">
        <button
          type="button"
          className="card-action-btn btn-preview"
          onClick={handlePreviewClick}
          title="Open smooth PDF preview"
        >
          <span className="btn-icon">👁️</span>
          <span>View PDF</span>
        </button>

        {isAdmin ? (
          <button
            type="button"
            className="card-action-btn btn-download"
            onClick={handleDownloadClick}
            title="Download file"
          >
            <span className="btn-icon">⬇️</span>
            <span>Download</span>
          </button>
        ) : null}

        {isAdmin ? (
          <button
            type="button"
            className="icon-action-btn"
            onClick={handleCopyClick}
            title="Copy public link"
          >
            🔗
          </button>
        ) : null}

        {isAdmin ? (
          <a
            href={driveViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-action-btn"
            title="Open in Google Drive"
            onClick={function(e) {
              e.stopPropagation();
            }}
          >
            ↗️
          </a>
        ) : null}

        {isAdmin && onEdit ? (
          <button
            type="button"
            className="icon-action-btn edit-btn"
            onClick={handleEditClick}
            title="Edit file details"
          >
            ✏️
          </button>
        ) : null}

        {isAdmin && onDelete ? (
          <button
            type="button"
            className="icon-action-btn delete-btn"
            onClick={handleDeleteClick}
            title="Delete file"
          >
            🗑️
          </button>
        ) : null}
      </div>
    </article>
  );
}
