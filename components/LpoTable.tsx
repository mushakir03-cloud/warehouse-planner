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
    return <p className="rounded-2xl border border-dashed border-hairline p-8 text-center text-sm text-gray-400">{emptyText}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-hairline/60 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <table className={`w-full text-left text-sm ${compact ? "" : "min-w-[780px]"}`}>
        <thead className="border-b border-hairline/60 bg-gray-50/60 text-[11px] uppercase tracking-wide text-gray-500">
          <tr>
            {compact && <th className="w-8 px-2 py-2.5"></th>}
            {!compact && <th className="px-3.5 py-2.5">S.No</th>}
            {!compact && <th className="px-3.5 py-2.5">Invoice No.</th>}
            <th className="px-3.5 py-2.5">Customer</th>
            <th className="px-3.5 py-2.5">Delivery Location</th>
            {!compact && <th className="px-3.5 py-2.5">Delivery Date</th>}
            {!compact && <th className="px-3.5 py-2.5">Qty</th>}
            {!compact && <th className="px-3.5 py-2.5">Notes</th>}
            <th className="px-3.5 py-2.5">Salesman</th>
            {showCreated && <th className="px-3.5 py-2.5">Created</th>}
            <th className="px-3.5 py-2.5">Status</th>
            {canDelete && <th className="w-8 px-1 py-2.5"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lpos.map((lpo) => {
            const isOpen = expanded.has(lpo.id);
            return (
              <Fragment key={lpo.id}>
                <tr className="transition-colors hover:bg-gray-50">
                  {compact && (
                    <td className="px-2 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggle(lpo.id)}
                        aria-label={isOpen ? "Collapse details" : "Expand details"}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
                      >
                        {isOpen ? "▼" : "▶"}
                      </button>
                    </td>
                  )}
                  {!compact && (
                    <td className="px-3.5 py-2.5 font-medium">
                      <Link href={`/lpos/${lpo.id}`} className="text-accent hover:underline">
                        {lpo.serial != null ? `#${lpo.serial}` : lpoCode(lpo.id)}
                      </Link>
                    </td>
                  )}
                  {!compact && <td className="px-3.5 py-2.5">{lpo.billNumber}</td>}
                  <td className="px-3.5 py-2.5">
                    {compact ? (
                      <Link href={`/lpos/${lpo.id}`} className="text-accent hover:underline">
                        {lpo.customerName}
                      </Link>
                    ) : (
                      lpo.customerName
                    )}
                  </td>
                  <td className="max-w-[220px] truncate px-3.5 py-2.5" title={lpo.deliveryLocation}>{lpo.deliveryLocation}</td>
                  {!compact && (
                    <td className="whitespace-nowrap px-3.5 py-2.5">
                      {formatDate(lpo.deliveryDate)}
                      {today && lpo.status !== "Delivered" && lpo.deliveryDate < today && (
                        <span className="ml-2 whitespace-nowrap rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                          Overdue {daysBetween(lpo.deliveryDate, today)}d
                        </span>
                      )}
                    </td>
                  )}
                  {!compact && <td className="px-3.5 py-2.5 font-medium">{lpo.totalQuantity || "-"}</td>}
                  {!compact && (
                    <td className="max-w-[240px] truncate px-3.5 py-2.5 text-gray-600" title={lpo.notes}>{lpo.notes || "-"}</td>
                  )}
                  <td className="px-3.5 py-2.5">{lpo.createdBy?.name || "-"}</td>
                  {showCreated && (
                    <td className="whitespace-nowrap px-3.5 py-2.5 text-gray-500">
                      {formatTimestamp(lpo.createdAt)}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-3.5 py-2.5">
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
                    <td className="px-1 py-2.5 text-right">
                      <RowActions
                        action={deleteLpo.bind(null, lpo.id, undefined)}
                        label={`${lpoCode(lpo.id)} · ${lpo.customerName}`}
                      />
                    </td>
                  )}
                </tr>
                {compact && isOpen && (
                  <tr className="bg-gray-50/70">
                    <td></td>
                    <td colSpan={10} className="px-3.5 py-3">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">S.No</p>
                          <p>{lpo.serial != null ? `#${lpo.serial}` : lpoCode(lpo.id)}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Invoice No.</p>
                          <p>{lpo.billNumber}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Delivery Date</p>
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
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Qty</p>
                          <p>{lpo.totalQuantity || "-"}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Notes</p>
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
