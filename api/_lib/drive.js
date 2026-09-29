import crypto from "crypto";

var DEFAULT_FOLDER_ID = "1awA5Bnw1pleg3yr3TK7uPY7vsuYvQh9F";

// Obtains Google OAuth Access Token from Service Account credentials
async function getServiceAccountAccessToken(serviceAccount) {
  var now = Math.floor(Date.now() / 1000);
  var header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  var claimSet = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  })).toString("base64url");

  var sign = crypto.createSign("RSA-SHA256");
  sign.update(header + "." + claimSet);
  sign.end();
  var signature = sign.sign(serviceAccount.private_key, "base64url");

  var assertion = header + "." + claimSet + "." + signature;

  var response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: assertion
    })
  });

  if (!response.ok) {
    var errorText = await response.text();
    throw new Error("Failed to authenticate service account: " + errorText);
  }

  var data = await response.json();
  return data.access_token;
}

// Parses service account credentials from environment variables
function getServiceAccountCredentials() {
  var keyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyRaw) {
    return null;
  }
  try {
    // Check if base64 encoded
    if (keyRaw.trim().startsWith("{")) {
      return JSON.parse(keyRaw);
    }
    var decoded = Buffer.from(keyRaw, "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch (err) {
    console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:", err);
    return null;
  }
}

export async function uploadFileToDrive(fileName, fileBuffer, mimeType) {
  var folderId = process.env.DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID;
  var serviceAccount = getServiceAccountCredentials();

  // If Google Apps Script webhook is configured instead
  var appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (appsScriptUrl) {
    return uploadViaAppsScript(appsScriptUrl, fileName, fileBuffer, mimeType, folderId);
  }

  if (!serviceAccount) {
    throw new Error("Google Drive credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_APPS_SCRIPT_URL in environment variables.");
  }

  var accessToken = await getServiceAccountAccessToken(serviceAccount);

  // Multipart upload to Google Drive API v3
  var boundary = "-------314159265358979323846";
  var delimiter = "\r\n--" + boundary + "\r\n";
  var closeDelimiter = "\r\n--" + boundary + "--";

  var metadata = {
    name: fileName,
    parents: [folderId]
  };

  var multipartBody = Buffer.concat([
    Buffer.from(
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      "Content-Type: " + (mimeType || "application/pdf") + "\r\n\r\n"
    ),
    fileBuffer,
    Buffer.from(closeDelimiter)
  ]);

  var uploadResponse = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink",
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "multipart/related; boundary=" + boundary
      },
      body: multipartBody
    }
  );

  if (!uploadResponse.ok) {
    var errText = await uploadResponse.text();
    throw new Error("Google Drive upload error: " + errText);
  }

  var fileData = await uploadResponse.json();

  // Make file publicly readable by anyone with the link
  try {
    await fetch("https://www.googleapis.com/drive/v3/files/" + fileData.id + "/permissions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone"
      })
    });
  } catch (permErr) {
    console.warn("Could not set public permission on Drive file:", permErr);
  }

  return {
    driveId: fileData.id,
    name: fileData.name,
    size: formatBytes(fileData.size || fileBuffer.length)
  };
}

export async function deleteFileFromDrive(driveId) {
  if (!driveId) {
    return { success: false, error: "Missing driveId" };
  }

  var appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (appsScriptUrl) {
    return deleteViaAppsScript(appsScriptUrl, driveId);
  }

  var serviceAccount = getServiceAccountCredentials();
  if (!serviceAccount) {
    console.warn("GOOGLE_SERVICE_ACCOUNT_KEY not set. Skipping Drive deletion.");
    return { success: true, message: "Drive deletion skipped (no credentials)" };
  }

  try {
    var accessToken = await getServiceAccountAccessToken(serviceAccount);
    var response = await fetch("https://www.googleapis.com/drive/v3/files/" + driveId, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + accessToken
      }
    });

    if (response.ok || response.status === 404) {
      return { success: true };
    }

    var errText = await response.text();
    return { success: false, error: errText };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function uploadViaAppsScript(url, fileName, fileBuffer, mimeType, folderId) {
  var base64Data = fileBuffer.toString("base64");
  var response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "upload",
      secret: process.env.APPS_SCRIPT_SECRET || "",
      folderId: folderId,
      fileName: fileName,
      mimeType: mimeType || "application/pdf",
      fileBase64: base64Data
    })
  });

  if (!response.ok) {
    throw new Error("Apps Script upload returned HTTP " + response.status);
  }

  var resJson = await response.json();
  if (!resJson.success) {
    throw new Error(resJson.error || "Apps Script upload failed");
  }

  return {
    driveId: resJson.fileId,
    name: fileName,
    size: formatBytes(fileBuffer.length)
  };
}

async function deleteViaAppsScript(url, driveId) {
  try {
    var response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        secret: process.env.APPS_SCRIPT_SECRET || "",
        driveId: driveId
      })
    });

    var resJson = await response.json();
    return resJson;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function formatBytes(bytes) {
  var b = parseInt(bytes, 10);
  if (isNaN(b) || b <= 0) return "PDF Document";
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
}
