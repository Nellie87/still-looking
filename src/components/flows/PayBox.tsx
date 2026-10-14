"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { formatKes } from "@/lib/money";

export function PayBox({
  amount,
  till,
  reference,
  payerPhone,
  mpesaCode,
  onPayerPhone,
  onMpesaCode,
}: {
  amount: number;
  till: string;
  reference: string;
  payerPhone: string;
  mpesaCode: string;
  onPayerPhone: (v: string) => void;
  onMpesaCode: (v: string) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="glass space-y-3 rounded-[22px] p-4">
      <p className="text-sm text-muted">Sample prices and till until owners set real values.</p>
      <div className="flex justify-between text-lg font-semibold">
        <span>Amount</span>
        <span>{formatKes(amount)}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted">Pay to Till</p>
          <p className="font-mono text-lg">{till}</p>
        </div>
        <button type="button" className="btn-ghost min-h-10 px-3 text-xs" onClick={() => copy("till", till)}>
          {copied === "till" ? <Check size={14} /> : <Copy size={14} />} Copy
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm text-muted">Reference</p>
          <p className="font-mono text-lg">{reference}</p>
        </div>
        <button
          type="button"
          className="btn-ghost min-h-10 px-3 text-xs"
          onClick={() => copy("ref", reference)}
        >
          {copied === "ref" ? <Check size={14} /> : <Copy size={14} />} Copy
        </button>
      </div>
      <label className="block space-y-1 text-sm">
        Phone you pay from
        <input
          className="focus-ring w-full rounded-[16px] border border-white/30 bg-white/40 px-3 py-3 text-base dark:bg-black/20"
          value={payerPhone}
          onChange={(e) => onPayerPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          placeholder="07XX XXX XXX"
        />
      </label>
      <label className="block space-y-1 text-sm">
        M-Pesa confirmation code
        <input
          className="focus-ring w-full rounded-[16px] border border-white/30 bg-white/40 px-3 py-3 text-base uppercase dark:bg-black/20"
          value={mpesaCode}
          onChange={(e) => onMpesaCode(e.target.value.toUpperCase())}
          autoComplete="off"
          placeholder="8–12 letters or numbers"
        />
      </label>
    </div>
  );
}
