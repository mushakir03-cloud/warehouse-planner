import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function day(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.lpo.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Mustafa (Admin)",
      email: "admin@bagshop.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
    },
  });
  const pawan = await prisma.user.create({
    data: {
      name: "Pawan",
      email: "pawan@bagshop.com",
      passwordHash: await bcrypt.hash("pawan123", 10),
      role: "SALESMAN",
    },
  });
  const mohsin = await prisma.user.create({
    data: {
      name: "Mohsin",
      email: "mohsin@bagshop.com",
      passwordHash: await bcrypt.hash("mohsin123", 10),
      role: "SALESMAN",
    },
  });
  const idris = await prisma.user.create({
    data: {
      name: "Idris",
      email: "idris@bagshop.com",
      passwordHash: await bcrypt.hash("idris123", 10),
      role: "SALESMAN",
    },
  });
  const keeper = await prisma.user.create({
    data: {
      name: "Swami",
      email: "swami@bagshop.com",
      passwordHash: await bcrypt.hash("swami123", 10),
      role: "WAREHOUSE_KEEPER",
    },
  });
  const salesmen = [pawan, mohsin, idris];

  const invoices = [
    { billNumber: "1045", customerName: "Ahmed Trading", deliveryLocation: "Shop 12, Gold Souk, Deira, Dubai", deliveryDate: day(0), totalQuantity: 24, status: "Pending", notes: "Customer wants original cartons." },
    { billNumber: "1046", customerName: "Fatima Boutique", deliveryLocation: "Al Wahda Street, Sharjah", deliveryDate: day(0), totalQuantity: 18, status: "Packing In Progress", notes: "Gift wrap the black ones." },
    { billNumber: "1047", customerName: "City Mall Store", deliveryLocation: "Mall of the Emirates, Dubai", deliveryDate: day(0), totalQuantity: 48, status: "Packing Finished", notes: "" },
    { billNumber: "1048", customerName: "Noor Fashion", deliveryLocation: "Hamdan Street, Abu Dhabi", deliveryDate: day(1), totalQuantity: 6, status: "Pending", notes: "Call customer 30 min before arriving." },
    { billNumber: "1041", customerName: "Madina Stores", deliveryLocation: "Karama, Dubai", deliveryDate: day(-1), totalQuantity: 20, status: "Delivered", notes: "" },
  ];

  const path = ["Pending", "Packing In Progress", "Packing Finished", "Delivered"];

  let i = 0;
  for (const data of invoices) {
    const creator = salesmen[i % salesmen.length]; // spread across the salesmen
    i++;
    const lpo = await prisma.lpo.create({
      data: { ...data, createdById: creator.id },
    });
    const idx = path.indexOf(lpo.status);
    for (let i = 0; i < idx; i++) {
      await prisma.activityLog.create({
        data: {
          lpoId: lpo.id,
          changedById: keeper.id,
          oldStatus: path[i],
          newStatus: path[i + 1],
          notes: "",
        },
      });
    }
  }

  console.log("Seeded:", {
    admin: admin.email,
    salesmen: salesmen.map((s) => s.email),
    keeper: keeper.email,
    invoices: invoices.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
