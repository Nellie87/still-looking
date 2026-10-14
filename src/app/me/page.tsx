"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRepo } from "@/lib/data";
import type { MyActivity } from "@/lib/data/repo";
import { kindLabel } from "@/lib/search";

function statusLabel(status: string) {
  if (status === "pending" || status === "pending_review") return "Waiting for the team";
  if (status === "approved" || status === "live") return status === "live" ? "Live" : "Unlocked";
  if (status === "rejected") return "Not approved";
  return status;
}

export default function MePage() {
  const [activity, setActivity] = useState<MyActivity | null>(null);

  useEffect(() => {
    void getRepo()
      .getMyActivity()
      .then(setActivity);
  }, []);

  if (!activity) {
    return <p className="p-6 text-muted">Loading your activity…</p>;
  }

  const all = [...activity.unlocks, ...activity.listings];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-4 md:pb-10">
      <h1 className="font-display text-3xl font-semibold">My activity</h1>
      <p className="mt-1 text-muted">Requests and listings on this device (Phase A).</p>

      {all.length === 0 ? (
        <div className="glass mt-6 rounded-[22px] p-6">
          <p>Nothing here yet.</p>
          <Link href="/browse" className="btn-primary mt-4 inline-flex focus-ring">
            Browse profiles
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {all.map((item) => (
            <li key={item.id} className="glass rounded-[22px] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">
                    {item.purpose === "unlock" ? "Contact request" : "Listing"} · {kindLabel(item.kind)}
                  </p>
                  <p className="font-display text-lg font-semibold">
                    {item.alias} · {item.code}
                  </p>
                  <p className="text-sm text-muted">{item.headline}</p>
                  <p className="mt-2 text-sm font-medium">{statusLabel(String(item.status))}</p>
                  {item.rejectReason ? (
                    <p className="mt-1 text-sm text-orange">{item.rejectReason}</p>
                  ) : null}
                </div>
                <Link href={`/profile/${item.code}`} className="btn-ghost focus-ring text-sm">
                  Open profile
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
