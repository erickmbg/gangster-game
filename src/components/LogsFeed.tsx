import React from "react";
import { GameLog } from "../types";
import { ScrollText, Trash2, Clock, Info } from "lucide-react";

interface LogsFeedProps {
  logs: GameLog[];
  lang: "en" | "pt";
  onClear: () => void;
}

export default function LogsFeed({ logs, lang, onClear }: LogsFeedProps) {
  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    const hrs = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    const secs = String(d.getSeconds()).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 md:p-6 shadow-2xl relative select-none" id="logs-panel">
      {/* Decorative top header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4.5 h-4.5 text-red-500 animate-pulse" />
          <h3 className="text-xs font-bold font-mono text-zinc-300 uppercase tracking-widest">
            {lang === "en" ? "Live Activity Feed & Combat Logs" : "Feed de Atividades e Logs do Submundo"}
          </h3>
        </div>
        
        {logs.length > 0 && (
          <button 
            onClick={onClear}
            className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 hover:text-red-400 font-bold transition-all bg-zinc-900 hover:bg-red-950/20 px-2.5 py-1 rounded-lg border border-zinc-850/40"
          >
            <Trash2 className="w-3 h-3" />
            {lang === "en" ? "WIPE" : "LIMPAR"}
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="py-8 text-center text-zinc-600 space-y-2">
          <Info className="w-8 h-8 text-zinc-800 mx-auto" />
          <p className="text-[11px] font-mono font-bold uppercase tracking-wider">
            {lang === "en" ? "CONSOLE SILENT // NO ACTIVE SIGNALS" : "CONSOLE EM SILÊNCIO // SEM ATIVIDADE"}
          </p>
          <p className="text-xs text-zinc-650 max-w-xs mx-auto">
            {lang === "en" 
              ? "Your actions, combats, and drug trades will appear here as they happen."
              : "Suas operações criminosas, roubos e transações de dinheiro aparecerão aqui em tempo real."}
          </p>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800 font-mono text-[11px] text-zinc-400">
          {logs.map((log) => {
            // Determine type background or styling matching vintage rpg screenshot
            let typeColor = "text-zinc-400";
            let rowBg = "hover:bg-zinc-900/40";
            
            if (log.type === "combat" || log.type === "level") {
              rowBg = "bg-red-950/5 hover:bg-red-950/10 border-l border-red-500/20";
            } else if (log.type === "crime" || log.type === "heist") {
              rowBg = "bg-amber-950/5 hover:bg-amber-950/10 border-l border-amber-500/20";
            }

            // Highlighting specific terms dynamically for authentic nostalgic visuals
            const message = lang === "en" ? log.textEn : log.textPt;
            
            return (
              <div 
                key={log.id} 
                className={`py-2 px-3 rounded-lg flex items-start gap-2.5 md:gap-3 transition duration-100 ${rowBg}`}
              >
                {/* Vintage icon indicator like email/combat icon */}
                <span className="shrink-0 text-xs mt-0.5 select-none" title={log.type}>
                  {log.icon}
                </span>

                {/* Log Time */}
                <span className="shrink-0 text-[10px] text-zinc-600 font-bold bg-zinc-900/50 px-1.5 py-0.5 rounded border border-zinc-900 self-center flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTime(log.timestamp)}
                </span>

                {/* Log Body */}
                <p className="flex-1 text-zinc-300 leading-relaxed font-sans text-xs break-all">
                  {/* Split message to render colors or keep regular text */}
                  {message.split(" ").map((word, idx) => {
                    // Match numbers, cash metrics (with $), XP metrics, won, lost keys
                    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
                    const hasDollar = word.includes("$");
                    const hasXP = word.toUpperCase().includes("XP");
                    const hasLevel = word.toUpperCase().includes("LEVEL") || word.toUpperCase().includes("NÍVEL") || word.toUpperCase().includes("PATENTE");
                    const isSuccess = ["SUCCESSFUL", "VENCIDO", "COMBATE", "DERROTOU", "SUCCESS", "SUCESSO", "EQUIPOU", "ADQUIRIU"].includes(cleanWord.toUpperCase());
                    const isFail = ["FAILED", "FRACASSO", "PERDEU", "ESPANCADO", "DAMAGE", "TIRO"].includes(cleanWord.toUpperCase());

                    if (hasDollar) {
                      return <strong key={idx} className="text-emerald-400 font-mono text-[11px] font-black mr-1">{word} </strong>;
                    }
                    if (hasXP) {
                      return <strong key={idx} className="text-indigo-400 font-mono text-[11px] font-bold mr-1">{word} </strong>;
                    }
                    if (hasLevel) {
                      return <strong key={idx} className="text-yellow-500 font-mono text-[11px] font-bold mr-1">{word} </strong>;
                    }
                    if (isSuccess) {
                      return <span key={idx} className="text-green-500 font-bold mr-1">{word} </span>;
                    }
                    if (isFail) {
                      return <span key={idx} className="text-red-500 font-bold mr-1">{word} </span>;
                    }

                    // highlight usernames or active player
                    if (cleanWord.length > 5 && cleanWord.toUpperCase() === cleanWord && !hasDollar && isNaN(Number(cleanWord))) {
                      return <strong key={idx} className="text-zinc-200 underline decoration-zinc-700 decoration-1 mr-1">{word} </strong>;
                    }

                    return <span key={idx} className="mr-1">{word} </span>;
                  })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
