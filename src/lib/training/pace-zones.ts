/**
 * Estimate pace ranges per training zone based on athlete's PRs or goal time.
 * Uses half-marathon pace as the reference baseline.
 */

const DISTANCE_KM: Record<string, number> = {
  "5k": 5,
  "10k": 10,
  half_marathon: 21.0975,
  marathon: 42.195,
  ultra: 50,
};

// Zone multipliers relative to half marathon race pace.
// Higher = slower pace (more sec/km). Z1 is slowest, Z5 is fastest.
const ZONE_PACE_MULTIPLIERS: Record<string, { min: number; max: number }> = {
  Z1: { min: 1.30, max: 1.40 },
  Z2: { min: 1.15, max: 1.30 },
  Z3: { min: 1.05, max: 1.15 },
  Z4: { min: 0.95, max: 1.05 },
  Z5: { min: 0.85, max: 0.95 },
};

// Conversion factors to normalize any PR to half-marathon equivalent pace.
// e.g., 10k pace * 1.06 ≈ half marathon pace
const TO_HALF_PACE_FACTOR: Record<string, number> = {
  "5k": 1.12,
  "10k": 1.06,
  half_marathon: 1.0,
  marathon: 0.97,
};

function parseTimeToSeconds(time: string): number | null {
  if (!time) return null;
  const parts = time.split(":").map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

function formatPace(secondsPerKm: number): string {
  const min = Math.floor(secondsPerKm / 60);
  const sec = Math.round(secondsPerKm % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export type PaceZones = Record<string, { minPace: string; maxPace: string }>;

export function estimatePacePerZone(opts: {
  pr5k?: string | null;
  pr10k?: string | null;
  prHalf?: string | null;
  prMarathon?: string | null;
  goalRaceTime?: string | null;
  goalRaceDistance?: string | null;
}): PaceZones | null {
  // Try to find a reference pace from PRs (priority: half > 10k > 5k > marathon)
  const prs: [string | null | undefined, string][] = [
    [opts.prHalf, "half_marathon"],
    [opts.pr10k, "10k"],
    [opts.pr5k, "5k"],
    [opts.prMarathon, "marathon"],
  ];

  let refPaceSecPerKm: number | null = null;

  for (const [time, dist] of prs) {
    if (!time) continue;
    const secs = parseTimeToSeconds(time);
    const km = DISTANCE_KM[dist];
    if (secs && km) {
      const pacePerKm = secs / km;
      const factor = TO_HALF_PACE_FACTOR[dist] ?? 1.0;
      refPaceSecPerKm = pacePerKm * factor;
      break;
    }
  }

  // Fallback: use goal race time if no PRs
  if (!refPaceSecPerKm && opts.goalRaceTime && opts.goalRaceDistance) {
    const secs = parseTimeToSeconds(opts.goalRaceTime);
    const km = DISTANCE_KM[opts.goalRaceDistance] ?? (opts.goalRaceDistance ? Number(opts.goalRaceDistance) : null);
    if (secs && km) {
      const pacePerKm = secs / km;
      const factor = TO_HALF_PACE_FACTOR[opts.goalRaceDistance] ?? 1.0;
      refPaceSecPerKm = pacePerKm * factor;
    }
  }

  if (!refPaceSecPerKm) return null;

  const result: PaceZones = {};
  for (const [zone, mult] of Object.entries(ZONE_PACE_MULTIPLIERS)) {
    // For pace: higher multiplier = slower = more sec/km = maxPace
    // Lower multiplier = faster = fewer sec/km = minPace
    result[zone] = {
      minPace: formatPace(refPaceSecPerKm * mult.min),
      maxPace: formatPace(refPaceSecPerKm * mult.max),
    };
  }

  return result;
}
