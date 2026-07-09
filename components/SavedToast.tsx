"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Shows a short "Invoice saved ✓" popup when the page is opened with ?saved=1,
 * then cleans the URL (via the history API, so it doesn't disturb React) so the
 * toast doesn't show again on refresh.
 */
export function SavedToast() {
  const params = useSearchParams();
  const saved = params.get("saved") === "1";
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (saved) {
      setShow(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [saved]);

  // Auto-hide 3 seconds after it appears.
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed left-1/2 top-5 z-[80] -translate-x-1/2 rounded-lg bg-green-700 px-5 py-3 text-sm font-semibold text-white shadow-lg">
      ✓ Invoice saved
    </div>
  );
}
