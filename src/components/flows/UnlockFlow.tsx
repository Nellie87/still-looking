"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Heart, Lock, ShieldCheck } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { PayBox } from "@/components/flows/PayBox";
import { Field, StepProgress, Tracker } from "@/components/flows/fields";
import { getRepo } from "@/lib/data";
import type { PublicProfile, Settings } from "@/lib/data/repo";
import { unlockInputSchema } from "@/lib/schemas";
import { rejectIfContactLeak } from "@/lib/moderation";
import { formatKes } from "@/lib/money";
import { cn } from "@/lib/cn";

const STEPS = ["Your details", "Pay", "Sent"];
const NOTE_MAX = 280;

type Errors = Partial<Record<"handle" | "payerPhone" | "note" | "mpesaCode" | "form", string>>;

/**
 * "Connect" flow: requester leaves where to reach them, pays the unlock fee,
 * then the team verifies and DMs the contact. Profiles stay anonymous until then.
 */
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
  const [note, setNote] = useState("");
  const [mpesaCode, setMpesaCode] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  if (!profile || !settings) return null;
  const love = profile.kind === "love";
  const at = handle.trim().startsWith("@") ? handle.trim() : `@${handle.trim()}`;

  function close() {
    setStep(0);
    setHandle("");
    setPayerPhone("");
    setNote("");
    setMpesaCode("");
    setErrors({});
    onClose();
  }

  function checkDetails(): boolean {
    const e: Errors = {};
    const h = unlockInputSchema.shape.handle.safeParse(handle);
    if (!h.success) e.handle = h.error.issues[0]?.message;
    const p = unlockInputSchema.shape.payerPhone.safeParse(payerPhone);
    if (!p.success) e.payerPhone = p.error.issues[0]?.message;
    if (note.trim()) {
      if (note.length > NOTE_MAX) e.note = `Keep it under ${NOTE_MAX} characters.`;
      const leak = rejectIfContactLeak(note);
      if (!leak.ok) e.note = "Leave out numbers, handles and links. The team shares contacts after payment.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    const parsed = unlockInputSchema.safeParse({
      code: profile!.code,
      handle,
      payerPhone,
      mpesaCode,
      note: note.trim() || undefined,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const path = String(issue?.path[0] ?? "");
      const known: (keyof Errors)[] = ["handle", "payerPhone", "note", "mpesaCode"];
      const key = known.includes(path as keyof Errors) ? (path as keyof Errors) : "form";
      setErrors({ [key]: issue?.message ?? "Check your details" });
      /* Detail errors live on the first step */
      if (key === "handle" || key === "payerPhone" || key === "note") setStep(0);
      return;
    }
    setBusy(true);
    try {
      await getRepo().submitUnlock(parsed.data);
      setErrors({});
      setStep(2);
      onDone();
    } catch (err) {
      setErrors({ mpesaCode: err instanceof Error ? err.message : "Could not send request" });
    } finally {
      setBusy(false);
    }
  }

  const footer =
    step === 0 ? (
      <button
        type="button"
        className="btn-primary focus-ring w-full"
        onClick={() => checkDetails() && setStep(1)}
      >
        Continue to pay
      </button>
    ) : step === 1 ? (
      <div className="flex gap-2">
        <button type="button" className="btn-ghost focus-ring" onClick={() => setStep(0)}>
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          className="btn-primary focus-ring flex-1"
          disabled={busy || mpesaCode.length < 8}
          onClick={submit}
        >
          {busy ? "Sending…" : "I've paid"}
        </button>
      </div>
    ) : (
      <div className="flex gap-2">
        <Link href="/me" className="btn-ghost focus-ring" onClick={close}>
          My activity
        </Link>
        <button type="button" className="btn-primary focus-ring flex-1" onClick={close}>
          Back to browsing
        </button>
      </div>
    );

  return (
    <Sheet open={open} onClose={close} title={`Connect with ${profile.alias}`} footer={footer}>
      <div className="space-y-5">
        <StepProgress steps={STEPS} current={step} />

        {step === 0 ? (
          <>
            <div className={cn("connect-summary", love ? "is-love" : "is-friend")}>
              <span className="connect-summary__badge" aria-hidden>
                {love ? <Heart size={18} fill="currentColor" /> : <Lock size={18} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {profile.alias}, {profile.age} · {profile.area}
                </p>
                <p className="truncate text-sm opacity-80">{profile.headline}</p>
              </div>
              <p className="shrink-0 text-right">
                <span className="block text-[11px] uppercase tracking-wide opacity-75">Unlock</span>
                <span className="font-display text-lg font-bold">{formatKes(settings.unlockFee)}</span>
              </p>
            </div>

            <div>
              <p className="reader-label">How it works</p>
              <Tracker
                current={-1}
                items={[
                  { title: "Pay the unlock fee", body: "One M-Pesa payment to our till. No account needed." },
                  { title: "The team checks it", body: settings.responseTimeText },
                  {
                    title: `You get ${profile.alias}'s contact`,
                    body: "We DM it to your Instagram, and it shows on their profile on this device.",
                  },
                ]}
              />
            </div>

            <Field
              label="Your Instagram"
              hint="We'll DM the contact here."
              error={errors.handle}
            >
              {(id, d) => (
                <input
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!errors.handle}
                  className="field-input"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@yourhandle"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              )}
            </Field>

            <Field
              label="Phone you'll pay from"
              hint="Any country. Only the team sees it, to match your payment."
              error={errors.payerPhone}
            >
              {(id, d) => (
                <input
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!errors.payerPhone}
                  className="field-input"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+254 712 345 678"
                />
              )}
            </Field>

            <Field
              label={`Say hi to ${profile.alias}`}
              optional
              count={note.length}
              max={NOTE_MAX}
              hint={`We pass this on with a heads-up so ${profile.alias} knows to expect you.`}
              error={errors.note}
            >
              {(id, d) => (
                <textarea
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!errors.note}
                  className="field-input min-h-24 !rounded-2xl"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What caught your eye, and a little about you."
                />
              )}
            </Field>

            <p className="flex items-start gap-2 text-xs text-muted">
              <ShieldCheck size={15} className="mt-px shrink-0 text-green" aria-hidden />
              Your phone stays private. If the team can&apos;t find your payment, they&apos;ll tell
              you why and you can try again.
            </p>
          </>
        ) : null}

        {step === 1 ? (
          <PayBox
            amount={settings.unlockFee}
            till={settings.tillNumber}
            reference={profile.code}
            payerPhone={payerPhone}
            mpesaCode={mpesaCode}
            onPayerPhone={setPayerPhone}
            onMpesaCode={setMpesaCode}
            showPhone={false}
            error={errors.mpesaCode ?? errors.form}
          />
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="rounded-[22px] bg-green/10 p-4">
              <p className="font-display text-xl font-semibold text-green">Payment details sent</p>
              <p className="mt-1 text-sm">
                We&apos;ll DM {profile.alias}&apos;s contact to <b>{at}</b> once the payment is
                confirmed.
              </p>
            </div>
            <Tracker
              current={1}
              items={[
                { title: "Payment details sent", body: `${formatKes(settings.unlockFee)} · ${mpesaCode}` },
                { title: "Team checks the payment", body: settings.responseTimeText },
                { title: "Contact sent to you", body: `DM to ${at}, and on ${profile.alias}'s profile here.` },
              ]}
            />
            <p className="text-sm text-muted">
              You can close this. Track it any time under <b>My activity</b>.
            </p>
          </div>
        ) : null}
      </div>
    </Sheet>
  );
}
