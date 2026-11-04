"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterBar, type BrowseFilters } from "@/components/browse/FilterBar";
import { TrailPager } from "@/components/browse/TrailPager";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { AGE_BANDS, type AgeBand } from "@/lib/age";
import { getRepo } from "@/lib/data";
import type { Contact, PublicProfile, Settings } from "@/lib/data/repo";
import { getHiddenCodes, hideCode, unhideCode } from "@/lib/hidden";
import { clearSeen, getHideSeenPref, getSeenCodes, markSeen, setHideSeenPref } from "@/lib/seen";

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

const PAGE_SIZE = 5;

function parsePage(sp: URLSearchParams): number {
  const n = Number(sp.get("page"));
  return Number.isInteger(n) && n > 1 ? n : 1;
}

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
  const [filters, setFiltersState] = useState<BrowseFilters>(() => parseFilters(sp));
  const [page, setPage] = useState(() => parsePage(sp));
  const trailTop = useRef<HTMLDivElement>(null);
  /* Any filter change starts the trail again from the first stretch */
  const setFilters = useCallback((f: BrowseFilters) => {
    setFiltersState(f);
    setPage(1);
  }, []);
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
  /* "Seen" = opened before. With hideSeen on, the trail skips profiles seen
     before the current reading session (snapshot), so swiping doesn't make
     the profile you're reading vanish mid-way. */
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [seenSnapshot, setSeenSnapshot] = useState<Set<string>>(new Set());
  const [hideSeen, setHideSeen] = useState(false);
  const [navDir, setNavDir] = useState<0 | 1 | -1>(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const s0 = new Set(getSeenCodes());
      setSeen(s0);
      setSeenSnapshot(s0);
      setHideSeen(getHideSeenPref());
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const syncUrl = useCallback(
    (f: BrowseFilters, pg: number) => {
      const params = new URLSearchParams();
      if (f.kind !== "all") params.set("kind", f.kind);
      if (f.band !== "any") params.set("band", f.band);
      if (f.q) params.set("q", f.q);
      if (f.myAge) params.set("myAge", f.myAge);
      if (pg > 1) params.set("page", String(pg));
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
    }, 160);
    return () => window.clearTimeout(t);
  }, [filters, showHidden, load]);

  useEffect(() => {
    syncUrl(filters, page);
  }, [filters, page, syncUrl]);

  useEffect(() => {
    const open = sp.get("open");
    if (open) void openProfile(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openProfile(code: string, dir: 0 | 1 | -1 = 0) {
    const repo = getRepo();
    const p = await repo.getProfile(code);
    if (!p) return;
    markSeen(code);
    setSeen((prev) => (prev.has(code) ? prev : new Set(prev).add(code)));
    setNavDir(dir);
    setSelected(p);
    setContact(await repo.getMyContact(code));
    setUnlockStatus(await repo.getUnlockStatus(code));
  }

  function closeReader() {
    setSelected(null);
    /* Profiles read in this session now count as seen for "Hide seen" */
    setSeenSnapshot(new Set(getSeenCodes()));
  }

  function onHide(code: string) {
    /* "Not for me": drop them and move straight on to the next person */
    const idx = visibleItems.findIndex((p) => p.code === code);
    const next = visibleItems[idx + 1] ?? visibleItems[idx - 1];
    hideCode(code);
    setHidden(getHiddenCodes());
    setItems((prev) => prev.filter((p) => p.code !== code));
    if (selected?.code === code && next) void openProfile(next.code, 1);
    else closeReader();
    toast("Hidden from your trail", {
      actionLabel: "Undo",
      onAction: () => {
        unhideCode(code);
        setHidden(getHiddenCodes());
        void load(filters, showHidden);
      },
      ms: 6000,
    });
  }

  const ageChips = useMemo(() => AGE_BANDS, []);

  const visibleItems = useMemo(
    () => (hideSeen ? items.filter((p) => !seenSnapshot.has(p.code)) : items),
    [items, hideSeen, seenSnapshot],
  );
  const seenInList = useMemo(() => items.filter((p) => seen.has(p.code)).length, [items, seen]);

  const pageCount = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const startIndex = (current - 1) * PAGE_SIZE;
  const pageItems = useMemo(
    () => visibleItems.slice(startIndex, startIndex + PAGE_SIZE),
    [visibleItems, startIndex],
  );

  const navIndex = selected ? visibleItems.findIndex((p) => p.code === selected.code) : -1;
  function step(delta: 1 | -1) {
    const target = visibleItems[navIndex + delta];
    if (!target) return;
    setPage(Math.floor((navIndex + delta) / PAGE_SIZE) + 1);
    void openProfile(target.code, delta);
  }

  function toggleHideSeen() {
    const on = !hideSeen;
    setHideSeen(on);
    setHideSeenPref(on);
    setSeenSnapshot(new Set(getSeenCodes()));
    setPage(1);
  }

  function goToPage(n: number) {
    const next = Math.min(Math.max(1, n), pageCount);
    setPage(next);
    const top = trailTop.current;
    if (top) {
      const y = top.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  }

  return (
    <div className="mx-auto max-w-[1240px] px-3 pb-28 md:px-5 md:pb-10 md:pt-2">
      <FilterBar
        filters={filters}
        onChange={setFilters}
        resultCount={total}
        hiddenCount={hidden.length}
        showHidden={showHidden}
        onToggleHidden={() => setShowHidden((s) => !s)}
        seenCount={seenInList}
        hideSeen={hideSeen}
        onToggleHideSeen={toggleHideSeen}
        onClearSeen={() => {
          clearSeen();
          setSeen(new Set());
          setSeenSnapshot(new Set());
        }}
        onOpenSheet={() => setFilterSheet(true)}
      />

      <div ref={trailTop} className="mt-6 min-[700px]:mt-4">
        {visibleItems.length === 0 ? (
          <div className="glass rounded-[22px] p-8 text-center">
            {hideSeen && items.length > 0 ? (
              <>
                <p className="font-display text-xl">You&apos;ve seen everyone here</p>
                <p className="mt-2 text-muted">New people show up as they list.</p>
                <button type="button" className="btn-ghost focus-ring mt-4" onClick={toggleHideSeen}>
                  Show the ones I&apos;ve seen
                </button>
              </>
            ) : (
              <>
                <p className="font-display text-xl">No profiles match</p>
                <p className="mt-2 text-muted">Clear filters or try different words.</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-muted">
              <p>
                <span className="font-display text-base font-semibold text-fg">
                  Stretch {current}
                </span>{" "}
                of {pageCount} · {visibleItems.length}{" "}
                {visibleItems.length === 1 ? "person" : "people"} on this trail
              </p>
              <p className="flex items-center gap-3" aria-hidden>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-green" /> Love
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange" /> Friendship
                </span>
              </p>
            </div>
            <WindingPath
              key={`${current}-${filters.kind}`}
              items={pageItems}
              seen={seen}
              startIndex={startIndex}
              unlocked={unlockedCodes}
              onOpen={(code) => void openProfile(code)}
              end={
                <TrailPager
                  page={current}
                  pageCount={pageCount}
                  from={startIndex + 1}
                  to={startIndex + pageItems.length}
                  total={visibleItems.length}
                  onPage={goToPage}
                />
              }
            />
          </>
        )}
      </div>

      <Reader
        open={!!selected}
        profile={selected}
        unlockFee={settings?.unlockFee ?? 500}
        unlockStatus={unlockStatus}
        contact={contact}
        onClose={closeReader}
        position={navIndex >= 0 ? { index: navIndex, total: visibleItems.length } : null}
        onPrev={navIndex > 0 ? () => step(-1) : undefined}
        onNext={navIndex >= 0 && navIndex < visibleItems.length - 1 ? () => step(1) : undefined}
        direction={navDir}
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
