import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PlayerState, PETS, PetItem, getDynamicPetProps } from "../types";
import { playSound } from "./AudioEngine";
import { Shield, Sparkles, TrendingUp, Check, Plus, X, Power } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import storePetsSpriteImage from "../assets/images/store_pets_1782178155776.jpg";
import petDogSpriteImage from "../assets/images/pet_dog_sprite_1782179527026.jpg";
import petReptileSpriteImage from "../assets/images/pet_reptile_sprite_1782179545676.jpg";

const getPetImage = (id: string) => {
  if (['crimson_dragon'].includes(id)) return petReptileSpriteImage;
  return petDogSpriteImage;
};

interface CompanionsProps {
  player: PlayerState;
  onBuyPet: (petId: string, cost: number) => void;
  onLevelUpPet: (petId: string, cost: number) => void;
  onToggleActivePet: (petId: string) => void;
  lang: "en" | "pt";
}

export default function Companions({
  player,
  onBuyPet,
  onLevelUpPet,
  onToggleActivePet,
  lang
}: CompanionsProps) {
  const [selectedPet, setSelectedPet] = useState<PetItem | null>(null);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  const ownedPets = player.pets || {};
  const activePetId = player.activePet || null;

  // Level Up Cost formula: baseCost * level * 0.55 + 500
  const getLevelUpCost = (pet: PetItem, currentLevel: number) => {
    if (currentLevel >= pet.maxLevel) return 0;
    return Math.round(pet.baseCost * currentLevel * 0.55 + 500);
  };

  // Current Active Bonus amount
  const getBonusPercent = (pet: PetItem, currentLevel: number) => {
    return pet.baseBonusPercent + (currentLevel - 1) * pet.bonusPerLevelPercent;
  };

  // Lock body scroll of the app when popup details modal is open
  useEffect(() => {
    if (selectedPet) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedPet]);

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10" id="companions-mosaic-container">
      <div className="w-full h-32 md:h-48 relative rounded-2xl overflow-hidden shadow-lg border border-neutral-800 mb-6 flex items-end">
        <img src={storePetsSpriteImage} alt="Pets Dealer" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
        <h3 className="relative z-10 p-4 text-xl font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 drop-shadow-md">
          {lang === "en" ? "EXOTIC PETS SANCTUARY" : "CRIADOURO CLANDESTINO"}
        </h3>
      </div>
    
      {/* Header Rules Alert Banner */}
      <div className="bg-neutral-950/20 border border-neutral-800/40 p-4 rounded-2xl flex items-start gap-3.5" id="syndicate-banner">
        <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-purple-400 mt-0.5">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-neutral-200">
            {lang === "en" ? "Companion Syndicate Rules" : "Regras da Máfia de Mascote"}
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
            {lang === "en"
              ? "Underworld companions provide permanent flat percentage increases while active. Only one companion can accompany you on active turf orders. Spend dirty cash to train them up to level 10 to maximize their potential."
              : "Companheiros do submundo concedem aumentos percentuais fixos permanentes enquanto ativos. Apenas um mascote pode guiar você nas missões das ruas. Invista grana para treiná-los até o nível 10 e maximizar seu potencial criminoso."}
          </p>
        </div>
      </div>

      {/* Grid List matching Weapons & Vehicles column density strictly */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5" id="companions-grid">
        {PETS.map((pet) => {
          const isOwned = !!ownedPets[pet.id];
          const currentLevel = isOwned ? ownedPets[pet.id].level : 1;
          const isActive = activePetId === pet.id;
          const currentBonus = getBonusPercent(pet, currentLevel);
          const { cost: dynamicCost, minLevel, markupPercent } = getDynamicPetProps(pet, player);
          const hasLevel = player.level >= (minLevel || pet.minLevel || 1);
          const bgImage = getPetImage(pet.id);

          return (
            <div
              key={pet.id}
              onClick={() => {
                playSound.notification();
                setSelectedPet(pet);
              }}
              className={`p-3.5 rounded-xl border relative transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col justify-between h-full group bg-[#070709]/90 shadow-md overflow-hidden ${
                isActive
                  ? "border-purple-500 bg-purple-955/20 shadow-[inset_0_1px_1px_rgba(168,85,247,0.05)]"
                  : !hasLevel && !isOwned
                  ? "border-neutral-950 opacity-45 cursor-not-allowed"
                  : "border-neutral-800 group hover:border-neutral-700"
              }`}
              id={`pet-card-${pet.id}`}
            >
              {bgImage && (
                <>
                  <img src={bgImage} alt={pet.id} className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen pointer-events-none" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none"></div>
                </>
              )}

              <div className="relative z-10">
                {/* Avatar icon display top row layout */}
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-850 flex items-center justify-center text-2xl filter drop-shadow relative group-hover:scale-110 transition duration-300 select-none">
                    <span>{pet.avatar}</span>
                    {isOwned && (
                      <span className="absolute -bottom-1 -right-1 bg-purple-500 text-white font-mono text-[8px] font-bold rounded-md px-1 py-0.2 select-none border border-black/35">
                        L{currentLevel}
                      </span>
                    )}
                  </div>
                  <div className="truncate min-w-0 font-sans">
                    <h4 className="font-sans font-black text-xs text-zinc-100 group-hover:text-purple-400 transition-colors truncate leading-tight mt-0.5">
                      {lang === "en" ? pet.nameEn : pet.namePt}
                    </h4>

                    {isActive ? (
                      <span className="inline-block mt-0.5 text-[7.5px] font-mono font-black px-1.5 py-0.5 rounded leading-none bg-purple-955/40 text-purple-400 border border-purple-900/30 max-w-full truncate">
                        {lang === "en" ? "ACTIVE" : "ATIVO"}
                      </span>
                    ) : isOwned ? (
                      <span className="inline-block mt-0.5 text-[7.5px] font-mono font-black px-1.5 py-0.5 rounded leading-none bg-zinc-800 text-amber-500 border border-zinc-750 max-w-full truncate">
                        {lang === "en" ? "OWNED" : "ADQUIRIDO"}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap select-none">
                        <span className="inline-block text-[7px] font-mono font-bold px-1.5 py-0.5 rounded leading-none bg-zinc-950 text-zinc-650">
                          {lang === "en" ? "NOT OWNED" : "JAULA"}
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
                <p className="text-[9px] text-[#888] font-mono line-clamp-2 h-6 overflow-hidden leading-tight normal-case pr-1.5 mb-1.5">
                  {lang === "en" ? pet.descriptionEn : pet.descriptionPt}
                </p>
              </div>

              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between text-[7.5px] font-mono font-extrabold select-none">
                  {isActive ? (
                    <span className="text-purple-400 uppercase tracking-tight flex items-center gap-0.5 animate-pulse">
                      🐕 {lang === "en" ? "ON PATROL" : "EM PATRULHA"}
                    </span>
                  ) : isOwned ? (
                    <span className="text-amber-400 uppercase tracking-tight flex items-center gap-0.5">
                      💤 {lang === "en" ? "SLEEPING" : "DORMINDO"}
                    </span>
                  ) : !hasLevel ? (
                    <span className="text-amber-500 font-bold animate-pulse">
                      🔒 LVL {minLevel || pet.minLevel || 1}
                    </span>
                  ) : (
                    <span className="text-emerald-400 uppercase tracking-tight">
                      💵 {lang === "en" ? "AVAILABLE" : "DISPONÍVEL"}
                    </span>
                  )}
                </div>

                {/* Mini Stat display row of Pet Bonus */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-zinc-900/40 pt-2 text-zinc-400">
                  <div>
                    <span className="text-[7.5px] text-zinc-500 block font-bold uppercase leading-none mb-0.5">
                      {lang === "en" ? "BONUS" : "BÔNUS"}
                    </span>
                    <span className={`font-black ${pet.bonusType === "defense" ? "text-blue-400" : "text-emerald-400"} leading-none block`}>
                      +{currentBonus.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[7.5px] text-[#777] block font-bold uppercase leading-none mb-0.5">
                      {lang === "en" ? "PRICE" : "PREÇO"}
                    </span>
                    <span className="font-black text-zinc-200 leading-none block">
                      {formatMoney(dynamicCost)}
                    </span>
                  </div>
                </div>

                <div className="pt-1 select-none">
                  <div className="w-full py-0.5 text-center font-mono text-[7.5px] text-zinc-650 group-hover:text-purple-400 group-hover:border-purple-400/30 border border-zinc-900/10 rounded transition duration-200 bg-zinc-950/80 backdrop-blur-[2px]">
                    {isOwned ? (lang === "en" ? "⚡ TAP TRAIN" : "⚡ TREINAR") : (lang === "en" ? "⚡ TAP HIRE" : "⚡ CONTRATAR")}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPANION CONFIDENTIAL CABINET MODAL */}
      {createPortal(
        <AnimatePresence>
          {selectedPet && (() => {
            const pet = selectedPet;
            const isOwned = !!ownedPets[pet.id];
            const currentLevel = isOwned ? ownedPets[pet.id].level : 1;
            const isActive = activePetId === pet.id;
            const currentBonus = getBonusPercent(pet, currentLevel);
            const levelUpCost = getLevelUpCost(pet, currentLevel);
            const { cost: dynamicCost, minLevel, markupPercent } = getDynamicPetProps(pet, player);
            const hasLevel = player.level >= (minLevel || pet.minLevel || 1);
            const canAffordBuy = player.cash >= dynamicCost;
            const isPurchasable = hasLevel && canAffordBuy;
            const canAffordLevelUp = player.cash >= levelUpCost;
            const isMaxLevel = currentLevel >= pet.maxLevel;

            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" id="pet-info-modal">
                {/* Dark ambient blur background overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/85 backdrop-blur-md"
                  onClick={() => setSelectedPet(null)}
                />

                {/* Modal Container */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 15 }}
                  transition={{ type: "spring", duration: 0.4 }}
                  className="relative bg-[#0d0d11]/95 w-full max-w-sm rounded-3xl border border-purple-500/35 overflow-hidden shadow-[0_0_50px_rgba(147,51,234,0.15)] flex flex-col font-sans z-10"
                >
                  {/* Modal header details */}
                  <div className="p-5 border-b border-zinc-900/40 relative bg-gradient-to-b from-purple-950/15 via-transparent to-transparent">
                    <button
                      onClick={() => setSelectedPet(null)}
                      className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition p-1 bg-zinc-900/40 hover:bg-zinc-900 rounded-full cursor-pointer z-20"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-purple-955 bg-purple-950/40 border border-purple-500/50 text-purple-400 flex items-center justify-center text-4xl shadow-[0_4px_20px_rgba(147,51,234,0.15)] select-none">
                        {pet.avatar}
                      </div>
                      <div>
                        <h3 className="font-sans font-black text-sm text-zinc-100 tracking-tight uppercase">
                          {lang === "en" ? pet.nameEn : pet.namePt}
                        </h3>
                        <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block font-bold">
                          {pet.bonusType === "defense" 
                            ? (lang === "en" ? "🛡️ DEFENDER BEAST" : "🛡️ GUARDIÃO PROTETOR")
                            : (lang === "en" ? "⚡ CRIME ENHANCER" : "⚡ OPERAÇÕES TÁTICAS")
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
                        <span className="text-purple-400 font-extrabold uppercase animate-pulse flex items-center gap-1">
                          🚀 {lang === "en" ? "ON DECK" : "EM CAMPO"}
                        </span>
                      ) : isOwned ? (
                        <span className="text-amber-400 font-bold uppercase">
                          💤 {lang === "en" ? "RESERVED" : "RESERVADO"}
                        </span>
                      ) : (
                        <span className="text-zinc-650 uppercase font-bold">
                          🛒 {lang === "en" ? "DOCKED" : "JAULA"}
                        </span>
                      )}
                    </div>

                    {/* Profile Description */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono font-bold text-zinc-550 uppercase tracking-wider block">
                        {lang === "en" ? "INTELLIGENCE FILES" : "INTELIGÊNCIA MILITAR"}
                      </span>
                      <p className="text-xs text-zinc-350 leading-relaxed font-sans normal-case">
                        {lang === "en" ? pet.descriptionEn : pet.descriptionPt}
                      </p>
                    </div>

                    {/* Upgrades panel of training */}
                    <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 space-y-3 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">{lang === "en" ? "Training Cap" : "Treinamento"}</span>
                        <span className="font-black text-zinc-200">
                          {currentLevel} <span className="text-zinc-600 font-normal">/ {pet.maxLevel}</span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center border-t border-zinc-900/40 pt-2.5">
                        <span className="text-zinc-500">{lang === "en" ? "Effect Power" : "Efeito do Mascote"}</span>
                        <span className={`font-black ${pet.bonusType === "defense" ? "text-blue-400" : "text-emerald-400"}`}>
                          +{currentBonus.toFixed(1)}% {pet.bonusType === "defense" ? (lang === "en" ? "Defense" : "Defesa") : (lang === "en" ? "Crime Success" : "Sucesso de Crime")}
                        </span>
                      </div>

                      {isOwned && (
                        <div className="space-y-1.5 pt-1.5">
                          <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden relative">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${pet.bonusType === "defense" ? "bg-blue-500" : "bg-emerald-500"}`}
                              style={{ width: `${(currentLevel / pet.maxLevel) * 100}%` }}
                            />
                          </div>
                          <span className="text-[8.5px] text-zinc-600 font-sans block leading-none text-right">
                            {isMaxLevel ? (lang === "en" ? "MAX EXPERIENCE REACHED" : "MASCOTE TREINADO AO MÁXIMO") : (lang === "en" ? "TAP TRAIN TO BOOST EFFECT PERCENTAGE" : "UPGRADE DE NÍVEL AUMENTA O SEU EFFEITO")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Controls Footer Footer Container */}
                  <div className="p-5 border-t border-zinc-900/40 bg-zinc-950/50 flex flex-col gap-3">
                     {!isOwned ? (
                      <button
                        onClick={() => {
                          if (!isPurchasable) return;
                          playSound.cash();
                          onBuyPet(pet.id, dynamicCost);
                          setSelectedPet(null);
                        }}
                        disabled={!isPurchasable}
                        className={`w-full py-3.5 rounded-xl text-center font-mono text-xs font-black uppercase tracking-wider transition-all duration-300 relative overflow-hidden flex justify-between items-center px-4 ${
                          isPurchasable
                            ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg active:scale-95"
                            : "bg-zinc-900 text-zinc-650 cursor-not-allowed border border-zinc-850/10"
                        }`}
                      >
                        {!hasLevel ? (
                          <>
                            <span>🔒 {lang === "en" ? `REQUIRES LVL ${minLevel || pet.minLevel}` : `REQUER NÍVEL ${minLevel || pet.minLevel}`}</span>
                            <span>{formatMoney(dynamicCost)}</span>
                          </>
                        ) : (
                          <>
                            <span>💸 {lang === "en" ? "HIRE COMPANION" : "CONTRATAR COMPANHEIRO"}</span>
                            <span>{formatMoney(dynamicCost)}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-3.5">
                        {/* Active Toggle Button */}
                        <button
                          onClick={() => {
                            playSound.notification();
                            onToggleActivePet(pet.id);
                          }}
                          className={`w-full py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition ${
                            isActive
                              ? "bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 text-neutral-300"
                              : "bg-purple-950/10 hover:bg-purple-950/20 border border-purple-900/30 text-purple-400"
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {isActive
                            ? (lang === "en" ? "DISMISS" : "DISPENSAR")
                            : (lang === "en" ? "COMMAND" : "COMANDAR")}
                        </button>

                        {/* Upgrade Training level button */}
                        <button
                          onClick={() => {
                            if (isMaxLevel || !canAffordLevelUp) return;
                            playSound.cash();
                            onLevelUpPet(pet.id, levelUpCost);
                            // Keep modal open to show training update
                          }}
                          disabled={isMaxLevel || !canAffordLevelUp}
                          className={`w-full py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wide flex flex-col items-center justify-center transition border ${
                            isMaxLevel
                              ? "bg-zinc-900/20 border-zinc-900 text-zinc-600 cursor-not-allowed"
                              : canAffordLevelUp
                              ? "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-md active:scale-95 cursor-pointer"
                              : "bg-zinc-900/20 border-zinc-900 text-zinc-600 cursor-not-allowed"
                          }`}
                        >
                          {isMaxLevel ? (
                            <span>{lang === "en" ? "MAXIMUM" : "MÁXIMO"}</span>
                          ) : (
                            <>
                              <span className="flex items-center gap-1 leading-none font-extrabold">
                                <Plus className="w-3 h-3 stroke-[3]" />
                                {lang === "en" ? "TRAIN" : "TREINAR"}
                              </span>
                              <span className="text-[9px] font-normal leading-none mt-1 opacity-90">
                                {formatMoney(levelUpCost)}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedPet(null)}
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
