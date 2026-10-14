"use client";

import { EyeOff, ArrowUpRight } from "lucide-react";
import type { PublicProfile } from "@/lib/data/repo";
import { kindLabel } from "@/lib/search";
import { cn } from "@/lib/cn";

export function ProfileTile({
  profile,
  unlocked,
  onOpen,
  onHide,
}: {
  profile: PublicProfile;
  unlocked?: boolean;
  onOpen: () => void;
  onHide: () => void;
}) {
  const love = profile.kind === "love";
  return (
    <article
      className={cn("tile relative flex flex-col gap-3 p-5 shadow-lg focus-ring", love ? "tile-love" : "tile-friend")}
      role="button"
      tabIndex={0}
      aria-label={`Read ${profile.alias}'s profile: ${profile.headline}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-xl font-semibold">
            {profile.alias}, {profile.age}
          </p>
          <p className="text-sm opacity-80">
            {profile.area} · {profile.code}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {unlocked ? (
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-medium">Unlocked</span>
          ) : null}
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{kindLabel(profile.kind)}</span>
        </div>
      </div>
      <h3 className="font-display text-base leading-snug">{profile.headline}</h3>
      <p className="line-clamp-4 text-sm opacity-90">{profile.seek}</p>
      <div className="mt-auto flex flex-wrap gap-1.5">
        {profile.tags.slice(0, 3).map((t) => (
          <span key={t} className="rounded-full bg-black/10 px-2 py-0.5 text-xs">
            {t}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/15"
          aria-label={`Hide ${profile.alias}`}
          onClick={(e) => {
            e.stopPropagation();
            onHide();
          }}
        >
          <EyeOff size={18} />
        </button>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/25">
          <ArrowUpRight size={18} />
        </span>
      </div>
    </article>
  );
}
