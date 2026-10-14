"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRepo } from "@/lib/data";
import type { QueueItem, Settings } from "@/lib/data/repo";
import { formatKes } from "@/lib/money";

function fillTemplate(tpl: string, item: QueueItem) {
  return tpl
    .replaceAll("{handle}", item.requesterHandle ?? "@friend")
    .replaceAll("{code}", item.profile.code)
    .replaceAll("{alias}", item.profile.alias)
    .replaceAll("{instagram}", item.privateContact.instagram)
    .replaceAll("{phone}", item.privateContact.phone);
}

export default function AdminDonePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  async function load() {
    const repo = getRepo();
    setSettings(await repo.getSettings());
    const all = await repo.adminQueue({ status: "all" });
    setItems(all.filter((i) => i.status !== "pending"));
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-4 md:pb-10">
      <Link href="/admin" className="text-sm text-muted underline">
        Admin
      </Link>
      <h1 className="font-display text-3xl font-semibold text-slate">Done</h1>
      <p className="text-sm text-orange">Demo only: not protected</p>

      <ul className="mt-6 space-y-4">
        {items.map((item) => {
          const dm =
            item.purpose === "unlock" && item.status === "approved" && settings
              ? fillTemplate(settings.dmTemplate, item)
              : null;
          return (
            <li key={item.id} className="glass space-y-3 rounded-[22px] p-4">
              <p className="text-xs uppercase text-muted">
                {item.purpose} · {item.status}
              </p>
              <p className="font-display text-lg font-semibold">
                {item.profile.alias} · {item.profile.code} · {formatKes(item.amountKes)}
              </p>
              {item.rejectReason ? (
                <p className="text-sm text-orange">{item.rejectReason}</p>
              ) : null}
              {dm ? (
                <div className="space-y-2">
                  <textarea
                    readOnly
                    className="w-full rounded-[16px] border border-white/30 bg-white/40 p-3 text-sm dark:bg-black/20"
                    rows={4}
                    value={dm}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-ghost focus-ring text-sm"
                      onClick={() => void navigator.clipboard.writeText(dm)}
                    >
                      Copy message
                    </button>
                    {!item.dmSentAt ? (
                      <button
                        type="button"
                        className="btn-primary focus-ring text-sm"
                        onClick={async () => {
                          await getRepo().markDmSent(item.id);
                          await load();
                        }}
                      >
                        Mark as sent
                      </button>
                    ) : (
                      <span className="text-sm text-muted">DM marked sent</span>
                    )}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
