"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";

/** Mounts on the marketing page; if a session is found, swap to /dashboard. */
export default function LandingRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (getSession()) router.replace("/dashboard");
  }, [router]);
  return null;
}
