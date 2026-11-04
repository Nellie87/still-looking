"use client";

import { ArrowLeft, ArrowRight, Flag } from "lucide-react";
import { cn } from "@/lib/cn";

/** End-of-trail pager: each page is a "stretch" shown as a stepping stone. */
export function TrailPager({
  page,
  pageCount,
  from,
  to,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const last = page >= pageCount;

  return (
    <nav className="trail-pager glass" aria-label="Pages">
      <p className="text-center text-sm text-muted">
        {last ? (
          <span className="inline-flex items-center gap-1.5">
            <Flag size={14} aria-hidden /> End of the trail · you&apos;ve seen all {total}
          </span>
        ) : (
          <>
            Stops {from}–{to} of {total}
          </>
        )}
      </p>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          className="trail-pager__arrow focus-ring"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous stretch"
        >
          <ArrowLeft size={18} />
        </button>

        <ol className="flex items-center gap-1.5">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <li key={n} className="flex items-center gap-1.5">
              {n > 1 ? <span className="trail-pager__dash" aria-hidden /> : null}
              <button
                type="button"
                className={cn("trail-pager__stone focus-ring", n === page && "is-active")}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Stretch ${n}`}
                onClick={() => onPage(n)}
              >
                {n}
              </button>
            </li>
          ))}
        </ol>

        <button
          type="button"
          className={cn("trail-pager__arrow focus-ring", !last && "is-next")}
          onClick={() => onPage(page + 1)}
          disabled={last}
          aria-label="Next stretch"
        >
          <ArrowRight size={18} />
        </button>
      </div>

      {!last ? (
        <button
          type="button"
          className="btn-primary focus-ring mt-4 w-full"
          onClick={() => onPage(page + 1)}
        >
          Keep walking <ArrowRight size={16} />
        </button>
      ) : null}
    </nav>
  );
}
