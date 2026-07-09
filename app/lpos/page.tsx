import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ROLES, STATUSES, computeDailySerials, todayStr } from "@/lib/constants";
import { LpoTable } from "@/components/LpoTable";

export const dynamic = "force-dynamic";

type Search = { [key: string]: string | undefined };

export default async function LposPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requireUser();
  // Only the admin has the searchable Invoices tab
  if (user.role !== ROLES.ADMIN) redirect("/deliveries");
  const sp = await searchParams;
  const limited = false;
  const isAdmin = true;

  const where: Record<string, unknown> = {};
  // Open Invoices by default; a status filter can still show Delivered ones
  where.status = sp.status ? sp.status : { not: "Delivered" };
  if (sp.deliveryDate) where.deliveryDate = sp.deliveryDate;
  if (sp.customer) where.customerName = { contains: sp.customer };
  if (sp.bill) where.billNumber = { contains: sp.bill };
  if (sp.salesman) where.createdById = Number(sp.salesman);
  if (sp.q) {
    where.OR = [
      { customerName: { contains: sp.q } },
      { billNumber: { contains: sp.q } },
      { deliveryLocation: { contains: sp.q } },
      { notes: { contains: sp.q } },
    ];
  }

  const [lpos, salesmen, allForSerial] = await Promise.all([
    prisma.lpo.findMany({
      where,
      include: { createdBy: true },
      orderBy: [{ deliveryDate: "asc" }, { id: "asc" }],
    }),
    prisma.user.findMany({
      where: { role: { in: [ROLES.SALESMAN, ROLES.ADMIN] } },
      orderBy: { name: "asc" },
    }),
    prisma.lpo.findMany({ select: { id: true, deliveryDate: true } }),
  ]);
  const serials = computeDailySerials(allForSerial);
  const rows = lpos.map((l) => ({ ...l, serial: serials[l.id] }));

  const input = "rounded border border-gray-300 bg-white px-2 py-1.5 text-sm";
  const label = "mb-1 block text-xs font-medium text-gray-500";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Open Invoices</h1>
        {(user.role === ROLES.ADMIN || user.role === ROLES.SALESMAN) && (
          <Link
            href="/lpos/new"
            className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            + New Invoice
          </Link>
        )}
      </div>

      <form className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div className="col-span-2">
            <label className={label}>Search</label>
            <input name="q" defaultValue={sp.q || ""} placeholder="Customer, invoice no., location, notes..." className={`${input} w-full`} />
          </div>
          <div>
            <label className={label}>Status</label>
            <select name="status" defaultValue={sp.status || ""} className={`${input} w-full`}>
              <option value="">All open</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Delivery Date</label>
            <input type="date" name="deliveryDate" lang="en-GB" defaultValue={sp.deliveryDate || ""} className={`${input} w-full`} />
          </div>
          <div>
            <label className={label}>Customer Name</label>
            <input name="customer" defaultValue={sp.customer || ""} className={`${input} w-full`} />
          </div>
          <div>
            <label className={label}>Invoice Number</label>
            <input name="bill" defaultValue={sp.bill || ""} className={`${input} w-full`} />
          </div>
          {!limited && (
            <div>
              <label className={label}>Salesman</label>
              <select name="salesman" defaultValue={sp.salesman || ""} className={`${input} w-full`}>
                <option value="">All</option>
                {salesmen.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button className="rounded bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-500">
              Filter
            </button>
            <Link href="/lpos" className="rounded border border-gray-300 px-4 py-1.5 text-sm hover:bg-gray-50">
              Clear
            </Link>
          </div>
        </div>
      </form>

      <p className="text-sm text-gray-500">{lpos.length} invoice(s) found</p>
      <LpoTable lpos={rows} limited={limited} canDelete={isAdmin} showCreated={isAdmin} today={todayStr()} />
    </div>
  );
}
