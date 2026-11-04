"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  headerExtra,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Pinned to the bottom of the panel, outside the scroll area. */
  footer?: React.ReactNode;
  /** Extra controls shown in the title bar, before the close button. */
  headerExtra?: React.ReactNode;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  /* Latest onClose without re-running the focus setup on every render */
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onClose = () => closeRef.current();
    lastFocus.current = document.activeElement as HTMLElement;
    const panel = panelRef.current;
    const getFocusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    getFocusables()[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const list = getFocusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      lastFocus.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="sheet-scrim absolute inset-0"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "sheet-panel relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[30px] md:max-h-[88dvh] md:max-w-xl md:rounded-[30px]",
          className,
        )}
      >
        <div className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-black/15 md:hidden" aria-hidden />
        {title ? (
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-3 md:px-6 md:pt-5">
            <p className="min-w-0 truncate font-display text-lg font-semibold">{title}</p>
            <div className="flex shrink-0 items-center gap-1.5">
            {headerExtra}
            <button
              type="button"
              className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10"
              aria-label="Close"
              onClick={onClose}
            >
              <X size={18} />
            </button>
            </div>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-2 md:px-6">
          {children}
        </div>
        {footer ? (
          <div
            className="sheet-footer shrink-0 px-5 py-3 md:px-6 md:py-4"
            style={{ paddingBottom: "max(0.75rem, var(--safe-bottom))" }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
