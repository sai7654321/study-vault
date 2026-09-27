import React from "react";
import { Header } from "./components/Header.jsx";
import { CategoryFilter } from "./components/CategoryFilter.jsx";
import { FileCard } from "./components/FileCard.jsx";
import { FileModal } from "./components/FileModal.jsx";
import { AddFileModal } from "./components/AddFileModal.jsx";
import { Toast } from "./components/Toast.jsx";
import { getDefaultFiles } from "./data/defaultFiles.js";
import { getCategoryDetails, buildDriveViewUrl, categorizeFile } from "./utils/driveClassifier.js";
import { fetchCloudFiles, saveCloudFiles } from "./services/jsonBinService.js";
import "./App.css";

var STORAGE_KEY = "study_vault_files_v5";
var OLD_STORAGE_KEYS = ["study_vault_files_v4", "study_vault_files_v3", "study_vault_files_v2", "study_vault_files"];
var THEME_KEY = "study_vault_theme";

// Collect all driveIds the user previously attached (from any old storage version)
function collectSavedDriveIds() {
  var idMap = {};
  var allKeys = [STORAGE_KEY].concat(OLD_STORAGE_KEYS);

  for (var k = 0; k < allKeys.length; k = k + 1) {
    var raw = localStorage.getItem(allKeys[k]);
    if (!raw) {
      continue;
    }
    try {
      var list = JSON.parse(raw);
      if (!Array.isArray(list)) {
        continue;
      }
      for (var i = 0; i < list.length; i = i + 1) {
        var item = list[i];
        if (item.driveId && item.driveId.length > 5 && item.name) {
          // Map by name so we can match across versions
          idMap[item.name] = item.driveId;
        }
      }
    } catch (e) {
      // skip broken data
    }
  }
  return idMap;
}

