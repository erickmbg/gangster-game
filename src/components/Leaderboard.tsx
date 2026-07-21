import React from "react";
import { PlayerState, OPPONENTS, getLevelTitle } from "../types";
import { Award, Medal, Skull, Landmark, Zap, Shield, Crown } from "lucide-react";

interface LeaderboardProps {
  player: PlayerState;
  lang: "en" | "pt";
}

interface LeaderboardRow {
  name: string;
  level: number;
  respect: number;
  cashWealth: number;
  avatar: string;
  isPlayer: boolean;
}

export default function Leaderboard({ player, lang }: LeaderboardProps) {
  // Merge live player with pre-set rival boss accounts to display dynamically sorted logs
  const rivalsList: LeaderboardRow[] = [
    { name: "Don Salvatore", level: 30, respect: 45000, cashWealth: 25000000, avatar: "👑", isPlayer: false },
    { name: "Al Capone's Ghost", level: 24, respect: 28000, cashWealth: 12000000, avatar: "🕶️", isPlayer: false },
    { name: "Capo Falcone", level: 16, respect: 11000, cashWealth: 4500000, avatar: "🕴️", isPlayer: false },
    { name: "Guido 'The Sledge'", level: 8, respect: 3500, cashWealth: 650000, avatar: "🧌", isPlayer: false },
    { name: "Slick Sammy", level: 5, respect: 1200, cashWealth: 180000, avatar: "🕵️‍♂️", isPlayer: false },
    { name: "Tony 'Two-Times'", level: 2, respect: 600, cashWealth: 45000, avatar: "🤠", isPlayer: false },
  ];

  const playerRow: LeaderboardRow = {
    name: `${player.name} (${lang === "en" ? "You" : "Você"})`,
    level: player.level,
    respect: player.respect,
    cashWealth: player.cash + player.bank,
    avatar: "🥷",
    isPlayer: true
  };

  const finalLeaderboard = [...rivalsList, playerRow].sort((a, b) => b.respect - a.respect);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl" id="leaderboard-tab">
      <div className="border-b border-zinc-850 pb-4 mb-6">
        <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 font-display uppercase tracking-tight">
          <Crown className="w-5.5 h-5.5 text-yellow-500 animate-pulse" />
          {lang === "en" ? "Underworld Hall of Fame" : "Galeria de Honra / Hall of Fame"}
        </h2>
        <p className="text-xs text-zinc-400 mt-1 font-sans">
          {lang === "en"
            ? "Live rankings of regional mafia syndicates sorted by total accumulated respect. Climb the ranks to declare boss absolute dominance."
            : "Classificações regionais de sindicatos da máfia ordenadas por respeito acumulado. Suba na vida para declarar o reinado absoluto."}
        </p>
      </div>

      <div className="overflow-x-auto select-none">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="border-b border-zinc-850 text-zinc-500 uppercase font-mono text-[10px] tracking-wider font-bold">
              <th className="py-3.5 px-4">{lang === "en" ? "Rank" : "Posição"}</th>
              <th className="py-3.5 px-4">{lang === "en" ? "Gangster" : "Membro"}</th>
              <th className="py-3.5 px-4 text-center">Level</th>
              <th className="py-3.5 px-4 text-emerald-400 text-right">{lang === "en" ? "Est. Wealth" : "Patrimônio Est."}</th>
              <th className="py-3.5 px-4 text-red-500 text-right font-mono flex items-center justify-end gap-1">
                <Skull className="w-3.5 h-3.5 text-red-600" /> {lang === "en" ? "Respect Credits" : "Pontos de Respeito"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60 font-mono">
            {finalLeaderboard.map((row, index) => {
              const rank = index + 1;
              const isPlayer = row.isPlayer;

              return (
                <tr 
                  key={index} 
                  className={`transition-colors duration-150 ${isPlayer ? "bg-red-950/15 text-red-100 font-bold border-y border-red-900/30" : "hover:bg-zinc-950/40 text-zinc-300"}`}
                >
                  <td className="py-3.5 px-4">
                    {rank <= 3 ? (
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold font-sans text-[10px] ${rank === 1 ? "bg-yellow-500 text-black" : rank === 2 ? "bg-zinc-300 text-black" : "bg-amber-700 text-white"}`}>
                        {rank}
                      </span>
                    ) : (
                      <span className="text-zinc-500 font-mono font-bold pl-1 text-zinc-500">{rank}</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 flex items-center gap-2">
                    <span className="text-sm">{row.avatar}</span>
                    <span className={isPlayer ? "text-red-400 font-sans font-bold" : "font-sans font-medium"}>
                      {row.name}
                    </span>
                  </td>

                  <td 
                    className="py-3.5 px-4 text-center text-zinc-400 select-none font-bold cursor-help"
                    title={getLevelTitle(row.level, lang)}
                  >
                    <span className="border-b border-dotted border-zinc-700 pb-0.5">{row.level}</span>
                  </td>

                  <td className="py-3.5 px-4 text-right text-emerald-500 select-all font-semibold font-bold">
                    {formatMoney(row.cashWealth)}
                  </td>

                  <td className="py-3.5 px-4 text-right text-red-500 font-bold">
                    {row.respect.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
