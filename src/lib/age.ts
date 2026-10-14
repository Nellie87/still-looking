export type AgeBand = "any" | "18-25" | "26-30" | "31-35" | "36-40" | "41+";

export const AGE_BANDS: { id: AgeBand; label: string }[] = [
  { id: "any", label: "Any" },
  { id: "18-25", label: "18 to 25" },
  { id: "26-30", label: "26 to 30" },
  { id: "31-35", label: "31 to 35" },
  { id: "36-40", label: "36 to 40" },
  { id: "41+", label: "41+" },
];

export function ageFromBirthYear(birthYear: number, now = new Date()): number {
  return now.getFullYear() - birthYear;
}

export function birthYearFromAge(age: number, now = new Date()): number {
  return now.getFullYear() - age;
}

export function ageInBand(age: number, band: AgeBand): boolean {
  if (band === "any") return true;
  if (band === "41+") return age >= 41;
  const [min, max] = band.split("-").map(Number);
  return age >= min && age <= max;
}

export function fitsMyAge(
  seekMin: number | undefined,
  seekMax: number | undefined,
  myAge: number,
): boolean {
  if (seekMin == null && seekMax == null) return true;
  const min = seekMin ?? 18;
  const max = seekMax ?? 99;
  return myAge >= min && myAge <= max;
}
