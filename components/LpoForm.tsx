"use client";

import { useActionState, useRef, useState } from "react";
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

// "YYYY-MM-DD" -> "DD/MM/YYYY"
function isoToDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

// "DD/MM/YYYY" -> "YYYY-MM-DD" (empty string if incomplete/invalid)
function displayToIso(display: string) {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  const [, d, m, y] = match;
  return `${y}-${m}-${d}`;
}

// Auto-inserts slashes as the user types digits: "07072026" -> "07/07/2026"
function formatDateTyping(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

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

  const [dateDisplay, setDateDisplay] = useState(
    isoToDisplay(values.deliveryDate ?? todayStr(1))
  );
  const isoDate = displayToIso(dateDisplay);
  const pickerRef = useRef<HTMLInputElement>(null);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDateDisplay(formatDateTyping(e.target.value));
  }

  function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value) setDateDisplay(isoToDisplay(e.target.value));
  }

  function openPicker() {
    const el = pickerRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  }

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
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              required
              pattern="\d{2}/\d{2}/\d{4}"
              placeholder="dd/mm/yyyy"
              maxLength={10}
              value={dateDisplay}
              onChange={handleDateChange}
              onFocus={openPicker}
              onClick={openPicker}
              className={input}
            />
            <input
              ref={pickerRef}
              type="date"
              value={isoDate}
              onChange={handlePickerChange}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                pointerEvents: "none",
              }}
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
          <input type="hidden" name="deliveryDate" value={isoDate} readOnly />
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
