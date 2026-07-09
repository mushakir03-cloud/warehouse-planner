import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Production seed: creates ONLY the real staff, no sample invoices.
 * Safe to run more than once — it upserts by username (stored in the `email`
 * column) and never deletes invoices. Staff log in with the plain username
 * below (not an email address).
 */
const users = [
  { name: "Admin", email: "admin", role: "ADMIN", password: "Zephyr9214" },
  { name: "Pawan", email: "pawan", role: "SALESMAN", password: "Orbit6357" },
  { name: "Mohsin", email: "mohsin", role: "SALESMAN", password: "Cedar4891" },
  { name: "Idris", email: "idris", role: "SALESMAN", password: "Willow7523" },
  { name: "Huzaifa", email: "huzaifa", role: "SALESMAN", password: "Falconry8842" },
  { name: "Shabbir", email: "shabbir", role: "SALESMAN", password: "Compass5417" },
  { name: "Swami", email: "swami", role: "WAREHOUSE_KEEPER", password: "Granite3169" },
];

async function main() {
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash },
      create: { name: u.name, email: u.email, role: u.role, passwordHash },
    });
  }
  console.log("Production staff ready:", users.map((u) => `${u.name} (${u.email})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
