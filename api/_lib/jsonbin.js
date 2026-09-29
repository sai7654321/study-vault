import fs from "fs";
import path from "path";

var DEFAULT_BIN_ID = "6ab8cfdcac6210605afa3737";
var DEFAULT_ACCESS_KEY = "$2a$10$gVoGDRCKPS7u2SD/L1OKdOFcuIOHHnZF5BsJMLcKaTsUp.YJi2SRy";

function getEffectiveAccessKey() {
  var key = process.env.JSONBIN_ACCESS_KEY;
  if (!key || key.indexOf("gVoGDRCKPS7u2SD") === -1) {
    return DEFAULT_ACCESS_KEY;
  }
  return key;
}

export async function getFilesFromStorage() {
  var binId = process.env.JSONBIN_BIN_ID || DEFAULT_BIN_ID;
  var accessKey = getEffectiveAccessKey();

  try {
    var response = await fetch("https://api.jsonbin.io/v3/b/" + binId + "/latest", {
      method: "GET",
      headers: {
        "X-Access-Key": accessKey
      }
    });

    if (response.ok) {
      var data = await response.json();
      if (data && Array.isArray(data.record)) {
        return data.record;
      }
    }
  } catch (err) {
    console.error("Error fetching from JSONBin:", err);
  }

  // Fallback to local links.json
  try {
    var localPath = path.join(process.cwd(), "src", "data", "links.json");
    if (fs.existsSync(localPath)) {
      var content = fs.readFileSync(localPath, "utf8").replace(/^\uFEFF/, "");
      return JSON.parse(content);
    }
  } catch (localErr) {
    console.error("Error reading local links.json:", localErr);
  }

  return [];
}

export async function saveFilesToStorage(filesList) {
  var binId = process.env.JSONBIN_BIN_ID || DEFAULT_BIN_ID;
  var accessKey = getEffectiveAccessKey();

  var payload = [];
  for (var i = 0; i < filesList.length; i = i + 1) {
    var item = filesList[i];
    payload.push({
      id: item.id,
      name: item.name,
      driveId: item.driveId || "",
      size: item.size || "PDF Document",
      uploadDate: item.uploadDate || "Recent",
      starred: Boolean(item.starred),
      description: item.description || ""
    });
  }

  try {
    var response = await fetch("https://api.jsonbin.io/v3/b/" + binId, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Key": accessKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("JSONBin update returned status " + response.status);
    }

    return { success: true };
  } catch (err) {
    console.error("Error saving to JSONBin:", err);
    return { success: false, error: err.message };
  }
}
