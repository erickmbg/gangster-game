import React, { useState, useEffect, useRef } from "react";
import { PlayerState, Crime, CRIMES, ORGANIZED_HEISTS, OrganizedHeist, getActivePetBonus, PETS, getCrimesForNeighborhood } from "../types";
import { playSound } from "./AudioEngine";
import { Zap, ShieldAlert, Award, Skull, Flame, Hourglass, DollarSign, Crosshair, HelpCircle, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import crimeSceneImage from "../assets/images/crime_scene_1782178232149.jpg";

const cardVariants = {
  idle: {},
  shakeAndFlash: {
    x: [0, -6, 6, -6, 6, -3, 3, 0],
    borderColor: [
      "rgba(39, 39, 42, 1)",
      "rgba(239, 68, 68, 1)",
      "rgba(245, 158, 11, 1)",
      "rgba(239, 68, 68, 1)",
      "rgba(39, 39, 42, 1)"
    ],
    boxShadow: [
      "0 0 0px rgba(220, 38, 38, 0)",
      "0 0 25px rgba(239, 68, 68, 0.65)",
      "0 0 35px rgba(245, 158, 11, 0.75)",
      "0 0 15px rgba(239, 68, 68, 0.45)",
      "0 0 0px rgba(220, 38, 38, 0)"
    ],
    backgroundColor: [
      "rgba(9, 9, 11, 1)",
      "rgba(254, 242, 242, 0.08)",
      "rgba(255, 251, 235, 0.06)",
      "rgba(254, 242, 242, 0.04)",
      "rgba(9, 9, 11, 1)"
    ],
    transition: {
      duration: 0.85,
      ease: "easeInOut"
    }
  }
};

interface CrimesProps {
  player: PlayerState;
  onCommitCrime: (crime: Crime, rolledSuccess: boolean, lootCash: number, x?: number, y?: number) => void;
  onExecuteHeist: (heist: OrganizedHeist, rolledSuccess: boolean, lootCash: number, x?: number, y?: number) => void;
  triggerAlert: (msg: string, type?: "success" | "warn") => void;
  lang: "en" | "pt";
}

export default function Crimes({ player, onCommitCrime, onExecuteHeist, triggerAlert, lang }: CrimesProps) {
  const [shakingCrimeId, setShakingCrimeId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"solo" | "heist">("solo");
  const [nowTime, setNowTime] = useState<number>(Date.now());
  const [floatingToasts, setFloatingToasts] = useState<Array<{
    id: string;
    text: string;
    color: string;
    icon: string;
    delay: number;
  }>>([]);

  const [executingId, setExecutingId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [progressCaptionEn, setProgressCaptionEn] = useState<string>("");
  const [progressCaptionPt, setProgressCaptionPt] = useState<string>("");
  const timerRef = useRef<any>(null);
  const clickPosRef = useRef<{x: number, y: number} | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Periodically refresh current time to draw heist countdowns correctly
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);



  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  const spawnToasts = (success: boolean, cash: number, respect: number, xp: number, energy: number) => {
    const newToasts: any[] = [];
    const timestamp = Math.random(); // Unique random id
    
    if (success) {
      newToasts.push({
        id: `toast-${timestamp}-status`,
        text: lang === "en" ? "MISSION ACCOMPLISHED" : "GOLPE CONCLUÍDO!",
        color: "from-emerald-500 to-teal-500 text-white font-mono font-black bg-gradient-to-r px-4 py-2 rounded-full border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.35)]",
        icon: "🎯",
        delay: 0,
      });
      
      if (cash > 0) {
        newToasts.push({
          id: `toast-${timestamp}-cash`,
          text: `+ ${formatMoney(cash)}`,
          color: "text-emerald-400 font-extrabold text-sm bg-zinc-950/90 px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-lg",
          icon: "💵",
          delay: 0.15,
        });
      }
      
      if (respect > 0) {
        newToasts.push({
          id: `toast-${timestamp}-respect`,
          text: `+ ${respect} Respeito`,
          color: "text-red-400 font-bold text-xs bg-zinc-950/90 px-3 py-1 rounded-xl border border-red-500/30 shadow-lg",
          icon: "💀",
          delay: 0.3,
        });
      }

      if (xp > 0) {
        newToasts.push({
          id: `toast-${timestamp}-xp`,
          text: `+ ${xp} Rep XP`,
          color: "text-indigo-400 font-bold text-xs bg-zinc-950/90 px-3 py-1 rounded-xl border border-indigo-500/30 shadow-lg",
          icon: "★",
          delay: 0.45,
        });
      }

      if (energy > 0) {
        newToasts.push({
          id: `toast-${timestamp}-energy`,
          text: `- ${energy} Energia`,
          color: "text-amber-500 font-bold text-xs bg-zinc-950/90 px-3 py-1 rounded-xl border border-amber-500/30 shadow-lg",
          icon: "⚡",
          delay: 0.6,
        });
      }
    } else {
      newToasts.push({
        id: `toast-${timestamp}-status`,
        text: lang === "en" ? "MISSION FAILED" : "FRACASSO DO GOLPE",
        color: "from-red-650 to-red-500 text-white font-mono font-black bg-gradient-to-r px-4 py-2 rounded-full border border-red-400/30 shadow-[0_0_15px_rgba(239,68,68,0.35)]",
        icon: "🚨",
        delay: 0,
      });

      if (energy > 0) {
        newToasts.push({
          id: `toast-${timestamp}-energy`,
          text: `- ${energy} Energia`,
          color: "text-amber-500 font-bold text-xs bg-zinc-950/90 px-3 py-1 rounded-xl border border-amber-500/30 shadow-lg",
          icon: "⚡",
          delay: 0.15,
        });
      }

      if (respect > 0) {
        newToasts.push({
          id: `toast-${timestamp}-respect`,
          text: `+ ${respect} Respeito`,
          color: "text-red-400 font-semibold text-xs bg-zinc-950/90 px-3 py-1 rounded-xl border border-red-500/25 shadow-lg",
          icon: "💀",
          delay: 0.3,
        });
      }
    }

    setFloatingToasts((prev) => [...prev, ...newToasts]);

    setTimeout(() => {
      setFloatingToasts((prev) => prev.filter((t) => !newToasts.some((nt) => nt.id === t.id)));
    }, 4500);
  };

  const resolveCrimeOutcome = (crime: Crime) => {
    // Calculate dynamic boost from Willpower
    // Every point of willpower boosts success odds slightly (+0.1% per point, max +15%)
    const willpowerModifier = Math.min(0.15, player.willpower * 0.001);
    const heatLevel = player.heat ?? 0;
    const heatPenalty = Math.min(0.40, (heatLevel / 100) * 0.40); // up to -40% success rate at 100 heat
    const petBonus = getActivePetBonus(player);
    const companionModifier = (petBonus.type === "crime_success") ? petBonus.value : 0;
    const finalOdds = Math.max(0.15, Math.min(0.95, crime.successRate + willpowerModifier + companionModifier - heatPenalty));

    const roll = Math.random();
    const success = roll <= finalOdds;

    let lootCash = 0;

    if (success) {
      playSound.crimeSuccess();
      // Cash reward, boosted by willpower (up to +20%)
      const baseLoot = Math.floor(Math.random() * (crime.rewardCashMax - crime.rewardCashMin + 1)) + crime.rewardCashMin;
      const willBonus = Math.floor(baseLoot * Math.min(0.20, player.willpower * 0.002));
      lootCash = baseLoot + willBonus;

      triggerAlert(
        lang === "en" ? `SUCCESS! Executed "${crime.nameEn}". Looted ${formatMoney(lootCash)}, +${crime.rewardRespect} Respect, +${crime.rewardExp} XP.`
                      : `SUCESSO! Golpeou "${crime.namePt}". Saqueou ${formatMoney(lootCash)}, +${crime.rewardRespect} Respect, +${crime.rewardExp} XP.`,
        "success"
      );

      onCommitCrime(crime, true, lootCash, clickPosRef.current?.x, clickPosRef.current?.y);
      spawnToasts(true, lootCash, crime.rewardRespect, crime.rewardExp, crime.energyCost);
      if (crime.minIntellect >= 25) {
        setShakingCrimeId(crime.id);
        setTimeout(() => setShakingCrimeId(null), 1200);
      }
    } else {
      playSound.crimeFail();
      triggerAlert(
        lang === "en" ? `BUSTED! The heist failed. You got spotted. Lost ${crime.energyCost} Energy.`
                      : `FRACASSO! O golpe deu errado. Você foi avistado. Gastou ${crime.energyCost} de Energia fugindo.`,
        "warn"
      );

      onCommitCrime(crime, false, 0, clickPosRef.current?.x, clickPosRef.current?.y);
      spawnToasts(false, 0, 0, 0, crime.energyCost);
    }
  };

  const handleCommitCrime = (crime: Crime, e: React.MouseEvent) => {
    if (e) {
      clickPosRef.current = { x: e.clientX, y: e.clientY };
    }
    if (player.energy < crime.energyCost) return;
    if (player.intellect < crime.minIntellect) return;
    if (executingId) return;

    const duration = 
      crime.id === "pickpocket" ? 1300 :
      crime.id === "shoplift" ? 2000 :
      crime.id === "car_theft" ? 2800 :
      crime.id === "atm_hack" ? 3600 :
      crime.id === "jewelry_rub" ? 4400 : 2500;

    setExecutingId(crime.id);
    setProgress(0);
    playSound.trainStat(); // Click sound effect to initiate progress

    const captionsEn = 
      crime.id === "pickpocket" ? [
        "Studying target patterns...",
        "Positioning within close proximity...",
        "Executing slick pickpocket grab...",
        "Vanishing into crowded subway tunnel..."
      ] :
      crime.id === "shoplift" ? [
        "Analyzing cashier blind spots...",
        "Silently pocketing luxury items...",
        "Bypassing exit scanner fields...",
        "Passing automatic exit doors calmly..."
      ] :
      crime.id === "car_theft" ? [
        "Sizing up vehicle security brackets...",
        "Slim-jimming driver-side glass frame...",
        "Splicing active hotwires under dash...",
        "Flooring gas pedal outbound..."
      ] :
      crime.id === "atm_hack" ? [
        "Affixing advanced clone card reader...",
        "Injecting custom kernel exploit script...",
        "Triggering dispenser payout hardware...",
        "Sack-bagging flying currency stacks..."
      ] :
      crime.id === "jewelry_rub" ? [
        "Masking up and aiming sledgehammer...",
        "Shattering heavy reinforced displays...",
        "Scooping premium raw gemstones...",
        "Dodging alarm dispatch sweeps..."
      ] : [
        "Meticulously planning operation details...",
        "Approaching target zone with caution...",
        "Securing loot and escaping..."
      ];

    const captionsPt = 
      crime.id === "pickpocket" ? [
        "Estudando a movimentação do alvo...",
        "Aproximando com cautela...",
        "Puxando carteira sorrateiramente...",
        "Sumindo em meio à multidão do metrô..."
      ] :
      crime.id === "shoplift" ? [
        "Mapeando pontos cegos do caixa...",
        "Escondendo eletrônicos de alto valor...",
        "Passando pelas antenas magnéticas...",
        "Saindo da loja sem levantar dúvidas..."
      ] :
      crime.id === "car_theft" ? [
        "Inspecionando travas do conversível...",
        "Forçando a fechadura com gazua...",
        "Fazendo fiação direta acelerada...",
        "Saindo cantando pneu no asfalto..."
      ] :
      crime.id === "atm_hack" ? [
        "Instalando dispositivo clonador de chip...",
        "Injetando exploit no firmware do terminal...",
        "Forçando descarga eletrônica de cédulas...",
        "Garantindo os maços de notas frias..."
      ] :
      crime.id === "jewelry_rub" ? [
        "Ajustando capuz e mirando a marreta...",
        "Destruindo os balcões de vidro...",
        "Limpando as vitrines de esmeraldas...",
        "Evitando as patrulhas convocadas..."
      ] : [
        "Sintonizando detalhes primários...",
        "Iniciando manobra de aproximação...",
        "Limpando rastros e finalizando..."
      ];

    let currentPct = 0;
    const intervalTime = 30;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      currentPct += (intervalTime / duration) * 100;
      if (currentPct >= 100) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setProgress(100);
        setExecutingId(null);
        resolveCrimeOutcome(crime);
      } else {
        const rounded = Math.round(currentPct);
        setProgress(rounded);
        const captionIndex = Math.min(
          captionsEn.length - 1,
          Math.floor((currentPct / 100) * captionsEn.length)
        );
        setProgressCaptionEn(captionsEn[captionIndex]);
        setProgressCaptionPt(captionsPt[captionIndex]);
      }
    }, intervalTime);
  };

  const handleExecuteHeist = (heist: OrganizedHeist, e: React.MouseEvent) => {
    if (e) {
      clickPosRef.current = { x: e.clientX, y: e.clientY };
    }
    const nextAvail = player.heistCooldowns[heist.id] || 0;
    if (nowTime < nextAvail) return; // on cooldown
    if (player.energy < heist.energyCost) return;

    // Willpower boosts heist odds slightly as well
    const willpowerModifier = Math.min(0.08, player.willpower * 0.0005);
    const heatLevel = player.heat ?? 0;
    const heatPenalty = Math.min(0.25, (heatLevel / 100) * 0.25); // up to -25% for heists at max heat
    const petBonus = getActivePetBonus(player);
    const companionModifier = (petBonus.type === "crime_success") ? petBonus.value : 0;
    const finalOdds = Math.max(0.10, Math.min(0.85, heist.successRate + willpowerModifier + companionModifier - heatPenalty));

    const roll = Math.random();
    const success = roll <= finalOdds;

    let lootCash = 0;

    if (success) {
      playSound.gunshot();
      const baseLoot = Math.floor(Math.random() * (heist.rewardCashMax - heist.rewardCashMin + 1)) + heist.rewardCashMin;
      const willBonus = Math.floor(baseLoot * Math.min(0.20, player.willpower * 0.002));
      lootCash = baseLoot + willBonus;

      triggerAlert(
        lang === "en" ? `HEIST ACCOMPLISHED! Secured ${formatMoney(lootCash)}, +${heist.rewardRespect} Respect, +${heist.rewardExp} EXP!`
                      : `ASSALTO DE SUCESSO! Garantiu ${formatMoney(lootCash)}, +${heist.rewardRespect} Respect, +${heist.rewardExp} XP!`,
        "success"
      );

      onExecuteHeist(heist, true, lootCash, clickPosRef.current?.x, clickPosRef.current?.y);
      spawnToasts(true, lootCash, heist.rewardRespect, heist.rewardExp, heist.energyCost);
      setShakingCrimeId(heist.id);
      setTimeout(() => setShakingCrimeId(null), 1200);
    } else {
      playSound.crimeFail();
      triggerAlert(
        lang === "en" ? `ALARM TRIGGERED! Escaped with bullet grazing. Lost ${heist.energyCost} Energy.`
                      : `ALARMES DISPARADOS! Abandonou a operação e fugiu. Gastou ${heist.energyCost} de Energia.`,
        "warn"
      );

      onExecuteHeist(heist, false, 0, clickPosRef.current?.x, clickPosRef.current?.y);
      spawnToasts(false, 0, 10, 0, heist.energyCost);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden" id="crimes-tab">
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none z-0">
        <img 
          src={crimeSceneImage} 
          alt="Crime Scene Cover" 
          className="w-full h-full object-cover mix-blend-screen"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-transparent"></div>
      </div>
      
      {/* Wanted Heat Indicator Panel */}
      {player.heat !== undefined && player.heat > 5 && (
        <div className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono font-bold transition duration-150 ${
          player.heat > 60 
            ? "bg-red-950/20 border-red-500/35 text-red-400 animate-pulse" 
            : player.heat > 30 
              ? "bg-amber-950/20 border-amber-500/35 text-amber-400"
              : "bg-zinc-950/45 border-zinc-800 text-zinc-400"
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-lg animate-bounce select-none">🚨</span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 text-zinc-100">
                <span>{lang === "en" ? "NYPD HIGH HEAT WARRANT ALERT!" : "ALERTA DA DELEGACIA DE COMBATE AO CRIME!"}</span>
                <span className="bg-red-500 text-white font-sans text-[8px] px-1.5 py-0.5 rounded font-black uppercase animate-pulse">
                  {player.heat}% Wanted
                </span>
              </p>
              <p className="text-[10.5px] font-sans font-normal text-zinc-400 mt-0.5 max-w-xl">
                {lang === "en" 
                  ? `Your Wanted Level is at ${player.heat}%. Swiss vaults, lawyers, or laying low will cool it down. Current operations suffer failure-odds inflation.`
                  : `Seu Nível de Procurado está em ${player.heat}%. Dê subornos clandestinos na clínica ou aguarde para despistar as viaturas no tráfego.`}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-850 self-start sm:self-center">
            <span className="text-[10px] text-zinc-550 text-zinc-500">📉 {lang === "en" ? "PENALTY" : "PENALIDADE"}:</span>
            <span className={player.heat > 60 ? "text-red-500 font-extrabold" : "text-amber-500 font-extrabold"}>
              -{Math.round(Math.min(0.40, ((player.heat ?? 0) / 100) * 0.40) * 100)}% SUCCESS
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-850 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Flame className="w-5.5 h-5.5 text-red-500 animate-pulse" />
            {lang === "en" ? "Black Ops & Underworld Crime" : "Atividades Ilícitas & Assaltos"}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            {lang === "en" 
              ? "Exert energy to gain street cash and rise through hierarchy. Train intellect to bypass high level mainframe systems."
              : "Gaste sua energia para extrair dinheiro das ruas e subir a hierarquia criminosa. Treine seu intelecto para roubos de alta escala."}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850">
          <button 
            disabled={!!executingId}
            onClick={() => { playSound.notification(); setActiveTab("solo"); }}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${executingId ? "opacity-40 cursor-not-allowed" : ""} ${activeTab === "solo" ? "bg-red-600 text-white shadow" : "text-zinc-500 hover:text-zinc-200"}`}
          >
            {lang === "en" ? "PETTY STREET" : "CRIMES DE RUA"}
          </button>
          <button 
            disabled={!!executingId}
            onClick={() => { playSound.notification(); setActiveTab("heist"); }}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${executingId ? "opacity-40 cursor-not-allowed" : ""} ${activeTab === "heist" ? "bg-red-655 bg-red-600 text-white shadow" : "text-zinc-500 hover:text-zinc-200"}`}
          >
            💣 {lang === "en" ? "ORGANIZED HEISTS" : "GRANDES GOLPES"}
          </button>
        </div>
      </div>

      {/* Solo Crimes Tab */}
      {activeTab === "solo" && (
        <div className="space-y-4">
          {getCrimesForNeighborhood(player.location).map((crime) => {
            const hasEnergy = player.energy >= crime.energyCost;
            const hasIntellect = player.intellect >= crime.minIntellect;
            const canCommit = hasEnergy && hasIntellect;

            // Live success odds
            const willpowerModifier = Math.min(0.15, player.willpower * 0.001);
            const heatLevel = player.heat ?? 0;
            const heatPenalty = Math.min(0.40, (heatLevel / 100) * 0.40);
            const petBonus = getActivePetBonus(player);
            const companionModifier = (petBonus.type === "crime_success") ? petBonus.value : 0;
            const realOddsPct = Math.round(Math.max(0.15, Math.min(0.95, crime.successRate + willpowerModifier + companionModifier - heatPenalty)) * 100);

            return (
              <motion.div 
                key={crime.id} 
                variants={cardVariants}
                animate={shakingCrimeId === crime.id ? "shakeAndFlash" : "idle"}
                className={`industrial-panel p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-zinc-700`}
              >
                {/* Screws */}
                <div className="industrial-screw industrial-screw-tl hidden md:block"></div>
                <div className="industrial-screw industrial-screw-bl hidden md:block"></div>
                <div className="space-y-1 max-w-xl">
                  <h3 className="text-sm font-bold text-zinc-100 font-sans flex items-center gap-2">
                    {lang === "en" ? crime.nameEn : crime.namePt}
                    {crime.minIntellect > 0 && (
                      <span className="text-[9px] bg-indigo-950 border border-indigo-900/40 text-indigo-300 font-mono px-1.5 py-0.5 rounded uppercase">
                        🧠 req {crime.minIntellect} intel
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    {lang === "en" ? crime.descriptionEn : crime.descriptionPt}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-500 mt-2 font-mono uppercase font-bold items-center">
                    <span className="flex items-center gap-1 text-emerald-500">
                      💰 {formatMoney(crime.rewardCashMin)} - {formatMoney(crime.rewardCashMax)}
                    </span>
                    <span className="flex items-center gap-1 text-indigo-400">
                      ★ {crime.rewardExp} XP
                    </span>
                    <span className="flex items-center gap-1 text-red-500">
                      💀 +{crime.rewardRespect} respect
                    </span>
                    <span className={`flex items-center gap-1 font-bold ${heatLevel > 30 ? "text-red-500 animate-pulse" : "text-yellow-500"}`}>
                      🎯 {realOddsPct}% {lang === "en" ? "odds" : "chances"}
                    </span>
                    {heatPenalty > 0 && (
                      <span className="text-[9px] bg-red-950/40 border border-red-900/50 text-red-400 px-1.5 py-0.5 rounded font-black tracking-tighter uppercase whitespace-nowrap">
                        🚨 -{Math.round(heatPenalty * 100)}% Heat
                      </span>
                    )}
                    {((player.underSurveillanceUntil && player.underSurveillanceUntil > Date.now()) || (player.taxDebt !== undefined && player.taxDebt > 0)) && (
                      <span className="text-[9px] bg-red-950 border border-red-500 text-red-500 px-1.5 py-0.5 rounded font-black tracking-tighter uppercase whitespace-nowrap animate-pulse">
                        🕵️ 2x RISK
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-zinc-900">
                  <div className="text-xs text-zinc-400 flex items-center gap-1 bg-zinc-900 p-2 rounded-xl border border-zinc-800 font-mono">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>-{crime.energyCost} {lang === "en" ? "NRG" : "ENER"}</span>
                  </div>

                  {executingId === crime.id ? (
                    <div className="flex flex-col items-end gap-1.5 w-44 select-none pr-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin shrink-0"></span>
                        <span className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest animate-pulse">
                          {progress}%
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 text-right truncate max-w-[170px] lock-caption-text">
                        {lang === "en" ? progressCaptionEn : progressCaptionPt}
                      </span>
                      {/* Micro progress fill */}
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-red-650 to-red-500 origin-left"
                          style={{ width: `${progress}%` }}
                          transition={{ duration: 0.05 }}
                        />
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => handleCommitCrime(crime, e)}
                      disabled={!!executingId || !canCommit || player.health < 1}
                      className={`industrial-btn px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase w-28 text-center ${
                        !executingId && canCommit && player.health > 0 
                          ? `text-white hover:scale-105 active:scale-95 ${player.heat > 70 ? "animate-shake-danger !border-red-400 !text-red-100 !shadow-[0_0_15px_rgba(220,38,38,0.6)]" : ""}` 
                          : "text-zinc-600 cursor-not-allowed opacity-45"
                      }`}
                    >
                      {!!executingId 
                        ? (lang === "en" ? "BUSY" : "OCUPADO")
                        : !hasIntellect 
                          ? (lang === "en" ? "STUPID" : "BURRO DEMAIS") 
                          : !hasEnergy 
                            ? (lang === "en" ? "TIRED" : "SEM ENERGIA") 
                            : (lang === "en" ? "ATTEMPT" : "EXECUTAR")}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Organized Heists Tab */}
      {activeTab === "heist" && (
        <div className="space-y-4 font-sans">
          <div className="bg-amber-600/10 border border-amber-600/30 text-amber-200 text-xs p-4 rounded-2xl mb-4 flex gap-2">
            <span className="mt-0.5">📢</span>
            <p className="leading-relaxed font-mono">
              <strong>{lang === "en" ? "TACTICAL ADVISORY:" : "CONSELHO TÁTICO:"}</strong>{" "}
              {lang === "en"
                ? "Organized operations have high federal heat and triggers an automatic escape timer after play. If alarms go off, you still earn small scrap respect for the exchange."
                : "Grandes roubos geram altos radares policiais e aplicam tempos de espera programados. Mesmo que dê errado, você garante respeito pelas cicatrizes e experiência de fuga."}
            </p>
          </div>

          {ORGANIZED_HEISTS.map((heist) => {
            const nextAvail = player.heistCooldowns[heist.id] || 0;
            const isOnCooldown = nowTime < nextAvail;
            const cooldownLeft = Math.ceil((nextAvail - nowTime) / 1000);

            // Format cooldown as MM:SS for authentic countdown styling
            const m = String(Math.floor(cooldownLeft / 60)).padStart(2, "0");
            const s = String(cooldownLeft % 60).padStart(2, "0");
            const cooldownFormatted = `${m}:${s}`;

            // Cooldown percentage for progress bar
            const totalCdMs = heist.cooldownSeconds * 1000;
            const elapsedCdMs = Math.max(0, nextAvail - nowTime);
            const pct = Math.min(100, Math.round((elapsedCdMs / totalCdMs) * 100));

            const hasEnergy = player.energy >= heist.energyCost;
            const canCommit = hasEnergy && !isOnCooldown;

            const willpowerModifier = Math.min(0.08, player.willpower * 0.0005);
            const heatLevel = player.heat ?? 0;
            const heatPenalty = Math.min(0.25, (heatLevel / 100) * 0.25);
            const petBonus = getActivePetBonus(player);
            const companionModifier = (petBonus.type === "crime_success") ? petBonus.value : 0;
            const realOddsPct = Math.round(Math.max(0.10, Math.min(0.85, heist.successRate + willpowerModifier + companionModifier - heatPenalty)) * 100);

            return (
              <motion.div 
                key={heist.id} 
                variants={cardVariants}
                animate={shakingCrimeId === heist.id ? "shakeAndFlash" : "idle"}
                className={`industrial-panel p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition relative overflow-hidden ${isOnCooldown ? "opacity-60 grayscale-[0.8]" : ""}`}
              >
                {/* Screws */}
                <div className="industrial-screw industrial-screw-tr hidden md:block"></div>
                <div className="industrial-screw industrial-screw-br hidden md:block"></div>
                {/* Thin sleek glowing cooldown progress bar at the very top of Cooldown cards */}
                {isOnCooldown && (
                  <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-zinc-900 overflow-hidden">
                    <motion.div 
                      className="bg-yellow-500 h-full shadow-[0_0_10px_#f59e0b]"
                      initial={{ width: `${pct}%` }}
                      animate={{ width: `${pct}%` }}
                      transition={{ ease: "linear" }}
                    />
                  </div>
                )}

                <div className="space-y-1.5 flex-1 select-none">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                      ⚔️ {lang === "en" ? heist.nameEn : heist.namePt}
                    </h3>
                    {isOnCooldown && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-800 text-yellow-500 px-2.5 py-0.5 rounded-lg animate-pulse">
                        <Hourglass className="w-3 h-3 animate-spin text-yellow-500" /> {cooldownFormatted} Cooldown
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                    {lang === "en" ? heist.descriptionEn : heist.descriptionPt}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-500 pt-1 font-mono uppercase font-bold items-center">
                    <span className="flex items-center gap-0.5 text-emerald-500">
                      💵 {formatMoney(heist.rewardCashMin)} - {formatMoney(heist.rewardCashMax)}
                    </span>
                    <span className="flex items-center gap-0.5 text-indigo-400">
                      ★ {heist.rewardExp} XP
                    </span>
                    <span className="flex items-center gap-0.5 text-red-500">
                      💀 +{heist.rewardRespect} respect
                    </span>
                    <span className={`font-bold ${heatLevel > 30 ? "text-red-500 animate-pulse" : "text-yellow-605 text-yellow-500"}`}>
                      🎯 {realOddsPct}% {lang === "en" ? "success" : "de sucesso"}
                    </span>
                    {heatPenalty > 0 && (
                      <span className="text-[9px] bg-red-950/40 border border-red-900/50 text-red-400 px-1.5 py-0.5 rounded font-black tracking-tighter uppercase whitespace-nowrap">
                        🚨 -{Math.round(heatPenalty * 100)}% Heat
                      </span>
                    )}
                    {((player.underSurveillanceUntil && player.underSurveillanceUntil > Date.now()) || (player.taxDebt !== undefined && player.taxDebt > 0)) && (
                      <span className="text-[9px] bg-red-950 border border-red-500 text-red-500 px-1.5 py-0.5 rounded font-black tracking-tighter uppercase whitespace-nowrap animate-pulse">
                        🕵️ 2x RISK
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-zinc-900">
                  <div className="text-xs text-zinc-400 flex items-center gap-1 bg-zinc-900 p-2 rounded-xl border border-zinc-800 font-mono">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>-{heist.energyCost} {lang === "en" ? "NRG" : "ENER"}</span>
                  </div>

                  <button 
                    onClick={(e) => handleExecuteHeist(heist, e)}
                    disabled={!canCommit || player.health < 1}
                    className={`industrial-btn px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase flex items-center gap-1 ${
                      canCommit && player.health > 0 
                        ? `text-white hover:scale-105 active:scale-95 ${player.heat > 70 ? "animate-shake-danger !border-red-400 !text-red-100 !shadow-[0_0_15px_rgba(220,38,38,0.6)]" : ""}` 
                        : "text-zinc-600 cursor-not-allowed opacity-45"
                    }`}
                  >
                    {isOnCooldown 
                      ? `${cooldownFormatted} COOLDOWN`
                      : !hasEnergy 
                        ? (lang === "en" ? "TIRED" : "SEM ENERGIA") 
                        : (lang === "en" ? "PULL HEIST" : "INICIAR ASSALTO")}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Floating particles and rewards overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-3xl select-none">
        <AnimatePresence>
          {floatingToasts.map((toast, idx) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, scale: 0.6, y: 350, x: -50 }}
              animate={{ 
                opacity: [0, 1, 1, 0],
                scale: [0.6, 1.1, 1, 0.75],
                y: [350, 180, 100, -30],
                x: [
                  -50 + (idx % 2 === 0 ? -30 : 30), 
                  -50 + Math.sin(idx) * 70, 
                  -50 + Math.cos(idx) * 95,
                  -50 + Math.sin(idx * 2) * 125
                ]
              }}
              transition={{ 
                duration: 2.8, 
                ease: "easeOut",
                delay: toast.delay,
                times: [0, 0.12, 0.82, 1]
              }}
              exit={{ opacity: 0 }}
              className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex items-center shadow-2xl"
            >
              <div className={`${toast.color} flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-black border uppercase tracking-wider backdrop-blur-md`}>
                <span className="text-sm">{toast.icon}</span>
                <span>{toast.text}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>



    </div>
  );
}
