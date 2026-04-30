"use client";

import { useEffect } from "react";
import { useAuth } from "@/store/useAuth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAuth((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <>{children}</>;
}
