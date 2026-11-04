"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, MessageCircle, Search } from "lucide-react";
import { getRepo } from "@/lib/data";
import type { QueueItem, Settings } from "@/lib/data/repo";
import { formatKes } from "@/lib/money";
import { cn } from "@/lib/cn";
import {
  CopyButton,
  EmptyState,
  KindDot,
  PageIntro,
  PurposeTag,
  StatusPill,
  fillDmTemplate,
  headsUpMessage,
  timeAgo,
} from "@/components/admin/ui";

type Filter = "all" | "dm" | "approved" | "rejected";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "dm", label: "DMs to send" },
  { id: "all", label: "All" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const needsDm = (i: QueueItem) => i.purpose === "unlock" && i.status === "approved" && !i.dmSentAt;

export default function AdminHistoryPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    const repo = getRepo();
    const [s, list] = await Promise.all([repo.getSettings(), repo.adminQueue({ status: "all" })]);
    setSettings(s);
    setItems(list.filter((i) => i.status !== "pending"));
    setNow(Date.now());
  }, []);

  useEffect(() => {
    /* ?filter=dm deep-links straight to the DM list */
    const f = new URLSearchParams(window.location.search).get("filter");
    const t = window.setTimeout(() => {
      if (f === "dm" || f === "approved" || f === "rejected") setFilter(f);
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const counts = useMemo(
    () => ({
      all: items.length,
      dm: items.filter(needsDm).length,
      approved: items.filter((i) => i.status === "approved").length,
      rejected: items.filter((i) => i.status === "rejected").length,
    }),
    [items],
  );

  const shown = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((i) => {
      if (filter === "dm" && !needsDm(i)) return false;
      if ((filter === "approved" || filter === "rejected") && i.status !== filter) return false;
      if (!words.length) return true;
      const hay = [i.mpesaCode, i.profile.code, i.profile.alias, i.requesterHandle ?? ""]
        .join(" ")
        .toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [items, filter, q]);

  const approvedTotal = items
    .filter((i) => i.status === "approved")
    .reduce((s, i) => s + i.amountKes, 0);

  return (
    <div className="space-y-5">
      <PageIntro
        title="History & DMs"
        description="Every reviewed payment. For approved contact unlocks, copy the ready-made message, send it on Instagram, then mark it sent."
        actions={
          <p className="rounded-full bg-green/10 px-3 py-1.5 text-sm text-green">
            {formatKes(approvedTotal)} approved in total
          </p>
        }
      />

      <div className="admin-card flex flex-col gap-3 !p-3 md:flex-row md:items-center">
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="chip focus-ring"
              data-active={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              <span
                className={cn(
                  "ml-1.5",
                  f.id === "dm" && counts.dm > 0 && filter !== "dm"
                    ? "rounded-full bg-orange px-1.5 text-xs font-semibold text-[var(--ink-on-orange)]"
                    : "opacity-70",
                )}
              >
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>
        <label className="relative flex-1">
          <span className="sr-only">Search history</span>
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            className="admin-input w-full !pl-10"
            placeholder="Search code, alias, handle…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title={filter === "dm" ? "No DMs waiting" : "Nothing here yet"}
          body={filter === "dm" ? "Every approved unlock has been sent." : undefined}
        />
      ) : (
        <ul className="admin-card divide-y divide-black/5 !p-0 dark:divide-white/10">
          {shown.map((item) => {
            const dm =
              item.purpose === "unlock" && item.status === "approved" && settings
                ? fillDmTemplate(settings.dmTemplate, item)
                : null;
            const isOpen = open === item.id;
            const waiting = needsDm(item);
            return (
              <li key={item.id} className={cn(waiting && "bg-orange/[0.07]")}>
                <button
                  type="button"
                  className="focus-ring flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3.5 text-left"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : item.id)}
                >
                  <KindDot kind={item.profile.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {item.profile.alias} · {item.profile.code}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {formatKes(item.amountKes)} · {item.mpesaCode}
                      {item.requesterHandle ? ` · ${item.requesterHandle}` : ""} ·{" "}
                      {timeAgo(item.createdAt, now)}
                    </span>
                  </span>
                  <PurposeTag purpose={item.purpose} />
                  <StatusPill status={item.status} />
                  {waiting ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange px-2.5 py-0.5 text-xs font-semibold text-[var(--ink-on-orange)]">
                      <MessageCircle size={12} /> DM to send
                    </span>
                  ) : item.dmSentAt ? (
                    <span className="text-xs text-muted">DM sent</span>
                  ) : null}
                  <ChevronDown
                    size={16}
                    className={cn("text-muted transition-transform", isOpen && "rotate-180")}
                    aria-hidden
                  />
                </button>

                {isOpen ? (
                  <div className="space-y-3 px-4 pb-4">
                    {item.rejectReason ? (
                      <p className="rounded-2xl bg-red-500/[0.06] p-3 text-sm">
                        <span className="font-medium">Reason given:</span> {item.rejectReason}
                      </p>
                    ) : null}
                    {item.purpose === "listing" && item.status === "approved" ? (
                      <p className="text-sm text-muted">Listing approved and published.</p>
                    ) : null}
                    {dm ? (
                      <>
                        <p className="text-sm">
                          Send this to <span className="font-semibold">{item.requesterHandle}</span> on
                          Instagram:
                        </p>
                        <pre className="whitespace-pre-wrap rounded-2xl border border-black/5 bg-white/70 p-3 font-sans text-sm dark:border-white/10 dark:bg-black/20">
                          {dm}
                        </pre>
                        <div className="flex flex-wrap items-center gap-2">
                          <CopyButton value={dm} label="Copy message" className="!px-3.5 !py-2 !text-sm" />
                          {!item.dmSentAt ? (
                            <button
                              type="button"
                              className="btn-primary focus-ring !min-h-9 !py-1.5 text-sm"
                              onClick={async () => {
                                await getRepo().markDmSent(item.id);
                                await load();
                              }}
                            >
                              Mark as sent
                            </button>
                          ) : (
                            <span className="text-sm text-muted">
                              Sent {timeAgo(item.dmSentAt, now)}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 space-y-2 border-t border-black/5 pt-3 dark:border-white/10">
                          <p className="text-sm">
                            Optional heads-up for <span className="font-semibold">{item.profile.alias}</span>{" "}
                            <span className="text-muted">
                              ({item.privateContact.instagram}), so the message doesn&apos;t come out of
                              nowhere:
                            </span>
                          </p>
                          <pre className="whitespace-pre-wrap rounded-2xl border border-black/5 bg-white/50 p-3 font-sans text-sm dark:border-white/10 dark:bg-black/20">
                            {headsUpMessage(item)}
                          </pre>
                          <CopyButton value={headsUpMessage(item)} label="Copy heads-up" />
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
