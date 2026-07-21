import React, { useState, useEffect } from "react";
import { PlayerState, NEIGHBORHOODS } from "../types";
import { playSound } from "./AudioEngine";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

import crimesSprite from "../assets/images/crimes_neon_1782535806643.jpg";
import contrabandSprite from "../assets/images/contraband_neon_1782535819377.jpg";
import shopSprite from "../assets/images/shop_neon_1782535828821.jpg";
import subwaySprite from "../assets/images/subway_neon_1782535838619.jpg";
import arenaSprite from "../assets/images/arena_neon_1782535857147.jpg";
import metropoleSprite from "../assets/images/metropole_neon_1782535875712.jpg";
import leaderSprite from "../assets/images/leader_neon_1782535866284.jpg";
import possessionsSprite from "../assets/images/possessions_neon_1782535886396.jpg";
import neighborhoodBrooklynSpriteImage from "../assets/images/brooklyn_neon_1782535745007.jpg";
import neighborhoodManhattanSpriteImage from "../assets/images/manhattan_neon_1782535762567.jpg";
import neighborhoodQueensSpriteImage from "../assets/images/queens_neon_1782535772151.jpg";
import neighborhoodBronxSpriteImage from "../assets/images/bronx_neon_1782535784970.jpg";

interface IsometricCityMapProps {
  player: PlayerState;
  onNavigateTab: (tab: string) => void;
  onTravel: (locationId: string, energyCost: number, notification: string | null, isSmuggledFerry?: boolean) => void;
  lang: "en" | "pt";
}

interface BuildingNode {
  id: string;
  tabTarget?: string; // which tab to navigate to (if not a subway/travel action)
  nameEn: string;
  namePt: string;
  descEn: string;
  descPt: string;
  icon: string;
  color: string;
  neonGlow: string;
  image: string;
}

const BUILDINGS: BuildingNode[] = [
  { id: "crimes", tabTarget: "crimes", nameEn: "Street Crimes", namePt: "Crimes de Rua", descEn: "Execute illegal operations", descPt: "Executar operações ilegais", icon: "🔫", color: "from-amber-600/35 to-zinc-950", neonGlow: "shadow-[0_0_15px_rgba(245,158,11,0.35)]", image: crimesSprite },
  { id: "traffic", tabTarget: "traffic", nameEn: "Black Market", namePt: "Mercado Negro", descEn: "Trade illegal goods", descPt: "Negociar mercadorias ilegais", icon: "💊", color: "from-teal-600/35 to-zinc-950", neonGlow: "shadow-[0_0_15px_rgba(13,148,136,0.35)]", image: contrabandSprite },
  { id: "shop", tabTarget: "shop", nameEn: "Arms Shop", namePt: "Arsenal", descEn: "Buy weapons & gear", descPt: "Comprar armas e equipamentos", icon: "🛒", color: "from-rose-650/35 to-zinc-950", neonGlow: "shadow-[0_0_15px_rgba(225,29,72,0.35)]", image: shopSprite },
  { id: "subway", nameEn: "Transit Subway", namePt: "Metrô (Viagem)", descEn: "Travel to other boroughs", descPt: "Viajar para outros bairros", icon: "🚇", color: "from-blue-600/35 to-zinc-950", neonGlow: "shadow-[0_0_15px_rgba(37,99,235,0.35)]", image: subwaySprite },
  { id: "arena", tabTarget: "arena", nameEn: "Underground Arena", namePt: "Arena", descEn: "Train stats & spar", descPt: "Treinar atributos e lutar", icon: "🥊", color: "from-red-600/35 to-zinc-950", neonGlow: "shadow-[0_0_15px_rgba(220,38,38,0.35)]", image: arenaSprite },
  { id: "metropole", tabTarget: "metropole", nameEn: "Metropolis", namePt: "Metrópole", descEn: "Real Estate & City", descPt: "Imóveis e Cidade", icon: "📍", color: "from-emerald-600/35 to-zinc-950", neonGlow: "shadow-[0_0_15px_rgba(16,185,129,0.35)]", image: metropoleSprite },
  { id: "leader", tabTarget: "leader", nameEn: "Mafia Families", namePt: "Famílias", descEn: "Syndicate ranking", descPt: "Ranking do sindicato", icon: "👑", color: "from-cyan-600/35 to-zinc-950", neonGlow: "shadow-[0_0_15px_rgba(8,145,178,0.35)]", image: leaderSprite },
  { id: "possessions", tabTarget: "possessions", nameEn: "My Possessions", namePt: "Meus Pertences", descEn: "Manage your empire", descPt: "Gerenciar seu império", icon: "🎩", color: "from-purple-600/35 to-zinc-950", neonGlow: "shadow-[0_0_15px_rgba(147,51,234,0.35)]", image: possessionsSprite },
];

const getNeighborhoodImage = (id: string) => {
  switch (id) {
    case 'brooklyn': return neighborhoodBrooklynSpriteImage;
    case 'manhattan': return neighborhoodManhattanSpriteImage;
    case 'queens': return neighborhoodQueensSpriteImage;
    case 'bronx': return neighborhoodBronxSpriteImage;
    case 'staten_island': return metropoleSprite;
    case 'suburbio': return possessionsSprite;
    default: return neighborhoodBrooklynSpriteImage;
  }
};

