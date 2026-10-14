import { ageInBand, fitsMyAge, type AgeBand } from "./age";
import type { Kind, PublicProfile, SearchQuery } from "./data/repo";

function haystack(p: PublicProfile): string {
  return [
    p.alias,
    p.headline,
    p.seek,
    p.body.join(" "),
    p.tags.join(" "),
    p.area,
    p.code,
  ]
    .join(" ")
    .toLowerCase();
}

export function matchesQuery(p: PublicProfile, q?: string): boolean {
  if (!q?.trim()) return true;
  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const text = haystack(p);
  return words.every((w) => text.includes(w));
}

export function filterProfiles(
  items: PublicProfile[],
  query: SearchQuery,
  hidden = new Set<string>(),
): PublicProfile[] {
  return items.filter((p) => {
    if (!query.includeHidden && hidden.has(p.code)) return false;
    if (query.kind && query.kind !== "all" && p.kind !== query.kind) return false;
    const band = (query.band ?? "any") as AgeBand;
    if (!ageInBand(p.age, band)) return false;
    if (query.myAge != null && !fitsMyAge(p.seekMin, p.seekMax, query.myAge)) {
      return false;
    }
    return matchesQuery(p, query.q);
  });
}

export function kindLabel(kind: Kind): string {
  return kind === "love" ? "Love" : "Friendship";
}
