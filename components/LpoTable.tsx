import Link from "next/link";
import { StatusBadge } from "./Badges";
import { RowActions } from "./RowActions";
import { StatusSelect } from "./StatusSelect";
import { deleteLpo, updateLpoStatus } from "@/app/actions";
import { daysBetween, formatDate, formatDateTime, lpoCode } from "@/lib/constants";

export type LpoRow = {
  id: number;
  billNumber: string;
  customerName: string;
  deliveryLocation: string;
  deliveryDate: string;
  totalQuantity: number;
  notes: string;
  status: string;
  serial?: number; // daily serial (#1, #2...) within its delivery date
  createdAt?: Date;
  createdBy?: { name: string } | null;
};

function formatTimestamp(d?: Date) {
  if (!d) return "-";
  return formatDateTime(d);
}

/**
 * limited = warehouse view: the status cell becomes a one-tap dropdown.
 * canDelete = admin: adds the ⋮ menu with Delete.
 * showCreated = admin only: adds the Created timestamp column.
 */
export function LpoTable({
  lpos,
  limited = false,
  canDelete = false,
  showCreated = false,
  today,
  emptyText = "No invoices found.",
}: {
  lpos: LpoRow[];
  limited?: boolean;
  canDelete?: boolean;
  showCreated?: boolean;
  today?: string; // when set, shows an "Overdue Nd" badge on late open invoices
  emptyText?: string;
}) {
  if (lpos.length === 0) {
    return <p className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">{emptyText}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[780px] text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-3 py-2">S.No</th>
            <th className="px-3 py-2">Invoice No.</th>
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Delivery Location</th>
            <th className="px-3 py-2">Delivery Date</th>
            <th className="px-3 py-2">Qty</th>
            <th className="px-3 py-2">Notes</th>
            <th className="px-3 py-2">Salesman</th>
            {showCreated && <th className="px-3 py-2">Created</th>}
            <th className="px-3 py-2">Status</th>
            {canDelete && <th className="w-8 px-1 py-2"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lpos.map((lpo) => (
            <tr key={lpo.id} className="hover:bg-blue-50">
              <td className="px-3 py-2 font-medium">
                <Link href={`/lpos/${lpo.id}`} className="text-blue-600 hover:underline">
                  {lpo.serial != null ? `#${lpo.serial}` : lpoCode(lpo.id)}
                </Link>
              </td>
              <td className="px-3 py-2">{lpo.billNumber}</td>
              <td className="px-3 py-2">{lpo.customerName}</td>
              <td className="max-w-[220px] truncate px-3 py-2" title={lpo.deliveryLocation}>{lpo.deliveryLocation}</td>
              <td className="whitespace-nowrap px-3 py-2">
                {formatDate(lpo.deliveryDate)}
                {today && lpo.status !== "Delivered" && lpo.deliveryDate < today && (
                  <span className="ml-2 whitespace-nowrap rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                    Overdue {daysBetween(lpo.deliveryDate, today)}d
                  </span>
                )}
              </td>
              <td className="px-3 py-2 font-medium">{lpo.totalQuantity || "-"}</td>
              <td className="max-w-[240px] truncate px-3 py-2 text-gray-600" title={lpo.notes}>{lpo.notes || "-"}</td>
              <td className="px-3 py-2">{lpo.createdBy?.name || "-"}</td>
              {showCreated && (
                <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                  {formatTimestamp(lpo.createdAt)}
                </td>
              )}
              <td className="whitespace-nowrap px-3 py-2">
                {limited && lpo.status !== "Delivered" ? (
                  <StatusSelect
                    action={updateLpoStatus.bind(null, lpo.id)}
                    current={lpo.status}
                  />
                ) : (
                  <StatusBadge status={lpo.status} />
                )}
              </td>
              {canDelete && (
                <td className="px-1 py-2 text-right">
                  <RowActions
                    action={deleteLpo.bind(null, lpo.id, undefined)}
                    label={`${lpoCode(lpo.id)} · ${lpo.customerName}`}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
