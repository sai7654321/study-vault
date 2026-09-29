// In-memory active presence registry (persists across warm serverless invocations)
var activeLearnersMap = new Map();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  var now = Date.now();
  var TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes presence window

  // Clean up stale users
  for (var entry of activeLearnersMap.entries()) {
    var key = entry[0];
    var val = entry[1];
    if (now - val.timestamp > TIMEOUT_MS) {
      activeLearnersMap.delete(key);
    }
  }

  if (req.method === "POST") {
    var body = req.body || {};
    var id = body.id || "anon_" + Math.random().toString(36).slice(2, 8);
    var name = body.name || "Student #" + id.slice(-3);
    var activity = body.activity || "Viewing notes";
    var isAdmin = Boolean(body.isAdmin);

    activeLearnersMap.set(id, {
      id: id,
      name: name,
      activity: activity,
      isAdmin: isAdmin,
      timestamp: now,
      lastActive: "Just now"
    });
  }

  var list = [];
  for (var learner of activeLearnersMap.values()) {
    var diffSec = Math.floor((now - learner.timestamp) / 1000);
    var timeStr = "Just now";
    if (diffSec > 60) {
      timeStr = Math.floor(diffSec / 60) + "m ago";
    }

    list.push({
      id: learner.id,
      name: learner.name,
      activity: learner.activity,
      isAdmin: learner.isAdmin,
      lastActive: timeStr
    });
  }

  return res.status(200).json({
    success: true,
    count: list.length,
    learners: list
  });
}
