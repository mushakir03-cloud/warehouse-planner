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
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
