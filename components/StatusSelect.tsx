"use client";

import { useRef, useState, useTransition } from "react";
import { STATUSES, STATUS_COLORS } from "@/lib/constants";

/**
 * One-tap status change straight from the list: pick a status, it saves.
 * Picking Delivered opens the delivery confirmation (DO number, quantity,
 * bags, cartons) before anything is saved.
 */
export function StatusSelect({
  action,
  current,
}: {
  action: (formData: FormData) => Promise<void>;
  current: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelivery, setConfirmDelivery] = useState(false);
  const ref = useRef<HTMLSelectElement>(null);

  const input =
    "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";
  const label = "mb-1 block text-sm font-medium";

  const resetSelect = () => {
    if (ref.current) ref.current.value = current;
    setConfirmDelivery(false);
  };

  return (
    <>
      <select
        ref={ref}
        defaultValue={current}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "Delivered") {
            setConfirmDelivery(true);
            return;
          }
          const fd = new FormData();
          fd.set("status", next);
          startTransition(() => action(fd));
        }}
        className={`rounded-lg border border-gray-300 px-2 py-2 text-sm font-semibold disabled:opacity-50 ${
          STATUS_COLORS[current] || "bg-white"
        }`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {confirmDelivery && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <form
            className="w-full max-w-sm space-y-3 rounded-xl bg-white p-5 shadow-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("status", "Delivered");
              setConfirmDelivery(false);
              startTransition(() => action(fd));
            }}
          >
            <h3 className="text-lg font-bold">Confirm Delivery ✅</h3>
            <div>
              <label className={label}>DO Number (delivery order) *</label>
              <input name="doNumber" required placeholder="e.g. DO-1093" className={input} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>🛍️ Plastic bags</label>
                <input name="deliveredBags" type="number" min={0} defaultValue={0} className={input} />
              </div>
              <div>
                <label className={label}>📦 Cartons</label>
                <input name="deliveredCartons" type="number" min={0} defaultValue={0} className={input} />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              This finishes the invoice and moves it to History.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 rounded bg-green-700 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
              >
                Confirm Delivery
              </button>
              <button
                type="button"
                onClick={resetSelect}
                className="rounded border border-gray-300 px-4 py-2.5 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
