"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // silencioso: PWA é progressive enhancement, não deve quebrar o app
      });
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
