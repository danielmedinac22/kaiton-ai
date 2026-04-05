"use client";

import { useState } from "react";
import { Loader2, Save, Link as LinkIcon, Unlink } from "lucide-react";
import { updateAthlete } from "@/lib/actions/athlete";
import { useRouter } from "next/navigation";

type AthleteData = {
  id: number; name: string; age: number | null; experienceLevel: string;
  restingHr: number | null; maxHr: number | null; weeklyKmCurrent: number | null;
  goalRaceDistance: string | null; goalRaceName: string | null;
  goalRaceDate: string | null; goalRaceTime: string | null;
  aiProvider: string; aiApiKey: string; aiModel: string; language: string;
  stravaClientId: string | null; stravaClientSecret: string | null;
  stravaAthleteId: number | null; stravaAccessToken: string | null;
};
type Zone = { zoneNumber: number; name: string; minHr: number; maxHr: number };

const AI_MODELS: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-5.4", label: "GPT-5.4" },
    { value: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
    { value: "gpt-5.4-nano", label: "GPT-5.4 Nano" },
    { value: "gpt-4o", label: "GPT-4o" },
  ],
  anthropic: [
    { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
  ],
};

export function SettingsForm({ athleteData, zones }: { athleteData: AthleteData; zones: Zone[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: athleteData.name,
    age: athleteData.age?.toString() ?? "",
    experienceLevel: athleteData.experienceLevel,
    restingHr: athleteData.restingHr?.toString() ?? "",
    maxHr: athleteData.maxHr?.toString() ?? "",
    weeklyKmCurrent: athleteData.weeklyKmCurrent?.toString() ?? "",
    goalRaceDistance: athleteData.goalRaceDistance ?? "half_marathon",
    goalRaceDate: athleteData.goalRaceDate ?? "",
    goalRaceTime: athleteData.goalRaceTime ?? "",
    aiProvider: athleteData.aiProvider,
    aiApiKey: athleteData.aiApiKey,
    aiModel: athleteData.aiModel,
    language: athleteData.language,
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      await updateAthlete({
        name: form.name,
        age: form.age ? Number(form.age) : undefined,
        experienceLevel: form.experienceLevel,
        restingHr: form.restingHr ? Number(form.restingHr) : undefined,
        maxHr: form.maxHr ? Number(form.maxHr) : undefined,
        weeklyKmCurrent: form.weeklyKmCurrent ? Number(form.weeklyKmCurrent) : undefined,
        goalRaceDistance: form.goalRaceDistance,
        goalRaceDate: form.goalRaceDate || undefined,
        goalRaceTime: form.goalRaceTime || undefined,
        aiProvider: form.aiProvider,
        aiApiKey: form.aiApiKey,
        aiModel: form.aiModel,
        language: form.language,
      });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save:", e);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#011208] ring-1 ring-[#3c4a42]/15 focus:ring-[#5af0b3]/40 rounded-lg py-2.5 px-3.5 text-[#d0e8d6] text-sm outline-none transition-all placeholder:text-[#85948b]";
  const selectClass = "w-full bg-[#011208] ring-1 ring-[#3c4a42]/15 focus:ring-[#5af0b3]/40 rounded-lg py-2.5 px-3.5 text-[#d0e8d6] text-sm outline-none transition-all appearance-none";
  const labelClass = "text-[11px] font-semibold uppercase tracking-[0.2em] text-[#85948b]";
  const sectionClass = "bg-[#1a2e22] rounded-3xl p-5 space-y-4";
  const sectionTitle = "font-heading font-bold text-sm text-[#d0e8d6] mb-1";

  return (
    <div className="space-y-4">
      {/* Profile */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Perfil</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>Nombre</label>
            <input value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Edad</label>
            <input type="number" value={form.age} onChange={(e) => update("age", e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Nivel</label>
          <select value={form.experienceLevel} onChange={(e) => update("experienceLevel", e.target.value)} className={selectClass}>
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
            <option value="elite">Elite</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>FC Reposo</label>
            <input type="number" value={form.restingHr} onChange={(e) => update("restingHr", e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>FC Max</label>
            <input type="number" value={form.maxHr} onChange={(e) => update("maxHr", e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Km/sem</label>
            <input type="number" value={form.weeklyKmCurrent} onChange={(e) => update("weeklyKmCurrent", e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Zones */}
      {zones.length > 0 && (
        <div className={sectionClass}>
          <p className={sectionTitle}>Zonas de FC (Karvonen)</p>
          <div className="space-y-2">
            {zones.map((z) => (
              <div key={z.zoneNumber} className="flex items-center justify-between text-sm">
                <span className="text-[#85948b]">Z{z.zoneNumber} — {z.name}</span>
                <span className="font-mono text-[#5af0b3] text-xs">{z.minHr}-{z.maxHr} bpm</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Meta</p>
        <div className="space-y-1.5">
          <label className={labelClass}>Distancia</label>
          <select value={form.goalRaceDistance} onChange={(e) => update("goalRaceDistance", e.target.value)} className={selectClass}>
            <option value="5k">5K</option>
            <option value="10k">10K</option>
            <option value="half_marathon">Media Maraton</option>
            <option value="marathon">Maraton</option>
            <option value="ultra">Ultra</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>Fecha</label>
            <input type="date" value={form.goalRaceDate} onChange={(e) => update("goalRaceDate", e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Tiempo</label>
            <input value={form.goalRaceTime} onChange={(e) => update("goalRaceTime", e.target.value)} placeholder="1:45:00" className={inputClass} />
          </div>
        </div>
      </div>

      {/* AI */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Configuracion IA</p>
        <div className="space-y-1.5">
          <label className={labelClass}>Proveedor</label>
          <select
            value={form.aiProvider}
            onChange={(e) => {
              update("aiProvider", e.target.value);
              const models = AI_MODELS[e.target.value] || [];
              update("aiModel", models[0]?.value || "");
            }}
            className={selectClass}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>API Key</label>
          <input type="password" value={form.aiApiKey} onChange={(e) => update("aiApiKey", e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Modelo</label>
          <select value={form.aiModel} onChange={(e) => update("aiModel", e.target.value)} className={selectClass}>
            {(AI_MODELS[form.aiProvider] || []).map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Idioma</label>
          <select value={form.language} onChange={(e) => update("language", e.target.value)} className={selectClass}>
            <option value="es">Espanol</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Strava */}
      <div className={sectionClass}>
        <p className={sectionTitle}>Strava</p>
        {athleteData.stravaAccessToken ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#1c503a] text-[#5af0b3] text-[10px] font-bold uppercase tracking-widest">
                Conectado
              </span>
              {athleteData.stravaAthleteId && (
                <span className="text-xs text-[#85948b]">
                  Athlete #{athleteData.stravaAthleteId}
                </span>
              )}
            </div>
            <button
              onClick={async () => {
                await fetch("/api/strava/disconnect", { method: "POST" });
                router.refresh();
              }}
              className="px-4 py-2 rounded-full border border-[#3c4a42] text-xs font-semibold text-[#bbcac0] hover:bg-[#1a2e22] active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Unlink className="h-3.5 w-3.5" />
              Desconectar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] text-[#85948b]">
              Conecta tu cuenta de Strava para importar tus entrenamientos automaticamente.
            </p>
            <button
              onClick={() => {
                window.location.href = "/api/strava/authorize";
              }}
              className="px-4 py-2 rounded-full border border-[#5af0b3]/40 text-[#5af0b3] text-xs font-semibold hover:bg-[#5af0b3]/10 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Conectar Strava
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full btn-gradient py-3 rounded-full font-bold text-sm shadow-lg shadow-[#5af0b3]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saved ? "Guardado!" : "Guardar cambios"}
      </button>
    </div>
  );
}
