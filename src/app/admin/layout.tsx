"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckCheck,
  ClipboardCheck,
  LayoutDashboard,
  Settings2,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import { useAdminCounts } from "@/components/admin/ui";
import { cn } from "@/lib/cn";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { counts } = useAdminCounts();

  const tabs = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, badge: 0 },
    { href: "/admin/queue", label: "Review queue", icon: ClipboardCheck, badge: counts.toReview },
    { href: "/admin/done", label: "History & DMs", icon: CheckCheck, badge: counts.dmsToSend },
    { href: "/admin/profiles", label: "Profiles", icon: UsersRound, badge: 0 },
    { href: "/admin/settings", label: "Settings", icon: Settings2, badge: 0 },
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-3 pb-28 pt-3 md:px-5 md:pb-12 md:pt-4">
      <div className="admin-nav glass flex flex-col gap-3 rounded-[28px] p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 px-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-green text-[var(--ink-on-green)]">
            <ShieldAlert size={19} aria-hidden />
          </span>
          <div>
            <p className="font-display text-lg font-semibold leading-tight">Admin console</p>
            <p className="text-xs text-[var(--orange-deep)]">Demo only · not protected yet</p>
          </div>
        </div>
        <nav
          className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]"
          aria-label="Admin sections"
        >
          {tabs.map(({ href, label, icon: Icon, badge }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium",
                  active
                    ? "bg-green text-[var(--ink-on-green)] shadow-[0_6px_16px_rgba(28,74,57,0.28)]"
                    : "text-fg/80 hover:bg-white/50 dark:hover:bg-white/10",
                )}
              >
                <Icon size={16} aria-hidden />
                {label}
                {badge > 0 ? (
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold",
                      active ? "bg-white/25" : "bg-orange text-[var(--ink-on-orange)]",
                    )}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-5">{children}</div>
    </div>
  );
}
