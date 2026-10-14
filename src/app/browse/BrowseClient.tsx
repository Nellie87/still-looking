"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterBar, type BrowseFilters } from "@/components/browse/FilterBar";
import { ProfileTile } from "@/components/browse/ProfileTile";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { AGE_BANDS, type AgeBand } from "@/lib/age";
import { getRepo } from "@/lib/data";
import type { Contact, PublicProfile, Settings } from "@/lib/data/repo";
import { getHiddenCodes, hideCode, unhideCode } from "@/lib/hidden";

const Reader = dynamic(() => import("@/components/reader/Reader").then((m) => m.Reader), {
  ssr: false,
});
const UnlockFlow = dynamic(
  () => import("@/components/flows/UnlockFlow").then((m) => m.UnlockFlow),
  { ssr: false },
);
const WindingPath = dynamic(
  () => import("@/components/browse/WindingPath").then((m) => m.WindingPath),
  { ssr: false },
);

function parseFilters(sp: URLSearchParams): BrowseFilters {
  const kind = sp.get("kind");
  const band = sp.get("band");
  return {
    kind: kind === "love" || kind === "friend" ? kind : "all",
    band: AGE_BANDS.some((b) => b.id === band) ? (band as AgeBand) : "any",
    q: sp.get("q") ?? "",
    myAge: sp.get("myAge") ?? "",
  };
}

export default function BrowseClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [filters, setFilters] = useState<BrowseFilters>(() => parseFilters(sp));
  const [items, setItems] = useState<PublicProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [hidden, setHidden] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [filterSheet, setFilterSheet] = useState(false);
  const [selected, setSelected] = useState<PublicProfile | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [unlockStatus, setUnlockStatus] = useState<{
    status: "none" | "pending" | "approved" | "rejected";
    rejectReason?: string;
  }>({ status: "none" });
  const [unlockedCodes, setUnlockedCodes] = useState<Set<string>>(new Set());

  const syncUrl = useCallback(
    (f: BrowseFilters) => {
      const params = new URLSearchParams();
      if (f.kind !== "all") params.set("kind", f.kind);
      if (f.band !== "any") params.set("band", f.band);
      if (f.q) params.set("q", f.q);
      if (f.myAge) params.set("myAge", f.myAge);
      const qs = params.toString();
      router.replace(qs ? `/browse?${qs}` : "/browse", { scroll: false });
    },
    [router],
  );

  const load = useCallback(async (f: BrowseFilters, includeHidden: boolean) => {
    const repo = getRepo();
    const res = await repo.searchProfiles({
      q: f.q || undefined,
      kind: f.kind,
      band: f.band === "any" ? undefined : f.band,
      myAge: f.myAge ? Number(f.myAge) : undefined,
      includeHidden,
    });
    const hiddenSet = new Set(getHiddenCodes());
    const filtered = includeHidden
      ? res.items
      : res.items.filter((p) => !hiddenSet.has(p.code));
    setItems(filtered);
    setTotal(filtered.length);
    setHidden(getHiddenCodes());
    const activity = await repo.getMyActivity();
    setUnlockedCodes(
      new Set(activity.unlocks.filter((u) => u.status === "approved").map((u) => u.code)),
    );
    setSettings(await repo.getSettings());
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load(filters, showHidden);
      syncUrl(filters);
    }, 160);
    return () => window.clearTimeout(t);
  }, [filters, showHidden, load, syncUrl]);

  useEffect(() => {
    const open = sp.get("open");
    if (open) void openProfile(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openProfile(code: string) {
    const repo = getRepo();
    const p = await repo.getProfile(code);
    if (!p) return;
    setSelected(p);
    setContact(await repo.getMyContact(code));
    setUnlockStatus(await repo.getUnlockStatus(code));
  }

  function onHide(code: string) {
    hideCode(code);
    setHidden(getHiddenCodes());
    setItems((prev) => prev.filter((p) => p.code !== code));
    setSelected(null);
    toast("Hidden", {
      actionLabel: "Undo",
      onAction: () => {
        unhideCode(code);
        setHidden(getHiddenCodes());
        void load(filters, showHidden);
      },
      ms: 6000,
    });
  }

  const usePath = filters.kind === "love" || filters.kind === "friend";

  const ageChips = useMemo(() => AGE_BANDS, []);

  return (
    <div className="mx-auto max-w-[1240px] px-3 pb-28 md:px-5 md:pb-10">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        resultCount={total}
        hiddenCount={hidden.length}
        showHidden={showHidden}
        onToggleHidden={() => setShowHidden((s) => !s)}
        onOpenSheet={() => setFilterSheet(true)}
      />

      <div className="mt-4">
        {items.length === 0 ? (
          <div className="glass rounded-[22px] p-8 text-center">
            <p className="font-display text-xl">No profiles match</p>
            <p className="mt-2 text-muted">Clear filters or try different words.</p>
          </div>
        ) : usePath ? (
          <WindingPath
            items={items}
            unlocked={unlockedCodes}
            onOpen={(code) => void openProfile(code)}
          />
        ) : (
          <div className="columns-1 gap-4 min-[700px]:columns-2 min-[900px]:columns-3">
            {items.map((p) => (
              <div key={p.code} className="mb-4 break-inside-avoid">
                <ProfileTile
                  profile={p}
                  unlocked={unlockedCodes.has(p.code)}
                  onOpen={() => void openProfile(p.code)}
                  onHide={() => onHide(p.code)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <Reader
        open={!!selected}
        profile={selected}
        unlockFee={settings?.unlockFee ?? 500}
        unlockStatus={unlockStatus}
        contact={contact}
        onClose={() => setSelected(null)}
        onHide={() => selected && onHide(selected.code)}
        onInterested={() => setUnlockOpen(true)}
      />

      <UnlockFlow
        open={unlockOpen}
        profile={selected}
        settings={settings}
        onClose={() => setUnlockOpen(false)}
        onDone={() => {
          if (selected) void openProfile(selected.code);
          void load(filters, showHidden);
        }}
      />

      <Sheet open={filterSheet} onClose={() => setFilterSheet(false)} title="Filters">
        <div className="space-y-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {ageChips.map((b) => (
              <button
                key={b.id}
                type="button"
                className="chip focus-ring"
                data-active={filters.band === b.id}
                onClick={() => setFilters({ ...filters, band: b.id })}
              >
                {b.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            Fits my age
            <input
              type="number"
              min={18}
              max={99}
              className="focus-ring w-20 rounded-full border border-white/30 bg-white/40 px-3 py-2 text-base"
              value={filters.myAge}
              onChange={(e) => setFilters({ ...filters, myAge: e.target.value })}
            />
          </label>
          <button
            type="button"
            className="btn-primary focus-ring w-full"
            onClick={() => setFilterSheet(false)}
          >
            Show {total} profiles
          </button>
        </div>
      </Sheet>
    </div>
  );
}
