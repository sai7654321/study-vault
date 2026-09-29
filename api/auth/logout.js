export default async function handler(req, res) {
  var isProd = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  var cookieString = [
    "studyvault_session=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    isProd ? "Secure" : ""
  ].filter(Boolean).join("; ");

  res.setHeader("Set-Cookie", cookieString);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
}
