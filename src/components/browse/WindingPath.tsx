"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Heart, Users } from "lucide-react";
import type { PublicProfile } from "@/lib/data/repo";
import { cn } from "@/lib/cn";

export function WindingPath({
  items,
  unlocked,
  onOpen,
}: {
  items: PublicProfile[];
  unlocked: Set<string>;
  onOpen: (code: string) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const markerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [pathD, setPathD] = useState("");
  const [size, setSize] = useState({ w: 0, h: 0 });

  const draw = () => {
    const root = listRef.current;
    if (!root) return;
    const rootBox = root.getBoundingClientRect();
    const pts = markerRefs.current
      .filter(Boolean)
      .map((el) => {
        const r = el!.getBoundingClientRect();
        return {
          x: r.left + r.width / 2 - rootBox.left,
          y: r.top + r.height / 2 - rootBox.top,
        };
      });
    setSize({ w: rootBox.width, h: root.scrollHeight });
    if (pts.length < 1) {
      setPathD("");
      return;
    }
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const cur = pts[i];
      const midY = (prev.y + cur.y) / 2;
      d += ` C ${prev.x} ${midY}, ${cur.x} ${midY}, ${cur.x} ${cur.y}`;
    }
    setPathD(d);
  };

  useLayoutEffect(() => {
    draw();
  }, [items]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    void document.fonts?.ready.then(draw);
    const ro = new ResizeObserver(draw);
    if (listRef.current) ro.observe(listRef.current);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [items]);

  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute inset-0 z-0"
        width={size.w}
        height={size.h}
        aria-hidden
      >
        {pathD ? (
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="0 13"
            className="text-slate/50"
          />
        ) : null}
      </svg>
      <ol ref={listRef} className="relative z-10 flex flex-col gap-10 py-4">
        {items.map((p, i) => {
          const left = i % 2 === 0;
          const love = p.kind === "love";
          return (
            <li
              key={p.code}
              className={cn(
                "grid items-center gap-3 opacity-0 animate-[fadeIn_0.4s_ease_forwards]",
                "grid-cols-[28px_1fr] min-[700px]:grid-cols-[1fr_40px_1fr]",
              )}
              style={{ animationDelay: `${Math.min(i * 40, 240)}ms` }}
            >
              <button
                type="button"
                className={cn(
                  "pill glass focus-ring col-start-2 row-start-1 min-[700px]:col-start-auto text-left rounded-[999px] px-5 py-4",
                  left ? "min-[700px]:col-start-1 min-[700px]:justify-self-end" : "min-[700px]:col-start-3",
                  love ? "border-green/30" : "border-orange/40",
                )}
                aria-label={`Read ${p.alias}'s profile: ${p.headline}`}
                onClick={() => onOpen(p.code)}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white",
                      love ? "text-green" : "text-orange",
                    )}
                  >
                    {love ? <Heart size={18} fill="currentColor" /> : <Users size={18} />}
                  </span>
                  <div>
                    <p className="font-display font-semibold leading-snug">{p.headline}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{p.seek}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.tags.slice(0, 2).map((t) => (
                        <span key={t} className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                          {t}
                        </span>
                      ))}
                      {unlocked.has(p.code) ? (
                        <span className="rounded-full bg-green/15 px-2 py-0.5 text-xs text-green">Unlocked</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
              <span
                ref={(el) => {
                  markerRefs.current[i] = el;
                }}
                className={cn(
                  "row-start-1 col-start-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate/40 bg-white min-[700px]:col-start-2 min-[700px]:justify-self-center",
                )}
                aria-hidden
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", love ? "bg-green" : "bg-orange")} />
              </span>
              <div
                className={cn(
                  "col-start-2 min-[700px]:col-start-auto text-sm",
                  left ? "min-[700px]:col-start-3" : "min-[700px]:col-start-1 min-[700px]:justify-self-end min-[700px]:text-right",
                  "hidden min-[700px]:block",
                )}
              >
                <p className="font-display text-3xl font-semibold leading-none">{p.age}</p>
                <p className="mt-1 font-medium">{p.alias}</p>
                <p className="text-muted">
                  {p.area} · {p.code}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      </div>
  );
}
