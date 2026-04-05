"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { exportAllData } from "@/lib/actions/export";

export function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kaiton-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="px-4 py-2 rounded-full border border-[#3c4a42] text-xs font-semibold text-[#bbcac0] hover:bg-[#1a2e22] active:scale-95 transition-all disabled:opacity-40 flex items-center gap-1.5"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      Exportar
    </button>
  );
}
