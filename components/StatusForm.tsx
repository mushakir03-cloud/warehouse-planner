"use client";

import { useState } from "react";
import { STATUSES, STATUS_COLORS } from "@/lib/constants";

/**
 * The Change Status box on the invoice page. Picking "Delivered" reveals the
 * delivery confirmation fields (DO number, quantity, bags, cartons).
 */
export function StatusForm({
  action,
  current,
}: {
  action: (formData: FormData) => Promise<void>;
  current: string;
}) {
  const [selected, setSelected] = useState(current);
  const delivering = selected === "Delivered";

  const input =
    "w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-accent focus:outline-none";
  const label = "mb-1 block text-sm font-medium";

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {STATUSES.map((s) => (
          <label
            key={s}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-hairline p-3 text-sm font-medium transition-colors hover:bg-gray-50 has-checked:border-accent has-checked:bg-accent-soft"
          >
            <input
              type="radio"
              name="status"
              value={s}
              checked={selected === s}
              onChange={() => setSelected(s)}
              className="h-5 w-5 accent-accent"
            />
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[s]}`}>
              {s}
            </span>
            {s === "Delivered" && (
              <span className="text-xs text-gray-400">finishes the invoice → History</span>
            )}
          </label>
        ))}
      </div>

      {delivering && (
        <div className="space-y-3 rounded-lg border-2 border-green-300 bg-green-50 p-4">
          <h3 className="text-sm font-bold text-green-800">Confirm Delivery ✅</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={label}>DO Number (numeric only) *</label>
              <input name="doNumber" type="number" required min={1} placeholder="e.g. 1093" className={input} />
            </div>
            <div>
              <label className={label}>📷 Photo (optional)</label>
              <input type="file" accept="image/*" className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>🛍️ Plastic bags</label>
              <input name="deliveredBags" type="number" min={0} placeholder="0" className={input} />
            </div>
            <div>
              <label className={label}>📦 Cartons</label>
              <input name="deliveredCartons" type="number" min={0} placeholder="0" className={input} />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className={label}>Note (optional)</label>
        <input
          name="logNote"
          placeholder="e.g. 2 boxes, gate 3 — saved in the activity log"
          className={input}
        />
      </div>
      <button className="inline-flex w-full items-center justify-center rounded-full bg-green-700 py-3 text-sm font-medium text-white transition-colors hover:bg-green-600 sm:w-auto sm:px-8">
        {delivering ? "Confirm Delivery & Finish" : "Save New Status"}
      </button>
    </form>
  );
}
