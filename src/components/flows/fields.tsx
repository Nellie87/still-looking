"use client";

import { Check } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/cn";

/** Label + control + hint/error + optional character counter. */
export function Field({
  label,
  hint,
  error,
  count,
  max,
  optional,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  count?: number;
  max?: number;
  optional?: boolean;
  children: (id: string, describedBy: string | undefined) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const msgId = `${id}-msg`;
  const hasMsg = !!(error || hint);
  return (
    <div className={cn("block", className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {optional ? <span className="ml-1 font-normal text-muted">(optional)</span> : null}
        </label>
        {max != null && count != null ? (
          <span
            className={cn("text-xs tabular-nums", count > max ? "text-red-700" : "text-muted")}
            aria-live="polite"
          >
            {count}/{max}
          </span>
        ) : null}
      </div>
      {children(id, hasMsg ? msgId : undefined)}
      {error ? (
        <p id={msgId} className="mt-1.5 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Big tappable checkbox row. */
export function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("check-row", checked && "is-on")}>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="check-row__box" aria-hidden>
        <Check size={14} strokeWidth={3} />
      </span>
      <span className="text-sm leading-snug">{children}</span>
    </label>
  );
}

/** Horizontal progress for multi-step flows. */
export function StepProgress({
  steps,
  current,
  tone = "green",
}: {
  steps: string[];
  current: number;
  tone?: "green" | "orange";
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Step {Math.min(current + 1, steps.length)} of {steps.length}
        </span>
        <span className="font-medium text-fg">{steps[Math.min(current, steps.length - 1)]}</span>
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {steps.map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= current
                ? tone === "green"
                  ? "bg-green"
                  : "bg-orange"
                : "bg-black/10 dark:bg-white/15",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** Vertical tracker: done / current / upcoming. */
export function Tracker({ items, current }: { items: { title: string; body?: string }[]; current: number }) {
  return (
    <ol className="tracker">
      {items.map((it, i) => {
        const state = i < current ? "done" : i === current ? "now" : "next";
        return (
          <li key={it.title} className={cn("tracker__item", `is-${state}`)}>
            <span className="tracker__dot" aria-hidden>
              {state === "done" ? <Check size={13} strokeWidth={3} /> : i + 1}
            </span>
            <div>
              <p className="font-medium">
                {it.title}
                <span className="sr-only">
                  {state === "done" ? " (done)" : state === "now" ? " (in progress)" : ""}
                </span>
              </p>
              {it.body ? <p className="mt-0.5 text-sm text-muted">{it.body}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
