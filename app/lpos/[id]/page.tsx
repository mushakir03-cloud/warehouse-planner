import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ROLES, computeDailySerials, formatDate, formatDateTime } from "@/lib/constants";
import { deleteLpo, updateLpo, updateLpoStatus } from "@/app/actions";
import { LpoForm } from "@/components/LpoForm";
import { StatusForm } from "@/components/StatusForm";
import { DeleteLpoButton } from "@/components/DeleteLpoButton";
import { StatusBadge } from "@/components/Badges";

export const dynamic = "force-dynamic";

export default async function LpoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const lpoId = Number(id);
  if (!Number.isInteger(lpoId)) notFound();

  const lpo = await prisma.lpo.findUnique({
    where: { id: lpoId },
    include: {
      createdBy: true,
      activityLogs: { include: { changedBy: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!lpo) notFound();

  // Daily serial (#N within its delivery date)
  const sameDate = await prisma.lpo.findMany({
    where: { deliveryDate: lpo.deliveryDate },
    select: { id: true, deliveryDate: true },
  });
  const serial = computeDailySerials(sameDate)[lpo.id];

  const isWarehouse = user.role === ROLES.WAREHOUSE_KEEPER;
  const canEdit =
    user.role === ROLES.ADMIN ||
    (user.role === ROLES.SALESMAN && lpo.createdById === user.id);
  const canUpdateStatus = isWarehouse || user.role === ROLES.ADMIN;
  const done = lpo.status === "Delivered";

  const fields: [string, React.ReactNode][] = [
    ["Customer Name", lpo.customerName],
    ["Delivery Location", lpo.deliveryLocation],
    ["Invoice Number", lpo.billNumber],
    ["Delivery Date", formatDate(lpo.deliveryDate)],
    ["Total Quantity", lpo.totalQuantity || "-"],
    ["Status", <StatusBadge key="s" status={lpo.status} />],
    ["Notes", lpo.notes || "-"],
  ];
  if (done && lpo.doNumber) {
    fields.push(
      ["DO Number", lpo.doNumber],
      ["🛍️ Plastic Bags", lpo.deliveredBags ?? 0],
      ["📦 Cartons", lpo.deliveredCartons ?? 0]
    );
  }
  // Everyone can see who made the invoice
  fields.push(["Created By (Salesman)", lpo.createdBy.name]);
  // Timestamps are for the admin's eyes only
  if (user.role === ROLES.ADMIN) {
    fields.push(
      ["Created", formatDateTime(lpo.createdAt)],
      ["Last Updated", formatDateTime(lpo.updatedAt)]
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">
          {lpo.customerName}
          <span className="ml-2 text-base font-normal text-gray-500">
            (#{serial} on {formatDate(lpo.deliveryDate)})
          </span>
        </h1>
        <div className="flex items-center gap-3">
          {user.role === ROLES.ADMIN && (
            <DeleteLpoButton
              action={deleteLpo.bind(null, lpo.id, done ? "/history" : "/deliveries")}
              lpoLabel={`${lpo.customerName} (${formatDate(lpo.deliveryDate)})`}
            />
          )}
          <Link href={done ? "/history" : "/deliveries"} className="text-sm text-blue-600 hover:underline">
            ← Back
          </Link>
        </div>
      </div>

      {canUpdateStatus && !done && (
        <section id="status" className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Change Status</h2>
          <StatusForm action={updateLpoStatus.bind(null, lpo.id)} current={lpo.status} />
        </section>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <dl className="divide-y divide-gray-100 text-sm">
          {fields.map(([k, v]) => (
            <div key={k as string} className="grid grid-cols-1 gap-1 px-4 py-2.5 sm:grid-cols-3">
              <dt className="font-medium text-gray-500">{k}</dt>
              <dd className="sm:col-span-2">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {done && (
        <p className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm font-semibold text-green-800">
          ✅ This invoice is delivered and finished. It lives in History now.
        </p>
      )}

      {canEdit && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Edit Invoice</h2>
          <LpoForm
            action={updateLpo.bind(null, lpo.id)}
            values={{
              billNumber: lpo.billNumber,
              customerName: lpo.customerName,
              deliveryLocation: lpo.deliveryLocation,
              deliveryDate: lpo.deliveryDate,
              totalQuantity: lpo.totalQuantity,
              notes: lpo.notes,
            }}
            submitLabel="Save Changes"
          />
        </section>
      )}

      {user.role === ROLES.ADMIN && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Status History</h2>
          {lpo.activityLogs.length === 0 ? (
            <p className="text-sm text-gray-500">No status changes yet.</p>
          ) : (
            <ul className="space-y-2">
              {lpo.activityLogs.map((log) => (
                <li key={log.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={log.oldStatus} />
                    <span className="text-gray-400">→</span>
                    <StatusBadge status={log.newStatus} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {log.changedBy.name} · {formatDateTime(log.createdAt)}
                    {log.notes && <> · &ldquo;{log.notes}&rdquo;</>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
