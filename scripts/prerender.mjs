import fs from "node:fs/promises";
import path from "node:path";

async function main() {
  const serverPath = path.resolve(".output/server/index.mjs");
  const publicDir = path.resolve(".output/public");

  const server = await import(serverPath);
  const handler = server.default;

  const routes = [
    "/",
    "/studio",
    "/spec",
    "/walkthrough",
    "/404"
  ];

  const ctx = {
    context: { waitUntil: () => {} },
    waitUntil: () => {}
  };

  for (const route of routes) {
    try {
      const req = new Request(`http://localhost${route}`, {
        headers: { "user-agent": "prerender" }
      });
      const res = await handler.fetch(req, {}, ctx);
      let html = await res.text();

      // If route is 404, save as 404.html
      let targetFile;
      if (route === "/404") {
        targetFile = path.join(publicDir, "404.html");
      } else if (route === "/") {
        targetFile = path.join(publicDir, "index.html");
      } else {
        const routeDir = path.join(publicDir, route.slice(1));
        await fs.mkdir(routeDir, { recursive: true });
        targetFile = path.join(routeDir, "index.html");
      }

      await fs.writeFile(targetFile, html, "utf8");
      console.log(`Prerendered: ${route} -> ${path.relative(process.cwd(), targetFile)} (${html.length} bytes)`);
    } catch (err) {
      console.error(`Failed to prerender ${route}:`, err);
    }
  }

  // Also copy index.html to 404.html if 404.html was not generated
  const indexPath = path.join(publicDir, "index.html");
  const fallback404 = path.join(publicDir, "404.html");
  try {
    await fs.access(fallback404);
  } catch {
    await fs.copyFile(indexPath, fallback404);
    console.log("Copied index.html to 404.html for GitHub Pages SPA routing fallback");
  }
}

main().catch(err => {
  console.error("Prerender script failed:", err);
  process.exit(1);
});
