import { getAuthenticatedUser } from "../_lib/auth.js";
import { getFilesFromStorage, saveFilesToStorage } from "../_lib/jsonbin.js";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PUT") {
    res.setHeader("Allow", "POST, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  }

  var user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(403).json({
      error: "Forbidden: Admin privileges required to edit resource metadata."
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
  if (!fileId) {
    return res.status(400).json({ error: "Missing required fileId" });
  }

  var currentFiles = await getFilesFromStorage();
  var updatedFile = null;
  var updatedList = [];

  for (var i = 0; i < currentFiles.length; i = i + 1) {
    var item = currentFiles[i];
    if (item.id === fileId) {
      var modified = {
        id: item.id,
        name: body.name !== undefined ? body.name : item.name,
        driveId: body.driveId !== undefined ? body.driveId : item.driveId,
        size: body.size !== undefined ? body.size : item.size,
        uploadDate: item.uploadDate,
        starred: body.starred !== undefined ? Boolean(body.starred) : item.starred,
        description: body.description !== undefined ? body.description : item.description
      };
      updatedList.push(modified);
      updatedFile = modified;
    } else {
      updatedList.push(item);
    }
  }

  if (!updatedFile) {
    return res.status(404).json({ error: "File not found" });
  }

  var saveResult = await saveFilesToStorage(updatedList);
  if (!saveResult.success) {
    return res.status(500).json({ error: "Failed to persist changes in storage." });
  }

  return res.status(200).json({
    success: true,
    file: updatedFile
  });
}
