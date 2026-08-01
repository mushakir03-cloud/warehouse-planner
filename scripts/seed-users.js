// Creates the real staff accounts only — no sample/demo invoices.
// Safe to run once against a fresh database. Run via cPanel's "Run JS
// Script" (added as the "seed:users" package.json script).
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function upsertUser(name, email, password, role) {
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash: await bcrypt.hash(password, 10), role },
  });
}

async function main() {
  await upsertUser("Mustafa (Admin)", "admin@bagshop.com", "admin123", "ADMIN");
  await upsertUser("Pawan", "pawan@bagshop.com", "pawan123", "SALESMAN");
  await upsertUser("Mohsin", "mohsin@bagshop.com", "mohsin123", "SALESMAN");
  await upsertUser("Idris", "idris@bagshop.com", "idris123", "SALESMAN");
  await upsertUser("Shabbir", "shabbir@bagshop.com", "shabbir123", "SALESMAN");
  await upsertUser("Swami", "swami@bagshop.com", "swami123", "WAREHOUSE_KEEPER");
  console.log("Users seeded.");
}

main()
  .catch((e) => {
    // cPanel's "Run JS Script" output truncates long stderr, hiding the
    // actual error (e.g. Prisma's searchedLocations list). Write the full
    // thing to a file we can read via File Manager instead.
    require("fs").writeFileSync(
      __dirname + "/../seed-error.log",
      String(e && e.stack ? e.stack : e) + "\n\nfull error object:\n" + require("util").inspect(e, { depth: 5 })
    );
    console.error("Failed — see seed-error.log for full details");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
