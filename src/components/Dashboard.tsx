import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PlayerState, GameItem, SHOP_ITEMS, getLevelTitle, getActivePetBonus, PETS, getDynamicItemProps } from "../types";
import { playSound } from "./AudioEngine";
import { Shield, Skull, Zap, Heart, Award, Landmark, ShieldAlert, Languages, Trash2, ArrowUpRight, Check, Sparkles, ChevronDown, ChevronUp, Home, Wrench, Leaf, Dices, Coins, Store, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  player: PlayerState;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  lang: "en" | "pt";
  setLang: (lang: "en" | "pt") => void;
  onReset: () => void;
  onUpdatePlayerState?: (updater: (prev: PlayerState) => PlayerState) => void;
  addGameLog?: (en: string, pt: string, type: any, icon: string) => void;
  triggerAlert?: (msg: string, type?: "success" | "warn") => void;
  subTab?: "dossier" | "patrimonio" | "rua";
  onSubTabChange?: (tab: "dossier" | "patrimonio" | "rua") => void;
  onBuyItem?: (item: GameItem) => void;
}

export interface UnderworldBuilding {
  id: string;
  namePt: string;
  nameEn: string;
  cost: number;
  emoji: string;
  descriptionPt: string;
  descriptionEn: string;
}

export const BUILDINGS: Record<string, UnderworldBuilding> = {
  hotel: {
    id: "hotel",
    namePt: "Hotel Underworld",
    nameEn: "Underworld Hotel",
    cost: 15000,
    emoji: "🏨",
    descriptionPt: "Gera lucros passivos e limpa dinheiro sujo de forma inteligente.",
    descriptionEn: "Produces dynamic passive underworld dividends over time."
  },
  office: {
    id: "office",
    namePt: "Escritório do Sindicato",
    nameEn: "Syndicate Office",
    cost: 50000,
    emoji: "🏢",
    descriptionPt: "Controla esquemas de extorsão. Níveis são caros e aumentam limite de crimes e extorsões de mafiosos.",
    descriptionEn: "Controls extortions. Highly expensive upgrades, up to 50 active extortions."
  },
  club: {
    id: "club",
    namePt: "Clube Backdoor",
    nameEn: "Backdoor Nightclub",
    cost: 30000,
    emoji: "💃",
    descriptionPt: "Recruta acompanhantes profissionais (Natasha, Bianca, Larissa, Yasmim) que aumentam atributos permanentemente.",
    descriptionEn: "Hires customized girls that grant permanent attributes to your profile."
  },
  drink_factory: {
    id: "drink_factory",
    namePt: "Fábrica de Bebidas",
    nameEn: "Moonshine Distillery",
    cost: 20000,
    emoji: "🍺",
    descriptionPt: "Fabrique suas próprias bebidas alcoólicas e energéticos raros para curar fadiga.",
    descriptionEn: "Brew custom alcohol and energy tonics to instantly restore energy levels."
  },
  drug_factory: {
    id: "drug_factory",
    namePt: "Fábrica de Drogas",
    nameEn: "Hydro Drug Lab",
    cost: 25000,
    emoji: "🧪",
    descriptionPt: "Produza entorpecentes básicos com cotações e custos de produção controlados de forma autônoma.",
    descriptionEn: "Manufacture basic street drugs using manual raw materials and level."
  },
  car_factory: {
    id: "car_factory",
    namePt: "Fábrica de Veículos",
    nameEn: "Underground Garage",
    cost: 35000,
    emoji: "🚗",
    descriptionPt: "Produza biocombustível essencial. Sem combustível, veículos equipados não fornecem atributos táticos de defesa.",
    descriptionEn: "Fabricate fuel unit packs. Vehicles require fuel to apply passive defense."
  },
  feed_factory: {
    id: "feed_factory",
    namePt: "Fábrica de Ração",
    nameEn: "Mascot Feed Mill",
    cost: 15000,
    emoji: "🦴",
    descriptionPt: "Produza rações especiais para mascotes. Sem ração equipada, cães de guarda não dão bônus.",
    descriptionEn: "Produce nutritious dog kibbles. Pets require pet food to apply attributes."
  },
  revolver_factory: {
    id: "revolver_factory",
    namePt: "Fábrica de Armamento",
    nameEn: "Tactical Munitions",
    cost: 30000,
    emoji: "🔫",
    descriptionPt: "Comande prensas industriais de munição tática. Sem munição, armas não fornecem ataque em combate.",
    descriptionEn: "Piston custom military grade ammo packets. Weapons require active ammunition."
  },
  laboratory: {
    id: "laboratory",
    namePt: "Laboratório Secreto",
    nameEn: "Premium Chemistry Lab",
    cost: 1000000,
    emoji: "💎",
    descriptionPt: "Requer Nível de Jogador 20 e Empresário Nível 3. Fabrica superdrogas puras e raras em troca de Conexões.",
    descriptionEn: "Requires Level 20 & Businessman level 3. Crafts super pure design drugs using Syndicate Connections."
  }
};

