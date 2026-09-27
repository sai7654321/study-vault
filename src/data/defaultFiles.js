import { categorizeFile } from "../utils/driveClassifier.js";
import linksData from "./links.json";

export function getDefaultFiles() {
  var processed = [];
  for (var i = 0; i < linksData.length; i = i + 1) {
    var item = linksData[i];
    var detectedCat = categorizeFile(item.name);
    processed.push({
      id: item.id || "file-" + i,
      name: item.name,
      driveId: item.driveId || "",
      category: detectedCat,
      size: item.size || "PDF Document",
      uploadDate: item.uploadDate || "Recent",
      starred: Boolean(item.starred),
      description: item.description || ""
    });
  }
  return processed;
}
