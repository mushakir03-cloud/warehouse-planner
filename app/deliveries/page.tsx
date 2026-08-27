import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  ROLES,
  STATUSES,
  computeDailySerials,
  daysBetween,
  formatDate,
  todayStr,
} from "@/lib/constants";
import { LpoTable, LpoRow } from "@/components/LpoTable";

export const dynamic = "force-dynamic";

type Search = { [key: string]: string | undefined };

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = todayStr();
  const limited = user.role === ROLES.WAREHOUSE_KEEPER;
  const isAdmin = user.role === ROLES.ADMIN;

  const searching = Boolean(sp.q || sp.status);

  // Default (no search): the open schedule. When searching, look across ALL
  // statuses so delivered ones can be found too.
  const where: Record<string, unknown> = {};
  if (sp.status) where.status = sp.status;
  else if (!sp.q) where.status = { not: "Delivered" };
  if (sp.q) {
    where.OR = [
      { customerName: { contains: sp.q } },
      { billNumber: { contains: sp.q } },
      { deliveryLocation: { contains: sp.q } },
      { notes: { contains: sp.q } },
    ];
  }

  const [lpos, allForSerial] = await Promise.all([
    prisma.lpo.findMany({
      where,
      include: { createdBy: true },
      orderBy: [{ deliveryDate: "asc" }, { id: "asc" }],
    }),
    prisma.lpo.findMany({ select: { id: true, deliveryDate: true } }),
  ]);

  const serials = computeDailySerials(allForSerial);
  const rows: LpoRow[] = lpos.map((l) => ({ ...l, serial: serials[l.id] }));

  const groups = new Map<string, LpoRow[]>();
  for (const lpo of rows) {
    const list = groups.get(lpo.deliveryDate) || [];
    list.push(lpo);
    groups.set(lpo.deliveryDate, list);
  }

  const input = "rounded border border-gray-300 bg-white px-3 py-2 text-sm";

  return (
    <div className="space-y-5">
      <h1 className="text-[26px] font-semibold tracking-tight text-gray-900">Deliveries</h1>
      <p className="text-sm text-gray-500">
        The delivery schedule, grouped by date. Use search to find any invoice.
      </p>

      {/* Search + filter bar */}
      <form className="flex flex-wrap items-end gap-2 rounded-2xl border border-hairline/60 bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Search (customer name or invoice number)
          </label>
          <input
            name="q"
            defaultValue={sp.q || ""}
            placeholder="e.g. Ahmed  or  1045"
            className={`${input} w-full`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
          <select name="status" defaultValue={sp.status || ""} className={input}>
            <option value="">Open (not delivered)</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover">
          Search
        </button>
        {searching && (
          <Link href="/deliveries" className="inline-flex items-center rounded-full border border-hairline px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50">
            Clear
          </Link>
        )}
      </form>

      {groups.size === 0 && (
        <p className="rounded-2xl border border-dashed border-hairline p-8 text-center text-sm text-gray-400">
          {searching ? "No invoices match your search." : "No deliveries to do. All caught up!"}
        </p>
      )}

      {[...groups.entries()].map(([date, dateLpos]) => (
        <section key={date}>
          <h2 className="mb-2 flex flex-wrap items-center gap-2 text-lg font-semibold">
            {formatDate(date)}
            {date === today && (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">Today</span>
            )}
            {date < today && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                Overdue {daysBetween(date, today)}d
              </span>
            )}
            <span className="text-sm font-normal text-gray-500">{dateLpos.length} delivery(s)</span>
          </h2>
          <LpoTable lpos={dateLpos} limited={limited} canDelete={isAdmin} showCreated={isAdmin} today={today} />
        </section>
      ))}
    </div>
  );
}
