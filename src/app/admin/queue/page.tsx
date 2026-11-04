"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Eye, EyeOff, Search, X } from "lucide-react";
import { getRepo } from "@/lib/data";
import type { QueueItem } from "@/lib/data/repo";
import { formatKes } from "@/lib/money";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/Toast";
import {
  CopyButton,
  EmptyState,
  KindDot,
  PageIntro,
  PurposeTag,
  timeAgo,
} from "@/components/admin/ui";

const REASONS = ["Payment not found", "Amount too low", "Code already used", "Wrong till number"];

type Purpose = "all" | "listing" | "unlock";

export default function AdminQueuePage() {
  const { toast } = useToast();
  const [all, setAll] = useState<QueueItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [purpose, setPurpose] = useState<Purpose>("all");
  const [q, setQ] = useState("");
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    const list = await getRepo().adminQueue({ status: "pending", q: q || undefined });
    setAll(list);
    setNow(Date.now());
    setLoaded(true);
  }, [q]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 150);
    return () => window.clearTimeout(t);
  }, [load]);

  const counts = useMemo(
    () => ({
      all: all.length,
      listing: all.filter((i) => i.purpose === "listing").length,
      unlock: all.filter((i) => i.purpose === "unlock").length,
    }),
    [all],
  );
  const items = purpose === "all" ? all : all.filter((i) => i.purpose === purpose);
  const totalKes = items.reduce((sum, i) => sum + i.amountKes, 0);

  async function approve(item: QueueItem) {
    await getRepo().approvePayment(item.id);
    toast(
      item.purpose === "listing"
        ? `${item.profile.alias}'s profile is now live`
        : `Approved. Send ${item.profile.alias}'s contact to ${item.requesterHandle ?? "the requester"} next`,
      { ms: 4000 },
    );
    await load();
  }

  async function reject(item: QueueItem, reason: string) {
    await getRepo().rejectPayment(item.id, reason);
    toast(`Rejected: ${reason}`, { ms: 3500 });
    await load();
  }

  return (
    <div className="space-y-5">
      <PageIntro
        title="Review queue"
        description="Each payment needs a quick check in your M-Pesa statement. Match the code and amount, then approve or reject."
        actions={
          items.length ? (
            <p className="rounded-full bg-orange/20 px-3 py-1.5 text-sm">
              <span className="font-semibold">{items.length}</span> waiting ·{" "}
              {formatKes(totalKes)} to confirm
            </p>
          ) : null
        }
      />

      <div className="admin-card flex flex-col gap-3 !p-3 md:flex-row md:items-center">
        <div className="flex gap-1.5 overflow-x-auto">
          {(
            [
              ["all", "All"],
              ["listing", "New listings"],
              ["unlock", "Contact unlocks"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="chip focus-ring"
              data-active={purpose === id}
              onClick={() => setPurpose(id)}
            >
              {label}
              <span className="ml-1.5 opacity-70">{counts[id]}</span>
            </button>
          ))}
        </div>
        <label className="relative flex-1">
          <span className="sr-only">Search the queue</span>
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            className="admin-input w-full !pl-10"
            placeholder="Search M-Pesa code, profile code, handle, phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>

      {!loaded ? (
        <div className="admin-card h-48 animate-pulse" />
      ) : items.length === 0 ? (
        <EmptyState
          title={q ? "No matches" : "Queue is clear"}
          body={q ? "Try a different code or handle." : "New payments will show up here as they come in."}
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <QueueCard
              key={item.id}
              item={item}
              now={now}
              onApprove={() => approve(item)}
              onReject={(r) => reject(item, r)}
            />
          ))}
        </ul>
      )}

      <p className="text-center text-sm text-muted">
        Approved contact unlocks move to{" "}
        <Link href="/admin/done?filter=dm" className="text-green underline">
          History &amp; DMs
        </Link>{" "}
        so you can send the contact.
      </p>
    </div>
  );
}

