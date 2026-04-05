"use client";

import { useChat } from "@ai-sdk/react";
import { Send, Bot, User, Loader2, Wrench } from "lucide-react";
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
  getRecentWorkouts: "Revisando entrenamientos",
  getCurrentPlanStatus: "Revisando plan",
  calculateHRZones: "Calculando zonas",
  generateTrainingPlan: "Generando plan",
  adjustPlan: "Ajustando plan",
};

export default function CoachPage() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage({ text });
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
          {messages.length === 0 && (
            <>
              {/* Welcome */}
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-[#102418] flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-[#5af0b3]" strokeWidth={1.5} />
                </div>
                <div className="bg-[#1a2e22] rounded-2xl rounded-tl-none p-4 max-w-[85%]">
                  <p className="text-sm text-[#bbcac0] leading-relaxed">
                    Hola! Soy tu coach de running. Puedo ayudarte a generar un
                    plan de entrenamiento personalizado, analizar tus
                    entrenamientos, calcular tus zonas de frecuencia cardiaca, y
                    ajustar tu preparacion. Que necesitas?
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
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

          {messages.map((m) => {
            const textParts: string[] = [];
            const toolParts: { name: string; state: string }[] = [];

            if (m.parts) {
              for (const p of m.parts) {
                if (p.type === "text" && "text" in p) {
                  textParts.push((p as { type: "text"; text: string }).text);
                } else if (p.type.startsWith("tool-")) {
                  const part = p as { type: string; state: string };
                  toolParts.push({ name: p.type.replace("tool-", ""), state: part.state });
                }
              }
            }

            const textContent = textParts.join("");
            if (!textContent && toolParts.length === 0) return null;

            const isAssistant = m.role === "assistant";

            return (
              <div key={m.id} className={`flex gap-3 ${isAssistant ? "" : "justify-end"}`}>
                {isAssistant && (
                  <div className="h-8 w-8 rounded-full bg-[#102418] flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-[#5af0b3]" strokeWidth={1.5} />
                  </div>
                )}
                <div className={`space-y-2 max-w-[85%] ${isAssistant ? "" : "flex flex-col items-end"}`}>
                  {/* Tool badges */}
                  {toolParts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {toolParts.map((t, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c503a] text-[10px] font-bold uppercase tracking-wider text-[#5af0b3]"
                        >
                          {t.state === "call" || t.state === "partial-call" || t.state === "input-streaming" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wrench className="h-3 w-3" />
                          )}
                          {TOOL_LABELS[t.name] ?? t.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Text */}
                  {textContent && (
                    <div
                      className={`rounded-2xl p-4 text-sm leading-relaxed ${
                        isAssistant
                          ? "bg-[#1a2e22] rounded-tl-none text-[#bbcac0]"
                          : "bg-[#293e31] rounded-tr-none text-[#d0e8d6]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{textContent}</p>
                    </div>
                  )}
                </div>
                {!isAssistant && (
                  <div className="h-8 w-8 rounded-full bg-[#293e31] flex items-center justify-center shrink-0 mt-1">
                    <User className="h-4 w-4 text-[#d0e8d6]/70" strokeWidth={1.5} />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role === "user") && (
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
            disabled={isLoading || !input.trim()}
            className="h-11 w-11 rounded-full btn-gradient flex items-center justify-center shadow-lg shadow-[#5af0b3]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 shrink-0"
          >
            <Send className="h-4 w-4 text-[#003825]" />
          </button>
        </div>
      </div>
    </div>
  );
}
