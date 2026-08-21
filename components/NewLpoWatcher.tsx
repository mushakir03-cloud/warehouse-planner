"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { asset } from "@/lib/constants";

/**
 * Mounted only for the warehouse login. Checks the server every 15 seconds;
 * when a new LPO appears it shows a banner, beeps and vibrates, and refreshes
 * the lists on screen.
 */
export function NewLpoWatcher() {
  const router = useRouter();
  const [newLpo, setNewLpo] = useState<{ id: number; customerName: string } | null>(null);
  const lastSeen = useRef<number | null>(null);

  useEffect(() => {
    let stopped = false;

    const ding = () => {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        const note = (freq: number, at: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = freq;
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + at);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + 0.3);
          osc.start(ctx.currentTime + at);
          osc.stop(ctx.currentTime + at + 0.3);
        };
        note(880, 0);
        note(1175, 0.2);
      } catch {
        // sound blocked until first tap — banner and vibration still work
      }
    };

    const check = async () => {
      try {
        const res = await fetch(asset("/api/lpo-ping"), { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data: { maxId: number; customerName: string } = await res.json();
        if (lastSeen.current === null || data.maxId < lastSeen.current) {
          // first check, or an LPO was deleted — just remember the level
          lastSeen.current = data.maxId;
          return;
        }
        if (data.maxId > lastSeen.current) {
          lastSeen.current = data.maxId;
          setNewLpo({ id: data.maxId, customerName: data.customerName });
          try {
            navigator.vibrate?.([200, 100, 200]);
          } catch {}
          ding();
          router.refresh();
        }
      } catch {
        // server briefly unreachable — try again on the next tick
      }
    };

    check();
    const interval = setInterval(check, 15000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [router]);

  if (!newLpo) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] bg-blue-600 px-4 py-3 text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <p className="text-sm font-semibold">
          🆕 New Invoice received — {newLpo.customerName}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/lpos/${newLpo.id}`}
            onClick={() => setNewLpo(null)}
            className="rounded bg-white px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"
          >
            Open
          </Link>
          <button
            onClick={() => setNewLpo(null)}
            aria-label="Dismiss"
            className="rounded px-2 py-1 text-lg leading-none hover:bg-blue-500"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
