const http = require("http");
const https = require("https");

const API_KEY = process.env.ANTHROPIC_API_KEY; // set in .env or environment
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = "https://roi.gershoncrm.com";

if (!API_KEY) {
  console.error("ERROR: ANTHROPIC_API_KEY environment variable is not set.");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/claude") {
    res.writeHead(404);
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  let body = "";
  req.on("data", chunk => { body += chunk; });
  req.on("end", () => {
    let parsed;
    try { parsed = JSON.parse(body); }
    catch (e) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    // Force safe defaults - prevent abuse
    parsed.model = "claude-sonnet-4-20250514";
    parsed.max_tokens = Math.min(parsed.max_tokens || 800, 1000);

    const payload = JSON.stringify(parsed);

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01"
      }
    };

    const proxyReq = https.request(options, proxyRes => {
      let data = "";
      proxyRes.on("data", chunk => { data += chunk; });
      proxyRes.on("end", () => {
        res.writeHead(proxyRes.statusCode, { "Content-Type": "application/json" });
        res.end(data);
      });
    });

    proxyReq.on("error", err => {
      res.writeHead(502);
      res.end(JSON.stringify({ error: "Proxy error: " + err.message }));
    });

    proxyReq.write(payload);
    proxyReq.end();
  });
});

server.listen(PORT, () => {
  console.log(`Gershon ROI proxy running on port ${PORT}`);
});
