// Next.js "standalone" output doesn't include public/ or .next/static —
// copy them in so server.js can serve assets correctly.
const fs = require("fs");
const path = require("path");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const root = __dirname + "/..";
copyDir(path.join(root, "public"), path.join(root, ".next/standalone/public"));
copyDir(path.join(root, ".next/static"), path.join(root, ".next/standalone/.next/static"));

// Next's standalone file tracer often misses Prisma's query engine binary
// since it's resolved dynamically at runtime, not via a static require().
// Copy the whole generated client (including engine binaries) explicitly.
copyDir(path.join(root, "node_modules/.prisma"), path.join(root, ".next/standalone/node_modules/.prisma"));

console.log("Copied public/, .next/static, and node_modules/.prisma into .next/standalone");
