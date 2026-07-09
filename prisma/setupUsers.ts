import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Sets up the current staff WITHOUT touching any invoices:
 *   Admin      Mustafa   admin@bagshop.com
 *   Salesman   Pawan     pawan@bagshop.com
 *   Salesman   Mohsin    mohsin@bagshop.com
 *   Salesman   Idris     idris@bagshop.com
 *   Warehouse  Swami     swami@bagshop.com
 *
 * The original salesman/warehouse accounts are renamed (so their existing
 * invoices stay attributed to them), and the extra salesmen are added.
 */
async function setUser(
  matchEmail: string,
  name: string,
  email: string,
  role: string,
  password: string
) {
  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email: matchEmail } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { name, email, role, passwordHash },
    });
  } else {
    await prisma.user.upsert({
      where: { email },
      update: { name, role, passwordHash },
      create: { name, email, role, passwordHash },
    });
  }
}

async function main() {
  // rename the first salesman -> Pawan, first warehouse -> Swami
  await setUser("sales@bagshop.com", "Pawan", "pawan@bagshop.com", "SALESMAN", "pawan123");
  await setUser("warehouse@bagshop.com", "Swami", "swami@bagshop.com", "WAREHOUSE_KEEPER", "swami123");
  // add the two extra salesmen
  await setUser("mohsin@bagshop.com", "Mohsin", "mohsin@bagshop.com", "SALESMAN", "mohsin123");
  await setUser("idris@bagshop.com", "Idris", "idris@bagshop.com", "SALESMAN", "idris123");

  const users = await prisma.user.findMany({ orderBy: { id: "asc" }, select: { name: true, email: true, role: true } });
  console.log("Users now:", users);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
