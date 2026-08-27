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
    "w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-accent focus:outline-none";
  const label = "mb-1.5 block text-sm font-medium text-gray-700";

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
        className={`rounded-lg border border-hairline px-2 py-1.5 text-sm font-medium disabled:opacity-50 ${
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <form
            className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-5 shadow-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("status", "Delivered");
              setConfirmDelivery(false);
              startTransition(() => action(fd));
            }}
          >
            <h3 className="text-[17px] font-semibold tracking-tight text-gray-900">Confirm Delivery ✅</h3>
            <div>
              <label className={label}>DO Number (numeric only) *</label>
              <input name="doNumber" type="number" required min={1} placeholder="e.g. 1093" className={input} />
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
            <p className="text-xs text-gray-500">
              This finishes the invoice and moves it to History.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-green-700 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-600"
              >
                Confirm Delivery
              </button>
              <button
                type="button"
                onClick={resetSelect}
                className="inline-flex items-center rounded-full border border-hairline px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
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
