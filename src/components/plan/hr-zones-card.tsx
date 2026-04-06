"use client";

import { useState } from "react";
import { Heart, Settings, MessageSquare, Loader2 } from "lucide-react";
import { recalculateZones } from "@/lib/actions/zones";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ZONE_COLORS: Record<number, string> = {
  1: "bg-[#5af0b3]/20 text-[#5af0b3]",
  2: "bg-[#5af0b3]/30 text-[#5af0b3]",
  3: "bg-[#f0d85a]/20 text-[#f0d85a]",
  4: "bg-[#f0925a]/20 text-[#f0925a]",
  5: "bg-[#f05a5a]/20 text-[#f05a5a]",
};

const ZONE_TEXT: Record<number, string> = {
  1: "text-[#5af0b3]",
  2: "text-[#5af0b3]",
  3: "text-[#f0d85a]",
  4: "text-[#f0925a]",
  5: "text-[#f05a5a]",
};

type Zone = { zoneNumber: number; name: string; minHr: number; maxHr: number };

export function HRZonesCard({
  zones,
  hasHrData,
}: {
  zones: Zone[];
  hasHrData: boolean;
}) {
  const router = useRouter();
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      await recalculateZones();
      router.refresh();
    } catch (e) {
      console.error("Calculate failed:", e);
    } finally {
      setCalculating(false);
    }
  };

  if (zones.length > 0) {
    return (
      <div className="bg-[#1a2e22] rounded-3xl p-5 border-l-4 border-[#ffccad]/30 space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-[#ffccad]" strokeWidth={1.5} />
          <p className="font-heading font-bold text-sm">Zonas de FC</p>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {zones.map((z) => (
            <div key={z.zoneNumber} className="text-center space-y-1">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${ZONE_COLORS[z.zoneNumber]}`}>
                Z{z.zoneNumber}
              </span>
              <p className={`font-mono text-xs ${ZONE_TEXT[z.zoneNumber]}`}>
                {z.minHr}-{z.maxHr}
              </p>
              <p className="text-[9px] text-[#85948b] uppercase tracking-wider">{z.name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hasHrData) {
    return (
      <div className="bg-[#1a2e22] rounded-3xl p-5 border-l-4 border-[#ffccad]/30 space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-[#ffccad]" strokeWidth={1.5} />
          <p className="font-heading font-bold text-sm">Zonas de FC</p>
        </div>
        <p className="text-sm text-[#85948b]">
          Tienes FC reposo y FC max configurados. Calcula tus zonas para ver los rangos.
        </p>
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="btn-gradient-warm px-5 py-2 rounded-full font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 flex items-center gap-2"
        >
          {calculating && <Loader2 className="h-4 w-4 animate-spin" />}
          Calcular zonas
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#1a2e22] rounded-3xl p-5 border-l-4 border-[#ffccad]/30 space-y-3">
      <div className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-[#ffccad]" strokeWidth={1.5} />
        <p className="font-heading font-bold text-sm">Zonas de FC</p>
      </div>
      <p className="text-sm text-[#85948b]">
        Necesitas configurar tu FC reposo y FC max para calcular tus zonas de entrenamiento.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="px-4 py-2 rounded-full border border-[#ffccad]/30 text-[#ffccad] text-xs font-semibold hover:bg-[#ffccad]/10 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Settings className="h-3.5 w-3.5" />
          Ir a Config
        </Link>
        <Link
          href="/coach"
          className="px-4 py-2 rounded-full border border-[#3c4a42] text-xs font-semibold text-[#bbcac0] hover:bg-[#1a2e22] active:scale-95 transition-all flex items-center gap-1.5"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Preguntale al Coach
        </Link>
      </div>
    </div>
  );
}
