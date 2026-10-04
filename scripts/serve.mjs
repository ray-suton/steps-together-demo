import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd());
const requestedPort = Number.parseInt(process.env.PORT || "4173", 10);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function resolveRequestPath(url) {
  const requestPath = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const candidate = normalize(join(root, requestPath === "/" ? "index.html" : requestPath));
  if (!candidate.startsWith(root)) {
    return null;
  }
  return candidate;
}

function startServer(port, attempt = 0) {
  const server = createServer(async (request, response) => {
    if (!request.url || request.method !== "GET") {
      response.writeHead(405);
      response.end("Method not allowed");
      return;
    }

    const filePath = resolveRequestPath(request.url);
    if (!filePath) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const target = existsSync(filePath) ? filePath : resolve(root, "index.html");

    try {
      const fileStat = await stat(target);
      if (!fileStat.isFile()) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": contentTypes[extname(target)] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      createReadStream(target).pipe(response);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attempt < 10) {
      startServer(port + 1, attempt + 1);
      return;
    }

    console.error(`Could not start the Steps Together server on port ${port}: ${error.message}`);
    process.exitCode = 1;
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`Steps Together demo running at http://127.0.0.1:${port}/`);
  });
}

startServer(requestedPort);
