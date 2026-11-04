"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Banknote, ClipboardCheck, MessageCircle, UsersRound, Unlock } from "lucide-react";
import { getRepo } from "@/lib/data";
import type { AdminProfile, AdminStats, QueueItem } from "@/lib/data/repo";
import { formatKes } from "@/lib/money";
import { cn } from "@/lib/cn";
import {
  AdminCard,
  KindDot,
  PurposeTag,
  StatusPill,
  timeAgo,
} from "@/components/admin/ui";

function greeting(h: number) {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [now, setNow] = useState<{ ms: number; day: string; hour: number } | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const repo = getRepo();
    void Promise.all([repo.adminStats(), repo.adminQueue({ status: "all" }), repo.adminProfiles()]).then(
      ([s, q, p]) => {
        setStats(s);
        setQueue(q);
        setProfiles(p);
        const d = new Date();
        setNow({ ms: d.getTime(), day: d.toISOString().slice(0, 10), hour: d.getHours() });
      },
    );
  }, []);

  const pending = useMemo(() => queue.filter((q) => q.status === "pending"), [queue]);
  const dms = useMemo(
    () => queue.filter((q) => q.purpose === "unlock" && q.status === "approved" && !q.dmSentAt),
    [queue],
  );
  const byStatus = useMemo(() => {
    const m = { live: 0, paused: 0, pending_review: 0, other: 0, love: 0, friend: 0 };
    for (const p of profiles) {
      if (p.status === "live") {
        m.live++;
        if (p.kind === "love") m.love++;
        else m.friend++;
      } else if (p.status === "paused") m.paused++;
      else if (p.status === "pending_review") m.pending_review++;
      else m.other++;
    }
    return m;
  }, [profiles]);

  if (!stats || !now) {
    return (
      <div className="grid gap-3 md:grid-cols-4" aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="admin-card h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  const days = stats.revenueByDay;
  const max = Math.max(1, ...days.map((d) => d.total));
  const avg = Math.round(stats.revenue14d / Math.max(1, days.length));
  const todo = pending.length + dms.length;
  const shown = hover != null ? days[hover] : null;

  const kpis = [
    {
      label: "Revenue · 14 days",
      value: formatKes(stats.revenue14d),
      hint: `≈ ${formatKes(avg)} a day`,
      icon: Banknote,
      href: "/admin/done",
    },
    {
      label: "Waiting for review",
      value: String(stats.toReview),
      hint: stats.toReview ? "Check M-Pesa, then approve" : "All caught up",
      icon: ClipboardCheck,
      href: "/admin/queue",
      alert: stats.toReview > 0,
    },
    {
      label: "Live profiles",
      value: String(stats.liveProfiles),
      hint: `${byStatus.love} love · ${byStatus.friend} friendship`,
      icon: UsersRound,
      href: "/admin/profiles",
    },
    {
      label: "Contacts unlocked",
      value: String(stats.contactsUnlocked),
      hint: dms.length ? `${dms.length} DM${dms.length === 1 ? "" : "s"} still to send` : "All DMs sent",
      icon: Unlock,
      href: "/admin/done",
      alert: dms.length > 0,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Today strip */}
      <div className="admin-hero">
        <div>
          <p className="text-sm opacity-80">{greeting(now.hour)}</p>
          <p className="mt-1 font-display text-2xl font-semibold md:text-3xl">
            {todo === 0
              ? "Nothing needs you right now."
              : `${todo} thing${todo === 1 ? "" : "s"} need${todo === 1 ? "s" : ""} you today.`}
          </p>
          <p className="mt-1 text-sm opacity-80">
            {pending.length} payment{pending.length === 1 ? "" : "s"} to verify · {dms.length} contact
            DM{dms.length === 1 ? "" : "s"} to send
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pending.length ? (
            <Link href="/admin/queue" className="btn-primary focus-ring !bg-none !bg-white !text-green">
              Start reviewing <ArrowRight size={16} />
            </Link>
          ) : null}
          {dms.length ? (
            <Link
              href="/admin/done?filter=dm"
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-white/40 px-4 font-semibold"
            >
              <MessageCircle size={16} /> Send DMs
            </Link>
          ) : null}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(({ label, value, hint, icon: Icon, href, alert }) => (
          <Link key={label} href={href} className="admin-card admin-kpi focus-ring group">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted">{label}</p>
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-xl",
                  alert ? "bg-orange/25 text-[var(--orange-deep)]" : "bg-green/10 text-green",
                )}
              >
                <Icon size={16} aria-hidden />
              </span>
            </div>
            <p className="mt-2 font-display text-2xl font-semibold md:text-3xl">{value}</p>
            <p className={cn("mt-1 text-xs", alert ? "text-[var(--orange-deep)]" : "text-muted")}>
              {hint}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Revenue chart */}
        <AdminCard>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold">Revenue · last 14 days</h2>
              <p className="text-xs text-muted">Approved payments only, by day reviewed.</p>
            </div>
            <p className="text-right text-sm" aria-live="polite">
              {shown ? (
                <>
                  <span className="font-semibold">{formatKes(shown.total)}</span>{" "}
                  <span className="text-muted">
                    on{" "}
                    {new Date(shown.day).toLocaleDateString("en-KE", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </>
              ) : (
                <span className="text-muted">Hover a bar for the day&apos;s total</span>
              )}
            </p>
          </div>
          <div className="relative mt-5 h-44">
            {stats.revenue14d === 0 ? (
              <p className="absolute inset-0 z-10 flex items-center justify-center text-center text-sm text-muted">
                No approved payments in the last 14 days yet.
                <br />
                Approvals from the review queue show up here.
              </p>
            ) : null}
            <div
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate/30"
              style={{ bottom: `${(avg / max) * 100}%` }}
              aria-hidden
            >
              <span className="absolute -top-4 right-0 text-[10px] text-muted">avg</span>
            </div>
            <div className="flex h-full items-end gap-1.5" role="list" aria-label="Revenue by day">
              {days.map((d, i) => {
                const isToday = d.day === now.day;
                return (
                  <button
                    key={d.day}
                    type="button"
                    role="listitem"
                    className="group flex h-full flex-1 items-end focus-ring rounded-md"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    aria-label={`${d.day}: ${formatKes(d.total)}`}
                  >
                    <span
                      className={cn(
                        "block w-full rounded-t-lg transition-all",
                        isToday ? "bg-orange" : "bg-green/70 group-hover:bg-green",
                        d.total === 0 && "bg-slate/15",
                      )}
                      style={{ height: `${Math.max(3, (d.total / max) * 100)}%` }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted">
            <span>
              {new Date(days[0].day).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange" /> Today
            </span>
          </div>
        </AdminCard>

        {/* Needs attention */}
        <AdminCard>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Needs attention</h2>
            <Link href="/admin/queue" className="text-sm text-green underline-offset-4 hover:underline">
              Open queue
            </Link>
          </div>
          {pending.length === 0 && dms.length === 0 ? (
            <p className="mt-6 text-center text-sm text-muted">You&apos;re all caught up.</p>
          ) : (
            <ul className="mt-3 divide-y divide-black/5 dark:divide-white/10">
              {pending.slice(0, 4).map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/admin/queue#${q.id}`}
                    className="flex items-center gap-3 py-3 hover:opacity-80"
                  >
                    <KindDot kind={q.profile.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {q.purpose === "listing" ? "Verify listing" : "Verify unlock"} ·{" "}
                        {q.profile.alias}
                      </p>
                      <p className="text-xs text-muted">
                        {formatKes(q.amountKes)} · {q.mpesaCode} · {timeAgo(q.createdAt, now.ms)}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
              {dms.slice(0, 3).map((q) => (
                <li key={q.id}>
                  <Link href="/admin/done?filter=dm" className="flex items-center gap-3 py-3 hover:opacity-80">
                    <MessageCircle size={14} className="text-green" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        Send {q.profile.alias}&apos;s contact to {q.requesterHandle ?? "requester"}
                      </p>
                      <p className="text-xs text-muted">Approved {timeAgo(q.createdAt, now.ms)}</p>
                    </div>
                    <ArrowRight size={16} className="text-muted" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        {/* Profile mix */}
        <AdminCard>
          <h2 className="font-display text-lg font-semibold">Profiles</h2>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate/10" aria-hidden>
            <span className="bg-green" style={{ width: `${(byStatus.love / Math.max(1, byStatus.live)) * 100}%` }} />
            <span className="bg-orange" style={{ width: `${(byStatus.friend / Math.max(1, byStatus.live)) * 100}%` }} />
          </div>
          <p className="mt-2 flex justify-between text-xs text-muted">
            <KindDot kind="love" label />
            <span>
              {byStatus.love} / {byStatus.friend}
            </span>
            <KindDot kind="friend" label />
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {(
              [
                ["Live", byStatus.live],
                ["Paused", byStatus.paused],
                ["Pending", byStatus.pending_review],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-black/[0.03] p-3 dark:bg-white/5">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="font-display text-xl font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/admin/profiles"
            className="mt-4 inline-flex items-center gap-1 text-sm text-green underline-offset-4 hover:underline"
          >
            Manage profiles <ArrowRight size={14} />
          </Link>
        </AdminCard>

        {/* Recent activity */}
        <AdminCard>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent payments</h2>
            <Link href="/admin/done" className="text-sm text-green underline-offset-4 hover:underline">
              See all
            </Link>
          </div>
          <ol className="admin-timeline mt-3">
            {queue.slice(0, 6).map((q) => (
              <li key={q.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <span
                  className={cn(
                    "admin-timeline__dot",
                    q.status === "approved"
                      ? "bg-green"
                      : q.status === "rejected"
                        ? "bg-red-500/70"
                        : "bg-orange",
                  )}
                  aria-hidden
                />
                <p className="min-w-0 flex-1 truncate text-sm">
                  <span className="font-medium">{q.profile.alias}</span>{" "}
                  <span className="text-muted">· {formatKes(q.amountKes)}</span>
                </p>
                <PurposeTag purpose={q.purpose} />
                <StatusPill status={q.status} />
                <span className="w-20 text-right text-xs text-muted">{timeAgo(q.createdAt, now.ms)}</span>
              </li>
            ))}
          </ol>
        </AdminCard>
      </div>
    </div>
  );
}
