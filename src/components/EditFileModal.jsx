import React from "react";
import { extractDriveId } from "../utils/driveClassifier.js";

var CATEGORY_OPTIONS = [
  { key: "sql", label: "🗄️ SQL & Databases" },
  { key: "java", label: "☕ Java" },
  { key: "fullstack", label: "🌐 Full Stack" },
  { key: "dsa", label: "⚡ DSA & Problem Solving" },
  { key: "interview", label: "🎯 Interview & Aptitude" },
  { key: "python", label: "🐍 Python" },
  { key: "core_cs", label: "💻 Core Computer Science" },
  { key: "other_files", label: "📁 Other Files" }
];

export function EditFileModal(props) {
  var file = props.file;
  var isOpen = props.isOpen;
  var onClose = props.onClose;
  var onSave = props.onSave;

  var [name, setName] = React.useState("");
  var [category, setCategory] = React.useState("other_files");
  var [driveLink, setDriveLink] = React.useState("");
  var [description, setDescription] = React.useState("");
  var [isSaving, setIsSaving] = React.useState(false);
  var [error, setError] = React.useState("");

  // Sync state with incoming file
  React.useEffect(function() {
    if (file) {
      setName(file.name || "");
      setCategory(file.category || "other_files");
      setDriveLink(file.driveId || "");
      setDescription(file.description || "");
      setError("");
    }
  }, [file]);

  // Close on Escape
  React.useEffect(function() {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return function() {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !file) {
    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError("File name cannot be empty.");
      return;
    }

    setIsSaving(true);
    setError("");

    var cleanDriveId = extractDriveId(driveLink);

    var updatedData = {
      fileId: file.id,
      name: name.trim(),
      category: category,
      driveId: cleanDriveId,
      description: description.trim()
    };

    onSave(updatedData)
      .then(function(result) {
        setIsSaving(false);
        if (result && result.success) {
          onClose();
        } else {
          setError(result && result.error ? result.error : "Failed to save changes.");
        }
      })
      .catch(function(err) {
        setIsSaving(false);
        setError("Error updating file: " + err.message);
      });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content edit-modal"
        onClick={function(e) {
          e.stopPropagation();
        }}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">✏️</span>
            <div>
              <h3 className="modal-title">Edit Study Resource</h3>
              <p className="modal-subtitle">Update file name, Drive ID, or categorization</p>
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

        <form onSubmit={handleSubmit} className="modal-body edit-body">
          {error ? (
            <div className="login-error-banner">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          ) : null}

          <div className="form-group">
            <label htmlFor="edit-name" className="form-label">
              File Name / Title *
            </label>
            <input
              id="edit-name"
              type="text"
              className="form-input"
              value={name}
              onChange={function(e) {
                setName(e.target.value);
              }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-category" className="form-label">
              Category
            </label>
            <select
              id="edit-category"
              className="form-select"
              value={category}
              onChange={function(e) {
                setCategory(e.target.value);
              }}
            >
              {CATEGORY_OPTIONS.map(function(opt) {
                return (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="edit-drive-id" className="form-label">
              Google Drive Link or File ID
            </label>
            <input
              id="edit-drive-id"
              type="text"
              className="form-input"
              placeholder="e.g. 1VBCHmacg8nclB0SvIG4jsvN7eJAdNBee"
              value={driveLink}
              onChange={function(e) {
                setDriveLink(e.target.value);
              }}
            />
            <span className="form-hint">
              Paste the full Drive sharing URL or the 33-character Google Drive ID.
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="edit-desc" className="form-label">
              Description / Notes Summary
            </label>
            <textarea
              id="edit-desc"
              className="form-textarea"
              rows={3}
              value={description}
              onChange={function(e) {
                setDescription(e.target.value);
              }}
              placeholder="Brief summary of topics covered in this PDF..."
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
