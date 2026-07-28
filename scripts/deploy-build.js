// Manually runs prisma generate + next build, since NameHero's "Run NPM
// Install" doesn't execute postinstall lifecycle scripts. Run this via
// cPanel Node.js Selector's "Run JS Script" feature after each deploy.
const { execSync } = require("child_process");
const fs = require("fs");

function run(cmd, logFile) {
  try {
    const out = execSync(cmd, { stdio: "pipe", cwd: __dirname + "/.." }).toString();
    fs.writeFileSync(logFile, out);
    console.log(`OK: ${cmd}`);
  } catch (e) {
    const out = (e.stdout ? e.stdout.toString() : "") + "\n" + (e.stderr ? e.stderr.toString() : "") + "\n" + e.message;
    fs.writeFileSync(logFile, out);
    console.log(`FAILED: ${cmd} — see ${logFile}`);
  }
}

run("npx prisma generate", __dirname + "/../prisma-generate.log");
run("npm run build", __dirname + "/../build.log");
console.log("deploy-build.js finished");
