import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PlayerState, GameItem, SHOP_ITEMS, VIP_COMPANIONS, VIPCompanion, getDynamicItemProps, getDynamicPetProps, getDynamicVIPProps } from "../types";
import { playSound } from "./AudioEngine";
import { Shield, ShoppingBag, Sword, Car, Landmark, Heart, ShieldAlert, CheckCircle, Flame, PlusCircle, Power, Flame as Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Companions from "./Companions";

import storeWeaponsSpriteImage from "../assets/images/store_weapons_1782178131711.jpg";
import storeVehiclesSpriteImage from "../assets/images/store_vehicles_1782178142616.jpg";
import storePetsSpriteImage from "../assets/images/store_pets_1782178155776.jpg";
import vipCompanionsSpriteImage from "../assets/images/vip_companions_1782178193765.jpg";

import weaponMeleeSpriteImage from "../assets/images/weapon_melee_sprite_1782179435907.jpg";
import weaponHandgunSpriteImage from "../assets/images/weapon_handgun_sprite_1782179447446.jpg";
import weaponRifleSpriteImage from "../assets/images/weapon_rifle_sprite_1782179457687.jpg";
import weaponHeavySpriteImage from "../assets/images/weapon_heavy_sprite_1782179468167.jpg";

import vehicleCarSpriteImage from "../assets/images/vehicle_car_sprite_1782179493145.jpg";
import vehicleArmoredSpriteImage from "../assets/images/vehicle_armored_sprite_1782179502238.jpg";
import vehicleAirSpriteImage from "../assets/images/vehicle_air_sprite_1782179516252.jpg";

import petDogSpriteImage from "../assets/images/pet_dog_sprite_1782179527026.jpg";
import petReptileSpriteImage from "../assets/images/pet_reptile_sprite_1782179545676.jpg";

const getWeaponImage = (id: string) => {
  if (['brass_knuckles', 'heavy_baton', 'katana'].includes(id)) return weaponMeleeSpriteImage;
  if (['revolver', 'desert_eagle', 'dual_smgs'].includes(id)) return weaponHandgunSpriteImage;
  if (['shotgun', 'ar15_carbine', 'ak47', 'm249_saw'].includes(id)) return weaponRifleSpriteImage;
  if (['rocket_launcher', 'sniper_rifle', 'gatling_minigun'].includes(id)) return weaponHeavySpriteImage;
  return null;
};

const getVehicleImage = (id: string) => {
  if (['heavy_helicopter', 'stealth_private_jet'].includes(id)) return vehicleAirSpriteImage;
  if (['armored_pickup', 'armored_suv', 'bulletproof_limo', 'armored_apc'].includes(id)) return vehicleArmoredSpriteImage;
  return vehicleCarSpriteImage;
};

const getPetImage = (id: string) => {
  if (['crimson_dragon'].includes(id)) return petReptileSpriteImage;
  return petDogSpriteImage;
};

interface ArsenalProps {
  player: PlayerState;
  onBuyItem: (item: GameItem) => void;
  onToggleWeapon: (itemId: string) => void;
  onToggleVehicle: (itemId: string) => void;
  onHospitalRecovery: (cost: number) => void;
  onBribePolice?: (cost: number, heatCleared: number) => void;
  onBuyPet: (petId: string, cost: number) => void;
  onLevelUpPet: (petId: string, cost: number) => void;
  onToggleActivePet: (petId: string) => void;
  onHireVIPCompanion?: (id: string, cost: number, healthPercentBonus: number, energyPercentBonus: number) => void;
  lang: "en" | "pt";
  activeSubTab?: "equipment" | "empire" | "hospital" | "pets" | "vip_lounge" | "precinct";
  onSubTabChange?: (tab: "equipment" | "empire" | "hospital" | "pets" | "vip_lounge" | "precinct") => void;
}

export default function Arsenal({ 
  player, 
  onBuyItem, 
  onToggleWeapon, 
  onToggleVehicle, 
  onHospitalRecovery, 
  onBribePolice,
  onBuyPet,
  onLevelUpPet,
  onToggleActivePet,
  onHireVIPCompanion,
  lang,
  activeSubTab,
  onSubTabChange
}: ArsenalProps) {
  const [activeTab, setActiveTab] = useState<"equipment" | "empire" | "hospital" | "pets" | "vip_lounge" | "precinct">(activeSubTab || "equipment");
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);
  const [isWeaponsExpanded, setIsWeaponsExpanded] = useState(true);
  const [isVehiclesExpanded, setIsVehiclesExpanded] = useState(true);

  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedItem]);

  const getItemEmoji = (id: string, type: string) => {
    const found = SHOP_ITEMS.find((item) => item.id === id);
    if (found?.emoji) return found.emoji;

    if (type === "weapon") {
      switch (id) {
        case "brass_knuckles": return "👊";
        case "heavy_baton": return "🪵";
        case "revolver": return "🔫";
        case "shotgun": return "💥";
        case "katana": return "⚔️";
        case "ak47": return "🔫";
        case "dual_smgs": return "🔥";
        case "rocket_launcher": return "🚀";
        case "sniper_rifle": return "🎯";
        case "desert_eagle": return "🔱";
        case "ar15_carbine": return "🎖️";
        case "m249_saw": return "💣";
        case "gatling_minigun": return "⚡";
        default: return "🔫";
      }
    } else if (type === "vehicle") {
      switch (id) {
        case "cheap_sedan": return "🚗";
        case "custom_chopper": return "🏍️";
        case "muscle_car": return "🏎️";
        case "armored_pickup": return "🛻";
        case "armored_suv": return "🚙";
        case "heavy_helicopter": return "🚁";
        case "armored_apc": return "🛡️";
        case "lowrider_hydraulics": return "🕺";
        case "supercar_f90": return "⚡";
        default: return "🚗";
      }
    }
    return "📦";
  };

  React.useEffect(() => {
    if (activeSubTab) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabClick = (tab: "equipment" | "empire" | "hospital" | "pets" | "vip_lounge" | "precinct") => {
    playSound.notification();
    setActiveTab(tab);
    onSubTabChange?.(tab);
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  const weapons = SHOP_ITEMS.filter((i) => i.type === "weapon");
  const vehicles = SHOP_ITEMS.filter((i) => i.type === "vehicle");
  const realEstates = SHOP_ITEMS.filter((i) => i.type === "realestate");

  const hospitalCost = player.level * 180 + 300;

  const handleHospitalRecover = () => {
    if (player.cash < hospitalCost) return;
    onHospitalRecovery(hospitalCost);
    playSound.cash();
  };

  return (
    <div className="industrial-panel p-6 shadow-xl" id="arsenal-tab">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <ShoppingBag className="w-5.5 h-5.5 text-red-500 animate-pulse" />
            {lang === "en" ? "Black Market Armory & Real Estate" : "Armaria de Elite & Propriedades"}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {lang === "en"
              ? "Procure lethal firearms to defeat syndicate hitmen, acquire high passive assets, or consult back-alley surgeons."
              : "Adquira armaria tática letal, possua propriedades de alto retorno passivo ou consulte médicos clandestinos."}
          </p>
        </div>

        {/* Tab control triggers */}
        <div className="flex overflow-x-auto no-scrollbar bg-neutral-950 p-1 rounded-xl border border-neutral-800 max-w-full gap-1 select-none w-full md:w-auto">
          <button 
            onClick={() => handleTabClick("equipment")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 whitespace-nowrap ${activeTab === "equipment" ? "bg-red-600 text-white shadow" : "text-neutral-400 hover:text-neutral-200"}`}
          >
            🔫 {lang === "en" ? "GEAR SHOP" : "ARMÁRIO E VEÍCULOS"}
          </button>
          <button 
            onClick={() => handleTabClick("pets")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 whitespace-nowrap ${activeTab === "pets" ? "bg-red-600 text-white shadow" : "text-neutral-400 hover:text-neutral-200"}`}
          >
            🐾 {lang === "en" ? "COMPANIONS" : "MASCOTES"}
          </button>
          <button 
            onClick={() => handleTabClick("vip_lounge")}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 whitespace-nowrap ${activeTab === "vip_lounge" ? "bg-rose-600 text-white shadow" : "text-neutral-400 hover:text-neutral-200"}`}
          >
            💃 {lang === "en" ? "VIP LOUNGE" : "ÁREA VIP"}
          </button>
        </div>
      </div>

      {/* Hospital / Clinic */}
      {false && (() => {
        return (
          <div className="max-w-xl mx-auto pt-4 font-sans space-y-6">
            {/* Clandestine surgeon card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 text-center space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500/50 text-red-500 flex items-center justify-center text-3xl mx-auto animate-pulse select-none">
                  🩺
                </div>

                <div className="space-y-1 font-sans">
                  <h3 className="text-base font-bold text-neutral-100 uppercase tracking-wide">
                    {lang === "en" ? "Swiss Clandestine Surgeon" : "Clínica Geral Clandestina"}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-normal max-w-sm mx-auto">
                    {lang === "en"
                      ? "Underground clinic treatments fully restore health capacity."
                      : "Procedimentos cirúrgicos imediatos para restaurar sua saúde integralmente aos 100% de capacidade total."}
                  </p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex justify-around text-xs font-mono uppercase text-neutral-400">
                  <div>
                    <p className="text-[10px] text-neutral-500">{lang === "en" ? "Health" : "Saúde"}</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{player.health}%</p>
                  </div>
                  <div className="border-r border-neutral-800" />
                  <div>
                    <p className="text-[10px] text-neutral-500">{lang === "en" ? "Surgeon Fee" : "Cirurgião"}</p>
                    <p className="text-sm font-bold text-neutral-200 mt-0.5">{formatMoney(hospitalCost)}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleHospitalRecover}
                disabled={player.cash < hospitalCost || player.health === player.maxHealth}
                className={`w-full bg-red-650 bg-red-600 hover:bg-red-500 text-white font-mono font-bold py-3 rounded-xl text-xs uppercase transition shadow-lg shadow-red-950/25 disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {player.cash < hospitalCost 
                  ? (lang === "en" ? "INSUFFICIENT FUNDS" : "SALDO INSUFICIENTE") 
                  : player.health === player.maxHealth 
                    ? (lang === "en" ? "HEALTH AT 100%" : "SAÚDE EM 100%")
                    : (lang === "en" ? `PURCHASE HEALTH TREATMENT` : `CONTRATAR TRATAMENTO`)}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Police Precinct Bribe Liaison */}
      {false && (() => {
        const bribeCost = player.level * 240 + 600;
        const currentHeat = player.heat ?? 0;
        const hasBribableHeat = currentHeat > 0;

        return (
          <div className="max-w-xl mx-auto pt-4 font-sans space-y-6">
            {/* Police Precinct Bribe Liaison card */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 text-center space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-955 bg-blue-950/40 border border-blue-500/50 text-blue-400 flex items-center justify-center text-3xl mx-auto select-none">
                  🚨
                </div>

                <div className="space-y-1 font-sans">
                  <h3 className="text-base font-bold text-neutral-100 uppercase tracking-wide">
                    {lang === "en" ? "Lafayette Precinct Bribe Liaison" : "Acordos e Subornos na Delegacia"}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-normal max-w-sm mx-auto">
                    {lang === "en"
                      ? "Grease the local captain's palms. Purging reports reduces active Heat Wanted level by 40% immediately."
                      : "Molhe a mão das autoridades locais. Pague tarifas clandestinas para eliminar arquivos e reduzir nível de procurado em 40%."}
                  </p>
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex justify-around text-xs font-mono uppercase text-neutral-400">
                  <div>
                    <p className="text-[10px] text-neutral-500">{lang === "en" ? "Wanted Level" : "Procurado (Heat)"}</p>
                    <p className={`text-sm font-bold mt-0.5 ${currentHeat > 50 ? "text-red-500 animate-pulse font-extrabold" : currentHeat > 0 ? "text-amber-500" : "text-zinc-500"}`}>{currentHeat}%</p>
                  </div>
                  <div className="border-r border-neutral-800" />
                  <div>
                    <p className="text-[10px] text-neutral-500">{lang === "en" ? "Heat Erased" : "Corte de Heat"}</p>
                    <p className="text-sm font-bold text-blue-400 mt-0.5">-40%</p>
                  </div>
                  <div className="border-r border-neutral-800" />
                  <div>
                    <p className="text-[10px] text-neutral-500">{lang === "en" ? "Bribe Rate" : "Propina"}</p>
                    <p className="text-sm font-bold text-neutral-200 mt-0.5">{formatMoney(bribeCost)}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => onBribePolice?.(bribeCost, 40)}
                disabled={player.cash < bribeCost || !hasBribableHeat}
                className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold py-3 rounded-xl text-xs uppercase transition shadow-lg shadow-blue-955 shadow-blue-950/25 disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {player.cash < bribeCost 
                  ? (lang === "en" ? "INSUFFICIENT FUNDS" : "SALDO INSUFICIENTE") 
                  : !hasBribableHeat 
                    ? (lang === "en" ? "CLEAN CRIMINAL RECORDS" : "FICHA TOTALMENTE LIMPA")
                    : (lang === "en" ? `PURCHASE PRECINCT PURGE` : `EFETUAR SUBORNO`)}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Equipment Weapon / Vehicle */}
      {activeTab === "equipment" && (
        <div className="space-y-12 select-none pt-4">
          {/* Weapons Section */}
          <div className="space-y-4">
            <div className="w-full h-32 md:h-48 relative rounded-2xl overflow-hidden shadow-lg border border-neutral-800 mb-6 flex items-end">
              <img src={storeWeaponsSpriteImage} alt="Weapons Store" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
              <h3 className="relative z-10 p-4 text-xl font-bold text-red-500 uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
                <Sword className="w-6 h-6 text-red-500" />
                {lang === "en" ? "FIREARMS OUTLET" : "ARSENAL DE ARMAMENTO CLANDESTINO"}
              </h3>
            </div>
            
            <h3 
              onClick={() => { playSound.notification(); setIsWeaponsExpanded(!isWeaponsExpanded); }}
              className="text-xs font-mono uppercase tracking-wider text-red-500 flex items-center justify-between border-b border-neutral-800 pb-2 cursor-pointer hover:bg-neutral-900/50 p-1.5 -ml-1.5 rounded transition"
            >
              <div className="flex items-center gap-1.5">
                <Sword className="w-4 h-4" />
                {lang === "en" ? "Inventory Toggle" : "Expandir / Recolher Catálogo"}
              </div>
              <span className="text-[10px] text-neutral-500">{isWeaponsExpanded ? "▲" : "▼"}</span>
            </h3>

            {isWeaponsExpanded && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {weapons.map((w) => {
                const isOwned = player.weapons.includes(w.id);
                const isActive = player.activeWeapon === w.id;
                const { cost: dynamicCost, minLevel: minLvl, markupPercent } = getDynamicItemProps(w, player);
                const hasLevel = player.level >= minLvl;
                const canAfford = player.cash >= dynamicCost;
                const isPurchasable = hasLevel && canAfford;
                const itemEmoji = getItemEmoji(w.id, "weapon");
                const bgImage = getWeaponImage(w.id);

                return (
                  <div 
                    key={w.id} 
                    onClick={() => {
                      playSound.notification();
                      setSelectedItem(w);
                    }}
                    className={`p-3.5 rounded-xl border relative transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col justify-between h-full group bg-[#070709]/90 shadow-md overflow-hidden ${
                      isActive 
                        ? "border-red-600 bg-red-955/10 shadow-[inset_0_1px_1px_rgba(239,68,68,0.05)]" 
                        : !hasLevel && !isOwned
                        ? "border-neutral-950 opacity-45 cursor-not-allowed"
                        : "border-zinc-900 hover:border-zinc-700 hover:bg-[#0c0c0f]"
                    }`}
                    id={`weapon-card-${w.id}`}
                  >
                    {bgImage && (
                      <>
                        <img src={bgImage} alt={w.id} className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen pointer-events-none" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none"></div>
                      </>
                    )}

                    <div className="relative z-10">
                      {/* Top row of Mosaic Weapon Cargo */}
                      <div className="flex items-start gap-2.5 mb-2.5">
                        <span className="text-2xl pt-0.5 filter drop-shadow group-hover:scale-110 transition-transform duration-300">
                          {itemEmoji}
                        </span>
                        <div className="truncate min-w-0 font-sans">
                          <h4 className="font-sans font-black text-xs text-zinc-100 group-hover:text-amber-400 transition-colors truncate leading-tight">
                            {lang === "en" ? w.nameEn : w.namePt}
                          </h4>
                          
                          {isActive ? (
                            <span className="inline-block mt-1 text-[7.5px] font-mono font-black px-1.5 py-0.5 rounded leading-none bg-red-955/45 text-red-400 border border-red-900/30 font-extrabold max-w-full truncate">
                              {lang === "en" ? "ACTIVE" : "ATIVO"}
                            </span>
                          ) : isOwned ? (
                            <span className="inline-block mt-1 text-[7.5px] font-mono font-black px-1.5 py-0.5 rounded leading-none bg-zinc-800 text-yellow-500 border border-zinc-750 font-extrabold max-w-full truncate">
                              {lang === "en" ? "OWNED" : "ADQUIRIDO"}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1 mt-1 flex-wrap select-none">
                              <span className="inline-block text-[7px] font-mono font-bold px-1.5 py-0.5 rounded leading-none bg-zinc-950 text-zinc-650">
                                {lang === "en" ? "NOT OWNED" : "RESERVA"}
                              </span>
                              {markupPercent !== 0 && (
                                <span className={`inline-block text-[6.5px] font-mono font-black px-1 rounded leading-none ${markupPercent > 0 ? "bg-[#ef4444]/13 text-[#ef4444]" : "bg-[#10b981]/13 text-[#10b981]"}`}>
                                  {markupPercent > 0 ? `▲ +${markupPercent}%` : `▼ ${markupPercent}%`}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[9px] text-[#888] font-mono line-clamp-2 h-6 overflow-hidden leading-tight normal-case pr-1.5">
                        {lang === "en" ? w.descriptionEn : w.descriptionPt}
                      </p>
                    </div>

                    {/* Pricing Matrix */}
                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-center justify-between text-[7.5px] font-mono font-extrabold select-none">
                        {isActive ? (
                          <span className="text-red-400 uppercase tracking-tight flex items-center gap-0.5 animate-pulse">
                            ⚔️ {lang === "en" ? "EQUIPPED" : "EQUIPADO"}
                          </span>
                        ) : isOwned ? (
                          <span className="text-amber-400 uppercase tracking-tight flex items-center gap-0.5">
                            ⚙️ {lang === "en" ? "READY" : "NA MALA"}
                          </span>
                        ) : !hasLevel ? (
                          <span className="text-amber-500 font-bold animate-pulse">
                            🔒 LVL {minLvl}
                          </span>
                        ) : (
                          <span className="text-emerald-400 uppercase tracking-tight">
                            💵 {lang === "en" ? "AVAILABLE" : "DISPONÍVEL"}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-zinc-900/40 pt-2 text-zinc-400">
                        <div>
                          <span className="text-[7.5px] text-zinc-500 block font-bold uppercase leading-none mb-0.5">
                            {lang === "en" ? "BONUS" : "COMBATE"}
                          </span>
                          <span className="text-red-400 font-bold leading-none block">
                            +{w.bonusStrength} ATK
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[7.5px] text-zinc-550 block font-bold uppercase leading-none mb-0.5">
                            {lang === "en" ? "COST" : "PREÇO"}
                          </span>
                          <span className="font-black text-zinc-200 leading-none block">
                            {formatMoney(dynamicCost)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 select-none">
                        <div className="w-full py-0.5 text-center font-mono text-[7.5px] text-zinc-650 group-hover:text-amber-400 group-hover:border-amber-400/30 border border-zinc-900/10 rounded transition duration-200 bg-zinc-950/80 backdrop-blur-[2px]">
                          {isOwned ? (lang === "en" ? "⚡ TAP TO EQUIP" : "⚡ CLIQUE EQUIPAR") : (lang === "en" ? "⚡ TAP BUY" : "⚡ ADQUIRIR")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>

          {/* Vehicles Section */}
          <div className="space-y-4 pt-10">
            <div className="w-full h-32 md:h-48 relative rounded-2xl overflow-hidden shadow-lg border border-neutral-800 mb-6 flex items-end">
              <img src={storeVehiclesSpriteImage} alt="Vehicles Dealership" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
              <h3 className="relative z-10 p-4 text-xl font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
                <Car className="w-6 h-6 text-blue-400" />
                {lang === "en" ? "SPORTS CAR DEALERSHIP" : "CONCESSIONÁRIA ILÍCITA"}
              </h3>
            </div>
          
            <h3 
              onClick={() => { playSound.notification(); setIsVehiclesExpanded(!isVehiclesExpanded); }}
              className="text-xs font-mono uppercase tracking-wider text-blue-400 flex items-center justify-between border-b border-neutral-800 pb-2 cursor-pointer hover:bg-neutral-900/50 p-1.5 -ml-1.5 rounded transition"
            >
              <div className="flex items-center gap-1.5">
                <Car className="w-4 h-4" />
                {lang === "en" ? "Underworld Cruisers and Vehicles" : "Veículos de Fuga e Carros Blindados"}
              </div>
              <span className="text-[10px] text-neutral-500">{isVehiclesExpanded ? "▲" : "▼"}</span>
            </h3>

            {isVehiclesExpanded && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {vehicles.map((v) => {
                const isOwned = player.vehicles.includes(v.id);
                const isActive = player.activeVehicle === v.id;
                const { cost: dynamicCost, minLevel: minLvl, markupPercent } = getDynamicItemProps(v, player);
                const hasLevel = player.level >= minLvl;
                const canAfford = player.cash >= dynamicCost;
                const isPurchasable = hasLevel && canAfford;
                const itemEmoji = getItemEmoji(v.id, "vehicle");
                const bgImage = getVehicleImage(v.id);

                return (
                  <div 
                    key={v.id} 
                    onClick={() => {
                      playSound.notification();
                      setSelectedItem(v);
                    }}
                    className={`p-3.5 rounded-xl border relative transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col justify-between h-full group bg-[#070709]/90 shadow-md overflow-hidden ${
                      isActive 
                        ? "border-blue-500 bg-blue-950/5" 
                        : !hasLevel && !isOwned
                        ? "border-neutral-950 opacity-45 cursor-not-allowed"
                        : "border-neutral-800 group hover:border-neutral-700"
                    }`}
                  >
                    {bgImage && (
                      <>
                        <img src={bgImage} alt={v.id} className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen pointer-events-none" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none"></div>
                      </>
                    )}

                    <div className="relative z-10">
                      {/* Top row of Mosaic Vehicle Cargo */}
                      <div className="flex items-start gap-2.5 mb-2.5">
                        <span className="text-2xl pt-0.5 filter drop-shadow group-hover:scale-110 transition-transform duration-300">
                          {itemEmoji}
                        </span>
                        <div className="truncate min-w-0 font-sans">
                          <h4 className="font-sans font-black text-xs text-zinc-100 group-hover:text-blue-400 transition-colors truncate leading-tight">
                            {lang === "en" ? v.nameEn : v.namePt}
                          </h4>
                          
                          {isActive ? (
                            <span className="inline-block mt-0.5 text-[7.5px] font-mono font-black px-1.5 py-0.5 rounded leading-none bg-blue-955/40 text-blue-400 border border-blue-900/30 font-extrabold max-w-full truncate">
                              {lang === "en" ? "ACTIVE" : "ATIVO"}
                            </span>
                          ) : isOwned ? (
                            <span className="inline-block mt-0.5 text-[7.5px] font-mono font-black px-1.5 py-0.5 rounded leading-none bg-zinc-800 text-yellow-500 border border-zinc-750 font-extrabold max-w-full truncate">
                              {lang === "en" ? "OWNED" : "ADQUIRIDO"}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1 mt-0.5 flex-wrap select-none">
                              <span className="inline-block text-[7px] font-mono font-bold px-1.5 py-0.5 rounded leading-none bg-zinc-950 text-zinc-650">
                                {lang === "en" ? "NOT OWNED" : "GARAGEM"}
                              </span>
                              {markupPercent !== 0 && (
                                <span className={`inline-block text-[6.5px] font-mono font-black px-1 rounded leading-none ${markupPercent > 0 ? "bg-[#ef4444]/13 text-[#ef4444]" : "bg-[#10b981]/13 text-[#10b981]"}`}>
                                  {markupPercent > 0 ? `▲ +${markupPercent}%` : `▼ ${markupPercent}%`}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[9px] text-[#888] font-mono line-clamp-2 h-6 overflow-hidden leading-tight normal-case pr-1.5">
                        {lang === "en" ? v.descriptionEn : v.descriptionPt}
                      </p>
                    </div>

                    <div className="mt-3.5 space-y-2">
                      <div className="flex items-center justify-between text-[7.5px] font-mono font-extrabold select-none">
                        {isActive ? (
                          <span className="text-blue-400 uppercase tracking-tight flex items-center gap-0.5 animate-pulse">
                            🛡️ {lang === "en" ? "PILOTING" : "PILOTANDO"}
                          </span>
                        ) : isOwned ? (
                          <span className="text-amber-400 uppercase tracking-tight flex items-center gap-0.5">
                            ⚙️ {lang === "en" ? "READY" : "STATION"}
                          </span>
                        ) : !hasLevel ? (
                          <span className="text-amber-500 font-bold animate-pulse">
                            🔒 LVL {minLvl}
                          </span>
                        ) : (
                          <span className="text-emerald-400 uppercase tracking-tight">
                            💵 {lang === "en" ? "AVAILABLE" : "DISPONÍVEL"}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-zinc-900/40 pt-2 text-zinc-400">
                        <div>
                          <span className="text-[7.5px] text-zinc-500 block font-bold uppercase leading-none mb-0.5">
                            {lang === "en" ? "SHIELD" : "ARMADURA"}
                          </span>
                          <span className="text-blue-400 font-bold leading-none block">
                            +{v.bonusDefense} DEF
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[7.5px] text-[#777] block font-bold uppercase leading-none mb-0.5">
                            {lang === "en" ? "COST" : "PREÇO"}
                          </span>
                          <span className="font-black text-zinc-200 leading-none block">
                            {formatMoney(dynamicCost)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 select-none">
                        <div className="w-full py-0.5 text-center font-mono text-[7.5px] text-zinc-650 group-hover:text-blue-400 group-hover:border-blue-400/30 border border-zinc-900/10 rounded transition duration-200 bg-zinc-950/80 backdrop-blur-[2px]">
                          {isOwned ? (lang === "en" ? "⚡ TAP TO PILOT" : "⚡ PILOTAR") : (lang === "en" ? "⚡ TAP BUY" : "⚡ ADQUIRIR")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </div>
      )}

      {/* Empire Properties (Income) */}
      {false && (
        <div className="space-y-6 pt-4 font-sans select-none">
          <div className="bg-emerald-950/10 border border-emerald-950 text-emerald-300 text-xs p-3 rounded flex gap-2">
            <span className="mt-0.5">🏬</span>
            <p className="leading-relaxed font-mono text-[11px]">
              <strong>{lang === "en" ? "EMPIRE ADVISORY:" : "CONSELHO MONETÁRIO:"}</strong>{" "}
              {lang === "en"
                ? "Real estate properties generate guaranteed passive cash income. Income is deposited automatically inside your Swiss hands every time you travel boroughs!"
                : "Propriedades fornecem grana passiva programada. Os retornos são adicionados automaticamente em suas mãos toda vez que pegar trânsito e viajar!"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {realEstates.map((prop) => {
              const isOwned = player.realEstate.includes(prop.id);
              const minLvl = prop.minLevel || 1;
              const hasLevel = player.level >= minLvl;
              const canAfford = player.cash >= prop.cost;
              const isPurchasable = hasLevel && canAfford;

              return (
                <div 
                  key={prop.id} 
                  className={`bg-neutral-950 border p-5 rounded-lg flex justify-between items-center gap-4 transition-all ${
                    isOwned 
                      ? "border-emerald-600 bg-emerald-950/5" 
                      : !hasLevel
                      ? "border-neutral-950 opacity-45 cursor-not-allowed"
                      : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <div className="space-y-1.5 flex-1 select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-base select-none shrink-0">{prop.emoji || "🏢"}</span>
                      <span className="text-sm font-bold text-neutral-100 font-sans">
                        {lang === "en" ? prop.nameEn : prop.namePt}
                      </span>
                      {isOwned && (
                        <span className="text-[9px] bg-emerald-600 text-white font-mono px-2 py-0.5 rounded font-bold uppercase">
                          {lang === "en" ? "GENERATING FUND" : "GERANDO RENDA"}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-normal">
                      {lang === "en" ? prop.descriptionEn : prop.descriptionPt}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono uppercase text-emerald-400 pt-1">
                      <span>💰 {formatMoney(prop.cost)}</span>
                      <span className="text-emerald-500 font-bold">📈 +{formatMoney(prop.passiveIncome || 0)} / TRAVEL TICK</span>
                      {!isOwned && minLvl > 1 && (
                        <span className={hasLevel ? "text-neutral-500" : "text-amber-500 font-bold animate-pulse"}>
                          🔒 Lvl {minLvl}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {isOwned ? (
                      <span className="text-emerald-500 text-2xl font-mono">
                        ✔️
                      </span>
                    ) : (
                      <button 
                        onClick={() => onBuyItem(prop)}
                        disabled={!isPurchasable}
                        className={`px-3 py-2 rounded text-xs font-mono font-bold uppercase transition shadow whitespace-nowrap min-w-[70px] ${isPurchasable ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer" : "bg-neutral-850 text-neutral-600 cursor-not-allowed border border-neutral-900"}`}
                      >
                        {!hasLevel ? (lang === "en" ? `LVL ${minLvl}` : `NÍV ${minLvl}`) : (lang === "en" ? "ACQUIRE" : "ADQUIRIR")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "pets" && (
        <Companions
          player={player}
          onBuyPet={onBuyPet}
          onLevelUpPet={onLevelUpPet}
          onToggleActivePet={onToggleActivePet}
          lang={lang}
        />
      )}

      {activeTab === "vip_lounge" && (
        <div className="space-y-6 pt-4 font-sans select-none">
          <div className="w-full h-32 md:h-48 relative rounded-2xl overflow-hidden shadow-lg border border-neutral-800 flex items-end">
            <img src={vipCompanionsSpriteImage} alt="VIP Lounge" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
            <h3 className="relative z-10 p-4 text-xl font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
              <span className="text-xl mt-0.5 font-emoji">🥂</span>
              {lang === "en" ? "RED LIGHT VIP LOUNGE" : "LOBBY EXCLUSIVO - CLUBE DE LUXO"}
            </h3>
          </div>
          
          <div className="bg-rose-950/10 border border-rose-950/40 text-rose-300 text-xs p-4 rounded-2xl flex gap-3.5">
            <div className="space-y-1">
              <p className="leading-relaxed text-neutral-400 text-xs">
                {lang === "en"
                  ? "Indulge in premium high-roller companionship. Elite models and hostesses provide instant body and mental sanctuary, restoring high portions of active HP and vital Energy. Requires character level to access VIP suites."
                  : "Desfrute de momentos exclusivos com as anfitriãs mais cobiçadas da cidade. Obtenha restauração corporal imediata de saúde e energia vital para enfrentar os desafios do submundo. Nível exigido para acessar áreas privadas."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VIP_COMPANIONS.map((comp) => {
              const { cost: dynamicCost, minLevel, markupPercent } = getDynamicVIPProps(comp, player);
              const hasLevel = player.level >= (minLevel || comp.minLevel);
              const canAfford = player.cash >= dynamicCost;
              const isAvailable = hasLevel;

              return (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-zinc-950 border p-5 rounded-3xl flex flex-col justify-between gap-4 transition-all relative overflow-hidden group ${
                    !hasLevel
                      ? "border-neutral-950 opacity-40 cursor-not-allowed"
                      : "border-neutral-850 hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(244,63,94,0.1)] group"
                  }`}
                >
                  <img src={vipCompanionsSpriteImage} alt={comp.id} className="absolute inset-0 w-full h-full object-cover opacity-15 mix-blend-screen pointer-events-none transition duration-300 group-hover:opacity-20" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none"></div>

                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 bg-zinc-900 border border-zinc-805/80 border-zinc-800/80 rounded-2xl flex items-center justify-center text-3xl shadow-inner relative select-none">
                        <span className="font-emoji">{comp.avatar}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-100 uppercase tracking-tight group-hover:text-pink-400 transition-colors">
                          {lang === "en" ? comp.nameEn : comp.namePt}
                        </h4>
                        <div className="flex items-center gap-1.5 bg-neutral-900/60 px-2.5 py-0.5 rounded text-[10px] text-rose-400 border border-neutral-800/50 w-max mt-1 font-mono uppercase">
                          💖 +{comp.healthBonus}% HP &nbsp; ⚡ +{comp.energyBonus}% energy
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed font-sans select-none min-h-[40px]">
                      {lang === "en" ? comp.descriptionEn : comp.descriptionPt}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-mono uppercase text-rose-400/90 pt-0.5 whitespace-nowrap items-center">
                      <span>💰 {formatMoney(dynamicCost)}</span>
                      {markupPercent !== 0 && (
                        <span className={`inline-block text-[8px] font-mono font-black px-1.5 py-0.2 rounded ${markupPercent > 0 ? "bg-[#ef4444]/15 text-[#ef4444]" : "bg-[#10b981]/15 text-[#10b981]"}`}>
                          {markupPercent > 0 ? `▲ +${markupPercent}% STATUS TAX` : `▼ ${markupPercent}% OVERHEAD`}
                        </span>
                      )}
                      {!hasLevel && (
                        <span className="text-amber-500 font-bold animate-pulse">
                          🔒 Lvl {minLevel || comp.minLevel}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10">
                    <button
                      onClick={() => {
                        if (!isAvailable || !canAfford) return;
                        playSound.cash();
                        onHireVIPCompanion?.(comp.id, dynamicCost, comp.healthBonus, comp.energyBonus);
                      }}
                      disabled={!isAvailable || !canAfford}
                      className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-between px-4 transition ${
                        isAvailable && canAfford
                          ? "bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg shadow-rose-950/20 shadow-md"
                          : "bg-zinc-900 text-zinc-500 cursor-not-allowed border border-neutral-900"
                      }`}
                    >
                      {!hasLevel ? (
                        <>
                          <span>🔒 {lang === "en" ? `REQUIRES LEVEL ${minLevel || comp.minLevel}` : `REQUER NÍVEL ${minLevel || comp.minLevel}`}</span>
                          <span>{formatMoney(dynamicCost)}</span>
                        </>
                      ) : !canAfford ? (
                        <>
                          <span>💸 {lang === "en" ? "INSUFFICIENT FUNDS" : "SALDO INSUFICIENTE"}</span>
                          <span>{formatMoney(dynamicCost)}</span>
                        </>
                      ) : (
                        <>
                          <span>💋 {lang === "en" ? "ACQUIRE ESCORT" : "SOLICITAR ATENDIMENTO"}</span>
                          <span>{formatMoney(dynamicCost)}</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEWPORT-CENTERED FLOATING DETAIL MODAL */}
      {createPortal(
        <AnimatePresence>
          {selectedItem && (() => {
            const item = selectedItem;
            const isWeapon = item.type === "weapon";
            const isVehicle = item.type === "vehicle";
            const isRealEstate = item.type === "realestate";

            const isOwned = isWeapon
              ? player.weapons.includes(item.id)
              : isVehicle
              ? player.vehicles.includes(item.id)
              : player.realEstate.includes(item.id);

            const isActive = isWeapon
              ? player.activeWeapon === item.id
              : isVehicle
              ? player.activeVehicle === item.id
              : false;

            const { cost: dynamicCost, minLevel: minLvl, markupPercent, factorBreakdown } = getDynamicItemProps(item, player);
            const hasLevel = player.level >= minLvl;
            const canAfford = player.cash >= dynamicCost;
            const isPurchasable = hasLevel && canAfford;
            const itemEmoji = getItemEmoji(item.id, item.type);

            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" id="item-info-modal">
                {/* Dark semi-transparent blur background overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/85 backdrop-blur-md"
                  onClick={() => setSelectedItem(null)}
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 15 }}
                  transition={{ type: "spring", duration: 0.4 }}
                  className={`relative bg-[#0d0d11]/95 w-full max-w-sm rounded-3xl border ${
                    isWeapon 
                      ? "border-red-500/35 shadow-[0_0_50px_rgba(239,68,68,0.15)]" 
                      : isVehicle 
                      ? "border-blue-500/35 shadow-[0_0_50px_rgba(59,130,246,0.15)]" 
                      : "border-emerald-500/35 shadow-[0_0_50px_rgba(16,185,129,0.15)]"
                  } overflow-hidden flex flex-col font-sans z-10`}
                >
                  {/* Modal header details */}
                  <div className={`p-5 border-b border-zinc-900/40 relative bg-gradient-to-b ${
                    isWeapon ? "from-red-950/15" : isVehicle ? "from-blue-950/15" : "from-emerald-950/15"
                  } via-transparent to-transparent`}>
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition p-1 bg-zinc-900/40 hover:bg-zinc-900 rounded-full cursor-pointer z-20"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl bg-zinc-900 border ${
                        isWeapon ? "border-red-500/50 text-red-100 font-emoji text-3xl" : isVehicle ? "border-blue-500/50 text-blue-100 font-emoji text-3xl" : "border-emerald-500/50 text-emerald-100 font-emoji text-3xl"
                      } flex items-center justify-center shadow-inner select-none`}>
                        {itemEmoji}
                      </div>
                      <div>
                        <h3 className="font-sans font-black text-sm text-zinc-100 tracking-tight uppercase leading-snug">
                          {lang === "en" ? item.nameEn : item.namePt}
                        </h3>
                        <span className={`text-[10px] font-mono uppercase tracking-widest block font-bold ${
                          isWeapon ? "text-red-400" : isVehicle ? "text-blue-400" : "text-emerald-400"
                        }`}>
                          {isWeapon 
                            ? (lang === "en" ? "⚔️ DESTRUCTIVE ARSENAL" : "⚔️ ARSENAL MILITAR")
                            : isVehicle
                            ? (lang === "en" ? "⚙️ HIGH-SPEED MACHINE" : "⚙️ MÁQUINA DE FUGA")
                            : (lang === "en" ? "🏢 EMPIRE REAL ESTATE" : "🏢 PROPAGANDA E IMÓVEIS")
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Modal body parameters */}
                  <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                    {/* Status Banner */}
                    <div className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-xl border border-zinc-900/60 font-mono text-xs">
                      <span className="text-zinc-500">{lang === "en" ? "STATUS:" : "STATUS:"}</span>
                      {isActive ? (
                        <span className={`font-extrabold uppercase animate-pulse flex items-center gap-1 ${
                          isWeapon ? "text-red-400" : "text-blue-400"
                        }`}>
                          🚀 {isWeapon ? (lang === "en" ? "EQUIPPED" : "EQUIPADO") : (lang === "en" ? "PILOTING" : "PILOTANDO")}
                        </span>
                      ) : isOwned ? (
                        <span className="text-amber-400 font-bold uppercase animate-pulse flex items-center gap-1">
                          💼 {lang === "en" ? "OWNED" : "ADQUIRIDO"}
                        </span>
                      ) : (
                        <span className="text-zinc-650 uppercase font-bold text-emerald-400">
                          🛒 {lang === "en" ? "AVAILABLE" : "COMPRÁVEL"}
                        </span>
                      )}
                    </div>

                    {/* Profile Description */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-zinc-550 uppercase tracking-wider block">
                        {lang === "en" ? "INTELLIGENCE BRIEF" : "DETALHES DA INTELIGÊNCIA"}
                      </span>
                      <p className="text-xs text-zinc-350 leading-relaxed font-sans normal-case">
                        {lang === "en" ? item.descriptionEn : item.descriptionPt}
                      </p>
                    </div>

                    {/* Upgrades or attributes panel */}
                    <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">{lang === "en" ? "Required Rank" : "Nível Necessário"}</span>
                        <span className={`font-black ${hasLevel ? "text-zinc-200" : "text-red-500 animate-pulse"}`}>
                          LVL {minLvl} {!hasLevel && `(${lang === "en" ? "LOCKED" : "BLOQUEADO"})`}
                        </span>
                      </div>

                      {isWeapon && item.bonusStrength !== undefined && (
                        <div className="flex justify-between items-center border-t border-zinc-900/40 pt-2.5">
                          <span className="text-zinc-500">{lang === "en" ? "Combat Damage" : "Força de Ataque"}</span>
                          <span className="font-extrabold text-red-400">
                            +{item.bonusStrength} STR
                          </span>
                        </div>
                      )}

                      {isVehicle && item.bonusDefense !== undefined && (
                        <div className="flex justify-between items-center border-t border-zinc-900/40 pt-2.5">
                          <span className="text-zinc-500">{lang === "en" ? "Chassis Defense" : "Defesa do Chassi"}</span>
                          <span className="font-extrabold text-blue-400">
                            +{item.bonusDefense} DEF
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-t border-zinc-900/40 pt-2.5">
                        <span className="text-zinc-500">{lang === "en" ? "Contraband Cost (Base)" : "Custo Base de Contrabando"}</span>
                        <span className="font-medium text-zinc-400">
                          {formatMoney(item.cost)}
                        </span>
                      </div>

                      {markupPercent !== 0 && (
                        <div className="border-t border-zinc-900/40 pt-2.5 pb-2.5 space-y-1.5 text-[11px]">
                          <span className="text-zinc-500 block font-bold font-mono">{lang === "en" ? "Black Market Premium Factors:" : "Ajustes do Mercado Negro:"}</span>
                          <div className="pl-2 space-y-1">
                            {factorBreakdown.volatility !== 0 && (
                              <div className="flex justify-between text-zinc-400">
                                <span>📈 {lang === "en" ? "Volatility & Demand" : "Instabilidade do Mercado"}</span>
                                <span className={factorBreakdown.volatility > 0 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                                  {factorBreakdown.volatility > 0 ? `+${factorBreakdown.volatility}%` : `${factorBreakdown.volatility}%`}
                                </span>
                              </div>
                            )}
                            {factorBreakdown.heat !== 0 && (
                              <div className="flex justify-between text-zinc-400">
                                <span>🚨 {lang === "en" ? "Federal Search Pressure" : "Aperto Policial (Heat)"}</span>
                                <span className="text-red-400 font-bold">+{factorBreakdown.heat}%</span>
                              </div>
                            )}
                            {factorBreakdown.reputation !== 0 && (
                              <div className="flex justify-between text-zinc-400">
                                <span>👑 {lang === "en" ? "Mafia Rep Overhead" : "Margem de Renome Mafioso"}</span>
                                <span className="text-red-400 font-bold">+{factorBreakdown.reputation}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-t border-zinc-900/40 pt-2.5">
                        <span className="font-bold text-zinc-350">{lang === "en" ? "Final Dynamic Price" : "Preço Final Realista"}</span>
                        <span className="font-black text-rose-400 text-sm">
                          {formatMoney(dynamicCost)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Controls Footer Container */}
                  <div className="p-5 border-t border-zinc-900/40 bg-zinc-950/50 flex flex-col gap-3">
                    {!isOwned ? (
                      <button
                        onClick={() => {
                          if (!isPurchasable) return;
                          playSound.cash();
                          onBuyItem(item);
                          setSelectedItem(null);
                        }}
                        disabled={!isPurchasable}
                        className={`w-full py-3.5 rounded-xl text-center font-mono text-xs font-black uppercase tracking-wider transition-all duration-300 relative overflow-hidden flex justify-between items-center px-4 ${
                          isPurchasable
                            ? isWeapon 
                              ? "bg-red-650 hover:bg-red-600 bg-red-600 hover:bg-red-500 text-white shadow-lg active:scale-95 cursor-pointer" 
                              : "bg-blue-650 hover:bg-blue-600 bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-95 cursor-pointer"
                            : "bg-zinc-900 text-zinc-650 cursor-not-allowed border border-zinc-850/10"
                        }`}
                      >
                        {!hasLevel ? (
                          <>
                            <span>🔒 {lang === "en" ? `REQUIRES LVL ${minLvl}` : `REQUER NÍVEL ${minLvl}`}</span>
                            <span>{formatMoney(dynamicCost)}</span>
                          </>
                        ) : !canAfford ? (
                          <>
                            <span>💸 {lang === "en" ? "LACKING FUNDS" : "SALDO INSUFICIENTE"}</span>
                            <span>{formatMoney(dynamicCost)}</span>
                          </>
                        ) : (
                          <>
                            <span>💸 {lang === "en" ? "ACQUIRE NOW" : "ADQUIRIR AGORA"}</span>
                            <span>{formatMoney(dynamicCost)}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-3.5">
                        {isWeapon ? (
                          <button
                            onClick={() => {
                              playSound.notification();
                              onToggleWeapon(item.id);
                              setSelectedItem(null);
                            }}
                            className={`w-full col-span-2 py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                              isActive
                                ? "bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-350 cursor-pointer"
                                : "bg-red-950/10 hover:bg-red-950/20 border border-red-900/30 text-red-400 cursor-pointer"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            {isActive
                              ? (lang === "en" ? "DISMISS" : "ATIVO")
                              : (lang === "en" ? "EQUIP" : "EQUIPAR")}
                          </button>
                        ) : isVehicle ? (
                          <button
                            onClick={() => {
                              playSound.notification();
                              onToggleVehicle(item.id);
                              setSelectedItem(null);
                            }}
                            className={`w-full col-span-2 py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                              isActive
                                ? "bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-350 cursor-pointer"
                                : "bg-blue-950/10 hover:bg-blue-950/20 border border-blue-900/30 text-blue-400 cursor-pointer"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            {isActive
                              ? (lang === "en" ? "PARKED" : "PILOTANDO")
                              : (lang === "en" ? "PILOT" : "PILOTAR")}
                          </button>
                        ) : null}
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedItem(null)}
                      className="w-full text-center py-2 text-[10px] font-mono text-[#555] hover:text-[#bbb] transition uppercase cursor-pointer"
                    >
                      {lang === "en" ? "← CLOSE CABINET" : "← FECHAR PAINEL"}
                    </button>
                  </div>
                </motion.div>
              </div>
            );
          })()}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
