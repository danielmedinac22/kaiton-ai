"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

const STEPS = ["Bienvenida", "Perfil", "Meta", "IA"];

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

type FormData = {
  name: string;
  language: "es" | "en";
  experienceLevel: "beginner" | "intermediate" | "advanced" | "elite";
  weeklyKmCurrent: string;
  restingHr: string;
  maxHr: string;
  age: string;
  goalRaceDistance: string;
  goalRaceName: string;
  goalRaceDate: string;
  goalRaceTime: string;
  aiProvider: "openai" | "anthropic";
  aiApiKey: string;
  aiModel: string;
  stravaClientId: string;
  stravaClientSecret: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    name: "",
    language: "es",
    experienceLevel: "intermediate",
    weeklyKmCurrent: "",
    restingHr: "",
    maxHr: "",
    age: "",
    goalRaceDistance: "half_marathon",
    goalRaceName: "",
    goalRaceDate: "",
    goalRaceTime: "",
    aiProvider: "openai",
    aiApiKey: "",
    aiModel: "gpt-5.4-mini",
    stravaClientId: "",
    stravaClientSecret: "",
  });

  const update = (key: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canProceed = () => {
    switch (step) {
      case 0: return form.name.trim().length > 0;
      case 1: return true;
      case 2: return true;
      case 3: return form.aiApiKey.trim().length > 0;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setTestResult(data.error || "Error al guardar");
      }
    } catch {
      setTestResult("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: form.aiProvider,
          apiKey: form.aiApiKey,
          model: form.aiModel,
        }),
      });
      const data = await res.json();
      setTestResult(data.ok ? "Conexion exitosa!" : data.error || "Error");
    } catch {
      setTestResult("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-[#011208] ring-1 ring-[#3c4a42]/15 focus:ring-[#5af0b3]/40 rounded-lg py-3 px-4 text-[#d0e8d6] text-sm outline-none transition-all placeholder:text-[#85948b]";

  const selectClass =
    "w-full bg-[#011208] ring-1 ring-[#3c4a42]/15 focus:ring-[#5af0b3]/40 rounded-lg py-3 px-4 text-[#d0e8d6] text-sm outline-none transition-all appearance-none";

  const labelClass =
    "text-[11px] font-semibold uppercase tracking-[0.2em] text-[#85948b]";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#5af0b3]/10 blur-[80px] rounded-full" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#5af0b3]/5 blur-[100px] rounded-full" />

      {/* Logo */}
      {step === 0 && (
        <div className="flex flex-col items-center gap-3 mb-8 relative z-10">
          <div className="h-16 w-16 rounded-2xl btn-gradient flex items-center justify-center shadow-lg shadow-[#5af0b3]/20">
            <span className="font-heading font-extrabold text-2xl text-[#003825]">
              K
            </span>
          </div>
          <span className="font-heading font-bold text-2xl tracking-tight">
            Kaiton
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-6 relative z-10">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-12 rounded-full transition-all duration-300 ${
              i <= step ? "bg-[#5af0b3]" : "bg-[#25392d]"
            }`}
          />
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#1a2e22] rounded-3xl p-6 md:p-8 space-y-6 relative z-10">
        <h2 className="font-heading font-bold text-xl text-[#d0e8d6]">
          {step === 0 && "Bienvenido a Kaiton"}
          {step === 1 && "Tu perfil de corredor"}
          {step === 2 && "Tu meta"}
          {step === 3 && "Configuracion de IA"}
        </h2>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="space-y-5">
            <p className="text-sm text-[#bbcac0]">
              Tu entrenador personal de running con IA. Configura tu perfil en
              unos pocos pasos.
            </p>
            <div className="space-y-2">
              <label className={labelClass}>Nombre</label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Tu nombre"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Idioma</label>
              <select
                value={form.language}
                onChange={(e) => update("language", e.target.value)}
                className={selectClass}
              >
                <option value="es">Espanol</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className={labelClass}>Nivel de experiencia</label>
              <select
                value={form.experienceLevel}
                onChange={(e) => update("experienceLevel", e.target.value)}
                className={selectClass}
              >
                <option value="beginner">Principiante (0-1 ano)</option>
                <option value="intermediate">Intermedio (1-3 anos)</option>
                <option value="advanced">Avanzado (3-7 anos)</option>
                <option value="elite">Elite (7+ anos)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Km por semana actuales</label>
              <input
                type="number"
                value={form.weeklyKmCurrent}
                onChange={(e) => update("weeklyKmCurrent", e.target.value)}
                placeholder="30"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelClass}>FC Reposo (bpm)</label>
                <input
                  type="number"
                  value={form.restingHr}
                  onChange={(e) => update("restingHr", e.target.value)}
                  placeholder="60"
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>FC Max (bpm)</label>
                <input
                  type="number"
                  value={form.maxHr}
                  onChange={(e) => update("maxHr", e.target.value)}
                  placeholder="190"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Edad</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
                placeholder="30"
                className={inputClass}
              />
              <p className="text-[11px] text-[#85948b]">
                Si no conoces tu FC Max, la estimaremos con 220 - edad
              </p>
            </div>

            {/* Strava optional */}
            <div className="pt-3 border-t border-[#3c4a42]/30 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#85948b]">
                Strava (opcional)
              </p>
              <p className="text-[11px] text-[#85948b]">
                Crea tu app en strava.com/settings/api para importar entrenamientos.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={labelClass}>Client ID</label>
                  <input
                    value={form.stravaClientId}
                    onChange={(e) => update("stravaClientId", e.target.value)}
                    placeholder="12345"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Client Secret</label>
                  <input
                    type="password"
                    value={form.stravaClientSecret}
                    onChange={(e) => update("stravaClientSecret", e.target.value)}
                    placeholder="abc..."
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className={labelClass}>Distancia objetivo</label>
              <select
                value={form.goalRaceDistance}
                onChange={(e) => update("goalRaceDistance", e.target.value)}
                className={selectClass}
              >
                <option value="5k">5K</option>
                <option value="10k">10K</option>
                <option value="half_marathon">Media Maraton</option>
                <option value="marathon">Maraton</option>
                <option value="ultra">Ultra</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Nombre de la carrera</label>
              <input
                value={form.goalRaceName}
                onChange={(e) => update("goalRaceName", e.target.value)}
                placeholder="Media Maraton de Bogota"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Fecha de la carrera</label>
              <input
                type="date"
                value={form.goalRaceDate}
                onChange={(e) => update("goalRaceDate", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Tiempo objetivo</label>
              <input
                value={form.goalRaceTime}
                onChange={(e) => update("goalRaceTime", e.target.value)}
                placeholder="1:45:00"
                className={inputClass}
              />
              <p className="text-[11px] text-[#85948b]">
                Dejalo vacio si solo quieres terminar
              </p>
            </div>
          </div>
        )}

        {/* Step 3: AI */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className={labelClass}>Proveedor de IA</label>
              <select
                value={form.aiProvider}
                onChange={(e) => {
                  const v = e.target.value as "openai" | "anthropic";
                  update("aiProvider", v);
                  update("aiModel", AI_MODELS[v][0].value);
                }}
                className={selectClass}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>API Key</label>
              <input
                type="password"
                value={form.aiApiKey}
                onChange={(e) => update("aiApiKey", e.target.value)}
                placeholder={form.aiProvider === "openai" ? "sk-..." : "sk-ant-..."}
                className={inputClass}
              />
              <p className="text-[11px] text-[#85948b]">
                {form.aiProvider === "openai"
                  ? "Obten tu key en platform.openai.com"
                  : "Obten tu key en console.anthropic.com"}
              </p>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Modelo</label>
              <select
                value={form.aiModel}
                onChange={(e) => update("aiModel", e.target.value)}
                className={selectClass}
              >
                {AI_MODELS[form.aiProvider]?.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={loading || !form.aiApiKey}
              className="px-4 py-2 rounded-full border border-[#5af0b3]/40 text-[#5af0b3] text-xs font-semibold hover:bg-[#5af0b3]/10 active:scale-95 transition-all disabled:opacity-40"
            >
              {loading && <Loader2 className="h-3 w-3 mr-1.5 animate-spin inline" />}
              Probar conexion
            </button>
            {testResult && (
              <p className={`text-xs ${testResult.includes("exitosa") ? "text-[#5af0b3]" : "text-[#ffb4ab]"}`}>
                {testResult}
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="text-sm text-[#bbcac0] hover:text-[#d0e8d6] disabled:opacity-30 transition-all flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Atras
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="btn-gradient px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-[#5af0b3]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="btn-gradient px-8 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-[#5af0b3]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Comenzar
            </button>
          )}
        </div>
      </div>

      {/* Decorative circles */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none">
        <div className="h-[200px] w-[200px] rounded-full border border-[#5af0b3]/20 flex items-center justify-center">
          <div className="h-[140px] w-[140px] rounded-full border border-[#5af0b3]/10" />
        </div>
      </div>
    </div>
  );
}
