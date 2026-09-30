import crypto from "crypto";

export function createSessionToken(user, secret) {
  var header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  var now = Math.floor(Date.now() / 1000);
  var payload = Buffer.from(JSON.stringify({
    email: user.email,
    name: user.name || "Admin",
    role: "admin",
    iat: now,
    exp: now + (7 * 24 * 60 * 60) // 7 days expiration
  })).toString("base64url");

  var signature = crypto.createHmac("sha256", secret)
    .update(header + "." + payload)
    .digest("base64url");

  return header + "." + payload + "." + signature;
}

export function verifySessionToken(token, secret) {
  if (!token || typeof token !== "string") {
    return null;
  }
  var parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  var header = parts[0];
  var payload = parts[1];
  var signature = parts[2];

  var expectedSignature = crypto.createHmac("sha256", secret)
    .update(header + "." + payload)
    .digest("base64url");

  // Constant time comparison
  if (signature.length !== expectedSignature.length) {
    return null;
  }
  var match = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  if (!match) {
    return null;
  }

  try {
    var data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    var now = Math.floor(Date.now() / 1000);
    if (data.exp && data.exp < now) {
      return null;
    }
    return data;
  } catch (err) {
    return null;
  }
}

export async function verifyGoogleIdToken(idToken) {
  try {
    var response = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(idToken));
    if (!response.ok) {
      return null;
    }
    var data = await response.json();
    if (!data || !data.email) {
      return null;
    }
    var isVerified = data.email_verified === "true" || data.email_verified === true;
    if (!isVerified) {
      return null;
    }
    return {
      email: data.email.toLowerCase(),
      name: data.name || data.email,
      picture: data.picture || ""
    };
  } catch (error) {
    return null;
  }
}

export function getSessionSecret() {
  var secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
      throw new Error("Security Violation: SESSION_SECRET environment variable must be defined in production.");
    }
    return "studyvault-dev-local-secret-32-chars-key";
  }
  return secret;
}

export function getAuthenticatedUser(req) {
  var secret = getSessionSecret();
  var adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();

  var token = null;
  var authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else if (req.headers["cookie"]) {
    var cookies = req.headers["cookie"].split(";");
    for (var i = 0; i < cookies.length; i = i + 1) {
      var c = cookies[i].trim();
      if (c.startsWith("studyvault_session=")) {
        token = c.substring("studyvault_session=".length);
        break;
      }
    }
  }

  if (!token) {
    return null;
  }

  var session = verifySessionToken(token, secret);
  if (!session) {
    return null;
  }

  // Strictly verify against configured ADMIN_EMAIL
  if (adminEmail && session.email.toLowerCase() !== adminEmail) {
    return null;
  }

  return session;
}
