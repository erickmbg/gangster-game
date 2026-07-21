import React, { useState } from "react";
import { PlayerState, SHOP_ITEMS, PETS, DRUGS, GameItem, PetItem, Drug } from "../types";
import { playSound } from "./AudioEngine";
import { 
  Sword, 
  Shield, 
  Car, 
  Flame, 
  Search, 
  Sparkles, 
  Heart, 
  Zap, 
  TrendingUp, 
  Compass, 
  User, 
  Plus, 
  Award, 
  Activity,
  ChevronRight,
  Box,
  Eye,
  Check
} from "lucide-react";
import { motion } from "motion/react";

interface MyPossessionsProps {
  player: PlayerState;
  lang: "en" | "pt";
  onToggleWeapon: (id: string) => void;
  onToggleVehicle: (id: string) => void;
  onToggleActivePet: (id: string) => void;
  onLevelUpPet: (petId: string, cost: number) => void;
  onConsumeDrug: (drugId: string) => void;
}

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
  return "🏢";
};

export default function MyPossessions({
  player,
  lang,
  onToggleWeapon,
  onToggleVehicle,
  onToggleActivePet,
  onLevelUpPet,
  onConsumeDrug
}: MyPossessionsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"gear" | "contraband" | "investment">("gear");

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  const activeWeapon = SHOP_ITEMS.find((i) => i.id === player.activeWeapon);
  const activeVehicle = SHOP_ITEMS.find((i) => i.id === player.activeVehicle);
  const activePet = PETS.find((i) => i.id === player.activePet);

  // Filter owned weapons
  const ownedWeapons = SHOP_ITEMS.filter((i) => i.type === "weapon" && player.weapons.includes(i.id));
  
  // Filter owned vehicles
  const ownedVehicles = SHOP_ITEMS.filter((i) => i.type === "vehicle" && player.vehicles.includes(i.id));

  // Filter owned real estate
  const ownedRealEstates = SHOP_ITEMS.filter((i) => i.type === "realestate" && player.realEstate.includes(i.id));

  // Filter owned pets
  const ownedPets = player.pets || {};

  // Level up costs logic
  const getLevelUpCost = (pet: PetItem, currentLevel: number) => {
    if (currentLevel >= pet.maxLevel) return 0;
    return Math.round(pet.baseCost * currentLevel * 0.55 + 500);
  };

  return (
    <div className="space-y-6 font-sans select-none animate-fade-in-down pb-12">
      {/* HEADER STATEMENT OF RICHNESS */}
      <div className="bg-gradient-to-r from-zinc-900 to-black border border-zinc-800 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎩</span>
            <h2 className="text-lg font-black uppercase text-neutral-100 tracking-tight">
              {lang === "en" ? "Vault & Stash Inventory" : "Cofre & Inventário Pessoal"}
            </h2>
          </div>
          <p className="text-xs text-neutral-400 max-w-lg">
            {lang === "en"
              ? "Oversee your entire criminal portfolio. Inspect weapons, command getaway rides, track secure real estate income, and ingest contraband to boost active stats."
              : "Gerencie todo o seu portfólio criminoso. Monitore armamentos, comande veículos de fuga, administre imóveis e consuma fardos do mercado negro."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-zinc-850 pt-4 md:border-t-0 md:pt-0">
          <div className="bg-zinc-950/80 border border-zinc-850 px-4 py-2 rounded-2xl min-w-[120px]">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase block tracking-wider">
              {lang === "en" ? "Asset Count" : "Total de Itens"}
            </span>
            <span className="text-lg font-extrabold font-mono text-neutral-200">
              {ownedWeapons.length + ownedVehicles.length + ownedRealEstates.length}
            </span>
          </div>
          <div className="bg-zinc-950/80 border border-zinc-850 px-4 py-2 rounded-2xl min-w-[120px]">
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase block tracking-wider">
              {lang === "en" ? "Passive Income / Tik" : "Renda Passiva / Tik"}
            </span>
            <span className="text-lg font-extrabold font-mono text-emerald-400">
              {formatMoney(ownedRealEstates.reduce((sum, r) => sum + (r.passiveIncome || 0), 0))}
            </span>
          </div>
        </div>
      </div>

      {/* COMPACT BENTO SUBSECTION SELECTOR TAB */}
      <div className="flex bg-zinc-950/90 border border-zinc-850/60 p-1.5 rounded-2xl gap-1 overflow-x-auto">
        <button
          onClick={() => { playSound.notification(); setActiveSubTab("gear"); }}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeSubTab === "gear" ? "bg-zinc-850 border border-zinc-700/50 text-red-500 shadow" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          ⚔️ {lang === "en" ? "Armament & Gear" : "Arsenal & Combate"}
        </button>
        <button
          onClick={() => { playSound.notification(); setActiveSubTab("contraband"); }}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center justify-center gap-1.5 whitespace-nowrap relative ${
            activeSubTab === "contraband" ? "bg-zinc-850 border border-zinc-700/50 text-red-500 shadow" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          🌿 {lang === "en" ? "Contraband Stock" : "Estoque Contrabando"}
          {Object.values(player.drugsInventory).some(v => v > 0) && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          )}
        </button>
        <button
          onClick={() => { playSound.notification(); setActiveSubTab("investment"); }}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
            activeSubTab === "investment" ? "bg-zinc-850 border border-zinc-700/50 text-red-500 shadow" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          🏢 {lang === "en" ? "Empire & Mascots" : "Império & Mascotes"}
        </button>
      </div>

      {/* SECTION CONTAINER SUBMODULE SWITCH */}
      <div className="space-y-6">
        {/* SUBTAB 1: GEAR ACTIONS */}
        {activeSubTab === "gear" && (
          <div className="space-y-6">
            {/* ACTIVE EQUIPPED PANEL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-950 border border-red-500/30 p-4.5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-2 right-2 opacity-5 text-xl font-mono uppercase font-black tracking-widest text-red-500">GUN</div>
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block mb-2">{lang === "en" ? "EQUIPPED WEAPON" : "ARMA ATIVA"}</span>
                {activeWeapon ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔫</span>
                      <h4 className="text-sm font-black text-white uppercase font-mono">{lang === "en" ? activeWeapon.nameEn : activeWeapon.namePt}</h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 select-none leading-relaxed line-clamp-2">{lang === "en" ? activeWeapon.descriptionEn : activeWeapon.descriptionPt}</p>
                    <span className="text-[10px] font-mono font-semibold text-red-400 block pt-1">⚔️ +{activeWeapon.bonusStrength} ATTACK VALUE</span>
                  </div>
                ) : (
                  <div className="py-2 text-zinc-600 text-xs font-mono select-none">{lang === "en" ? "UNARMED (Fists)" : "DESARMADO (Punhos)"}</div>
                )}
              </div>

              <div className="bg-zinc-950 border border-blue-500/30 p-4.5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-2 right-2 opacity-5 text-xl font-mono uppercase font-black tracking-widest text-blue-500">RIDE</div>
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block mb-2">{lang === "en" ? "ACTIVE VEHICLE" : "VEÍCULO ATIVO"}</span>
                {activeVehicle ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚗</span>
                      <h4 className="text-sm font-black text-white uppercase font-mono">{lang === "en" ? activeVehicle.nameEn : activeVehicle.namePt}</h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 select-none leading-relaxed line-clamp-2">{lang === "en" ? activeVehicle.descriptionEn : activeVehicle.descriptionPt}</p>
                    <span className="text-[10px] font-mono font-semibold text-blue-400 block pt-1">🛡️ +{activeVehicle.bonusDefense} DEFENSE VALUE</span>
                  </div>
                ) : (
                  <div className="py-2 text-zinc-600 text-xs font-mono select-none">{lang === "en" ? "ON FOOT (No Ride)" : "A PÉ (Sem veículo)"}</div>
                )}
              </div>

              <div className="bg-zinc-950 border border-amber-500/30 p-4.5 rounded-2xl relative overflow-hidden">
                <div className="absolute top-2 right-2 opacity-5 text-xl font-mono uppercase font-black tracking-widest text-amber-500">PET</div>
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block mb-2">{lang === "en" ? "ACTIVE COMPANION" : "MASCOTE ATIVO"}</span>
                {activePet ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{activePet.avatar}</span>
                      <h4 className="text-sm font-black text-white uppercase font-mono">{lang === "en" ? activePet.nameEn : activePet.namePt}</h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 select-none leading-relaxed line-clamp-2">{lang === "en" ? activePet.descriptionEn : activePet.descriptionPt}</p>
                    <span className="text-[10px] font-mono font-semibold text-amber-400 block pt-1">
                      {activePet.bonusType === "defense" ? "🛡️" : "🔥"} +
                      {activePet.baseBonusPercent + (ownedPets[activePet.id]?.level - 1) * activePet.bonusPerLevelPercent}%{" "}
                      {activePet.bonusType === "defense" ? (lang === "en" ? "DEFENSE" : "DEFESA") : (lang === "en" ? "CRIME BOOST" : "GOLPES")}
                    </span>
                  </div>
                ) : (
                  <div className="py-2 text-zinc-600 text-xs font-mono select-none">{lang === "en" ? "NONE ACTIVE" : "NENHUM ATIVO"}</div>
                )}
              </div>
            </div>

            {/* OWNED WEAPONS CONTAINER LIST */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-850 pb-2">
                <Sword className="w-4 h-4 text-red-500" />
                {lang === "en" ? "Owned Offensive Firearms" : "Armas de Fogo Adquiridas"}
              </h3>
              {ownedWeapons.length === 0 ? (
                <div className="p-8 text-center bg-zinc-950/20 border border-zinc-900 rounded-3xl text-zinc-500 text-xs font-mono">
                  {lang === "en" ? "No firearms owned. Visit the Armory shop to purchase armaments." : "Nenhuma arma adquirida. Compre armas de fogo na Loja de Armamentos."}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5" id="owned-weapons-mosaic-grid">
                  {ownedWeapons.map((w) => {
                    const isEquipped = player.activeWeapon === w.id;
                    const itemEmoji = getItemEmoji(w.id, "weapon");
                    return (
                      <div 
                        key={w.id} 
                        onClick={() => { if (!isEquipped) { playSound.notification(); onToggleWeapon(w.id); } }}
                        className={`p-3 rounded-xl border relative transition-all duration-300 flex flex-col justify-between h-full group bg-[#070709]/90 shadow-md ${
                          isEquipped 
                            ? "border-red-600 bg-red-955/10 shadow-[inset_0_1px_1px_rgba(239,68,68,0.05)] cursor-default" 
                            : "border-zinc-850 hover:border-zinc-750 hover:bg-[#0c0c0f] cursor-pointer hover:scale-[1.02]"
                        }`}
                      >
                        <div>
                          {/* Top row with emoji & text */}
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-2xl filter drop-shadow group-hover:scale-110 transition-transform duration-300 select-none shrink-0 font-bold">
                              {itemEmoji}
                            </span>
                            <div className="truncate min-w-0 font-sans">
                              <h4 className="font-sans font-black text-[11px] text-zinc-100 group-hover:text-amber-400 transition-colors truncate leading-tight">
                                {lang === "en" ? w.nameEn : w.namePt}
                              </h4>
                              {isEquipped ? (
                                <span className="inline-block mt-1 text-[7.5px] font-mono px-1 py-0.5 rounded leading-none bg-red-955/45 text-red-400 border border-red-900/40 font-extrabold max-w-full truncate">
                                  {lang === "en" ? "ACTIVE" : "ATIVO"}
                                </span>
                              ) : (
                                <span className="inline-block mt-1 text-[7.5px] font-mono px-1 py-0.5 rounded leading-none bg-zinc-800 text-zinc-400 border border-zinc-750 max-w-full truncate">
                                  {lang === "en" ? "OWNED" : "PORTÁTIL"}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-[9px] text-[#888] font-mono line-clamp-2 h-6 overflow-hidden leading-tight normal-case pr-1">
                            {lang === "en" ? w.descriptionEn : w.descriptionPt}
                          </p>
                        </div>

                        <div className="mt-2 space-y-2">
                          <div className="border-t border-zinc-900/40 pt-1.5 text-[9px] font-mono text-zinc-400 flex justify-between items-center">
                            <div>
                              <span className="text-[7px] text-zinc-550 block font-bold uppercase leading-none mb-0.5">
                                {lang === "en" ? "BONUS" : "COMBATE"}
                              </span>
                              <span className="text-red-400 font-bold leading-none block">
                                +{w.bonusStrength} ATK
                              </span>
                            </div>
                            <span className={`text-[7px] font-extrabold uppercase ${isEquipped ? "text-red-400 animate-pulse" : "text-zinc-650"}`}>
                              {isEquipped ? (lang === "en" ? "🛡️ ACTIVE" : "🛡️ ATIVA") : ""}
                            </span>
                          </div>

                          <div className="pt-0.5 select-none">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isEquipped) {
                                  playSound.notification();
                                  onToggleWeapon(w.id);
                                }
                              }}
                              disabled={isEquipped}
                              className={`w-full py-0.5 text-center font-mono text-[8px] font-extrabold border rounded transition duration-200 uppercase ${
                                isEquipped 
                                  ? "bg-zinc-900/45 border-zinc-850 text-zinc-650 cursor-default" 
                                  : "bg-red-900/10 border-red-900/30 text-red-400 hover:bg-red-900/20 hover:border-red-500/50"
                              }`}
                            >
                              {isEquipped ? (lang === "en" ? "ACTIVE" : "ATIVO") : (lang === "en" ? "⚡ EQUIP" : "⚡ EQUIPAR")}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* OWNED VEHICLES CONTAINER LIST */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-850 pb-2">
                <Car className="w-4 h-4 text-blue-400" />
                {lang === "en" ? "Owned Fleet of Vehicles" : "Frota de Veículos de Fuga"}
              </h3>
              {ownedVehicles.length === 0 ? (
                <div className="p-8 text-center bg-zinc-950/20 border border-zinc-900 rounded-3xl text-zinc-500 text-xs font-mono">
                  {lang === "en" ? "No getaway rides in garage. Visit the Armory to buy bulletproof cruises." : "Nenhum veículo de fuga. Compre veículos blindados na Loja de Armas."}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5" id="owned-vehicles-mosaic-grid">
                  {ownedVehicles.map((v) => {
                    const isEquipped = player.activeVehicle === v.id;
                    const itemEmoji = getItemEmoji(v.id, "vehicle");
                    return (
                      <div key={v.id} className={`p-4 bg-zinc-950 border rounded-2xl flex justify-between items-center gap-4 transition-all ${isEquipped ? "border-blue-500 bg-blue-950/5 text-neutral-100" : "border-zinc-850"}`}>
                        <div>
                          {/* Top row with emoji & text */}
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-2xl filter drop-shadow group-hover:scale-110 transition-transform duration-300 select-none shrink-0 font-bold">
                              {itemEmoji}
                            </span>
                            <div className="truncate min-w-0 font-sans">
                              <h4 className="font-sans font-black text-[11px] text-zinc-100 group-hover:text-amber-400 transition-colors truncate leading-tight">
                                {lang === "en" ? v.nameEn : v.namePt}
                              </h4>
                              {isEquipped ? (
                                <span className="inline-block mt-1 text-[7.5px] font-mono px-1 py-0.5 rounded leading-none bg-blue-955/45 text-blue-400 border border-blue-900/40 font-extrabold max-w-full truncate">
                                  {lang === "en" ? "DRIVING" : "PILOTANDO"}
                                </span>
                              ) : (
                                <span className="inline-block mt-1 text-[7.5px] font-mono px-1 py-0.5 rounded leading-none bg-zinc-800 text-zinc-400 border border-zinc-750 max-w-full truncate">
                                  {lang === "en" ? "OWNED" : "GARAGEM"}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-[9px] text-[#888] font-mono line-clamp-2 h-6 overflow-hidden leading-tight normal-case pr-1">
                            {lang === "en" ? v.descriptionEn : v.descriptionPt}
                          </p>
                        </div>
                        <div className="mt-2 space-y-2">
                          <div className="border-t border-zinc-900/40 pt-1.5 text-[9px] font-mono text-zinc-400 flex justify-between items-center">
                            <div>
                              <span className="text-[7px] text-zinc-500 block font-bold uppercase leading-none mb-0.5">
                                {lang === "en" ? "SHIELD" : "ARMADURA"}
                              </span>
                              <span className="text-blue-400 font-bold leading-none block">
                                +{v.bonusDefense} DEF
                              </span>
                            </div>
                            <span className={`text-[7px] font-extrabold uppercase ${isEquipped ? "text-blue-400 animate-pulse" : "text-zinc-650"}`}>
                              {isEquipped ? (lang === "en" ? "🛡️ ON ROAD" : "🛡️ ATIVO") : ""}
                            </span>
                          </div>

                          <div className="pt-0.5 select-none font-bold">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isEquipped) {
                                  playSound.notification();
                                  onToggleVehicle(v.id);
                                }
                              }}
                              disabled={isEquipped}
                              className={`w-full py-0.5 text-center font-mono text-[8px] font-extrabold border rounded transition duration-200 uppercase ${
                                isEquipped 
                                  ? "bg-zinc-900/45 border-zinc-850 text-zinc-650 cursor-default" 
                                  : "bg-blue-900/10 border-blue-900/30 text-blue-450 text-blue-400 hover:bg-blue-900/20 hover:border-blue-500/50"
                              }`}
                            >
                              {isEquipped ? (lang === "en" ? "DRIVING" : "PILOTANDO") : (lang === "en" ? "⚡ PILOT" : "⚡ PILOTAR")}
                            </button>
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

        {/* SUBTAB 2: CONTRABAND DRUGS */}
        {activeSubTab === "contraband" && (
          <div className="space-y-6">
            <div className="bg-emerald-950/10 border border-emerald-900/40 p-4 rounded-2xl text-xs text-emerald-400 flex items-start gap-3">
              <span className="text-lg">📦</span>
              <p className="leading-relaxed font-mono text-[11px]">
                <strong>{lang === "en" ? "CONTRABAND CONSUMPTION DECK:" : "MECÂNICA DE CONSUMO DE INSUMOS:"}</strong>{" "}
                {lang === "en"
                  ? "Consuming your contraband stock applies instant benefits and changes to your attributes. Highly concentrated formulas improve health, replenish energy, reduce police search heat, or sharpen willpower forever!"
                  : "Consumir seus contrabandos de alta qualidade fornece efeitos imediatos. Extratos puros regeneram vida, preenchem energia, reduzem a perseguição policial (heat) ou blindam seu intelecto e determinação para sempre!"}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5" id="owned-contraband-mosaic-grid">
              {DRUGS.map((drug) => {
                const qtyOwned = player.drugsInventory[drug.id] || 0;
                const hasItem = qtyOwned > 0;

                return (
                  <div 
                    key={drug.id}
                    className={`p-3 rounded-xl border transition-all duration-300 flex flex-col justify-between h-full relative group bg-[#070709]/90 shadow-md ${
                      hasItem 
                        ? "border-emerald-900/60 bg-emerald-955/5 shadow-[0_2px_10px_rgba(16,185,129,0.03)] hover:border-emerald-500/50" 
                        : "border-zinc-850 bg-zinc-950/10 opacity-55 hover:opacity-75"
                    }`}
                  >
                    <div>
                      {/* Name Header and Counter */}
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xl filter drop-shadow group-hover:scale-110 transition-transform duration-300 shrink-0 select-none">
                            {drug.emoji || "📦"}
                          </span>
                          <h4 className="text-[10px] font-black text-zinc-100 uppercase font-sans group-hover:text-amber-400 transition-colors truncate">
                            {lang === "en" ? drug.nameEn : drug.namePt}
                          </h4>
                        </div>
                        <span className={`font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded border leading-none shrink-0 ${hasItem ? "bg-emerald-950/85 border-emerald-700/50 text-emerald-400 animate-pulse" : "bg-neutral-900 border-neutral-800 text-zinc-550"}`}>
                          x{qtyOwned}
                        </span>
                      </div>

                      <p className="text-[9px] text-zinc-400 leading-tight mb-2 line-clamp-2 h-6 overflow-hidden normal-case">
                        {lang === "en" ? drug.descriptionEn : drug.descriptionPt}
                      </p>

                      {/* Efeitos Atributos Display */}
                      <div className="bg-[#0e0e12]/60 border border-zinc-900/60 rounded-lg p-2 mb-3 space-y-1 font-mono text-[9px]">
                        <span className="text-[7.5px] text-zinc-500 tracking-wider font-extrabold block uppercase mb-0.5">
                          {lang === "en" ? "EFFECTS" : "EFEITOS"}
                        </span>
                        {drug.effects && Object.entries(drug.effects).map(([stat, val]) => {
                          const isPositive = val > 0;
                          return (
                            <div key={stat} className="flex justify-between items-center text-[8.5px]">
                              <span className="text-zinc-400 uppercase text-[8px]">{stat}</span>
                              <span className={`font-extrabold ${isPositive ? "text-emerald-400" : "text-rose-500"}`}>
                                {isPositive ? "+" : ""}{val}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Consumer Trigger Action Button */}
                    <button
                      onClick={() => onConsumeDrug(drug.id)}
                      disabled={!hasItem}
                      className={`w-full py-1.5 rounded-lg text-[8px] font-mono font-black uppercase transition flex items-center justify-center gap-1 shrink-0 ${
                        hasItem 
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md hover:scale-[1.01]" 
                          : "bg-zinc-900/50 text-zinc-600 border border-zinc-850 cursor-not-allowed"
                      }`}
                    >
                      <span>⚡ {lang === "en" ? "Consume" : "Consumir"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SUBTAB 3: PROPERTIES & MASCOTS */}
        {activeSubTab === "investment" && (
          <div className="space-y-6">
            {/* OWNED EMPIRE PROPERTIES */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-850 pb-2">
                <span>🏢</span>
                {lang === "en" ? "Owned Syndicate Real Estate properties" : "Propriedades Criminosas Adquiridas"}
              </h3>
              {ownedRealEstates.length === 0 ? (
                <div className="p-8 text-center bg-zinc-950/20 border border-zinc-900 rounded-3xl text-zinc-500 text-xs font-mono">
                  {lang === "en" ? "No money-making properties owned. Visit Extortions tab in Armory to invest." : "Nenhum imóvel comprado. Compre pontos comerciais na Lojas para fundar seu império de renda passiva."}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5" id="owned-realestates-mosaic-grid">
                  {ownedRealEstates.map((prop) => {
                    return (
                      <div 
                        key={prop.id} 
                        className="p-3 bg-[#070709]/90 border border-emerald-900/45 rounded-xl flex flex-col justify-between h-full relative group shadow-md hover:border-emerald-500/50 hover:scale-[1.01] transition-all duration-300"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-1.5 mb-2">
                            <span className="text-sm font-sans font-black text-zinc-100 group-hover:text-amber-400 transition-colors flex items-center gap-1.5 truncate">
                              <span className="text-lg filter drop-shadow group-hover:scale-110 transition-transform duration-300 select-none shrink-0">{prop.emoji || "🏢"}</span>
                              <span className="truncate">{lang === "en" ? prop.nameEn : prop.namePt}</span>
                            </span>
                            <span className="inline-flex items-center justify-center bg-emerald-950/20 text-emerald-400 p-0.5 rounded border border-emerald-905/30 shrink-0">
                              <Check className="w-3 h-3 stroke-[3.5]" />
                            </span>
                          </div>
                          <p className="text-[9px] text-[#888] font-mono leading-tight mb-3 line-clamp-2 h-6 overflow-hidden normal-case">
                            {lang === "en" ? prop.descriptionEn : prop.descriptionPt}
                          </p>
                        </div>

                        <div className="border-t border-zinc-900/40 pt-1.5 space-y-1 text-[8px] font-mono">
                          <div className="flex justify-between items-center text-zinc-450">
                            <span>{lang === "en" ? "VALUECOST" : "VALOR DE MERCADO"}</span>
                            <span className="font-bold text-neutral-300">{formatMoney(prop.cost)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[#10b981]">
                            <span>{lang === "en" ? "PASSIVE INCOME" : "RENDIMENTO RECORRENTE"}</span>
                            <span className="font-extrabold font-mono text-emerald-400 animate-pulse">
                              +{formatMoney(prop.passiveIncome || 0)}/tick
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* OWNED COMPANIONS MASCOTS DECK */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-850 pb-2">
                <span>🐕</span>
                {lang === "en" ? "Your Trained Companions List" : "Companheiros e Mascotes Treinados"}
              </h3>
              {Object.keys(ownedPets).length === 0 ? (
                <div className="p-8 text-center bg-zinc-950/20 border border-zinc-900 rounded-3xl text-zinc-500 text-xs font-mono">
                  {lang === "en" ? "No companions trained. Visit Pets Tab in Armory to acquire muscle beasts." : "Nenhum mascote recrutado. Recrute companheiros de guarda na aba Mascotes em Lojas de Combate."}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5" id="owned-companions-mosaic-grid">
                  {PETS.filter(p => !!ownedPets[p.id]).map((pet) => {
                    const rec = ownedPets[pet.id];
                    const isActive = player.activePet === pet.id;
                    const levelUpCost = getLevelUpCost(pet, rec.level);
                    const isMaxLevel = rec.level >= pet.maxLevel;
                    const canAffordLevelUp = player.cash >= levelUpCost;
                    const currentBonus = pet.baseBonusPercent + (rec.level - 1) * pet.bonusPerLevelPercent;

                    return (
                      <div 
                        key={pet.id} 
                        className={`p-3 rounded-xl border flex flex-col justify-between h-full relative group transition-all duration-300 bg-[#070709]/90 shadow-md ${
                          isActive 
                            ? "border-amber-500 bg-amber-955/10 shadow-[inset_0_1px_1px_rgba(245,158,11,0.05)]" 
                            : "border-zinc-850 hover:border-zinc-750 hover:bg-[#0c0c0f] cursor-pointer"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5 mb-1 text-[11px] truncate">
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-9 h-9 bg-zinc-900/80 border border-zinc-800 rounded-lg flex items-center justify-center text-xl shadow-inner relative shrink-0">
                              <span className="group-hover:scale-110 transition-transform duration-300 select-none">{pet.avatar}</span>
                              <span className="absolute -bottom-1 -right-1 bg-red-600 text-white font-mono text-[7px] font-black rounded-sm px-0.5 leading-none h-3.5 flex items-center justify-center">
                                L{rec.level}
                              </span>
                            </div>
                            <div className="truncate min-w-0 font-sans">
                              <h4 className="text-[10px] font-sans font-black text-zinc-100 group-hover:text-amber-400 transition-colors truncate leading-tight uppercase">{lang === "en" ? pet.nameEn : pet.namePt}</h4>
                              <span className="text-[7.5px] font-extrabold uppercase text-zinc-400 font-mono flex items-center gap-0.5 pt-0.5 leading-none">
                                {pet.bonusType === "defense" ? <Shield className="w-2 h-2 text-blue-400" /> : <TrendingUp className="w-2 h-2 text-emerald-400" />}
                                {pet.bonusType === "defense" ? (lang === "en" ? "DEF" : "DEFESA") : (lang === "en" ? "GOLPES" : "GOLPES")}
                              </span>
                            </div>
                          </div>

                          {isActive ? (
                            <span className="text-[7.5px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-500 font-extrabold px-1.5 py-0.5 rounded leading-none shrink-0 animate-pulse">
                              {lang === "en" ? "ON ROAD" : "ATIVADO"}
                            </span>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); playSound.notification(); onToggleActivePet(pet.id); }}
                              className="text-[7.5px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-450 font-extrabold px-1.5 py-0.5 rounded hover:text-white leading-none shrink-0"
                            >
                              {lang === "en" ? "COMMAND" : "ATIVAR"}
                            </button>
                          )}
                        </div>

                        <div className="mt-2 space-y-2 pt-1 border-t border-zinc-900/40">
                          <div className="flex justify-between items-center text-[8.5px] font-mono leading-none">
                            <span className="text-zinc-500">{lang === "en" ? "STAT BOOST:" : "BÔNUS ATIVO:"}</span>
                            <span className={`font-bold ${pet.bonusType === "defense" ? "text-blue-400" : "text-emerald-400"}`}>
                              +{currentBonus.toFixed(1)}% {pet.bonusType === "defense" ? "DEF" : "CHANCE"}
                            </span>
                          </div>

                          {/* Level Up Button */}
                          <div className="pt-0.5 select-none font-bold">
                            <button
                              onClick={() => {
                                if (isMaxLevel || !canAffordLevelUp) return;
                                playSound.cash();
                                onLevelUpPet(pet.id, levelUpCost);
                              }}
                              disabled={isMaxLevel || !canAffordLevelUp}
                              className={`w-full py-1 text-center font-mono text-[8px] font-extrabold uppercase border rounded transition duration-200 ${
                                isMaxLevel
                                  ? "bg-zinc-950 border-neutral-900 text-zinc-650 cursor-default"
                                  : canAffordLevelUp
                                  ? "bg-emerald-950/20 border-emerald-900/35 text-emerald-400 hover:bg-emerald-900/20 hover:border-emerald-500/50 cursor-pointer"
                                  : "bg-zinc-950/20 border-zinc-900/50 text-zinc-600 cursor-not-allowed"
                              }`}
                            >
                              {isMaxLevel ? (
                                <span>🏆 {lang === "en" ? "MAXED" : "MÁXIMO"}</span>
                              ) : (
                                <span className="flex items-center justify-center gap-0.5 truncate max-w-full">
                                  💪 {lang === "en" ? "TRAIN" : "TREINAR"} (-{formatMoney(levelUpCost)})
                                </span>
                              )}
                            </button>
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
      </div>
    </div>
  );
}
