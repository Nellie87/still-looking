"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartHandshake, LayoutGrid, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

const links = [
  { href: "/browse", label: "Browse", icon: LayoutGrid },
  { href: "/list", label: "List yourself", icon: HeartHandshake },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function LogoMark() {
  return (
    <span className="relative inline-block h-7 w-11 shrink-0" aria-hidden>
      <span className="absolute left-0 top-0 h-7 w-7 rounded-full bg-green shadow-sm" />
      <span className="absolute left-4 top-0 h-7 w-7 rounded-full border-2 border-white/70 bg-orange shadow-sm" />
    </span>
  );
}

export function TopBar({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();
  const meActive = isActive(pathname, "/me");

  return (
    <header
      className="sticky top-0 z-40 hidden px-5 md:block"
      style={{ paddingTop: "max(0.75rem, var(--safe-top))" }}
    >
      <div className="topbar glass mx-auto flex max-w-[1200px] items-center justify-between gap-4 rounded-[34px] py-2.5 pl-5 pr-3">
        <Link
          href="/browse"
          className="focus-ring flex items-center gap-2.5 rounded-lg font-display text-[1.35rem] font-semibold tracking-tight text-fg"
        >
          <LogoMark />
          Still Looking
        </Link>

        <div className="flex items-center gap-3">
          <nav
            className="flex items-center gap-1 rounded-full bg-white/45 p-1 dark:bg-white/10"
            aria-label="Primary"
          >
            {links.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.95rem] font-medium",
                    active
                      ? "bg-green text-[var(--ink-on-green)] shadow-[0_6px_16px_rgba(28,74,57,0.3)]"
                      : "text-fg/85 hover:bg-white/50 dark:hover:bg-white/10",
                  )}
                >
                  <Icon size={17} strokeWidth={1.9} aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/me"
            aria-label={pendingCount > 0 ? `My activity, ${pendingCount} pending` : "My activity"}
            aria-current={meActive ? "page" : undefined}
            className={cn(
              "focus-ring relative inline-flex h-11 w-11 items-center justify-center rounded-full shadow-sm",
              meActive
                ? "bg-green text-[var(--ink-on-green)]"
                : "bg-white/70 text-fg dark:bg-white/10",
            )}
          >
            <UserRound size={19} strokeWidth={1.9} aria-hidden />
            {pendingCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1.5 text-xs font-semibold text-[var(--ink-on-orange)]">
                {pendingCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
