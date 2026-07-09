"use client";

import { useActionState } from "react";
import { todayStr } from "@/lib/constants";
import type { FormState } from "@/app/actions";

type LpoValues = {
  billNumber?: string;
  customerName?: string;
  deliveryLocation?: string;
  deliveryDate?: string;
  totalQuantity?: number;
  notes?: string;
};

export function LpoForm({
  action,
  values = {},
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  values?: LpoValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const base =
    "rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";
  const input = `w-full ${base}`;
  const label = "mb-1 block text-sm font-medium";

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Customer Name *</label>
          <input name="customerName" required defaultValue={values.customerName ?? ""} placeholder="e.g. Ahmed Trading" className={input} />
        </div>
        <div>
          <label className={label}>Invoice Number *</label>
          <input name="billNumber" required defaultValue={values.billNumber ?? ""} placeholder="e.g. 1045" className={input} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Delivery Location (address) *</label>
          <input name="deliveryLocation" required defaultValue={values.deliveryLocation ?? ""} placeholder="e.g. Shop 12, Gold Souk, Deira, Dubai" className={input} />
        </div>
        <div>
          <label className={label}>Delivery Date * (dd/mm/yyyy)</label>
          <input type="date" name="deliveryDate" required defaultValue={values.deliveryDate ?? todayStr(1)} className={input} />
        </div>
        <div>
          <label className={label}>Total Quantity *</label>
          <input
            type="number"
            name="totalQuantity"
            required
            min={1}
            defaultValue={values.totalQuantity || ""}
            placeholder="e.g. 48"
            className={input}
          />
          <p className="mt-1 text-xs text-gray-400">Total number of bags / pieces in this invoice</p>
        </div>
      </div>

      <div>
        <label className={label}>Notes (optional)</label>
        <textarea name="notes" rows={2} defaultValue={values.notes ?? ""} placeholder="Any packing or delivery instructions" className={input} />
      </div>

      {state?.error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          ⚠ {state.error}
        </p>
      )}

      <button
        disabled={pending}
        className="w-full rounded bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
