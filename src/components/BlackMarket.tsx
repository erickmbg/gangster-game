import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  PlayerState, 
  Crime, 
  CRIMES, 
  Neighborhood, 
  NEIGHBORHOODS, 
  Drug, 
  DRUGS,
  ORGANIZED_HEISTS,
  OrganizedHeist
} from "../types";
import { playSound } from "./AudioEngine";
import { 
  Navigation, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building, 
  ChevronRight, 
  ShieldAlert, 
  Zap, 
  Sparkles, 
  Heart, 
  Activity, 
  Award, 
  ShieldCheck, 
  Landmark,
  UserCheck,
  Scale
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import illegalDrugsSpriteImage from "../assets/images/illegal_drugs_1782178202629.jpg";

import drugWeedSpriteImage from "../assets/images/drug_weed_sprite_1782179402394.jpg";
import drugPillsSpriteImage from "../assets/images/drug_pills_sprite_1782179412692.jpg";
import drugPowderSpriteImage from "../assets/images/drug_powder_sprite_1782179482538.jpg";
import drugConcentrateSpriteImage from "../assets/images/drug_concentrate_sprite_1782179424740.jpg";

const getDrugImage = (id: string) => {
  if (['weed', 'skunk', 'og_kush'].includes(id)) return drugWeedSpriteImage;
  if (['crumble', 'ice_extraction'].includes(id)) return drugConcentrateSpriteImage;
  if (['lsd', 'shrooms'].includes(id)) return drugPillsSpriteImage;
  if (['cocaine', 'meth'].includes(id)) return drugPowderSpriteImage;
  return drugPowderSpriteImage;
};

import neighborhoodBrooklynSpriteImage from "../assets/images/neighborhood_brooklyn_1782178247031.jpg";
import neighborhoodManhattanSpriteImage from "../assets/images/neighborhood_manhattan_1782178256044.jpg";
import neighborhoodQueensSpriteImage from "../assets/images/neighborhood_queens_1782178267246.jpg";

interface BlackMarketProps {
  player: PlayerState;
  prices: Record<string, number>; // current drug id -> price
  onTravel: (locationId: string, energyCost: number, notification: string | null, isSmuggledFerry?: boolean) => void;
  onBuyDrugs: (drugId: string, qty: number, unitPrice: number) => void;
  onSellDrugs: (drugId: string, qty: number, unitPrice: number) => void;
  lang: "en" | "pt";
  smugglersBonusActive?: boolean;

  // Operational action handlers
  onCommitCrime: (crime: Crime, rolledSuccess: boolean, lootCash: number) => void;
  onExecuteHeist: (heist: OrganizedHeist, rolledSuccess: boolean, lootCash: number) => void;
  onHospitalRecovery: (cost: number) => void;
  onBribePolice: (cost: number, heatCleared: number) => void;
  onTrainStats: (attr: "strength" | "defense" | "intellect" | "willpower", energyCost: number, points: number) => void;
  onDeposit: (amt: number) => void;
  onWithdraw: (amt: number) => void;
}

export default function BlackMarket({ 
  player, 
  prices, 
  onTravel, 
  onBuyDrugs, 
  onSellDrugs, 
  lang, 
  smugglersBonusActive = false,
  onCommitCrime,
  onExecuteHeist,
  onHospitalRecovery,
  onBribePolice,
  onTrainStats,
  onDeposit,
  onWithdraw
}: BlackMarketProps) {
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);
  const [isTransitExpanded, setIsTransitExpanded] = useState(false);
  const [isDrugsExpanded, setIsDrugsExpanded] = useState(false);
  const [isTraveling, setIsTraveling] = useState(false);
  const [travelToBorough, setTravelToBorough] = useState<Neighborhood | null>(null);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  
  // Custom slider quantities / trade counters for advanced trading
  const [customTradeQtys, setCustomTradeQtys] = useState<Record<string, number>>({});
  const [cooldownSecs, setCooldownSecs] = useState<number>(0);

  useEffect(() => {
    if (!player?.travelCooldownUntil) {
      setCooldownSecs(0);
      return;
    }
    const updateCooldown = () => {
      const remaining = Math.max(0, Math.ceil((player.travelCooldownUntil! - Date.now()) / 1000));
      setCooldownSecs(remaining);
    };
    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [player?.travelCooldownUntil]);

  // Lock body scroll when the confidential transactions cabinet is open to ensure perfect centering and prevent main screen scroll
  useEffect(() => {
    if (selectedDrug) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedDrug]);

  const activeNeighborhood = NEIGHBORHOODS.find(n => n.id === player.location) || NEIGHBORHOODS[0];

  const triggerFeedback = (msg: string) => {
    setLocalFeedback(msg);
    setTimeout(() => {
      setLocalFeedback(null);
    }, 4000);
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  // Helper translations for neighborhoods
  const getBoroughEmoji = (id: string) => {
    switch(id) {
      case "brooklyn": return "🌉";
      case "manhattan": return "💎";
      case "queens": return "👑";
      case "bronx": return "🏙️";
      case "staten_island": return "🚢";
      case "suburbio": return "🏚️";
      default: return "📍";
    }
  };

  const getBoroughTagline = (id: string, isPt: boolean) => {
    if (isPt) {
      switch(id) {
        case "brooklyn": return "Seu berço oficial. Preços equilibrados e banco de Cayman seguro.";
        case "manhattan": return "Território de magnatas. Alta demanda para pós de elite e joias.";
        case "queens": return "Grande público comprador. Ótimo comércio varejista.";
        case "bronx": return "Preços altamente voláteis. Perfeito para lucros explosivos.";
        case "staten_island": return "Porto livre de contrabandos. Compras baratas via Chalupa.";
        case "suburbio": return "Periferia esquecida. Boatos sobre um mercado paralelo de alta volatilidade e lucros marginais.";
        default: return "Setor sob vigilância policial moderada.";
      }
    } else {
      switch(id) {
        case "brooklyn": return "HQ and starting turf. Balanced rates and secure banks.";
        case "manhattan": return "Financial district. Extreme elite margins for luxury goods.";
        case "queens": return "Diverse residential area. Excellent local trade volume.";
        case "bronx": return "High volatility hotspot. Perfect for wild price flips.";
        case "staten_island": return "Free shipping harbor. Extremely cheap wholesale purchases.";
        case "suburbio": return "The forgotten slums. Whispered dark alleys where trade values swing wildly.";
        default: return "Active district under patrol.";
      }
    }
  };

  // Travel Transit
  const executeTransitTravel = (targetBorough: Neighborhood) => {
    if (player.location === targetBorough.id) return;
    if (player.energy < targetBorough.travelCost) {
      triggerFeedback(lang === "en" ? "You lack energy for travel!" : "Você está quebrado de fadiga para andar de metrô.");
      return;
    }

    // Play train sound if available
    if (playSound.train) {
      playSound.train();
    }

    const isFerry = targetBorough.id === "staten_island";
    const notification = lang === "en"
      ? `METRO LINE: Boarded transit to ${targetBorough.nameEn}. Drug prices shifted. +25 Energy generated!`
      : `METRÔ METROPOLITANO: Embarcou para o ${targetBorough.namePt}. Preços de rua flutuaram. +25 Energia de brinde!`;

    onTravel(targetBorough.id, targetBorough.travelCost, notification, isFerry);
    triggerFeedback(lang === "en" ? `Arrived in ${targetBorough.nameEn}!` : `Desembarcou no ${targetBorough.namePt}!`);
  };

  // 1-Click Fast Trading
  const handleBuySingle = (drug: Drug, unitPrice: number) => {
    if (player.cash < unitPrice) {
      triggerFeedback(lang === "en" ? "Not enough cash for 1 unit!" : "Sem dinheiro vivo para 1 fardo!");
      return;
    }
    onBuyDrugs(drug.id, 1, unitPrice);
    playSound.cash();
    triggerFeedback(lang === "en" ? `Bought 1x ${drug.nameEn}.` : `Comprou 1x ${drug.namePt}.`);
  };

  const handleBuyMax = (drug: Drug, unitPrice: number) => {
    const maxAfford = Math.floor(player.cash / unitPrice);
    if (maxAfford <= 0) {
      triggerFeedback(lang === "en" ? "Cannot afford any units!" : "Seu saldo é zero para esta cota de preço!");
      return;
    }
    onBuyDrugs(drug.id, maxAfford, unitPrice);
    playSound.cash();
    triggerFeedback(lang === "en" ? `Bought maximum affordable: ${maxAfford}x ${drug.nameEn}.` : `Investiu o máximo: Comprou ${maxAfford}x ${drug.namePt}.`);
  };

  const handleSellSingle = (drug: Drug, unitPrice: number) => {
    const held = player.drugsInventory[drug.id] || 0;
    if (held <= 0) {
      triggerFeedback(lang === "en" ? "You don't own this cargo!" : "Você não tem fardos desta carga para vender!");
      return;
    }
    onSellDrugs(drug.id, 1, unitPrice);
    playSound.cash();
    triggerFeedback(lang === "en" ? `Sold 1x ${drug.nameEn}.` : `Vendeu 1x ${drug.namePt}.`);
  };

  const handleSellAll = (drug: Drug, unitPrice: number) => {
    const held = player.drugsInventory[drug.id] || 0;
    if (held <= 0) {
      triggerFeedback(lang === "en" ? "Inventory empty!" : "Seu estoque está vazio para vender!");
      return;
    }
    onSellDrugs(drug.id, held, unitPrice);
    playSound.cash();
    triggerFeedback(lang === "en" ? `Liquidated entire stock: ${held}x ${drug.nameEn}!` : `Liquidou todo o estoque: Vendidos ${held}x de ${drug.namePt}!`);
  };

  // Adjust Custom Slider Quantities
  const handleCustomQuantityChange = (drugId: string, val: number, maxLimit: number) => {
    const cleaned = Math.max(0, Math.min(maxLimit, val));
    setCustomTradeQtys(prev => ({ ...prev, [drugId]: cleaned }));
  };

  const handleBuyCustom = (drug: Drug, unitPrice: number) => {
    const qty = customTradeQtys[drug.id] || 0;
    if (qty <= 0) {
      triggerFeedback(lang === "en" ? "Choose 1+ units." : "Selecione pelo menos 1 item.");
      return;
    }
    const cost = qty * unitPrice;
    if (player.cash < cost) {
      triggerFeedback(lang === "en" ? "Insufficient cash!" : "Dinheiro em mãos insuficiente para esta quantidade!");
      return;
    }
    onBuyDrugs(drug.id, qty, unitPrice);
    playSound.cash();
    triggerFeedback(lang === "en" ? `Bought ${qty}x ${drug.nameEn}.` : `Comprou ${qty}x ${drug.namePt}.`);
    setCustomTradeQtys(prev => ({ ...prev, [drug.id]: 0 }));
  };

  const handleSellCustom = (drug: Drug, unitPrice: number) => {
    const qty = customTradeQtys[drug.id] || 0;
    const owned = player.drugsInventory[drug.id] || 0;
    if (qty <= 0) {
      triggerFeedback(lang === "en" ? "Select qty to sell." : "Escolha a quantidade para vender.");
      return;
    }
    if (owned < qty) {
      triggerFeedback(lang === "en" ? "Not enough cargo in trunk!" : "Estoque no porta-malas insuficiente!");
      return;
    }
    onSellDrugs(drug.id, qty, unitPrice);
    playSound.cash();
    triggerFeedback(lang === "en" ? `Sold ${qty}x ${drug.nameEn}.` : `Vendeu ${qty}x ${drug.namePt}.`);
    setCustomTradeQtys(prev => ({ ...prev, [drug.id]: 0 }));
  };

  return (
    <div className="space-y-6 select-none font-sans text-zinc-100" id="trade-trafficking-system">
      
      {/* 1. TOP STATS STATUS CONVENIENCE DECK */}
      <div className="industrial-panel p-4 flex flex-col md:flex-row gap-4 justify-between items-center relative overflow-hidden shadow-xl">
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-red-955/20 border border-red-500/25 text-red-500 p-2.5 rounded-xl text-2xl relative">
            🚨
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
          </div>
          <div>
            <span className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest block leading-3">
              {lang === "en" ? "DISTRICT HEADQUARTERS" : "CENTRAL DO SUBMUNDO"}
            </span>
            <h2 className="text-sm md:text-base font-black uppercase text-zinc-100 mt-1">
              {lang === "en" ? "Wholesale Contraband Ledger" : "Bolsa Clandestina de Mercadorias"}
            </h2>
            <p className="text-[10px] font-mono text-zinc-400 mt-0.5 font-bold flex items-center gap-1.5">
              <span>📍 ZONE: {activeNeighborhood ? (lang === "en" ? activeNeighborhood.nameEn : activeNeighborhood.namePt).toUpperCase() : ""}</span>
              {smugglersBonusActive && <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-1 rounded text-[7.5px] animate-pulse">🚢 SMUGGLERS PASS</span>}
            </p>
          </div>
        </div>

        {/* Dynamic Pocket Info */}
        <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-start md:justify-end text-[10.5px]">
          
          <div className="bg-zinc-950/70 py-1.5 px-3 border border-zinc-900 rounded-xl flex items-center gap-2">
            <span className="text-emerald-450 text-xs">💵</span>
            <div>
              <span className="text-[7.5px] font-mono text-zinc-550 block font-black leading-none">{lang === "en" ? "CASH-ON-HAND" : "DINHEIRO EM MÃOS"}</span>
              <span className="text-emerald-400 font-extrabold block mt-0.5">{formatMoney(player.cash)}</span>
            </div>
          </div>

          <div className="bg-zinc-950/70 py-1.5 px-3 border border-zinc-900 rounded-xl flex items-center gap-2">
            <span className="text-cyan-400 text-xs">🏦</span>
            <div>
              <span className="text-[7.5px] font-mono text-zinc-550 block font-black leading-none">{lang === "en" ? "BANK VAULT" : "COFRE SECRETO"}</span>
              <span className="text-cyan-455 text-cyan-400 font-extrabold block mt-0.5">{formatMoney(player.bank)}</span>
            </div>
          </div>

          <div className="bg-zinc-950/70 py-1.5 px-3 border border-zinc-900 rounded-xl flex items-center gap-2">
            <span className="text-red-500 text-xs">🚨</span>
            <div>
              <span className="text-[7.5px] font-mono text-zinc-550 block font-black leading-none">{lang === "en" ? "WANTED HEAT" : "BUSCA POLICIAL"}</span>
              <span className="text-red-400 font-extrabold block mt-0.5">{player.heat ?? 0}%</span>
            </div>
          </div>

          <div className="bg-zinc-950/70 py-1.5 px-3 border border-zinc-900 rounded-xl flex items-center gap-2">
            <span className="text-rose-500 text-xs">❤️</span>
            <div>
              <span className="text-[7.5px] font-mono text-zinc-550 block font-black leading-none">HP STATUS</span>
              <span className="text-rose-400 font-extrabold block mt-0.5">{player.health}/{player.maxHealth || 125}</span>
            </div>
          </div>

        </div>
      </div>

      {localFeedback && (
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-2.5 bg-gradient-to-r from-zinc-950 to-red-955/20 border border-zinc-900 rounded-xl text-center font-mono text-[10px] uppercase text-zinc-300 font-black tracking-wide"
        >
          💥 {localFeedback}
        </motion.div>
      )}

      {/* 0. IMMERSIVE RETRO TRANSIT OVERLAY */}
      <AnimatePresence>
        {isTraveling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-xl p-6 text-center select-none"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-md w-full bg-[#0d0d11]/90 border border-zinc-805 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              {/* Spinning Subway Graphic */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center bg-zinc-900 rounded-full border border-zinc-800 shadow-inner">
                <span className="text-4xl animate-bounce">🚇</span>
                <div className="absolute inset-0 border-2 border-red-500 border-t-transparent rounded-full animate-spin duration-1000" />
              </div>

              <div>
                <h3 className="text-md font-black text-red-500 font-sans tracking-wide uppercase flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  {lang === "en" ? "METROPOLITAN TRANSIT EXPEDITION" : "EMBARQUE TRANSITÓRIO DE NY"}
                </h3>
                <p className="text-xs text-zinc-300 mt-1 uppercase font-mono tracking-widest font-bold">
                  {lang === "en" ? `${player.location} ➔ ${travelToBorough?.id}` : `${player.location.toUpperCase()} ➔ ${(travelToBorough?.id || "").toUpperCase()}`}
                </p>
                <p className="text-[11px] text-zinc-500 mt-2 font-mono leading-relaxed normal-case">
                  {lang === "en" 
                    ? "NYPD controls are tracking transit channels. Swapping asset rates and washing Cayman interest dividends..." 
                    : "Os radares do NYPD vigiam as ferrovias. Sincronizando preços de fardos e lucros imobiliários..."}
                </p>
              </div>

              {/* Progress bar simulation */}
              <div className="w-full bg-zinc-900 h-2.5 rounded-full p-0.5 border border-zinc-800 overflow-hidden">
                <motion.div
                  className="bg-red-500 h-full rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.3 }}
                />
              </div>

              <div className="text-[9px] font-mono text-zinc-500 uppercase">
                {lang === "en" ? "Do not turn off terminal. Ride safe." : "Não feche o terminal. Boa viagem."}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. THE TRANSIT METRO HUB (BOROUGH SELECTION PANEL) */}
      <div className="industrial-panel p-3 space-y-3 relative z-10" id="transit-navigation-block">
        <button 
          onClick={() => {
            playSound.notification();
            setIsTransitExpanded(!isTransitExpanded);
          }}
          className="w-full flex items-center justify-between font-mono text-[10px] font-extrabold hover:text-white transition select-none outline-none"
        >
          <div className="flex items-center gap-2 text-red-500 uppercase tracking-widest flex-wrap">
            <Navigation className="w-4 h-4 text-red-500" />
            <span>
              {lang === "en" ? "METROPOLIS TRANSIT HUB" : "REDE DE METRÔ E TRÂNSITO"}
            </span>
            {cooldownSecs > 0 && (
              <span className="text-[7.5px] font-mono font-bold py-0.5 px-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-md animate-pulse ml-1 shrink-0">
                ⚠️ NYPD WATCH: LOCKOUT {cooldownSecs}s
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8.5px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-900 font-mono">
              📍 {activeNeighborhood ? (lang === "en" ? activeNeighborhood.nameEn : activeNeighborhood.namePt) : ""}
            </span>
            <span className="text-[8.5px] bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-0.5 rounded uppercase tracking-wider font-sans">
              {isTransitExpanded 
                ? (lang === "en" ? "▲ RECOLHER" : "▲ RECOLHER") 
                : (lang === "en" ? "▼ EXPANSIÓN" : "▼ MAPA URBANO / VIAJAR")}
            </span>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isTransitExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-3"
            >
              <div className="h-[1px] bg-zinc-900" />
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono">
                {NEIGHBORHOODS.map((n) => {
                  const isLocal = player.location === n.id;
                  const emoji = getBoroughEmoji(n.id);
                  const tagline = getBoroughTagline(n.id, lang === "pt");
                  
                  let bgImage = null;
                  if (n.id === "brooklyn") bgImage = neighborhoodBrooklynSpriteImage;
                  else if (n.id === "manhattan") bgImage = neighborhoodManhattanSpriteImage;
                  else if (n.id === "queens") bgImage = neighborhoodQueensSpriteImage;

                  return (
                    <div 
                      key={n.id}
                      className={`p-2.5 relative rounded-xl border flex flex-col justify-between transition-all duration-300 overflow-hidden ${
                        isLocal 
                          ? "bg-gradient-to-b from-red-955/15 via-[#0d0c0e]/95 to-red-955/20 border-red-500/50 shadow-md shadow-red-950/25 scale-[1.01]" 
                          : "bg-[#09090b]/80 border-zinc-900 hover:border-zinc-800 hover:scale-[1.01]"
                      }`}
                    >
                      {bgImage && (
                        <>
                          <img src={bgImage} alt={n.id} className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen pointer-events-none" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent pointer-events-none"></div>
                        </>
                      )}
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-xl sm:text-2xl drop-shadow-md">{emoji}</span>
                          {isLocal ? (
                            <span className="text-[7px] font-mono font-black py-0.5 px-1 bg-red-955/50 border border-red-500/20 text-red-500 rounded">
                              STATION
                            </span>
                          ) : (
                            <span className="text-[7.5px] font-mono font-bold py-0.5 px-1 bg-zinc-950/80 backdrop-blur-sm border border-zinc-850 text-amber-500 rounded flex items-center gap-0.5">
                              ⚡-{n.travelCost}
                            </span>
                          )}
                        </div>
                        
                        <h4 className={`text-xs font-sans font-black drop-shadow-md ${isLocal ? "text-red-400" : "text-zinc-200"}`}>
                          {lang === "en" ? n.nameEn : n.namePt}
                        </h4>
                        
                        <p className="text-[8px] text-zinc-400 font-mono mt-0.5 leading-tight tracking-tight normal-case drop-shadow-md">
                          {tagline}
                        </p>
                      </div>

                      {!isLocal && (
                        <button
                          onClick={() => {
                            if (cooldownSecs > 0) return;
                            playSound.notification();
                            executeTransitTravel(n);
                          }}
                          className={`mt-2 w-full py-1 rounded text-[8px] font-mono font-black uppercase text-center transition flex items-center justify-center gap-0.5 cursor-pointer select-none ${
                            cooldownSecs > 0
                              ? "bg-zinc-950/60 border border-amber-500/25 text-amber-500 hover:text-amber-400 cursor-not-allowed animate-pulse"
                              : player.energy >= n.travelCost
                              ? "bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white"
                              : "bg-zinc-950/50 border border-zinc-905 text-zinc-700 cursor-not-allowed"
                          }`}
                          disabled={cooldownSecs > 0 || player.energy < n.travelCost}
                        >
                          {cooldownSecs > 0 ? (
                            <span>⏳ {lang === "en" ? `LOCK (${cooldownSecs}s)` : `TRAVA (${cooldownSecs}s)`}</span>
                          ) : (
                            <>
                              <span>🚇 {lang === "en" ? "BOARD" : "VIAJAR"}</span>
                              <ChevronRight className="w-2 h-2" />
                            </>
                          )}
                        </button>
                      )}

                      {isLocal && (
                        <div className="mt-2 py-0.5 bg-red-500/5 border border-red-500/10 rounded text-center font-mono text-[7px] font-bold text-red-500 uppercase tracking-widest">
                          HQ BASE
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. CORE DRUG TRAFFICKING STOCK DESK */}
      <div className="industrial-panel p-3 space-y-3 relative z-10" id="drugs-accordion-block">
        <button 
          onClick={() => {
            playSound.notification();
            setIsDrugsExpanded(!isDrugsExpanded);
          }}
          className="w-full flex items-center justify-between font-mono text-[10px] font-extrabold hover:text-white transition select-none"
        >
          <div className="flex items-center gap-2 text-amber-500 uppercase tracking-widest flex-wrap">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>
              {lang === "en" ? "CONTRABAND & DRUG STOCK" : "CONTRABANDO DE DROGAS"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8.5px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded uppercase tracking-wider font-sans">
              {isDrugsExpanded 
                ? (lang === "en" ? "▲ RECOLHER" : "▲ RECOLHER") 
                : (lang === "en" ? "▼ EXPANSIÓN" : "▼ LISTA DE DROGAS / CONTRABANDO")}
            </span>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isDrugsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-3"
            >
              <div className="h-[1px] bg-zinc-900" />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="trading-grid">
                
                {/* LEFT COLUMN: THE MASTER LEDGER LISTING (12 OF 12 COLS) */}
                <div className="lg:col-span-12 space-y-3.5">
                  <div className="w-full h-32 md:h-48 relative rounded-2xl overflow-hidden shadow-lg border border-neutral-800 mb-6 flex items-end">
                    <img src={illegalDrugsSpriteImage} alt="Illegal Drugs Contraband" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
                    <h3 className="relative z-10 p-4 text-xl font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
                      <Scale className="w-6 h-6 text-amber-500" />
                      {lang === "en" ? "CONTRABAND PRICE MATRIX EXCHANGE" : "CÁLCULOS E COTAÇÃO DA MALA CLANDESTINA"}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-end border-b border-zinc-900 pb-1.5">
                    <span className="text-[8.5px] font-mono text-zinc-500 font-bold">
                      {lang === "en" ? "MOSAIC VIEW • CLICK ITEM TO OPEN TRADE CABINET" : "MOSAICO DE DROGAS • SELECIONE PARA COMPRAR E VENDER"}
                    </span>
                  </div>

                  {/* Mosaic Grid Layout */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {DRUGS.map((drug) => {
              const currentPrice = prices[drug.id] || drug.basePrice;
              const owned = player.drugsInventory[drug.id] || 0;
              
              const diffBase = currentPrice - drug.basePrice;
              const pctDiff = Math.round((diffBase / drug.basePrice) * 100);

              const isVeryCheap = pctDiff <= -15;
              const isVeryExpensive = pctDiff >= 15;
              const bgImage = getDrugImage(drug.id);

              return (
                <div 
                  key={drug.id}
                  onClick={() => {
                    playSound.notification();
                    setSelectedDrug(drug);
                  }}
                  className={`p-3.5 rounded-xl border relative transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col justify-between h-full group bg-[#070709]/90 shadow-md overflow-hidden ${
                    isVeryCheap 
                      ? "border-emerald-500/25 bg-gradient-to-b from-[#030e06]/40 via-[#070709] to-[#070709] hover:border-emerald-500/60 shadow-[inset_0_1px_1px_rgba(16,185,129,0.05)]" 
                      : isVeryExpensive 
                      ? "border-rose-500/20 bg-gradient-to-b from-[#120405]/40 via-[#070709] to-[#070709] hover:border-rose-500/55 shadow-[inset_0_1px_1px_rgba(239,68,68,0.05)]"
                      : "border-zinc-900 hover:border-zinc-700 hover:bg-[#0c0c0f]"
                  }`}
                  id={`drug-card-${drug.id}`}
                >
                  {bgImage && (
                    <>
                      <img src={bgImage} alt={drug.id} className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen pointer-events-none" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none"></div>
                    </>
                  )}

                  <div className="relative z-10">
                    {/* Top row of Mosaic Drug Cargo */}
                    <div className="flex items-start gap-2.5 mb-2.5">
                      <span className="text-2xl pt-0.5 filter drop-shadow group-hover:scale-110 transition-transform duration-300">
                        {drug.emoji || "📦"}
                      </span>
                      <div className="truncate min-w-0">
                        <h4 className="font-sans font-black text-xs text-zinc-100 group-hover:text-amber-450 group-hover:text-amber-400 transition-colors truncate leading-tight">
                          {lang === "en" ? drug.nameEn : drug.namePt}
                        </h4>
                        
                        {owned > 0 ? (
                          <span className="inline-block mt-1 text-[7.5px] font-mono font-black px-1.5 py-0.5 rounded leading-none bg-zinc-800 text-yellow-500 border border-zinc-750 font-extrabold max-w-full truncate">
                            {lang === "en" ? `${owned} Owned` : `${owned} no Baú`}
                          </span>
                        ) : (
                          <span className="inline-block mt-1 text-[7px] font-mono font-bold px-1.5 py-0.5 rounded leading-none bg-zinc-950 text-zinc-650">
                            {lang === "en" ? "Empty" : "Zero"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Small Description */}
                    <p className="text-[9px] text-zinc-500 font-mono line-clamp-2 h-6 overflow-hidden leading-tight normal-case pr-1.5">
                      {lang === "en" ? drug.descriptionEn : drug.descriptionPt}
                    </p>
                  </div>

                  {/* Pricing Matrix & Bargain indicators - side-by-side inside cell */}
                  <div className="mt-3.5 space-y-2">
                    
                    {/* Signal banner */}
                    <div className="flex items-center justify-between text-[7.5px] font-mono font-extrabold select-none">
                      {isVeryCheap ? (
                        <span className="text-emerald-400 uppercase tracking-tight flex items-center gap-0.5 animate-pulse">
                          📉 {lang === "en" ? `BARGAIN` : `OFERTA`}
                        </span>
                      ) : isVeryExpensive ? (
                        <span className="text-rose-400 uppercase tracking-tight flex items-center gap-0.5 animate-pulse">
                          📈 {lang === "en" ? `GOLDMINE` : `SUPER ALTA`}
                        </span>
                      ) : (
                        <span className="text-zinc-600 bg-zinc-950 border border-zinc-900 px-1 rounded uppercase scale-90 origin-left">
                          {lang === "en" ? "Stable" : "Estável"}
                        </span>
                      )}

                      {pctDiff !== 0 && (
                        <span className={`px-1 rounded ${pctDiff < 0 ? "bg-emerald-950/20 text-emerald-400" : "bg-rose-955/20 text-rose-400"}`}>
                          {pctDiff > 0 ? `+${pctDiff}%` : `${pctDiff}%`}
                        </span>
                      )}
                    </div>

                    {/* Price base and rate side by side (uma ao lado da outra) */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-zinc-900/40 pt-2 text-zinc-300">
                      <div>
                        <span className="text-[7.5px] text-zinc-550 block font-bold uppercase leading-none mb-0.5">
                          {lang === "en" ? "BASE" : "CUSTO"}
                        </span>
                        <span className="text-zinc-450 font-bold leading-none block">
                          {formatMoney(drug.basePrice)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[7.5px] text-zinc-550 block font-bold uppercase leading-none mb-0.5">
                          {lang === "en" ? "RATE" : "VALOR"}
                        </span>
                        <span className={`font-black leading-none block ${isVeryCheap ? "text-emerald-400" : isVeryExpensive ? "text-rose-400" : "text-zinc-100"}`}>
                          {formatMoney(currentPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Action Hint overlay element */}
                    <div className="pt-1 select-none">
                      <div className="w-full py-0.5 text-center font-mono text-[7.5px] text-zinc-600 group-hover:text-[#caa560]/80 group-hover:border-[#caa560]/30 border border-zinc-900/10 rounded transition duration-200 bg-zinc-950/80 backdrop-blur-[2px]">
                        {lang === "en" ? "⚡ PRESS TO NEGOTIATE" : "⚡ CLIQUE PARA NEGOCIAR"}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. THE TRADE CABINET popup menu estilo caixa */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {selectedDrug && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden" key="blackmarket-modal-portal">
              {/* Dark glass backdrop layout */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#090807]/80 backdrop-blur-md"
                onClick={() => setSelectedDrug(null)}
              />
              
              {/* The box container (estilo caixa) */}
            {(() => {
              const drug = selectedDrug;
              const currentPrice = prices[drug.id] || drug.basePrice;
              const owned = player.drugsInventory[drug.id] || 0;
              
              // Afford calculation
              const maxBuyAfford = Math.floor(player.cash / currentPrice);

              // Comparison indices
              const diffBase = currentPrice - drug.basePrice;
              const pctDiff = Math.round((diffBase / drug.basePrice) * 100);

              const isVeryCheap = pctDiff <= -15;
              const isVeryExpensive = pctDiff >= 15;
              const bgImage = getDrugImage(drug.id);

              // Slide parameters
              const sliderQty = customTradeQtys[drug.id] || 0;
              const maxSliderLimit = Math.max(owned, maxBuyAfford);

              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 15 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="relative w-[92vw] sm:w-full sm:max-w-md border-2 border-[#caa560]/55 rounded-2xl p-4 sm:p-5 shadow-[0_30px_70px_rgba(0,0,0,0.96),inset_0_1px_3px_rgba(255,255,255,0.08)] z-10 flex flex-col max-h-[85vh] text-[#ead5ba] overflow-hidden backdrop-blur-xl bg-zinc-950/95 transition-all duration-300"
                  id="trade-cabinet-box-modal"
                >
                  {bgImage && (
                    <>
                      <img src={bgImage} alt={drug.id} className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-screen pointer-events-none" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent pointer-events-none"></div>
                    </>
                  )}

                  <div className="relative z-10 w-full flex flex-col flex-1 h-full max-h-[100%]">
                    {/* Metal Rivet Pins details */}
                  <div className="absolute top-1.5 left-2 w-1 h-1 rounded-full bg-zinc-800 border border-zinc-650 flex items-center justify-center text-[3px] font-bold text-zinc-650 shadow-inner select-none pointer-events-none">•</div>
                  <div className="absolute top-1.5 right-2 w-1 h-1 rounded-full bg-zinc-800 border border-[#caa560]/40 flex items-center justify-center text-[3px] font-bold text-zinc-650 shadow-inner select-none pointer-events-none">•</div>
                  <div className="absolute bottom-1.5 left-2 w-1 h-1 rounded-full bg-zinc-850 border border-[#caa560]/20 flex items-center justify-center text-[3px] font-bold text-zinc-700 shadow-inner select-none pointer-events-none">•</div>
                  <div className="absolute bottom-1.5 right-2 w-1 h-1 rounded-full bg-zinc-850 border border-[#caa560]/20 flex items-center justify-center text-[3px] font-bold text-zinc-700 shadow-inner select-none pointer-events-none">•</div>

                  {/* Cabinet Header bar */}
                  <div className="flex justify-between items-start border-b border-[#caa560]/20 pb-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl filter drop-shadow animate-pulse">{drug.emoji || "📦"}</span>
                      <div>
                        <span className="text-[7.5px] font-mono text-[#caa560] block font-black uppercase tracking-widest leading-none mb-1">
                          {lang === "en" ? "FEDERAL CONTRABAND CABINET" : "GABINETE DE TRANSAÇÕES CONFIDENCIAIS"}
                        </span>
                        <h3 className="text-md sm:text-lg font-black text-zinc-50 flex items-center gap-2 leading-none">
                          {lang === "en" ? drug.nameEn : drug.namePt}
                        </h3>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => { playSound.notification(); setSelectedDrug(null); }}
                      className="text-[9px] font-mono font-black text-rose-500 hover:text-white bg-red-955/20 hover:bg-neutral-900 border border-red-900/30 px-2 py-0.5 rounded-md cursor-pointer transition duration-150"
                    >
                      ✕ {lang === "en" ? "CLOSE" : "FECHAR"}
                    </button>
                  </div>

                  {/* Scrollable body wrapper so that everything fits on any device screen perfectly without pushing the cabinet boundaries */}
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 pr-1 mt-2.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">

                    {/* Specification Spec panel */}
                    <div className="bg-zinc-950/60 border border-zinc-900/80 rounded-xl p-3">
                      <p className="text-[11px] text-zinc-3 w-full pr-1 font-sans italic text-zinc-300 leading-normal">
                        "{lang === "en" ? drug.descriptionEn : drug.descriptionPt}"
                      </p>
                      
                      {drug.effects && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[8.5px] font-mono">
                          <span className="text-zinc-500 font-bold uppercase mr-1">
                            {lang === "en" ? "SPECIFICATION:" : "ESPECIFICAÇÕES:"}
                          </span>
                          {Object.entries(drug.effects).map(([attr, bonus]) => {
                            const val = bonus as number;
                            const isPos = val > 0;
                            return (
                              <span 
                                key={attr} 
                                className={`px-1.5 py-0.5 rounded font-black border ${
                                  isPos 
                                    ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/40" 
                                    : "bg-rose-955/20 text-rose-400 border-rose-900/40"
                                }`}
                              >
                                {attr.toUpperCase()} {isPos ? `+${val}` : val}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Side by side rate displays within the popup */}
                    <div className="grid grid-cols-3 gap-2 bg-[#0d0c0b] border border-zinc-900/80 rounded-xl p-3 font-mono leading-none">
                      <div>
                        <span className="text-[7.5px] text-zinc-550 block font-bold uppercase mb-1">
                          {lang === "en" ? "BASE COST" : "PREÇO BASE"}
                        </span>
                        <span className="text-zinc-400 font-extrabold text-xs">
                          {formatMoney(drug.basePrice)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[7.5px] text-zinc-550 block font-bold uppercase mb-1">
                          {lang === "en" ? "CURRENT RATE" : "TARIFA DE RUA"}
                        </span>
                        <span className={`font-black text-xs ${isVeryCheap ? "text-emerald-400" : isVeryExpensive ? "text-rose-455 text-rose-400" : "text-zinc-100"}`}>
                          {formatMoney(currentPrice)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[7.5px] text-zinc-550 block font-bold uppercase mb-1">
                          {lang === "en" ? "YOUR TRUNK" : "TEU ESTOQUE"}
                        </span>
                        <span className={`font-black text-xs ${owned > 0 ? "text-yellow-500" : "text-zinc-600"}`}>
                          {owned}x
                        </span>
                      </div>
                    </div>

                    {/* Transaction core cabinet slider and action layout */}
                    <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-900/80 flex flex-col gap-3 font-mono">
                      
                      {/* presets layout */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[8.5px] border-b border-zinc-900 pb-2">
                        <span className="text-zinc-550 font-bold uppercase mr-1">
                          {lang === "en" ? "MULTIPLIERS:" : "ATALHOS:"}
                        </span>
                        <button 
                          type="button"
                          onClick={() => handleCustomQuantityChange(drug.id, 0, maxSliderLimit)}
                          className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition cursor-pointer"
                        >
                          {lang === "en" ? "Reset" : "Zerar"}
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleCustomQuantityChange(drug.id, maxBuyAfford, maxSliderLimit)}
                          disabled={maxBuyAfford <= 0}
                          className="px-2 py-0.5 bg-emerald-950/20 hover:bg-emerald-950/30 border border-emerald-900/30 text-emerald-400 hover:text-emerald-300 rounded transition disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {lang === "en" ? "Max Buy" : "Comprar Máx"} ({maxBuyAfford})
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleCustomQuantityChange(drug.id, owned, maxSliderLimit)}
                          disabled={owned <= 0}
                          className="px-2 py-0.5 bg-blue-955/20 hover:bg-blue-955/30 border border-blue-900/30 text-blue-405 text-blue-400 hover:text-blue-300 rounded transition disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {lang === "en" ? "Sell Max" : "Vender Máx"} ({owned})
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleCustomQuantityChange(drug.id, Math.floor(maxBuyAfford / 2), maxSliderLimit)}
                          disabled={maxBuyAfford < 2}
                          className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed"
                        >
                          50% {lang === "en" ? "Buy" : "Comp"}
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleCustomQuantityChange(drug.id, Math.floor(owned / 2), maxSliderLimit)}
                          disabled={owned < 2}
                          className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition disabled:opacity-25 cursor-pointer disabled:cursor-not-allowed"
                        >
                          50% {lang === "en" ? "Sell" : "Vend"}
                        </button>
                      </div>

                      {/* slider & numeric adjustment */}
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-[8px] text-zinc-500 font-extrabold uppercase shrink-0">
                          {lang === "en" ? "VOLUME:" : "QUANTIDADE:"}
                        </span>
                        <input 
                          type="range"
                          min="0"
                          max={maxSliderLimit}
                          value={sliderQty}
                          onChange={(e) => handleCustomQuantityChange(drug.id, parseInt(e.target.value), maxSliderLimit)}
                          className="flex-1 min-w-[100px] h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#caa560]"
                        />
                        <input 
                          type="number"
                          placeholder="0"
                          min="0"
                          max={maxSliderLimit}
                          value={sliderQty || ""}
                          onChange={(e) => handleCustomQuantityChange(drug.id, parseInt(e.target.value) || 0, maxSliderLimit)}
                          className="w-12 bg-zinc-950 border border-zinc-850 rounded text-center text-xs py-1 text-zinc-100 font-extrabold focus:outline-none focus:border-[#caa560]"
                        />
                      </div>

                      {/* Total cost estimate row */}
                      <div className="flex justify-between items-center text-[10px] bg-zinc-950/90 py-2.5 px-3 rounded-lg border border-zinc-900-30 mt-0.5 leading-none">
                        <span className="text-zinc-550 font-black">{lang === "en" ? "TRANSACTION GROSS:" : "TOTAL FINANCEIRO:"}</span>
                        <span className={`font-black text-xs ${sliderQty > 0 ? "text-[#caa560]" : "text-zinc-650"}`}>
                          {formatMoney(sliderQty * currentPrice)}
                        </span>
                      </div>

                      {/* Active Buy/Sell Buttons */}
                      <div className="flex gap-2.5 pt-1.5">
                        <button
                          type="button"
                          onClick={() => handleBuyCustom(drug, currentPrice)}
                          disabled={sliderQty <= 0 || player.cash < (sliderQty * currentPrice)}
                          className="flex-1 py-2.5 bg-gradient-to-r from-emerald-950/25 to-emerald-900/10 text-emerald-400 border border-emerald-900/50 hover:border-emerald-555 rounded-xl text-[10px] font-black uppercase cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none transition shadow"
                        >
                          💸 {lang === "en" ? `CONFIRM BUY (${sliderQty}x)` : `CONFIRMAR COMPRA (${sliderQty}x)`}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSellCustom(drug, currentPrice)}
                          disabled={sliderQty <= 0 || owned < sliderQty}
                          className="flex-1 py-2.5 bg-gradient-to-r from-blue-955/25 to-blue-900/10 text-blue-400 border border-blue-900/50 hover:border-blue-500 rounded-xl text-[10px] font-black uppercase cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed select-none transition shadow"
                        >
                          💼 {lang === "en" ? `CONFIRM SELL (${sliderQty}x)` : `CONFIRMAR VENDA (${sliderQty}x)`}
                        </button>
                      </div>

                    </div>

                    {/* 1-Click Fast Mini Trading Buttons inside the Drawer */}
                    <div className="border-t border-[#caa560]/10 pt-3">
                      <span className="text-[7.5px] font-mono text-zinc-550 block font-black uppercase mb-1.5">
                        {lang === "en" ? "QUICK COMFORT ONE-CLICK TAPS:" : "NEGOCIAÇÃO RÁPIDA DE 1 CLIQUE:"}
                      </span>
                      <div className="grid grid-cols-4 gap-1.5 text-[8px] font-mono text-center">
                        <button
                          type="button"
                          onClick={() => handleBuySingle(drug, currentPrice)}
                          disabled={player.cash < currentPrice}
                          className="py-1.5 bg-zinc-950 hover:bg-emerald-950/20 text-zinc-400 hover:text-emerald-400 border border-zinc-900 rounded-lg transition cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                        >
                          +1 {lang === "en" ? "Buy" : "Comprar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBuyMax(drug, currentPrice)}
                          disabled={maxBuyAfford <= 0}
                          className="py-1.5 bg-zinc-950 hover:bg-emerald-950/30 text-zinc-400 hover:text-emerald-350 rounded-lg border border-zinc-900 transition cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                        >
                          {lang === "en" ? "ALL Buy" : "Tudo Comp"} ({maxBuyAfford})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSellSingle(drug, currentPrice)}
                          disabled={owned <= 0}
                          className="py-1.5 bg-zinc-950 hover:bg-blue-955/20 text-zinc-400 hover:text-blue-400 border border-zinc-900 rounded-lg transition cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                        >
                          -1 {lang === "en" ? "Sell" : "Vender"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSellAll(drug, currentPrice)}
                          disabled={owned <= 0}
                          className="py-1.5 bg-zinc-950 hover:bg-blue-955/30 text-zinc-400 hover:text-blue-350 rounded-lg border border-zinc-900 transition cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
                        >
                          {lang === "en" ? "ALL Sell" : "Tudo Vend"} ({owned})
                        </button>
                      </div>
                    </div>

                  </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
