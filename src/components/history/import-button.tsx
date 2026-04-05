"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { importAllData } from "@/lib/actions/import";
import { useRouter } from "next/navigation";

export function ImportButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importAllData(data);
      setResult("Importado!");
      router.refresh();
    } catch {
      setResult("Error");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input ref={fileRef} type="file" accept=".json" onChange={handleFile} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="px-4 py-2 rounded-full border border-[#3c4a42] text-xs font-semibold text-[#bbcac0] hover:bg-[#1a2e22] active:scale-95 transition-all disabled:opacity-40 flex items-center gap-1.5"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        Importar
      </button>
      {result && (
        <span className={`text-[10px] font-bold ${result === "Importado!" ? "text-[#5af0b3]" : "text-[#ffb4ab]"}`}>
          {result}
        </span>
      )}
    </div>
  );
}
