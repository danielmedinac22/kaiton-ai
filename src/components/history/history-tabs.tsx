"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "workouts", label: "Entrenos" },
  { key: "plan", label: "Plan" },
  { key: "strava", label: "Strava" },
  { key: "settings", label: "Config" },
];

export function HistoryTabs({
  workoutsContent,
  planContent,
  stravaContent,
  settingsContent,
  defaultTab,
}: {
  workoutsContent: ReactNode;
  planContent: ReactNode;
  stravaContent: ReactNode;
  settingsContent: ReactNode;
  defaultTab?: string;
}) {
  const [active, setActive] = useState(defaultTab || "workouts");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 bg-[#102418] rounded-2xl p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              "flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider rounded-xl transition-all relative",
              active === tab.key
                ? "bg-[#1a2e22] text-[#5af0b3] shadow-[0_0_8px_rgba(90,240,179,0.15)]"
                : "text-[#85948b] hover:text-[#bbcac0]"
            )}
          >
            {tab.label}
            {active === tab.key && (
              <span className="absolute -bottom-0.5 left-1/4 right-1/4 h-0.5 bg-[#5af0b3] rounded-full shadow-[0_0_8px_rgba(90,240,179,0.5)]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {active === "workouts" && workoutsContent}
      {active === "plan" && planContent}
      {active === "strava" && stravaContent}
      {active === "settings" && settingsContent}
    </div>
  );
}
