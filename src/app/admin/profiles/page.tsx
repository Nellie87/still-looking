"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRepo } from "@/lib/data";
import type { AdminProfile } from "@/lib/data/repo";

export default function AdminProfilesPage() {
  const [items, setItems] = useState<AdminProfile[]>([]);
  const [shown, setShown] = useState<Record<string, boolean>>({});

  async function load() {
    setItems(await getRepo().adminProfiles());
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-4 md:pb-10">
      <Link href="/admin" className="text-sm text-muted underline">
        Admin
      </Link>
      <h1 className="font-display text-3xl font-semibold text-slate">Live profiles</h1>
      <p className="text-sm text-orange">Demo only: not protected</p>

      <ul className="mt-6 space-y-3">
        {items.map((p) => (
          <li key={p.code} className="glass rounded-[22px] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-lg font-semibold">
                  {p.alias} · {p.code}
                </p>
                <p className="text-sm text-muted">{p.headline}</p>
                <p className="mt-1 text-xs uppercase text-slate">{p.status}</p>
                {shown[p.code] ? (
                  <p className="mt-2 text-sm">
                    {p.privateContact.instagram} · {p.privateContact.phone}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-ghost focus-ring text-sm"
                  onClick={() => setShown((s) => ({ ...s, [p.code]: !s[p.code] }))}
                >
                  {shown[p.code] ? "Hide contact" : "Show contact"}
                </button>
                {p.status === "live" || p.status === "paused" ? (
                  <button
                    type="button"
                    className="btn-ghost focus-ring text-sm"
                    onClick={async () => {
                      await getRepo().setProfileStatus(
                        p.code,
                        p.status === "live" ? "paused" : "live",
                      );
                      await load();
                    }}
                  >
                    {p.status === "live" ? "Pause" : "Resume"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn-ghost focus-ring text-sm"
                  onClick={async () => {
                    await getRepo().setProfileStatus(p.code, "removed");
                    await load();
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
