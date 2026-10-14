"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
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
}: {
  filters: BrowseFilters;
  onChange: (f: BrowseFilters) => void;
  resultCount: number;
  hiddenCount: number;
  showHidden: boolean;
  onToggleHidden: () => void;
  onOpenSheet: () => void;
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

  return (
    <div className="glass sticky top-0 z-30 space-y-3 rounded-b-[22px] px-3 py-3 md:top-[56px]">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 overflow-x-auto rounded-full bg-black/5 p-1 dark:bg-white/10">
          {kinds.map((k) => (
            <button
              key={k.id}
              type="button"
              className={cn(
                "focus-ring min-h-10 flex-1 rounded-full px-3 text-sm font-medium whitespace-nowrap",
                filters.kind === k.id && "bg-green text-[var(--ink-on-green)]",
              )}
              aria-pressed={filters.kind === k.id}
              onClick={() => onChange({ ...filters, kind: k.id })}
            >
              {k.label}
            </button>
          ))}
        </div>
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
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/5 dark:bg-white/10"
          aria-label="Search"
          aria-expanded={searchOpen}
          onClick={() => {
            setSearchOpen((o) => !o);
            queueMicrotask(() => inputRef.current?.focus());
          }}
        >
          <Search size={18} />
        </button>
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
            {b.label}
          </button>
        ))}
        <label className="ml-2 flex items-center gap-2 text-sm text-muted">
          Fits my age
          <input
            type="number"
            min={18}
            max={99}
            inputMode="numeric"
            value={filters.myAge}
            onChange={(e) => onChange({ ...filters, myAge: e.target.value })}
            className="focus-ring w-16 rounded-full border border-white/30 bg-white/40 px-2 py-2 text-base text-fg"
            placeholder="—"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm" aria-live="polite">
        <span className="text-muted">{resultCount} profiles</span>
        {hiddenCount > 0 ? (
          <button type="button" className="text-green underline focus-ring rounded" onClick={onToggleHidden}>
            {showHidden ? "Hide hidden again" : `Show hidden (${hiddenCount})`}
          </button>
        ) : null}
        {active ? (
          <button
            type="button"
            className="text-muted underline focus-ring rounded"
            onClick={() =>
              onChange({ kind: "all", band: "any", q: "", myAge: "" })
            }
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
