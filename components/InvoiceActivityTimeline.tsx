"use client";

import { formatDateTime, formatDate } from "@/lib/constants";
import { StatusBadge } from "@/components/Badges";

type Lpo = {
  id: number;
  billNumber: string;
  customerName: string;
  deliveryLocation: string;
  deliveryDate: string;
  createdAt: Date;
  createdBy: { name: string };
  activityLogs: Array<{
    id: number;
    oldStatus: string;
    newStatus: string;
    notes: string;
    createdAt: Date;
    changedBy: { name: string };
  }>;
};

export function InvoiceActivityTimeline({ lpo }: { lpo: Lpo }) {
  // Sort activity logs chronologically (oldest first)
  const sortedLogs = [...lpo.activityLogs].reverse();

  return (
    <div className="space-y-4">
      {/* Invoice context header */}
      <div className="rounded-2xl border border-hairline/60 bg-gray-50/70 p-4 text-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-gray-500">Customer</p>
            <p className="text-gray-900">{lpo.customerName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Delivery Location</p>
            <p className="text-gray-900">{lpo.deliveryLocation}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Delivery Date</p>
            <p className="text-gray-900">{formatDate(lpo.deliveryDate)}</p>
          </div>
        </div>
      </div>

      {/* Timeline events */}
      <div className="space-y-3">
        {/* Creation event */}
        <div className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="shrink-0 pt-1 text-lg">🆕</div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900">
              Created by <strong>{lpo.createdBy.name}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDateTime(lpo.createdAt)}
            </p>
          </div>
        </div>

        {/* Status change events */}
        {sortedLogs.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No status changes yet.</p>
        ) : (
          sortedLogs.map((log) => (
            <div
              key={log.id}
              className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <div className="shrink-0 flex items-center gap-1 pt-0.5">
                <StatusBadge status={log.oldStatus} />
                <span className="text-gray-400 text-xs">→</span>
                <StatusBadge status={log.newStatus} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900">
                  Changed by <strong>{log.changedBy.name}</strong>
                </p>
                {log.notes && (
                  <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap break-words">
                    {log.notes}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateTime(log.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
