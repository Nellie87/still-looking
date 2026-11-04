/** Profiles this visitor has opened, so the trail can mark or skip them. Device-local. */
const KEY = "sl-seen-codes";
const PREF_KEY = "sl-hide-seen";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(codes: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(codes));
  } catch {
    /* storage unavailable */
  }
}

export function getSeenCodes(): string[] {
  return read();
}

export function markSeen(code: string) {
  const list = read();
  if (!list.includes(code)) write([...list, code]);
}

export function clearSeen() {
  write([]);
}

export function getHideSeenPref(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PREF_KEY) === "1";
  } catch {
    return false;
  }
}

export function setHideSeenPref(on: boolean) {
  try {
    localStorage.setItem(PREF_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}
