"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { todayStr } from "@/lib/constants";
import { checkInvoiceNumber } from "@/app/actions";
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Small self-contained month calendar. Weeks start Monday to match dd/mm/yyyy locales.
function DateCalendar({
  iso,
  onSelect,
}: {
  iso: string;
  onSelect: (iso: string) => void;
}) {
  const initial = iso ? new Date(iso + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "2px",
  };

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <div
      className="absolute left-0 top-full z-20 mt-1 w-64 rounded-xl border border-hairline/70 bg-white p-3 shadow-lg"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={goPrevMonth} className="rounded px-2 py-1 text-sm hover:bg-gray-100">
          ‹
        </button>
        <span className="text-sm font-semibold">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={goNextMonth} className="rounded px-2 py-1 text-sm hover:bg-gray-100">
          ›
        </button>
      </div>
      <div style={gridStyle} className="text-center text-xs text-gray-400">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div style={gridStyle} className="text-center text-sm">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const cellIso = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(day)}`;
          const isSelected = cellIso === iso;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(cellIso)}
              className={`rounded-lg py-1 transition-colors hover:bg-gray-100 ${isSelected ? "bg-accent text-white hover:bg-accent-hover" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LpoForm({
  action,
  values = {},
  submitLabel,
  lpoId,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  values?: LpoValues;
  submitLabel: string;
  lpoId?: number;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const base =
    "rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-accent focus:outline-none";
  const input = `w-full ${base}`;
  const label = "mb-1 block text-sm font-medium";

  const [dateDisplay, setDateDisplay] = useState(
    isoToDisplay(values.deliveryDate ?? todayStr(1))
  );
  const isoDate = displayToIso(dateDisplay);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const dateFieldRef = useRef<HTMLDivElement>(null);

  const [billNumber, setBillNumber] = useState(values.billNumber ?? "");
  const [billNumberError, setBillNumberError] = useState<string | null>(null);
  const [checkingBillNumber, setCheckingBillNumber] = useState(false);

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDateDisplay(formatDateTyping(e.target.value));
  }

  function handleCalendarSelect(iso: string) {
    setDateDisplay(isoToDisplay(iso));
    setCalendarOpen(false);
  }

  async function handleBillNumberBlur(e: React.FocusEvent<HTMLInputElement>) {
    const value = e.target.value.trim();
    if (!value) {
      setBillNumberError(null);
      return;
    }
    setCheckingBillNumber(true);
    const result = await checkInvoiceNumber(value, lpoId);
    setCheckingBillNumber(false);
    if (result.taken) {
      setBillNumberError(`Invoice number "${value}" is already in use. Please use a different number.`);
    } else {
      setBillNumberError(null);
    }
  }

  useEffect(() => {
    if (!calendarOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (dateFieldRef.current && !dateFieldRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [calendarOpen]);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-hairline/60 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Customer Name *</label>
          <input name="customerName" required defaultValue={values.customerName ?? ""} placeholder="e.g. Ahmed Trading" className={input} />
        </div>
        <div>
          <label className={label}>Invoice Number *</label>
          <input
            name="billNumber"
            required
            value={billNumber}
            onChange={(e) => setBillNumber(e.target.value)}
            onBlur={handleBillNumberBlur}
            placeholder="e.g. 1045"
            className={`${input} ${billNumberError ? "border-red-500" : ""}`}
          />
          {billNumberError && (
            <p className="mt-1 text-sm text-red-600">{billNumberError}</p>
          )}
          {checkingBillNumber && (
            <p className="mt-1 text-sm text-gray-500">Checking...</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Delivery Location (address) *</label>
          <input name="deliveryLocation" required defaultValue={values.deliveryLocation ?? ""} placeholder="e.g. Shop 12, Gold Souk, Deira, Dubai" className={input} />
        </div>
        <div ref={dateFieldRef}>
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
              onFocus={() => setCalendarOpen(true)}
              onClick={() => setCalendarOpen(true)}
              className={input}
            />
            {calendarOpen && <DateCalendar iso={isoDate} onSelect={handleCalendarSelect} />}
          </div>
          <input type="hidden" name="deliveryDate" value={isoDate} readOnly />
        </div>
        <div>
          <label className={label}>Total Quantity (optional)</label>
          <input
            type="number"
            name="totalQuantity"
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
        className="inline-flex w-full items-center justify-center rounded-full bg-accent py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40 sm:w-auto sm:px-8"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
