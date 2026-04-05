"use client";

import { Send, Bot, User, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const quickActions = [
  "Genera mi plan de entrenamiento",
  "Analiza mi ultima semana",
  "Calcula mis zonas de FC",
  "Ajusta el plan de esta semana",
  "Que entreno hoy?",
  "Como va mi preparacion?",
];

const TOOL_LABELS: Record<string, string> = {
  getRecentWorkouts: "Entrenamientos revisados",
  getCurrentPlanStatus: "Plan revisado",
  calculateHRZones: "Zonas calculadas",
  generateTrainingPlan: "Plan generado",
  adjustPlan: "Plan ajustado",
};

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  toolsUsed?: string[];
};

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error del servidor");
        return;
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: data.text,
        toolsUsed: data.toolsUsed,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setError("Error de conexion");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-screen">
      {/* Header */}
      <div className="glass p-4 md:px-6 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#102418] flex items-center justify-center">
            <Bot className="h-5 w-5 text-[#5af0b3]" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-sm">Coach Kaiton</h1>
            <p className="text-[11px] text-[#85948b]">
              Tu entrenador personal de running con IA
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {messages.length === 0 && !loading && (
            <>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-[#102418] flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-[#5af0b3]" strokeWidth={1.5} />
                </div>
                <div className="bg-[#1a2e22] rounded-2xl rounded-tl-none p-4 max-w-[85%]">
                  <p className="text-sm text-[#bbcac0] leading-relaxed">
                    Hola! Soy tu coach de running. Puedo generar tu plan de
                    entrenamiento, calcular tus zonas, analizar tus
                    entrenamientos y ajustar tu preparacion. Que necesitas?
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-11">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => setInput(action)}
                    className="px-4 py-2 rounded-full border border-[#3c4a42] bg-[#0b1f14] text-xs font-medium text-[#bbcac0] hover:bg-[#1a2e22] active:scale-95 transition-all"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-[#102418] flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-[#5af0b3]" strokeWidth={1.5} />
                </div>
              )}
              <div
                className={`space-y-2 max-w-[85%] ${
                  m.role === "user" ? "flex flex-col items-end" : ""
                }`}
              >
                {/* Tool badges */}
                {m.toolsUsed && m.toolsUsed.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.toolsUsed.map((t, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c503a] text-[10px] font-bold uppercase tracking-wider text-[#5af0b3]"
                      >
                        {TOOL_LABELS[t] ?? t}
                      </span>
                    ))}
                  </div>
                )}
                <div
                  className={`rounded-2xl p-4 text-sm leading-relaxed ${
                    m.role === "assistant"
                      ? "bg-[#1a2e22] rounded-tl-none text-[#bbcac0]"
                      : "bg-[#293e31] rounded-tr-none text-[#d0e8d6]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
              {m.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-[#293e31] flex items-center justify-center shrink-0 mt-1">
                  <User className="h-4 w-4 text-[#d0e8d6]/70" strokeWidth={1.5} />
                </div>
              )}
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-[#102418] flex items-center justify-center shrink-0 mt-1">
                <Bot className="h-4 w-4 text-[#5af0b3]" strokeWidth={1.5} />
              </div>
              <div className="bg-[#1a2e22] rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-sm text-[#85948b]">
                <Loader2 className="h-4 w-4 animate-spin text-[#5af0b3]" />
                Pensando...
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-[#93000a]/20 rounded-2xl p-4 text-sm text-[#ffb4ab]">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="glass p-4 shrink-0">
        <div className="max-w-2xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje al coach..."
            rows={1}
            className="flex-1 bg-[#011208] ring-1 ring-[#3c4a42]/15 focus:ring-[#5af0b3]/40 rounded-2xl py-3 px-4 text-sm text-[#d0e8d6] resize-none outline-none transition-all placeholder:text-[#85948b] min-h-[44px] max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="h-11 w-11 rounded-full btn-gradient flex items-center justify-center shadow-lg shadow-[#5af0b3]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 shrink-0"
          >
            <Send className="h-4 w-4 text-[#003825]" />
          </button>
        </div>
      </div>
    </div>
  );
}