export default function App() {
  // Theme state
  var [theme, setTheme] = React.useState(function() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      return saved;
    }
    return "dark";
  });

  // Files state — merges saved driveIds into fresh defaults
  var [files, setFiles] = React.useState(function() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        var parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse stored files", e);
      }
    }

    // First load on this version — migrate driveIds from old versions
    var savedIds = collectSavedDriveIds();
    var defaults = getDefaultFiles();

    for (var j = 0; j < defaults.length; j = j + 1) {
      var file = defaults[j];
      if ((!file.driveId || file.driveId.length <= 5) && savedIds[file.name]) {
        file.driveId = savedIds[file.name];
      }
    }

    return defaults;
  });

  // Filtering & Search
  var [activeCategory, setActiveCategory] = React.useState("all");
  var [searchQuery, setSearchQuery] = React.useState("");
  var [sortBy, setSortBy] = React.useState("recent"); // 'recent' | 'name'
  var [viewMode, setViewMode] = React.useState("grid"); // 'grid' | 'list'

  // Modals & Popups
  var [previewFile, setPreviewFile] = React.useState(null);
  var [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  var [toast, setToast] = React.useState(null);

  // Sync theme with DOM
  React.useEffect(function() {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Persist files in localStorage
  React.useEffect(function() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  }, [files]);

  // Fetch live cloud files from JSONBin.io on startup and merge local attachments
  React.useEffect(function() {
    fetchCloudFiles().then(function(cloudRecords) {
      if (cloudRecords && Array.isArray(cloudRecords) && cloudRecords.length > 0) {
        var savedIds = collectSavedDriveIds();
        var processed = [];
        var hasNewDriveId = false;

        for (var i = 0; i < cloudRecords.length; i = i + 1) {
          var item = cloudRecords[i];
          var effectiveDriveId = item.driveId || "";
          if ((!effectiveDriveId || effectiveDriveId.length <= 5) && savedIds[item.name]) {
            effectiveDriveId = savedIds[item.name];
            hasNewDriveId = true;
          }
          processed.push({
            id: item.id || "file-" + i,
            name: item.name,
            driveId: effectiveDriveId,
            category: categorizeFile(item.name),
            size: item.size || "PDF Document",
            uploadDate: item.uploadDate || "Recent",
            starred: Boolean(item.starred),
            description: item.description || ""
          });
        }
        setFiles(processed);

        // If local had drive links that weren't in cloud yet, sync them up!
        if (hasNewDriveId) {
          saveCloudFiles(processed);
        }
      }
    });
  }, []);

  function showToast(message, type) {
    setToast({
      message: message,
      type: type || "info"
    });
  }

  function handleCloseToast() {
    setToast(null);
  }

  function handleToggleTheme() {
    if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  }

  function handleToggleStar(fileId) {
    var updated = [];
    for (var i = 0; i < files.length; i = i + 1) {
      var item = files[i];
      if (item.id === fileId) {
        updated.push({
          id: item.id,
          name: item.name,
          driveId: item.driveId,
          category: item.category,
          size: item.size,
          uploadDate: item.uploadDate,
          starred: !item.starred,
          description: item.description
        });
      } else {
        updated.push(item);
      }
    }
    setFiles(updated);
    saveCloudFiles(updated);
  }

  function handleUpdateDriveId(fileId, newDriveId) {
    var updated = [];
    var matchedFile = null;
    for (var i = 0; i < files.length; i = i + 1) {
      var item = files[i];
      if (item.id === fileId) {
        var modified = {
          id: item.id,
          name: item.name,
          driveId: newDriveId,
          category: item.category,
          size: item.size,
          uploadDate: item.uploadDate,
          starred: item.starred,
          description: item.description
        };
        updated.push(modified);
        matchedFile = modified;
      } else {
        updated.push(item);
      }
    }
    setFiles(updated);
    saveCloudFiles(updated);
    if (matchedFile) {
      setPreviewFile(matchedFile);
    }
    showToast("Google Drive link attached & synced to cloud!", "success");
  }

  function handleAddSingleFile(newFile) {
    var updated = [newFile].concat(files);
    setFiles(updated);
    saveCloudFiles(updated);
    var meta = getCategoryDetails(newFile.category);
    showToast("Added \"" + newFile.name + "\" & synced to cloud!", "success");
  }

  function handleBatchAddFiles(newFileList) {
    var updated = newFileList.concat(files);
    setFiles(updated);
    saveCloudFiles(updated);
    showToast("Imported & synced " + newFileList.length + " notes to cloud!", "success");
  }

  function handleDeleteFile(fileId) {
    var remaining = [];
    for (var i = 0; i < files.length; i = i + 1) {
      if (files[i].id !== fileId) {
        remaining.push(files[i]);
      }
    }
    setFiles(remaining);
    saveCloudFiles(remaining);
    showToast("File removed and synced to cloud", "info");
  }

  function handleCopyShareLink(file) {
    var urlToCopy = "";
    if (file.driveId) {
      urlToCopy = buildDriveViewUrl(file.driveId);
    } else {
      urlToCopy = window.location.href;
    }

    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(urlToCopy).then(function() {
        showToast("Public link copied to clipboard!", "success");
      });
    } else {
      showToast("Link: " + urlToCopy, "info");
    }
  }

  function handleResetDefaultFiles() {
    if (window.confirm("Restore default study files and clear custom edits?")) {
      var def = getDefaultFiles();
      setFiles(def);
      localStorage.removeItem(STORAGE_KEY);
      showToast("Default files restored", "info");
    }
  }

  // Calculate category counts
  var categoryCounts = {
    all: files.length,
    starred: 0
  };

  for (var c = 0; c < files.length; c = c + 1) {
    var f = files[c];
    if (f.starred) {
      categoryCounts.starred = (categoryCounts.starred || 0) + 1;
    }
    if (f.category) {
      categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
    }
  }

  // Filter & Search files
  var filteredFiles = [];
  var queryLower = searchQuery.trim().toLowerCase();

  for (var k = 0; k < files.length; k = k + 1) {
    var currentFile = files[k];
    var matchesCategory = true;

    if (activeCategory === "starred") {
      matchesCategory = Boolean(currentFile.starred);
    } else if (activeCategory !== "all") {
      matchesCategory = currentFile.category === activeCategory;
    }

    var matchesSearch = true;
    if (queryLower) {
      var nameMatch = currentFile.name.toLowerCase().indexOf(queryLower) !== -1;
      var descMatch =
        currentFile.description &&
        currentFile.description.toLowerCase().indexOf(queryLower) !== -1;
      var catMatch =
        currentFile.category &&
        currentFile.category.toLowerCase().indexOf(queryLower) !== -1;
      matchesSearch = nameMatch || descMatch || catMatch;
    }

    if (matchesCategory && matchesSearch) {
      filteredFiles.push(currentFile);
    }
  }

  // Sort files
  filteredFiles.sort(function(a, b) {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0; // recent order
  });

  var activeCategoryMeta =
    activeCategory === "starred"
      ? {
          name: "Starred Notes",
          icon: "⭐",
          color: "#eab308",
          description: "Your bookmarked and most important reference sheets"
        }
      : getCategoryDetails(activeCategory);

  return (
    <div className="app-root">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={function() {
          setIsAddModalOpen(true);
        }}
        onOpenSyncModal={function() {
          setIsAddModalOpen(true);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        totalFiles={files.length}
      />

      <main className="main-content">
        <section className="hero-banner">
          <div className="hero-content">
            <div className="hero-badge">⚡ Auto-Segregated Google Drive Vault</div>
            <h2 className="hero-heading">Public Study Material &amp; Cheat Sheets</h2>
            <p className="hero-description">
              Upload your PDFs directly to Google Drive, and this dashboard will automatically segregate
              them into <strong>SQL &amp; Databases</strong>, <strong>Java &amp; Full Stack</strong>,{" "}
              <strong>DSA Patterns</strong>, <strong>Interview &amp; Aptitude</strong>,{" "}
              <strong>Python</strong>, and <strong>Other Files</strong>.
            </p>
          </div>

          <div className="hero-stats">
            <div
              className="stat-pill"
              style={{ "--pill-color": "#0284c7", "--pill-rgb": "2, 132, 199" }}
              onClick={function() { setActiveCategory("sql"); }}
            >
              <span className="stat-icon">🗄️</span>
              <span className="stat-number">{categoryCounts.sql || 0}</span>
              <span className="stat-label">SQL</span>
            </div>
            <div
              className="stat-pill"
              style={{ "--pill-color": "#ea580c", "--pill-rgb": "234, 88, 12" }}
              onClick={function() { setActiveCategory("fullstack"); }}
            >
              <span className="stat-icon">☕</span>
              <span className="stat-number">{categoryCounts.fullstack || 0}</span>
              <span className="stat-label">Java / Full Stack</span>
            </div>
            <div
              className="stat-pill"
              style={{ "--pill-color": "#059669", "--pill-rgb": "5, 150, 105" }}
              onClick={function() { setActiveCategory("dsa"); }}
            >
              <span className="stat-icon">⚡</span>
              <span className="stat-number">{categoryCounts.dsa || 0}</span>
              <span className="stat-label">DSA Patterns</span>
            </div>
            <div
              className="stat-pill"
              style={{ "--pill-color": "#db2777", "--pill-rgb": "219, 39, 119" }}
              onClick={function() { setActiveCategory("interview"); }}
            >
              <span className="stat-icon">🎯</span>
              <span className="stat-number">{categoryCounts.interview || 0}</span>
              <span className="stat-label">Interview &amp; Aptitude</span>
            </div>
            <div
              className="stat-pill"
              style={{ "--pill-color": "#2563eb", "--pill-rgb": "37, 99, 235" }}
              onClick={function() { setActiveCategory("python"); }}
            >
              <span className="stat-icon">🐍</span>
              <span className="stat-number">{categoryCounts.python || 0}</span>
              <span className="stat-label">Python</span>
            </div>
            <div
              className="stat-pill"
              style={{ "--pill-color": "#64748b", "--pill-rgb": "100, 116, 139" }}
              onClick={function() { setActiveCategory("other_files"); }}
            >
              <span className="stat-icon">📁</span>
              <span className="stat-number">{categoryCounts.other_files || 0}</span>
              <span className="stat-label">Other Files</span>
            </div>
          </div>
        </section>

        <CategoryFilter
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          counts={categoryCounts}
        />

        <section className="files-section">
          <div className="section-toolbar">
            <div className="active-filter-indicator">
              <span className="filter-icon">{activeCategoryMeta.icon}</span>
              <div>
                <h3 className="filter-heading">{activeCategoryMeta.name}</h3>
                <span className="filter-subheading">
                  Showing {filteredFiles.length} of {files.length} file{files.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="toolbar-controls">
              <div className="sort-wrapper">
                <label htmlFor="sort-select" className="sort-label">Sort:</label>
                <select
                  id="sort-select"
                  className="sort-select"
                  value={sortBy}
                  onChange={function(e) {
                    setSortBy(e.target.value);
                  }}
                >
                  <option value="recent">Default (Recent)</option>
                  <option value="name">Alphabetical (A-Z)</option>
                </select>
              </div>

              <div className="view-toggle-group">
                <button
                  type="button"
                  className={"view-btn" + (viewMode === "grid" ? " active" : "")}
                  onClick={function() {
                    setViewMode("grid");
                  }}
                  title="Grid View"
                >
                  ▦
                </button>
                <button
                  type="button"
                  className={"view-btn" + (viewMode === "list" ? " active" : "")}
                  onClick={function() {
                    setViewMode("list");
                  }}
                  title="List View"
                >
                  ☰
                </button>
              </div>
            </div>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No matching notes found</h3>
              <p>
                {searchQuery
                  ? "No files matched your query \"" + searchQuery + "\"."
                  : "No notes have been categorized under " + activeCategoryMeta.name + " yet."}
              </p>
              <div className="empty-actions">
                {searchQuery ? (
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={function() {
                      setSearchQuery("");
                    }}
                  >
                    Clear Search
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-primary"
                  onClick={function() {
                    setIsAddModalOpen(true);
                  }}
                >
                  + Add Notes to this Category
                </button>
              </div>
            </div>
          ) : (
            <div className={"files-container view-" + viewMode}>
              {filteredFiles.map(function(item) {
                return (
                  <FileCard
                    key={item.id}
                    file={item}
                    onPreview={setPreviewFile}
                    onToggleStar={handleToggleStar}
                    onCopyLink={handleCopyShareLink}
                    onDelete={handleDeleteFile}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>
            StudyVault • Segregated Public Drive Portal for Students &amp; Developers
          </p>
          <div className="footer-links">
            <button type="button" className="footer-link-btn" onClick={handleResetDefaultFiles}>
              Restore Default Notes
            </button>
          </div>
        </div>
      </footer>

      {previewFile ? (
        <FileModal
          file={previewFile}
          onClose={function() {
            setPreviewFile(null);
          }}
          onUpdateFileDriveId={handleUpdateDriveId}
          onCopyLink={handleCopyShareLink}
        />
      ) : null}

      <AddFileModal
        isOpen={isAddModalOpen}
        onClose={function() {
          setIsAddModalOpen(false);
        }}
        onAddFile={handleAddSingleFile}
        onBatchAdd={handleBatchAddFiles}
      />

      <Toast
        message={toast ? toast.message : ""}
        type={toast ? toast.type : "info"}
        onClose={handleCloseToast}
      />
    </div>
  );
}
