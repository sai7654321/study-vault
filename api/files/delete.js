import { getAuthenticatedUser } from "../_lib/auth.js";
import { getFilesFromStorage, saveFilesToStorage } from "../_lib/jsonbin.js";
import { deleteFileFromDrive } from "../_lib/drive.js";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", "POST, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Strictly verify admin authorization server-side
  var user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(403).json({
      error: "Forbidden: You are not authorized to delete study resources."
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

  var fileId = body.fileId;
  var driveId = body.driveId;

  if (!fileId && !driveId) {
    return res.status(400).json({ error: "Missing required fileId or driveId" });
  }

  // Delete from Google Drive if driveId is present
  if (driveId) {
    try {
      await deleteFileFromDrive(driveId);
    } catch (driveErr) {
      console.warn("Could not delete from Drive directly:", driveErr);
    }
  }

  // Remove from vault storage
  var currentFiles = await getFilesFromStorage();
  var remaining = [];
  for (var i = 0; i < currentFiles.length; i = i + 1) {
    var f = currentFiles[i];
    if (f.id !== fileId && (!driveId || f.driveId !== driveId)) {
      remaining.push(f);
    }
  }

  var saveResult = await saveFilesToStorage(remaining);
  if (!saveResult.success) {
    return res.status(500).json({ error: "Failed to update storage after deletion." });
  }

  return res.status(200).json({
    success: true,
    message: "File deleted successfully from Drive and StudyVault."
  });
}
