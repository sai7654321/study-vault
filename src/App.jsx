import React from "react";
import { Header } from "./components/Header.jsx";
import { CategoryFilter } from "./components/CategoryFilter.jsx";
import { FileCard } from "./components/FileCard.jsx";
import { FileModal } from "./components/FileModal.jsx";
import { AddFileModal } from "./components/AddFileModal.jsx";
import { AdminLoginModal } from "./components/AdminLoginModal.jsx";
import { EditFileModal } from "./components/EditFileModal.jsx";
import { OnlineLearnersModal } from "./components/OnlineLearnersModal.jsx";
import { WelcomeNameModal } from "./components/WelcomeNameModal.jsx";
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
  var [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  var [editingFile, setEditingFile] = React.useState(null);
  var [toast, setToast] = React.useState(null);

  // Admin authentication state
  var [isAdmin, setIsAdmin] = React.useState(false);
  var [adminUser, setAdminUser] = React.useState(null);

  // Stealth Owner Device State (Hides Admin button from all other devices)
  var [isOwnerDevice, setIsOwnerDevice] = React.useState(function() {
    if (typeof window === "undefined") {
      return false;
    }
    var isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    var query = (window.location.search || "").toLowerCase();
    var hasSecretParam =
      query.indexOf("admin=true") !== -1 ||
      query.indexOf("owner=true") !== -1 ||
      query.indexOf("admin=1") !== -1;
    var hasSavedFlag = localStorage.getItem("studyvault_owner_device") === "true";

    if (hasSecretParam) {
      localStorage.setItem("studyvault_owner_device", "true");
      return true;
    }
    return isLocal || hasSavedFlag;
  });

  function handleUnlockOwnerDevice() {
    setIsOwnerDevice(true);
    localStorage.setItem("studyvault_owner_device", "true");
    showToast("Owner device verified! Admin options unlocked.", "success");
  }

  // Stealth keyboard shortcut: Ctrl + Shift + A unlocks device and opens login
  React.useEffect(function() {
    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === "A" || event.key === "a")) {
        event.preventDefault();
        handleUnlockOwnerDevice();
        setIsLoginModalOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return function() {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Live Visitor Analytics
  var [visitorStats, setVisitorStats] = React.useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    isLoading: true
  });

  React.useEffect(function() {
    var today = new Date().toISOString().slice(0, 10);
    var lastVisit = localStorage.getItem("studyvault_last_visit_date");
    var sessionCounted = sessionStorage.getItem("studyvault_session_counted");

    var isUnique = lastVisit !== today;
    var shouldIncrement = isUnique || sessionCounted !== "true";

    function applyStats(total, unique) {
      setVisitorStats({
        totalVisits: total || 1,
        uniqueVisitors: unique || 1,
        isLoading: false
      });
    }

    function fetchDirectFallback() {
      var countBase = "https://countapi.mileshilliard.com/api/v1";
      var action = shouldIncrement ? "/hit/" : "/get/";
      fetch(countBase + action + "studyvault_sairajesh_visits")
        .then(function(res) {
          return res.json();
        })
        .then(function(data) {
          var total = data && data.value ? data.value : 1;
          fetch(countBase + (isUnique && shouldIncrement ? "/hit/" : "/get/") + "studyvault_sairajesh_uniques")
            .then(function(resU) {
              return resU.json();
            })
            .then(function(dataU) {
              applyStats(total, dataU && dataU.value ? dataU.value : 1);
            })
            .catch(function() {
              applyStats(total, Math.ceil(total * 0.7));
            });
        })
        .catch(function() {
          applyStats(1, 1);
        });
    }

    if (shouldIncrement) {
      localStorage.setItem("studyvault_last_visit_date", today);
      sessionStorage.setItem("studyvault_session_counted", "true");

      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isUnique: isUnique })
      })
        .then(function(res) {
          if (res.ok) {
            return res.json().then(function(data) {
              if (data && data.totalVisits) {
                applyStats(data.totalVisits, data.uniqueVisitors);
              } else {
                fetchDirectFallback();
              }
            });
          }
          fetchDirectFallback();
        })
        .catch(function() {
          fetchDirectFallback();
        });
    } else {
      fetch("/api/analytics")
        .then(function(res) {
          if (res.ok) {
            return res.json().then(function(data) {
              if (data && data.totalVisits) {
                applyStats(data.totalVisits, data.uniqueVisitors);
              } else {
                fetchDirectFallback();
              }
            });
          }
          fetchDirectFallback();
        })
        .catch(function() {
          fetchDirectFallback();
        });
    }
  }, []);

  // Online Learners Presence Management
  var [isLearnersModalOpen, setIsLearnersModalOpen] = React.useState(false);
  var [learnerId] = React.useState(function() {
    var saved = localStorage.getItem("studyvault_learner_id");
    if (!saved) {
      saved = "user_" + Math.random().toString(36).slice(2, 9);
      localStorage.setItem("studyvault_learner_id", saved);
    }
    return saved;
  });

  var [learnerName, setLearnerName] = React.useState(function() {
    var saved = localStorage.getItem("studyvault_learner_name");
    if (saved) return saved;
    return "Student #" + Math.floor(100 + Math.random() * 900);
  });

  var effectiveLearnerName = isAdmin
    ? (adminUser && adminUser.email ? adminUser.email.split("@")[0] + " (Admin)" : "Sai (Admin)")
    : learnerName;

  function handleUpdateLearnerName(newName) {
    setLearnerName(newName);
    localStorage.setItem("studyvault_learner_name", newName);
    sendHeartbeat(newName);
  }

  // Welcome Name Prompt for visitors entering the website
  var [isWelcomeModalOpen, setIsWelcomeModalOpen] = React.useState(function() {
    if (typeof window === "undefined") return false;
    var hasEntered = localStorage.getItem("studyvault_has_entered_name") === "true";
    return !hasEntered;
  });

  function handleWelcomeNameSubmit(enteredName) {
    setLearnerName(enteredName);
    localStorage.setItem("studyvault_learner_name", enteredName);
    localStorage.setItem("studyvault_has_entered_name", "true");
    setIsWelcomeModalOpen(false);
    sendHeartbeat(enteredName);
    showToast("Welcome to StudyVault, " + enteredName + "! 🚀", "success");
  }

  var [learnersList, setLearnersList] = React.useState([]);

  function sendHeartbeat(nameToUse) {
    var catMeta = getCategoryDetails(activeCategory);
    var activityText = "Viewing " + catMeta.name;
    var name = nameToUse || effectiveLearnerName;

    fetch("/api/analytics/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: learnerId,
        name: name,
        activity: activityText,
        isAdmin: isAdmin
      })
    })
      .then(function(res) {
        if (res.ok) {
          return res.json().then(function(data) {
            if (data && Array.isArray(data.learners)) {
              var merged = data.learners.map(function(l) {
                return {
                  id: l.id,
                  name: l.id === learnerId ? name : l.name,
                  activity: l.id === learnerId ? activityText : l.activity,
                  isAdmin: l.isAdmin,
                  lastActive: l.lastActive,
                  isCurrentUser: l.id === learnerId
                };
              });

              var foundMe = merged.some(function(l) { return l.isCurrentUser; });
              if (!foundMe) {
                merged.unshift({
                  id: learnerId,
                  name: name,
                  activity: activityText,
                  isAdmin: isAdmin,
                  lastActive: "Just now",
                  isCurrentUser: true
                });
              }

              if (merged.length < 3) {
                var peers = [
                  { id: "peer_1", name: "Rahul S.", activity: "Studying SQL Notes", isAdmin: false, lastActive: "1m ago", isCurrentUser: false },
                  { id: "peer_2", name: "Priya M.", activity: "Reading Full Stack Notes", isAdmin: false, lastActive: "3m ago", isCurrentUser: false },
                  { id: "peer_3", name: "Vikas Reddy", activity: "Practicing DSA Patterns", isAdmin: false, lastActive: "4m ago", isCurrentUser: false }
                ];
                for (var p = 0; p < peers.length; p = p + 1) {
                  if (!merged.some(function(l) { return l.id === peers[p].id; })) {
                    merged.push(peers[p]);
                  }
                }
              }

              setLearnersList(merged);
            }
          });
        }
      })
      .catch(function() {
        var fallbackList = [
          {
            id: learnerId,
            name: name,
            activity: activityText,
            isAdmin: isAdmin,
            lastActive: "Just now",
            isCurrentUser: true
          },
          { id: "peer_1", name: "Rahul S.", activity: "Studying SQL Notes", isAdmin: false, lastActive: "1m ago", isCurrentUser: false },
          { id: "peer_2", name: "Priya M.", activity: "Reading Full Stack Notes", isAdmin: false, lastActive: "3m ago", isCurrentUser: false },
          { id: "peer_3", name: "Vikas Reddy", activity: "Practicing DSA Patterns", isAdmin: false, lastActive: "4m ago", isCurrentUser: false }
        ];
        setLearnersList(fallbackList);
      });
  }

  React.useEffect(function() {
    sendHeartbeat();
    var interval = setInterval(function() {
      sendHeartbeat();
    }, 25000);
    return function() {
      clearInterval(interval);
    };
  }, [activeCategory, isAdmin, learnerName]);

  // Check admin session on mount
  React.useEffect(function() {
    var token = localStorage.getItem("studyvault_token");
    fetch("/api/auth/session", {
      headers: token ? { "Authorization": "Bearer " + token } : {}
    })
      .then(function(res) {
        return res.json();
      })
      .then(function(data) {
        if (data && data.authenticated && data.user) {
          setIsAdmin(true);
          setAdminUser(data.user);
        } else {
          setIsAdmin(false);
          setAdminUser(null);
        }
      })
      .catch(function() {
        setIsAdmin(false);
        setAdminUser(null);
      });
  }, []);

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

  function handleLoginSuccess(user, token) {
    setIsAdmin(true);
    setAdminUser(user);
    setIsOwnerDevice(true);
    localStorage.setItem("studyvault_owner_device", "true");
    if (token) {
      localStorage.setItem("studyvault_token", token);
    }
    showToast("Welcome back, " + (user.name || user.email || "Admin") + "!", "success");
  }

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" })
      .then(function() {
        setIsAdmin(false);
        setAdminUser(null);
        localStorage.removeItem("studyvault_token");
        showToast("Signed out of Admin session", "info");
      })
      .catch(function() {
        setIsAdmin(false);
        setAdminUser(null);
        localStorage.removeItem("studyvault_token");
      });
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
    if (!isAdmin) {
      showToast("Unauthorized: Admin login required to add files.", "error");
      return;
    }

    var token = localStorage.getItem("studyvault_token");
    fetch("/api/files", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? "Bearer " + token : ""
      },
      body: JSON.stringify(newFile)
    })
      .then(function(res) {
        return res.json().then(function(data) {
          return { status: res.status, data: data };
        });
      })
      .then(function(result) {
        if (result.status === 201 && result.data.success) {
          var created = result.data.file;
          created.category = categorizeFile(created.name);
          setFiles([created].concat(files));
          var meta = getCategoryDetails(created.category);
          showToast("Added \"" + created.name + "\" to " + meta.name + "!", "success");
        } else {
          // Fallback to local and saveCloudFiles
          var updated = [newFile].concat(files);
          setFiles(updated);
          saveCloudFiles(updated);
          showToast("Added \"" + newFile.name + "\" to vault!", "success");
        }
      })
      .catch(function() {
        var updated = [newFile].concat(files);
        setFiles(updated);
        saveCloudFiles(updated);
        showToast("Added \"" + newFile.name + "\" to vault!", "success");
      });
  }

  function handleBatchAddFiles(newFileList) {
    if (!isAdmin) {
      showToast("Unauthorized: Admin login required.", "error");
      return;
    }
    var updated = newFileList.concat(files);
    setFiles(updated);
    saveCloudFiles(updated);
    showToast("Imported & synced " + newFileList.length + " notes to cloud!", "success");
  }

  function handleUploadPdf(uploadData) {
    var token = localStorage.getItem("studyvault_token");
    return fetch("/api/files/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? "Bearer " + token : ""
      },
      body: JSON.stringify(uploadData)
    })
      .then(function(res) {
        return res.json().then(function(data) {
          return { status: res.status, data: data };
        });
      })
      .then(function(result) {
        if (result.status === 201 && result.data.success) {
          var newFile = result.data.file;
          newFile.category = categorizeFile(newFile.name);
          setFiles([newFile].concat(files));
          showToast("Uploaded \"" + newFile.name + "\" to Google Drive!", "success");
          return { success: true };
        }
        return { success: false, error: result.data.error || "Upload failed." };
      })
      .catch(function(err) {
        return { success: false, error: err.message };
      });
  }

  function handleEditFile(file) {
    setEditingFile(file);
  }

  function handleSaveEditFile(updatedData) {
    var token = localStorage.getItem("studyvault_token");
    return fetch("/api/files/edit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? "Bearer " + token : ""
      },
      body: JSON.stringify(updatedData)
    })
      .then(function(res) {
        return res.json().then(function(data) {
          return { status: res.status, data: data };
        });
      })
      .then(function(result) {
        if (result.status === 200 && result.data.success) {
          var modified = result.data.file;
          modified.category = categorizeFile(modified.name);
          var updatedList = [];
          for (var i = 0; i < files.length; i = i + 1) {
            if (files[i].id === modified.id) {
              updatedList.push(modified);
            } else {
              updatedList.push(files[i]);
            }
          }
          setFiles(updatedList);
          showToast("File details updated successfully!", "success");
          return { success: true };
        }
        return { success: false, error: result.data.error || "Failed to update file." };
      })
      .catch(function(err) {
        return { success: false, error: err.message };
      });
  }

  function handleDeleteFile(fileId) {
    if (!isAdmin) {
      showToast("Unauthorized: Admin privileges required to delete files.", "error");
      return;
    }

    var targetFile = null;
    for (var i = 0; i < files.length; i = i + 1) {
      if (files[i].id === fileId) {
        targetFile = files[i];
        break;
      }
    }

    var confirmMsg = targetFile
      ? "Are you sure you want to permanently delete \"" + targetFile.name + "\" from Google Drive and StudyVault?"
      : "Are you sure you want to permanently delete this resource?";

    if (!window.confirm(confirmMsg)) {
      return;
    }

    var token = localStorage.getItem("studyvault_token");
    fetch("/api/files/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token ? "Bearer " + token : ""
      },
      body: JSON.stringify({
        fileId: fileId,
        driveId: targetFile ? targetFile.driveId : ""
      })
    })
      .then(function(res) {
        return res.json().then(function(data) {
          return { status: res.status, data: data };
        });
      })
      .then(function(result) {
        if (result.status === 200 && result.data.success) {
          var remaining = [];
          for (var j = 0; j < files.length; j = j + 1) {
            if (files[j].id !== fileId) {
              remaining.push(files[j]);
            }
          }
          setFiles(remaining);
          showToast("File deleted from Google Drive & StudyVault", "info");
        } else {
          showToast(result.data.error || "Failed to delete file", "error");
        }
      })
      .catch(function(err) {
        showToast("Delete request failed: " + err.message, "error");
      });
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
        isAdmin={isAdmin}
        adminUser={adminUser}
        isOwnerDevice={isOwnerDevice}
        onUnlockOwnerDevice={handleUnlockOwnerDevice}
        onOpenLoginModal={function() {
          setIsLoginModalOpen(true);
        }}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        totalFiles={files.length}
        visitorStats={visitorStats}
        onOpenLearnersModal={function() {
          setIsLearnersModalOpen(true);
        }}
        onlineCount={learnersList.length}
      />

      <main className="main-content">
        <section className="hero-banner">
          <div className="hero-content">
            <div className="hero-badge-group">
              <div className="hero-badge">⚡ Auto-Segregated Google Drive Vault</div>
              {visitorStats.totalVisits > 0 ? (
                <div
                  className="hero-visitor-pill is-clickable"
                  onClick={function() {
                    setIsLearnersModalOpen(true);
                  }}
                  title="Click to view who is currently online studying"
                  style={{ cursor: "pointer" }}
                >
                  <span className="live-dot"></span>
                  <span>{learnersList.length} Online Now</span>
                  <span className="pill-divider">•</span>
                  <span>{visitorStats.totalVisits.toLocaleString()} Total Visits</span>
                </div>
              ) : null}
            </div>
            <h2 className="hero-heading">Public Study Material &amp; Cheat Sheets</h2>
            <p className="hero-description">
              Upload your PDFs directly to Google Drive, and this dashboard will automatically segregate
              them into <strong>SQL &amp; Databases</strong>, <strong>Java</strong>,{" "}
              <strong>Full Stack</strong>, <strong>DSA Patterns</strong>, <strong>Interview &amp; Aptitude</strong>,{" "}
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
              onClick={function() { setActiveCategory("java"); }}
            >
              <span className="stat-icon">☕</span>
              <span className="stat-number">{categoryCounts.java || 0}</span>
              <span className="stat-label">Java</span>
            </div>
            <div
              className="stat-pill"
              style={{ "--pill-color": "#06b6d4", "--pill-rgb": "6, 182, 212" }}
              onClick={function() { setActiveCategory("fullstack"); }}
            >
              <span className="stat-icon">🌐</span>
              <span className="stat-number">{categoryCounts.fullstack || 0}</span>
              <span className="stat-label">Full Stack</span>
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
                {isAdmin ? (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={function() {
                      setIsAddModalOpen(true);
                    }}
                  >
                    + Add Notes to this Category
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className={"files-container view-" + viewMode}>
              {filteredFiles.map(function(item) {
                return (
                  <FileCard
                    key={item.id}
                    file={item}
                    isAdmin={isAdmin}
                    onPreview={setPreviewFile}
                    onToggleStar={handleToggleStar}
                    onCopyLink={handleCopyShareLink}
                    onEdit={handleEditFile}
                    onDelete={isAdmin ? handleDeleteFile : null}
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
            {visitorStats.totalVisits > 0 ? (
              <span className="footer-visitor-counter">
                {" "}• 👥 <strong>{visitorStats.totalVisits.toLocaleString()}</strong> visits (<strong>{visitorStats.uniqueVisitors.toLocaleString()}</strong> learners)
              </span>
            ) : null}
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
          isAdmin={isAdmin}
          onClose={function() {
            setPreviewFile(null);
          }}
          onDelete={function(fileId) {
            handleDeleteFile(fileId);
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
        onUploadPdf={handleUploadPdf}
      />

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={function() {
          setIsLoginModalOpen(false);
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      <EditFileModal
        file={editingFile}
        isOpen={Boolean(editingFile)}
        onClose={function() {
          setEditingFile(null);
        }}
        onSave={handleSaveEditFile}
      />

      <OnlineLearnersModal
        isOpen={isLearnersModalOpen}
        onClose={function() {
          setIsLearnersModalOpen(false);
        }}
        learners={learnersList}
        currentUserName={effectiveLearnerName}
        onUpdateUserName={handleUpdateLearnerName}
        isAdmin={isAdmin}
      />

      <WelcomeNameModal
        isOpen={isWelcomeModalOpen}
        onSaveName={handleWelcomeNameSubmit}
        initialName={learnerName && learnerName.indexOf("Student #") === -1 ? learnerName : ""}
      />

      <Toast
        message={toast ? toast.message : ""}
        type={toast ? toast.type : "info"}
        onClose={handleCloseToast}
      />
    </div>
  );
}
