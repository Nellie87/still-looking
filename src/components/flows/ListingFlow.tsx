"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Heart, Lock, Pencil, X } from "lucide-react";
import { PayBox } from "@/components/flows/PayBox";
import { CheckRow, Field, StepProgress, Tracker } from "@/components/flows/fields";
import { getRepo } from "@/lib/data";
import type { Kind, Settings } from "@/lib/data/repo";
import { listingInputSchema } from "@/lib/schemas";
import { rejectIfContactLeak } from "@/lib/moderation";
import { formatKes } from "@/lib/money";
import { cn } from "@/lib/cn";

const DRAFT_KEY = "sl-listing-draft";
const STEPS = ["About you", "Your story", "Preview & contact", "Pay"];
const GENDERS = ["Woman", "Man", "Non-binary"];
const TAG_IDEAS = ["hiking", "books", "faith", "music", "food", "travel", "fitness", "film", "art", "markets"];

const empty = {
  kind: "love" as Kind,
  alias: "",
  age: "",
  gender: "",
  area: "",
  seekMin: "",
  seekMax: "",
  headline: "",
  seek: "",
  body: "",
  tags: [] as string[],
  instagram: "",
  phone: "",
  realName: "",
  payerPhone: "",
  mpesaCode: "",
  over18: false,
  understands: false,
};
type Form = typeof empty;
type Errors = Partial<Record<keyof Form | "form", string>>;

/* Which fields each step owns, so zod issues land on the right screen */
const STEP_FIELDS: (keyof Form)[][] = [
  ["kind", "alias", "age", "gender", "area"],
  ["headline", "seek", "seekMin", "seekMax", "body", "tags"],
  ["instagram", "phone", "realName"],
  ["payerPhone", "mpesaCode", "over18", "understands"],
];

function toInput(f: Form, placeholders: boolean) {
  return {
    kind: f.kind,
    alias: f.alias,
    age: Number(f.age),
    gender: f.gender,
    area: f.area,
    seekMin: f.seekMin ? Number(f.seekMin) : undefined,
    seekMax: f.seekMax ? Number(f.seekMax) : undefined,
    headline: f.headline,
    seek: f.seek,
    body: f.body,
    tags: f.tags,
    instagram: f.instagram || (placeholders ? "@placeholder" : ""),
    phone: f.phone || (placeholders ? "0700000000" : ""),
    payerPhone: f.payerPhone || (placeholders ? "0700000000" : ""),
    mpesaCode: f.mpesaCode || (placeholders ? "PLACEHOLD01" : ""),
    realName: f.realName || undefined,
  };
}

const FRIENDLY: Partial<Record<keyof Form, string>> = {
  alias: "Pick an alias of 2 to 20 characters.",
  age: "Enter an age from 18 to 99.",
  gender: "Choose or type how you describe yourself.",
  area: "Add your general area, like Kilimani.",
  headline: "Write a one-liner of at least 8 characters.",
  seek: "Say who you're hoping to meet (8+ characters).",
  body: "Tell your story in at least 40 characters.",
};

