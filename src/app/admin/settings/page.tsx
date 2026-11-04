"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, MessageSquareText, RotateCcw, Smartphone } from "lucide-react";
import { getRepo } from "@/lib/data";
import { resetMockState } from "@/lib/data/mockRepo";
import type { Settings } from "@/lib/data/repo";
import { formatKes } from "@/lib/money";
import { useToast } from "@/components/ui/Toast";
import { AdminCard, PageIntro } from "@/components/admin/ui";

const PLACEHOLDERS = [
  ["{handle}", "@requester"],
  ["{alias}", "Sunbird"],
  ["{code}", "SL-0101"],
  ["{instagram}", "@their_handle"],
  ["{phone}", "+2547…"],
] as const;

function preview(tpl: string) {
  return PLACEHOLDERS.reduce((s, [k, v]) => s.replaceAll(k, v), tpl);
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Banknote;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <AdminCard className="grid gap-5 md:grid-cols-[16rem_minmax(0,1fr)]">
      <div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-green/10 text-green">
          <Icon size={17} aria-hidden />
        </span>
        <h2 className="mt-2 font-display text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </AdminCard>
  );
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [saved, setSaved] = useState<Settings | null>(null);
  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const tplRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void getRepo()
      .getSettings()
      .then((s) => {
        setSaved(s);
        setForm(s);
      });
  }, []);

  if (!form || !saved) return <div className="admin-card h-64 animate-pulse" />;

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm({ ...form, [k]: v });

  function insert(token: string) {
    const el = tplRef.current;
    if (!el || !form) return;
    const start = el.selectionStart ?? form.dmTemplate.length;
    const end = el.selectionEnd ?? start;
    const next = form.dmTemplate.slice(0, start) + token + form.dmTemplate.slice(end);
    set("dmTemplate", next);
    queueMicrotask(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    await getRepo().updateSettings(form);
    setSaved(form);
    setSaving(false);
    toast("Settings saved", { ms: 2500 });
  }

  return (
    <div className="space-y-5 pb-20">
      <PageIntro
        title="Settings"
        description="Prices, payment details and the message you send when a contact is unlocked. Sample values until the owners set real ones."
      />

      <Section
        icon={Banknote}
        title="Pricing"
        description="What people pay to list themselves and to unlock someone's contact."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["listingFee", "Listing fee", "One-off, per profile"],
              ["unlockFee", "Unlock fee", "Per contact request"],
            ] as const
          ).map(([key, label, hint]) => (
            <label key={key} className="block text-sm">
              <span className="font-medium">{label}</span>
              <div className="relative mt-1.5">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">KES</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  inputMode="numeric"
                  className="admin-input w-full !pl-12"
                  value={form[key]}
                  onChange={(e) => set(key, Number(e.target.value))}
                />
              </div>
              <span className="mt-1 block text-xs text-muted">
                {hint} · shown as {formatKes(form[key] || 0)}
              </span>
            </label>
          ))}
        </div>
      </Section>

      <Section
        icon={Smartphone}
        title="Payments"
        description="Shown on the pay screen so people know where to send money and when to expect a reply."
      >
        <label className="block text-sm">
          <span className="font-medium">M-Pesa till number</span>
          <input
            className="admin-input mt-1.5 w-full font-mono tracking-wider"
            value={form.tillNumber}
            onChange={(e) => set("tillNumber", e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Response time promise</span>
          <input
            className="admin-input mt-1.5 w-full"
            value={form.responseTimeText}
            onChange={(e) => set("responseTimeText", e.target.value)}
          />
        </label>
      </Section>

      <Section
        icon={MessageSquareText}
        title="Unlock message"
        description="The DM you send after approving a contact unlock. Tap a placeholder to insert it where your cursor is."
      >
        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDERS.map(([k]) => (
            <button
              key={k}
              type="button"
              className="chip focus-ring !min-h-8 font-mono !text-xs"
              onClick={() => insert(k)}
            >
              {k}
            </button>
          ))}
        </div>
        <textarea
          ref={tplRef}
          className="admin-input min-h-36 w-full !rounded-2xl leading-relaxed"
          value={form.dmTemplate}
          onChange={(e) => set("dmTemplate", e.target.value)}
          aria-label="Unlock message template"
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Preview</p>
          <div className="mt-1.5 max-w-md rounded-[20px] rounded-bl-md bg-green p-3.5 text-sm leading-relaxed text-[var(--ink-on-green)] whitespace-pre-wrap">
            {preview(form.dmTemplate)}
          </div>
        </div>
      </Section>

      <Section
        icon={RotateCcw}
        title="Demo data"
        description="Everything in this preview is stored in your browser. Reset it to start over with the sample profiles and payments."
      >
        {confirmReset ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">This clears your local changes. Continue?</span>
            <button
              type="button"
              className="admin-action !border-red-500/30 !text-red-700"
              onClick={() => {
                resetMockState();
                router.push("/admin");
              }}
            >
              Yes, reset
            </button>
            <button type="button" className="admin-action" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="btn-ghost focus-ring w-fit" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} /> Reset demo data
          </button>
        )}
      </Section>

      {/* Sticky save bar appears only when something changed */}
      {dirty ? (
        <div className="admin-savebar">
          <p className="text-sm">You have unsaved changes</p>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost focus-ring !min-h-10" onClick={() => setForm(saved)}>
              Discard
            </button>
            <button
              type="button"
              className="btn-primary focus-ring !min-h-10"
              disabled={saving}
              onClick={() => void save()}
            >
              Save settings
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
