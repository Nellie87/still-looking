"use client";

import { useMemo, useState } from "react";
import { PayBox } from "@/components/flows/PayBox";
import { getRepo } from "@/lib/data";
import type { Kind, Settings } from "@/lib/data/repo";
import { listingInputSchema } from "@/lib/schemas";
import { rejectIfContactLeak } from "@/lib/moderation";
import { cn } from "@/lib/cn";

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
  tags: "",
  instagram: "",
  phone: "",
  payerPhone: "",
  mpesaCode: "",
  realName: "",
  over18: false,
  understands: false,
};

export function ListingFlow({ settings }: { settings: Settings | null }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const previewTags = useMemo(
    () =>
      form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 6),
    [form.tags],
  );

  function set<K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateProfile(): boolean {
    setError(null);
    for (const field of [form.headline, form.seek, form.body]) {
      const check = rejectIfContactLeak(field);
      if (!check.ok) {
        setError(check.reason ?? "Fix your text");
        return false;
      }
    }
    const parsed = listingInputSchema.safeParse({
      kind: form.kind,
      alias: form.alias,
      age: Number(form.age),
      gender: form.gender,
      area: form.area,
      seekMin: form.seekMin ? Number(form.seekMin) : undefined,
      seekMax: form.seekMax ? Number(form.seekMax) : undefined,
      headline: form.headline,
      seek: form.seek,
      body: form.body,
      tags: previewTags,
      instagram: form.instagram || "@placeholder",
      phone: form.phone || "0700000000",
      payerPhone: form.payerPhone || "0700000000",
      mpesaCode: form.mpesaCode || "PLACEHOLD01",
    });
    if (!parsed.success) {
      const issue = parsed.error.issues.find(
        (i) => !["instagram", "phone", "payerPhone", "mpesaCode"].includes(String(i.path[0])),
      );
      setError(issue?.message ?? "Check your profile details");
      return false;
    }
    return true;
  }

  async function submit() {
    setError(null);
    if (!form.over18 || !form.understands) {
      setError("Tick both checkboxes to continue.");
      return;
    }
    const parsed = listingInputSchema.safeParse({
      kind: form.kind,
      alias: form.alias,
      age: Number(form.age),
      gender: form.gender,
      area: form.area,
      seekMin: form.seekMin ? Number(form.seekMin) : undefined,
      seekMax: form.seekMax ? Number(form.seekMax) : undefined,
      headline: form.headline,
      seek: form.seek,
      body: form.body,
      tags: previewTags,
      instagram: form.instagram,
      phone: form.phone,
      payerPhone: form.payerPhone,
      mpesaCode: form.mpesaCode,
      realName: form.realName || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    try {
      const res = await getRepo().submitListing(parsed.data);
      setCode(res.code);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit listing");
    } finally {
      setBusy(false);
    }
  }

  if (!settings) {
    return <p className="text-muted">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="mb-2 flex gap-2" aria-label="Steps">
        {["Your profile", "Pay", "Sent"].map((label, i) => (
          <div
            key={label}
            className={cn(
              "flex-1 rounded-full py-1 text-center text-xs",
              i === step ? "bg-orange text-[var(--ink-on-orange)]" : "bg-black/5 dark:bg-white/10",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {step === 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(["love", "friend"] as Kind[]).map((k) => (
              <button
                key={k}
                type="button"
                className={cn(
                  "focus-ring rounded-[22px] p-4 text-left font-semibold",
                  k === "love" ? "bg-green text-[var(--ink-on-green)]" : "bg-orange text-[var(--ink-on-orange)]",
                  form.kind === k ? "ring-2 ring-white" : "opacity-70",
                )}
                onClick={() => set("kind", k)}
              >
                {k === "love" ? "Love" : "Friendship"}
              </button>
            ))}
          </div>
          {(
            [
              ["alias", "Alias", "text"],
              ["age", "Age", "number"],
              ["gender", "Gender", "text"],
              ["area", "General area", "text"],
              ["seekMin", "Hoped-for age min (optional)", "number"],
              ["seekMax", "Hoped-for age max (optional)", "number"],
              ["headline", "One-line summary", "text"],
              ["seek", "Looking for", "text"],
            ] as const
          ).map(([key, label, type]) => (
            <label key={key} className="block space-y-1 text-sm">
              {label}
              <input
                type={type}
                className="focus-ring w-full rounded-[16px] border border-white/30 bg-white/40 px-3 py-3 text-base dark:bg-black/20"
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </label>
          ))}
          <label className="block space-y-1 text-sm">
            Your story
            <textarea
              className="focus-ring min-h-32 w-full rounded-[16px] border border-white/30 bg-white/40 px-3 py-3 text-base dark:bg-black/20"
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              maxLength={2500}
            />
          </label>
          <label className="block space-y-1 text-sm">
            Tags (comma separated, max 6)
            <input
              className="focus-ring w-full rounded-[16px] border border-white/30 bg-white/40 px-3 py-3 text-base dark:bg-black/20"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-orange">{error}</p> : null}
          <button
            type="button"
            className="btn-primary focus-ring w-full"
            onClick={() => {
              if (validateProfile()) setStep(1);
            }}
          >
            Continue to pay
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          <div
            className={cn(
              "rounded-[22px] p-4",
              form.kind === "love" ? "tile-love" : "tile-friend",
            )}
          >
            <p className="font-display text-xl font-semibold">
              {form.alias || "Alias"}, {form.age || "—"}
            </p>
            <p className="text-sm opacity-80">
              {form.area || "Area"} · preview
            </p>
            <p className="mt-2 font-display">{form.headline || "Headline"}</p>
            <p className="mt-1 line-clamp-3 text-sm">{form.seek}</p>
          </div>
          <label className="block space-y-1 text-sm">
            Private Instagram
            <input
              className="focus-ring w-full rounded-[16px] border border-white/30 bg-white/40 px-3 py-3 text-base dark:bg-black/20"
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              placeholder="@handle"
            />
          </label>
          <label className="block space-y-1 text-sm">
            Private phone
            <input
              className="focus-ring w-full rounded-[16px] border border-white/30 bg-white/40 px-3 py-3 text-base dark:bg-black/20"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              inputMode="tel"
            />
          </label>
          <PayBox
            amount={settings.listingFee}
            till={settings.tillNumber}
            reference="New listing"
            payerPhone={form.payerPhone}
            mpesaCode={form.mpesaCode}
            onPayerPhone={(v) => set("payerPhone", v)}
            onMpesaCode={(v) => set("mpesaCode", v)}
          />
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={form.over18}
              onChange={(e) => set("over18", e.target.checked)}
            />
            I am 18 or older
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5"
              checked={form.understands}
              onChange={(e) => set("understands", e.target.checked)}
            />
            I understand contact is only shared on paid unlock and my profile is reviewed first
          </label>
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
        <div className="space-y-4">
          <ol className="space-y-3 text-sm">
            <li className="glass rounded-[16px] px-4 py-3">Listing payment sent</li>
            <li className="glass rounded-[16px] px-4 py-3">Team reviews profile and payment</li>
            <li className="glass rounded-[16px] px-4 py-3">
              Your code: <strong>{code}</strong>
            </li>
          </ol>
          <a href="/me" className="btn-primary focus-ring inline-flex">
            My activity
          </a>
        </div>
      ) : null}
    </div>
  );
}
