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
      className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-hairline/70 bg-white/80 text-lg text-gray-700 shadow-[0_2px_10px_rgba(0,0,0,0.10)] backdrop-blur-xl transition-transform hover:bg-white active:scale-95"
    >
      ←
    </button>
  );
}
