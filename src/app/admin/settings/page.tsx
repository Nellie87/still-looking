"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRepo } from "@/lib/data";
import type { Settings } from "@/lib/data/repo";

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void getRepo().getSettings().then(setForm);
  }, []);

  if (!form) return <p className="p-6 text-muted">Loading…</p>;

  return (
    <div className="mx-auto max-w-xl px-4 pb-28 pt-4 md:pb-10">
      <Link href="/admin" className="text-sm text-muted underline">
        Admin
      </Link>
      <h1 className="font-display text-3xl font-semibold text-slate">Settings</h1>
      <p className="text-sm text-orange">Sample prices and till until owners set real values.</p>

      <div className="mt-6 space-y-3">
        {(
          [
            ["listingFee", "Listing fee (KES)", "number"],
            ["unlockFee", "Unlock fee (KES)", "number"],
            ["tillNumber", "M-Pesa till (sample)", "text"],
            ["responseTimeText", "Response time promise", "text"],
          ] as const
        ).map(([key, label, type]) => (
          <label key={key} className="block space-y-1 text-sm">
            {label}
            <input
              type={type}
              className="focus-ring w-full rounded-[16px] border border-white/30 bg-white/40 px-3 py-3 text-base dark:bg-black/20"
              value={form[key]}
              onChange={(e) =>
                setForm({
                  ...form,
                  [key]: type === "number" ? Number(e.target.value) : e.target.value,
                })
              }
            />
          </label>
        ))}
        <label className="block space-y-1 text-sm">
          DM template
          <textarea
            className="focus-ring min-h-36 w-full rounded-[16px] border border-white/30 bg-white/40 px-3 py-3 text-base dark:bg-black/20"
            value={form.dmTemplate}
            onChange={(e) => setForm({ ...form, dmTemplate: e.target.value })}
          />
        </label>
        <button
          type="button"
          className="btn-primary focus-ring"
          onClick={async () => {
            await getRepo().updateSettings(form);
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2000);
          }}
        >
          Save settings
        </button>
        {saved ? <p className="text-sm text-green">Saved</p> : null}
      </div>
    </div>
  );
}
