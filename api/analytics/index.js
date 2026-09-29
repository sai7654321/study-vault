export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  var COUNT_API_BASE = "https://countapi.mileshilliard.com/api/v1";
  var KEY_VISITS = "studyvault_sairajesh_visits";
  var KEY_UNIQUES = "studyvault_sairajesh_uniques";

  try {
    if (req.method === "POST") {
      var isUnique = Boolean(req.body && req.body.isUnique);
      var visitPromise = fetch(COUNT_API_BASE + "/hit/" + KEY_VISITS).then(function(r) { return r.json(); });
      var uniquePromise = isUnique
        ? fetch(COUNT_API_BASE + "/hit/" + KEY_UNIQUES).then(function(r) { return r.json(); })
        : fetch(COUNT_API_BASE + "/get/" + KEY_UNIQUES).then(function(r) { return r.json(); });

      var results = await Promise.all([visitPromise, uniquePromise]);
      var visitsData = results[0] || {};
      var uniquesData = results[1] || {};

      return res.status(200).json({
        success: true,
        totalVisits: typeof visitsData.value === "number" ? visitsData.value : 1,
        uniqueVisitors: typeof uniquesData.value === "number" ? uniquesData.value : 1
      });
    }

    // GET: Read stats without incrementing
    var getVisits = fetch(COUNT_API_BASE + "/get/" + KEY_VISITS).then(function(r) { return r.json(); });
    var getUniques = fetch(COUNT_API_BASE + "/get/" + KEY_UNIQUES).then(function(r) { return r.json(); });

    var statsResults = await Promise.all([getVisits, getUniques]);
    var vData = statsResults[0] || {};
    var uData = statsResults[1] || {};

    return res.status(200).json({
      success: true,
      totalVisits: typeof vData.value === "number" ? vData.value : 1,
      uniqueVisitors: typeof uData.value === "number" ? uData.value : 1
    });
  } catch (err) {
    console.error("Analytics endpoint error:", err);
    return res.status(200).json({
      success: true,
      totalVisits: 1,
      uniqueVisitors: 1,
      fallback: true
    });
  }
}
