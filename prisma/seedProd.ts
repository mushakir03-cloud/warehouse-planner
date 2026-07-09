import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Production seed: creates ONLY the real staff, no sample invoices.
 * Safe to run more than once — it upserts by email and never deletes invoices.
 */
const users = [
  { name: "Mustafa (Admin)", email: "admin@bagshop.com", role: "ADMIN", password: "admin123" },
  { name: "Pawan", email: "pawan@bagshop.com", role: "SALESMAN", password: "pawan123" },
  { name: "Mohsin", email: "mohsin@bagshop.com", role: "SALESMAN", password: "mohsin123" },
  { name: "Idris", email: "idris@bagshop.com", role: "SALESMAN", password: "idris123" },
  { name: "Swami", email: "swami@bagshop.com", role: "WAREHOUSE_KEEPER", password: "swami123" },
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
