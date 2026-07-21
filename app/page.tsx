import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  ROLES,
  STATUS_COLORS,
  computeDailySerials,
  dayStartInstant,
  todayStr,
  formatDate,
} from "@/lib/constants";
import { LpoTable, LpoRow } from "@/components/LpoTable";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { NewInvoiceButton } from "@/components/NewInvoiceButton";

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

  // Warehouse keeper (Swami) gets custom counters
  let counters;
  if (isWarehouse) {
    const invoicesToDeliver = deliveriesToday.length;
    const invoicesDelivered = completedTodayRows.length;
    const invoicesPending = invoicesToDeliver - invoicesDelivered;

    counters = [
      { label: "Invoices to be delivered today", count: invoicesToDeliver, color: "bg-blue-600 text-white" },
      { label: "Invoices delivered", count: invoicesDelivered, color: "bg-green-600 text-white" },
      { label: "Invoices pending for delivery", count: invoicesPending, color: "bg-orange-600 text-white" },
    ];
  } else {
    const allCounters = [
      { label: "Deliveries Today", count: deliveriesToday.length, color: "bg-slate-700 text-white" },
      { label: "New Invoices Today", count: newToday, color: "bg-slate-500 text-white" },
      { label: "Pending", count: byStatus("Pending"), color: STATUS_COLORS["Pending"] },
      { label: "Packing In Progress", count: byStatus("Packing In Progress"), color: STATUS_COLORS["Packing In Progress"] },
      { label: "Packing Finished", count: byStatus("Packing Finished"), color: STATUS_COLORS["Packing Finished"] },
      { label: "Delivered Today", count: completedTodayRows.length, color: STATUS_COLORS["Delivered"] },
    ];
    // For salesmen, remove the first 3 counters
    counters = isSalesman ? allCounters.slice(3) : allCounters;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">
            Today: {formatDate(today)} · Hello, {user.name}
          </p>
          {isSalesman && <NewInvoiceButton />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {counters.map((c) => (
          <div key={c.label} className={`rounded-lg p-3 shadow-sm ${c.color}`}>
            <p className="text-2xl font-bold">{c.count}</p>
            <p className="text-xs font-medium">{c.label}</p>
          </div>
        ))}
      </div>

      {overdue.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-red-700">⚠ Overdue Deliveries</h2>
          <LpoTable lpos={overdue} limited={limited} canDelete={isAdmin} showCreated={isAdmin} today={today} />
        </section>
      )}

      {isWarehouse ? (
        <CollapsibleSection title={`Today's Deliveries [${deliveriesToday.length}]`}>
          <LpoTable lpos={deliveriesToday} limited={limited} canDelete={isAdmin} showCreated={isAdmin} today={today} emptyText="No deliveries planned for today." />
        </CollapsibleSection>
      ) : (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Today&apos;s Deliveries [{deliveriesToday.length}]</h2>
          <LpoTable lpos={deliveriesToday} limited={limited} canDelete={isAdmin} showCreated={isAdmin} today={today} emptyText="No deliveries planned for today." />
        </section>
      )}

      {isSalesman || isWarehouse ? (
        <CollapsibleSection title={`Tomorrow (${formatDate(tomorrow)}) [${deliveriesTomorrow.length}]`}>
          <LpoTable lpos={deliveriesTomorrow} limited={limited} canDelete={isAdmin} showCreated={isAdmin} emptyText="Nothing planned for tomorrow yet." />
        </CollapsibleSection>
      ) : (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Tomorrow ({formatDate(tomorrow)}) [{deliveriesTomorrow.length}]</h2>
          <LpoTable lpos={deliveriesTomorrow} limited={limited} canDelete={isAdmin} showCreated={isAdmin} emptyText="Nothing planned for tomorrow yet." />
        </section>
      )}

      {isSalesman || isWarehouse ? (
        <CollapsibleSection title={`Rest of the week [${upcoming.length}]`}>
          {upcomingGroups.size === 0 ? (
            <p className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              Nothing scheduled for the rest of the week.
            </p>
          ) : (
            <div className="max-h-96 space-y-4 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
              {[...upcomingGroups.entries()].map(([date, rows]) => (
                <div key={date}>
                  <h3 className="mb-1 text-sm font-semibold text-gray-600">
                    {formatDate(date)} [{rows.length}]
                  </h3>
                  <LpoTable lpos={rows} limited={limited} canDelete={isAdmin} showCreated={isAdmin} />
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>
      ) : (
        <section>
          <h2 className="mb-2 text-lg font-semibold">Rest of the week [{upcoming.length}]</h2>
          {upcomingGroups.size === 0 ? (
            <p className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              Nothing scheduled for the rest of the week.
            </p>
          ) : (
            <div className="max-h-96 space-y-4 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
              {[...upcomingGroups.entries()].map(([date, rows]) => (
                <div key={date}>
                  <h3 className="mb-1 text-sm font-semibold text-gray-600">
                    {formatDate(date)} [{rows.length}]
                  </h3>
                  <LpoTable lpos={rows} limited={limited} canDelete={isAdmin} showCreated={isAdmin} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-semibold">Delivered Today [{completedTodayRows.length}]</h2>
        <LpoTable lpos={completedTodayRows} limited={limited} canDelete={isAdmin} showCreated={isAdmin} emptyText="Nothing delivered yet today." />
        <p className="mt-3 text-sm">
          <Link href="/deliveries" className="text-blue-600 hover:underline">
            View full delivery schedule →
          </Link>
        </p>
      </section>
    </div>
  );
}
