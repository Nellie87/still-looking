const KEY = "sl-hidden-codes";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(codes: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(codes));
}

export function getHiddenCodes(): string[] {
  return read();
}

export function hideCode(code: string) {
  const next = Array.from(new Set([...read(), code]));
  write(next);
}

export function unhideCode(code: string) {
  write(read().filter((c) => c !== code));
}

export function clearHidden() {
  write([]);
}
