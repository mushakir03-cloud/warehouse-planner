import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { login } from "@/app/actions";
import { asset } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const { error } = await searchParams;

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex justify-center">
          <Image src={asset("/logo.svg")} alt="Delivery Order Tracker" width={90} height={63} />
        </div>
        <h1 className="mb-1 text-center text-2xl font-bold">Delivery Order Tracker</h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Staff login
        </p>
        <form action={login} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Username</label>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          {error && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
              Invalid username or password
            </p>
          )}
          <button className="w-full rounded bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
