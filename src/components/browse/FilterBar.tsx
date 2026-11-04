"use client";

import { Eye, EyeOff, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AGE_BANDS, type AgeBand } from "@/lib/age";
import { cn } from "@/lib/cn";
import type { Kind } from "@/lib/data/repo";

export type BrowseFilters = {
  kind: Kind | "all";
  band: AgeBand;
  q: string;
  myAge: string;
};

export function FilterBar({
  filters,
  onChange,
  resultCount,
  hiddenCount,
  showHidden,
  onToggleHidden,
  onOpenSheet,
  seenCount = 0,
  hideSeen = false,
  onToggleHideSeen,
  onClearSeen,
}: {
  filters: BrowseFilters;
  onChange: (f: BrowseFilters) => void;
  resultCount: number;
  hiddenCount: number;
  showHidden: boolean;
  onToggleHidden: () => void;
  onOpenSheet: () => void;
  seenCount?: number;
  hideSeen?: boolean;
  onToggleHideSeen?: () => void;
  onClearSeen?: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(!!filters.q);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearchOpen(true);
        queueMicrotask(() => inputRef.current?.focus());
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const kinds: { id: Kind | "all"; label: string }[] = [
    { id: "all", label: "Everyone" },
    { id: "love", label: "Love" },
    { id: "friend", label: "Friendship" },
  ];

  const active =
    filters.kind !== "all" || filters.band !== "any" || !!filters.q || !!filters.myAge;

  const bandLabel = (id: AgeBand, label: string) =>
    id === "any" ? "Any age" : id === "41+" ? "41 and over" : label;

  const status = (
    <>
      <span className="text-muted">{resultCount} profiles</span>
      {seenCount > 0 || hideSeen ? (
        <button
          type="button"
          className={cn(
            "focus-ring inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            hideSeen
              ? "border-transparent bg-green text-[var(--ink-on-green)]"
              : "border-black/10 bg-white/60 dark:border-white/15 dark:bg-white/10",
          )}
          aria-pressed={hideSeen}
          onClick={onToggleHideSeen}
        >
          {hideSeen ? <EyeOff size={13} /> : <Eye size={13} />}
          {hideSeen ? `Hiding ${seenCount} seen` : `Hide seen (${seenCount})`}
        </button>
      ) : null}
      {hideSeen && seenCount > 0 ? (
        <button type="button" className="text-xs text-muted underline focus-ring rounded" onClick={onClearSeen}>
          Reset seen
        </button>
      ) : null}
      {hiddenCount > 0 ? (
        <button type="button" className="text-green underline focus-ring rounded" onClick={onToggleHidden}>
          {showHidden ? "Hide hidden again" : `Show hidden (${hiddenCount})`}
        </button>
      ) : null}
      {active ? (
        <button
          type="button"
          className="text-fg/80 underline underline-offset-4 focus-ring rounded"
          onClick={() => onChange({ kind: "all", band: "any", q: "", myAge: "" })}
        >
          Clear filters
        </button>
      ) : null}
    </>
  );

  const tools = (
    <>
        <button
          type="button"
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 md:hidden"
          aria-label="Filters"
          onClick={onOpenSheet}
        >
          <SlidersHorizontal size={18} />
        </button>
        <button
          type="button"
          className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/70 shadow-sm dark:bg-white/10"
          aria-label="Search"
          aria-expanded={searchOpen}
          onClick={() => {
            setSearchOpen((o) => !o);
            queueMicrotask(() => inputRef.current?.focus());
          }}
        >
          <Search size={18} />
        </button>
    </>
  );

  return (
    <div className="filterbar glass relative z-20 space-y-3 rounded-[30px] px-3 py-3 md:px-4">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex min-w-0 flex-1 overflow-x-auto rounded-full [scrollbar-width:none] bg-white/35 p-1 md:flex-none dark:bg-white/10">
          {kinds.map((k) => {
            const on = filters.kind === k.id;
            return (
              <button
                key={k.id}
                type="button"
                className={cn(
                  "focus-ring inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm md:gap-2 md:px-4 md:text-[0.95rem] font-medium whitespace-nowrap md:flex-none",
                  on &&
                    (k.id === "friend"
                      ? "bg-orange text-[var(--ink-on-orange)] shadow-[0_6px_16px_rgba(245,164,96,0.45)]"
                      : "bg-green text-[var(--ink-on-green)] shadow-[0_6px_16px_rgba(28,74,57,0.3)]"),
                )}
                aria-pressed={on}
                onClick={() => onChange({ ...filters, kind: k.id })}
              >
                {k.id !== "all" ? (
                  <span
                    aria-hidden
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      k.id === "love" ? "bg-green" : "bg-orange",
                      on && "ring-2 ring-white/70",
                    )}
                  />
                ) : null}
                {k.label}
              </button>
            );
          })}
        </div>
        <p className="hidden min-w-0 flex-1 self-start pt-0.5 text-[0.82rem] text-muted lg:block">
          <span className="font-semibold text-fg">Concept preview.</span> Every profile is invented
          sample data. No sign-in or database yet.
        </p>
        <div className="ml-auto hidden shrink-0 md:flex">{tools}</div>
      </div>

      {searchOpen ? (
        <div className="relative">
          <input
            ref={inputRef}
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onChange({ ...filters, q: "" });
                setSearchOpen(false);
              }
            }}
            placeholder="Search alias, story, tags, code…"
            className="focus-ring w-full rounded-full border border-white/30 bg-white/40 px-4 py-3 text-base outline-none dark:bg-black/20"
            inputMode="search"
            autoComplete="off"
          />
          {filters.q ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2"
              aria-label="Clear search"
              onClick={() => onChange({ ...filters, q: "" })}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="hidden items-center gap-2 overflow-x-auto md:flex" aria-label="Age filters">
        {AGE_BANDS.map((b) => (
          <button
            key={b.id}
            type="button"
            className="chip focus-ring"
            data-active={filters.band === b.id}
            onClick={() => onChange({ ...filters, band: b.id })}
          >
            {bandLabel(b.id, b.label)}
          </button>
        ))}
        <label className="ml-2 flex items-center gap-2 whitespace-nowrap text-sm text-muted">
          Fits my age
          <input
            type="number"
            min={18}
            max={99}
            inputMode="numeric"
            value={filters.myAge}
            onChange={(e) => onChange({ ...filters, myAge: e.target.value })}
            className="focus-ring w-[5.25rem] rounded-xl border border-white/40 bg-white/60 px-3 py-2 text-sm text-fg dark:bg-black/20"
            placeholder="e.g. 30"
          />
        </label>
        <div className="ml-3 flex items-center gap-3 whitespace-nowrap text-sm" aria-live="polite">
          {status}
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm md:hidden">
        <div className="flex flex-wrap items-center gap-3" aria-live="polite">
          {status}
        </div>
        <div className="ml-auto flex shrink-0 gap-2">{tools}</div>
      </div>
    </div>
  );
}
