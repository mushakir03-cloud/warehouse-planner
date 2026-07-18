import { prisma } from "@/lib/db";

async function clearAllData() {
  console.log("🗑️  Deleting all activity logs...");
  await prisma.activityLog.deleteMany({});

  console.log("🗑️  Deleting all invoices...");
  await prisma.lpo.deleteMany({});

  console.log("✅ All invoices and activity logs have been deleted!");
  console.log("✅ User accounts remain intact.");

  await prisma.$disconnect();
}

clearAllData().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
