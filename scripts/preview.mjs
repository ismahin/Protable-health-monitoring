import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const root = path.resolve("dist"),
  port = Number(process.env.PORT || 8083);
const types = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};
http
  .createServer((req, res) => {
    const name = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    let file = path.resolve(root, "." + name);
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory())
      file = path.join(root, "index.html");
    res.setHeader(
      "Content-Type",
      types[path.extname(file)] || "application/octet-stream",
    );
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`PHMS web preview: http://localhost:${port}`),
  );
