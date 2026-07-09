import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { createLpo } from "@/app/actions";
import { LpoForm } from "@/components/LpoForm";

export const dynamic = "force-dynamic";

export default async function NewLpoPage() {
  const user = await requireUser();
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.SALESMAN) redirect("/");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">New Invoice</h1>
      <p className="text-sm text-gray-500">
        Fill in the order and send it to the warehouse team. It will appear for
        them as <strong>Pending</strong>.
      </p>
      <LpoForm action={createLpo} submitLabel="Create Invoice & Send to Warehouse" />
    </div>
  );
}
