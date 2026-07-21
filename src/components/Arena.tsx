import React, { useState } from "react";
import { PlayerState, Opponent, OPPONENTS, CombatLog, SHOP_ITEMS, getActivePetBonus, PETS, GANGSTER_SKILLS, GangsterSkill } from "../types";
import { playSound } from "./AudioEngine";
import { Shield, Skull, Zap, Heart, Award, ArrowUp, Flame, Dumbbell, History, Users, Target, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import boxingRingSpriteImage from "../assets/images/boxing_ring_1782178212033.jpg";
import gymWeightsSpriteImage from "../assets/images/gym_weights_1782178222081.jpg";

interface ArenaProps {
  player: PlayerState;
  onTrainStats: (attribute: "strength" | "defense" | "intellect" | "willpower", energyCost: number, gainedPoints: number, costType?: "tp_energy" | "connection") => void;
  onExecuteCombat: (log: CombatLog, won: boolean, cashChange: number, respectGained: number, xpGained: number, energyCost: number) => void;
  lang: "en" | "pt";
  onUpdatePlayerState?: (updater: (prev: PlayerState) => PlayerState) => void;
  triggerAlert?: (msg: string, type?: "success" | "warn") => void;
  addGameLog?: (en: string, pt: string, type: any, icon: string) => void;
}

export default function Arena({ player, onTrainStats, onExecuteCombat, lang, onUpdatePlayerState, triggerAlert, addGameLog }: ArenaProps) {
  const [activeTab, setActiveTab] = useState<"gym" | "ring" | "skills">("ring");
  const [combatLog, setCombatLog] = useState<CombatLog | null>(null);
  const [isFighting, setIsFighting] = useState<boolean>(false);
  const [cooldownTicks, setCooldownTicks] = useState<number>(0);


  React.useEffect(() => {
    const timer = setInterval(() => {
      setCooldownTicks(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getBrtTimeUntilMidnight = () => {
    const nowLocal = new Date();
    // Getting current BRT time
    const brtString = nowLocal.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
    const brtDate = new Date(brtString);
    
    const endOfDayBrt = new Date(brtDate);
    endOfDayBrt.setHours(23, 59, 59, 999);
    
    let diff = endOfDayBrt.getTime() - brtDate.getTime();
    if (diff < 0) diff = 0;
    
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const ringSecondsLeft = player.ringCooldownUntil && player.ringCooldownUntil > Date.now()
    ? Math.ceil((player.ringCooldownUntil - Date.now()) / 1000)
    : 0;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  // Combat factors
  const hasAmmo = (player.ammo ?? 0) > 0;
  const hasFuel = (player.fuel ?? 0) > 0;
  const hasPetFood = (player.petFood ?? 0) > 0;

  const activeWeaponItem = SHOP_ITEMS.find((i) => i.id === player.activeWeapon);
  const activeVehicleItem = SHOP_ITEMS.find((i) => i.id === player.activeVehicle);

  // Skill ranks
  const ironFistLvl = (player.unlockedSkills && player.unlockedSkills["iron_fist"]) || 0;
  const kevlarArmorLvl = (player.unlockedSkills && player.unlockedSkills["kevlar_armor"]) || 0;
  const luckyBastardLvl = (player.unlockedSkills && player.unlockedSkills["lucky_bastard"]) || 0;

  const weaponBonusGained = (activeWeaponItem && hasAmmo) ? Math.round((activeWeaponItem.bonusStrength || 0) * (1 + ironFistLvl * 0.10)) : 0;
  const vehicleBonusGained = (activeVehicleItem && hasFuel) ? Math.round((activeVehicleItem.bonusDefense || 0) * (1 + kevlarArmorLvl * 0.10)) : 0;

  const playerAttack = player.strength + player.defense + player.intellect + player.willpower + weaponBonusGained;
  
  const petBonus = hasPetFood ? getActivePetBonus(player) : { type: null, value: 0 };
  let playerDefense = player.defense + vehicleBonusGained;
  if (petBonus.type === "defense") {
    playerDefense = Math.round(playerDefense * (1 + petBonus.value));
  }

  const handleTrain = (attr: "strength" | "defense" | "intellect" | "willpower", costType: "tp_energy" | "connection" = "tp_energy") => {
    if (costType === "tp_energy" && (player.trainingPoints ?? 100) < 1) return;
    if (costType === "connection" && (player.connections ?? 0) < 1) return;

    if (costType === "tp_energy") {
      const baseEnergyCost = 10;
      const energyDiscount = baseEnergyCost * luckyBastardLvl * 0.05;
      const energyCost = Math.max(5, Math.round(baseEnergyCost - energyDiscount));
      if (player.energy < energyCost) return;
      if (player.health < 1) return;
      playSound.trainStat();
      const bonusFromLevel = Math.floor(player.level / 6);
      const gain = Math.floor(Math.random() * 5) + 3 + bonusFromLevel;
      onTrainStats(attr, energyCost, gain, costType);
    } else {
      playSound.trainStat();
      const gain = Math.floor(Math.random() * 8) + 15 + Math.floor(player.level / 2); // Massive boost
      onTrainStats(attr, 0, gain, costType);
    }
  };

  const handleFight = (opponent: Opponent) => {
    const luckyDiscount = opponent.energyCost * luckyBastardLvl * 0.05;
    const fightEnergyCost = Math.max(5, Math.round(opponent.energyCost - luckyDiscount));

    if ((player.battlePoints ?? 100) < 1) return; // Must have battle points
    if (player.health < 20) return; // Must have at least 20 health to enter combat
    if (player.energy < fightEnergyCost) return; // Must have enough energy to duel
    setIsFighting(true);
    playSound.gunshot();


    const rounds = [];
    let playerHull = player.health;
    let enemyHull = opponent.health;
    let roundNum = 1;

    // Intelligence increases critical strikes odds (up to 25%)
    const critChancePlayer = Math.min(0.25, 0.05 + player.intellect * 0.001);
    const critChanceEnemy = 0.06;

    while (playerHull > 0 && enemyHull > 0 && roundNum <= 15) {
      // Calculate randomized multiplier
      const playerRoll = 0.75 + Math.random() * 0.5; // 0.75 to 1.25
      const enemyRoll = 0.75 + Math.random() * 0.5;

      const playerCrit = Math.random() < critChancePlayer;
      const enemyCrit = Math.random() < critChanceEnemy;

      let rawAttDmg = playerAttack * playerRoll - opponent.defense;
      if (playerCrit) rawAttDmg *= 2;
      const finalAttDmg = Math.max(12, Math.floor(rawAttDmg));

      let rawDefDmg = opponent.strength * enemyRoll - playerDefense;
      if (enemyCrit) rawDefDmg *= 2;
      const finalDefDmg = Math.max(8, Math.floor(rawDefDmg));

      enemyHull -= finalAttDmg;
      playerHull -= finalDefDmg;

      const textEn = `Round ${roundNum}: You fired a strike dealing ${finalAttDmg} damage${playerCrit ? " [CRITICAL!]" : ""}. ${opponent.name} retaliated dealing ${finalDefDmg} damage${enemyCrit ? " [CRITICAL!]" : ""}.`;
      const textPt = `Round ${roundNum}: Você descarregou disparos de ${finalAttDmg} de dano${playerCrit ? " [CRÍTICO!]" : ""}. ${opponent.name} retaliou causando ${finalDefDmg} de dano${enemyCrit ? " [CRÍTICO!]" : ""}.`;

      rounds.push({
        round: roundNum,
        attackerDamage: finalAttDmg,
        defenderDamage: finalDefDmg,
        attackerCrit: playerCrit,
        defenderCrit: enemyCrit,
        textEn,
        textPt
      });

      roundNum++;
    }

    const playerWon = enemyHull <= 0 && playerHull > 0;
    const winner = playerWon ? player.name : opponent.name;

    let lootCash = 0;
    let lootRespect = 0;
    let xpGained = 0;

    if (playerWon) {
      // Win reward: loot cash + respect + experience
      lootCash = Math.floor(Math.random() * (opponent.cashRewardMax - opponent.cashRewardMin + 1)) + opponent.cashRewardMin;
      lootRespect = opponent.respect;
      xpGained = opponent.level * 30 + 50;
    } else {
      // Loss penalty: player loses 50% of the raw pocket cash! (Mugged!)
      lootCash = -Math.floor(player.cash * 0.50);
      lootRespect = -Math.min(player.respect, Math.floor(player.respect * 0.05));
      xpGained = 15; // Small consolidation exp
    }

    const customLog: CombatLog = {
      attacker: player.name,
      defender: opponent.name,
      rounds,
      winner,
      lootCash,
      lootRespect,
      xpGained
    };

    setTimeout(() => {
      onExecuteCombat(customLog, playerWon, lootCash, lootRespect, xpGained, fightEnergyCost);
      setCombatLog(customLog);
      setIsFighting(false);
      if (playerWon) {
        playSound.crimeSuccess();
      } else {
        playSound.crimeFail();
      }
    }, 1200);
  };

  return (
    <div className="industrial-panel p-6 shadow-xl relative overflow-hidden" id="gym-arena-tab">
      <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
        <img 
          src={activeTab === "gym" ? gymWeightsSpriteImage : boxingRingSpriteImage} 
          alt="Arena Background" 
          className="w-full h-full object-cover mix-blend-screen"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"></div>
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-4 mb-6 gap-4">
        <div className="w-full md:w-auto">
          <h2 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Dumbbell className="w-5.5 h-5.5 text-red-500 animate-pulse" />
            {lang === "en" ? "Combat Arena & Heavy Training" : "Ringue de Combates & Treinos Pesados"}
          </h2>
          <p className="text-xs text-neutral-400 mt-1 font-sans">
            {lang === "en"
              ? "Duel syndicate enforcers in bloody rounds to claim territory, or burn excess muscle energy at the local gym."
              : "Duele contra capangas do submundo em rodadas sangrentas para saquear posses, ou treine no ginásio local."}
          </p>

          <div className="flex items-center gap-3 mt-3">
            <div className="px-3 py-1 bg-neutral-950 border border-red-900/30 rounded flex items-center gap-1.5 shadow-inner">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase">
                {lang === "en" ? "Battle Pts" : "Pontos Batalha"}
              </span>
              <span className="text-sm font-mono font-black text-red-400">
                {player.battlePoints ?? 100} <span className="text-[9px] text-neutral-500 font-normal">/ 100</span>
              </span>
            </div>
            
            <div className="px-3 py-1 bg-neutral-950 border border-amber-900/30 rounded flex items-center gap-1.5 shadow-inner">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase">
                {lang === "en" ? "Training Pts" : "Pontos Treino"}
              </span>
              <span className="text-sm font-mono font-black text-amber-500">
                {player.trainingPoints ?? 100} <span className="text-[9px] text-neutral-500 font-normal">/ 100</span>
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1">
              <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Next Reset:</span>
              <span className="text-xs font-mono font-black text-neutral-300">{getBrtTimeUntilMidnight()}</span>
            </div>
          </div>
          <div className="sm:hidden flex items-center gap-1.5 px-1 py-1 mt-1">
            <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase">Reset (BRT):</span>
            <span className="text-[11px] font-mono font-black text-neutral-300">{getBrtTimeUntilMidnight()}</span>
          </div>
        </div>

        {/* Action Toggle Switchers */}
        <div className="flex bg-neutral-950 p-1 rounded border border-neutral-800 overflow-x-auto whitespace-nowrap max-w-full scrollbar-none">
          <button 
            onClick={() => { playSound.notification(); setActiveTab("ring"); }}
            className={`px-3 sm:px-4 py-1.5 rounded text-xs font-mono font-bold transition-all ${activeTab === "ring" ? "bg-red-600 text-white shadow" : "text-neutral-400 hover:text-neutral-200"}`}
          >
            🥊 {lang === "en" ? "FIGHT RING" : "RINGUE DE LUTAS"}
          </button>
          <button 
            onClick={() => { playSound.notification(); setActiveTab("gym"); }}
            className={`px-3 sm:px-4 py-1.5 rounded text-xs font-mono font-bold transition-all ${activeTab === "gym" ? "bg-red-600 text-white shadow" : "text-neutral-400 hover:text-neutral-200"}`}
          >
            🏋️‍♂️ {lang === "en" ? "TRAINING GYM" : "GINÁSIO DE TREINO"}
          </button>
          <button 
            onClick={() => { playSound.notification(); setActiveTab("skills"); }}
            className={`px-3 sm:px-4 py-1.5 rounded text-xs font-mono font-bold transition-all ${activeTab === "skills" ? "bg-amber-600 text-white shadow" : "text-neutral-400 hover:text-neutral-200"}`}
          >
            ⭐ {lang === "en" ? "SKILLS" : "HABILIDADES"}
          </button>
        </div>
      </div>

      {/* Gym Training Section */}
      {activeTab === "gym" && (
        <div className="space-y-6 pt-2 font-sans select-none">
          <div className="bg-yellow-600/10 border border-yellow-600/30 text-yellow-200 text-xs p-3 rounded mb-2 flex gap-2">
            <span className="mt-0.5">🏋️‍♂️</span>
            <p className="leading-relaxed font-mono text-[11px]">
              <strong>{lang === "en" ? "GYM ADVISORY:" : "CONSELHO ESPORTIVO:"}</strong>{" "}
              {lang === "en"
                ? "Burning energy yields high skill growth. Boosting intellect increases critical hit strikes odds in duels, while willpower multiplies heist payouts!"
                : "Gastar energia treina seus atributos base. Aumentar intelecto eleva chances de críticos em combates, e força de vontade multiplica lucros de grandes golpes!"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Train Strength */}
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex justify-between items-center hover:border-neutral-700 transition">
              <div>
                <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                  🥊 {lang === "en" ? "Heavy Boxing Sandbags" : "Sacos de Pancada de Ferro"}
                </h4>
                <p className="text-[11px] text-neutral-400 leading-normal mt-1 max-w-sm">
                  {lang === "en" ? "Spar and improve combat punching power directly." : "Treine combinações pesadas para elevar sua força bruta no soco."}
                </p>
                <span className="text-[10px] font-mono font-bold text-red-500 mt-2 block">
                  {lang === "en" ? "CURRENT ATTACK:" : "ATAQUE ATUAL:"} {playerAttack}
                </span>
              </div>
              <button 
                onClick={() => handleTrain("strength")}
                disabled={player.energy < 10 || player.health < 1 || (player.trainingPoints ?? 100) < 1}
                className="bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-[10px] py-2 px-3.5 rounded transition disabled:opacity-45 disabled:cursor-not-allowed uppercase shrink-0 text-center"
              >
                -{lang === "en" ? "10 EN + 1 TP" : "10 EN + 1 TP"}
              </button>
            </div>

            {/* Train Defense */}
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex justify-between items-center hover:border-neutral-700 transition">
              <div>
                <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                  🛡️ {lang === "en" ? "Interlocking Defensive Drills" : "Táticas de Posicionamento e Esquiva"}
                </h4>
                <p className="text-[11px] text-neutral-400 leading-normal mt-1 max-w-sm">
                  {lang === "en" ? "Hone quick roll dodges and withstand direct ballistic strikes." : "Estude ângulos e táticas de defesa sob fogo inimigo cerrado."}
                </p>
                <span className="text-[10px] font-mono font-bold text-blue-400 mt-2 block">
                  {lang === "en" ? "CURRENT DEFENSE:" : "DEFESA ATUAL:"} {playerDefense}
                </span>
              </div>
              <button 
                onClick={() => handleTrain("defense")}
                disabled={player.energy < 10 || player.health < 1 || (player.trainingPoints ?? 100) < 1}
                className="bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-[10px] py-2 px-3.5 rounded transition disabled:opacity-45 disabled:cursor-not-allowed uppercase shrink-0 text-center"
              >
                -{lang === "en" ? "10 EN + 1 TP" : "10 EN + 1 TP"}
              </button>
            </div>

            {/* Train Intellect */}
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg flex justify-between items-center hover:border-neutral-700 transition">
              <div>
                <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                  🧠 {lang === "en" ? "High Stakes Tactical Chess" : "Xadrez Tático Subterrâneo"}
                </h4>
                <p className="text-[11px] text-neutral-400 leading-normal mt-1 max-w-sm">
                  {lang === "en" ? "Outsmart competitors and boost critical hit chance." : "Pratique xadrez rápido para aumentar seu QI e chances de crítico."}
                </p>
                <span className="text-[10px] font-mono font-bold text-violet-400 mt-2 block">
                  {lang === "en" ? "CURRENT INTELLECT:" : "INTELECTO ATUAL:"} {player.intellect}
                </span>
              </div>
              <button 
                onClick={() => handleTrain("intellect")}
                disabled={player.energy < 10 || player.health < 1 || (player.trainingPoints ?? 100) < 1}
                className="bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-[10px] py-2 px-3.5 rounded transition disabled:opacity-45 disabled:cursor-not-allowed uppercase shrink-0 text-center"
              >
                -{lang === "en" ? "10 EN + 1 TP" : "10 EN + 1 TP"}
              </button>
            </div>
          </div>

          {/* Premium Chemist Section */}
          <div className="mt-8 border border-purple-900/50 rounded-xl overflow-hidden shadow-2xl shadow-purple-900/10">
            <div className="bg-gradient-to-r from-purple-950 to-neutral-950 px-5 py-3 border-b border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧪</span>
                <div>
                  <h3 className="text-sm font-bold font-mono text-purple-300 uppercase tracking-widest hidden sm:block">
                    {lang === "en" ? "Underground Chemist" : "Laboratório do Químico"}
                  </h3>
                  <p className="text-[10px] font-mono text-purple-400/80 uppercase">
                    {lang === "en" ? "+ MASSIVE STATS BOOST" : "+ GANHOS ENORMES DE STATUS"}
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 bg-purple-950/80 border border-purple-500/30 rounded-lg flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                <span className="text-[10px] uppercase font-mono font-bold text-purple-200">
                  {lang === "en" ? "Connections:" : "Conexões:"}
                </span>
                <span className="text-xs font-mono font-black text-purple-400">🔗 {player.connections ?? 0}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 bg-neutral-950">
              
              <div className="p-4 border-b sm:border-b-0 sm:border-r border-purple-900/40 hover:bg-purple-950/20 transition flex flex-col justify-between group">
                <div>
                  <h4 className="text-xs font-mono font-bold text-purple-300 mb-1">💪 {lang === "en" ? "Steroids" : "Esteroides"}</h4>
                  <p className="text-[10px] text-neutral-400 leading-tight mb-3">
                    {lang === "en" ? "Synthesized highly concentrated anabolics for ridiculous raw attack power." : "Anabolizantes super concentrados para ganho absurdo de força de ataque."}
                  </p>
                </div>
                <button 
                  onClick={() => handleTrain("strength", "connection")}
                  disabled={(player.connections ?? 0) < 1}
                  className="w-full bg-purple-900/60 hover:bg-purple-600 text-white font-mono font-bold text-[10px] py-2 px-3 rounded uppercase border border-purple-500/40 hover:border-purple-400 transition-all disabled:opacity-45 disabled:cursor-not-allowed group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                   {lang === "en" ? "-1 Connection" : "-1 Conexão"}
                </button>
              </div>

              <div className="p-4 border-b sm:border-b-0 sm:border-r border-purple-900/40 hover:bg-purple-950/20 transition flex flex-col justify-between group">
                <div>
                  <h4 className="text-xs font-mono font-bold text-purple-300 mb-1">🛡️ {lang === "en" ? "Cannabidiol" : "Canabidiol CBD"}</h4>
                  <p className="text-[10px] text-neutral-400 leading-tight mb-3">
                    {lang === "en" ? "Premium CBD to nullify pain. Massive permanent increase to defense." : "Óleo premium puro de CBD. Adormece a dor e eleva a defesa brutalmente."}
                  </p>
                </div>
                <button 
                  onClick={() => handleTrain("defense", "connection")}
                  disabled={(player.connections ?? 0) < 1}
                  className="w-full bg-purple-900/60 hover:bg-purple-600 text-white font-mono font-bold text-[10px] py-2 px-3 rounded uppercase border border-purple-500/40 hover:border-purple-400 transition-all disabled:opacity-45 disabled:cursor-not-allowed group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                   {lang === "en" ? "-1 Connection" : "-1 Conexão"}
                </button>
              </div>

              <div className="p-4 hover:bg-purple-950/20 transition flex flex-col justify-between group">
                <div>
                  <h4 className="text-xs font-mono font-bold text-purple-300 mb-1">🧠 {lang === "en" ? "Amphetamines" : "Anfetaminas"}</h4>
                  <p className="text-[10px] text-neutral-400 leading-tight mb-3">
                    {lang === "en" ? "Neuro-enhancers for unmatched focus and tactical intellect calculation." : "Nootrópicos pesados para hiper-foco tático militar. Aumenta Intelecto."}
                  </p>
                </div>
                <button 
                  onClick={() => handleTrain("intellect", "connection")}
                  disabled={(player.connections ?? 0) < 1}
                  className="w-full bg-purple-900/60 hover:bg-purple-600 text-white font-mono font-bold text-[10px] py-2 px-3 rounded uppercase border border-purple-500/40 hover:border-purple-400 transition-all disabled:opacity-45 disabled:cursor-not-allowed group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                   {lang === "en" ? "-1 Connection" : "-1 Conexão"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Duel Combat Ring */}
      {activeTab === "ring" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Opponents Grid board */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-red-950/10 border border-red-900/30 text-red-200 text-xs p-3 rounded flex gap-2 font-mono">
              <span className="mt-0.5">🚨</span>
              <p className="leading-snug">
                <strong>{lang === "en" ? "MUGGING RISK:" : "RISCO DE ASSALTO:"}</strong>{" "}
                {lang === "en"
                  ? "Defeat triggers raw cash blocks loot. However, losing duels penalties you is brutal: rivals will mug 50% of your wallet pocket cash!"
                  : "Derrotar rivais rouba sua grana. Mas cuidado: perder lutas faz com que levem embora 50% de todo seu dinheiro em mãos!"}
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {OPPONENTS.map((opp) => {
                const hasSufficientHealth = player.health >= 20;
                const hasSufficientEnergy = player.energy >= opp.energyCost;
                const isCooldownActive = ringSecondsLeft > 0;
                const canFight = hasSufficientHealth && hasSufficientEnergy && !isCooldownActive;

                return (
                  <div 
                    key={opp.id}
                    className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-2xl shadow-inner uppercase">
                        {opp.avatar}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                          {opp.name}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${opp.difficulty === "easy" ? "bg-emerald-950 text-emerald-400" : opp.difficulty === "normal" ? "bg-blue-950 text-blue-400" : opp.difficulty === "hard" ? "bg-amber-950 text-amber-500" : "bg-red-950 text-red-500 animate-pulse border border-red-800/40"}`}>
                            {opp.difficulty}
                          </span>
                        </h4>
                        <div className="flex gap-x-3 text-[10px] text-neutral-400 font-mono mt-1">
                          <span>Attack: {opp.strength}</span>
                          <span>Defense: {opp.defense}</span>
                          <span>HP: {opp.health}</span>
                        </div>
                      </div>
                    </div>
 
                    <div className="flex items-center gap-4 border-t sm:border-0 border-neutral-900 pt-3 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-[10px] font-mono text-neutral-500 leading-tight">
                        <p>{lang === "en" ? "Loot potential:" : "Saque Estimado:"}</p>
                        <p className="text-emerald-400 font-semibold">{formatMoney(opp.cashRewardMin)} - {formatMoney(opp.cashRewardMax)}</p>
                        <p className="text-amber-500 font-bold mt-1 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                          <span>{lang === "en" ? `${opp.energyCost} Energy` : `${opp.energyCost} Energia`}</span>
                        </p>
                      </div>
 
                      <button 
                        onClick={() => handleFight(opp)}
                        disabled={isFighting || !canFight}
                        className={`px-4 py-2 rounded text-xs font-mono font-bold uppercase transition shadow-lg ${canFight && !isFighting ? "bg-red-600 hover:bg-red-500 text-white" : "bg-neutral-850 text-neutral-600 cursor-not-allowed border border-neutral-900"}`}
                      >
                        {isFighting 
                          ? (lang === "en" ? "FIGHTING..." : "DUELANDO...") 
                          : isCooldownActive
                            ? `${ringSecondsLeft}s`
                            : player.health < 20 
                              ? (lang === "en" ? "LOW VITAL" : "SAÚDE BAIXA") 
                              : player.energy < opp.energyCost
                                ? (lang === "en" ? "NO ENERGY" : "SEM ENERGIA")
                                : (lang === "en" ? "DUEL" : "DUELAR")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Combat Log details panel */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-mono uppercase text-red-500 tracking-wider flex items-center gap-1.5 border-b border-neutral-800 pb-2 mb-3">
                <History className="w-3.5 h-3.5" />
                {lang === "en" ? "Tactical Engagement Feed" : "Ficha de Confrontos Recentes"}
              </h3>

              {isFighting && (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-400 text-xs font-mono gap-3 select-none">
                  <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
                  <p className="animate-pulse">{lang === "en" ? "EXCHANGING BALLISTICS..." : "TROCANDO TIROTEIO..."}</p>
                </div>
              )}

              {!isFighting && !combatLog && (
                <div className="py-16 text-center text-neutral-600 text-xs font-mono select-none">
                  🔍 {lang === "en" ? "Ready for combat. Select target on left." : "Aguardando duelo. Selecione o alvo."}
                </div>
              )}

              {!isFighting && combatLog && (
                <div className="space-y-3">
                  <div className={`p-3 rounded border text-xs font-mono leading-relaxed ${combatLog.winner === player.name ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300" : "bg-red-950/20 border-red-500/30 text-red-300"}`}>
                    <p className="font-bold uppercase tracking-wide mb-1 text-[11px]">
                      {combatLog.winner === player.name ? (lang === "en" ? "VICTORY ACHIEVED" : "VITÓRIA DETECTADA") : (lang === "en" ? "DUEL DEFEAT" : "DERROTA CONSIGNADA")}
                    </p>
                    <p>
                      {combatLog.winner === player.name 
                        ? (lang === "en" ? `You slaughtered ${combatLog.defender} and escaped containing the loot.` : `Você aniquilou ${combatLog.defender} e fugiu com os espólios carregados.`)
                        : (lang === "en" ? `You were overwhelmed by ${combatLog.defender}. Your defense crashed.` : `Você foi subjugado por ${combatLog.defender}. Suas armaduras caíram.`)}
                    </p>
                    <div className="mt-2 pt-1 border-t border-neutral-800/60 text-[10px] space-y-0.5">
                      <p className={combatLog.lootCash >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                        {combatLog.lootCash >= 0 ? `+ ${formatMoney(combatLog.lootCash)} Cash Loot` : `- ${formatMoney(Math.abs(combatLog.lootCash))} MUGGED PENALTY`}
                      </p>
                      <p>+ {combatLog.xpGained} XP</p>
                      <p className={combatLog.lootRespect >= 0 ? "text-indigo-400" : "text-red-400"}>
                        {combatLog.lootRespect >= 0 ? `+ ${combatLog.lootRespect} Respect Points` : `- ${Math.abs(combatLog.lootRespect)} Respect Lost`}
                      </p>
                    </div>
                  </div>

                  {/* Staggered Scroll log */}
                  <div className="max-h-56 overflow-y-auto bg-neutral-900 border border-neutral-800 p-2.5 rounded text-[10px] font-mono text-neutral-400 space-y-1.5 scrollbar-thin">
                    {combatLog.rounds.map((r, idx) => (
                      <p key={idx} className="border-b border-neutral-950 pb-1 last:border-0 leading-snug">
                        {lang === "en" ? r.textEn : r.textPt}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gangster Skills Section */}
      {activeTab === "skills" && (
        <div className="space-y-6 pt-2 select-none" id="gangster-skills-tab">
          <div className="bg-amber-600/10 border border-amber-600/30 text-amber-200 text-xs p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold font-mono text-[13px] flex items-center gap-1.5 uppercase">
                ⭐ {lang === "en" ? "Gangster Skill Upgrades" : "Habilidades de Gangster"}
              </h3>
              <p className="text-neutral-400 font-sans text-[11px] leading-relaxed">
                {lang === "en"
                  ? "Spend your available Skill Points to permanently bolster your stats and activate passive multipliers. Earn +1 Skill Point for every building purchased, built, or upgraded in your Metropole!"
                  : "Gaste seus Pontos de Habilidade para aprimorar atributos permanentes e bônus táticos. Ganhe +1 Ponto por lote adquirido, construído ou promovido na Metrópole!"}
              </p>
            </div>
            <div className="bg-neutral-950 px-4 py-2 rounded-lg border border-amber-500/30 text-center shrink-0 w-full sm:w-auto">
              <span className="block text-[9px] uppercase font-mono text-neutral-400 font-bold tracking-wider">
                {lang === "en" ? "Skill Points" : "Pontos de Habilidade"}
              </span>
              <span className="text-xl font-mono font-black text-amber-400 animate-pulse">
                {player.skillPoints || 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="skills-grid">
            {GANGSTER_SKILLS.map((skill) => {
              const currentLvl = (player.unlockedSkills && player.unlockedSkills[skill.id]) || 0;
              const isMax = currentLvl >= skill.maxLevel;
              const canUpgrade = (player.skillPoints || 0) >= 1 && !isMax;

              return (
                <div 
                  key={skill.id}
                  id={`skill-card-${skill.id}`}
                  className={`bg-neutral-950 border ${isMax ? "border-amber-500/35 shadow-[0_0_15px_rgba(245,158,11,0.05)]" : "border-neutral-800 hover:border-neutral-700"} p-4 rounded-xl flex flex-col justify-between transition relative overflow-hidden group`}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full filter blur-xl group-hover:bg-amber-500/10 transition-all pointer-events-none"></div>
                  
                  <div className="space-y-2 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl filter drop-shadow select-none">{skill.emoji}</span>
                        <div>
                          <h4 className="text-xs font-bold font-mono text-neutral-100 uppercase tracking-wide">
                            {lang === "en" ? skill.nameEn : skill.namePt}
                          </h4>
                          <span className="text-[9px] font-mono text-amber-500 font-bold">
                            LV {currentLvl} / {skill.maxLevel}
                          </span>
                        </div>
                      </div>
                      {isMax && (
                        <span className="text-[8px] font-mono bg-emerald-950 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase">
                          MAX
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-neutral-400 leading-normal min-h-[30px]">
                      {lang === "en" ? skill.descEn : skill.descPt}
                    </p>

                    <div className="bg-neutral-900/60 p-2 rounded-lg border border-neutral-900 text-[9px] font-mono space-y-1">
                      <div className="flex justify-between items-center text-neutral-400">
                        <span>{lang === "en" ? "Passive Effect:" : "Efeito Passivo:"}</span>
                        <span className="text-neutral-200 font-bold text-right text-amber-400">
                          {lang === "en" ? skill.effectEn : skill.effectPt}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-500 pt-1 border-t border-neutral-950">
                        <span>{lang === "en" ? "Permanent Stat gain:" : "Melhoria de Atributo:"}</span>
                        <span className="text-emerald-400 font-semibold">
                          {skill.id === "iron_fist" && "+10 Strength"}
                          {skill.id === "kevlar_armor" && "+10 Defense"}
                          {skill.id === "syndicate_brain" && "+10 Intellect"}
                          {skill.id === "lucky_bastard" && "+10 Willpower"}
                          {skill.id === "money_launderer" && "+15% Business Cash"}
                          {skill.id === "street_overlord" && "-20% Wanted Rate"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={!canUpgrade}
                    id={`upgrade-skill-btn-${skill.id}`}
                    onClick={() => {
                      if (!canUpgrade) return;
                      onUpdatePlayerState?.((prev) => {
                        const unlocked = { ...prev.unlockedSkills };
                        const nextLvl = (unlocked[skill.id] || 0) + 1;
                        unlocked[skill.id] = nextLvl;

                        let extraStrength = 0;
                        let extraDefense = 0;
                        let extraIntellect = 0;
                        let extraWillpower = 0;
                        if (skill.id === "iron_fist") extraStrength = 10;
                        else if (skill.id === "kevlar_armor") extraDefense = 10;
                        else if (skill.id === "syndicate_brain") extraIntellect = 10;
                        else if (skill.id === "lucky_bastard") extraWillpower = 10;

                        return {
                          ...prev,
                          skillPoints: Math.max(0, (prev.skillPoints || 0) - 1),
                          unlockedSkills: unlocked,
                          strength: prev.strength + extraStrength,
                          defense: prev.defense + extraDefense,
                          intellect: prev.intellect + extraIntellect,
                          willpower: Math.min(100, prev.willpower + extraWillpower)
                        };
                      });
                      playSound.cash();
                      triggerAlert?.(
                        lang === "en"
                          ? `Upgraded ${skill.nameEn} to level ${currentLvl + 1}!`
                          : `Melhorou ${skill.namePt} para o nível ${currentLvl + 1}!`,
                        "success"
                      );
                      addGameLog?.(
                        `Invested 1 Skill Point to upgrade ${skill.nameEn} (Rank ${currentLvl + 1})`,
                        `Investiu 1 Ponto de Habilidade para aprimorar ${skill.namePt} (Nível ${currentLvl + 1})`,
                        "system",
                        skill.emoji
                      );
                    }}
                    className={`w-full mt-4 py-2 rounded text-[10px] font-mono font-bold uppercase transition flex items-center justify-center gap-1.5 ${
                      canUpgrade
                        ? "bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-950/25 active:scale-95"
                        : isMax
                          ? "bg-neutral-900 text-neutral-500 cursor-not-allowed border border-neutral-850"
                          : "bg-neutral-900 text-neutral-600 cursor-not-allowed border border-neutral-950"
                    }`}
                  >
                    <span>
                      {isMax 
                        ? (lang === "en" ? "Fully Mastered" : "DOMÍNIO MÁXIMO") 
                        : (lang === "en" ? "UPGRADE SKILL (-1 SP)" : "APRIMORAR (-1 PONTO)")}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
