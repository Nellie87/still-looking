"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { formatKes } from "@/lib/money";
import { Field } from "@/components/flows/fields";

/**
 * M-Pesa "Buy Goods" instructions + confirmation-code entry.
 * The payer phone field is optional here: flows that already asked for it hide it.
 */
export function PayBox({
  amount,
  till,
  reference,
  payerPhone,
  mpesaCode,
  onPayerPhone,
  onMpesaCode,
  showPhone = true,
  error,
}: {
  amount: number;
  till: string;
  reference: string;
  payerPhone: string;
  mpesaCode: string;
  onPayerPhone: (v: string) => void;
  onMpesaCode: (v: string) => void;
  showPhone?: boolean;
  error?: string | null;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1500);
  }

  const copyBtn = (id: string, value: string) => (
    <button
      type="button"
      className="focus-ring inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium shadow-sm dark:bg-white/10"
      onClick={() => copy(id, value)}
      aria-label={`Copy ${id}`}
    >
      {copied === id ? <Check size={13} /> : <Copy size={13} />}
      {copied === id ? "Copied" : "Copy"}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="paybox">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-75">You pay</p>
            <p className="font-display text-3xl font-bold">{formatKes(amount)}</p>
          </div>
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-green">
            M-Pesa · Buy Goods
          </span>
        </div>

        <ol className="paybox__steps">
          <li>Open M-Pesa and choose <b>Lipa na M-Pesa</b>, then <b>Buy Goods and Services</b>.</li>
          <li>
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Till number <b className="font-mono text-base tracking-wider">{till}</b>
              </span>
              {copyBtn("till", till)}
            </span>
          </li>
          <li>
            Amount <b>{formatKes(amount)}</b>, then enter your PIN.
          </li>
          <li>
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Keep this reference handy: <b className="font-mono">{reference}</b>
              </span>
              {copyBtn("reference", reference)}
            </span>
          </li>
        </ol>
        <p className="mt-3 text-[11px] opacity-70">Sample till and price until the owners set real ones.</p>
      </div>

      {showPhone ? (
        <Field label="Phone you paid from" hint="So the team can match your payment.">
          {(id, d) => (
            <input
              id={id}
              aria-describedby={d}
              className="field-input"
              value={payerPhone}
              onChange={(e) => onPayerPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="+254 712 345 678"
            />
          )}
        </Field>
      ) : null}

      <Field
        label="M-Pesa confirmation code"
        hint="It's at the start of the SMS M-Pesa sends you, e.g. SKD4H7X2LQ."
        error={error}
      >
        {(id, d) => (
          <input
            id={id}
            aria-describedby={d}
            aria-invalid={!!error}
            className="field-input font-mono uppercase tracking-wider"
            value={mpesaCode}
            onChange={(e) => onMpesaCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            placeholder="8–12 letters or numbers"
          />
        )}
      </Field>
    </div>
  );
}
