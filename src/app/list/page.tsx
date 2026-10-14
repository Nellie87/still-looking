"use client";

import { useEffect, useState } from "react";
import { ListingFlow } from "@/components/flows/ListingFlow";
import { getRepo } from "@/lib/data";
import type { Settings } from "@/lib/data/repo";

export default function ListPage() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    void getRepo().getSettings().then(setSettings);
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-4 md:pb-10">
      <h1 className="font-display text-3xl font-semibold">List yourself</h1>
      <p className="mt-1 text-muted">
        Stay anonymous on the board. Contact stays private until someone pays to unlock.
      </p>
      <div className="mt-6">
        <ListingFlow settings={settings} />
      </div>
    </div>
  );
}
