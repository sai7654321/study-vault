import { getAuthenticatedUser } from "../_lib/auth.js";
import { getFilesFromStorage, saveFilesToStorage } from "../_lib/jsonbin.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Public: anyone can fetch and browse the file list
    var files = await getFilesFromStorage();
    return res.status(200).json({
      success: true,
      files: files
    });
  }

  if (req.method === "POST") {
    // Protected: ONLY authenticated Admin can add a note/file
    var user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({
        error: "Unauthorized: Admin privileges required to add study resources."
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

    if (!body.name && !body.driveId) {
      return res.status(400).json({ error: "Missing required file name or Google Drive link" });
    }

    var newFile = {
      id: body.id || "file-" + Date.now(),
      name: body.name || "Study Document",
      driveId: body.driveId || "",
      size: body.size || "PDF Document",
      uploadDate: body.uploadDate || "Just now",
      starred: Boolean(body.starred),
      description: body.description || ""
    };

    var currentFiles = await getFilesFromStorage();
    var updated = [newFile].concat(currentFiles);
    var saveResult = await saveFilesToStorage(updated);

    if (!saveResult.success) {
      return res.status(500).json({ error: "Failed to persist file in storage." });
    }

    return res.status(201).json({
      success: true,
      file: newFile
    });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
