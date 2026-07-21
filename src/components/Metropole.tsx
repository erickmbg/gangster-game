import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PlayerState, GameItem, SHOP_ITEMS, getLevelTitle, getActivePetBonus, PETS, getDynamicItemProps } from "../types";
import { playSound } from "./AudioEngine";
import { Shield, Skull, Zap, Heart, Award, Landmark, ShieldAlert, Languages, Trash2, ArrowUpRight, Check, Sparkles, ChevronDown, ChevronUp, Home, Wrench, Leaf, Dices, Coins, Store, X, Building } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import clubSpriteImage from "../assets/images/clube_sprite_1782176803811.jpg";
import hotelSpriteImage from "../assets/images/hotel_sprite_1782177034109.jpg";
import officeSpriteImage from "../assets/images/office_sprite_1782177051477.jpg";
import drinkFactorySpriteImage from "../assets/images/drink_factory_sprite_1782177064385.jpg";
import drugFactorySpriteImage from "../assets/images/drug_factory_sprite_1782177073640.jpg";
import carFactorySpriteImage from "../assets/images/car_factory_sprite_1782177083596.jpg";
import feedFactorySpriteImage from "../assets/images/feed_factory_sprite_1782177093032.jpg";
import revolverFactorySpriteImage from "../assets/images/revolver_factory_sprite_1782177102230.jpg";
import laboratorySpriteImage from "../assets/images/laboratory_sprite_1782177113626.jpg";

const getBuildingImage = (id: string) => {
  if (['weed_greenhouse'].includes(id)) return drugFactorySpriteImage;
  if (['underground_casino'].includes(id)) return clubSpriteImage;
  if (['commercial_port'].includes(id)) return carFactorySpriteImage;
  if (['safehouse'].includes(id)) return hotelSpriteImage;
  return officeSpriteImage;
};

