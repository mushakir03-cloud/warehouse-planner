// Passenger-compatible startup file for NameHero's Node.js Selector (CloudLinux).
// Passenger sets PORT via env var and expects the app to listen on it.
const path = require("path");
process.chdir(__dirname);
process.env.NODE_ENV = process.env.NODE_ENV || "production";

require(path.join(__dirname, ".next", "standalone", "server.js"));
