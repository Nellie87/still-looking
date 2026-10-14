"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { PayBox } from "@/components/flows/PayBox";
import { getRepo } from "@/lib/data";
import type { PublicProfile, Settings } from "@/lib/data/repo";
import { unlockInputSchema } from "@/lib/schemas";
import { cn } from "@/lib/cn";

export function UnlockFlow({
  open,
  profile,
  settings,
  onClose,
  onDone,
}: {
  open: boolean;
  profile: PublicProfile | null;
  settings: Settings | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [handle, setHandle] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [mpesaCode, setMpesaCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!profile || !settings) return null;

  function reset() {
    setStep(0);
    setHandle("");
    setPayerPhone("");
    setMpesaCode("");
    setError(null);
  }

  async function submit() {
    setError(null);
    const parsed = unlockInputSchema.safeParse({
      code: profile!.code,
      handle,
      payerPhone,
      mpesaCode,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    try {
      await getRepo().submitUnlock(parsed.data);
      setStep(2);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send request");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="I'm interested"
    >
      <div className="mb-4 flex gap-2" aria-label="Steps">
        {["Your details", "Pay", "Sent"].map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex-1 rounded-full py-1 text-center text-xs",
              i === step ? "bg-green text-[var(--ink-on-green)]" : "bg-black/5 dark:bg-white/10",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {step === 0 ? (
        <div className="space-y-4 pb-4">
          <p className="text-sm text-muted">
            Pay the unlock fee, our team checks the payment, then we DM the contact to your Instagram.
          </p>
          <label className="block space-y-1 text-sm">
            Your Instagram (where we will DM)
            <input
              className="focus-ring w-full rounded-[16px] border border-white/30 bg-white/40 px-3 py-3 text-base dark:bg-black/20"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@yourhandle"
              autoComplete="username"
            />
          </label>
          <label className="block space-y-1 text-sm">
            Phone you will pay from
            <input
              className="focus-ring w-full rounded-[16px] border border-white/30 bg-white/40 px-3 py-3 text-base dark:bg-black/20"
              value={payerPhone}
              onChange={(e) => setPayerPhone(e.target.value)}
              inputMode="tel"
              placeholder="07XX XXX XXX"
            />
          </label>
          {error ? <p className="text-sm text-orange">{error}</p> : null}
          <button
            type="button"
            className="btn-primary focus-ring w-full"
            onClick={() => {
              setError(null);
              const h = unlockInputSchema.shape.handle.safeParse(handle);
              const p = unlockInputSchema.shape.payerPhone.safeParse(payerPhone);
              if (!h.success) return setError(h.error.issues[0]?.message ?? "Invalid handle");
              if (!p.success) return setError(p.error.issues[0]?.message ?? "Invalid phone");
              setStep(1);
            }}
          >
            Continue to pay
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4 pb-4">
          <PayBox
            amount={settings.unlockFee}
            till={settings.tillNumber}
            reference={profile.code}
            payerPhone={payerPhone}
            mpesaCode={mpesaCode}
            onPayerPhone={setPayerPhone}
            onMpesaCode={setMpesaCode}
          />
          {error ? <p className="text-sm text-orange">{error}</p> : null}
          <div className="flex gap-2">
            <button type="button" className="btn-ghost focus-ring" onClick={() => setStep(0)}>
              Back
            </button>
            <button
              type="button"
              className="btn-primary focus-ring flex-1"
              disabled={busy}
              onClick={submit}
            >
              I&apos;ve paid
            </button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4 pb-4">
          <ol className="space-y-3 text-sm">
            <li className="glass rounded-[16px] px-4 py-3">Payment details sent</li>
            <li className="glass rounded-[16px] px-4 py-3">Team checks the payment · {settings.responseTimeText}</li>
            <li className="glass rounded-[16px] px-4 py-3">
              Contact sent to {handle.startsWith("@") ? handle : `@${handle}`}
            </li>
          </ol>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary focus-ring"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Back to browsing
            </button>
            <a href="/me" className="btn-ghost focus-ring">
              My activity
            </a>
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}
