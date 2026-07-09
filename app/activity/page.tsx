import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  ROLES,
  computeDailySerials,
  dubaiDateKey,
  formatDate,
  formatTime,
} from "@/lib/constants";
import { StatusBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";

type Event = {
  at: Date;
  kind: "created" | "status";
  who: string;
  lpoId: number;
  serial?: number;
  customer: string;
  from?: string;
  to?: string;
  note?: string;
};

export default async function ActivityPage() {
  const user = await requireUser();
  if (user.role !== ROLES.ADMIN) redirect("/");

  const [invoices, logs, allForSerial] = await Promise.all([
    prisma.lpo.findMany({ include: { createdBy: true } }),
    prisma.activityLog.findMany({ include: { changedBy: true } }),
    prisma.lpo.findMany({ select: { id: true, deliveryDate: true } }),
  ]);
  const serials = computeDailySerials(allForSerial);

  // Build one combined timeline: invoice-created events + every status change
  const events: Event[] = [];
  for (const inv of invoices) {
    events.push({
      at: inv.createdAt,
      kind: "created",
      who: inv.createdBy.name,
      lpoId: inv.id,
      serial: serials[inv.id],
      customer: inv.customerName,
    });
  }
  for (const log of logs) {
    events.push({
      at: log.createdAt,
      kind: "status",
      who: log.changedBy.name,
      lpoId: log.lpoId,
      serial: serials[log.lpoId],
      customer: invoices.find((i) => i.id === log.lpoId)?.customerName ?? "",
      from: log.oldStatus,
      to: log.newStatus,
      note: log.notes,
    });
  }

  // Group by UAE date; newest day first, chronological within a day
  const groups = new Map<string, Event[]>();
  for (const e of events) {
    const key = dubaiDateKey(e.at);
    const arr = groups.get(key) || [];
    arr.push(e);
    groups.set(key, arr);
  }
  const dates = [...groups.keys()].sort().reverse();
  for (const d of dates) groups.get(d)!.sort((a, b) => a.at.getTime() - b.at.getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Activity Log</h1>
      <p className="text-sm text-gray-500">
        Everything that happened, grouped by day — who created each invoice and every status change, with the exact time.
      </p>

      {dates.length === 0 && (
        <p className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          No activity yet.
        </p>
      )}

      {dates.map((date) => (
        <section key={date}>
          <h2 className="mb-2 border-b border-gray-200 pb-1 text-lg font-semibold">
            {formatDate(date)}
          </h2>
          <ul className="space-y-1.5">
            {groups.get(date)!.map((e, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-white p-2.5 text-sm shadow-sm">
                <span className="w-20 shrink-0 font-mono text-xs text-gray-500">{formatTime(e.at)}</span>
                <Link href={`/lpos/${e.lpoId}`} className="font-medium text-blue-600 hover:underline">
                  {e.serial != null ? `#${e.serial}` : `INV-${e.lpoId}`}
                </Link>
                <span className="text-gray-700">{e.customer}</span>
                <span className="text-gray-400">—</span>
                {e.kind === "created" ? (
                  <span>🆕 created by <strong>{e.who}</strong></span>
                ) : (
                  <span className="flex flex-wrap items-center gap-1">
                    <StatusBadge status={e.from!} />
                    <span className="text-gray-400">→</span>
                    <StatusBadge status={e.to!} />
                    <span>by <strong>{e.who}</strong></span>
                    {e.note ? <span className="text-gray-500">· {e.note}</span> : null}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
