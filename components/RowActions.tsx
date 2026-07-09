"use client";

import { useState } from "react";

export function RowActions({
  action,
  label,
}: {
  action: () => Promise<void>;
  label: string;
}) {
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  return (
    <>
      <button
        type="button"
        aria-label="More actions"
        onClick={(e) => {
          if (menuPos) {
            setMenuPos(null);
            return;
          }
          const r = e.currentTarget.getBoundingClientRect();
          setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
        }}
        className="rounded px-2 py-0.5 text-lg font-bold leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        ⋮
      </button>
      {menuPos && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuPos(null)} />
          <div
            style={{ position: "fixed", top: menuPos.top, right: menuPos.right }}
            className="z-20 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            <form
              action={action}
              onSubmit={(e) => {
                setMenuPos(null);
                if (
                  !confirm(
                    `Delete ${label}?\n\nThis removes the invoice and its history permanently.`
                  )
                ) {
                  e.preventDefault();
                }
              }}
            >
              <button className="w-full px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                🗑 Delete Invoice
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
