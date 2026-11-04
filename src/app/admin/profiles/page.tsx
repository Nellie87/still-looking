"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Pause, Play, RotateCcw, Search, Trash2 } from "lucide-react";
import { getRepo } from "@/lib/data";
import type { AdminProfile, Kind, ProfileStatus } from "@/lib/data/repo";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/Toast";
import { CopyButton, EmptyState, KindDot, PageIntro, StatusPill } from "@/components/admin/ui";

type Tab = "all" | "live" | "paused" | "pending_review" | "archived";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "paused", label: "Paused" },
  { id: "pending_review", label: "Pending review" },
  { id: "archived", label: "Removed & rejected" },
];

const ARCHIVED: ProfileStatus[] = ["removed", "rejected", "found"];

function inTab(p: AdminProfile, t: Tab) {
  if (t === "all") return !ARCHIVED.includes(p.status);
  if (t === "archived") return ARCHIVED.includes(p.status);
  return p.status === t;
}

export default function AdminProfilesPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<AdminProfile[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [kind, setKind] = useState<Kind | "all">("all");
  const [q, setQ] = useState("");
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [confirm, setConfirm] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await getRepo().adminProfiles());
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const counts = useMemo(() => {
    const c = {} as Record<Tab, number>;
    for (const t of TABS) c[t.id] = items.filter((p) => inTab(p, t.id)).length;
    return c;
  }, [items]);

  const list = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((p) => {
      if (!inTab(p, tab)) return false;
      if (kind !== "all" && p.kind !== kind) return false;
      if (!words.length) return true;
      const hay = [p.code, p.alias, p.area, p.headline, p.tags.join(" "), p.privateContact.instagram]
        .join(" ")
        .toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [items, tab, kind, q]);

  async function setStatus(p: AdminProfile, s: ProfileStatus, msg: string) {
    const prev = p.status;
    await getRepo().setProfileStatus(p.code, s);
    setConfirm(null);
    await load();
    toast(msg, {
      actionLabel: "Undo",
      onAction: async () => {
        await getRepo().setProfileStatus(p.code, prev);
        await load();
      },
      ms: 5000,
    });
  }

  return (
    <div className="space-y-5">
      <PageIntro
        title="Profiles"
        description="Everyone who has listed. Pause a profile to hide it from browse for a while, or remove it. Every change can be undone."
      />

      <div className="admin-card space-y-3 !p-3">
        <div className="flex gap-1.5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="chip focus-ring"
              data-active={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span className="ml-1.5 opacity-70">{counts[t.id] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex shrink-0 rounded-full bg-black/[0.04] p-1 dark:bg-white/10">
            {(
              [
                ["all", "Both"],
                ["love", "Love"],
                ["friend", "Friendship"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={kind === id}
                className={cn(
                  "focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm",
                  kind === id && "bg-white font-medium shadow-sm dark:bg-white/15",
                )}
                onClick={() => setKind(id)}
              >
                {id !== "all" ? <KindDot kind={id} /> : null}
                {label}
              </button>
            ))}
          </div>
          <label className="relative flex-1">
            <span className="sr-only">Search profiles</span>
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input
              className="admin-input w-full !pl-10"
              placeholder="Search code, alias, area, tag, Instagram…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState title="No profiles here" body="Try another tab or clear the search." />
      ) : (
        <div className="admin-card overflow-hidden !p-0">
          <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b border-black/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted md:grid dark:border-white/10">
            <span>Profile</span>
            <span>Area · age</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {list.map((p) => (
              <li
                key={p.code}
                className="grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold",
                      p.kind === "love"
                        ? "bg-green text-[var(--ink-on-green)]"
                        : "bg-orange text-[var(--ink-on-orange)]",
                    )}
                    aria-hidden
                  >
                    {p.alias.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {p.alias} <span className="font-normal text-muted">· {p.code}</span>
                    </p>
                    <p className="truncate text-sm text-muted">{p.headline}</p>
                    {shown[p.code] ? (
                      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                        {p.privateContact.instagram} <CopyButton value={p.privateContact.instagram} />
                        {p.privateContact.phone} <CopyButton value={p.privateContact.phone} />
                      </p>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm text-muted md:text-fg">
                  {p.area} · {p.age}
                  <span className="ml-2 md:hidden">
                    <StatusPill status={p.status} />
                  </span>
                </p>
                <div className="hidden md:block">
                  <StatusPill status={p.status} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                  {confirm === p.code ? (
                    <>
                      <span className="text-sm">Remove {p.alias}?</span>
                      <button
                        type="button"
                        className="admin-action !border-red-500/30 !text-red-700"
                        onClick={() => setStatus(p, "removed", `${p.alias} removed`)}
                      >
                        Yes, remove
                      </button>
                      <button type="button" className="admin-action" onClick={() => setConfirm(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="admin-action"
                        aria-pressed={!!shown[p.code]}
                        onClick={() => setShown((s) => ({ ...s, [p.code]: !s[p.code] }))}
                      >
                        {shown[p.code] ? <EyeOff size={14} /> : <Eye size={14} />}
                        Contact
                      </button>
                      {p.status === "live" ? (
                        <button
                          type="button"
                          className="admin-action"
                          onClick={() => setStatus(p, "paused", `${p.alias} paused`)}
                        >
                          <Pause size={14} /> Pause
                        </button>
                      ) : null}
                      {p.status === "paused" || p.status === "pending_review" ? (
                        <button
                          type="button"
                          className="admin-action"
                          onClick={() =>
                            setStatus(
                              p,
                              "live",
                              p.status === "paused" ? `${p.alias} is live again` : `${p.alias} published`,
                            )
                          }
                        >
                          <Play size={14} /> {p.status === "paused" ? "Resume" : "Publish"}
                        </button>
                      ) : null}
                      {ARCHIVED.includes(p.status) ? (
                        <button
                          type="button"
                          className="admin-action"
                          onClick={() => setStatus(p, "paused", `${p.alias} restored as paused`)}
                        >
                          <RotateCcw size={14} /> Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="admin-action hover:!text-red-700"
                          aria-label={`Remove ${p.alias}`}
                          onClick={() => setConfirm(p.code)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
