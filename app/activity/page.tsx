import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  ROLES,
  computeDailySerials,
  dubaiDateKey,
  formatDate,
  formatDuration,
  formatTime,
} from "@/lib/constants";
import { StatusBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";

/** One step in an invoice's life: the status it entered, when, and who did it. */
type Stage = {
  status: string;
  at: Date;
  who: string;
  note?: string;
  isCreation?: boolean;
};

type Journey = {
  lpoId: number;
  serial?: number;
  customer: string;
  stages: Stage[];
  done: boolean;
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

  // Bucket the status changes by invoice, oldest first, so each invoice's
  // stages read left-to-right in the order they actually happened.
  const logsByLpo = new Map<number, typeof logs>();
  for (const log of logs) {
    const arr = logsByLpo.get(log.lpoId) || [];
    arr.push(log);
    logsByLpo.set(log.lpoId, arr);
  }
  for (const arr of logsByLpo.values()) {
    arr.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const journeys: Journey[] = invoices.map((inv) => {
    const invLogs = logsByLpo.get(inv.id) || [];
    // The invoice starts in whatever status the first change moved it out of
    // (normally "Pending"); with no changes yet, it's still in its current one.
    const startStatus = invLogs.length ? invLogs[0].oldStatus : inv.status;
    const stages: Stage[] = [
      {
        status: startStatus,
        at: inv.createdAt,
        who: inv.createdBy.name,
        isCreation: true,
      },
      ...invLogs.map((log) => ({
        status: log.newStatus,
        at: log.createdAt,
        who: log.changedBy.name,
        note: log.notes || undefined,
      })),
    ];
    return {
      lpoId: inv.id,
      serial: serials[inv.id],
      customer: inv.customerName,
      stages,
      done: inv.status === "Delivered",
    };
  });

  // Group by the day the invoice was created; newest day first.
  const groups = new Map<string, Journey[]>();
  for (const j of journeys) {
    const key = dubaiDateKey(j.stages[0].at);
    const arr = groups.get(key) || [];
    arr.push(j);
    groups.set(key, arr);
  }
  const dates = [...groups.keys()].sort().reverse();
  for (const d of dates) {
    groups.get(d)!.sort((a, b) => a.stages[0].at.getTime() - b.stages[0].at.getTime());
  }

  const now = Date.now();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Activity Log</h1>
      <p className="text-sm text-gray-500">
        Each invoice&apos;s full journey — every status it passed through, when it got there,
        who moved it, and how long each stage took.
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
          <ul className="space-y-3">
            {groups.get(date)!.map((j) => {
              const first = j.stages[0];
              const last = j.stages[j.stages.length - 1];
              const totalMs = last.at.getTime() - first.at.getTime();
              return (
                <li key={j.lpoId} className="rounded-lg bg-white p-3 shadow-sm">
                  <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <Link
                      href={`/lpos/${j.lpoId}`}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {j.serial != null ? `#${j.serial}` : `INV-${j.lpoId}`}
                    </Link>
                    <span className="font-medium text-gray-800">{j.customer}</span>
                    {j.stages.length > 1 && (
                      <span className="text-xs text-gray-500">
                        · {j.done ? "completed in" : "open for"}{" "}
                        <strong className="text-gray-700">
                          {formatDuration(j.done ? totalMs : now - first.at.getTime())}
                        </strong>
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <div className="flex min-w-max items-start gap-1">
                      {j.stages.map((s, i) => {
                        const nextStage = j.stages[i + 1];
                        return (
                          <div key={i} className="flex items-start gap-1">
                            <div className="min-w-[150px] px-1">
                              <StatusBadge status={s.status} />
                              <p className="mt-1 font-mono text-xs text-gray-600">
                                {formatTime(s.at)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {s.isCreation ? "created by " : "by "}
                                <strong className="font-medium text-gray-700">{s.who}</strong>
                              </p>
                              {s.note && (
                                <p className="mt-0.5 max-w-[190px] text-xs text-gray-500">{s.note}</p>
                              )}
                            </div>

                            {nextStage && (
                              <div className="flex shrink-0 flex-col items-center pt-1.5">
                                <span className="whitespace-nowrap text-xs font-medium text-gray-500">
                                  {formatDuration(nextStage.at.getTime() - s.at.getTime())}
                                </span>
                                <span className="text-lg leading-none text-gray-300">&rarr;</span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {!j.done && (
                        <div className="flex shrink-0 items-start gap-1">
                          <div className="flex flex-col items-center pt-1.5">
                            <span className="whitespace-nowrap text-xs font-medium text-amber-600">
                              {formatDuration(now - last.at.getTime())}
                            </span>
                            <span className="text-lg leading-none text-gray-300">&rarr;</span>
                          </div>
                          <div className="min-w-[110px] px-1 pt-0.5">
                            <span className="rounded-full border border-dashed border-amber-400 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                              still here
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
