export function normalizeMpesaCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function formatProfileCode(n: number): string {
  return `SL-${String(n).padStart(4, "0")}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `•••• ${digits.slice(-4)}`;
}
