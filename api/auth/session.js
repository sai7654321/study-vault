import { getAuthenticatedUser } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  var user = getAuthenticatedUser(req);

  if (user) {
    return res.status(200).json({
      authenticated: true,
      user: {
        email: user.email,
        name: user.name || "Admin",
        role: "admin"
      }
    });
  }

  return res.status(200).json({
    authenticated: false
  });
}
