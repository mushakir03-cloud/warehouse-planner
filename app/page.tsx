import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  ROLES,
  computeDailySerials,
  dayStartInstant,
  todayStr,
  formatDate,
} from "@/lib/constants";
import { LpoTable, LpoRow } from "@/components/LpoTable";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { NewInvoiceButton } from "@/components/NewInvoiceButton";
import { card } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const today = todayStr();
  const tomorrow = todayStr(1);
  const weekEnd = todayStr(6); // next 6 days = the rest of the week
  const limited = user.role === ROLES.WAREHOUSE_KEEPER;
  const isAdmin = user.role === ROLES.ADMIN;

  const include = { createdBy: true };

  const [active, newToday, completedToday, allForSerial] = await Promise.all([
    prisma.lpo.findMany({
      where: { status: { not: "Delivered" } },
      include,
      orderBy: [{ deliveryDate: "asc" }, { id: "asc" }],
    }),
    prisma.lpo.count({
      where: { createdAt: { gte: dayStartInstant(today) } },
    }),
    prisma.lpo.findMany({
      where: {
        status: "Delivered",
        updatedAt: { gte: dayStartInstant(today) },
      },
      include,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.lpo.findMany({ select: { id: true, deliveryDate: true } }),
  ]);

  const serials = computeDailySerials(allForSerial);
  const withSerial = (arr: (LpoRow & Record<string, unknown>)[]): LpoRow[] =>
    arr.map((l) => ({ ...l, serial: serials[l.id] }));

  const overdue = withSerial(active.filter((l) => l.deliveryDate < today));
  const deliveriesToday = withSerial(active.filter((l) => l.deliveryDate === today));
  const deliveriesTomorrow = withSerial(active.filter((l) => l.deliveryDate === tomorrow));
  const upcoming = withSerial(
    active.filter((l) => l.deliveryDate > tomorrow && l.deliveryDate <= weekEnd)
  );
  const completedTodayRows = withSerial(completedToday);
  const byStatus = (s: string) => active.filter((l) => l.status === s).length;

  // group the upcoming (rest of week) list by date
  const upcomingGroups = new Map<string, LpoRow[]>();
  for (const l of upcoming) {
    const arr = upcomingGroups.get(l.deliveryDate) || [];
    arr.push(l);
    upcomingGroups.set(l.deliveryDate, arr);
  }

  const isSalesman = user.role === ROLES.SALESMAN;
  const isWarehouse = user.role === ROLES.WAREHOUSE_KEEPER;

  // Warehouse keeper (Swami) gets no stat boxes
  let counters: { label: string; count: number; dot: string }[] = [];
  if (isWarehouse) {
    counters = []; // No stat boxes for warehouse keeper
  } else {
    const allCounters = [
      { label: "Deliveries Today", count: deliveriesToday.length, dot: "bg-gray-800" },
      { label: "New Invoices Today", count: newToday, dot: "bg-gray-400" },
      { label: "Pending", count: byStatus("Pending"), dot: "bg-gray-400" },
      { label: "Packing In Progress", count: byStatus("Packing In Progress"), dot: "bg-amber-400" },
      { label: "Packing Finished", count: byStatus("Packing Finished"), dot: "bg-blue-500" },
      { label: "Delivered Today", count: completedTodayRows.length, dot: "bg-green-500" },
    ];
    // For salesmen, remove the first 3 counters
    counters = isSalesman ? allCounters.slice(3) : allCounters;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[26px] font-semibold tracking-tight text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">
            Today: {formatDate(today)} · Hello, {user.name}
          </p>
          {isSalesman && <NewInvoiceButton />}
        </div>
      </div>

      {counters.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {counters.map((c) => (
            <div key={c.label} className={`${card} p-3.5`}>
              <p className="text-[28px] font-semibold leading-none tracking-tight text-gray-900">
                {c.count}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span className={`h-2 w-2 shrink-0 rounded-full ${c.dot}`} />
                {c.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {overdue.length > 0 && (
        <section>
          <h2 className="mb-2.5 text-[17px] font-semibold tracking-tight text-red-600">⚠ Overdue Deliveries</h2>
          <LpoTable lpos={overdue} limited={limited} canDelete={isAdmin} showCreated={isAdmin} compact={isSalesman} today={today} />
        </section>
      )}

      <section>
        <h2 className="mb-2.5 text-[17px] font-semibold tracking-tight text-gray-900">Today&apos;s Deliveries [{deliveriesToday.length}]</h2>
        <LpoTable lpos={deliveriesToday} limited={limited} canDelete={isAdmin} showCreated={isAdmin} compact={isSalesman} today={today} emptyText="No deliveries planned for today." />
      </section>

      {isSalesman || isWarehouse ? (
        <CollapsibleSection title={`Tomorrow (${formatDate(tomorrow)}) [${deliveriesTomorrow.length}]`}>
          <LpoTable lpos={deliveriesTomorrow} limited={limited} canDelete={isAdmin} showCreated={isAdmin} compact={isSalesman} emptyText="Nothing planned for tomorrow yet." />
        </CollapsibleSection>
      ) : (
        <section>
          <h2 className="mb-2.5 text-[17px] font-semibold tracking-tight text-gray-900">Tomorrow ({formatDate(tomorrow)}) [{deliveriesTomorrow.length}]</h2>
          <LpoTable lpos={deliveriesTomorrow} limited={limited} canDelete={isAdmin} showCreated={isAdmin} compact={isSalesman} emptyText="Nothing planned for tomorrow yet." />
        </section>
      )}

      {isSalesman || isWarehouse ? (
        <CollapsibleSection title={`Rest of the week [${upcoming.length}]`}>
          {upcomingGroups.size === 0 ? (
            <p className="rounded-2xl border border-dashed border-hairline p-8 text-center text-sm text-gray-400">
              Nothing scheduled for the rest of the week.
            </p>
          ) : (
            <div className="max-h-96 space-y-4 overflow-y-auto rounded-2xl border border-hairline/60 bg-gray-50/60 p-3">
              {[...upcomingGroups.entries()].map(([date, rows]) => (
                <div key={date}>
                  <h3 className="mb-1.5 text-[13px] font-semibold text-gray-500">
                    {formatDate(date)} [{rows.length}]
                  </h3>
                  <LpoTable lpos={rows} limited={limited} canDelete={isAdmin} showCreated={isAdmin} compact={isSalesman} />
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>
      ) : (
        <section>
          <h2 className="mb-2.5 text-[17px] font-semibold tracking-tight text-gray-900">Rest of the week [{upcoming.length}]</h2>
          {upcomingGroups.size === 0 ? (
            <p className="rounded-2xl border border-dashed border-hairline p-8 text-center text-sm text-gray-400">
              Nothing scheduled for the rest of the week.
            </p>
          ) : (
            <div className="max-h-96 space-y-4 overflow-y-auto rounded-2xl border border-hairline/60 bg-gray-50/60 p-3">
              {[...upcomingGroups.entries()].map(([date, rows]) => (
                <div key={date}>
                  <h3 className="mb-1.5 text-[13px] font-semibold text-gray-500">
                    {formatDate(date)} [{rows.length}]
                  </h3>
                  <LpoTable lpos={rows} limited={limited} canDelete={isAdmin} showCreated={isAdmin} compact={isSalesman} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-2.5 text-[17px] font-semibold tracking-tight text-gray-900">Delivered Today [{completedTodayRows.length}]</h2>
        <LpoTable lpos={completedTodayRows} limited={limited} canDelete={isAdmin} showCreated={isAdmin} compact={isSalesman} emptyText="Nothing delivered yet today." />
        <p className="mt-3 text-sm">
          <Link href="/deliveries" className="text-accent hover:underline">
            View full delivery schedule →
          </Link>
        </p>
      </section>
    </div>
  );
}
