import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const user = await requireUser();

    // Only admin can clear data
    if (user.role !== ROLES.ADMIN) {
      return Response.json(
        { error: "Only admins can clear data" },
        { status: 403 }
      );
    }

    // Delete all activity logs first (they depend on invoices)
    const deletedLogs = await prisma.activityLog.deleteMany({});
    console.log(`Deleted ${deletedLogs.count} activity logs`);

    // Delete all invoices
    const deletedLpos = await prisma.lpo.deleteMany({});
    console.log(`Deleted ${deletedLpos.count} invoices`);

    return Response.json({
      success: true,
      message: "All invoices and activity logs have been cleared",
      deletedInvoices: deletedLpos.count,
      deletedActivityLogs: deletedLogs.count,
    });
  } catch (error) {
    console.error("Error clearing data:", error);
    return Response.json(
      { error: "Failed to clear data" },
      { status: 500 }
    );
  }
}
