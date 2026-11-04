"use client";

import { Check, ChevronLeft, ChevronRight, Copy, Heart, Lock, MapPin, ThumbsDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Contact, PublicProfile, RequestStatus } from "@/lib/data/repo";
import { kindLabel } from "@/lib/search";
import { formatKes } from "@/lib/money";
import { cn } from "@/lib/cn";
import { Sheet } from "@/components/ui/Sheet";

function RingsIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="12" r="5.25" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="15" cy="12" r="5.25" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function Reader({
  open,
  profile,
  unlockFee,
  unlockStatus,
  contact,
  onClose,
  onHide,
  onInterested,
  position,
  onPrev,
  onNext,
  direction = 0,
}: {
  open: boolean;
  profile: PublicProfile | null;
  unlockFee: number;
  unlockStatus: { status: RequestStatus | "none"; rejectReason?: string };
  contact: Contact | null;
  onClose: () => void;
  onHide: () => void;
  onInterested: () => void;
  /** Where this profile sits in the current trail, for "3 of 11". */
  position?: { index: number; total: number } | null;
  onPrev?: () => void;
  onNext?: () => void;
  /** Which way we moved, for the slide-in animation. */
  direction?: 0 | 1 | -1;
}) {
  /* Remember which profile the "copied" tick belongs to, so it resets on switch */
  const [copied, setCopied] = useState<{ code: string; label: string } | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  /* Arrow keys move between profiles (not while typing) */
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onPrev, onNext]);

  /* New profile: start at the top */
  useEffect(() => {
    bodyRef.current?.closest(".overflow-y-auto")?.scrollTo({ top: 0 });
  }, [profile?.code]);

  if (!profile) return null;
  const love = profile.kind === "love";
  const copiedLabel = copied?.code === profile.code ? copied.label : null;

  async function copy(label: string, value: string) {
    if (!profile) return;
    await navigator.clipboard.writeText(value);
    setCopied({ code: profile.code, label });
    window.setTimeout(() => setCopied(null), 1500);
  }

  const footer = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="btn-ghost focus-ring shrink-0 whitespace-nowrap !px-3.5"
        onClick={onHide}
        aria-label={`Not for me: hide ${profile.alias} from my trail`}
      >
        <ThumbsDown size={16} /> Not for me
      </button>
      {unlockStatus.status === "pending" ? (
        <button type="button" className="btn-primary focus-ring ml-auto" disabled>
          Request pending review
        </button>
      ) : contact ? (
        <button type="button" className="btn-primary focus-ring ml-auto" onClick={onClose}>
          Done
        </button>
      ) : (
        <button
          type="button"
          className="btn-primary focus-ring ml-auto min-w-0 flex-col !gap-0 leading-tight sm:flex-row sm:!gap-2"
          onClick={onInterested}
        >
          <span>I&apos;m interested</span>
          <span className="text-xs font-medium opacity-80 sm:text-sm">
            Unlock fee {formatKes(unlockFee)} (sample)
          </span>
        </button>
      )}
    </div>
  );

  const nav =
    position && (onPrev || onNext) ? (
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="reader-nav focus-ring"
          onClick={onPrev}
          disabled={!onPrev}
          aria-label="Previous profile"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-[3.25rem] text-center text-xs tabular-nums text-muted" aria-live="polite">
          {position.index + 1} of {position.total}
        </span>
        <button
          type="button"
          className="reader-nav focus-ring"
          onClick={onNext}
          disabled={!onNext}
          aria-label="Next profile"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    ) : null;

  return (
    <Sheet open={open} onClose={onClose} title={profile.alias} footer={footer} headerExtra={nav}>
      <div
        ref={bodyRef}
        key={profile.code}
        className={cn(
          "space-y-5",
          direction === 1 && "reader-slide-next",
          direction === -1 && "reader-slide-prev",
        )}
        onTouchStart={(e) => {
          const t = e.touches[0];
          touch.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          /* A clear sideways swipe, not a scroll */
          if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
          if (dx < 0) onNext?.();
          else onPrev?.();
        }}
      >
        <header className={cn("reader-hero", love ? "reader-hero--love" : "reader-hero--friend")}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] opacity-80">
                <span className="reader-hero__badge" aria-hidden>
                  {love ? <Heart size={13} fill="currentColor" /> : <RingsIcon size={15} />}
                </span>
                {kindLabel(profile.kind)} · {profile.code}
              </p>
              <p className="mt-2 font-display text-2xl font-semibold">{profile.alias}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm opacity-85">
                <MapPin size={14} aria-hidden /> {profile.area} · {profile.gender}
              </p>
            </div>
            <p className="font-display text-5xl font-extrabold leading-none tracking-tight">
              {profile.age}
            </p>
          </div>
          <p className="mt-4 font-display text-xl font-semibold leading-snug">{profile.headline}</p>
        </header>

        {position && (onPrev || onNext) ? (
          <p className="text-center text-xs text-muted md:hidden">Swipe left or right for the next person</p>
        ) : null}

        {contact ? (
          <section className="rounded-[22px] border border-green/25 bg-green/10 p-4">
            <p className="font-semibold text-green">Contact unlocked</p>
            <div className="mt-3 space-y-2 text-sm">
              {(
                [
                  ["ig", "Instagram", contact.instagram],
                  ["ph", "Phone", contact.phone],
                ] as const
              ).map(([key, label, value]) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span>
                    <span className="text-muted">{label}:</span> {value}
                  </span>
                  <button
                    type="button"
                    className="btn-ghost focus-ring min-h-10 px-3 text-xs"
                    onClick={() => copy(key, value)}
                  >
                    {copiedLabel === key ? <Check size={14} /> : <Copy size={14} />} Copy
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="reader-card">
          <h3 className="reader-label">Looking for</h3>
          <p className="mt-1.5 leading-relaxed">{profile.seek}</p>
          {profile.seekMin != null || profile.seekMax != null ? (
            <p className="mt-3 inline-flex rounded-full bg-black/5 px-3 py-1 text-sm text-muted dark:bg-white/10">
              Ages {profile.seekMin ?? "18"} to {profile.seekMax ?? "99"}
            </p>
          ) : null}
        </section>

        <section>
          <h3 className="reader-label">In their words</h3>
          <div className="mt-2 space-y-3 font-[family-name:var(--font-newsreader)] text-[1.15rem] leading-relaxed">
            {profile.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {profile.tags.map((t) => (
            <span key={t} className="chip pointer-events-none capitalize">
              {t}
            </span>
          ))}
        </div>

        {!contact && unlockStatus.status === "pending" ? (
          <section className="rounded-[22px] border border-orange/40 bg-orange/10 p-4">
            <p className="font-semibold">Your request is with the team</p>
            <p className="mt-1 text-sm text-muted">
              Once your payment is confirmed, {profile.alias}&apos;s contact shows up right here and
              we DM it to your Instagram.
            </p>
          </section>
        ) : null}

        {!contact && unlockStatus.status !== "pending" ? (
          <section className="rounded-[22px] border border-dashed border-slate/30 p-4">
            <div className="flex gap-3">
              <Lock size={18} className="mt-0.5 shrink-0 text-muted" aria-hidden />
              <div>
                <h3 className="font-semibold">How to connect with {profile.alias}</h3>
                <p className="mt-1 text-sm text-muted">
                  Their real name, photos, Instagram and phone stay private. Pay the{" "}
                  {formatKes(unlockFee)} unlock fee, the team confirms it, and you get their
                  contact by DM.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {unlockStatus.status === "rejected" ? (
          <p className="rounded-[18px] bg-orange/20 p-3 text-sm">
            Your last request wasn&apos;t approved: {unlockStatus.rejectReason ?? "Payment not found"}.
            You can try again.
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}
