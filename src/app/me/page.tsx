"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRepo } from "@/lib/data";
import type { ActivityItem, MyActivity } from "@/lib/data/repo";
import { kindLabel } from "@/lib/search";
import { Tracker } from "@/components/flows/fields";
import { cn } from "@/lib/cn";

/** Where each request is: 0 sent · 1 team checking · 2 done. -1 means rejected. */
function progress(item: ActivityItem): number {
  const s = String(item.status);
  if (s === "rejected") return -1;
  if (s === "pending" || s === "pending_review") return 1;
  return 3;
}

function steps(item: ActivityItem) {
  return item.purpose === "unlock"
    ? [
        { title: "Payment details sent" },
        { title: "Team checks the payment" },
        { title: "Contact unlocked", body: "Sent to your Instagram and shown on their profile." },
      ]
    : [
        { title: "Listing and payment sent" },
        { title: "Team reviews your profile" },
        { title: "Your profile is live", body: "People can now find you on Browse." },
      ];
}

export default function MePage() {
  const [activity, setActivity] = useState<MyActivity | null>(null);

  useEffect(() => {
    const load = () => void getRepo().getMyActivity().then(setActivity);
    load();
    const id = window.setInterval(load, 4000);
    return () => window.clearInterval(id);
  }, []);

  if (!activity) {
    return <p className="p-6 text-muted">Loading your activity…</p>;
  }

  const all = [...activity.unlocks, ...activity.listings];

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-4 md:pb-10">
      <h1 className="font-display text-3xl font-semibold">My activity</h1>
      <p className="mt-1 text-muted">Your contact requests and listings on this device.</p>

      {all.length === 0 ? (
        <div className="glass mt-6 rounded-[22px] p-6">
          <p className="font-medium">Nothing here yet.</p>
          <p className="mt-1 text-sm text-muted">
            When you connect with someone or list yourself, you can follow it here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/browse" className="btn-primary focus-ring">
              Browse profiles
            </Link>
            <Link href="/list" className="btn-ghost focus-ring">
              List yourself
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {all.map((item) => {
            const p = progress(item);
            const unlocked = item.purpose === "unlock" && p === 3;
            return (
              <li key={item.id} className="admin-card space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted">
                      {item.purpose === "unlock" ? "Contact request" : "Your listing"} ·{" "}
                      {kindLabel(item.kind)}
                    </p>
                    <p className="font-display text-lg font-semibold">
                      {item.alias} · {item.code}
                    </p>
                    <p className="truncate text-sm text-muted">{item.headline}</p>
                  </div>
                  <Link
                    href={item.purpose === "unlock" ? `/browse?open=${item.code}` : `/profile/${item.code}`}
                    className={cn("focus-ring text-sm", unlocked ? "btn-primary" : "btn-ghost")}
                  >
                    {unlocked ? "See contact" : "Open profile"}
                  </Link>
                </div>

                {p === -1 ? (
                  <div className="rounded-2xl bg-orange/15 p-3 text-sm">
                    <p className="font-medium">Not approved</p>
                    <p className="mt-0.5 text-muted">
                      {item.rejectReason ?? "Payment not found"}.{" "}
                      {item.purpose === "unlock" ? "Open the profile to try again." : "List again with the right payment."}
                    </p>
                  </div>
                ) : (
                  <Tracker items={steps(item)} current={p} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
