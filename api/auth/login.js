import { createSessionToken, verifyGoogleIdToken, getSessionSecret } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  var body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (_e) {
      body = {};
    }
  }

  var adminEmail = (process.env.ADMIN_EMAIL || "admin@studyvault.com").trim().toLowerCase();
  var adminPassword = (process.env.ADMIN_PASSWORD || "").trim();
  var sessionSecret = getSessionSecret();

  var authenticatedUser = null;

  // 1. Authenticate via Google ID Token
  if (body.idToken) {
    var googleUser = await verifyGoogleIdToken(body.idToken);
    if (googleUser) {
      if (process.env.ADMIN_EMAIL && googleUser.email !== adminEmail) {
        return res.status(403).json({
          error: "Access denied. The Google account (" + googleUser.email + ") is not authorized as the administrator."
        });
      }
      authenticatedUser = googleUser;
    } else {
      return res.status(403).json({
        error: "Google token verification failed. Please try again."
      });
    }
  }

  // 2. Or authenticate via Admin Master Password
  if (!authenticatedUser && body.password) {
    var inputPass = String(body.password).trim();
    if (adminPassword && inputPass === adminPassword) {
      authenticatedUser = {
        email: adminEmail,
        name: "StudyWallet Owner"
      };
    } else {
      return res.status(401).json({ error: "Invalid admin password." });
    }
  }

  if (!authenticatedUser) {
    return res.status(401).json({ error: "Authentication failed. Provide Google credentials or admin password." });
  }

  // Issue session token
  var token = createSessionToken(authenticatedUser, sessionSecret);

  // Set HTTP-Only Cookie
  var isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  var cookieString = [
    "studyvault_session=" + token,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=" + (7 * 24 * 60 * 60),
    isProd ? "Secure" : ""
  ].filter(Boolean).join("; ");

  res.setHeader("Set-Cookie", cookieString);

  return res.status(200).json({
    success: true,
    user: {
      email: authenticatedUser.email,
      name: authenticatedUser.name
    },
    token: token
  });
}
