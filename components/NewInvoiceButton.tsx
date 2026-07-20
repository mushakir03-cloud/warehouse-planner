import Link from "next/link";

export function NewInvoiceButton() {
  return (
    <Link
      href="/lpos/new"
      className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
    >
      + New Invoice
    </Link>
  );
}
