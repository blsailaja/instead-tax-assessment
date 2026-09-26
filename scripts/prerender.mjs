process.env.NODE_ENV = "production";
import fs from "node:fs/promises";
import path from "node:path";

const REPO_BASE = "/instead-tax-assessment";

async function main() {
  const serverPath = path.resolve(".output/server/index.mjs");
  const publicDir = path.resolve(".output/public");

  const server = await import(serverPath);
  const handler = server.default;

  const routes = ["/", "/studio", "/spec", "/walkthrough", "/404"];

  const ctx = {
    context: { waitUntil: () => {} },
    waitUntil: () => {},
  };

  // 1. Prerender all key application pages
  for (const route of routes) {
    try {
      const req = new Request(`http://localhost${route}`, {
        headers: { "user-agent": "prerender" },
      });
      const res = await handler.fetch(req, {}, ctx);
      let html = await res.text();

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
      console.log(
        `Prerendered: ${route} -> ${path.relative(process.cwd(), targetFile)} (${html.length} bytes)`,
      );
    } catch (err) {
      console.error(`Failed to prerender ${route}:`, err);
    }
  }

  // 2. Add .nojekyll so GitHub Pages serves all assets verbatim
  await fs.writeFile(path.join(publicDir, ".nojekyll"), "", "utf8");
  console.log("Created .nojekyll");

  // 3. Patch all HTML files for GitHub Pages subpath
  async function patchHtmlFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await patchHtmlFiles(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        let content = await fs.readFile(fullPath, "utf8");

        // Inject <base> tag after <head>
        if (!content.includes('<base href="')) {
          content = content.replace("<head>", `<head><base href="${REPO_BASE}/"/>`);
        }

        // Replace asset URLs
        content = content.replaceAll('href="/assets/', `href="${REPO_BASE}/assets/`);
        content = content.replaceAll('src="/assets/', `src="${REPO_BASE}/assets/`);
        content = content.replaceAll('src="/forms/', `src="${REPO_BASE}/forms/`);
        content = content.replaceAll('href="/forms/', `href="${REPO_BASE}/forms/`);
        content = content.replaceAll('href="/docs/', `href="${REPO_BASE}/docs/`);
        content = content.replaceAll('href="/favicon.ico"', `href="${REPO_BASE}/favicon.ico"`);

        // Replace internal navigation links
        content = content.replaceAll('href="/studio"', `href="${REPO_BASE}/studio"`);
        content = content.replaceAll('href="/spec"', `href="${REPO_BASE}/spec"`);
        content = content.replaceAll('href="/walkthrough"', `href="${REPO_BASE}/walkthrough"`);
        content = content.replaceAll('href="/"', `href="${REPO_BASE}/"`);

        await fs.writeFile(fullPath, content, "utf8");
        console.log(`Patched HTML for Pages: ${path.relative(process.cwd(), fullPath)}`);
      }
    }
  }
  await patchHtmlFiles(publicDir);

  // 4. Patch JS bundles in assets for subpath dynamic imports & router basepath
  const assetsDir = path.join(publicDir, "assets");
  const assetFiles = await fs.readdir(assetsDir);

  for (const file of assetFiles) {
    if (!file.endsWith(".js") && !file.endsWith(".mjs")) continue;
    const filePath = path.join(assetsDir, file);
    let js = await fs.readFile(filePath, "utf8");
    let modified = false;

    // Fix form images, PDFs, and docs inside JS bundles
    if (js.includes('"/forms/')) {
      js = js.replaceAll('"/forms/', `"${REPO_BASE}/forms/`);
      modified = true;
      console.log(`Patched forms refs in ${file}`);
    }
    if (js.includes('"/docs/')) {
      js = js.replaceAll('"/docs/', `"${REPO_BASE}/docs/`);
      modified = true;
      console.log(`Patched docs refs in ${file}`);
    }

    // Fix Vite modulepreload chunk loader: ,a_=function(e){return`/`+e}
    if (js.includes(",a_=function(e){return`/`+e}")) {
      js = js.replace(",a_=function(e){return`/`+e}", `,a_=function(e){return\`${REPO_BASE}/\`+e}`);
      modified = true;
      console.log(`Patched chunk loader in ${file}`);
    }

    // Fix TanStack router basepath: e.update({basepath:``,
    if (js.includes("e.update({basepath:``,")) {
      js = js.replace("e.update({basepath:``,", `e.update({basepath:\`${REPO_BASE}\`,`);
      modified = true;
      console.log(`Patched router basepath in ${file}`);
    }

    // Fix style href inside bundle
    if (js.includes('="/assets/styles-')) {
      js = js.replaceAll('="/assets/styles-', `="${REPO_BASE}/assets/styles-`);
      modified = true;
      console.log(`Patched style bundle ref in ${file}`);
    }

    // Fix worker ref
    if (js.includes('="/assets/pdf.worker')) {
      js = js.replaceAll('="/assets/pdf.worker', `="${REPO_BASE}/assets/pdf.worker`);
      modified = true;
      console.log(`Patched pdf worker ref in ${file}`);
    }

    if (modified) {
      await fs.writeFile(filePath, js, "utf8");
    }
  }

  console.log("GitHub Pages asset and routing preparation complete!");
}

main().catch((err) => {
  console.error("Prerender script failed:", err);
  process.exit(1);
});
