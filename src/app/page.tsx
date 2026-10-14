import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-2xl flex-col justify-center px-5 pb-28 pt-10 md:pb-10">
      <p className="font-display text-5xl font-semibold tracking-tight md:text-6xl">Still Looking</p>
      <p className="mt-4 max-w-md text-lg text-muted">
        Anonymous profiles from the podcast team. Browse, filter, and unlock a contact after a
        verified payment.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/browse" className="btn-primary focus-ring">
          Browse profiles
        </Link>
        <Link href="/list" className="btn-ghost focus-ring">
          List yourself
        </Link>
      </div>
    </div>
  );
}
