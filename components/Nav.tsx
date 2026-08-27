import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/actions";
import { ROLES, asset, getUserRoleLabel } from "@/lib/constants";

type NavUser = { name: string; role: string };

export function Nav({ user }: { user: NavUser }) {
  let links: { href: string; label: string }[];

  if (user.role === ROLES.SALESMAN) {
    // Dashboard + one merged "Deliveries" tab (schedule + search). New invoice button moved to dashboard.
    links = [
      { href: "/", label: "Dashboard" },
      { href: "/deliveries", label: "Deliveries" },
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
    <header className="sticky top-0 z-40 border-b border-hairline/70 bg-white/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-gray-900">
          <Image src={asset("/logo.svg")} alt="" width={26} height={19} />
          Delivery Order Tracker
        </Link>
        <nav className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[13px]">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-2.5 py-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-[13px]">
          <span className="text-gray-500">
            {user.name} · {getUserRoleLabel(user.name, user.role)}
          </span>
          <form action={logout}>
            <button className="rounded-full border border-hairline px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100">
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
