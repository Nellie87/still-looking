"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRepo } from "@/lib/data";
import type { AdminStats } from "@/lib/data/repo";
import { formatKes } from "@/lib/money";

export default function AdminHomePage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    void getRepo().adminStats().then(setStats);
  }, []);

  const max = Math.max(1, ...(stats?.revenueByDay.map((d) => d.total) ?? [1]));
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-4 md:pb-10">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-semibold text-slate">Admin</h1>
          <p className="text-sm text-orange">Demo only: not protected</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/queue" className="btn-ghost focus-ring">
            To review
          </Link>
          <Link href="/admin/done" className="btn-ghost focus-ring">
            Done
          </Link>
          <Link href="/admin/profiles" className="btn-ghost focus-ring">
            Live profiles
          </Link>
          <Link href="/admin/settings" className="btn-ghost focus-ring">
            Settings
          </Link>
        </nav>
      </div>

      {!stats ? (
        <p className="mt-6 text-muted">Loading…</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Revenue (14 days)", value: formatKes(stats.revenue14d) },
              { label: "To review", value: String(stats.toReview) },
              { label: "Live profiles", value: String(stats.liveProfiles) },
              { label: "Contacts unlocked", value: String(stats.contactsUnlocked) },
            ].map((c) => (
              <div key={c.label} className="glass rounded-[22px] p-4">
                <p className="text-xs text-muted">{c.label}</p>
                <p className="mt-1 font-display text-2xl font-semibold">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="glass mt-6 rounded-[22px] p-4">
            <h2 className="font-display text-lg font-semibold">Revenue · last 14 days</h2>
            <div className="mt-4 flex h-40 items-end gap-1">
              {stats.revenueByDay.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-slate/70"
                    style={{
                      height: `${Math.max(4, (d.total / max) * 100)}%`,
                      background: d.day === today ? "var(--slate)" : undefined,
                      opacity: d.day === today ? 1 : 0.55,
                    }}
                    title={`${d.day}: ${formatKes(d.total)}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
