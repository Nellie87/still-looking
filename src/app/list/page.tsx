"use client";

import { useEffect, useState } from "react";
import { EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { ListingFlow } from "@/components/flows/ListingFlow";
import { getRepo } from "@/lib/data";
import type { Settings } from "@/lib/data/repo";
import { formatKes } from "@/lib/money";

export default function ListPage() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    void getRepo().getSettings().then(setSettings);
  }, []);

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-6 px-4 pb-10 pt-4 md:grid-cols-[minmax(0,1fr)_17rem] md:gap-8 md:pt-6">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">List yourself</h1>
        <p className="mt-1 text-muted">
          About 5 minutes. You stay anonymous on the board
          {settings ? ` · one-off ${formatKes(settings.listingFee)}` : ""}.
        </p>
        <div className="mt-5">
          <ListingFlow settings={settings} />
        </div>
      </div>

      {/* Reassurance: sidebar on desktop, compact strip on mobile (shown above the form) */}
      <aside className="order-first min-w-0 md:order-none">
        <ul className="list-why">
          {[
            { icon: EyeOff, title: "Anonymous", body: "An alias, your age and area. No photos, no real name." },
            { icon: ShieldCheck, title: "Contact stays private", body: "Shared only after someone pays and the team checks it." },
            { icon: Sparkles, title: "Reviewed by people", body: "Every profile is read before it goes live." },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <span className="list-why__icon" aria-hidden>
                <Icon size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="list-why__body text-xs text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
