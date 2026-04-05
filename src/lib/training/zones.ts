/**
 * Karvonen Heart Rate Zone Calculation
 * Target HR = ((Max HR - Resting HR) × % Intensity) + Resting HR
 */

export type HRZone = {
  zoneNumber: number;
  name: string;
  minHr: number;
  maxHr: number;
  description: string;
};

const ZONE_DEFINITIONS = [
  {
    zone: 1,
    name: "Recovery",
    minPct: 0.5,
    maxPct: 0.6,
    description: "Recuperacion activa, muy comodo, puedes mantener conversacion completa",
  },
  {
    zone: 2,
    name: "Aerobic",
    minPct: 0.6,
    maxPct: 0.7,
    description: "Base aerobica, comodo, puedes hablar en oraciones completas",
  },
  {
    zone: 3,
    name: "Tempo",
    minPct: 0.7,
    maxPct: 0.8,
    description: "Ritmo moderadamente fuerte, puedes hablar en frases cortas",
  },
  {
    zone: 4,
    name: "Threshold",
    minPct: 0.8,
    maxPct: 0.9,
    description: "Umbral, fuerte, solo puedes decir palabras sueltas",
  },
  {
    zone: 5,
    name: "VO2max",
    minPct: 0.9,
    maxPct: 1.0,
    description: "Esfuerzo maximo, no puedes hablar",
  },
];

export function calculateKarvonenZones(
  maxHr: number,
  restingHr: number
): HRZone[] {
  const hrReserve = maxHr - restingHr;

  return ZONE_DEFINITIONS.map((def) => ({
    zoneNumber: def.zone,
    name: def.name,
    minHr: Math.round(hrReserve * def.minPct + restingHr),
    maxHr: Math.round(hrReserve * def.maxPct + restingHr),
    description: def.description,
  }));
}

export function estimateMaxHr(age: number): number {
  return Math.round(220 - age);
}
