// Resets one user's password. The plaintext is passed in via the
// NEW_ADMIN_PASSWORD env var (set inline in the npm script) so it never
// gets committed to the repo. Run via cPanel's "Run JS Script".
const fs = require("fs");
const util = require("util");

function logErrorAndExit(e) {
  fs.writeFileSync(
    __dirname + "/../set-password-error.log",
    String(e && e.stack ? e.stack : e) + "\n\nfull error object:\n" + util.inspect(e, { depth: 5 })
  );
  console.error("Failed — see set-password-error.log for full details");
  process.exit(1);
}

process.on("uncaughtException", logErrorAndExit);
process.on("unhandledRejection", logErrorAndExit);

try {
  const email = process.env.TARGET_EMAIL || "admin@bagshop.com";
  const password = process.env.NEW_ADMIN_PASSWORD;

  if (!password) {
    console.error(
      "NEW_ADMIN_PASSWORD is not set — nothing was changed. " +
        "Set it inline in the npm script or as a cPanel environment variable."
    );
    process.exit(1);
  }

  const { PrismaClient } = require("@prisma/client");
  const bcrypt = require("bcryptjs");
  const prisma = new PrismaClient();

  async function main() {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error(`No user found with email "${email}"`);
    await prisma.user.update({
      where: { email },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log(`Password updated for ${user.name} <${email}>.`);
  }

  main()
    .catch(logErrorAndExit)
    .finally(() => prisma.$disconnect());
} catch (e) {
  logErrorAndExit(e);
}
