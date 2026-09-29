import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import fs from "fs";
import path from "path";

// Middleware to run Vercel serverless /api handlers locally during `npm run dev`
function vercelApiDevPlugin() {
  return {
    name: "vercel-api-dev-middleware",
    configureServer(server) {
      server.middlewares.use(async function(req, res, next) {
        if (!req.url || !req.url.startsWith("/api")) {
          return next();
        }

        var urlPath = req.url.split("?")[0];
        // Normalize path: e.g. /api/files -> api/files/index.js or api/files.js
        var relativePath = urlPath.replace(/^\//, "");
        var candidates = [
          path.resolve(process.cwd(), relativePath + ".js"),
          path.resolve(process.cwd(), relativePath, "index.js")
        ];

        var targetFile = null;
        for (var i = 0; i < candidates.length; i = i + 1) {
          if (fs.existsSync(candidates[i])) {
            targetFile = candidates[i];
            break;
          }
        }

        if (!targetFile) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "API endpoint not found: " + urlPath }));
          return;
        }

        // Buffer body if POST/PUT
        var rawBody = "";
        req.on("data", function(chunk) {
          rawBody += chunk;
        });

        req.on("end", async function() {
          try {
            if (rawBody && req.headers["content-type"] && req.headers["content-type"].includes("application/json")) {
              req.body = JSON.parse(rawBody);
            } else {
              req.body = rawBody;
            }
          } catch (e) {
            req.body = {};
          }

          // Polyfill Vercel/Express-like res methods
          res.status = function(code) {
            res.statusCode = code;
            return res;
          };
          res.json = function(data) {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
            return res;
          };

          try {
            var mod = await server.ssrLoadModule(targetFile);
            var handler = mod.default || mod;
            if (typeof handler === "function") {
              await handler(req, res);
            } else {
              res.status(500).json({ error: "Invalid handler export" });
            }
          } catch (err) {
            console.error("Local API Error in " + targetFile + ":", err);
            res.status(500).json({ error: err.message || "Internal Server Error" });
          }
        });
      });
    }
  };
}

export default defineConfig(function({ mode }) {
  var env = loadEnv(mode, process.cwd(), "");
  // Pass env variables to process.env for the local API handlers
  Object.assign(process.env, env);

  return {
    plugins: [react(), vercelApiDevPlugin()]
  };
});
