import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ROLES, computeDailySerials } from "@/lib/constants";
import { LpoTable } from "@/components/LpoTable";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  // Only the admin has History
  if (user.role !== ROLES.ADMIN) redirect("/deliveries");
  const { q } = await searchParams;
  const limited = false;
  const isAdmin = true;

  const where: Record<string, unknown> = { status: "Delivered" };
  if (q) {
    where.OR = [
      { customerName: { contains: q } },
      { billNumber: { contains: q } },
      { deliveryLocation: { contains: q } },
    ];
  }

  const [delivered, allForSerial] = await Promise.all([
    prisma.lpo.findMany({
      where,
      include: { createdBy: true },
      orderBy: { updatedAt: "desc" },
      take: 300,
    }),
    prisma.lpo.findMany({ select: { id: true, deliveryDate: true } }),
  ]);
  const serials = computeDailySerials(allForSerial);
  const lpos = delivered.map((l) => ({ ...l, serial: serials[l.id] }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">History</h1>
      <p className="text-sm text-gray-500">Finished (delivered) invoices, newest first.</p>
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="Search customer, invoice no., location..."
          className="w-full max-w-md rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button className="rounded bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-500">
          Search
        </button>
      </form>
      <p className="text-sm text-gray-500">{lpos.length} invoice(s)</p>
      <LpoTable
        lpos={lpos}
        limited={limited}
        canDelete={isAdmin}
        showCreated={isAdmin}
        emptyText="No delivered invoices yet."
      />
    </div>
  );
}
