// Secure file service: interacts with protected server API endpoints
// Does not expose cloud storage keys in client bundles

export function fetchCloudFiles() {
  return fetch("/api/files")
    .then(function(response) {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(function(data) {
      if (data && Array.isArray(data.files)) {
        return data.files;
      }
      return null;
    })
    .catch(function(error) {
      console.warn("Server API fetch fallback to local:", error);
      return null;
    });
}

export function saveCloudFiles(filesList) {
  var token = null;
  try {
    token = localStorage.getItem("studyvault_token");
  } catch (e) {
    token = null;
  }

  // Cloud synchronization is restricted to authenticated admins
  if (!token) {
    return Promise.resolve({
      success: false,
      error: "Admin authentication required for cloud sync."
    });
  }

  var payload = [];
  for (var i = 0; i < filesList.length; i = i + 1) {
    var f = filesList[i];
    payload.push({
      id: f.id,
      name: f.name,
      driveId: f.driveId || "",
      size: f.size || "PDF Document",
      uploadDate: f.uploadDate || "Recent",
      starred: Boolean(f.starred),
      description: f.description || ""
    });
  }

  return fetch("/api/files", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ files: payload })
  })
    .then(function(response) {
      if (!response.ok) {
        throw new Error("HTTP sync error " + response.status);
      }
      return response.json();
    })
    .then(function(result) {
      return { success: true, result: result };
    })
    .catch(function(error) {
      console.error("Failed to sync files to server:", error);
      return { success: false, error: error };
    });
}
