"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/browse", label: "Browse" },
  { href: "/me", label: "My activity" },
  { href: "/admin", label: "Admin" },
];

export function TopBar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header
      className="glass sticky top-0 z-40 hidden items-center justify-between gap-4 px-5 py-3 md:flex"
      style={{ paddingTop: "max(0.75rem, var(--safe-top))" }}
    >
      <Link href="/browse" className="font-display text-xl font-semibold tracking-tight text-fg focus-ring rounded-lg">
        Still Looking
      </Link>
      <nav className="flex items-center gap-1" aria-label="Primary">
        {links.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "focus-ring rounded-full px-4 py-2 text-sm font-medium",
                active ? "bg-green text-[var(--ink-on-green)]" : "text-fg/80 hover:bg-white/20",
              )}
            >
              {l.label}
              {l.href === "/me" && pendingCount > 0 ? (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1.5 text-xs text-[var(--ink-on-orange)]">
                  {pendingCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      {isAdmin ? (
        <p className="text-xs text-slate">Demo only: not protected</p>
      ) : (
        <Link href="/list" className="btn-primary text-sm focus-ring">
          List yourself
        </Link>
      )}
    </header>
  );
}
