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
        className="flex w-full items-center justify-between rounded-2xl border border-hairline/60 bg-white px-4 py-3 text-left transition-colors hover:bg-gray-50"
      >
        <h2 className="text-[17px] font-semibold tracking-tight text-gray-900">{title}</h2>
        <span className={`text-[11px] text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}>&#9654;</span>
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </section>
  );
}
