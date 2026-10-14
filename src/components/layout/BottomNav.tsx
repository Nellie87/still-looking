"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartHandshake, LayoutGrid, Shield, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/browse", label: "Browse", icon: LayoutGrid },
  { href: "/list", label: "List", icon: HeartHandshake },
  { href: "/me", label: "Activity", icon: UserRound },
  { href: "/admin", label: "Admin", icon: Shield },
];

export function BottomNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t md:hidden"
      style={{ paddingBottom: "var(--safe-bottom)", minHeight: "calc(var(--nav-h) + var(--safe-bottom))" }}
      aria-label="Mobile"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "focus-ring relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              active ? "text-green" : "text-muted",
            )}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 2} />
            <span>{label}</span>
            {href === "/me" && pendingCount > 0 ? (
              <span className="absolute right-[28%] top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[10px] text-[var(--ink-on-orange)]">
                {pendingCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
