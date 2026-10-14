"use client";

import { EyeOff, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { Contact, PublicProfile, RequestStatus } from "@/lib/data/repo";
import { kindLabel } from "@/lib/search";
import { formatKes } from "@/lib/money";
import { cn } from "@/lib/cn";
import { Sheet } from "@/components/ui/Sheet";

export function Reader({
  open,
  profile,
  unlockFee,
  unlockStatus,
  contact,
  onClose,
  onHide,
  onInterested,
}: {
  open: boolean;
  profile: PublicProfile | null;
  unlockFee: number;
  unlockStatus: { status: RequestStatus | "none"; rejectReason?: string };
  contact: Contact | null;
  onClose: () => void;
  onHide: () => void;
  onInterested: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => setCopied(null), [profile?.code]);

  if (!profile) return null;
  const love = profile.kind === "love";

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <Sheet open={open} onClose={onClose} title={`${profile.alias}'s profile`}>
      <div className="space-y-4 pb-6">
        {contact ? (
          <div className="rounded-[22px] border border-green/30 bg-green/10 p-4">
            <p className="font-semibold text-green">Contact unlocked</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span>Instagram: {contact.instagram}</span>
                <button
                  type="button"
                  className="btn-ghost min-h-10 px-3 text-xs"
                  onClick={() => copy("ig", contact.instagram)}
                >
                  {copied === "ig" ? <Check size={14} /> : <Copy size={14} />} Copy
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Phone: {contact.phone}</span>
                <button
                  type="button"
                  className="btn-ghost min-h-10 px-3 text-xs"
                  onClick={() => copy("ph", contact.phone)}
                >
                  {copied === "ph" ? <Check size={14} /> : <Copy size={14} />} Copy
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <header
          className={cn(
            "rounded-[22px] p-4",
            love ? "bg-green text-[var(--ink-on-green)]" : "bg-orange text-[var(--ink-on-orange)]",
          )}
        >
          <p className="text-sm opacity-80">
            {profile.code} · {kindLabel(profile.kind)}
          </p>
          <h2 className="font-display text-2xl font-semibold">
            {profile.alias}, {profile.age}
          </h2>
          <p className="text-sm opacity-90">
            {profile.gender} · {profile.area}
          </p>
          <p className="mt-3 font-display text-lg leading-snug">{profile.headline}</p>
        </header>

        <section className="glass rounded-[22px] p-4">
          <h3 className="text-sm font-semibold text-muted">Looking for</h3>
          <p className="mt-1">{profile.seek}</p>
          {profile.seekMin != null || profile.seekMax != null ? (
            <p className="mt-2 text-sm text-muted">
              Ages {profile.seekMin ?? "18"}–{profile.seekMax ?? "99"}
            </p>
          ) : null}
        </section>

        <section className="space-y-3 font-[family-name:var(--font-newsreader)] text-lg leading-relaxed">
          {profile.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </section>

        <div className="flex flex-wrap gap-2">
          {profile.tags.map((t) => (
            <span key={t} className="chip pointer-events-none">
              {t}
            </span>
          ))}
        </div>

        {!contact ? (
          <section className="rounded-[22px] border border-dashed border-slate/30 bg-black/5 p-4 dark:bg-white/5">
            <h3 className="font-semibold">Kept private until unlocked</h3>
            <ul className="mt-2 list-inside list-disc text-sm text-muted">
              <li>Real name</li>
              <li>Photos</li>
              <li>Instagram and phone</li>
            </ul>
          </section>
        ) : null}

        {unlockStatus.status === "rejected" ? (
          <p className="rounded-[18px] bg-orange/20 p-3 text-sm">
            Not approved: {unlockStatus.rejectReason ?? "Payment not found"}. You can try again.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-white/20 pt-4">
          <button type="button" className="btn-ghost focus-ring" onClick={onClose}>
            Back
          </button>
          <button type="button" className="btn-ghost focus-ring" onClick={onHide}>
            <EyeOff size={16} /> Hide
          </button>
          {unlockStatus.status === "pending" ? (
            <button type="button" className="btn-primary focus-ring ml-auto" disabled>
              Request pending
            </button>
          ) : contact ? null : (
            <button type="button" className="btn-primary focus-ring ml-auto" onClick={onInterested}>
              I&apos;m interested
              <span className="opacity-80">· Unlock fee: {formatKes(unlockFee)} (sample)</span>
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