export default function IsometricCityMap({
  player,
  onNavigateTab,
  onTravel,
  lang,
}: IsometricCityMapProps) {
  const [selectedBoroughId, setSelectedBoroughId] = useState<string>(player.location || "brooklyn");
  const [showSubwayMap, setShowSubwayMap] = useState<boolean>(false);

  useEffect(() => {
    if (player.location) {
      setSelectedBoroughId(player.location);
    }
  }, [player.location]);

  const currentBorough = NEIGHBORHOODS.find((n) => n.id === player.location) || NEIGHBORHOODS[0];

  const handleTravelSelect = (neighborhoodId: string) => {
    playSound.notification();
    if (neighborhoodId === player.location) return;
    onTravel(neighborhoodId, 5, lang === "en" ? `Travelled via Subway to ${neighborhoodId.toUpperCase()}` : `Viajou de metrô para ${neighborhoodId.toUpperCase()}`);
    setShowSubwayMap(false);
  };

  return (
    <div className="w-full h-full relative font-mono text-zinc-100 flex flex-col items-center">
      
      {/* Title Header */}
      <div className="absolute top-2 sm:top-4 left-0 right-0 z-30 flex justify-center pointer-events-none px-4">
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl px-6 py-2.5 shadow-2xl backdrop-blur-md flex flex-col items-center pointer-events-auto">
          <p className="text-[10px] font-mono text-red-500 tracking-[0.2em] font-black uppercase mb-1">
            {lang === "en" ? "GLOBAL TRANSIT HUB" : "HUB DE TRÂNSITO"}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xl filter drop-shadow-md">{currentBorough.icon}</span>
            <h2 className="text-lg sm:text-xl font-bold font-sans tracking-widest text-zinc-100 uppercase">
              {lang === "en" ? currentBorough.nameEn : currentBorough.namePt}
            </h2>
          </div>
        </div>
      </div>

      {/* Grid of Navigation Shortcuts */}
      <div className="w-full h-full relative z-20 flex items-center justify-center p-6 mt-16 sm:mt-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl max-h-full overflow-y-auto sm:overflow-visible scrollbar-hide content-center justify-items-center">
            {BUILDINGS.map((b) => {
              return (
                <div
                  key={b.id}
                  onClick={() => {
                    playSound.notification();
                    if (b.id === "subway") {
                      setShowSubwayMap(true);
                    } else if (b.tabTarget) {
                      onNavigateTab(b.tabTarget);
                    }
                  }}
                  className={`relative w-full max-w-[200px] aspect-square group cursor-pointer transition-all duration-300 transform hover:scale-105 industrial-panel diorama-container hover:-translate-y-2 overflow-hidden`}
                >
                  <img src={b.image} alt={b.nameEn} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 transition duration-500 mix-blend-screen" referrerPolicy="no-referrer" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${b.color} opacity-80 mix-blend-multiply group-hover:opacity-90 transition`}></div>
                  <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/40 to-zinc-950/95`}></div>
                  
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex flex-col items-center justify-end text-center z-10 space-y-1 sm:space-y-2">
                    <div className={`text-3xl sm:text-4xl filter drop-shadow-lg transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-110 ${b.neonGlow} rounded-full`}>
                      {b.icon}
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-sans font-black text-white tracking-widest uppercase drop-shadow-md">
                        {lang === "en" ? b.nameEn : b.namePt}
                      </p>
                      <p className="text-[8px] sm:text-[9px] font-mono text-zinc-400 group-hover:text-zinc-200 transition opacity-80 mt-1">
                        {lang === "en" ? b.descEn : b.descPt}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Subway / Metro Modal (if subway clicked) */}
      <AnimatePresence>
        {showSubwayMap && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setShowSubwayMap(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl cursor-default overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <button 
                onClick={() => setShowSubwayMap(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition z-20"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-4 pt-1">
                <p className="text-[10px] font-mono text-zinc-400 leading-relaxed border-b border-zinc-850 pb-2">
                  {lang === "en" 
                    ? "Select a borough to travel to. Subway costs 5 Energy per trip."
                    : "Selecione um bairro para viajar. O metrô custa 5 de Energia por viagem."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                  {NEIGHBORHOODS.map((hood) => {
                    const isCurrent = hood.id === player.location;
                    const hoodImage = getNeighborhoodImage(hood.id);
                    return (
                      <button
                        key={hood.id}
                        disabled={isCurrent}
                        onClick={() => handleTravelSelect(hood.id)}
                        className={`relative p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between h-24 overflow-hidden group ${
                          isCurrent 
                            ? "bg-zinc-900 border-zinc-800 opacity-60 cursor-not-allowed" 
                            : "bg-zinc-900 border-zinc-700 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] cursor-pointer"
                        }`}
                      >
                        <img src={hoodImage} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition duration-300 mix-blend-screen" alt={hood.nameEn} />
                        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent"></div>
                        
                        <div className="flex items-center gap-2 relative z-10">
                          <span className="text-2xl filter drop-shadow-md">{hood.icon}</span>
                          <span className={`text-[11px] font-sans font-black uppercase tracking-widest ${isCurrent ? "text-zinc-500" : "text-zinc-100"}`}>
                            {lang === "en" ? hood.nameEn : hood.namePt}
                          </span>
                        </div>
                        {isCurrent ? (
                          <span className="text-[9px] font-mono text-blue-500 uppercase tracking-widest font-bold self-end relative z-10">
                            {lang === "en" ? "CURRENT LOCATION" : "LOCALIZAÇÃO ATUAL"}
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-zinc-400 group-hover:text-blue-400 uppercase tracking-widest self-end relative z-10 transition">
                            {lang === "en" ? "TRAVEL HERE" : "VIAJAR PARA CÁ"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
