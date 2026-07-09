"use client";

import { usePathname, useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  // No back button on the dashboard (home) or login screen
  if (pathname === "/" || pathname === "/login") return null;

  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      title="Go back"
      className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-xl text-white shadow-lg hover:bg-slate-700 active:scale-95"
    >
      ←
    </button>
  );
}
