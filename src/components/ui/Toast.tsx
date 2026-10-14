"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: string; message: string; actionLabel?: string; onAction?: () => void };

type ToastCtx = {
  toast: (message: string, opts?: { actionLabel?: string; onAction?: () => void; ms?: number }) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback(
    (message: string, opts?: { actionLabel?: string; onAction?: () => void; ms?: number }) => {
      const id = Math.random().toString(36).slice(2);
      const item: Toast = {
        id,
        message,
        actionLabel: opts?.actionLabel,
        onAction: opts?.onAction,
      };
      setItems((prev) => [...prev, item]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id));
      }, opts?.ms ?? 6000);
    },
    [],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--nav-h)+var(--safe-bottom)+12px)] z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto glass flex max-w-md items-center gap-3 rounded-full px-4 py-3 text-sm shadow-lg"
          >
            <span>{t.message}</span>
            {t.actionLabel && t.onAction ? (
              <button
                type="button"
                className="font-semibold text-green underline focus-ring rounded"
                onClick={() => {
                  t.onAction?.();
                  setItems((prev) => prev.filter((x) => x.id !== t.id));
                }}
              >
                {t.actionLabel}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast needs ToastProvider");
  return ctx;
}
