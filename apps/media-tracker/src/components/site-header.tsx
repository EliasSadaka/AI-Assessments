import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/search", label: "Search" },
  { href: "/collection", label: "My Collection" },
  { href: "/users", label: "Users" },
  { href: "/settings", label: "Settings" },
  { href: "/about", label: "About" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-zinc-800/40 bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          BingeBoard
        </Link>
        <nav className="hidden items-center gap-4 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-emerald-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="text-sm">
          {user ? (
            <SignOutButton />
          ) : (
            <div className="flex gap-3">
              <Link href="/login" className="hover:text-emerald-300">
                Log in
              </Link>
              <Link href="/signup" className="hover:text-emerald-300">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