interface MetropoleProps {
  player: PlayerState;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  lang: "en" | "pt";
  setLang: (lang: "en" | "pt") => void;
  onReset: () => void;
  onUpdatePlayerState?: (updater: (prev: PlayerState) => PlayerState) => void;
  addGameLog?: (en: string, pt: string, type: any, icon: string) => void;
  triggerAlert?: (msg: string, type?: "success" | "warn") => void;
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

export default function Metropole({ 
  player, 
  onDeposit, 
  onWithdraw, 
  lang, 
  setLang, 
  onReset,
  onUpdatePlayerState,
  addGameLog,
  triggerAlert,
  onBuyItem
}: MetropoleProps) {
  const [subTab, setSubTab] = useState<"rua" | "patrimonio">("rua");
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

  const totalStrength = player.strength + weaponBonus;
  
  const petBonus = getActivePetBonus(player);
  let totalDefense = player.defense + vehicleBonus;
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
    <div className="flex flex-col space-y-6" id="metropole-tab">
      

      {/* METRÓPOLE SUB-TABS SELECTOR */}
      <div className="flex border-b border-zinc-900 pb-1.5 gap-2 w-full select-none overflow-x-auto no-scrollbar">
        <button
          onClick={() => { playSound.notification(); setSubTab("rua"); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 whitespace-nowrap ${subTab === "rua" ? "bg-[#ef4444] text-white shadow-lg shadow-[#ef4444]/20" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"}`}
        >
          🏷️ {lang === "en" ? "MY STREET MAP" : "MINHA RUA"}
        </button>
        <button
          onClick={() => { playSound.notification(); setSubTab("patrimonio"); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 whitespace-nowrap ${subTab === "patrimonio" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40"}`}
        >
          🏢 {lang === "en" ? "ACTIVE PATRIMONY" : "PATRIMÔNIO DE IMÓVEIS"}
        </button>
      </div>
      <AnimatePresence mode="wait">
      <motion.div
        key={subTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.18 }}
        className="w-full"
      >

{subTab === "rua" && (
         <div className="pt-6">
        
        {/* MAP HEADER */}
        <div className="flex flex-col gap-4 mb-5 border-b border-zinc-900/50 pb-5">
          <div className="flex items-center gap-3">
            {/* Pulsing red dot with shadow glow */}
            <span className="relative flex h-3.5 w-3.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef4444] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#ef4444] shadow-[0_0_10px_#ef4444]"></span>
            </span>
            <div>
              <h4 className="text-xs md:text-sm font-sans font-black neon-text-pink uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                🏷️ {lang === "en" ? "MY STREET MAP // EXCLUSIVE AREA" : "MAPA DA MINHA RUA // ÁREA EXCLUSIVA"}
              </h4>
              <p className="text-[11px] md:text-xs text-zinc-500 font-medium tracking-wide">
                {lang === "en" ? "Interactive 3D replica. Click properties to command bribes or collect physical fees." : "Quarteirão interativo 3D. Toque nas propriedades para comandar subornos ou coletar taxas físicas."}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#131318] border border-zinc-800 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] p-3 rounded-2xl relative">
            {/* Screws for header panel */}
            <div className="industrial-screw industrial-screw-tl scale-75"></div>
            <div className="industrial-screw industrial-screw-tr scale-75"></div>
            <div className="industrial-screw industrial-screw-bl scale-75"></div>
            <div className="industrial-screw industrial-screw-br scale-75"></div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pl-4">
              <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                <span className="text-zinc-500 font-bold uppercase tracking-widest">{lang === "en" ? "Profit:" : "Lucro:"}</span>
                <span className="text-[#10b981] neon-text-green font-black text-sm tracking-tight">+{player.realEstate.length * 120}$/t</span>
              </div>
              <div className="hidden sm:block h-8 w-px bg-zinc-800"></div>
              <div className="flex flex-col gap-0.5 font-mono text-[11px]">
                <span className="text-zinc-500 font-bold uppercase tracking-widest">{lang === "en" ? "District:" : "Bairro:"}</span>
                <span className="text-zinc-300 font-black capitalize text-sm">{player.location || "Brooklyn"}</span>
              </div>
            </div>

            <button 
              onClick={() => {
                playSound.notification();
                setIsMapExpanded(!isMapExpanded);
              }}
              className="px-5 py-2.5 bg-gradient-to-b from-[#7f1d1d] to-[#450a0a] border border-[#fca5a5]/30 hover:brightness-110 active:brightness-90 text-rose-300 rounded-full font-mono text-[10px] uppercase font-black tracking-widest transition shadow-[0_4px_10px_rgba(220,38,38,0.25),inset_0_2px_4px_rgba(255,255,255,0.15)] shrink-0 flex items-center justify-center gap-2 select-none box-shadow-inner"
            >
              <span>{isMapExpanded ? (lang === "en" ? "COLLAPSE" : "RECOLHER") : (lang === "en" ? "EXPAND" : "MOSTRAR")}</span>
              {isMapExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isMapExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden space-y-4"
            >
              {/* EXCLUSIVE FLAT MOSAIC BUSINESS HUB / MODO MOSAICO DE NEGÓCIOS */}
              <div className="relative industrial-panel p-6 w-full shadow-2xl select-none" id="mosaico-tabuleiro">
                {/* Screws for main diorama board */}
                <div className="industrial-screw industrial-screw-tl hidden md:block"></div>
                <div className="industrial-screw industrial-screw-tr hidden md:block"></div>
                <div className="industrial-screw industrial-screw-bl hidden md:block"></div>
                <div className="industrial-screw industrial-screw-br hidden md:block"></div>

          {/* Ambient Glows to enrich design without polluting the screen */}
          <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[10%] right-[10%] w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-[40%] left-[40%] w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Symmetrical Mosaic Grid Layout (Clean Side-by-Side Cards) */}
          <div className="relative w-full z-10 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 bg-transparent" id="minha-rua-mosaic-grid">
            {(() => {
              const currentSlots = player.streetSlots || INITIAL_STREET_SLOTS;
              const builtSlots = currentSlots.map((s, i) => ({ ...s, rawIndex: i })).filter(s => s.buildingId);
              const itemsToRender = [...builtSlots, { id: "build-new-btn", isSpecialBuildBtn: true }];

              return itemsToRender.map((slot: any) => {
                if (slot.isSpecialBuildBtn) {
                  return (
                    <button
                      key="build-new-btn"
                      onClick={() => {
                        playSound.notification();
                        setSelectedBuilding("direct_construct_menu");
                      }}
                      className="industrial-panel hover:-translate-y-1 hover:shadow-2xl flex flex-col items-stretch overflow-hidden relative cursor-pointer group transition-all duration-300 border-amber-500/25 hover:border-amber-550/45 min-h-[220px]"
                    >
                      <div className="industrial-screw industrial-screw-tl hidden md:block"></div>
                      <div className="industrial-screw industrial-screw-tr hidden md:block"></div>
                      <div className="industrial-screw industrial-screw-bl hidden md:block"></div>
                      <div className="industrial-screw industrial-screw-br hidden md:block"></div>
                      
                      <div className="h-full w-full bg-gradient-to-b from-zinc-950 to-zinc-900/40 relative overflow-hidden flex flex-col items-center justify-center p-4">
                        <div className="w-16 h-16 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center transition-all duration-300 group-hover:bg-amber-500/10 group-hover:border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)] relative z-10 mb-4">
                          <Building className="w-8 h-8 text-amber-550 group-hover:text-amber-400 font-bold transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <span className="text-sm font-sans font-black tracking-wider uppercase mb-1 text-zinc-100 text-center drop-shadow-md">
                          {lang === "en" ? "CONSTRUCT NEW PROPERTY" : "CONSTRUIR NOVO EDIFÍCIO"}
                        </span>
                        <p className="text-[10px] text-zinc-500 font-mono mt-2 uppercase tracking-wide text-center">
                          {lang === "en" ? "Expand your empire" : "Expanda seu império"}
                        </p>
                      </div>
                    </button>
                  );
                }

                const index = slot.rawIndex;
                const buildingId = slot.buildingId;
                const level = slot.level || 0;
                const b = BUILDINGS[buildingId];
                if (!b) return null;
                
                // Set design specific colors for each building
                let neonBorder = "hover:border-purple-500/50";
                let neonText = "text-purple-400";
                let neonBg = "bg-purple-900/20";
                let neonBorderCircle = "border-purple-500/30";
                let neonShadow = "shadow-[0_0_15px_rgba(168,85,247,0.3)]";
                let spriteSrc = null;

                if (buildingId === "hotel") { neonBorder = "hover:border-blue-500/50"; neonText = "text-blue-400"; neonBg = "bg-blue-900/20"; neonBorderCircle = "border-blue-500/30"; neonShadow = "shadow-[0_0_15px_rgba(59,130,246,0.3)]"; spriteSrc = hotelSpriteImage; }
                else if (buildingId === "office") { neonBorder = "hover:border-amber-500/50"; neonText = "text-amber-400"; neonBg = "bg-amber-900/20"; neonBorderCircle = "border-amber-500/30"; neonShadow = "shadow-[0_0_15px_rgba(245,158,11,0.3)]"; spriteSrc = officeSpriteImage; }
                else if (buildingId === "club") { neonBorder = "hover:border-pink-500/50"; neonText = "text-pink-400"; neonBg = "bg-pink-900/20"; neonBorderCircle = "border-pink-500/30"; neonShadow = "shadow-[0_0_15px_rgba(236,72,153,0.3)]"; spriteSrc = clubSpriteImage; }
                else if (buildingId === "drink_factory") { neonBorder = "hover:border-sky-500/50"; neonText = "text-sky-400"; neonBg = "bg-sky-900/20"; neonBorderCircle = "border-sky-500/30"; neonShadow = "shadow-[0_0_15px_rgba(14,165,233,0.3)]"; spriteSrc = drinkFactorySpriteImage; }
                else if (buildingId === "drug_factory") { neonBorder = "hover:border-emerald-500/50"; neonText = "text-emerald-400"; neonBg = "bg-emerald-900/20"; neonBorderCircle = "border-emerald-500/30"; neonShadow = "shadow-[0_0_15px_rgba(16,185,129,0.3)]"; spriteSrc = drugFactorySpriteImage; }
                else if (buildingId === "car_factory") { neonBorder = "hover:border-indigo-500/50"; neonText = "text-indigo-400"; neonBg = "bg-indigo-900/20"; neonBorderCircle = "border-indigo-500/30"; neonShadow = "shadow-[0_0_15px_rgba(79,70,229,0.3)]"; spriteSrc = carFactorySpriteImage; }
                else if (buildingId === "feed_factory") { neonBorder = "hover:border-orange-500/50"; neonText = "text-orange-400"; neonBg = "bg-orange-900/20"; neonBorderCircle = "border-orange-500/30"; neonShadow = "shadow-[0_0_15px_rgba(249,115,22,0.3)]"; spriteSrc = feedFactorySpriteImage; }
                else if (buildingId === "revolver_factory") { neonBorder = "hover:border-red-500/50"; neonText = "text-red-400"; neonBg = "bg-red-900/20"; neonBorderCircle = "border-red-500/30"; neonShadow = "shadow-[0_0_15px_rgba(239,68,68,0.3)]"; spriteSrc = revolverFactorySpriteImage; }
                else if (buildingId === "laboratory") { neonBorder = "hover:border-teal-400 border-teal-500 shadow-md"; neonText = "text-teal-400"; neonBg = "bg-teal-900/20"; neonBorderCircle = "border-teal-500/30"; neonShadow = "shadow-[0_0_15px_rgba(45,212,191,0.3)]"; spriteSrc = laboratorySpriteImage; }
                
                return (
                  <button
                    key={slot.id}
                    onClick={() => {
                      playSound.notification();
                      setSelectedBuilding(`slot_active_${index}`);
                    }}
                    className={`industrial-panel hover:-translate-y-1 hover:shadow-2xl flex flex-col items-stretch overflow-hidden relative cursor-pointer group transition-all duration-300 ${neonBorder}`}
                    id={`active-${buildingId}-${index}`}
                  >
                    <div className="industrial-screw industrial-screw-tl hidden md:block"></div>
                    <div className="industrial-screw industrial-screw-tr hidden md:block"></div>
                    <div className="industrial-screw industrial-screw-bl hidden md:block"></div>
                    <div className="industrial-screw industrial-screw-br hidden md:block"></div>
                    
                    <div className="h-[140px] w-full bg-gradient-to-b from-zinc-950 to-zinc-900/40 relative overflow-hidden flex flex-col items-center justify-center p-4">
                      {spriteSrc ? (
                        <>
                          <img src={spriteSrc} alt={buildingId} className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-screen transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
                          {/* Circle emoji removed so the art can shine through */}
                        </>
                      ) : (
                        <div className="w-16 h-16 rounded-full border border-zinc-800 bg-[#0d0d12] flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110 relative z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)] animate-ring-strobe">
                          {b.emoji}
                        </div>
                      )}
                      <span className={`absolute top-3 right-3 text-[9px] font-mono font-bold px-2 py-0.5 rounded tracking-widest uppercase z-10 bg-zinc-900 border border-zinc-800 ${neonText}`}>
                        LV {level}
                      </span>
                    </div>
                    
                    <div className="px-4 pb-4 pt-1 w-full flex flex-col items-center justify-center gap-2 select-none relative z-10">
                      <span className={`text-sm font-sans font-black tracking-wider uppercase mb-1 text-center truncate w-full ${neonText}`}>
                        {lang === "en" ? b.nameEn : b.namePt}
                      </span>
                      <div className="w-full bg-[#111116] border border-zinc-800 shadow-[inset_0_2px_15px_rgba(0,0,0,0.8)] p-2 rounded-xl flex flex-col items-center">
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest leading-none">
                          {buildingId === "hotel" ? `+$${(level * 350).toLocaleString()}/hr` : buildingId === "office" ? `+$${(level * 120).toLocaleString()}/hr` : `+$${(level * 60).toLocaleString()}/hr`}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 border-t border-zinc-900 pt-1 w-full justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></span>
                          <span className="text-[8px] font-mono text-emerald-400 uppercase font-black tracking-widest leading-none">
                            {lang === "en" ? "MANAGE" : "GERENCIAR"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              });
            })()}
          </div>
        </div>


      </motion.div>
    )}
  </AnimatePresence>
  </div>
)}
    
    {subTab === "patrimonio" && (
      <div className="space-y-6 pt-2 font-sans select-none animate-fade-in">
        <div className="bg-[#0c1613] border border-emerald-900/40 text-emerald-400 text-xs p-4 rounded-3xl flex gap-3">
          <span className="text-xl">🏢</span>
          <div className="space-y-1 leading-normal font-sans">
            <strong className="text-emerald-300 font-mono text-[10px] uppercase tracking-wider block">
              {lang === "en" ? "METROPOLITAN EMPIRE INVESTMENTS" : "CONSELHO DE INVESTIMENTOS DO SUBMUNDO"}
            </strong>
            <p className="text-zinc-400 text-xs">
              {lang === "en"
                ? "Acquiring real estate properties creates structured automatic passive revenue. Returns are compiled and deposited directly in cash safely in your pockets every time you travel subway transit blocks between boroughs!"
                : "Adquirir imóveis e fatias de quarteirão gera receita passiva sólida estruturada. Nossos conselheiros compilam e depositam no seu bolso automaticamente esses royalties toda vez que você realiza trânsitos e viaja entre bairros!"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SHOP_ITEMS.filter((i) => i.type === "realestate").map((prop) => {
            const isOwned = player.realEstate.includes(prop.id);
            const { cost: dynamicCost, minLevel: minLvl, markupPercent } = getDynamicItemProps(prop, player);
            const hasLevel = player.level >= minLvl;
            const canAfford = player.cash >= dynamicCost;
            const isPurchasable = hasLevel && canAfford && !isOwned;
            const bgImage = getBuildingImage(prop.id);

            return (
              <div 
                key={prop.id} 
                className={`bg-[#09090c]/90 border p-5 rounded-2xl flex justify-between items-center gap-4 transition-all duration-200 relative overflow-hidden group ${
                  isOwned 
                    ? "border-emerald-500/40 bg-emerald-950/5 shadow-[0_4px_20px_rgba(16,185,129,0.06)]" 
                    : !hasLevel
                    ? "border-zinc-900 opacity-40 cursor-not-allowed"
                    : "border-zinc-850 hover:border-zinc-700 bg-[#16161b]/30"
                }`}
              >
                {bgImage && (
                  <>
                    <img src={bgImage} alt={prop.id} className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-screen pointer-events-none transition duration-300 group-hover:opacity-20" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/85 to-transparent pointer-events-none"></div>
                  </>
                )}

                <div className="space-y-2 flex-1 select-none relative z-10">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg select-none shrink-0">{prop.emoji || "🏢"}</span>
                    <span className="text-sm font-black text-neutral-100 font-sans tracking-tight">
                      {lang === "en" ? prop.nameEn : prop.namePt}
                    </span>
                    {isOwned && (
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {lang === "en" ? "ACTIVE REVENUE" : "GERANDO RENDA"}
                      </span>
                    )}
                    {!isOwned && markupPercent !== 0 && (
                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-mono font-black ${markupPercent > 0 ? "bg-[#ef4444]/13 text-[#ef4444]" : "bg-[#10b981]/13 text-[#10b981]"}`}>
                        {markupPercent > 0 ? `▲ +${markupPercent}%` : `▼ ${markupPercent}%`}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-normal font-sans">
                    {lang === "en" ? prop.descriptionEn : prop.descriptionPt}
                  </p>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono uppercase text-emerald-400 pt-1 border-t border-zinc-900/40">
                    <span className="font-bold flex items-center gap-0.5">💰 {formatMoney(dynamicCost)}</span>
                    <span className="text-emerald-500 font-bold flex items-center gap-0.5">📈 +{formatMoney(prop.passiveIncome || 0)} / TRAVEL</span>
                    {!isOwned && minLvl > 1 && (
                      <span className={hasLevel ? "text-zinc-600" : "text-amber-500 font-bold animate-pulse"}>
                        🔒 Lvl {minLvl}
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative z-10 shrink-0">
                  {isOwned ? (
                    <span className="text-emerald-500 text-xl font-mono" title={lang === "en" ? "Owned" : "Adquirido"}>
                      ✔️
                    </span>
                  ) : (
                    <button 
                      onClick={() => {
                        if (onBuyItem) {
                          onBuyItem(prop);
                        }
                      }}
                      disabled={!isPurchasable}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-black uppercase transition-all shadow-lg whitespace-nowrap min-w-[85px] ${isPurchasable ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer hover:shadow-emerald-600/10 active:scale-95 duration-100" : "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-[#16161b]"}`}
                    >
                      {!hasLevel ? (lang === "en" ? `Lvl ${minLvl}` : `Nível ${minLvl}`) : (lang === "en" ? "INVEST" : "INVESTIR")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}
      </motion.div>
      </AnimatePresence>

      {/* FLOATING INTERACTION MODAL IN CENTER OF SCREEN / MENU FLUTUANTE DE INTERAÇÃO DO MOSAICO */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {selectedBuilding && (
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 cursor-pointer"
              onClick={() => setSelectedBuilding(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-full max-w-md bg-[#0a0a0d]/95 border border-zinc-900 rounded-3xl p-6 shadow-2xl select-none cursor-default overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Decorative Subtle Color Gradients depending on the selectedBuilding */}
                {selectedBuilding === "prostitutas" && <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none"></div>}
                {selectedBuilding === "garagem" && <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>}
                {selectedBuilding === "policia" && <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>}
                {selectedBuilding === "cassino" && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>}
                {(selectedBuilding === "for_sale_1" || selectedBuilding === "for_sale_2") && <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>}
                {(selectedBuilding === "safehouse_owned" || selectedBuilding === "weed_owned") && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>}

                {/* Close Button on top corner */}
                <button 
                  onClick={() => setSelectedBuilding(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition shadow-inner z-[9999]"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Content render logic for each selectedBuilding */}
                {selectedBuilding.startsWith("slot_") && (() => {
                  const parts = selectedBuilding.split("_");
                  const slotType = parts[1]; // unpurchased, empty, active
                  const slotIndex = parseInt(parts[2]);
                  const slots = player.streetSlots || INITIAL_STREET_SLOTS;
                  const slot = slots[slotIndex];
                  if (!slot) return <p className="text-red-500 text-xs font-mono">Lot Slot not found</p>;
                  
                  if (slotType === "unpurchased") {
                    const canBuy = player.level >= 5 && player.cash >= 10000;
                    return (
                      <div className="space-y-4">
                        <img src={hotelSpriteImage} alt="terrain" className="absolute inset-x-0 top-0 w-full h-full object-cover opacity-10 mix-blend-screen pointer-events-none" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-[#0a0a0d]/80 to-transparent pointer-events-none"></div>
                        <div className="flex items-center gap-3 pb-3 border-b border-zinc-900 relative z-10">
                          <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">🚧</span>
                          <div>
                            <h4 className="text-sm font-extrabold text-amber-500 font-mono tracking-wider uppercase">
                              {lang === "en" ? "BUY VACANT SLOT" : "COMPRAR LOTE DE TERRENO"}
                            </h4>
                            <p className="text-[10px] font-mono text-zinc-500 uppercase">
                              {lang === "en" ? "REAL ESTATE EXPANSION" : "EXPANSÃO DE BAIRRO IMOBILIÁRIA"}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                          {lang === "en"
                            ? "Acquiring a land slot allows you to construct a revenue enterprise or tactical manufacturing plant. Each slot costs $10,000 cash and requires Player Level 5+."
                            : "A aquisição de um lote de terreno permite a construção de empreendimentos ou manufaturas táticas da quebrada. Cada lote custa $10.000 em dinheiro de bolso e exige Nível 5+."}
                        </p>

                        <div className="bg-[#0e0e12] border border-zinc-850 p-4 rounded-xl flex flex-col gap-1.5 font-mono text-xs">
                          <div className="flex justify-between">
                            <span className="text-zinc-500">{lang === "en" ? "Required Level:" : "Nível Necessário:"}</span>
                            <span className={player.level >= 5 ? "text-emerald-400 font-bold" : "text-rose-500 font-bold"}>LV 5 (Current: {player.level})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">{lang === "en" ? "Cost:" : "Custo:"}</span>
                            <span className={player.cash >= 10000 ? "text-emerald-400 font-bold" : "text-rose-500 font-bold"}>$10,000</span>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <button
                            disabled={!canBuy}
                            onClick={() => {
                              onUpdatePlayerState?.((prev) => {
                                const currentSlots = prev.streetSlots?.length ? [...prev.streetSlots] : [...INITIAL_STREET_SLOTS];
                                currentSlots[slotIndex] = { ...currentSlots[slotIndex], purchased: true };
                                return {
                                  ...prev,
                                  cash: Math.max(0, prev.cash - 10000),
                                  streetSlots: currentSlots
                                };
                              });
                              playSound.cash();
                              triggerAlert?.(lang === "en" ? "Land plot purchased successfully! Ready to construct." : "Terreno comprado com sucesso! Pronto para construir.", "success");
                              addGameLog?.(
                                `Purchased a new real estate land slot on your street map for $10,000!`,
                                `Comprou um novo lote de terreno na sua rua por $10.000!`,
                                "bank",
                                "🏗️"
                              );
                              setSelectedBuilding(null);
                            }}
                            className={`w-full py-3 px-4 rounded-xl font-mono text-xs font-black transition flex items-center justify-center gap-2 ${
                              canBuy 
                                ? "bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                                : "bg-zinc-900 text-zinc-600 border border-zinc-850 cursor-not-allowed"
                            }`}
                          >
                            🏗️ {lang === "en" ? "BUY LAND FOR $10,000" : "COMPRAR TERRENO ($10.000)"}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (slotType === "empty") {
                    const empresarioLvl = player.empresarioLvl || 1;
                    const nextEmpresarioCost = empresarioLvl === 1 ? 150000 : 450000;
                    const canUpgradeEmpresario = empresarioLvl < 3 && player.cash >= nextEmpresarioCost;
                    const isMaxEmpresario = empresarioLvl >= 3;
                    const canAffordEmpresario = !isMaxEmpresario && player.cash >= nextEmpresarioCost;
                    
                    return (
                      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                        <img src={officeSpriteImage} alt="terrain" className="fixed inset-x-0 top-0 w-full h-full object-cover opacity-10 mix-blend-screen pointer-events-none" referrerPolicy="no-referrer" />
                        <div className="flex items-center gap-3 pb-3 border-b border-zinc-900 sticky top-0 bg-[#0a0a0d]/90 backdrop-blur z-10 pt-2">
                          <span className="text-2xl">🏗️</span>
                          <div>
                            <h4 className="text-sm font-extrabold text-zinc-100 font-mono tracking-wider">
                              {lang === "en" ? "CONSTRUCT ON VACANT LAND" : "EDIFICAR NO TERRENO VAGO"}
                            </h4>
                            <p className="text-[10px] font-mono text-zinc-500 uppercase">
                              {lang === "en" ? "CHOOSE PROJECTS" : "SELECIONE O EDIFÍCIO"}
                            </p>
                          </div>
                        </div>

                        {/* BUSINESSMAN RECRUITMENT STATUS BANNER */}
                        <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">💼 {lang === "en" ? "BUSINESSMAN STATUS" : "FAMA DE EMPRESÁRIO"}</span>
                            <span className="text-xs font-mono font-bold text-amber-400">LV {empresarioLvl}/3</span>
                          </div>
                          {!isMaxEmpresario ? (
                            <button
                              disabled={!canAffordEmpresario}
                              onClick={() => {
                                onUpdatePlayerState?.((prev) => ({
                                  ...prev,
                                  cash: Math.max(0, prev.cash - nextEmpresarioCost),
                                  empresarioLvl: (prev.empresarioLvl || 1) + 1
                                }));
                                playSound.cash();
                                triggerAlert?.(lang === "en" ? "Businessman Level Upgraded successfully!" : "Fama de Empresário promovida com sucesso!", "success");
                                setSelectedBuilding(null);
                              }}
                              className={`w-full py-2 px-3 rounded text-[9px] font-mono uppercase font-extrabold flex items-center justify-between transition ${
                                canAffordEmpresario 
                                  ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/35"
                                  : "bg-zinc-900 text-zinc-600 border border-zinc-950 cursor-not-allowed"
                              }`}
                            >
                              <span>⚡ {lang === "en" ? "UPGRADE STATUS" : "PROMOVER CARREIRA"}</span>
                              <span>${nextEmpresarioCost.toLocaleString()}</span>
                            </button>
                          ) : (
                            <p className="text-[9px] font-mono text-emerald-400 uppercase font-bold text-right">★ {lang === "en" ? "MAX STATUS ATTAINED" : "FAMA EMPRESARIAL NO MÁXIMO"}</p>
                          )}
                        </div>

                        <div className="space-y-3 pt-1">
                          {Object.values(BUILDINGS).map((b) => {
                            let canConstruct = player.cash >= b.cost;
                            const isLab = b.id === "laboratory";
                            
                            if (isLab) {
                              if (player.level < 20 || (player.empresarioLvl || 1) < 3) {
                                canConstruct = false;
                              }
                            }

                            let spriteSrc = null;
                            if (b.id === "hotel") spriteSrc = hotelSpriteImage;
                            else if (b.id === "office") spriteSrc = officeSpriteImage;
                            else if (b.id === "club") spriteSrc = clubSpriteImage;
                            else if (b.id === "drink_factory") spriteSrc = drinkFactorySpriteImage;
                            else if (b.id === "drug_factory") spriteSrc = drugFactorySpriteImage;
                            else if (b.id === "car_factory") spriteSrc = carFactorySpriteImage;
                            else if (b.id === "feed_factory") spriteSrc = feedFactorySpriteImage;
                            else if (b.id === "revolver_factory") spriteSrc = revolverFactorySpriteImage;
                            else if (b.id === "laboratory") spriteSrc = laboratorySpriteImage;

                            return (
                              <div
                                key={b.id}
                                className="bg-zinc-950/60 border border-zinc-900 hover:border-zinc-850 p-3 rounded-xl flex flex-col gap-2 relative group transition min-h-[105px] overflow-hidden"
                              >
                                {spriteSrc && (
                                  <>
                                    <img src={spriteSrc} alt={b.id} className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-screen scale-100 group-hover:scale-105 transition-transform duration-500 ease-in-out" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-transparent"></div>
                                  </>
                                )}
                                <div className="flex gap-3 relative z-10">
                                  <span className="text-2xl filter drop-shadow-md select-none">{b.emoji}</span>
                                  <div className="flex-1">
                                    <h5 className="text-xs font-mono font-bold text-zinc-200">
                                      {lang === "en" ? b.nameEn : b.namePt}
                                    </h5>
                                    <p className="text-[10px] text-zinc-500 leading-tight">
                                      {lang === "en" ? b.descriptionEn : b.descriptionPt}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-zinc-900/40 pt-2 mt-1 relative z-10">
                                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                                    💰 ${b.cost.toLocaleString()}
                                  </span>

                                  {isLab && (player.level < 20 || (player.empresarioLvl || 1) < 3) ? (
                                    <span className="text-[8px] font-mono text-rose-500 uppercase font-black tracking-tighter text-right max-w-[150px]">
                                      {lang === "en" ? "REQ LV 20 & BUSINESS LV 3" : "REQ NÍVEL 20 & EMPRESÁRIO LV 3"}
                                    </span>
                                  ) : (
                                    <button
                                      disabled={!canConstruct}
                                      onClick={() => {
                                        onUpdatePlayerState?.((prev) => {
                                          const currentSlots = prev.streetSlots?.length ? [...prev.streetSlots] : [...INITIAL_STREET_SLOTS];
                                          currentSlots[slotIndex] = {
                                            ...currentSlots[slotIndex],
                                            buildingId: b.id,
                                            level: 1
                                          };
                                          return {
                                            ...prev,
                                            cash: Math.max(0, prev.cash - b.cost),
                                            streetSlots: currentSlots,
                                            skillPoints: (prev.skillPoints || 0) + 1
                                          };
                                        });
                                        playSound.cash();
                                        triggerAlert?.(
                                          lang === "en" 
                                            ? `Constructed ${b.nameEn} successfully!` 
                                            : `Instalou ${b.namePt} com sucesso!`,
                                          "success"
                                        );
                                        addGameLog?.(
                                          `Erected newly built ${b.nameEn} on cleared street slot!`,
                                          `Instalou e edificou o novo ${b.namePt} no terreno vago na sua rua!`,
                                          "system",
                                          b.emoji
                                        );
                                        setSelectedBuilding(null);
                                      }}
                                      className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition ${
                                        canConstruct
                                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20"
                                          : "bg-zinc-900 text-zinc-600 border border-zinc-950 cursor-not-allowed"
                                      }`}
                                    >
                                      🛠️ {lang === "en" ? "BUILD" : "EDIFICAR"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (slotType === "active") {
                    const b = BUILDINGS[slot.buildingId];
                    if (!b) return <p className="text-rose-500 font-mono text-xs">Unrecognized ID</p>;
                    
                    const nextUpgradeCost = slot.level * b.cost * 1.8;
                    const canUpgrade = player.cash >= nextUpgradeCost && slot.level < 10;
                    const bgImage = getBuildingImage(b.id);
                    
                    return (
                      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                        {bgImage && (
                          <img src={bgImage} alt="terrain" className="fixed inset-x-0 top-0 w-full h-full object-cover opacity-10 mix-blend-screen pointer-events-none" referrerPolicy="no-referrer" />
                        )}
                        <div className="flex items-center gap-3 pb-3 border-b border-zinc-900 sticky top-0 bg-[#0a0a0d]/90 backdrop-blur z-10 pt-2">
                          <span className="text-3xl filter drop-shadow-md animate-ring-strobe">{b.emoji}</span>
                          <div>
                            <h4 className="text-sm font-extrabold text-zinc-200 font-mono tracking-wider flex items-center gap-2">
                              {lang === "en" ? b.nameEn : b.namePt}
                              <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-bold uppercase">LV {slot.level}</span>
                            </h4>
                            <p className="text-[10px] font-mono text-zinc-500 leading-none">
                              {lang === "en" ? b.descriptionEn : b.descriptionPt}
                            </p>
                          </div>
                        </div>

                        {/* EXCLUSIVE BUILDING INTERACTION CONTROLS */}
                        {/* 1. HOTEL */}
                        {slot.buildingId === "hotel" && (
                          <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2">
                            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">🌟 Underworld Suite Activities</span>
                            <p className="text-[10px] font-mono text-zinc-500 leading-tight">
                              {lang === "en" ? "Organize discrete parties to launder dirty payouts. Rewards substantial raw cash at energy cost." : "Organize festas de luxo privativas para faturar dinheiro sujo. Custo de energia moderado."}
                            </p>
                            <button
                              disabled={player.energy < 20}
                              onClick={() => {
                                const bonusCash = Math.floor(Math.random() * 1200) + 1800 * slot.level;
                                onUpdatePlayerState?.((prev) => ({
                                  ...prev,
                                  cash: prev.cash + bonusCash,
                                  energy: Math.max(0, prev.energy - 20)
                                }));
                                playSound.cash();
                                triggerAlert?.(lang === "en" ? `Party Complete! Cleaned +$${bonusCash} wash.` : `Festa concluída! Lavou +$${bonusCash} em espécie.`, "success");
                                setSelectedBuilding(null);
                              }}
                              className="w-full py-2 bg-blue-500 hover:bg-blue-400 text-black font-mono font-black text-xs rounded transition uppercase flex justify-between px-3"
                            >
                              <span>🎉 {lang === "en" ? "Host Private Gala Party" : "Organizar Gala Privativa"}</span>
                              <span>⚡20 💵+{Math.floor(1800 * slot.level).toLocaleString()}</span>
                            </button>
                          </div>
                        )}

                        {/* 2. OFFICE */}
                        {slot.buildingId === "office" && (() => {
                          const extortionsNum = player.extortions || 0;
                          const maxExtortions = slot.level * 10;
                          const isFullyExtorted = extortionsNum >= maxExtortions;
                          return (
                            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">📈 Extortion Dashboard</span>
                                <span className="text-[10px] font-mono text-amber-500 font-extrabold">{extortionsNum} / {maxExtortions} {lang === "en" ? "CAP" : "COTAS"}</span>
                              </div>
                              <p className="text-[10px] font-mono text-zinc-500 leading-tight">
                                {lang === "en" 
                                  ? "Collect active street extortion quotas. Each level allows +10 extortions (max 50 per building). Extra probability to discover Syndicate Connections!" 
                                  : "Cobre taxas de extorsão na marra de pequenos comerciantes. Cada nível de escritório libera +10 extorções (máx 50). Chance de obter conexões com o sindicato!"}
                              </p>
                              
                              <button
                                disabled={player.energy < 12 || isFullyExtorted}
                                onClick={() => {
                                  const gotConnection = Math.random() < 0.20; // 20% chance
                                  const rawCash = Math.floor(Math.random() * 800) + 1100 * slot.level;
                                  onUpdatePlayerState?.((prev) => ({
                                    ...prev,
                                    cash: prev.cash + rawCash,
                                    energy: Math.max(0, prev.energy - 12),
                                    extortions: (prev.extortions || 0) + 1,
                                    connections: gotConnection ? prev.connections + 1 : prev.connections
                                  }));
                                  playSound.cash();
                                  triggerAlert?.(
                                    lang === "en"
                                      ? `Extortion Collected! +$${rawCash} raw money.${gotConnection ? " Found +1 Connection!" : ""}`
                                      : `Ameaça executada! +$${rawCash} extorquido.${gotConnection ? " Faturou +1 Conexão!" : ""}`,
                                    "success"
                                  );
                                  setSelectedBuilding(null);
                                }}
                                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-xs rounded transition uppercase flex justify-between px-3"
                              >
                                <span>⚖️ {lang === "en" ? "Bribe / Coerce Shops" : "Coagir Estabelecimentos"}</span>
                                <span>⚡12 💵+${Math.floor(1100 * slot.level).toLocaleString()}</span>
                              </button>
                            </div>
                          );
                        })()}

                        {/* 3. CLUB */}
                        {slot.buildingId === "club" && (() => {
                          const femaleRoster = player.prostitutes || [];
                          return (
                            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3">
                              <span className="text-[10px] font-mono text-pink-500 font-black uppercase tracking-wider block">💃 Companion Hiring Panel</span>
                              <p className="text-[10px] text-zinc-500 font-mono leading-tight">
                                {lang === "en" 
                                  ? "Hiring companions expands your block reputation and permanently trains physical characteristics." 
                                  : "A contratação de profissionais da noite expande seu cabaré Velvet Fox, fornecendo bônus de atributos fixos e permanentes."}
                              </p>

                              <div className="space-y-2">
                                {[
                                  { key: "natasha", name: "Natasha", ptsCost: 15000, ptsText: "Permanent: +20 Defense", bonus: { defense: 20 } },
                                  { key: "bianca", name: "Bianca Elite", ptsCost: 35000, ptsText: "Permanent: +45 Power", bonus: { intellect: 45 } },
                                  { key: "larissa", name: "Larissa Exclusive", ptsCost: 65000, ptsText: "Permanent: +80 Respect", bonus: { respect: 80 } },
                                  { key: "yasmim", name: "Yasmim Velvet Vip", ptsCost: 120000, ptsText: "Permanent: +120 Strength", bonus: { strength: 120 } }
                                ].map((companion) => {
                                  const hired = femaleRoster.includes(companion.key);
                                  const canAffordCompanion = player.cash >= companion.ptsCost;
                                  return (
                                    <div key={companion.key} className="bg-zinc-900/60 p-2 rounded-lg flex items-center justify-between border border-zinc-850">
                                      <div className="font-mono text-[10px]">
                                        <p className="text-zinc-200 font-bold">{companion.name}</p>
                                        <p className="text-pink-400 font-sans">{companion.ptsText}</p>
                                      </div>
                                      
                                      {hired ? (
                                        <span className="text-[9px] font-mono text-emerald-400 uppercase font-black tracking-widest bg-emerald-950 border border-emerald-500/20 px-2 py-1 rounded">
                                          HIRED
                                        </span>
                                      ) : (
                                        <button
                                          disabled={!canAffordCompanion}
                                          onClick={() => {
                                            onUpdatePlayerState?.((prev) => {
                                              const roster = prev.prostitutes || [];
                                              return {
                                                ...prev,
                                                cash: Math.max(0, prev.cash - companion.ptsCost),
                                                prostitutes: [...roster, companion.key],
                                                defense: prev.defense + (companion.bonus.defense || 0),
                                                intellect: prev.intellect + (companion.bonus.intellect || 0),
                                                respect: prev.respect + (companion.bonus.respect || 0),
                                                strength: prev.strength + (companion.bonus.strength || 0)
                                              };
                                            });
                                            playSound.cash();
                                            triggerAlert?.(
                                              lang === "en" 
                                                ? `Recruited ${companion.name}! Permanent stats received.` 
                                                : `Recrutou ${companion.name}! Ganhos permanentes creditados.`,
                                              "success"
                                            );
                                            setSelectedBuilding(null);
                                          }}
                                          className={`px-2 py-1 rounded text-[9px] font-mono font-bold transition uppercase ${
                                            canAffordCompanion 
                                              ? "bg-pink-650 bg-pink-600 hover:bg-pink-500 text-white" 
                                              : "bg-zinc-950 text-zinc-600 cursor-not-allowed border border-zinc-900"
                                          }`}
                                        >
                                          ${companion.ptsCost.toLocaleString()}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* 4. DRINK FACTORY */}
                        {slot.buildingId === "drink_factory" && (() => {
                          const bCounts = player.customDrinks || { beer: 1, energy_drink: 0, absinthe: 0 };
                          const canBrewBeer = player.cash >= 600 && player.energy >= 10;
                          const canBrewEnergy = player.cash >= 1500 && player.energy >= 15;
                          const canBrewAbsinthe = player.cash >= 5000 && player.energy >= 25;
                          return (
                            <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3 font-mono text-[10px]">
                              <span className="text-zinc-400 uppercase font-bold tracking-wide block">🍺 Distillery Brewery Vault</span>
                              
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-850">
                                  <p className="text-zinc-500">🍺 Beer</p>
                                  <p className="text-base font-black text-white">{bCounts.beer || 1}</p>
                                  <button
                                    disabled={!(bCounts.beer > 0)}
                                    onClick={() => {
                                      onUpdatePlayerState?.((prev) => {
                                        const drinks = { beer: 1, energy_drink: 0, absinthe: 0, ...prev.customDrinks };
                                        drinks.beer = Math.max(0, (drinks.beer || 0) - 1);
                                        return {
                                          ...prev,
                                          customDrinks: drinks,
                                          energy: Math.min(prev.maxEnergy, prev.energy + 15),
                                          intoxication: Math.min(100, (prev.intoxication || 0) + 5)
                                        };
                                      });
                                      playSound.notification();
                                      triggerAlert?.(lang === "en" ? "Gulp! +15 Energy." : "Gole rápido! +15 de Energia.");
                                    }}
                                    className="mt-1.5 w-full bg-amber-600 hover:bg-amber-500 text-white rounded py-0.5 text-[9px] font-bold"
                                  >
                                    DRINK
                                  </button>
                                </div>
                                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-850">
                                  <p className="text-zinc-400">⚡ Energy</p>
                                  <p className="text-base font-black text-white">{bCounts.energy_drink || 0}</p>
                                  <button
                                    disabled={!(bCounts.energy_drink > 0)}
                                    onClick={() => {
                                      onUpdatePlayerState?.((prev) => {
                                        const drinks = { beer: 1, energy_drink: 0, absinthe: 0, ...prev.customDrinks };
                                        drinks.energy_drink = Math.max(0, (drinks.energy_drink || 0) - 1);
                                        return {
                                          ...prev,
                                          customDrinks: drinks,
                                          energy: Math.min(prev.maxEnergy, prev.energy + 35),
                                          intoxication: Math.min(100, (prev.intoxication || 0) + 2)
                                        };
                                      });
                                      playSound.notification();
                                      triggerAlert?.(lang === "en" ? "Burst! +35 Energy." : "Energia bruta! +35 de Energia.");
                                    }}
                                    className="mt-1.5 w-full bg-sky-600 hover:bg-sky-500 text-white rounded py-0.5 text-[9px] font-bold"
                                  >
                                    DRINK
                                  </button>
                                </div>
                                <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-850">
                                  <p className="text-zinc-500">💀 Absinthe</p>
                                  <p className="text-base font-black text-white">{bCounts.absinthe || 0}</p>
                                  <button
                                    disabled={!(bCounts.absinthe > 0)}
                                    onClick={() => {
                                      onUpdatePlayerState?.((prev) => {
                                        const drinks = { beer: 1, energy_drink: 0, absinthe: 0, ...prev.customDrinks };
                                        drinks.absinthe = Math.max(0, (drinks.absinthe || 0) - 1);
                                        return {
                                          ...prev,
                                          customDrinks: drinks,
                                          energy: Math.min(prev.maxEnergy, prev.energy + 80),
                                          intoxication: Math.min(100, (prev.intoxication || 0) + 12)
                                        };
                                      });
                                      playSound.notification();
                                      triggerAlert?.(lang === "en" ? "Extreme! +80 Energy." : "Absinto puro! +80 de Energia.");
                                    }}
                                    className="mt-1.5 w-full bg-purple-600 hover:bg-purple-500 text-white rounded py-0.5 text-[9px] font-bold"
                                  >
                                    DRINK
                                  </button>
                                </div>
                              </div>

                              <div className="border-t border-zinc-900 pt-2 space-y-1">
                                <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{lang === "en" ? "BREW CLANDESTINE RECIPES" : "DESTILAR NOVA BEBIDA"}</span>
                                <div className="flex justify-between items-center bg-zinc-905 bg-zinc-900 p-1.5 rounded">
                                  <span>🍺 Craft Ale Beer</span>
                                  <button
                                    disabled={!canBrewBeer}
                                    onClick={() => {
                                      onUpdatePlayerState?.((prev) => {
                                        const drinks = { beer: 1, energy_drink: 0, absinthe: 0, ...prev.customDrinks };
                                        return {
                                          ...prev,
                                          cash: Math.max(0, prev.cash - 600),
                                          energy: Math.max(0, prev.energy - 10),
                                          customDrinks: { ...drinks, beer: (drinks.beer || 0) + 1 }
                                        };
                                      });
                                      playSound.cash();
                                    }}
                                    className="bg-zinc-800 hover:bg-zinc-705 text-amber-400 px-2.5 py-1 rounded"
                                  >
                                    $600 (⚡10)
                                  </button>
                                </div>
                                <div className="flex justify-between items-center bg-zinc-900 p-1.5 rounded">
                                  <span>⚡ Underworld Energy Tonic</span>
                                  <button
                                    disabled={!canBrewEnergy}
                                    onClick={() => {
                                      onUpdatePlayerState?.((prev) => {
                                        const drinks = { beer: 1, energy_drink: 0, absinthe: 0, ...prev.customDrinks };
                                        return {
                                          ...prev,
                                          cash: Math.max(0, prev.cash - 1500),
                                          energy: Math.max(0, prev.energy - 15),
                                          customDrinks: { ...drinks, energy_drink: (drinks.energy_drink || 0) + 1 }
                                        };
                                      });
                                      playSound.cash();
                                    }}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-sky-450 text-sky-400 px-2.5 py-1 rounded"
                                  >
                                    $1,500 (⚡15)
                                  </button>
                                </div>
                                <div className="flex justify-between items-center bg-zinc-900 p-1.5 rounded">
                                  <span>🤢 Pure Absinthe Extra</span>
                                  <button
                                    disabled={!canBrewAbsinthe}
                                    onClick={() => {
                                      onUpdatePlayerState?.((prev) => {
                                        const drinks = { beer: 1, energy_drink: 0, absinthe: 0, ...prev.customDrinks };
                                        return {
                                          ...prev,
                                          cash: Math.max(0, prev.cash - 5000),
                                          energy: Math.max(0, prev.energy - 25),
                                          customDrinks: { ...drinks, absinthe: (drinks.absinthe || 0) + 1 }
                                        };
                                      });
                                      playSound.cash();
                                    }}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-purple-400 px-2.5 py-1 rounded"
                                  >
                                    $5,000 (⚡25)
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 5. DRUG FACTORY */}
                        {slot.buildingId === "drug_factory" && (
                          <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3 font-mono text-[10px]">
                            <span className="text-emerald-450 uppercase font-bold tracking-wide block">🥦 Cannabis Bio greenhouse</span>
                            <p className="text-zinc-500 leading-tight">
                              {lang === "en" ? "Produce weed blocks instantly that transfer directly to transport trucks." : "Manufature blocos e cargas de drogas hidropônicas para faturar alto."}
                            </p>
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center bg-zinc-900 p-1.5 rounded border border-zinc-950">
                                <span>🌿 Skunk Hydro Box</span>
                                <button
                                  disabled={player.cash < 2500 || player.energy < 15}
                                  onClick={() => {
                                    onUpdatePlayerState?.((prev) => {
                                      const drugs = { ...prev.drugsInventory };
                                      drugs.weed = (drugs.weed || 0) + 20;
                                      return {
                                        ...prev,
                                        cash: Math.max(0, prev.cash - 2500),
                                        energy: Math.max(0, prev.energy - 15),
                                        drugsInventory: drugs
                                      };
                                    });
                                    playSound.cash();
                                    triggerAlert?.(lang === "en" ? "Gained +20 blocks of Hydro Weed!" : "Faturou +20 tabletes de Maconha!", "success");
                                    setSelectedBuilding(null);
                                  }}
                                  className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 px-3 py-1 rounded"
                                >
                                  $2,500 (⚡15)
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 6. CAR FACTORY */}
                        {slot.buildingId === "car_factory" && (
                          <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2 font-mono text-[10px]">
                            <span className="text-indigo-400 uppercase font-black text-[10px] tracking-wide block">🚗 Biofuel Synthesis Lab</span>
                            <div className="flex justify-between items-center">
                              <span className="text-zinc-500">{lang === "en" ? "Active Reserve Fuel:" : "Combustível Reserva:"}</span>
                              <span className="text-zinc-200 font-extrabold">{player.fuel || 0} UNITS</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 leading-tight">
                              {lang === "en" ? "Vehicles require 1 active fuel pack to utilize mechanical defensive shielding in combat." : "Carros de fuga necessitam de biocombustível para ativar seus sistemas automáticos de repulsão."}
                            </p>
                            <button
                              disabled={player.cash < 4000 || player.energy < 10}
                              onClick={() => {
                                onUpdatePlayerState?.((prev) => ({
                                  ...prev,
                                  cash: Math.max(0, prev.cash - 4000),
                                  energy: Math.max(0, prev.energy - 10),
                                  fuel: (prev.fuel || 0) + 5
                                }));
                                playSound.cash();
                                triggerAlert?.(lang === "en" ? "Gained +5 reserves of Fuel!" : "Fabricou +5 galões de Biocombustível!", "success");
                                setSelectedBuilding(null);
                              }}
                              className="w-full mt-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold uppercase transition"
                            >
                              ⚙️ {lang === "en" ? "Brew Biofuel (+5 Pack)" : "Sintetizar Biocombustível (+5 Unidades)"}
                            </button>
                          </div>
                        )}

                        {/* 7. FEED FACTORY */}
                        {slot.buildingId === "feed_factory" && (
                          <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2 font-mono text-[10px]">
                            <span className="text-orange-400 uppercase font-bold tracking-wide block">🦴 Guard Dog Kibble Mill</span>
                            <div className="flex justify-between items-center">
                              <span className="text-zinc-500">{lang === "en" ? "Mascot Treats Roster:" : "Estoque de Rações:"}</span>
                              <span className="text-zinc-200 font-extrabold">{player.petFood || 0} FEED UNITS</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 leading-tight">
                              {lang === "en" ? "Guard dogs must be fed with kibble treats to authorize defensive multiplier." : "Cães de guarda famintos recusam-se a avançar nos inimigos; mantenha ração para usufruir de bônus."}
                            </p>
                            <button
                              disabled={player.cash < 1500 || player.energy < 8}
                              onClick={() => {
                                onUpdatePlayerState?.((prev) => ({
                                  ...prev,
                                  cash: Math.max(0, prev.cash - 1500),
                                  energy: Math.max(0, prev.energy - 8),
                                  petFood: (prev.petFood || 0) + 12
                                }));
                                playSound.cash();
                                triggerAlert?.(lang === "en" ? "Gained +12 treats of Pet Kibbles!" : "Moeu +12 pacotes de Ração Premium!", "success");
                                setSelectedBuilding(null);
                              }}
                              className="w-full mt-1.5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold uppercase transition"
                            >
                              🦴 {lang === "en" ? "Sieve Mascot Treats (+12 Treat)" : "Saccar Ração para Mascote (+12 Rações)"}
                            </button>
                          </div>
                        )}

                        {/* 8. REVOLVER FACTORY */}
                        {slot.buildingId === "revolver_factory" && (
                          <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2 font-mono text-[10px]">
                            <span className="text-red-400 uppercase font-black tracking-wide block">🔫 Munitions & Ammo Presses</span>
                            <div className="flex justify-between items-center">
                              <span className="text-zinc-500">{lang === "en" ? "Ammunition Inventory:" : "Munição Tática em Estoque:"}</span>
                              <span className="text-zinc-200 font-extrabold">{player.ammo || 0} ROUNDS</span>
                            </div>
                            <p className="text-[9px] text-zinc-500 leading-tight">
                              {lang === "en" ? "Weapons require active ammunition to engage. Without rounds, combat attack modifier degrades." : "Armas desprovidas de projéteis ativos perdem eficácia de perfuração mecânica instantaneamente."}
                            </p>
                            <button
                              disabled={player.cash < 3500 || player.energy < 12}
                              onClick={() => {
                                onUpdatePlayerState?.((prev) => ({
                                  ...prev,
                                  cash: Math.max(0, prev.cash - 3500),
                                  energy: Math.max(0, prev.energy - 12),
                                  ammo: (prev.ammo || 0) + 50
                                }));
                                playSound.cash();
                                triggerAlert?.(lang === "en" ? "Pistoned +50 rounds of Ammo!" : "Operou prensa: +50 Projéteis Táticos!", "success");
                                setSelectedBuilding(null);
                              }}
                              className="w-full mt-1.5 py-2 bg-red-650 bg-red-600 hover:bg-red-500 text-white rounded font-bold uppercase transition"
                            >
                              🔫 {lang === "en" ? "Press Ammo Box (+50 Rounds)" : "Prensar Caixa de Projéteis (+50 Balas)"}
                            </button>
                          </div>
                        )}

                        {/* 9. LABORATORY (HIGH VALUE DESIGNER DRUGS) */}
                        {slot.buildingId === "laboratory" && (
                          <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-3 font-mono text-[10px]">
                            <span className="text-teal-400 uppercase font-bold tracking-widest text-[11px] block animate-pulse">💎 HIGH TECH SYNDICATE SPEC LAB</span>
                            <p className="text-zinc-500 leading-tight">
                              {lang === "en" 
                                ? "Acquire pure dynamic designer chemical capsules in exchange for Syndicate Connections. Instantly grants amazing permanent stat upgrades." 
                                : "Fature compostos químicos puros e designer em troca de suas conexões do Sindicato. Consumo concede aumentos absurdos de atributos!"}
                            </p>

                            <div className="space-y-2.5">
                              {[
                                { key: "escama", name: "Cocaine Escama de Peixe 99% Pure", cost: 2, desc: "Avanço Permanente: +35 força/ataque, +energia e intoxicação", points: { strength: 35, hpHeal: false, energyHeal: true, wanted: 10, intoxication: 15 } },
                                { key: "skunk", name: "VIP Super Skunk Bud Extract", cost: 1, desc: "Avanço Permanente: +15 defesa, +energia, +10 procurado", points: { defense: 15, hpHeal: false, energyHeal: true, wanted: 10, intoxication: 25 } },
                                { key: "dry", name: "Dry Haxixe Golden Concentrate", cost: 3, desc: "Avanço Permanente: +5 determinação (willpower), +15 reputação", points: { willpower: 5, respect: 15, wanted: 5, intoxication: 20 } },
                                { key: "mdma", name: "Sintéticos MDMA Hexagon Supreme", cost: 4, desc: "Avanço Permanente: +10 intelecto, refrigério vital max", points: { intellect: 10, energyHeal: true, hpHeal: true, wanted: 15, intoxication: 25 } }
                              ].map((formula) => {
                                const canProduce = player.connections >= formula.cost;
                                return (
                                  <div key={formula.key} className="bg-zinc-900/80 p-2 rounded border border-zinc-850 flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center">
                                      <span className="text-zinc-200 font-bold">{formula.name}</span>
                                      <span className="text-teal-500 text-teal-400 font-bold text-[9px] bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800/30">⚡ {formula.cost} CONNs</span>
                                    </div>
                                    <p className="text-[9px] text-zinc-550 leading-none">{formula.desc}</p>
                                    <button
                                      disabled={!canProduce}
                                      onClick={() => {
                                        onUpdatePlayerState?.((prev) => {
                                          let nextHealth = prev.health;
                                          let nextEnergy = prev.energy;
                                          if (formula.points.hpHeal) nextHealth = prev.maxHealth;
                                          if (formula.points.energyHeal) nextEnergy = prev.maxEnergy;

                                          return {
                                            ...prev,
                                            connections: Math.max(0, prev.connections - formula.cost),
                                            strength: prev.strength + (formula.points.strength || 0),
                                            defense: prev.defense + (formula.points.defense || 0),
                                            willpower: Math.min(100, prev.willpower + (formula.points.willpower || 0)),
                                            respect: prev.respect + (formula.points.respect || 0),
                                            intellect: prev.intellect + (formula.points.intellect || 0),
                                            heat: Math.min(100, (prev.heat || 0) + (formula.points.wanted || 0)),
                                            intoxication: Math.min(100, (prev.intoxication || 0) + (formula.points.intoxication || 0)),
                                            health: nextHealth,
                                            energy: nextEnergy
                                          };
                                        });
                                        playSound.notification();
                                        triggerAlert?.(
                                          lang === "en"
                                            ? `Synthesized and consumed ${formula.name}! Dynamic stats activated.`
                                            : `Sintetizou e injetou ${formula.name}! Atributos ativados.`,
                                          "success"
                                        );
                                        setSelectedBuilding(null);
                                      }}
                                      className={`w-full py-1 text-[8.5px] font-mono font-bold rounded transition ${
                                        canProduce
                                          ? "bg-teal-600 hover:bg-teal-500 text-white"
                                          : "bg-zinc-950 text-zinc-700 cursor-not-allowed"
                                      }`}
                                    >
                                      🧬 {lang === "en" ? "SYNTHESIZE & INJECT CAPSULE" : "SINTETIZAR & CONSUMIR RECURSO"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* UPGRADE AND DEMOLISH CONTROLS AT THE BOTTOM */}
                        <div className="border-t border-zinc-900 pt-3 space-y-2 flex flex-col font-mono text-[10px]">
                          <div className="flex justify-between items-center bg-zinc-950 p-2.5 rounded border border-zinc-900">
                            <div>
                              <p className="text-zinc-200 font-bold">{lang === "en" ? "UPGRADE LEVEL" : "PROMOVER EMPREENDIMENTO"}</p>
                              <p className="text-zinc-500 text-[9px]">{slot.level >= 10 ? "MAX CAPACITY" : `${lang === "en" ? "Upgrade Cost:" : "Custo do Próximo Nível:"} $${nextUpgradeCost.toLocaleString()}`}</p>
                            </div>
                            <button
                              disabled={!canUpgrade}
                              onClick={() => {
                                onUpdatePlayerState?.((prev) => {
                                  const currentSlots = prev.streetSlots?.length ? [...prev.streetSlots] : [...INITIAL_STREET_SLOTS];
                                  currentSlots[slotIndex] = {
                                    ...currentSlots[slotIndex],
                                    level: (currentSlots[slotIndex].level || 1) + 1
                                  };
                                  return {
                                    ...prev,
                                    cash: Math.max(0, prev.cash - nextUpgradeCost),
                                    streetSlots: currentSlots,
                                    skillPoints: (prev.skillPoints || 0) + 1
                                  };
                                });
                                playSound.cash();
                                triggerAlert?.(
                                  lang === "en"
                                    ? `Upgraded ${b.nameEn} to Level ${(slot.level + 1)}!`
                                    : `Promoveu ${b.namePt} para o Nível ${(slot.level + 1)}!`,
                                  "success"
                                );
                                setSelectedBuilding(null);
                              }}
                              className={`px-3 py-1.5 rounded font-bold uppercase transition ${
                                canUpgrade
                                  ? "bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-950/20"
                                  : "bg-zinc-900 text-zinc-650 cursor-not-allowed border border-zinc-800"
                              }`}
                            >
                              🚀 LV {slot.level + 1}
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              onUpdatePlayerState?.((prev) => {
                                const currentSlots = prev.streetSlots?.length ? [...prev.streetSlots] : [...INITIAL_STREET_SLOTS];
                                currentSlots[slotIndex] = {
                                  ...currentSlots[slotIndex],
                                  buildingId: null,
                                  level: 0
                                };
                                return {
                                  ...prev,
                                  streetSlots: currentSlots
                                };
                              });
                              playSound.notification();
                              triggerAlert?.(
                                lang === "en"
                                  ? `Demolished ${b.nameEn} successfully.`
                                  : `Edifício ${b.namePt} demolido com sucesso.`,
                                "warn"
                              );
                              setSelectedBuilding(null);
                            }}
                            className="w-full py-1.5 bg-zinc-900 hover:bg-red-900/30 text-zinc-550 hover:text-red-400 border border-zinc-850 rounded hover:border-red-500/20 uppercase transition text-[9px] text-center"
                          >
                            🗑️ {lang === "en" ? "DEMOLISH BUILDING (RESET SLOT)" : "DEMOLIR EDIFÍCIO (LIMPAR TERRENO)"}
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {selectedBuilding === "direct_construct_menu" && (
                  <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                    <div className="flex items-center gap-3 pb-3 border-b border-zinc-900">
                      <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">🏗️</span>
                      <div>
                        <h4 className="text-sm font-extrabold text-amber-500 font-mono tracking-wider uppercase">
                          {lang === "en" ? "CONSTRUCT NEW PROPERTY" : "CONSTRUIR NOVO NEGÓCIO"}
                        </h4>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase">
                          {lang === "en" ? "PLOT EXPANSION + BLUEPRINTS" : "LOTE DE TERRENO ($10K) + PLANTA LIVRE"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#111116] border border-zinc-800 p-3 rounded-xl flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-400 font-extrabold uppercase line-clamp-1 truncate text-left">
                          {lang === "en" ? "NEW PLOT FEE (1 TIME)" : "TAXA DO NOVO TERRENO"}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] font-mono text-rose-400 font-bold tracking-tight uppercase leading-none">
                            💰 -$10,000
                          </span>
                        </div>
                      </div>
                      <Wrench className="w-5 h-5 text-zinc-600" />
                    </div>

                    <div className="space-y-3 pt-1">
                      {Object.values(BUILDINGS).map((b) => {
                        const totalCost = 10000 + b.cost;
                        let canConstruct = player.cash >= totalCost;
                        const isLab = b.id === "laboratory";
                        
                        if (isLab) {
                          if (player.level < 20 || (player.empresarioLvl || 1) < 3) {
                            canConstruct = false;
                          }
                        }

                        let spriteSrc = null;
                        if (b.id === "hotel") spriteSrc = hotelSpriteImage;
                        else if (b.id === "office") spriteSrc = officeSpriteImage;
                        else if (b.id === "club") spriteSrc = clubSpriteImage;
                        else if (b.id === "drink_factory") spriteSrc = drinkFactorySpriteImage;
                        else if (b.id === "drug_factory") spriteSrc = drugFactorySpriteImage;
                        else if (b.id === "car_factory") spriteSrc = carFactorySpriteImage;
                        else if (b.id === "feed_factory") spriteSrc = feedFactorySpriteImage;
                        else if (b.id === "revolver_factory") spriteSrc = revolverFactorySpriteImage;
                        else if (b.id === "laboratory") spriteSrc = laboratorySpriteImage;

                        return (
                          <div
                            key={b.id}
                            className={`bg-zinc-950/60 border ${canConstruct ? "border-zinc-800 hover:border-zinc-700 hover:bg-[#111116]" : "border-zinc-900 border-opacity-50"} p-3 rounded-xl flex flex-col gap-2 relative transition min-h-[105px] overflow-hidden`}
                          >
                            {spriteSrc && (
                              <img src={spriteSrc} alt={b.id} className={`absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none ${canConstruct ? 'opacity-20' : 'opacity-[0.03] grayscale'}`} referrerPolicy="no-referrer" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-transparent pointer-events-none"></div>

                            <div className="flex gap-3 relative z-10 w-full">
                              <span className="text-2xl filter drop-shadow-md select-none">{b.emoji}</span>
                              <div className="flex-1 w-full min-w-0 pr-1">
                                <h5 className={`text-xs font-mono font-bold truncate ${canConstruct ? 'text-zinc-200' : 'text-zinc-600'}`}>
                                  {lang === "en" ? b.nameEn : b.namePt}
                                </h5>
                                <p className={`text-[9px] leading-tight line-clamp-2 ${canConstruct ? 'text-zinc-400' : 'text-zinc-700'}`}>
                                  {lang === "en" ? b.descriptionEn : b.descriptionPt}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-zinc-900/40 pt-2 mt-1 relative z-10 w-full">
                              <div className="flex flex-col">
                                <span className={`text-[10px] font-mono font-bold ${canConstruct ? 'text-emerald-400' : 'text-emerald-900'}`}>
                                  💰 ${totalCost.toLocaleString()}
                                </span>
                                <span className={`text-[8px] font-mono ${canConstruct ? 'text-zinc-500' : 'text-zinc-800'}`}>
                                  ($10k <span className="uppercase">{lang === "en" ? "lot" : "Lote"}</span> + ${b.cost / 1000}k <span className="uppercase">{lang === "en" ? "build" : "Edif"}</span>)
                                </span>
                              </div>

                              {isLab && (player.level < 20 || (player.empresarioLvl || 1) < 3) ? (
                                <span className="text-[8px] font-mono text-rose-500 uppercase font-black tracking-tighter text-right w-24">
                                  {lang === "en" ? "REQ LV 20 & BIZ LV 3" : "NÍVEL 20 & EMPRES 3"}
                                </span>
                              ) : (
                                <button
                                  disabled={!canConstruct}
                                  onClick={() => {
                                    onUpdatePlayerState?.((prev) => {
                                      const currentSlots = prev.streetSlots?.length ? [...prev.streetSlots] : [...INITIAL_STREET_SLOTS];
                                      
                                      // create new slot!
                                      const newSlot = {
                                        id: `slot_${Date.now()}`,
                                        purchased: true,
                                        buildingId: b.id,
                                        level: 1
                                      };
                                      currentSlots.push(newSlot);

                                      return {
                                        ...prev,
                                        cash: Math.max(0, prev.cash - totalCost),
                                        streetSlots: currentSlots,
                                        skillPoints: (prev.skillPoints || 0) + 1
                                      };
                                    });
                                    playSound.cash();
                                    triggerAlert?.(
                                      lang === "en" 
                                        ? `Constructed ${b.nameEn} successfully!` 
                                        : `Instalou ${b.namePt} com sucesso!`,
                                      "success"
                                    );
                                    addGameLog?.(
                                      `Purchased a new lot and erected ${b.nameEn}!`,
                                      `Comprou um novo terreno e construiu ${b.namePt}!`,
                                      "system",
                                      b.emoji
                                    );
                                    setSelectedBuilding(null);
                                  }}
                                  className={`px-3 py-2 rounded text-[10px] font-mono font-black uppercase transition ${
                                    canConstruct
                                      ? "bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/20 active:scale-95"
                                      : "bg-zinc-900 text-zinc-600 border border-zinc-950 cursor-not-allowed"
                                  }`}
                                >
                                  {lang === "en" ? "BUY & BUILD" : "COMPRAR & CONSTRUIR"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedBuilding === "prostitutas" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-zinc-900">
                      <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]">💋</span>
                      <div>
                        <h4 className="text-sm font-extrabold text-pink-500 font-mono tracking-wider">
                          VELVET FOX CABARET
                        </h4>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase">
                          {lang === "en" ? "PROSTITUTES DISTRICT // SECURED CORNER" : "PROSTITUTAS // ÁREA DE LAZER DA RUA"}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                      {lang === "en" 
                        ? "Manage interactions with your cabaret girls. Charge protective fees or offer entertainment services to gain raw cash, respect points, and base power." 
                        : "Gerencie as garotas do Velvet Fox. Divirta-se com os clientes, colete as taxas de segurança e ganhe influência no quarteirão."}
                    </p>

                    <div className="space-y-2 pt-2">
                      {/* Action 1 */}
                      <button 
                        onClick={() => { handleMapAction("prostitutas", "cigarro"); setSelectedBuilding(null); }}
                        className="w-full bg-zinc-900/90 border border-zinc-850 hover:bg-zinc-850 hover:border-zinc-700 hover:border-pink-500/30 p-3 rounded-xl font-mono text-left font-bold transition flex items-center justify-between"
                      >
                        <span className="text-xs text-zinc-200">{lang === "en" ? "Offer Cigarette" : "Oferecer um cigarro"}</span>
                        <span className="text-[10px] text-amber-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900">⚡15 🥋+4</span>
                      </button>
                      {/* Action 2 */}
                      <button 
                        onClick={() => { handleMapAction("prostitutas", "receitas"); setSelectedBuilding(null); }}
                        className="w-full bg-zinc-900/90 border border-zinc-850 hover:bg-zinc-850 hover:border-zinc-700 hover:border-emerald-500/30 p-3 rounded-xl font-mono text-left font-bold transition flex items-center justify-between"
                      >
                        <span className="text-xs text-zinc-200">{lang === "en" ? "Collect Cash Dividends" : "Receber as receitas"}</span>
                        <span className="text-[10px] text-emerald-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900">⚡30 💵+$800</span>
                      </button>
                      {/* Action 3 */}
                      <button 
                        onClick={() => { handleMapAction("prostitutas", "zuar"); setSelectedBuilding(null); }}
                        className="w-full bg-zinc-900/90 border border-zinc-850 hover:bg-zinc-850 hover:border-zinc-700 hover:border-indigo-500/30 p-3 rounded-xl font-mono text-left font-bold transition flex items-center justify-between"
                      >
                        <span className="text-xs text-zinc-200">{lang === "en" ? "Hangout & Talk" : "Zuar com o bando"}</span>
                        <span className="text-[10px] text-indigo-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900">⚡45 ★+35R</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedBuilding === "garagem" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-zinc-900">
                      <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]">🔧</span>
                      <div>
                        <h4 className="text-sm font-extrabold text-blue-400 font-mono tracking-wider">
                          VINNIE'S CUSTOMS
                        </h4>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase">
                          {lang === "en" ? "TUNING GARAGE // RIDE REPAIR DECK" : "GARAGENS // CUSTOMIZAÇÃO & NITRO"}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                      {lang === "en" 
                        ? "Install illicit nitro upgrades in your fleet to secure maximum defense on heist chases, or order meticulous custom polishing for swift street respect." 
                        : "Instale nitro injetado em sua frota de fuga para aumentar a defesa nas perseguições, ou solicite um polimento cromado para moralizar as ruas."}
                    </p>

                    <div className="space-y-2 pt-2">
                      <button 
                        onClick={() => { handleMapAction("garagem", "nitro"); setSelectedBuilding(null); }}
                        className="w-full bg-zinc-900/90 border border-zinc-850 hover:bg-zinc-850 hover:border-zinc-700 hover:border-red-500/30 p-3 rounded-xl font-mono text-left font-bold transition flex items-center justify-between"
                      >
                        <span className="text-xs text-zinc-200">{lang === "en" ? "Install Nitro Fuel" : "Instalar Nitro Turbinado"}</span>
                        <span className="text-[10px] text-red-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900">💵-$1,000 🛡️+4</span>
                      </button>
                      <button 
                        onClick={() => { handleMapAction("garagem", "polir"); setSelectedBuilding(null); }}
                        className="w-full bg-zinc-900/90 border border-zinc-850 hover:bg-zinc-850 hover:border-zinc-700 hover:border-amber-500/30 p-3 rounded-xl font-mono text-left font-bold transition flex items-center justify-between"
                      >
                        <span className="text-xs text-zinc-200">{lang === "en" ? "Mirror Wax Polish" : "Polir lataria cromada"}</span>
                        <span className="text-[10px] text-amber-500 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900">⚡10 ★+15R</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedBuilding === "policia" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-zinc-900">
                      <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]">🚓</span>
                      <div>
                        <h4 className="text-sm font-extrabold text-sky-400 font-mono tracking-wider">
                          PRECINCT 14 STATION
                        </h4>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase">
                          {lang === "en" ? "POLICE HEADQUARTERS // CORRUPTION DECK" : "DELEGACIA // SUBORNO CLANDESTINO"}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                      {lang === "en" 
                        ? "Make tactical pay-offs to grease police palms and reduce heat levels, or boldly challenge active patrol cars to double-down on street respect." 
                        : "Suborne sargentos para amenizar problemas com a lei e diminuir a vigilância, ou desafie as viaturas no braço para dobrar seus lucros."}
                    </p>

                    <div className="space-y-2 pt-2">
                      <button 
                        onClick={() => { handleMapAction("policia", "subornar"); setSelectedBuilding(null); }}
                        className="w-full bg-zinc-900/90 border border-zinc-850 hover:bg-zinc-850 hover:border-zinc-700 hover:border-violet-500/30 p-3 rounded-xl font-mono text-left font-bold transition flex items-center justify-between"
                      >
                        <span className="text-xs text-zinc-200">{lang === "en" ? "Bribe Local Sergeant" : "Subornar Sargento"}</span>
                        <span className="text-[10px] text-violet-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900">💵-$500 🧠+3</span>
                      </button>
                      <button 
                        onClick={() => { handleMapAction("policia", "desafiar"); setSelectedBuilding(null); }}
                        className="w-full bg-zinc-900/90 border border-zinc-850 hover:bg-zinc-850 hover:border-zinc-700 hover:border-sky-500/30 p-3 rounded-xl font-mono text-left font-bold transition flex items-center justify-between"
                      >
                        <span className="text-xs text-zinc-200">{lang === "en" ? "Challenge Chase Cruiser" : "Desafiar viatura de choque"}</span>
                        <span className="text-[10px] text-sky-450 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900">⚡25 ★+45R</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedBuilding === "cassino" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-zinc-900">
                      <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">🎰</span>
                      <div>
                        <h4 className="text-sm font-extrabold text-amber-500 font-mono tracking-wider">
                          LAS VEGAS UNDERWORLD
                        </h4>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase">
                          {lang === "en" ? "CLANDESTINE CASINO // BET & SPIN" : "CASSINO LAS VEGAS CLANDESTINO"}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                      {lang === "en" 
                        ? "A place of high stakes where luck is tested. Bet $200 for a chance to sweep clean with a $1,000 cash payout." 
                        : "O antro da jogatina criminosa. Coloque $200 fichas na roleta clandestina por uma chance de sair limpo com $1.000 em espécie."}
                    </p>

                    <div className="space-y-2 pt-2">
                       <button 
                        onClick={() => { handleMapAction("cassino", "girar"); setSelectedBuilding(null); }}
                        className="w-full bg-zinc-900/90 border border-zinc-850 hover:bg-zinc-850 hover:border-zinc-700 hover:border-amber-500/35 p-4 rounded-xl font-mono text-left font-bold transition flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs text-zinc-200 font-bold">{lang === "en" ? "Spin Lucky Roulette" : "Girar Roleta da sorte"}</p>
                          <p className="text-[9px] text-zinc-500 font-sans font-normal mt-0.5">{lang === "en" ? "Payout up to $1,000 cash!" : "Multiplique faturando até $1.000!"}</p>
                        </div>
                        <span className="text-[10px] text-emerald-450 bg-zinc-950 px-2.5 py-1.5 rounded border border-zinc-900 font-bold uppercase font-mono tracking-wider">💵-$200 BET</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedBuilding === "for_sale_1" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-zinc-900">
                      <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">🚧</span>
                      <div>
                        <h4 className="text-sm font-extrabold text-orange-500 font-mono tracking-wider">
                          REAL ESTATE SECTOR A
                        </h4>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase">
                          {lang === "en" ? "VACANT PLOT // PROPERTY MARKET" : "TERRENO DISPONÍVEL DA RUA"}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                      {lang === "en" 
                        ? "Unlock active hourly revenues! Build high-density Guild safehouses on this vacant block to secure safe havens." 
                        : "Garanta uma renda por hora fixa! Edifique o Edifício Residencial da Guild neste quarteirão disponível para gerar lucros automáticos."}
                    </p>

                    <div className="space-y-2 pt-2">
                      <button 
                        onClick={() => { handleMapAction("comprar_for_sale_1", ""); setSelectedBuilding(null); }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs p-3.5 rounded-xl transition flex items-center justify-between"
                      >
                        <span>🏢 {lang === "en" ? "BUY & ERECT RESIDENTIAL SUITE" : "COMPRAR EDIFÍCIO DA GUILD"}</span>
                        <span className="bg-emerald-950 px-2.5 py-1 text-[10px] rounded border border-emerald-500/20">💵 -$8,000 CASH (+$120 hr)</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedBuilding === "for_sale_2" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-zinc-900">
                      <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">🚧</span>
                      <div>
                        <h4 className="text-sm font-extrabold text-orange-400 font-mono tracking-wider">
                          CLANDESTINE LAB PLOT
                        </h4>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase">
                          {lang === "en" ? "UNREGULATED SITE // DRUG GREENHOUSE" : "GALPÃO COM ACESSO CLANDESTINO"}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                      {lang === "en" 
                        ? "Establish a clandestine hydroponic greenhouse producing prime weed blocks. This investment secures massive financial passive flow." 
                        : "Monte uma estufa hidropônica ilegal produzindo fardos de maconha de qualidade. Este empreendimento garante altíssimos retornos passivos."}
                    </p>

                    <div className="space-y-2 pt-2">
                      <button 
                        onClick={() => { handleMapAction("comprar_for_sale_2", ""); setSelectedBuilding(null); }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs p-3.5 rounded-xl transition flex items-center justify-between"
                      >
                        <span>🌿 {lang === "en" ? "ESTABLISH CANNABIS GREENHOUSE LAB" : "MONTAR ESTUFA DE MACONHA"}</span>
                        <span className="bg-emerald-950 px-2.5 py-1 text-[10px] rounded border border-emerald-500/20">💵 -$32,000 CASH (+$650 hr)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Secure Territory Fallback (Safehouse / Weed owned) */}
                {(selectedBuilding === "safehouse_owned" || selectedBuilding === "weed_owned" || selectedBuilding === "owned_territory") && (
                  <div className="space-y-4 text-center py-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-2 animate-bounce">
                      <Sparkles className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h4 className="text-sm font-extrabold text-emerald-400 font-mono tracking-wider">
                      {lang === "en" ? "TERRITORY SECURED!" : "TERRITÓRIO CONQUISTADO!"}
                    </h4>
                    <p className="text-xs font-mono text-zinc-400 leading-relaxed max-w-sm mx-auto">
                      {lang === "en" 
                        ? "This property is fully under your control and generates passive rents directly to your pocket. No additional security measures are needed here." 
                        : "Esta propriedade está totalmente sob seu controle e gera rendimentos passivos automáticos para seu bolso a cada viagem pela cidade."}
                    </p>
                    <button 
                      onClick={() => setSelectedBuilding(null)}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono font-bold text-xs p-3 rounded-xl border border-zinc-800 transition"
                    >
                      {lang === "en" ? "UNDERSTOOD" : "ENTENDIDO"}
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}