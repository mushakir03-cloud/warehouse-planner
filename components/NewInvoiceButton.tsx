import Link from "next/link";
import { btnPrimary } from "@/lib/ui";

export function NewInvoiceButton() {
  return (
    <Link href="/lpos/new" className={btnPrimary}>
      + New Invoice
    </Link>
  );
}
