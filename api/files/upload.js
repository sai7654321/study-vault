import { getAuthenticatedUser } from "../_lib/auth.js";
import { getFilesFromStorage, saveFilesToStorage } from "../_lib/jsonbin.js";
import { uploadFileToDrive } from "../_lib/drive.js";

// Max upload size: 15MB
var MAX_FILE_SIZE = 15 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Authenticate admin
  var user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(403).json({
      error: "Forbidden: Admin privileges required to upload study files."
    });
  }

  var body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  var fileName = (body.fileName || "").trim();
  var fileBase64 = body.fileBase64;
  var mimeType = body.mimeType || "application/pdf";
  var description = body.description || "";

  if (!fileName || !fileBase64) {
    return res.status(400).json({ error: "Missing fileName or fileBase64 content." });
  }

  // 2. Validate file type (must be PDF)
  if (!fileName.toLowerCase().endsWith(".pdf") && mimeType !== "application/pdf") {
    return res.status(400).json({ error: "Invalid file type: Only PDF documents are allowed." });
  }

  // Clean base64 string if data URL prefix is included
  var cleanBase64 = fileBase64;
  if (cleanBase64.indexOf(",") !== -1) {
    cleanBase64 = cleanBase64.split(",")[1];
  }

  var buffer = Buffer.from(cleanBase64, "base64");

  // 3. Validate file size
  if (buffer.length > MAX_FILE_SIZE) {
    return res.status(400).json({
      error: "File is too large. Maximum allowed size is 15MB."
    });
  }

  // 4. Upload to Google Drive
  var driveResult;
  try {
    driveResult = await uploadFileToDrive(fileName, buffer, mimeType);
  } catch (driveErr) {
    console.error("Google Drive upload failed:", driveErr);
    return res.status(500).json({
      error: "Failed to upload to Google Drive: " + driveErr.message
    });
  }

  // 5. Store file record in storage
  var newFile = {
    id: "uploaded-" + Date.now(),
    name: driveResult.name || fileName,
    driveId: driveResult.driveId,
    size: driveResult.size,
    uploadDate: "Just now",
    starred: false,
    description: description || "Uploaded directly to Google Drive vault"
  };

  var currentFiles = await getFilesFromStorage();
  var updated = [newFile].concat(currentFiles);
  var saveResult = await saveFilesToStorage(updated);

  if (!saveResult.success) {
    console.warn("File was uploaded to Drive, but failed to save to JSONBin.");
  }

  return res.status(201).json({
    success: true,
    file: newFile,
    message: "PDF uploaded successfully to Google Drive and added to StudyWallet!"
  });
}
