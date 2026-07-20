"use client";

import { useState } from "react";

export function CollapsibleSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 text-left hover:bg-gray-100"
      >
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xl">{isOpen ? "▼" : "▶"}</span>
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </section>
  );
}
