"use client";

import { useState } from "react";
import { wipeAllInvoices } from "@/app/actions";

export function WipeInvoicesButton() {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  if (done) {
    return <p className="rounded bg-green-50 p-4 text-sm font-medium text-green-800">✅ All invoices wiped.</p>;
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
      >
        Wipe All Invoices
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border-2 border-red-300 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-800">Are you absolutely sure? This deletes everything.</p>
      <div className="flex gap-3">
        <button
          disabled={pending}
          onClick={async () => {
            setPending(true);
            await wipeAllInvoices();
            setPending(false);
            setDone(true);
          }}
          className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
        >
          {pending ? "Wiping…" : "Yes, wipe everything"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
