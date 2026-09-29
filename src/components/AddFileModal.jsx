import React from "react";
import {
  categorizeFile,
  extractDriveId,
  getCategoryDetails
} from "../utils/driveClassifier.js";

var CATEGORY_OPTIONS = [
  { key: "auto", label: "✨ Auto-detect from filename" },
  { key: "sql", label: "🗄️ SQL & Databases" },
  { key: "java", label: "☕ Java" },
  { key: "fullstack", label: "🌐 Full Stack" },
  { key: "dsa", label: "⚡ DSA & Problem Solving" },
  { key: "interview", label: "🎯 Interview & Aptitude" },
  { key: "python", label: "🐍 Python" },
  { key: "core_cs", label: "💻 Core Computer Science" },
  { key: "other_files", label: "📁 Other Files" }
];

export function AddFileModal(props) {
  var isOpen = props.isOpen;
  var onClose = props.onClose;
  var onAddFile = props.onAddFile;
  var onBatchAdd = props.onBatchAdd;
  var onUploadPdf = props.onUploadPdf;

  var [activeTab, setActiveTab] = React.useState("upload"); // 'upload' | 'single' | 'batch' | 'folder'
  var [fileName, setFileName] = React.useState("");
  var [driveLink, setDriveLink] = React.useState("");
  var [selectedCategory, setSelectedCategory] = React.useState("auto");
  var [description, setDescription] = React.useState("");
  var [batchText, setBatchText] = React.useState("");

  // Direct File Upload State
  var [uploadFileObj, setUploadFileObj] = React.useState(null);
  var [uploadFileBase64, setUploadFileBase64] = React.useState("");
  var [isUploading, setIsUploading] = React.useState(false);
  var [uploadError, setUploadError] = React.useState("");

  // Drive API Sync State
  var [folderInput, setFolderInput] = React.useState("");
  var [apiKeyInput, setApiKeyInput] = React.useState("");
  var [isSyncing, setIsSyncing] = React.useState(false);
  var [syncMessage, setSyncMessage] = React.useState("");

  // Close on Escape key
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

  if (!isOpen) {
    return null;
  }

  // Calculate live detected category
  var liveDetected = categorizeFile(fileName || driveLink);
  var finalCategoryKey = selectedCategory === "auto" ? liveDetected : selectedCategory;
  var catDetails = getCategoryDetails(finalCategoryKey);

  function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return "0 KB";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function handleFileInputChange(event) {
    var files = event.target.files;
    if (files && files.length > 0) {
      var file = files[0];
      if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
        setUploadError("Please select a valid PDF file.");
        return;
      }
      setUploadError("");
      setUploadFileObj(file);
      if (!fileName) {
        setFileName(file.name);
      }
      var reader = new FileReader();
      reader.onload = function(e) {
        setUploadFileBase64(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleUploadSubmit(event) {
    event.preventDefault();
    if (!uploadFileBase64 || !uploadFileObj) {
      setUploadError("Please select a PDF file to upload.");
      return;
    }

    if (!onUploadPdf) {
      setUploadError("Direct upload handler not connected.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    onUploadPdf({
      fileName: fileName.trim() || uploadFileObj.name,
      fileBase64: uploadFileBase64,
      mimeType: "application/pdf",
      category: finalCategoryKey,
      description: description.trim()
    })
      .then(function(result) {
        setIsUploading(false);
        if (result && result.success) {
          setUploadFileObj(null);
          setUploadFileBase64("");
          setFileName("");
          setDescription("");
          onClose();
        } else {
          setUploadError(result && result.error ? result.error : "Failed to upload to Google Drive.");
        }
      })
      .catch(function(err) {
        setIsUploading(false);
        setUploadError("Upload error: " + err.message);
      });
  }

  function handleSingleSubmit(event) {
    event.preventDefault();
    if (!fileName && !driveLink) {
      alert("Please provide at least a file name or a Google Drive link.");
      return;
    }

    var cleanName = fileName.trim();
    var cleanDriveId = extractDriveId(driveLink);

    if (!cleanName) {
      cleanName = "Drive Document (" + cleanDriveId.substring(0, 8) + ").pdf";
    }

    var newFile = {
      id: "custom-" + Date.now(),
      name: cleanName,
      driveId: cleanDriveId,
      category: finalCategoryKey,
      size: "PDF Document",
      uploadDate: "Just added",
      starred: false,
      description: description.trim() || "Automatically segregated into " + catDetails.name
    };

    onAddFile(newFile);
    // Reset inputs
    setFileName("");
    setDriveLink("");
    setDescription("");
    setSelectedCategory("auto");
    onClose();
  }

  function handleBatchSubmit(event) {
    event.preventDefault();
    if (!batchText.trim()) {
      return;
    }

    var lines = batchText.split("\n");
    var newFiles = [];

    for (var i = 0; i < lines.length; i = i + 1) {
      var line = lines[i].trim();
      if (!line) {
        continue;
      }

      var extractedId = extractDriveId(line);
      var detectedCategory = categorizeFile(line);
      var title = line;

      if (line.indexOf("drive.google.com") !== -1) {
        title = "Drive Resource " + (i + 1) + ".pdf";
      }

      newFiles.push({
        id: "batch-" + Date.now() + "-" + i,
        name: title,
        driveId: extractedId,
        category: detectedCategory,
        size: "PDF Document",
        uploadDate: "Just added",
        starred: false,
        description: "Auto-segregated from batch import"
      });
    }

    if (newFiles.length > 0) {
      onBatchAdd(newFiles);
      setBatchText("");
      onClose();
    }
  }

  function handleFolderSyncSubmit(event) {
    event.preventDefault();
    var rawFolder = folderInput.trim();
    if (!rawFolder) {
      alert("Please enter a Google Drive Folder ID or Folder Link.");
      return;
    }

    var folderId = extractDriveId(rawFolder);
    var apiKey = apiKeyInput.trim();

    if (!apiKey) {
      setSyncMessage(
        "💡 To directly fetch the file list from Google's servers without logging in, a Google Drive API Key is required. Alternatively, you can paste the share links in the 'Quick Link' tab for immediate auto-segregation!"
      );
      return;
    }

    setIsSyncing(true);
    setSyncMessage("Fetching files from Google Drive folder...");

    var url =
      "https://www.googleapis.com/drive/v3/files?q='" +
      encodeURIComponent(folderId) +
      "'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,createdTime)&key=" +
      encodeURIComponent(apiKey);

    fetch(url)
      .then(function(res) {
        return res.json();
      })
      .then(function(data) {
        setIsSyncing(false);
        if (data.error) {
          setSyncMessage("⚠️ Google Drive API Error: " + data.error.message);
          return;
        }

        if (!data.files || data.files.length === 0) {
          setSyncMessage("⚠️ No files found in this folder. Make sure the folder is public ('Anyone with the link').");
          return;
        }

        var imported = [];
        for (var j = 0; j < data.files.length; j = j + 1) {
          var f = data.files[j];
          var cat = categorizeFile(f.name);
          imported.push({
            id: "drive-" + f.id,
            name: f.name,
            driveId: f.id,
            category: cat,
            size: f.size ? Math.round(f.size / (1024 * 1024) * 10) / 10 + " MB" : "PDF",
            uploadDate: f.createdTime ? f.createdTime.split("T")[0] : "Drive Sync",
            starred: false,
            description: "Directly synced from Google Drive folder"
          });
        }

        onBatchAdd(imported);
        setSyncMessage("✅ Successfully imported & segregated " + imported.length + " files!");
        setTimeout(function() {
          onClose();
        }, 1200);
      })
      .catch(function(err) {
        setIsSyncing(false);
        setSyncMessage("⚠️ Connection error: " + err.message);
      });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content add-modal"
        onClick={function(event) {
          event.stopPropagation();
        }}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon-badge">➕</span>
            <div>
              <h2 className="modal-title">Add & Segregate Study Files</h2>
              <p className="modal-subtitle">Automatically categorize files into SQL, Full Stack, DSA, Aptitude & more</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-tabs">
          <button
            type="button"
            className={"modal-tab-btn" + (activeTab === "upload" ? " active" : "")}
            onClick={function() {
              setActiveTab("upload");
            }}
          >
            📤 Upload PDF to Drive
          </button>
          <button
            type="button"
            className={"modal-tab-btn" + (activeTab === "single" ? " active" : "")}
            onClick={function() {
              setActiveTab("single");
            }}
          >
            📄 Single File Link
          </button>
          <button
            type="button"
            className={"modal-tab-btn" + (activeTab === "batch" ? " active" : "")}
            onClick={function() {
              setActiveTab("batch");
            }}
          >
            📋 Batch Add Links
          </button>
          <button
            type="button"
            className={"modal-tab-btn" + (activeTab === "folder" ? " active" : "")}
            onClick={function() {
              setActiveTab("folder");
            }}
          >
            📁 Auto-Sync Drive Folder
          </button>
        </div>

        <div className="modal-body">
          {activeTab === "upload" ? (
            <form onSubmit={handleUploadSubmit} className="add-form upload-form">
              {uploadError ? (
                <div className="login-error-banner">
                  <span className="error-icon">⚠️</span>
                  <span className="error-text">{uploadError}</span>
                </div>
              ) : null}

              <div className="upload-dropzone">
                <input
                  type="file"
                  id="pdf-file-input"
                  className="file-input-hidden"
                  accept=".pdf,application/pdf"
                  onChange={handleFileInputChange}
                  disabled={isUploading}
                />
                <label htmlFor="pdf-file-input" className="dropzone-label">
                  <span className="dropzone-icon">📥</span>
                  {uploadFileObj ? (
                    <div className="dropzone-file-info">
                      <strong className="selected-filename">{uploadFileObj.name}</strong>
                      <span className="selected-filesize">({formatFileSize(uploadFileObj.size)})</span>
                      <span className="change-file-hint">Click to change file</span>
                    </div>
                  ) : (
                    <div className="dropzone-prompt">
                      <strong>Choose a PDF file or drag it here</strong>
                      <span>Maximum size: 15MB • Uploads directly to Google Drive</span>
                    </div>
                  )}
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Title in StudyWallet <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. FullStack_Java_CheatSheet.pdf"
                  value={fileName}
                  onChange={function(e) {
                    setFileName(e.target.value);
                  }}
                  required
                  disabled={isUploading}
                />
              </div>

              <div className="form-group">
                <div className="form-label-with-detected">
                  <label className="form-label">Category</label>
                  {selectedCategory === "auto" ? (
                    <span className="auto-detected-badge" style={{ color: catDetails.color }}>
                      Auto: {catDetails.name}
                    </span>
                  ) : null}
                </div>
                <select
                  className="form-select"
                  value={selectedCategory}
                  onChange={function(e) {
                    setSelectedCategory(e.target.value);
                  }}
                  disabled={isUploading}
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
                <label className="form-label">Description / Summary</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Brief notes summary..."
                  value={description}
                  onChange={function(e) {
                    setDescription(e.target.value);
                  }}
                  disabled={isUploading}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={onClose}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn-submit"
                  disabled={isUploading || !uploadFileObj}
                >
                  {isUploading ? "Uploading to Google Drive..." : "Upload to Google Drive"}
                </button>
              </div>
            </form>
          ) : null}

          {activeTab === "single" ? (
            <form onSubmit={handleSingleSubmit} className="add-form">
              <div className="form-group">
                <label className="form-label">
                  File Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. SQL_Interview_Queries.pdf, DSA_Graph_Notes.pdf, Java_Streams.pdf"
                  value={fileName}
                  onChange={function(e) {
                    setFileName(e.target.value);
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Google Drive Share Link or File ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://drive.google.com/file/d/1VBCHmacg8ncl.../view?usp=sharing"
                  value={driveLink}
                  onChange={function(e) {
                    setDriveLink(e.target.value);
                  }}
                />
                <span className="form-hint">
                  Tip: Make sure the file is set to "Anyone with the link can view".
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={selectedCategory}
                  onChange={function(e) {
                    setSelectedCategory(e.target.value);
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

              {/* Real-time category detection preview */}
              <div
                className="live-detection-banner"
                style={{
                  backgroundColor: catDetails.badgeBg,
                  borderColor: catDetails.color
                }}
              >
                <span className="live-icon">{catDetails.icon}</span>
                <div className="live-text">
                  <div className="live-label">Auto-Segregation Target:</div>
                  <strong style={{ color: catDetails.color }}>{catDetails.name}</strong>
                  <div className="live-desc">{catDetails.description}</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Short Description (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Chapter 1-5 joins, indexing, and interview queries"
                  value={description}
                  onChange={function(e) {
                    setDescription(e.target.value);
                  }}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  + Add to Vault
                </button>
              </div>
            </form>
          ) : null}

          {activeTab === "batch" ? (
            <form onSubmit={handleBatchSubmit} className="add-form">
              <div className="form-group">
                <label className="form-label">
                  Paste Multiple File Names or Drive Links (One per line)
                </label>
                <textarea
                  className="form-textarea"
                  rows="7"
                  placeholder="SQL_Handwritten_Sheet.pdf&#10;DSA_Tree_Patterns.pdf&#10;Java_Full_Stack_Roadmap.pdf&#10;TCS_Aptitude_Solved.pdf&#10;https://drive.google.com/file/d/..."
                  value={batchText}
                  onChange={function(e) {
                    setBatchText(e.target.value);
                  }}
                />
                <span className="form-hint">
                  The smart classifier will analyze each line and automatically sort each file into its proper category.
                </span>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Segregate & Import All
                </button>
              </div>
            </form>
          ) : null}

          {activeTab === "folder" ? (
            <form onSubmit={handleFolderSyncSubmit} className="add-form">
              <div className="form-group">
                <label className="form-label">
                  Google Drive Public Folder Link or Folder ID
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://drive.google.com/drive/folders/1a2b3c4d5e... or Folder ID"
                  value={folderInput}
                  onChange={function(e) {
                    setFolderInput(e.target.value);
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Google Cloud Drive API Key <span className="optional">(Optional)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="AIzaSy..."
                  value={apiKeyInput}
                  onChange={function(e) {
                    setApiKeyInput(e.target.value);
                  }}
                />
                <span className="form-hint">
                  Required if you want the browser to query Google Drive folder contents automatically via Google's REST API.
                </span>
              </div>

              {syncMessage ? <div className="sync-message-box">{syncMessage}</div> : null}

              <div className="instructions-card">
                <h4>How Auto-Segregation works when you upload to Drive:</h4>
                <ol>
                  <li>
                    Put your notes in your Drive folder (e.g. <code>JavaFullNotes.pdf</code>, <code>SQL_notes.pdf</code>, <code>DSA_Patterns.pdf</code>).
                  </li>
                  <li>
                    File names containing <strong>SQL</strong>, <strong>Java / Fullstack</strong>, <strong>DSA</strong>, or <strong>Aptitude/TCS</strong> will automatically appear in their dedicated category.
                  </li>
                  <li>
                    Anyone visiting this site can view and download all your PDFs instantly without needing your login!
                  </li>
                </ol>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={onClose}>
                  Close
                </button>
                <button type="submit" className="btn-submit" disabled={isSyncing}>
                  {isSyncing ? "Syncing..." : "🔄 Sync Drive Folder"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
