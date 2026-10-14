"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getRepo } from "@/lib/data";
import type { QueueItem } from "@/lib/data/repo";
import { formatKes } from "@/lib/money";
import { cn } from "@/lib/cn";

export default function AdminQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [purpose, setPurpose] = useState<"all" | "listing" | "unlock">("all");
  const [q, setQ] = useState("");
  const [reason, setReason] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const list = await getRepo().adminQueue({ status: "pending", purpose, q: q || undefined });
    setItems(list);
  }, [purpose, q]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 150);
    return () => window.clearTimeout(t);
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-4 md:pb-10">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Link href="/admin" className="text-sm text-muted underline">
            Admin
          </Link>
          <h1 className="font-display text-3xl font-semibold text-slate">To review</h1>
          <p className="text-sm text-orange">Demo only: not protected</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", "listing", "unlock"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className="chip focus-ring capitalize"
            data-active={purpose === p}
            onClick={() => setPurpose(p)}
          >
            {p === "all" ? "All" : p === "listing" ? "Listings" : "Contact requests"}
          </button>
        ))}
      </div>
      <input
        className="focus-ring mt-3 w-full rounded-full border border-white/30 bg-white/40 px-4 py-3 text-base dark:bg-black/20"
        placeholder="Search code, M-Pesa, handle, phone…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li key={item.id} className="glass rounded-[22px] p-4 space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span
                className={cn(
                  "rounded-full px-2 py-1",
                  item.purpose === "listing" ? "bg-orange/30" : "bg-green/20",
                )}
              >
                {item.purpose === "listing" ? "Listing payment" : "Contact unlock"}
              </span>
              <span className="rounded-full bg-slate/20 px-2 py-1">{item.status}</span>
            </div>
            <p className="font-display text-lg font-semibold">
              {formatKes(item.amountKes)} · {item.mpesaCode}
            </p>
            <p className="text-sm text-muted">
              Payer {item.payerPhoneMasked} · {new Date(item.createdAt).toLocaleString()}
              {item.requesterHandle ? ` · ${item.requesterHandle}` : null}
            </p>
            <p className="text-sm">
              {item.profile.alias} · {item.profile.code} — {item.profile.headline}
            </p>
            <div className="rounded-[16px] bg-slate/10 p-3 text-sm">
              <p className="font-semibold text-slate">Admin only</p>
              <p>
                {item.privateContact.instagram} · {item.privateContact.phone}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary focus-ring"
                onClick={async () => {
                  await getRepo().approvePayment(item.id);
                  await load();
                }}
              >
                Payment received, approve
              </button>
              <div className="flex flex-1 flex-wrap gap-2">
                <input
                  className="focus-ring min-w-[160px] flex-1 rounded-full border border-white/30 bg-white/40 px-3 py-2 text-sm"
                  placeholder="Reject reason"
                  value={reason[item.id] ?? ""}
                  onChange={(e) => setReason((r) => ({ ...r, [item.id]: e.target.value }))}
                />
                <button
                  type="button"
                  className="btn-ghost focus-ring"
                  onClick={async () => {
                    await getRepo().rejectPayment(
                      item.id,
                      reason[item.id] || "Payment not found",
                    );
                    await load();
                  }}
                >
                  Payment not found
                </button>
              </div>
            </div>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="glass rounded-[22px] p-6 text-muted">Queue is clear.</li>
        ) : null}
      </ul>
    </div>
  );
}
