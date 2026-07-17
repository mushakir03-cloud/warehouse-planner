import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/actions";
import { ROLES, getUserRoleLabel } from "@/lib/constants";

type NavUser = { name: string; role: string };

export function Nav({ user }: { user: NavUser }) {
  let links: { href: string; label: string }[];

  if (user.role === ROLES.SALESMAN) {
    // Dashboard + one merged "Deliveries" tab (schedule + search) + create.
    links = [
      { href: "/", label: "Dashboard" },
      { href: "/deliveries", label: "Deliveries" },
      { href: "/lpos/new", label: "+ New Invoice" },
    ];
  } else if (user.role === ROLES.WAREHOUSE_KEEPER) {
    // Warehouse: Dashboard + Deliveries is all they need
    links = [
      { href: "/", label: "Dashboard" },
      { href: "/deliveries", label: "Deliveries" },
    ];
  } else {
    // Admin: everything
    links = [
      { href: "/", label: "Dashboard" },
      { href: "/lpos", label: "Invoices" },
      { href: "/deliveries", label: "Deliveries" },
      { href: "/lpos/new", label: "+ New Invoice" },
      { href: "/history", label: "History" },
      { href: "/activity", label: "Activity Log" },
    ];
  }

  return (
    <header className="bg-slate-800 text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="rounded bg-white p-1">
            <Image src="/logo.svg" alt="Delivery Order Tracker" width={28} height={20} />
          </span>
          Delivery Order Tracker
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-slate-300">
            {user.name} · {getUserRoleLabel(user.name, user.role)}
          </span>
          <form action={logout}>
            <button className="rounded bg-slate-600 px-2 py-1 text-xs hover:bg-slate-500">
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