export const INITIAL_STREET_SLOTS = [
  { id: "slot_1", purchased: false, buildingId: null, level: 0 },
  { id: "slot_2", purchased: false, buildingId: null, level: 0 },
  { id: "slot_3", purchased: false, buildingId: null, level: 0 },
  { id: "slot_4", purchased: false, buildingId: null, level: 0 },
  { id: "slot_5", purchased: false, buildingId: null, level: 0 },
  { id: "slot_6", purchased: false, buildingId: null, level: 0 },
];

export default function Dashboard({ 
  player, 
  onDeposit, 
  onWithdraw, 
  lang, 
  setLang, 
  onReset,
  onUpdatePlayerState,
  addGameLog,
  triggerAlert,
  subTab = "dossier",
  onSubTabChange,
  onBuyItem
}: DashboardProps) {
  const [bankAmount, setBankAmount] = useState<string>("");
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(true);
  const [carPosition, setCarPosition] = useState<number>(0);
  const [taxiPosition, setTaxiPosition] = useState<number>(100);
  const [pedestrians, setPedestrians] = useState([
    { id: 1, x: 20, y: 40, emoji: "🤵", name: "Chapa Quente" },
    { id: 2, x: 70, y: 30, emoji: "🕵️‍♂️", name: "Vinnie V" },
    { id: 3, x: 50, y: 75, emoji: "💃", name: "Natasha" }
  ]);

  // Handle CSS keyframes or timers for moving cars and pedestrians
  useEffect(() => {
    const timer = setInterval(() => {
      setCarPosition((prev) => (prev >= 110 ? -15 : prev + 1.5));
      setTaxiPosition((prev) => (prev <= -15 ? 110 : prev - 1.2));
      
      // Wander pedestrians slightly
      setPedestrians((prev) => 
        prev.map((ped) => ({
          ...ped,
          x: Math.max(10, Math.min(90, ped.x + (Math.random() * 8 - 4))),
          y: Math.max(15, Math.min(85, ped.y + (Math.random() * 8 - 4)))
        }))
      );
    }, 120);

    return () => clearInterval(timer);
  }, []);

  // Calculate dynamic bonuses from active gear
  const activeWeaponItem = SHOP_ITEMS.find((i) => i.id === player.activeWeapon);
  const activeVehicleItem = SHOP_ITEMS.find((i) => i.id === player.activeVehicle);

  const weaponBonus = activeWeaponItem?.bonusStrength || 0;
  const vehicleBonus = activeVehicleItem?.bonusDefense || 0;

  // Apply passive skills (iron_grip, tactical_armor)
  let baseStrength = player.strength;
  const ironGripLevel = player.unlockedSkills?.["iron_grip"] || 0;
  if (ironGripLevel > 0) {
    baseStrength = Math.round(baseStrength * (1 + ironGripLevel * 0.10));
  }
  const totalStrength = baseStrength + weaponBonus;
  
  const petBonus = getActivePetBonus(player);
  let baseDefense = player.defense;
  const tacticalArmorLevel = player.unlockedSkills?.["tactical_armor"] || 0;
  if (tacticalArmorLevel > 0) {
    baseDefense = Math.round(baseDefense * (1 + tacticalArmorLevel * 0.10));
  }
  let totalDefense = baseDefense + vehicleBonus;
  if (petBonus.type === "defense") {
    totalDefense = Math.round(totalDefense * (1 + petBonus.value));
  }

  // Title translation helper
  const getRankTitle = (lvl: number): string => {
    return getLevelTitle(lvl, lang);
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  const handleBankAction = (isDeposit: boolean) => {
    const amt = parseInt(bankAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (isDeposit) {
      if (amt > player.cash) return;
      onDeposit(amt);
    } else {
      if (amt > player.bank) return;
      onWithdraw(amt);
    }
    playSound.cash();
    setBankAmount("");
  };

  const setBankPercent = (percent: number, isDeposit: boolean) => {
    if (isDeposit) {
      const amt = Math.floor(player.cash * percent);
      setBankAmount(amt > 0 ? amt.toString() : "");
    } else {
      const amt = Math.floor(player.bank * percent);
      setBankAmount(amt > 0 ? amt.toString() : "");
    }
  };

  // CHECK REAL ESTATE OWNERSHIP FOR THE MAP
  const isSafehouseOwned = player.realEstate.includes("safehouse");
  const isWeedOwned = player.realEstate.includes("weed_greenhouse");

  // ACTIONS FOR BUILDINGS
  const handleMapAction = (buildingId: string, actionId: string) => {
    if (!onUpdatePlayerState || !addGameLog || !triggerAlert) return;

    if (buildingId === "prostitutas") {
      if (actionId === "cigarro") {
        if (player.energy < 15) {
          playSound.crimeFail();
          triggerAlert(lang === "en" ? "Not enough Energy! Needs 15 NRG." : "Energia insuficiente! Precisa de 15 de energia.", "warn");
          return;
        }
        onUpdatePlayerState((prev) => ({
          ...prev,
          energy: Math.max(0, prev.energy - 15),
          willpower: prev.willpower + 4
        }));
        playSound.notification();
        triggerAlert(lang === "en" ? "Offered a cigarette! +4 Willpower." : "Ofereceu um cigarro! +4 Força de Vontade.");
        addGameLog(
          "Offered a cigarette to the local street hostesses. Gained +4 Willpower attribute.",
          "Ofereceu um cigarro para as garotas de rua locais. Ganhou +4 de Força de Vontade.",
          "system",
          "🚬"
        );
      } else if (actionId === "receitas") {
        if (player.energy < 30) {
          playSound.crimeFail();
          triggerAlert(lang === "en" ? "Not enough Energy! Needs 30 NRG." : "Energia insuficiente! Precisa de 30 de energia.", "warn");
          return;
        }
        onUpdatePlayerState((prev) => ({
          ...prev,
          energy: Math.max(0, prev.energy - 30),
          cash: prev.cash + 800,
          respect: prev.respect + 15
        }));
        playSound.cash();
        triggerAlert(lang === "en" ? "Revenue collected! +$800 cash & +15 Respect." : "Receitas cobradas! +$800 em mãos & +15 Respeito.");
        addGameLog(
          "Collected passive protection fees from local avenues. Gained +$800 raw cash & +15 Respect.",
          "Cobrou taxas de proteção clandestina das avenidas. Ganhou +$800 em dinheiro vivo & +15 de Respeito.",
          "market",
          "💰"
        );
      } else if (actionId === "zuar") {
        if (player.energy < 45) {
          playSound.crimeFail();
          triggerAlert(lang === "en" ? "Not enough Energy! Needs 45 NRG." : "Energia insuficiente! Precisa de 45 de energia.", "warn");
          return;
        }
        onUpdatePlayerState((prev) => ({
          ...prev,
          energy: Math.max(0, prev.energy - 45),
          respect: prev.respect + 35,
          willpower: Math.min(100, prev.willpower + 15)
        }));
        playSound.notification();
        triggerAlert(lang === "en" ? "Hanged out with your mob! +35 Respect." : "Zuo com o bando! +35 de Respeito na rua.");
        addGameLog(
          "Hanged out at the local tavern with your gang associates. Gained +35 Respect and boosted Willpower.",
          "Passou a noite bebendo e rindo com seus comparsas da máfia. Ganhou +35 de Respeito e elevou Força de Vontade.",
          "system",
          "🍻"
        );
      }
    }

    if (buildingId === "garagem") {
      if (actionId === "nitro") {
        if (player.cash < 1000) {
          playSound.crimeFail();
          triggerAlert(lang === "en" ? "Not enough Cash! Needs $1,000." : "Dinheiro insuficiente! Precisa de $1.000.", "warn");
          return;
        }
        onUpdatePlayerState((prev) => ({
          ...prev,
          cash: Math.max(0, prev.cash - 1000),
          defense: prev.defense + 4,
          respect: prev.respect + 15
        }));
        playSound.cash();
        triggerAlert(lang === "en" ? "Nitro installed! +4 Defense & +15 Respect!" : "Nitro turbinado instalado! +4 Defesa & +15 Respeito!");
        addGameLog(
          "Spent $1,000 for tuning the getaway chassis with extreme nitro oxide. Gained +4 Defense attribute & +15 Respect.",
          "Gastou $1.000 turbinando os escapamentos com nitro líquido na garagem. Ganhou +4 de Defesa técnica & +15 de Respeito.",
          "shop",
          "🔥"
        );
      } else if (actionId === "polir") {
        if (player.energy < 10) {
          playSound.crimeFail();
          triggerAlert(lang === "en" ? "Not enough Energy! Needs 10 NRG." : "Energia insuficiente! Precisa de 10 de energia.", "warn");
          return;
        }
        onUpdatePlayerState((prev) => ({
          ...prev,
          energy: Math.max(0, prev.energy - 10),
          respect: prev.respect + 5
        }));
        playSound.notification();
        triggerAlert(lang === "en" ? "Car body polished sleekly! +5 Respect." : "Carro limpo e brilhando! +5 de Respeito.");
        addGameLog(
          "Polished the chrome of your mafia fleet cruise. Gained +5 Respect.",
          "Limpou e poliu os acabamentos cromados de sua frota. Ganhou +5 de Respeito.",
          "system",
          "✨"
        );
      }
    }

    if (buildingId === "policia") {
      if (actionId === "subornar") {
        if (player.cash < 500) {
          playSound.crimeFail();
          triggerAlert(lang === "en" ? "Not enough Cash! Needs $500." : "Dinheiro insuficiente! Precisa de $500.", "warn");
          return;
        }
        onUpdatePlayerState((prev) => ({
          ...prev,
          cash: Math.max(0, prev.cash - 500),
          intellect: prev.intellect + 3,
          respect: prev.respect + 10
        }));
        playSound.cash();
        triggerAlert(lang === "en" ? "Bribed sergeant successfully! +3 Intellect." : "Sargento subornado com sucesso! +3 Intelecto.");
        addGameLog(
          "Slipped $500 securely under the table to the local bureau captain. Gained +3 Intellect.",
          "Passou uma maleta com $500 por baixo da mesa do delegado local. Ganhou +3 de Intelecto estratégico.",
          "system",
          "🚓"
        );
      } else if (actionId === "desafiar") {
        if (player.energy < 25) {
          playSound.crimeFail();
          triggerAlert(lang === "en" ? "Not enough Energy! Needs 25 NRG." : "Energia insuficiente! Precisa de 25 de energia.", "warn");
          return;
        }
        onUpdatePlayerState((prev) => ({
          ...prev,
          energy: Math.max(0, prev.energy - 25),
          respect: prev.respect + 45
        }));
        playSound.notification();
        triggerAlert(lang === "en" ? "Teased precinct patrol! +45 Respect!" : "Desafio à viatura concluído! +45 de Respeito!");
        addGameLog(
          "Teased police patrols around the docks and successfully evaded. Gained +45 Respect.",
          "Provocou as patrulhas de choque ao redor das docas e fugiu sorrindo. Ganhou +45 de Respeito das gangues.",
          "combat",
          "🚨"
        );
      }
    }

    if (buildingId === "cassino") {
      if (actionId === "girar") {
        if (player.cash < 200) {
          playSound.crimeFail();
          triggerAlert(lang === "en" ? "Needs $200 Cash!" : "Precisa de $200 em mãos!", "warn");
          return;
        }
        const win = Math.random() > 0.45;
        const prizeVal = win ? Math.floor(Math.random() * 800) + 200 : -200;
        onUpdatePlayerState((prev) => ({
          ...prev,
          cash: Math.max(0, prev.cash + prizeVal)
        }));
        if (win) {
          playSound.cash();
          triggerAlert(lang === "en" ? `You won the Spin! +$${prizeVal} Cash!` : `Você venceu no giro! Faturou $${prizeVal}!`);
          addGameLog(
            `Placed roulette bet and won +$${prizeVal} Cash at Las Vegas.`,
            `Apostou fichas no cassino Las Vegas e levou +$${prizeVal} pra carteira líquida.`,
            "bonus",
            "🎰"
          );
        } else {
          playSound.crimeFail();
          triggerAlert(lang === "en" ? "Zeroed! Lost $200 bet." : "Roleta zerada! Perdeu $200.", "warn");
          addGameLog(
            `Lost $200 on local slot sweepstakes.`,
            `Perdeu $200 jogando fichas na roleta russa do cassino.`,
            "bonus",
            "🎰"
          );
        }
      }
    }

    if (buildingId === "comprar_for_sale_1") {
      if (isSafehouseOwned) return;
      if (player.cash < 8000) {
        playSound.crimeFail();
        triggerAlert(lang === "en" ? "Needs $8,000 Cash!" : "Precisa de $8.000 em mãos!", "warn");
        return;
      }
      onUpdatePlayerState((prev) => ({
        ...prev,
        cash: prev.cash - 8000,
        realEstate: [...prev.realEstate, "safehouse"]
      }));
      playSound.cash();
      triggerAlert(lang === "en" ? "Brooklyn Penthouse purchased! +$120/hr income." : "Edifício adquirido! Rende +$120/ciclo.");
      addGameLog(
        "Purchased Brooklyn Hideout block property from My Street map for $8,000.",
        "Comprou e regularizou o Edifício Residencial da rua por $8.000. Rende dividendos de aluguel passivo.",
        "shop",
        "🏢"
      );
    }

    if (buildingId === "comprar_for_sale_2") {
      if (isWeedOwned) return;
      if (player.cash < 32000) {
        playSound.crimeFail();
        triggerAlert(lang === "en" ? "Needs $32,000 Cash!" : "Precisa de $32.000 em mãos!", "warn");
        return;
      }
      onUpdatePlayerState((prev) => ({
        ...prev,
        cash: prev.cash - 32000,
        realEstate: [...prev.realEstate, "weed_greenhouse"]
      }));
      playSound.cash();
      triggerAlert(lang === "en" ? "Cannabis Lab secured! +$650/hr." : "Estufa hidropônica assegurada! +$650/ciclo.");
      addGameLog(
        "Purchased Underground Cannabis laboratory on My Street for $32,000.",
        "Comprou e registrou a Estufa Subterrânea para operação no quarteirão por $32.000.",
        "shop",
        "🌿"
      );
    }
  };

  return (
    <div className="flex flex-col space-y-6" id="dashboard-tab">
      
      {/* GANGSTER DOSSIER HEADER */}
      <h2 className="text-xl font-black font-sans tracking-tight text-white/90">
        🥷 {lang === "en" ? "GANGSTER DOSSIER" : "DOSSIÊ GÂNGSTER"}
      </h2>

      <div className="bg-[#121216] border border-zinc-800/80 rounded-[2rem] p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative select-none">

      {/* CORE STAT DETAILS ROW */}
      <div className="w-full">
        
        {/* Left pane: Boss Dossier */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden" id="boss-dossier">
          {/* Aesthetic corner tag */}
          <div className="absolute top-0 right-0 bg-red-600/10 text-red-500 text-[10px] font-mono uppercase tracking-wider px-4 py-1.5 border-l border-b border-zinc-800">
            {lang === "en" ? "ACTIVE FILE" : "FICHA ATIVA"}
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-zinc-950 border-2 border-red-655 border-red-600 flex items-center justify-center text-3xl shadow-inner select-none">
              🥷
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                {player.name || "Gangster"} <span className="text-[10px] bg-red-600 px-2 py-0.5 rounded text-white uppercase font-mono font-bold tracking-wider">LV {player.level}</span>
              </h2>
              <p className="text-xs text-red-500 font-mono tracking-wider mt-0.5 uppercase font-bold">
                {getRankTitle(player.level)}
              </p>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1 font-mono">
                📍 {lang === "en" ? "Location: " : "Localização: "}
                <span className="text-zinc-200 font-sans font-semibold">
                  {player.location.toUpperCase()}
                </span>
              </p>
            </div>
          </div>

          {/* Dynamic Vitals */}
          <div className="space-y-4 mb-6">
            {/* Energy */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  {lang === "en" ? "ENERGY" : "ENERGIA"}
                </span>
                <span className="font-bold text-zinc-200">{player.energy} / {player.maxEnergy}</span>
              </div>
              <div className="w-full bg-zinc-950 h-3 rounded-full border border-zinc-800/60 p-0.5">
                <motion.div 
                  className="bg-amber-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(player.energy / player.maxEnergy) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-[10px] text-amber-500/80 font-mono mt-1 text-right">
                {lang === "en" ? "+5 restored per cycle" : "+5 restaurado por ciclo"}
              </p>
            </div>

            {/* Health */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                <span className="flex items-center gap-1 text-emerald-500 font-bold">
                  <Heart className="w-3.5 h-3.5" />
                  {lang === "en" ? "HEALTH" : "SAÚDE"}
                </span>
                <span className="font-bold text-zinc-200">{player.health}% / {player.maxHealth}%</span>
              </div>
              <div className="w-full bg-zinc-950 h-3 rounded-full border border-zinc-800/60 p-0.5">
                <motion.div 
                  className="bg-emerald-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(player.health / player.maxHealth) * 105}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              {player.health < 40 && (
                <p className="text-[10px] text-red-500 font-mono mt-1 animate-pulse">
                  ⚠️ {lang === "en" ? "CRITICAL: Rest or visit Shop to recover!" : "CRÍTICO: Descanse ou vá à Loja!"}
                </p>
              )}
            </div>

            {/* EXP */}
            <div>
              <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                <span className="flex items-center gap-1 text-indigo-400 font-bold">
                  <Award className="w-3.5 h-3.5" />
                  {lang === "en" ? "REPUTATION EXP" : "EXP DE REPUTAÇÃO"}
                </span>
                <span className="font-bold text-zinc-200">{player.exp} / {player.expNext} XP</span>
              </div>
              <div className="w-full bg-zinc-950 h-3 rounded-full border border-zinc-800/60 p-0.5">
                <motion.div 
                  className="bg-indigo-505 bg-indigo-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(player.exp / player.expNext) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          {/* Small details */}
          <div className="bg-zinc-955 bg-zinc-950 border border-zinc-850 rounded-2xl p-3.5 font-mono text-[11px] text-zinc-400 space-y-2">
            <div className="flex justify-between">
              <span>{lang === "en" ? "Respect Credits:" : "Créditos de Respeito:"}</span>
              <span className="text-zinc-200 font-bold flex items-center gap-1 font-mono">
                <Skull className="w-3 h-3 text-red-600" /> {player.respect}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{lang === "en" ? "Crimes Completed:" : "Crimes Concluídos:"}</span>
              <span className="text-zinc-200">{player.crimesCommitted}</span>
            </div>
            <div className="flex justify-between">
              <span>{lang === "en" ? "Combats Won/Lost:" : "Combates Vencidos/Perdidos:"}</span>
              <span className="text-zinc-200">{player.fightsWon} W / {player.fightsLost} L</span>
            </div>
          </div>
        </div>

        {/* Middle pane: Gangster Character Stats */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between" id="character-stats">
          <div>
            <h3 className="text-lg font-bold text-white border-b border-zinc-850 pb-3 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              {lang === "en" ? "Underworld Attributes" : "Atributos do Submundo"}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Strength */}
              <div className="bg-zinc-955 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                  {lang === "en" ? "Attack / Strength" : "Ataque / Força"}
                </p>
                <p className="text-2xl font-black font-mono text-red-500 mt-1">
                  {totalStrength}
                </p>
                <p className="text-[9px] font-mono text-zinc-400 mt-1 leading-tight">
                  Base: {player.strength}
                  {ironGripLevel > 0 && ` (+${ironGripLevel * 10}% Skill)`}
                  {weaponBonus > 0 && ` (+${weaponBonus} Weapon)`}
                </p>
              </div>

              {/* Defense */}
              <div className="bg-zinc-955 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                  {lang === "en" ? "Defense / Armor" : "Defesa / Armadura"}
                </p>
                <p className="text-2xl font-black font-mono text-blue-400 mt-1">
                  {totalDefense}
                </p>
                <p className="text-[9px] font-mono text-zinc-400 mt-1 leading-tight">
                  Base: {player.defense}
                  {tacticalArmorLevel > 0 && ` (+${tacticalArmorLevel * 10}% Skill)`}
                  {vehicleBonus > 0 && ` (+${vehicleBonus} ${lang === "en" ? "Vehicle" : "Veículo"})`}
                  {petBonus.type === "defense" && petBonus.value > 0 && ` (+${Math.round(petBonus.value * 100)}% ${lang === "en" ? "Companion" : "Mascote"})`}
                </p>
              </div>

              {/* Intellect */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                  {lang === "en" ? "Intellect" : "Intelecto"}
                </p>
                <p className="text-2xl font-black font-mono text-violet-400 mt-1">
                  {player.intellect}
                </p>
                <p className="text-[9px] font-mono text-zinc-500 mt-1">
                  {lang === "en" ? "Unlocks smart crimes" : "Libera crimes astutos"}
                </p>
              </div>

              {/* Luck / Sorte */}
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">
                  🍀 {lang === "en" ? "Luck" : "Sorte"}
                </p>
                <p className="text-2xl font-black font-mono text-amber-400 mt-1">
                  {player.willpower}
                </p>
                <p className="text-[9px] font-mono text-zinc-500 mt-1">
                  {lang === "en" ? "Boosts crime gains" : "Melhora ganhos de crimes"}
                </p>
              </div>
            </div>

            {/* Visual Achievement Badges */}
            <div className="mt-4 p-4 bg-zinc-950/80 border border-zinc-850 rounded-2xl space-y-2.5">
              <div className="flex justify-between items-center select-none">
                <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-zinc-400" />
                  {lang === "en" ? "TACTICAL ACHIEVEMENT BADGES" : "MEDALHAS DE CONQUISTA GANGSTER"}
                </h4>
                <span className="text-[10px] font-mono font-bold text-zinc-650 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-850">
                  {
                    ([50, 100, 250].filter(t => player.strength >= t).length +
                     [50, 100, 250].filter(t => player.defense >= t).length)
                  }/6
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Attack Badges Column */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-bold text-red-500/80 uppercase tracking-wider block">
                    ⚔️ {lang === "en" ? "STRENGTH MILESTONES" : "CONQUISTAS DE FORÇA"}
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: 50, icon: "👊", nameEn: "Brawler", namePt: "Brigão", descEn: "Hit 50 Strength", descPt: "Atinja 50 de Força", color: "from-orange-500/15 via-orange-500/5 to-transparent text-orange-400 border-orange-500/30" },
                      { val: 100, icon: "💀", nameEn: "Enforcer", namePt: "Executor", descEn: "Hit 100 Strength", descPt: "Atinja 100 de Força", color: "from-red-500/15 via-red-500/5 to-transparent text-red-400 border-red-550/30" },
                      { val: 250, icon: "👑", nameEn: "Overlord", namePt: "Soberano", descEn: "Hit 250 Strength", descPt: "Atinja 250 de Força", color: "from-yellow-500/15 via-yellow-500/5 to-transparent text-amber-300 border-yellow-500/30" }
                    ].map((badge) => {
                      const isUnlocked = player.strength >= badge.val;
                      return (
                        <div
                          key={badge.val}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all duration-300 ${
                            isUnlocked 
                              ? `bg-gradient-to-b ${badge.color} shadow-lg cursor-help hover:scale-105` 
                              : "bg-zinc-900/30 border-zinc-900/50 text-zinc-700 cursor-not-allowed opacity-30"
                          }`}
                          title={`${lang === "en" ? badge.nameEn : badge.namePt}: ${lang === "en" ? badge.descEn : badge.descPt} (${isUnlocked ? (lang === "en" ? "Unlocked" : "Desbloqueado") : (lang === "en" ? "Locked" : "Bloqueado")})`}
                        >
                          <span className={`text-base ${isUnlocked ? "scale-110 filter drop-shadow-[0_0_4px_rgba(239,68,68,0.4)]" : "grayscale"}`}>
                            {isUnlocked ? badge.icon : "🔒"}
                          </span>
                          <span className="text-[10px] font-mono leading-none tracking-tight font-black mt-1.5">{lang === "en" ? badge.nameEn : badge.namePt}</span>
                          <span className="text-[8px] font-mono opacity-50 font-bold mt-0.5">{badge.val} pts</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Defense Badges Column */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-bold text-blue-500/80 uppercase tracking-wider block">
                    🛡️ {lang === "en" ? "DEFENSE MILESTONES" : "CONQUISTAS DE DEFESA"}
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: 50, icon: "🛡️", nameEn: "Bulwark", namePt: "Bastião", descEn: "Hit 50 Defense", descPt: "Atinja 50 de Defesa", color: "from-blue-500/15 via-blue-500/5 to-transparent text-blue-400 border-blue-500/30" },
                      { val: 100, icon: "🧱", nameEn: "Tactical", namePt: "Tático", descEn: "Hit 100 Defense", descPt: "Atinja 100 de Defesa", color: "from-cyan-500/15 via-cyan-500/5 to-transparent text-cyan-400 border-cyan-500/30" },
                      { val: 250, icon: "🌌", nameEn: "Immortal", namePt: "Imortal", descEn: "Hit 250 Defense", descPt: "Atinja 250 de Defesa", color: "from-indigo-500/15 via-indigo-500/5 to-transparent text-violet-350 text-violet-300 border-indigo-550/30" }
                    ].map((badge) => {
                      const isUnlocked = player.defense >= badge.val;
                      return (
                        <div
                          key={badge.val}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all duration-300 ${
                            isUnlocked 
                              ? `bg-gradient-to-b ${badge.color} shadow-lg cursor-help hover:scale-105` 
                              : "bg-zinc-900/30 border-zinc-900/50 text-zinc-700 cursor-not-allowed opacity-30"
                          }`}
                          title={`${lang === "en" ? badge.nameEn : badge.namePt}: ${lang === "en" ? badge.descEn : badge.descPt} (${isUnlocked ? (lang === "en" ? "Unlocked" : "Desbloqueado") : (lang === "en" ? "Locked" : "Bloqueado")})`}
                        >
                          <span className={`text-base ${isUnlocked ? "scale-110 filter drop-shadow-[0_0_4px_rgba(59,130,246,0.4)]" : "grayscale"}`}>
                            {isUnlocked ? badge.icon : "🔒"}
                          </span>
                          <span className="text-[10px] font-mono leading-none tracking-tight font-black mt-1.5">{lang === "en" ? badge.nameEn : badge.namePt}</span>
                          <span className="text-[8px] font-mono opacity-50 font-bold mt-0.5">{badge.val} pts</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-zinc-950/50 border border-zinc-850 rounded-2xl p-3 text-xs text-zinc-400 space-y-2.5">
              <div className="flex items-start gap-1.5">
                <span className="text-red-500">🔫</span>
                <p className="text-zinc-300">
                  <strong className="text-white">{lang === "en" ? "Active Armaments: " : "Armamentos Ativos: "}</strong>
                  {player.activeWeapon ? (
                    <span className="text-zinc-100 font-semibold font-mono">
                      {SHOP_ITEMS.find(i => i.id === player.activeWeapon)?.[lang === "en" ? "nameEn" : "namePt"]}
                    </span>
                  ) : (
                    <span className="text-zinc-505 text-zinc-500 font-mono tracking-wide">{lang === "en" ? "NONE (Fists)" : "NENHUM (Punhos)"}</span>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-1.5">
                <span className="text-blue-400">🚗</span>
                <p className="text-zinc-300">
                  <strong className="text-white">{lang === "en" ? "Active Cruiser: " : "Veículo Ativo: "}</strong>
                  {player.activeVehicle ? (
                    <span className="text-zinc-100 font-semibold font-mono">
                      {SHOP_ITEMS.find(i => i.id === player.activeVehicle)?.[lang === "en" ? "nameEn" : "namePt"]}
                    </span>
                  ) : (
                    <span className="text-zinc-500 font-mono tracking-wide">{lang === "en" ? "NONE (On Foot)" : "NENHUM (A Pé)"}</span>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-1.5 pt-0.5 border-t border-zinc-900">
                <span className="text-red-500">🐕</span>
                <p className="text-zinc-300">
                  <strong className="text-white">{lang === "en" ? "Active Companion: " : "Mascote Ativo: "}</strong>
                  {player.activePet ? (
                    <span className="text-zinc-100 font-semibold font-mono">
                      {PETS.find(i => i.id === player.activePet)?.[lang === "en" ? "nameEn" : "namePt"]}{" "}
                      <span className="text-red-500 text-[10px]">
                        (Lvl {player.pets?.[player.activePet || ""]?.level || 1})
                      </span>
                    </span>
                  ) : (
                    <span className="text-zinc-500 font-mono tracking-wide">{lang === "en" ? "NONE" : "NENHUM"}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Utility panel: Language & Full Reset */}
          <div className="mt-6 pt-4 border-t border-zinc-850 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Languages className="w-5 h-5 text-zinc-500" />
              <button 
                onClick={() => { playSound.notification(); setLang("en"); }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${lang === "en" ? "bg-red-655 bg-red-600 text-white shadow" : "bg-zinc-950 text-zinc-500 hover:text-zinc-300"}`}
              >
                EN
              </button>
              <button 
                onClick={() => { playSound.notification(); setLang("pt"); }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${lang === "pt" ? "bg-red-655 bg-red-600 text-white shadow" : "bg-zinc-950 text-zinc-500 hover:text-zinc-300"}`}
              >
                PT
              </button>
            </div>

            <button 
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 text-[10px] text-red-500/80 hover:text-red-400 font-mono font-bold transition-colors bg-red-955/10 hover:bg-red-900/10 px-3 py-2 border border-red-900/30 rounded-xl"
              title={lang === "en" ? "Reset Game" : "Reiniciar Jogo"}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {lang === "en" ? "WIPE FILE" : "DELETAR FICHA"}
            </button>
          </div>
        </div>
      </div>

      {/* Daily Syndicate Missions Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden" id="daily-missions-section">
        {/* Corner badge */}
        <div className="absolute top-0 right-0 bg-amber-600/10 text-amber-500 text-[10px] font-mono uppercase tracking-wider px-4 py-1.5 border-l border-b border-zinc-800">
          {lang === "en" ? "SYNDICATE TASKS" : "MISSÕES DIÁRIAS"}
        </div>

        <h3 className="text-lg font-bold text-white border-b border-zinc-850 pb-3 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          {lang === "en" ? "Syndicate Operations" : "Operações do Sindicato"}
        </h3>

        <p className="text-xs text-zinc-400 mb-5 font-sans leading-relaxed">
          {lang === "en" 
            ? "Execute daily operations across the city to secure massive cash flow, syndicate connections, and premium tactical defense armor."
            : "Complete operações diárias pelo quarteirão para obter faturamento de notas limpas, conexões do sindicato ou coletes blindados."}
        </p>

        <div className="space-y-4">
          {(!player.dailyMissions || player.dailyMissions.length === 0) ? (
            <p className="text-xs text-zinc-500 font-mono italic p-4 text-center">
              {lang === "en" ? "No active missions. They will refresh at Midnight BRT!" : "Nenhuma missão ativa. Elas serão atualizadas à Meia-noite (BRT)!"}
            </p>
          ) : (
            player.dailyMissions.map((m) => {
              const isCompleted = m.current >= m.target;
              const progressPercent = Math.min((m.current / m.target) * 100, 100);

              let rewardLabel = "";
              if (m.rewardType === "cash") rewardLabel = `+$${m.rewardValue.toLocaleString()}`;
              else if (m.rewardType === "connections") rewardLabel = `+${m.rewardValue} ${lang === "en" ? "Connections" : "Conexões"}`;
              else if (m.rewardType === "ammo") rewardLabel = `+${m.rewardValue} ${lang === "en" ? "Ammo" : "Balas"}`;
              else if (m.rewardType === "item") rewardLabel = lang === "en" ? "+1 Kevlar Vest (+25 Def)" : "+1 Colete Kevlar (+25 Def)";

              return (
                <div key={m.id} className="bg-zinc-950/40 border border-zinc-850 hover:border-zinc-800 transition rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${m.claimed ? "bg-zinc-700" : isCompleted ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" : "bg-amber-500"}`}></span>
                      <h4 className={`text-xs md:text-sm font-sans font-black tracking-wide ${m.claimed ? "text-zinc-600 line-through" : isCompleted ? "text-emerald-400" : "text-zinc-200"}`}>
                        {lang === "en" ? m.titleEn : m.titlePt}
                      </h4>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-500 font-bold">
                        <span>{lang === "en" ? "OP PROGRESS" : "STATUS DA OPERAÇÃO"}</span>
                        <span>{m.current} / {m.target}</span>
                      </div>
                      <div className="w-full bg-zinc-900/60 h-2.5 rounded-full p-0.5 border border-zinc-850/50">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${m.claimed ? "bg-zinc-700" : isCompleted ? "bg-emerald-500 shadow-[0_0_5px_#10b981]" : "bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"}`} 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reward & Action */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-zinc-900/40 pt-3 md:pt-0">
                    <div className="flex flex-col items-start md:items-end font-mono">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">{lang === "en" ? "REWARD" : "PREMIAÇÃO"}</span>
                      <span className={`text-xs font-extrabold ${m.claimed ? "text-zinc-600" : "text-emerald-400"}`}>{rewardLabel}</span>
                    </div>

                    {m.claimed ? (
                      <span className="px-3.5 py-1.5 bg-zinc-900 text-zinc-600 border border-zinc-850 rounded-xl font-mono text-[10px] uppercase font-bold">
                        {lang === "en" ? "CLAIMED" : "RESGATADO"}
                      </span>
                    ) : isCompleted ? (
                      <button
                        onClick={() => {
                          playSound.cash();
                          onUpdatePlayerState?.((prev) => {
                            const updatedMissions = (prev.dailyMissions || []).map((item) => 
                              item.id === m.id ? { ...item, claimed: true } : item
                            );
                            
                            let cashAdd = 0;
                            let connAdd = 0;
                            let ammoAdd = 0;
                            let defAdd = 0;

                            if (m.rewardType === "cash") cashAdd = m.rewardValue;
                            else if (m.rewardType === "connections") connAdd = m.rewardValue;
                            else if (m.rewardType === "ammo") ammoAdd = m.rewardValue;
                            else if (m.rewardType === "item" && m.rewardItem === "bulletproof_vest") {
                              defAdd = 25; // Give 25 permanent defense!
                            }

                            return {
                              ...prev,
                              cash: prev.cash + cashAdd,
                              connections: (prev.connections || 0) + connAdd,
                              ammo: (prev.ammo || 0) + ammoAdd,
                              defense: prev.defense + defAdd,
                              dailyMissions: updatedMissions
                            };
                          });

                          triggerAlert?.(
                            lang === "en" 
                              ? `Claimed reward: ${rewardLabel}!` 
                              : `Resgatou prêmio: ${rewardLabel}!`,
                            "success"
                          );

                          addGameLog?.(
                            `Claimed daily operation mission reward: ${rewardLabel}!`,
                            `Resgatou a recompensa da operação diária: ${rewardLabel}!`,
                            "bonus",
                            "🎁"
                          );
                        }}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 hover:scale-105 active:scale-95 text-white rounded-xl font-mono text-[10px] uppercase font-black tracking-wider transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] select-none cursor-pointer"
                      >
                        {lang === "en" ? "CLAIM" : "RESGATAR"}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-1.5 bg-zinc-900 border border-zinc-850 text-zinc-650 rounded-xl font-mono text-[10px] uppercase font-bold cursor-not-allowed opacity-50 select-none"
                      >
                        {lang === "en" ? "PENDING" : "PENDENTE"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>

  </div>
);
}
