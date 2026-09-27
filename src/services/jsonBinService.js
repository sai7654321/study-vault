// JSONBin.io live cloud storage service
// Stores and updates your PDF links dynamically without redeploying to Vercel

var BIN_ID = "6ab8cfdcac6210605afa3737";
var ACCESS_KEY = "$2a$10$gVoGDRCKPS7u2SD/L1OKdOFcuIOHHnZF5BsJMLcKaTsUp.YJi2SRy";
var BASE_URL = "https://api.jsonbin.io/v3/b/" + BIN_ID;

export function fetchCloudFiles() {
  return fetch(BASE_URL + "/latest", {
    method: "GET",
    headers: {
      "X-Access-Key": ACCESS_KEY
    }
  })
    .then(function(response) {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(function(data) {
      if (data && Array.isArray(data.record)) {
        return data.record;
      }
      return null;
    })
    .catch(function(error) {
      console.warn("JSONBin fetch fallback to local:", error);
      return null;
    });
}

export function saveCloudFiles(filesList) {
  // Strip temporary UI states and keep only necessary link metadata
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

  return fetch(BASE_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Key": ACCESS_KEY
    },
    body: JSON.stringify(payload)
  })
    .then(function(response) {
      if (!response.ok) {
        throw new Error("HTTP update error " + response.status);
      }
      return response.json();
    })
    .then(function(result) {
      return { success: true, result: result };
    })
    .catch(function(error) {
      console.error("Failed to sync to JSONBin.io:", error);
      return { success: false, error: error };
    });
}
