"use client";

import { Fragment, useState } from "react";
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
 * compact = salesman dashboard: hides Serial/Invoice No/Delivery Date/Qty/Notes
 * behind a per-row expand toggle, so the row fits without side-scrolling.
 */
export function LpoTable({
  lpos,
  limited = false,
  canDelete = false,
  showCreated = false,
  compact = false,
  today,
  emptyText = "No invoices found.",
}: {
  lpos: LpoRow[];
  limited?: boolean;
  canDelete?: boolean;
  showCreated?: boolean;
  compact?: boolean;
  today?: string; // when set, shows an "Overdue Nd" badge on late open invoices
  emptyText?: string;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (lpos.length === 0) {
    return <p className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">{emptyText}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className={`w-full text-left text-sm ${compact ? "" : "min-w-[780px]"}`}>
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            {compact && <th className="w-8 px-2 py-2"></th>}
            {!compact && <th className="px-3 py-2">S.No</th>}
            {!compact && <th className="px-3 py-2">Invoice No.</th>}
            <th className="px-3 py-2">Customer</th>
            <th className="px-3 py-2">Delivery Location</th>
            {!compact && <th className="px-3 py-2">Delivery Date</th>}
            {!compact && <th className="px-3 py-2">Qty</th>}
            {!compact && <th className="px-3 py-2">Notes</th>}
            <th className="px-3 py-2">Salesman</th>
            {showCreated && <th className="px-3 py-2">Created</th>}
            <th className="px-3 py-2">Status</th>
            {canDelete && <th className="w-8 px-1 py-2"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lpos.map((lpo) => {
            const isOpen = expanded.has(lpo.id);
            return (
              <Fragment key={lpo.id}>
                <tr className="hover:bg-blue-50">
                  {compact && (
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => toggle(lpo.id)}
                        aria-label={isOpen ? "Collapse details" : "Expand details"}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-200"
                      >
                        {isOpen ? "▼" : "▶"}
                      </button>
                    </td>
                  )}
                  {!compact && (
                    <td className="px-3 py-2 font-medium">
                      <Link href={`/lpos/${lpo.id}`} className="text-blue-600 hover:underline">
                        {lpo.serial != null ? `#${lpo.serial}` : lpoCode(lpo.id)}
                      </Link>
                    </td>
                  )}
                  {!compact && <td className="px-3 py-2">{lpo.billNumber}</td>}
                  <td className="px-3 py-2">
                    {compact ? (
                      <Link href={`/lpos/${lpo.id}`} className="text-blue-600 hover:underline">
                        {lpo.customerName}
                      </Link>
                    ) : (
                      lpo.customerName
                    )}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2" title={lpo.deliveryLocation}>{lpo.deliveryLocation}</td>
                  {!compact && (
                    <td className="whitespace-nowrap px-3 py-2">
                      {formatDate(lpo.deliveryDate)}
                      {today && lpo.status !== "Delivered" && lpo.deliveryDate < today && (
                        <span className="ml-2 whitespace-nowrap rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                          Overdue {daysBetween(lpo.deliveryDate, today)}d
                        </span>
                      )}
                    </td>
                  )}
                  {!compact && <td className="px-3 py-2 font-medium">{lpo.totalQuantity || "-"}</td>}
                  {!compact && (
                    <td className="max-w-[240px] truncate px-3 py-2 text-gray-600" title={lpo.notes}>{lpo.notes || "-"}</td>
                  )}
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
                {compact && isOpen && (
                  <tr className="bg-gray-50">
                    <td></td>
                    <td colSpan={10} className="px-3 py-3">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium uppercase text-gray-400">S.No</p>
                          <p>{lpo.serial != null ? `#${lpo.serial}` : lpoCode(lpo.id)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-gray-400">Invoice No.</p>
                          <p>{lpo.billNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-gray-400">Delivery Date</p>
                          <p>
                            {formatDate(lpo.deliveryDate)}
                            {today && lpo.status !== "Delivered" && lpo.deliveryDate < today && (
                              <span className="ml-2 whitespace-nowrap rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                                Overdue {daysBetween(lpo.deliveryDate, today)}d
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase text-gray-400">Qty</p>
                          <p>{lpo.totalQuantity || "-"}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-3">
                          <p className="text-xs font-medium uppercase text-gray-400">Notes</p>
                          <p className="text-gray-600">{lpo.notes || "-"}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
