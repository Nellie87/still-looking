"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import type { PublicProfile } from "@/lib/data/repo";
import { cn } from "@/lib/cn";

function RingsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="12" r="5.25" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="15" cy="12" r="5.25" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

type Pt = { x: number; y: number };

/**
 * Winding trail: elongated pills alternate sides along a dotted S-curve.
 * Desktop: [card + bubble] — tail — node — [alias / age / area].
 * Mobile:  same zigzag, node on the card's edge, alias and age inside the card.
 * `end` is rendered as the final stop the trail runs into (used for paging).
 */
export function WindingPath({
  items,
  unlocked,
  onOpen,
  startIndex = 0,
  end,
  seen,
}: {
  items: PublicProfile[];
  unlocked: Set<string>;
  onOpen: (code: string) => void;
  /** Index of the first item overall, so stops keep alternating across pages. */
  startIndex?: number;
  end?: React.ReactNode;
  /** Codes the visitor has opened before; marked with a small "Seen" tag. */
  seen?: Set<string>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const endRef = useRef<HTMLSpanElement | null>(null);
  const [pathD, setPathD] = useState("");
  const [startPt, setStartPt] = useState<Pt | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const hasEnd = !!end;

  const centre = (el: Element, rootBox: DOMRect): Pt => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - rootBox.left, y: r.top + r.height / 2 - rootBox.top };
  };

  const draw = () => {
    const root = rootRef.current;
    if (!root) return;
    const rootBox = root.getBoundingClientRect();
    const pts = markerRefs.current
      .slice(0, items.length)
      .filter((el): el is HTMLSpanElement => !!el)
      .map((el) => centre(el, rootBox));
    if (hasEnd && endRef.current) pts.push(centre(endRef.current, rootBox));
    const w = rootBox.width;
    const h = root.scrollHeight;
    setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
    if (pts.length < 1) {
      setPathD("");
      setStartPt(null);
      return;
    }

    /* The trail starts from a small dot at the top centre */
    const first = pts[0];
    const start = { x: rootBox.width >= 720 ? rootBox.width / 2 : first.x, y: 8 };
    setStartPt((prev) => (prev && prev.x === start.x && prev.y === start.y ? prev : start));
    let d = `M ${start.x} ${start.y} C ${start.x} ${start.y + 30}, ${first.x} ${first.y - 40}, ${first.x} ${first.y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const dy = b.y - a.y;
      d += ` C ${a.x} ${a.y + dy * 0.55}, ${b.x} ${b.y - dy * 0.55}, ${b.x} ${b.y}`;
    }
    setPathD(d);
  };

  useLayoutEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, hasEnd]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    void document.fonts?.ready.then(draw);
    const root = rootRef.current;
    const ro = new ResizeObserver(() => draw());
    if (root) ro.observe(root);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, hasEnd]);

  return (
    <div ref={rootRef} className="path-stage relative mx-auto w-full">
      <svg
        className="pointer-events-none absolute inset-0 z-0"
        width={size.w || "100%"}
        height={size.h || "100%"}
        aria-hidden
      >
        {pathD ? (
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="0 11"
            className="text-slate/55"
          />
        ) : null}
        {startPt ? (
          <circle
            cx={startPt.x}
            cy={startPt.y}
            r={8}
            className="fill-slate/70 stroke-white/80"
            strokeWidth={3}
          />
        ) : null}
      </svg>

      <ol className="relative z-10 flex flex-col gap-12 pb-4 pt-10 md:gap-[3.25rem] md:pt-6">
        {items.map((p, i) => {
          const cardLeft = (startIndex + i) % 2 === 0;
          const love = p.kind === "love";

          return (
            <li
              key={p.code}
              className={cn(
                "path-stop path-enter",
                cardLeft ? "path-stop--left" : "path-stop--right",
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="path-stop__meta">
                <p className="path-stop__alias">{p.alias}</p>
                <p
                  className={cn(
                    "path-stop__age",
                    love ? "text-green" : "text-[var(--orange-deep)]",
                  )}
                >
                  {p.age}
                </p>
                <p className="path-stop__place">
                  {p.area} · {p.code}
                </p>
              </div>

              <div className="path-stop__spine" aria-hidden>
                <span
                  className={cn(
                    "path-stop__diamond",
                    love ? "path-stop__diamond--love" : "path-stop__diamond--friend",
                  )}
                />
                <span
                  ref={(el) => {
                    markerRefs.current[i] = el;
                  }}
                  className="path-stop__node"
                >
                  <span
                    className={cn("path-stop__node-ring", love ? "border-green" : "border-orange")}
                  />
                  <span className={cn("path-stop__node-dot", love ? "bg-green" : "bg-orange")} />
                </span>
              </div>

              <div className="path-stop__main">
                <button
                  type="button"
                  className={cn(
                    "path-card focus-ring",
                    love ? "tile-love" : "tile-friend",
                    seen?.has(p.code) && "is-seen",
                  )}
                  aria-label={`Read ${p.alias}'s profile: ${p.headline}`}
                  onClick={() => onOpen(p.code)}
                >
                  <span className="path-card__body">
                    {/* Compact meta shown inside the card on small screens */}
                    <span className="path-card__mini" aria-hidden>
                      <span className="path-card__mini-age">{p.age}</span>
                      <span className="min-w-0 truncate">
                        <span className="font-semibold">{p.alias}</span> · {p.area}
                      </span>
                    </span>
                    <span className="path-stop__headline">{p.headline}</span>
                    <span className="path-stop__seek">{p.seek}</span>
                    <span className="path-stop__tags">
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} className="path-stop__tag">
                          {t}
                        </span>
                      ))}
                      {seen?.has(p.code) && !unlocked.has(p.code) ? (
                        <span className="path-stop__tag path-stop__tag--seen">Seen</span>
                      ) : null}
                      {unlocked.has(p.code) ? (
                        <span className="path-stop__tag path-stop__tag--unlocked">Unlocked</span>
                      ) : null}
                    </span>
                  </span>

                  <span
                    className={cn(
                      "path-stop__connector",
                      love ? "text-green" : "text-[var(--orange-deep)]",
                    )}
                    aria-hidden
                  >
                    {love ? <Heart size={30} fill="currentColor" /> : <RingsIcon size={40} />}
                  </span>
                </button>
              </div>
            </li>
          );
        })}

        {end ? (
          <li className="path-end">
            <span ref={endRef} className="path-end__node" aria-hidden />
            {end}
          </li>
        ) : null}
      </ol>
    </div>
  );
}
