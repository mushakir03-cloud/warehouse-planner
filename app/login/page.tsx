import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { login } from "@/app/actions";
import { asset } from "@/lib/constants";
import { btnPrimary, card, field, fieldLabel } from "@/lib/ui";

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
    <div className="mx-auto mt-20 max-w-sm px-4 pb-16">
      <div className="mb-7 text-center">
        <div className="mb-5 flex justify-center">
          <Image src={asset("/logo.svg")} alt="" width={76} height={53} priority />
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-gray-900">
          Delivery Order Tracker
        </h1>
        <p className="mt-1.5 text-[15px] text-gray-500">Sign in to continue</p>
      </div>

      <div className={`${card} p-6`}>
        <form action={login} className="space-y-4">
          <div>
            <label className={fieldLabel}>Username</label>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              className={field}
            />
          </div>
          <div>
            <label className={fieldLabel}>Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={field}
            />
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              Invalid username or password
            </p>
          )}
          <button className={`${btnPrimary} w-full py-2.5`}>Sign In</button>
        </form>
      </div>
    </div>
  );
}
