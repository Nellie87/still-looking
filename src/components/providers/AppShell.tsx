"use client";

import { useEffect, useState } from "react";
import { Backdrop } from "@/components/layout/Backdrop";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { ToastProvider } from "@/components/ui/Toast";
import { getRepo } from "@/lib/data";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    void getRepo()
      .getMyActivity()
      .then((a) => setPending(a.pendingCount));
    const id = window.setInterval(() => {
      void getRepo()
        .getMyActivity()
        .then((a) => setPending(a.pendingCount));
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <ToastProvider>
      <Backdrop />
      <TopBar pendingCount={pending} />
      <main className="flex-1">{children}</main>
      <BottomNav pendingCount={pending} />
    </ToastProvider>
  );
}