export function ListingFlow({ settings }: { settings: Settings | null }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [restored, setRestored] = useState(false);
  const [customGender, setCustomGender] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  /* Restore an unfinished draft (never payment details) */
  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return;
        const d = JSON.parse(raw) as Partial<Form>;
        const hasContent = [d.alias, d.age, d.area, d.headline, d.seek, d.body].some(
          (v) => typeof v === "string" && v.trim(),
        );
        if (!hasContent) return;
        setForm((f) => ({ ...f, ...d, payerPhone: "", mpesaCode: "" }));
        if (d.gender && !GENDERS.includes(d.gender)) setCustomGender(true);
        setRestored(true);
      } catch {
        /* storage unavailable: start fresh */
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (code) return;
    try {
      const { payerPhone: _p, mpesaCode: _m, ...draft } = form;
      void _p;
      void _m;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [form, code]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined, form: undefined }));
  };

  const love = form.kind === "love";

  function addTag(raw: string) {
    const t = raw.trim().toLowerCase().replace(/^#/, "").slice(0, 24);
    if (!t || form.tags.includes(t) || form.tags.length >= 6) return;
    set("tags", [...form.tags, t]);
  }

  function validate(upTo: number): boolean {
    const e: Errors = {};
    const owned = new Set(STEP_FIELDS.slice(0, upTo + 1).flat());
    const parsed = listingInputSchema.safeParse(toInput(form, upTo < 3));
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0]) as keyof Form;
        if (owned.has(k) && !e[k]) e[k] = FRIENDLY[k] ?? issue.message;
      }
    }
    if (upTo >= 1) {
      for (const k of ["headline", "seek", "body"] as const) {
        const leak = rejectIfContactLeak(form[k]);
        if (!leak.ok && !e[k]) e[k] = leak.reason;
      }
    }
    if (upTo >= 3 && !(form.over18 && form.understands)) {
      e.form = "Tick both boxes to continue.";
    }
    setErrors(e);
    if (Object.keys(e).length) {
      const firstStep = STEP_FIELDS.findIndex((fs) => fs.some((k) => e[k]));
      if (firstStep >= 0 && firstStep < step) setStep(firstStep);
      return false;
    }
    return true;
  }

  function go(n: number) {
    setStep(n);
    queueMicrotask(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function submit() {
    if (!validate(3)) return;
    const parsed = listingInputSchema.safeParse(toInput(form, false));
    if (!parsed.success) {
      setErrors({ mpesaCode: parsed.error.issues[0]?.message });
      return;
    }
    setBusy(true);
    try {
      const res = await getRepo().submitListing(parsed.data);
      setCode(res.code);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      go(4);
    } catch (err) {
      setErrors({ mpesaCode: err instanceof Error ? err.message : "Could not submit listing" });
    } finally {
      setBusy(false);
    }
  }

  const preview = useMemo(
    () => ({
      headline: form.headline || "Your one-line summary",
      seek: form.seek || "Who you're hoping to meet",
    }),
    [form.headline, form.seek],
  );

  if (!settings) return <div className="admin-card h-64 animate-pulse" />;

  /* —— Done —— */
  if (step === 4) {
    return (
      <div ref={topRef} className="space-y-5">
        <div className="list-done">
          <p className="text-sm opacity-80">You&apos;re on the list</p>
          <p className="mt-1 font-display text-2xl font-semibold">Thanks, {form.alias}!</p>
          <p className="mt-2 text-sm opacity-90">
            Your profile code is <b className="font-mono">{code}</b>. Keep it handy.
          </p>
        </div>
        <Tracker
          current={1}
          items={[
            { title: "Listing and payment sent", body: formatKes(settings.listingFee) },
            { title: "The team reviews your profile", body: settings.responseTimeText },
            { title: "You go live on Browse", body: "Your contact stays private until someone pays to unlock it." },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <Link href="/me" className="btn-primary focus-ring">
            Track it in My activity
          </Link>
          <Link href="/browse" className="btn-ghost focus-ring">
            Browse profiles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-24 space-y-5 pb-28 md:pb-0">
      <StepProgress steps={STEPS} current={step} tone={love ? "green" : "orange"} />

      {restored && step === 0 ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-green/10 px-3 py-2 text-sm">
          <span>We kept your draft from last time.</span>
          <button
            type="button"
            className="focus-ring rounded-full px-2 py-1 text-xs underline"
            onClick={() => {
              setForm(empty);
              setRestored(false);
              setCustomGender(false);
            }}
          >
            Start over
          </button>
        </div>
      ) : null}

      {/* —— Step 1: About you —— */}
      {step === 0 ? (
        <section className="list-card space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium">What are you looking for?</p>
            <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Looking for">
              {(["love", "friend"] as Kind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={form.kind === k}
                  className={cn("kind-choice focus-ring", `kind-choice--${k}`, form.kind === k && "is-on")}
                  onClick={() => set("kind", k)}
                >
                  <span className="kind-choice__icon" aria-hidden>
                    {k === "love" ? <Heart size={18} fill="currentColor" /> : <RingsIcon />}
                  </span>
                  <span className="font-display text-lg font-semibold">
                    {k === "love" ? "Love" : "Friendship"}
                  </span>
                  <span className="text-xs opacity-80">
                    {k === "love" ? "A partner, something real" : "Your people, a crew"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Field label="Alias" hint="Not your real name. This is what people see." error={errors.alias}>
            {(id, d) => (
              <input
                id={id}
                aria-describedby={d}
                aria-invalid={!!errors.alias}
                className="field-input"
                value={form.alias}
                onChange={(e) => set("alias", e.target.value)}
                maxLength={20}
                placeholder="e.g. Sunbird"
                autoComplete="off"
              />
            )}
          </Field>

          <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
            <Field label="Age" error={errors.age}>
              {(id, d) => (
                <input
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!errors.age}
                  className="field-input"
                  type="number"
                  inputMode="numeric"
                  min={18}
                  max={99}
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                  placeholder="28"
                />
              )}
            </Field>
            <Field label="General area" error={errors.area}>
              {(id, d) => (
                <input
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!errors.area}
                  className="field-input"
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  placeholder="e.g. Kilimani"
                  autoComplete="off"
                />
              )}
            </Field>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium">I am</p>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className="chip focus-ring"
                  data-active={!customGender && form.gender === g}
                  aria-pressed={!customGender && form.gender === g}
                  onClick={() => {
                    setCustomGender(false);
                    set("gender", g);
                  }}
                >
                  {g}
                </button>
              ))}
              <button
                type="button"
                className="chip focus-ring"
                data-active={customGender}
                aria-pressed={customGender}
                onClick={() => {
                  setCustomGender(true);
                  set("gender", "");
                }}
              >
                Something else
              </button>
            </div>
            {customGender ? (
              <input
                className="field-input mt-2"
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                placeholder="How you describe yourself"
                aria-label="How you describe yourself"
                maxLength={40}
              />
            ) : null}
            {errors.gender ? <p className="mt-1.5 text-sm text-red-700">{errors.gender}</p> : null}
          </div>
        </section>
      ) : null}

      {/* —— Step 2: Your story —— */}
      {step === 1 ? (
        <section className="list-card space-y-5">
          <Field
            label="One-line summary"
            hint="The bold line people see first."
            count={form.headline.length}
            max={90}
            error={errors.headline}
          >
            {(id, d) => (
              <input
                id={id}
                aria-describedby={d}
                aria-invalid={!!errors.headline}
                className="field-input"
                value={form.headline}
                onChange={(e) => set("headline", e.target.value)}
                maxLength={90}
                placeholder={love ? "Soft evenings, strong opinions, Sunday markets" : "Looking for a weekend hiking crew"}
              />
            )}
          </Field>

          <Field
            label="Who you're hoping to meet"
            count={form.seek.length}
            max={160}
            error={errors.seek}
          >
            {(id, d) => (
              <textarea
                id={id}
                aria-describedby={d}
                aria-invalid={!!errors.seek}
                className="field-input min-h-20 !rounded-2xl"
                value={form.seek}
                onChange={(e) => set("seek", e.target.value)}
                maxLength={160}
                placeholder="Someone kind, curious, and okay with slow mornings."
              />
            )}
          </Field>

          <div>
            <p className="mb-1.5 text-sm font-medium">
              Their age <span className="font-normal text-muted">(optional)</span>
            </p>
            <div className="flex items-center gap-2">
              <input
                className="field-input w-24"
                type="number"
                inputMode="numeric"
                min={18}
                max={99}
                value={form.seekMin}
                onChange={(e) => set("seekMin", e.target.value)}
                placeholder="From"
                aria-label="Youngest age"
              />
              <span className="text-muted">to</span>
              <input
                className="field-input w-24"
                type="number"
                inputMode="numeric"
                min={18}
                max={99}
                value={form.seekMax}
                onChange={(e) => set("seekMax", e.target.value)}
                placeholder="To"
                aria-label="Oldest age"
              />
            </div>
            {errors.seekMin || errors.seekMax ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.seekMin ?? errors.seekMax}</p>
            ) : null}
          </div>

          <Field
            label="Your story"
            hint={
              form.body.length < 40
                ? `${40 - form.body.length} more characters to go. Leave out phone numbers, handles and links.`
                : "Leave out phone numbers, handles and links. Those stay private."
            }
            count={form.body.length}
            max={2500}
            error={errors.body}
          >
            {(id, d) => (
              <textarea
                id={id}
                aria-describedby={d}
                aria-invalid={!!errors.body}
                className="field-input min-h-40 !rounded-2xl font-[family-name:var(--font-newsreader)] text-[1.05rem] leading-relaxed"
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                maxLength={2500}
                placeholder="What your weekends look like, what you care about, what makes you laugh."
              />
            )}
          </Field>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <p className="text-sm font-medium">
                Tags <span className="font-normal text-muted">(up to 6)</span>
              </p>
              <span className="text-xs text-muted">{form.tags.length}/6</span>
            </div>
            <div className="field-input flex min-h-12 flex-wrap items-center gap-1.5 !rounded-2xl !py-2">
              {form.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-black/5 py-1 pl-2.5 pr-1 text-sm capitalize dark:bg-white/10">
                  {t}
                  <button
                    type="button"
                    className="focus-ring rounded-full p-0.5 hover:bg-black/10"
                    aria-label={`Remove ${t}`}
                    onClick={() => set("tags", form.tags.filter((x) => x !== t))}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
              {form.tags.length < 6 ? (
                <input
                  className="min-w-28 flex-1 bg-transparent py-1 text-base outline-none"
                  value={tagDraft}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.endsWith(",")) {
                      addTag(v.slice(0, -1));
                      setTagDraft("");
                    } else setTagDraft(v);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(tagDraft);
                      setTagDraft("");
                    } else if (e.key === "Backspace" && !tagDraft && form.tags.length) {
                      set("tags", form.tags.slice(0, -1));
                    }
                  }}
                  onBlur={() => {
                    addTag(tagDraft);
                    setTagDraft("");
                  }}
                  placeholder={form.tags.length ? "Add another" : "Type a tag and press enter"}
                  aria-label="Add a tag"
                  enterKeyHint="done"
                />
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TAG_IDEAS.filter((t) => !form.tags.includes(t))
                .slice(0, 6)
                .map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="focus-ring rounded-full border border-dashed border-slate/30 px-2.5 py-1 text-xs capitalize text-muted hover:text-fg"
                    disabled={form.tags.length >= 6}
                    onClick={() => addTag(t)}
                  >
                    + {t}
                  </button>
                ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* —— Step 3: Preview & private contact —— */}
      {step === 2 ? (
        <>
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="reader-label">How you&apos;ll appear</p>
              <button
                type="button"
                className="focus-ring inline-flex items-center gap-1 rounded-full text-sm text-green"
                onClick={() => go(1)}
              >
                <Pencil size={14} /> Edit
              </button>
            </div>
            <div className={cn("list-preview", love ? "is-love" : "is-friend")}>
              <div className="flex items-baseline gap-2">
                <span className="list-preview__age">{form.age || "—"}</span>
                <span className="text-sm opacity-90">
                  <b>{form.alias || "Alias"}</b> · {form.area || "Area"}
                </span>
              </div>
              <p className="mt-1.5 font-display text-xl font-bold leading-snug">{preview.headline}</p>
              <p className="mt-1 font-[family-name:var(--font-newsreader)] opacity-90">{preview.seek}</p>
              {form.tags.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {form.tags.map((t) => (
                    <span key={t} className="path-stop__tag">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </section>

          <section className="list-card space-y-5">
            <div className="flex gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green/10 text-green">
                <Lock size={17} aria-hidden />
              </span>
              <div>
                <p className="font-semibold">Private contact</p>
                <p className="text-sm text-muted">
                  Never shown on your profile. Only shared with someone who pays to unlock you,
                  after the team checks their payment.
                </p>
              </div>
            </div>
            <Field label="Instagram" error={errors.instagram}>
              {(id, d) => (
                <input
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!errors.instagram}
                  className="field-input"
                  value={form.instagram}
                  onChange={(e) => set("instagram", e.target.value)}
                  placeholder="@handle"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              )}
            </Field>
            <Field label="Phone" hint="Include your country code if you’re outside Kenya." error={errors.phone}>
              {(id, d) => (
                <input
                  id={id}
                  aria-describedby={d}
                  aria-invalid={!!errors.phone}
                  className="field-input"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+254 712 345 678"
                />
              )}
            </Field>
            <Field label="Real name" optional hint="Only the team sees this." error={errors.realName}>
              {(id, d) => (
                <input
                  id={id}
                  aria-describedby={d}
                  className="field-input"
                  value={form.realName}
                  onChange={(e) => set("realName", e.target.value)}
                  autoComplete="name"
                />
              )}
            </Field>
          </section>
        </>
      ) : null}

      {/* —— Step 4: Pay —— */}
      {step === 3 ? (
        <section className="space-y-5">
          <PayBox
            amount={settings.listingFee}
            till={settings.tillNumber}
            reference={form.alias ? `List ${form.alias}` : "New listing"}
            payerPhone={form.payerPhone}
            mpesaCode={form.mpesaCode}
            onPayerPhone={(v) => set("payerPhone", v)}
            onMpesaCode={(v) => set("mpesaCode", v)}
            error={errors.mpesaCode ?? errors.payerPhone}
          />
          <div className="space-y-2">
            <CheckRow checked={form.over18} onChange={(v) => set("over18", v)}>
              I am 18 or older
            </CheckRow>
            <CheckRow checked={form.understands} onChange={(v) => set("understands", v)}>
              I understand my contact is only shared after a paid unlock, and the team reviews my
              profile before it goes live
            </CheckRow>
            {errors.form ? <p className="text-sm text-red-700">{errors.form}</p> : null}
          </div>
        </section>
      ) : null}

      {/* —— Actions: pinned above the bottom nav on mobile —— */}
      <div className="list-actions">
        {step > 0 ? (
          <button type="button" className="btn-ghost focus-ring" onClick={() => go(step - 1)}>
            <ArrowLeft size={16} /> Back
          </button>
        ) : null}
        {step < 3 ? (
          <button
            type="button"
            className="btn-primary focus-ring flex-1"
            onClick={() => validate(step) && go(step + 1)}
          >
            {step === 2 ? "Continue to pay" : "Continue"} <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary focus-ring flex-1"
            disabled={busy}
            onClick={submit}
          >
            {busy ? "Sending…" : `I've paid ${formatKes(settings.listingFee)}`}
          </button>
        )}
      </div>
    </div>
  );
}

function RingsIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="12" r="5.25" stroke="currentColor" strokeWidth="2" />
      <circle cx="15" cy="12" r="5.25" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
