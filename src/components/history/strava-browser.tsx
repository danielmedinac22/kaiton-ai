"use client";

import { useState, useEffect, useCallback } from "react";
import { logWorkout } from "@/lib/actions/workouts";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Link as LinkIcon,
  CheckCircle2,
  Download,
  ChevronDown,
  MapPin,
  Heart,
  Mountain,
} from "lucide-react";

type StravaActivityMapped = {
  id: number;
  name: string;
  type: string;
  sportType: string;
  date: string;
  dateFormatted: string;
  distanceKm: number;
  durationMinutes: number;
  pace: string;
  avgHr: number | null;
  maxHr: number | null;
  elevationGain: number;
  imported: boolean;
};

function mapStravaType(type: string) {
  const t = type.toLowerCase();
  if (t.includes("race")) return "race";
  if (t.includes("trail") || t.includes("hike")) return "long_run";
  if (t === "run" || t === "virtualrun") return "easy";
  if (t === "walk") return "recovery";
  return "cross_training";
}

export function StravaBrowser({
  isConnected,
  hasCredentials,
}: {
  isConnected: boolean;
  hasCredentials: boolean;
}) {
  const router = useRouter();
  const [activities, setActivities] = useState<StravaActivityMapped[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<number | null>(null);

  const fetchActivities = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/strava/activities?page=${p}&per_page=20`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error");
      }
      const data = await res.json();
      if (p === 1) {
        setActivities(data.activities);
      } else {
        setActivities((prev) => [...prev, ...data.activities]);
      }
      setHasMore(data.activities.length >= 20);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchActivities(1);
    }
  }, [isConnected, fetchActivities]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchActivities(next);
  };

  const handleImport = async (act: StravaActivityMapped) => {
    setImportingId(act.id);
    try {
      await logWorkout({
        date: act.date,
        type: mapStravaType(act.type),
        distanceKm: act.distanceKm,
        durationMinutes: act.durationMinutes,
        avgHr: act.avgHr ?? undefined,
        maxHr: act.maxHr ?? undefined,
        rpe: 5, // default — user can edit later
        avgPace: act.pace !== "-" ? act.pace : undefined,
        notes: `Importado de Strava: ${act.name}`,
        stravaActivityId: act.id.toString(),
      });
      // Mark as imported in local state
      setActivities((prev) =>
        prev.map((a) => (a.id === act.id ? { ...a, imported: true } : a))
      );
      router.refresh();
    } catch (err) {
      console.error("Import failed:", err);
    } finally {
      setImportingId(null);
    }
  };

  const handleConnect = () => {
    window.location.href = "/api/strava/authorize";
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="bg-[#1a2e22] rounded-3xl p-8 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-[#102418] flex items-center justify-center mx-auto">
            <LinkIcon className="h-7 w-7 text-[#5af0b3]" strokeWidth={1.5} />
          </div>
          <h3 className="font-heading font-bold text-lg">Conecta con Strava</h3>
          <p className="text-sm text-[#85948b] max-w-xs mx-auto">
            Importa tus entrenamientos de Strava uno a uno. Selecciona cuales quieres traer a tu historial.
          </p>
          {hasCredentials ? (
            <button
              onClick={handleConnect}
              className="btn-gradient px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-[#5af0b3]/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Conectar con Strava
            </button>
          ) : (
            <p className="text-xs text-[#85948b]">
              Agrega STRAVA_CLIENT_ID y STRAVA_CLIENT_SECRET en .env.local o en Config.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-extrabold text-xl tracking-tight">
            Strava
          </h2>
          <p className="text-xs text-[#85948b] mt-0.5">
            Selecciona los entrenamientos que quieres importar
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-[#1c503a] text-[#5af0b3] text-[10px] font-bold uppercase tracking-widest">
          Conectado
        </span>
      </div>

      {error && (
        <div className="bg-[#93000a]/20 rounded-2xl p-4 text-sm text-[#ffb4ab]">
          {error}
        </div>
      )}

      {/* Activity list */}
      <div className="space-y-3">
        {activities.map((act) => (
          <div
            key={act.id}
            className={`bg-[#1a2e22] rounded-3xl p-5 transition-all ${
              act.imported ? "opacity-70" : "hover:bg-[#293e31]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-extrabold text-base truncate">
                    {act.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#293e31] text-[10px] font-bold uppercase tracking-wider text-[#bbcac0] shrink-0">
                    {act.sportType || act.type}
                  </span>
                </div>
                <p className="text-xs text-[#85948b]">{act.date}</p>
                <div className="flex items-center gap-4 text-xs text-[#bbcac0]">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {act.distanceKm} km
                  </span>
                  <span>{act.durationMinutes} min</span>
                  <span>{act.pace}/km</span>
                  {act.avgHr && (
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {act.avgHr}
                    </span>
                  )}
                  {act.elevationGain > 0 && (
                    <span className="flex items-center gap-1">
                      <Mountain className="h-3 w-3" />
                      {act.elevationGain}m
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                {act.imported ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1c503a] text-[#5af0b3] text-[10px] font-bold uppercase tracking-widest">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Importado
                  </span>
                ) : (
                  <button
                    onClick={() => handleImport(act)}
                    disabled={importingId === act.id}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full btn-gradient text-xs font-bold shadow-lg shadow-[#5af0b3]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {importingId === act.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Importar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Loading / Load More */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-[#5af0b3]" />
        </div>
      )}

      {!loading && hasMore && activities.length > 0 && (
        <button
          onClick={handleLoadMore}
          className="w-full py-3 rounded-2xl bg-[#102418] text-sm font-semibold text-[#bbcac0] hover:bg-[#1a2e22] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <ChevronDown className="h-4 w-4" />
          Cargar mas actividades
        </button>
      )}

      {!loading && activities.length === 0 && !error && (
        <div className="bg-[#1a2e22] rounded-3xl p-8 text-center text-sm text-[#85948b]">
          No se encontraron actividades en Strava.
        </div>
      )}
    </div>
  );
}
