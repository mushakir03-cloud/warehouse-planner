// Pushes the Prisma schema to the database (creates tables). Safe to run
// on a fresh/empty database. Run this once after the first NPM Install.
const { execSync } = require("child_process");
execSync("npx prisma db push", { stdio: "inherit" });
