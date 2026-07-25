import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { WipeInvoicesButton } from "@/components/WipeInvoicesButton";

export const dynamic = "force-dynamic";

export default async function WipeInvoicesPage() {
  const user = await requireUser();
  if (user.role !== ROLES.ADMIN) redirect("/");

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-red-700">⚠ Wipe All Invoices</h1>
      <p className="text-sm text-gray-600">
        This permanently deletes every invoice and its activity log. Users are not affected.
        This cannot be undone.
      </p>
      <WipeInvoicesButton />
    </div>
  );
}
