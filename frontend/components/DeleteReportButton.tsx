"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteReport } from "@/lib/api";
import { getSession } from "@/lib/session";

export default function DeleteReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming((c) => (c ? false : c)), 3000);
      return;
    }
    setBusy(true);
    try {
      const session = getSession();
      await deleteReport(reportId, session?.email);
      router.push("/dashboard");
    } catch {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
        confirming
          ? "border-lose bg-lose text-white"
          : "border-ink-200 bg-white text-ink-600 hover:border-lose hover:text-lose"
      }`}
    >
      {busy ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Deleting…
        </>
      ) : confirming ? (
        <>
          <Trash2 className="h-3.5 w-3.5" />
          Click again to confirm
        </>
      ) : (
        <>
          <Trash2 className="h-3.5 w-3.5" />
          Delete report
        </>
      )}
    </button>
  );
}
