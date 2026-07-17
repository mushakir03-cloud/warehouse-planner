import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { BackButton } from "@/components/BackButton";
import { NewLpoWatcher } from "@/components/NewLpoWatcher";
import { SavedToast } from "@/components/SavedToast";

export const metadata: Metadata = {
  title: "Delivery Order Tracker",
  description: "Track and manage delivery orders efficiently",
  manifest: "/manifest.json",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport = {
  themeColor: "#1e293b",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100 text-gray-900 antialiased">
        {user && <Nav user={{ name: user.name, role: user.role }} />}
        <main className="mx-auto max-w-6xl px-4 py-6 pb-24">{children}</main>
        {user && <BackButton />}
        {user?.role === "WAREHOUSE_KEEPER" && <NewLpoWatcher />}
        {user && (
          <Suspense>
            <SavedToast />
          </Suspense>
        )}
      </body>
    </html>
  );
}