function QueueCard({
  item,
  now,
  onApprove,
  onReject,
}: {
  item: QueueItem;
  now: number;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}) {
  const [checked, setChecked] = useState({ code: false, amount: false });
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [busy, setBusy] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const ready = checked.code && checked.amount;

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li id={item.id} className="admin-card scroll-mt-28 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <PurposeTag purpose={item.purpose} />
          <span className="text-xs text-muted">{timeAgo(item.createdAt, now)}</span>
        </div>
        <p className="font-display text-xl font-semibold">{formatKes(item.amountKes)}</p>
      </div>

      <div className="flex items-center gap-3">
        <KindDot kind={item.profile.kind} />
        <div className="min-w-0">
          <p className="truncate font-medium">
            {item.profile.alias} · {item.profile.code}
          </p>
          <p className="truncate text-sm text-muted">{item.profile.headline}</p>
        </div>
      </div>

      {item.note ? (
        <blockquote className="rounded-2xl border-l-4 border-orange/60 bg-orange/[0.08] px-3 py-2 text-sm">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
            Note for {item.profile.alias}
          </span>
          &ldquo;{item.note}&rdquo;
        </blockquote>
      ) : null}

      {/* Step-by-step check */}
      <ol className="space-y-2">
        <li>
          <label className={cn("admin-check", checked.code && "is-done")}>
            <input
              type="checkbox"
              className="sr-only"
              checked={checked.code}
              onChange={(e) => setChecked((c) => ({ ...c, code: e.target.checked }))}
            />
            <span className="admin-check__box" aria-hidden>
              <Check size={14} />
            </span>
            <span className="flex-1 text-sm">
              M-Pesa code <span className="font-mono font-semibold tracking-wide">{item.mpesaCode}</span> is
              in the statement
            </span>
            <CopyButton value={item.mpesaCode} />
          </label>
        </li>
        <li>
          <label className={cn("admin-check", checked.amount && "is-done")}>
            <input
              type="checkbox"
              className="sr-only"
              checked={checked.amount}
              onChange={(e) => setChecked((c) => ({ ...c, amount: e.target.checked }))}
            />
            <span className="admin-check__box" aria-hidden>
              <Check size={14} />
            </span>
            <span className="flex-1 text-sm">
              Amount is <span className="font-semibold">{formatKes(item.amountKes)}</span> from{" "}
              {item.payerPhoneMasked}
            </span>
          </label>
        </li>
      </ol>

      <div className="rounded-2xl bg-black/[0.03] p-3 text-sm dark:bg-white/5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {item.purpose === "unlock" ? `Requested by ${item.requesterHandle ?? "unknown"}` : "Private contact"}
          </p>
          <button
            type="button"
            className="focus-ring inline-flex items-center gap-1 rounded-full text-xs text-muted hover:text-fg"
            onClick={() => setShowContact((s) => !s)}
            aria-expanded={showContact}
          >
            {showContact ? <EyeOff size={14} /> : <Eye size={14} />}
            {showContact ? "Hide contact" : "Show contact"}
          </button>
        </div>
        {showContact ? (
          <p className="mt-1.5">
            {item.privateContact.instagram} · {item.privateContact.phone}
          </p>
        ) : null}
      </div>

      {rejecting ? (
        <div className="space-y-3 rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-3">
          <p className="text-sm font-medium">Why reject? The requester sees this reason.</p>
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                className="chip focus-ring !min-h-8 !text-xs"
                data-active={reason === r}
                onClick={() => setReason(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <input
            className="admin-input w-full"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-label="Reject reason"
          />
          <div className="flex gap-2">
            <button type="button" className="btn-ghost focus-ring" onClick={() => setRejecting(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary focus-ring !bg-none !bg-red-700"
              disabled={busy || !reason.trim()}
              onClick={() => run(() => onReject(reason.trim()))}
            >
              <X size={16} /> Reject payment
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-primary focus-ring flex-1"
            disabled={busy}
            onClick={() => run(onApprove)}
            title={ready ? undefined : "Tick both checks first, or approve anyway"}
          >
            <Check size={16} /> Payment received, approve
          </button>
          <button type="button" className="btn-ghost focus-ring" onClick={() => setRejecting(true)}>
            Reject…
          </button>
          {!ready ? (
            <p className="w-full text-xs text-muted">Tip: tick both checks as you confirm them.</p>
          ) : null}
        </div>
      )}
    </li>
  );
}
