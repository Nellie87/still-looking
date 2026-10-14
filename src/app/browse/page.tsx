import { Suspense } from "react";
import BrowseClient from "./BrowseClient";

export default function BrowsePage() {
  return (
    <Suspense fallback={<p className="p-6 text-muted">Loading board…</p>}>
      <BrowseClient />
    </Suspense>
  );
}
