"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Deep link: send visitors to browse with the profile opened via query. */
export default function ProfileDeepLinkPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  useEffect(() => {
    if (code) router.replace(`/browse?open=${encodeURIComponent(code)}`);
  }, [code, router]);

  return <p className="p-6 text-muted">Opening profile…</p>;
}
