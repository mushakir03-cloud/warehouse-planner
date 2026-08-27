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
import { InvoiceActivityTimeline } from "@/components/InvoiceActivityTimeline";

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
        <h1 className="text-[26px] font-semibold tracking-tight text-gray-900">
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
          <Link href={done ? "/history" : "/deliveries"} className="text-sm text-accent hover:underline">
            ← Back
          </Link>
        </div>
      </div>

      {canUpdateStatus && !done && (
        <section id="status" className="rounded-2xl border border-hairline/60 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <h2 className="mb-3 text-[17px] font-semibold tracking-tight text-gray-900">Change Status</h2>
          <StatusForm action={updateLpoStatus.bind(null, lpo.id)} current={lpo.status} />
        </section>
      )}

      <div className="rounded-2xl border border-hairline/60 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
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
        <p className="rounded-2xl border border-green-200/70 bg-green-50 p-4 text-center text-sm font-medium text-green-800">
          ✅ This invoice is delivered and finished. It lives in History now.
        </p>
      )}

      {canEdit && (
        <section>
          <h2 className="mb-3 text-[17px] font-semibold tracking-tight text-gray-900">Edit Invoice</h2>
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
            lpoId={lpo.id}
          />
        </section>
      )}

      {user.role === ROLES.ADMIN && (
        <section>
          <h2 className="mb-3 text-[17px] font-semibold tracking-tight text-gray-900">Activity Timeline</h2>
          <InvoiceActivityTimeline lpo={lpo} />
        </section>
      )}
    </div>
  );
}
