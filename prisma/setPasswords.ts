import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// New distinct passwords (not based on names, so staff can't guess each other's)
const newPasswords: Record<string, string> = {
  "admin@bagshop.com": "Falcon2846",
  "pawan@bagshop.com": "Mango7135",
  "mohsin@bagshop.com": "River5290",
  "idris@bagshop.com": "Comet8461",
  "swami@bagshop.com": "Harbor3078",
};

async function main() {
  for (const [email, password] of Object.entries(newPasswords)) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { email }, data: { passwordHash } });
    console.log(`Updated password for ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
