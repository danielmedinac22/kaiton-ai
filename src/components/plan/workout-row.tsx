"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import type { WorkoutSegment } from "@/lib/types";

const ZONE_COLORS: Record<string, string> = {
  Z1: "bg-[#5af0b3]/20 text-[#5af0b3]",
  Z2: "bg-[#5af0b3]/30 text-[#5af0b3]",
  Z3: "bg-[#f0d85a]/20 text-[#f0d85a]",
  Z4: "bg-[#f0925a]/20 text-[#f0925a]",
  Z5: "bg-[#f05a5a]/20 text-[#f05a5a]",
};

const ZONE_BAR_COLORS: Record<string, string> = {
  Z1: "bg-[#5af0b3]/30",
  Z2: "bg-[#5af0b3]/50",
  Z3: "bg-[#f0d85a]/40",
  Z4: "bg-[#f0925a]/40",
  Z5: "bg-[#f05a5a]/40",
};

export function WorkoutRow({
  date,
  title,
  completed,
  targetDistanceKm,
  targetHrZone,
  targetRpe,
  segments,
}: {
  date: string;
  title: string;
  completed: boolean;
  targetDistanceKm: number | null;
  targetHrZone: string | null;
  targetRpe: number | null;
  segments: WorkoutSegment[];
}) {
  const [expanded, setExpanded] = useState(false);
  const hasSegments = segments.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => hasSegments && setExpanded(!expanded)}
        className={`w-full flex items-center justify-between py-1.5 text-sm text-left ${
          hasSegments ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {completed ? (
            <CheckCircle2 className="h-4 w-4 text-[#5af0b3] shrink-0" strokeWidth={2} />
          ) : (
            <div className="h-4 w-4 rounded-full border border-[#3c4a42] shrink-0" />
          )}
          <span className="text-[11px] text-[#85948b] w-12">{date}</span>
          <span className={completed ? "text-[#85948b] line-through" : "text-[#d0e8d6]"}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] text-[#85948b]">
          {targetDistanceKm && <span>{targetDistanceKm} km</span>}
          {targetHrZone && <span>{targetHrZone}</span>}
          {targetRpe && <span>RPE {targetRpe}</span>}
          {hasSegments && (
            <ChevronDown
              className={`h-3.5 w-3.5 text-[#85948b] transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
              strokeWidth={1.5}
            />
          )}
        </div>
      </button>

      {expanded && hasSegments && (
        <div className="ml-[26px] pl-4 border-l border-[#3c4a42]/50 mt-1 mb-2 space-y-1">
          {segments.map((seg, i) => {
            const totalMin = segments.reduce((s, x) => s + x.durationMinutes, 0);
            const widthPct = totalMin > 0 ? (seg.durationMinutes / totalMin) * 100 : 0;
            const zoneColor = ZONE_COLORS[seg.zone] ?? "bg-[#293e31] text-[#bbcac0]";
            const barColor = ZONE_BAR_COLORS[seg.zone] ?? "bg-[#293e31]";

            return (
              <div key={i} className="flex items-center gap-3 py-1">
                <div
                  className={`h-1.5 rounded-full ${barColor}`}
                  style={{ width: `${Math.max(widthPct, 8)}%`, minWidth: "12px" }}
                />
                <span className="text-xs text-[#bbcac0] min-w-[100px]">{seg.name}</span>
                <span className="text-[11px] text-[#85948b]">{seg.durationMinutes} min</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${zoneColor}`}>
                  {seg.zone}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
