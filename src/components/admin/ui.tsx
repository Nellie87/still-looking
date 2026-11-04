"use client";

import { useCallback, useEffect, useState } from "react";
import { getRepo } from "@/lib/data";
import type { Kind, ProfileStatus, QueueItem, RequestStatus } from "@/lib/data/repo";
import { cn } from "@/lib/cn";

/** "3 min ago", "2 days ago" — short relative time for admin lists. */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} ${d === 1 ? "day" : "days"} ago`;
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

const STATUS_STYLE: Record<RequestStatus | ProfileStatus, { label: string; cls: string }> = {
  pending: { label: "Waiting", cls: "bg-orange/25 text-[var(--orange-deep)]" },
  approved: { label: "Approved", cls: "bg-green/15 text-green" },
  rejected: { label: "Rejected", cls: "bg-red-500/10 text-red-700" },
  pending_review: { label: "Pending review", cls: "bg-orange/25 text-[var(--orange-deep)]" },
  live: { label: "Live", cls: "bg-green/15 text-green" },
  paused: { label: "Paused", cls: "bg-slate/15 text-slate" },
  found: { label: "Found someone", cls: "bg-green/15 text-green" },
  removed: { label: "Removed", cls: "bg-red-500/10 text-red-700" },
};

export function StatusPill({ status }: { status: RequestStatus | ProfileStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        s.cls,
      )}
    >
      {s.label}
    </span>
  );
}

export function KindDot({ kind, label = false }: { kind: Kind; label?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span
        aria-hidden
        className={cn("h-2.5 w-2.5 rounded-full", kind === "love" ? "bg-green" : "bg-orange")}
      />
      {label ? (kind === "love" ? "Love" : "Friendship") : null}
    </span>
  );
}

export function PurposeTag({ purpose }: { purpose: QueueItem["purpose"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        purpose === "listing" ? "bg-orange/20" : "bg-green/10 text-green",
      )}
    >
      {purpose === "listing" ? "New listing" : "Contact unlock"}
    </span>
  );
}

export function AdminCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("admin-card", className)}>{children}</div>;
}

export function PageIntro({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-xl text-sm text-muted">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="admin-card py-10 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {body ? <p className="mt-1 text-sm text-muted">{body}</p> : null}
    </div>
  );
}

/** Copy button with a short "Copied" confirmation. */
export function CopyButton({
  value,
  label = "Copy",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={cn(
        "focus-ring inline-flex items-center rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-xs font-medium hover:bg-white dark:border-white/15 dark:bg-white/10",
        className,
      )}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setDone(true);
        window.setTimeout(() => setDone(false), 1400);
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

/** Counts used by the admin nav badges; refreshes on an interval and on demand. */
export function useAdminCounts() {
  const [counts, setCounts] = useState({ toReview: 0, dmsToSend: 0, pendingProfiles: 0 });

  const refresh = useCallback(async () => {
    const repo = getRepo();
    const [queue, profiles] = await Promise.all([
      repo.adminQueue({ status: "all" }),
      repo.adminProfiles(),
    ]);
    setCounts({
      toReview: queue.filter((q) => q.status === "pending").length,
      dmsToSend: queue.filter(
        (q) => q.purpose === "unlock" && q.status === "approved" && !q.dmSentAt,
      ).length,
      pendingProfiles: profiles.filter((p) => p.status === "pending_review").length,
    });
  }, []);

  useEffect(() => {
    const first = window.setTimeout(() => void refresh(), 0);
    const id = window.setInterval(() => void refresh(), 3000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [refresh]);

  return { counts, refresh };
}

/** Message for the listed person, so a paid unlock never arrives as a surprise. */
export function headsUpMessage(item: QueueItem) {
  const intro = item.note ? `

They wrote: "${item.note}"` : "";
  return `Hi ${item.profile.alias}, good news from Still Looking: someone has unlocked your profile (${item.profile.code}) and will reach out on Instagram soon.${intro}

If anything feels off, reply here and we'll help.`;
}

export function fillDmTemplate(tpl: string, item: QueueItem) {
  return tpl
    .replaceAll("{handle}", item.requesterHandle ?? "@friend")
    .replaceAll("{code}", item.profile.code)
    .replaceAll("{alias}", item.profile.alias)
    .replaceAll("{instagram}", item.privateContact.instagram)
    .replaceAll("{phone}", item.privateContact.phone);
}
