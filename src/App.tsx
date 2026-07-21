/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { PlayerState, Crime, OrganizedHeist, GameItem, SHOP_ITEMS, DRUGS, NEIGHBORHOODS, CombatLog, GameLog, getLevelTitle, PETS, getActivePetBonus, VIP_COMPANIONS, VIPCompanion, getDynamicItemProps, getDynamicPetProps, generateDailyMissions, incrementDailyMission } from "./types";
import { playSound } from "./components/AudioEngine";
import Dashboard from "./components/Dashboard";
import Crimes from "./components/Crimes";
import BlackMarket from "./components/BlackMarket";
import Arsenal from "./components/Arsenal";
import Arena from "./components/Arena";
import Leaderboard from "./components/Leaderboard";
import LogsFeed from "./components/LogsFeed";
import InteractiveCard from "./components/InteractiveCard";
import MyPossessions from "./components/MyPossessions";
import Metropole from "./components/Metropole";
import IsometricCityMap from "./components/IsometricCityMap";
import neighborhoodBrooklynSpriteImage from "./assets/images/brooklyn_neon_1782535745007.jpg";
import neighborhoodManhattanSpriteImage from "./assets/images/manhattan_neon_1782535762567.jpg";
import neighborhoodQueensSpriteImage from "./assets/images/queens_neon_1782535772151.jpg";
import shopSprite from "./assets/images/shop_neon_1782535828821.jpg";
import crimesSprite from "./assets/images/crimes_neon_1782535806643.jpg";
import contrabandSprite from "./assets/images/contraband_neon_1782535819377.jpg";
import metropoleSprite from "./assets/images/metropole_neon_1782535875712.jpg";
import arenaSprite from "./assets/images/arena_neon_1782535857147.jpg";
import leaderSprite from "./assets/images/leader_neon_1782535866284.jpg";
import possessionsSprite from "./assets/images/possessions_neon_1782535886396.jpg";
import type { LucideIcon } from "lucide-react";

import { 
  Skull, Zap, Heart, Award, Flame, ShoppingBag, 
  Dumbbell, Sun, Moon, Landmark, LogOut, CheckSquare, 
  HelpCircle, ShieldAlert, Coins, RefreshCw, Layers,
  ScrollText, Mail, BookOpen, Users, Target, Shield, Info, X, ChevronRight, Clock, Compass, DollarSign, Activity, Settings, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const SAVE_KEY = "street_mobster_save_v1";

const initialPlayerState: PlayerState = {
  name: "",
  level: 1,
  exp: 0,
  expNext: 120,
  respect: 100,
  energy: 100,
  maxEnergy: 100,
  health: 100,
  maxHealth: 100,
  cash: 1200,
  bank: 0,
  strength: 10,
  defense: 10,
  intellect: 10,
  willpower: 10,
  location: "brooklyn",
  weapons: [],
  activeWeapon: null,
  vehicles: [],
  activeVehicle: null,
  realEstate: [],
  crimesCommitted: 0,
  fightsWon: 0,
  fightsLost: 0,
  heistCooldowns: {},
  drugsInventory: {},
  lastUpdate: Date.now(),
  heat: 0,
  contamination: 0,
  pets: {},
  activePet: null,
  travelCooldownUntil: 0,
  ringCooldownUntil: 0,
  intoxicationCuredCount: 0,
  policeImmuneUntil: 0,
  connections: 0,
  battlePoints: 100,
  trainingPoints: 100,
  lastPointsReset: Date.now(),
  connectionPrice: 300000,
  taxDebt: 0,
  skillPoints: 0,
  unlockedSkills: {},
  dailyMissions: []
};

let lastAlertMsg = "";
let lastAlertTime = 0;
let lastLogMsg = "";
let lastLogTime = 0;

export default function App() {
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [savedProfile, setSavedProfile] = useState<PlayerState | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showWipeConfirm, setShowWipeConfirm] = useState<boolean>(false);
  const [selectedArchetype, setSelectedArchetype] = useState<string>("enforcer");
  const [floatingPopups, setFloatingPopups] = useState<Array<{ id: number; text: string; color: string; x: number; y: number }>>([]);
  const prevPlayerRef = React.useRef<PlayerState | null>(null);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);

  const [drugPrices, setDrugPrices] = useState<Record<string, number>>({});
  const [tempUsername, setTempUsername] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("street_mobster_night_mode");
    return saved !== null ? saved === "true" : true;
  });
  const [lang, setLang] = useState<"en" | "pt">("pt");
  const [energyAlertEnabled, setEnergyAlertEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("street_mobster_energy_alert");
    return saved !== null ? saved === "true" : true;
  });
  const [activeTab, setActiveTab] = useState<"dash" | "crimes" | "traffic" | "shop" | "arena" | "leader" | "possessions" | "metropole">("dash");
  const [newContractIndicator, setNewContractIndicator] = useState<boolean>(false);
  const [smugglersBonusActive, setSmugglersBonusActive] = useState<boolean>(false);
  const [pulseCash, setPulseCash] = useState<boolean>(false);
  const [pulseHealth, setPulseHealth] = useState<boolean>(false);
  const [mobileActiveView, setMobileActiveView] = useState<"game" | "status" | "locais">("game");
  const [mobileSlideDirection, setMobileSlideDirection] = useState<"left" | "right">("right");
  const [lastMobileActiveView, setLastMobileActiveView] = useState<"game" | "status" | "locais">("game");

  if (mobileActiveView !== lastMobileActiveView) {
    const viewsOrder = ["status", "game", "locais"];
    const prevIdx = viewsOrder.indexOf(lastMobileActiveView);
    const currentIdx = viewsOrder.indexOf(mobileActiveView);
    if (prevIdx !== -1 && currentIdx !== -1) {
      setMobileSlideDirection(currentIdx > prevIdx ? "right" : "left");
    }
    setLastMobileActiveView(mobileActiveView);
  }
  const [shopSubTab, setShopSubTab] = useState<"equipment" | "empire" | "hospital" | "pets" | "precinct">("equipment");
  const [appAlerts, setAppAlerts] = useState<{ id: string; msg: string; type: "success" | "warn" }[]>([]);
  const [hudGlow, setHudGlow] = useState<"cash" | "level" | null>(null);
  const [hudOpacity, setHudOpacity] = useState<number>(0.95);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [useIsometricMap, setUseIsometricMap] = useState<boolean>(true);
  const [dividendCooldown, setDividendCooldown] = useState<number>(() => {
    return Number(localStorage.getItem("mobster_city_dividend_cooldown") || "240");
  });

  const [globalBribesPaid, setGlobalBribesPaid] = useState<number>(() => {
    return Number(localStorage.getItem("mobster_city_total_bribes_paid") || "842912");
  });
  const [globalCaymanDeposits, setGlobalCaymanDeposits] = useState<number>(() => {
    return Number(localStorage.getItem("mobster_city_total_cayman_deposits") || "12400000");
  });

  const [levelUpModalData, setLevelUpModalData] = useState<{
    level: number;
    title: string;
    strengthGain: number;
    defenseGain: number;
    intellectGain: number;
    luckGain: number;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem("street_mobster_energy_alert", String(energyAlertEnabled));
  }, [energyAlertEnabled]);

  useEffect(() => {
    localStorage.setItem("street_mobster_night_mode", String(isNightMode));
  }, [isNightMode]);

  // Auto-detect player state modifications to animate floating RPG-style rewards
  useEffect(() => {
    if (!player) {
      if (player === null) {
        prevPlayerRef.current = null;
      }
      return;
    }

    const prev = prevPlayerRef.current;
    if (prev && prev.name === player.name) {
      const popupsToAdd: Array<{ text: string; color: string }> = [];

      // Cash Gain / Loss
      if (player.cash !== prev.cash) {
        const diff = player.cash - prev.cash;
        if (diff > 0) {
          popupsToAdd.push({ text: `+$${diff.toLocaleString()}`, color: "text-emerald-400 font-extrabold drop-shadow-[0_2px_8px_rgba(52,211,153,0.45)] border-emerald-500/20" });
          setHudGlow("cash");
          setTimeout(() => setHudGlow(curr => curr === "cash" ? null : curr), 1500);

          // Check if cash increased by more than 10%
          const pctIncrease = prev.cash > 0 ? (diff / prev.cash) * 100 : 100;
          if (pctIncrease > 10) {
            setPulseCash(true);
            setTimeout(() => setPulseCash(false), 1200);
          }
        } else if (diff < 0) {
          popupsToAdd.push({ text: `-$${Math.abs(diff).toLocaleString()}`, color: "text-rose-500 font-bold drop-shadow-[0_2px_6px_rgba(239,68,68,0.3)] border-rose-500/10" });
        }
      }

      // Bank Vault
      if (player.bank !== prev.bank) {
        const diff = player.bank - prev.bank;
        if (diff > 0) {
          popupsToAdd.push({ text: `+$${diff.toLocaleString()} (BANK)`, color: "text-blue-400 font-bold drop-shadow-[0_2px_6px_rgba(96,165,250,0.3)] border-blue-500/15" });
        } else if (diff < 0) {
          popupsToAdd.push({ text: `-$${Math.abs(diff).toLocaleString()} (BANK)`, color: "text-amber-600 font-semibold border-amber-500/10" });
        }
      }

      // Experience Points
      if (player.exp !== prev.exp) {
        const diff = player.exp - prev.exp;
        if (diff > 0) {
          popupsToAdd.push({ text: `+${diff} EXP ★`, color: "text-indigo-400 font-extrabold drop-shadow-[0_2px_8px_rgba(129,140,248,0.4)] border-indigo-500/25" });
        }
      }

      // Respect / Street Cred
      if (player.respect !== prev.respect) {
        const diff = player.respect - prev.respect;
        if (diff > 0) {
          popupsToAdd.push({ text: `+${diff} RESPECT 👑`, color: "text-amber-400 font-black drop-shadow-[0_2px_8px_rgba(251,191,36,0.45)] border-amber-550/30" });
        } else if (diff < 0) {
          popupsToAdd.push({ text: `-${Math.abs(diff)} RESPECT`, color: "text-red-400/80 font-bold" });
        }
      }

      // Health Points
      if (player.health !== prev.health) {
        const diff = player.health - prev.health;
        if (diff > 0) {
          popupsToAdd.push({ text: `+${diff} HP 🩸`, color: "text-green-400 font-extrabold drop-shadow-[0_2px_6px_rgba(74,222,128,0.3)]" });

          // Check if health increased by more than 10%
          const pctIncrease = prev.health > 0 ? (diff / prev.health) * 100 : 100;
          if (pctIncrease > 10 || diff > 10) {
            setPulseHealth(true);
            setTimeout(() => setPulseHealth(false), 1200);
          }
        } else if (diff < 0) {
          popupsToAdd.push({ text: `-${Math.abs(diff)} HP 🩸`, color: "text-red-650 text-red-500 font-black animate-ping drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]" });
        }
      }

      // Energy 
      if (player.energy !== prev.energy) {
        const diff = player.energy - prev.energy;
        if (diff > 0) {
          popupsToAdd.push({ text: `+${diff} ENERGY ⚡`, color: "text-yellow-400 font-bold drop-shadow-[0_2px_6px_rgba(250,204,21,0.35)]" });
        } else if (diff < 0) {
          popupsToAdd.push({ text: `${diff} ENERGY ⚡`, color: "text-zinc-500 font-bold text-[11px]" });
        }

        if (player.energy >= player.maxEnergy && prev.energy < player.maxEnergy && diff <= 30) {
          if (energyAlertEnabled) {
            triggerAlert(
              lang === "en" 
                ? "Energy has reached 100% full capacity! Ready for operations." 
                : "Sua energia foi totalmente recuperada para 100%! Pronto para as missões.", 
              "success"
            );
          }
        }
      }

      // Player level upper thresholds
      if (player.level !== prev.level) {
        const diff = player.level - prev.level;
        if (diff > 0) {
          popupsToAdd.push({ 
            text: `⭐ LEVEL UP! REACHED LVL ${player.level} ⭐`, 
            color: "text-yellow-300 font-black text-sm tracking-wider bg-yellow-950/40 border border-yellow-500/40 py-1.5 px-3 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.4)] animate-bounce" 
          });
          setHudGlow("level");
          setTimeout(() => setHudGlow(curr => curr === "level" ? null : curr), 3000);
          
          setLevelUpModalData({
            level: player.level,
            title: getLevelTitle(player.level, lang),
            strengthGain: player.strength - prev.strength > 0 ? player.strength - prev.strength : 5,
            defenseGain: player.defense - prev.defense > 0 ? player.defense - prev.defense : 5,
            intellectGain: player.intellect - prev.intellect > 0 ? player.intellect - prev.intellect : 2,
            luckGain: player.willpower - prev.willpower > 0 ? player.willpower - prev.willpower : 2
          });
        }
      }

      // Attributes Upgrades
      if (player.strength !== prev.strength) {
        const diff = player.strength - prev.strength;
        if (diff > 0) {
          popupsToAdd.push({ text: `+${diff} STRENGTH 👊`, color: "text-orange-400 font-black border-orange-500/20 drop-shadow-[0_2px_6px_rgba(249,115,22,0.35)]" });
        }
      }
      if (player.defense !== prev.defense) {
        const diff = player.defense - prev.defense;
        if (diff > 0) {
          popupsToAdd.push({ text: `+${diff} DEFENSE 🛡️`, color: "text-blue-400 font-black border-blue-500/20 drop-shadow-[0_2px_6px_rgba(59,130,246,0.35)]" });
        }
      }
      if (player.intellect !== prev.intellect) {
        const diff = player.intellect - prev.intellect;
        if (diff > 0) {
          popupsToAdd.push({ text: `+${diff} INTELLECT 🧠`, color: "text-cyan-400 font-black border-cyan-500/20 drop-shadow-[0_2px_6px_rgba(34,211,238,0.35)]" });
        }
      }
      if (player.willpower !== prev.willpower) {
        const diff = player.willpower - prev.willpower;
        if (diff > 0) {
          popupsToAdd.push({ text: `+${diff} LUCK 🍀`, color: "text-amber-400 font-black border-amber-500/20 drop-shadow-[0_2px_6px_rgba(245,158,11,0.35)]" });
        }
      }

      if (popupsToAdd.length > 0) {
        popupsToAdd.forEach((p, idx) => {
          setTimeout(() => {
            const id = Math.random() + Date.now();
            setFloatingPopups((current) => [
              ...current,
              {
                id,
                text: p.text,
                color: p.color,
                x: (Math.random() * 80) - 40, 
                y: (Math.random() * 40) - 20, 
              }
            ]);
            // Purge popup after animation wraps up
            setTimeout(() => {
              setFloatingPopups((current) => current.filter((item) => item.id !== id));
            }, 1400);
          }, idx * 110);
        });
      }
    }

    prevPlayerRef.current = player;
  }, [player]);

  const navigateAndScroll = (
    tab: "dash" | "crimes" | "traffic" | "shop" | "arena" | "leader" | "possessions" | "metropole",
    subTab?: "equipment" | "empire" | "hospital" | "pets" | "precinct"
  ) => {
    setActiveTab(tab);
    if (subTab) {
      setShopSubTab(subTab);
    }
    setMobileActiveView("game");
    setTimeout(() => {
      if (window.innerWidth < 1024) {
        document.getElementById("main-tab-nav")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 50);
  };

   const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [bonusSeconds, setBonusSeconds] = useState<number>(1357); // 22 minutes 37 seconds default
  const [inboxOpen, setInboxOpen] = useState<boolean>(false);
  const [advisorOpen, setAdvisorOpen] = useState<boolean>(false);
  const [isHospitalOpen, setIsHospitalOpen] = useState<boolean>(false);
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);
  const [isPrecinctOpen, setIsPrecinctOpen] = useState<boolean>(false);
  const [dashSubTab, setDashSubTab] = useState<"dossier" | "patrimonio" | "rua">("dossier");
  const [isHudStatsExpanded, setIsHudStatsExpanded] = useState<boolean>(false);
  const [isHudMinimized, setIsHudMinimized] = useState<boolean>(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);
  const [modalBankAmount, setModalBankAmount] = useState<string>("");
  const [animatedLoots, setAnimatedLoots] = useState<{ id: string; amount: number; x: number; y: number }[]>([]);

  const spawnLootAnimation = (amount: number, x?: number, y?: number) => {
    if (amount <= 0 || !x || !y) return;
    const dropId = Math.random().toString(36).substring(2, 9);
    setAnimatedLoots((prev) => [...prev, { id: dropId, amount, x, y }]);
    setTimeout(() => {
      setAnimatedLoots((prev) => prev.filter((i) => i.id !== dropId));
    }, 2500);
  };

  const [policeEvent, setPoliceEvent] = useState<{
    id: "street_stop" | "precinct_warrant";
    titleEn: string;
    titlePt: string;
    descEn: string;
    descPt: string;
    bribeCost: number;
    bailCost: number;
    willpowerChance: number;
    defenseChance: number;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setBonusSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    // Real-time ticking interval for Cayman dividends
    const interval = setInterval(() => {
      setGlobalCaymanDeposits((prev) => {
        // Ticks up realistically in real-time ($5 to $35)
        const bonus = Math.floor(Math.random() * 31) + 5;
        const next = prev + bonus;
        localStorage.setItem("mobster_city_total_cayman_deposits", String(next));
        return next;
      });
    }, 1800); // Ticks every 1.8s
    return () => clearInterval(interval);
  }, []);

  // Real-time ticking interval for Business & Swiss Vault Dividends
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setDividendCooldown((prev) => {
        const next = prev > 1 ? prev - 1 : 0;
        localStorage.setItem("mobster_city_dividend_cooldown", String(next));
        
        if (next === 0) {
          // Trigger Payday!
          setPlayer((prevPlayer) => {
            if (!prevPlayer) return null;

            // 1. Sum up real estate passive income
            let passiveIncomeGained = 0;
            prevPlayer.realEstate.forEach((propId) => {
              const pItem = SHOP_ITEMS.find((item) => item.id === propId);
              if (pItem?.passiveIncome) {
                passiveIncomeGained += pItem.passiveIncome;
              }
            });

            // Feed extra passive income from active constructed street slots
            if (prevPlayer.streetSlots) {
              prevPlayer.streetSlots.forEach((slot: any) => {
                if (slot.purchased && slot.buildingId) {
                  if (slot.buildingId === "hotel") {
                    passiveIncomeGained += (slot.level || 1) * 350;
                  } else if (slot.buildingId === "office") {
                    passiveIncomeGained += (slot.level || 1) * 120;
                  } else {
                    passiveIncomeGained += (slot.level || 1) * 60; // other factories small income
                  }
                }
              });
            }

            // 2. Swiss bank passive interest: 0.35%
            const bankYield = Math.floor(prevPlayer.bank * 0.0035);
            const totalReceived = passiveIncomeGained + bankYield;

            // 3. Dynamic progressive bank tax on current bank deposit
            let taxAccrued = 0;
            const bankVal = prevPlayer.bank;
            if (bankVal > 0) {
              if (bankVal <= 50000) {
                taxAccrued = Math.floor(bankVal * 0.012); // 1.2% realistic tax
              } else if (bankVal <= 250000) {
                taxAccrued = Math.floor(50000 * 0.012 + (bankVal - 50000) * 0.018); // 1.8% realistic tax
              } else if (bankVal <= 1000000) {
                taxAccrued = Math.floor(50000 * 0.012 + 200000 * 0.018 + (bankVal - 250000) * 0.026); // 2.6% realistic tax
              } else {
                taxAccrued = Math.floor(50000 * 0.012 + 200000 * 0.018 + 750000 * 0.026 + (bankVal - 1000000) * 0.038); // 3.8% realistic tax
              }
            }

            const currentTaxDebt = prevPlayer.taxDebt ?? 0;
            const nextTaxDebt = currentTaxDebt + taxAccrued;

            const moneyFormatter = (val: number) => `$${val.toLocaleString()}`;

            // Play cash sound if any transactions occurred
            if (totalReceived > 0 || taxAccrued > 0) {
              playSound.cash();
            }

            if (taxAccrued > 0) {
              setTimeout(() => {
                triggerAlert(
                  lang === "en"
                    ? `⚠️ TAX SERVICE: Assessed Swiss Underworld Tax of ${moneyFormatter(taxAccrued)} on your hidden balance. Total Debt: ${moneyFormatter(nextTaxDebt)}`
                    : `⚠️ NOTIFICAÇÃO FISCAL: Cobrado ${moneyFormatter(taxAccrued)} de impostos federais sobre o saldo. Dívida total: ${moneyFormatter(nextTaxDebt)}`,
                  "warn"
                );
              }, 600);

              addGameLog(
                `Underworld Tax assessed on Cayman bank deposits: tax debt increased by +${moneyFormatter(taxAccrued)}.`,
                `Fiscalização de Ativos Federais: imposto cobrado sobre saldo de depósitos confiscados. Dívida subiu em +${moneyFormatter(taxAccrued)}.`,
                "bank",
                "⚖️"
              );
            }

            if (totalReceived > 0) {
              triggerAlert(
                lang === "en"
                  ? `💸 PAYDAY! Gained ${moneyFormatter(totalReceived)} (${moneyFormatter(passiveIncomeGained)} Immobile Sales + ${moneyFormatter(bankYield)} Swiss Interest)`
                  : `💸 DIA DE RESGATE! Faturou ${moneyFormatter(totalReceived)} (${moneyFormatter(passiveIncomeGained)} de Imóveis + ${moneyFormatter(bankYield)} de Juros do Banco)`,
                "success"
              );

              addGameLog(
                `Payday cycle complete: Gained +${moneyFormatter(totalReceived)} passive dividend revenue!`,
                `Ciclo de dividendos concluído: Faturou +${moneyFormatter(totalReceived)} de faturamento passivo de negócios!`,
                "bank",
                "💸"
              );
            }

            return {
              ...prevPlayer,
              cash: prevPlayer.cash + totalReceived,
              taxDebt: nextTaxDebt
            };
          });

          // Reset to 240 seconds
          localStorage.setItem("mobster_city_dividend_cooldown", "240");
          return 240;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [player, lang]);

  const trackBribePayment = (cost: number) => {
    if (cost <= 0) return;
    setGlobalBribesPaid((prev) => {
      const next = prev + cost;
      localStorage.setItem("mobster_city_total_bribes_paid", String(next));
      return next;
    });
  };

  const trackBankDeposit = (amt: number) => {
    if (amt <= 0) return;
    setGlobalCaymanDeposits((prev) => {
      const next = prev + amt;
      localStorage.setItem("mobster_city_total_cayman_deposits", String(next));
      return next;
    });
  };

  const addGameLog = (
    textEn: string, 
    textPt: string, 
    type: "crime" | "heist" | "combat" | "travel" | "market" | "shop" | "bank" | "level" | "system" | "bonus", 
    icon: string = "✨"
  ) => {
    const now = Date.now();
    if (textEn === lastLogMsg && now - lastLogTime < 50) return;
    lastLogMsg = textEn;
    lastLogTime = now;

    const newLog: GameLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      textEn,
      textPt,
      type,
      icon
    };
    setGameLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 50);
      localStorage.setItem("street_mobster_logs", JSON.stringify(updated));
      return updated;
    });
  };

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    let initialLocation = "brooklyn";
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const safeProfile = { ...initialPlayerState, ...parsed };
        
        // Ensure arrays and objects expected to exist are at least empty instead of undefined/null from old saves
        safeProfile.weapons = safeProfile.weapons || [];
        safeProfile.vehicles = safeProfile.vehicles || [];
        safeProfile.realEstate = safeProfile.realEstate || [];
        safeProfile.prostitutes = safeProfile.prostitutes || [];
        safeProfile.heistCooldowns = safeProfile.heistCooldowns || {};
        safeProfile.drugsInventory = safeProfile.drugsInventory || {};
        safeProfile.pets = safeProfile.pets || {};
        safeProfile.laboratoryDrugs = safeProfile.laboratoryDrugs || {};
        safeProfile.skillPoints = safeProfile.skillPoints ?? 0;
        safeProfile.unlockedSkills = safeProfile.unlockedSkills || {};
        safeProfile.dailyMissions = (safeProfile.dailyMissions && safeProfile.dailyMissions.length > 0) ? safeProfile.dailyMissions : generateDailyMissions();

        setSavedProfile(safeProfile);
        setTermsAccepted(true);
        if (parsed.location) {
          initialLocation = parsed.location;
        }
        if (parsed.totalBribesPaid) {
          setGlobalBribesPaid((prev) => {
            const val = Math.max(prev, parsed.totalBribesPaid + 842912);
            localStorage.setItem("mobster_city_total_bribes_paid", String(val));
            return val;
          });
        }
        if (parsed.totalBankDeposits) {
          setGlobalCaymanDeposits((prev) => {
            const val = Math.max(prev, parsed.totalBankDeposits + 12400000);
            localStorage.setItem("mobster_city_total_cayman_deposits", String(val));
            return val;
          });
        }
      } catch (err) {
        localStorage.removeItem(SAVE_KEY);
      }
    }
    // Generate initial drug rates
    generateDrugPrices(initialLocation);

    // Load recent activity logs
    const savedLogs = localStorage.getItem("street_mobster_logs");
    if (savedLogs) {
      try {
        setGameLogs(JSON.parse(savedLogs));
      } catch (e) {
        setGameLogs([]);
      }
    } else {
      const initialLogs: GameLog[] = [
        {
          id: "sys_1",
          timestamp: Date.now() - 3600000,
          textEn: "Mobster syndicate network operational. Welcome to your Brooklyn empire turf, Boss.",
          textPt: "Rede do sindicato de Gangsters ativa. Bem-vindo ao território do Brooklyn, Chefão.",
          type: "system",
          icon: "🌐"
        },
        {
          id: "sys_2",
          timestamp: Date.now() - 1800000,
          textEn: "Intelligence report: Rival syndicates are actively scouting the Bronx transit stations.",
          textPt: "Boletim de Inteligência: Facções rivais estão monitorando as docas e linhas de tráfego do Bronx.",
          type: "system",
          icon: "🚨"
        }
      ];
      setGameLogs(initialLogs);
      localStorage.setItem("street_mobster_logs", JSON.stringify(initialLogs));
    }
  }, []);

  // Save to local storage on state adjustments (AUTOSAVE SYSTEM)
  useEffect(() => {
    if (player) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(player));
      setSavedProfile(player);
    }
  }, [player]);

  // Periodic passive energy & health recovery tick (Every 15s)
  useEffect(() => {
    if (!player) return;
    const timer = setInterval(() => {
      setPlayer((prev) => {
        if (!prev) return null;
        
        // As requested by user, health and energy no longer regenerate automatically over time
        const nextEnergy = prev.energy;
        const nextHealth = prev.health;

        // Decay active police interest (Heat Wanted)
        const isImmune = prev.policeImmuneUntil && prev.policeImmuneUntil > Date.now();
        const currentHeat = isImmune ? 0 : (prev.heat ?? 0);
        let nextHeat = isImmune ? 0 : Math.max(0, currentHeat - 2.0); // decrease heat passively over time

        const unpaidTaxes = prev.taxDebt ?? 0;
        // User requested that unpaid taxes don't passively generate heat directly anymore.
        // It now only doubles the risk factor in actions (which is handled elsewhere).

        // Decay active contamination/drug toxicity passively over time
        const currentContom = prev.contamination ?? 0;
        const nextContamination = Math.max(0, currentContom - 1.5);

        // Auto bank interest bonus (+0.05% of bank holdings per tick!)
        let bankBonus = 0;
        if (prev.bank > 0) {
          bankBonus = Math.floor(prev.bank * 0.0005);
        }

        // Check for daily points reset (Brazil Time / Sao Paulo)
        const now = new Date();
        const nowBrtStr = now.toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'});
        const savedBrtStr = new Date(prev.lastPointsReset || Date.now()).toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'});
        
        let resetBp = prev.battlePoints ?? 100;
        let resetTp = prev.trainingPoints ?? 100;
        let lastPointsReset = prev.lastPointsReset ?? Date.now();
        let dailyMissions = prev.dailyMissions || [];

        if (nowBrtStr !== savedBrtStr || dailyMissions.length === 0) {
          resetBp = 100;
          resetTp = 100;
          lastPointsReset = now.getTime();
          dailyMissions = generateDailyMissions();
        }

        return {
          ...prev,
          energy: nextEnergy,
          health: nextHealth,
          bank: prev.bank + bankBonus,
          heat: nextHeat,
          contamination: nextContamination,
          battlePoints: resetBp,
          trainingPoints: resetTp,
          lastPointsReset: lastPointsReset,
          dailyMissions: dailyMissions,
          lastUpdate: Date.now()
        };
      });
    }, 15000);

    return () => clearInterval(timer);
  }, [player]);

  // Track heist cooldown expirations to notify the player
  const activeCooldownsTrackerRef = React.useRef<Record<string, number>>({});

  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const currentCooldowns = player.heistCooldowns || {};

      let hasExpired = false;

      // Check all registered cooldowns in our tracker
      Object.entries(activeCooldownsTrackerRef.current).forEach(([heistId, val]) => {
        const cooldownAt = val as number;
        if (now >= cooldownAt) {
          hasExpired = true;
          delete activeCooldownsTrackerRef.current[heistId];
        }
      });

      if (hasExpired && activeTab !== "crimes") {
        setNewContractIndicator(true);
      }

      // Also, update the tracker with any NEW active cooldowns in player state
      Object.entries(currentCooldowns).forEach(([heistId, val]) => {
        const cooldownAt = val as number;
        if (cooldownAt > now) {
          activeCooldownsTrackerRef.current[heistId] = cooldownAt;
        } else {
          delete activeCooldownsTrackerRef.current[heistId];
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [player, activeTab]);

  const generateDrugPrices = (targetLocation?: string, isSmuggledFerry = false) => {
    const prices: Record<string, number> = {};
    const loc = targetLocation || player?.location || "brooklyn";

    setSmugglersBonusActive(isSmuggledFerry && loc === "staten_island");

    DRUGS.forEach((d) => {
      let baseMultMin = 0.45;
      let baseMultMax = 1.95;

      // Apply distinct neighborhood market rules
      if (loc === "brooklyn") {
        // Brooklyn is balanced and stable
        baseMultMin = 0.85;
        baseMultMax = 1.25;
        if (d.id === "weed" || d.id === "skunk") {
          // Local green is cheaper
          baseMultMin = 0.65;
          baseMultMax = 0.95;
        }
      } else if (loc === "bronx") {
        // Bronx has extremely high volatility! Huge swings!
        baseMultMin = 0.35;
        baseMultMax = 2.45;
        if (d.id === "meth" || d.id === "pills") {
          // Heavy synthetics of the Bronx are highly volatile
          baseMultMin = 0.25;
          baseMultMax = 2.85;
        }
      } else if (loc === "queens") {
        // Queens is a diverse, residential bargain area
        baseMultMin = 0.75;
        baseMultMax = 1.45;
        if (d.id === "lanca_perfume" || d.id === "weed") {
          baseMultMin = 0.55;
          baseMultMax = 1.15;
        }
      } else if (loc === "manhattan") {
        // Manhattan has luxury high demand. Prices are extremely high!
        baseMultMin = 1.25;
        baseMultMax = 2.15;
        if (d.id === "cocaine" || d.id === "heroin" || d.id === "ice_extraction" || d.id === "crumble") {
          // Elite luxury stimulants/opiates sell at massive premium!
          baseMultMin = 1.65;
          baseMultMax = 3.25;
        }
      } else if (loc === "staten_island") {
        if (isSmuggledFerry) {
          // 'Smuggler's Bonus' - even deeper base price crash/discounts! Extremely cheap cargo!
          baseMultMin = 0.12;
          baseMultMax = 0.38;
        } else {
          // Staten Island is smugglers' safe harbor. Highly discounted cargos!
          baseMultMin = 0.35;
          baseMultMax = 0.85;
          // Perfect for stocking up cheaply, especially weed, skunk, and pills
          if (d.id === "weed" || d.id === "skunk" || d.id === "pills") {
            baseMultMin = 0.3;
            baseMultMax = 0.7;
          }
        }
      } else if (loc === "suburbio") {
        // Suburb is poor, dirty. Weed, cocaine, and lanca perfume have dynamic streets demand state.
        baseMultMin = 0.6;
        baseMultMax = 1.25;
        if (d.id === "weed" || d.id === "cocaine" || d.id === "lanca_perfume") {
          // Dynamic market state: 55% chance high demand, 45% chance saturation or clean up sweeps
          const isSaturated = Math.random() < 0.45;
          if (isSaturated) {
            baseMultMin = 0.45;
            baseMultMax = 0.85;
          } else {
            baseMultMin = 1.6;
            baseMultMax = 3.4;
          }
        }
      }

      const mult = baseMultMin + Math.random() * (baseMultMax - baseMultMin);
      const calculated = Math.round(d.basePrice * mult);
      prices[d.id] = Math.max(d.minPrice, Math.min(d.maxPrice, calculated));
    });

    // Random market spikes & crashes (approx 20% chance) to add massive excitement
    const rollSpecial = Math.random();
    if (rollSpecial < 0.20 && DRUGS.length > 0) {
      const luckyIndex = Math.floor(Math.random() * DRUGS.length);
      const chosenDrug = DRUGS[luckyIndex];
      const isShortage = Math.random() < 0.5;

      if (isShortage) {
        // Price skyrocketed (1.9x to 3.5x multiplier)
        const currentVal = prices[chosenDrug.id] || chosenDrug.basePrice;
        prices[chosenDrug.id] = Math.max(chosenDrug.minPrice, Math.min(chosenDrug.maxPrice, Math.round(currentVal * (1.9 + Math.random() * 1.6))));
        
        const locName = loc === "bronx" ? (lang === "en" ? "The Bronx" : "O Bronx") : loc.charAt(0).toUpperCase() + loc.slice(1);
        setTimeout(() => {
          triggerAlert(
            lang === "en"
              ? `🚨 SUPPLY CRASH in ${locName}! ${chosenDrug.nameEn} price skyrocketed due to tight police crackdowns!`
              : `🚨 QUEBRA DE ESTOQUE no ${locName}! O preço de ${chosenDrug.namePt} decolou devido à escassez!`,
            "warn"
          );
        }, 800);
      } else {
        // Market crash (cheap deals!) (0.25x to 0.45x)
        const currentVal = prices[chosenDrug.id] || chosenDrug.basePrice;
        prices[chosenDrug.id] = Math.max(chosenDrug.minPrice, Math.min(chosenDrug.maxPrice, Math.round(currentVal * (0.25 + Math.random() * 0.2))));
        
        const locName = loc === "bronx" ? (lang === "en" ? "The Bronx" : "O Bronx") : loc.charAt(0).toUpperCase() + loc.slice(1);
        setTimeout(() => {
          triggerAlert(
            lang === "en"
              ? `🌿 EXCESS COURIERS in ${locName}! Smugglers oversupplied ${chosenDrug.nameEn}! Prices bottomed out!`
              : `🌿 EXCESSOS DE CARGA no ${locName}! Traficantes canibais inundaram o mercado com ${chosenDrug.namePt}! Preço caiu no chão!`,
            "success"
          );
        }, 800);
      }
    }

    setDrugPrices(prices);
  };

  const triggerAlert = (msg: string, type: "success" | "warn" = "success") => {
    const now = Date.now();
    if (msg === lastAlertMsg && now - lastAlertTime < 50) return;
    lastAlertMsg = msg;
    lastAlertTime = now;

    const id = Math.random().toString(36).substring(2, 9);
    setAppAlerts(prev => [...prev, { id, msg, type }]);
    
    if (soundEnabled) {
      if (type === "success") playSound.notification();
      else playSound.crimeFail();
    }
    
    setTimeout(() => {
      setAppAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 4500);
  };

  // Auth flow: Login or Registration with Archetype bonuses
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = tempUsername.trim();
    if (!cleanName) {
      setLoginError(lang === "en" ? "Enter your Mobster Name first!" : "Determine seu codinome de Gangster!");
      return;
    }

    if (authMode === "register" && !termsAccepted) {
      setLoginError(lang === "en" ? "You must accept the terms of use first!" : "Você precisa aceitar os Termos de uso!");
      return;
    }

    // Special test user bypass: OGADM Level 100 with $1,000,000 cash
    if (cleanName.toUpperCase() === "OGADM") {
      const adminState: PlayerState = {
        ...initialPlayerState,
        name: "OGADM",
        level: 100,
        exp: 0,
        expNext: 999999,
        respect: 100000,
        energy: 1000,
        maxEnergy: 1000,
        health: 1200,
        maxHealth: 1200,
        cash: 1000000,
        bank: 5000000,
        strength: 500,
        defense: 500,
        intellect: 500,
        willpower: 500,
        location: "brooklyn",
      };
      setPlayer(adminState);
      localStorage.setItem(SAVE_KEY, JSON.stringify(adminState));
      setSavedProfile(adminState);
      playSound.cash();
      triggerAlert(lang === "en" ? "ADMIN ACCESS GRANTED: Welcome OGADM!" : "ACESSO ADMIN CONCEDIDO: Bem-vindo OGADM!");
      generateDrugPrices("brooklyn");
      addGameLog(
        `Admin system login established for test user ${adminState.name} [Level: ${adminState.level}].`,
        `Ficha administrativa master estabelecida para o usuário de teste ${adminState.name} [Nível: ${adminState.level}].`,
        "system",
        "👑"
      );
      return;
    }

    if (authMode === "login") {
      // Check if it's the saved character
      if (savedProfile && savedProfile.name.toLowerCase() === cleanName.toLowerCase()) {
        setPlayer(savedProfile);
        playSound.cash();
        triggerAlert(lang === "en" ? `Welcome back, Boss ${savedProfile.name}!` : `Bem-vindo de volta, Chefão ${savedProfile.name}!`);
        generateDrugPrices(savedProfile.location || "brooklyn");
        addGameLog(
          `Dossier re-established for Boss ${savedProfile.name}. Connecting active nodes in ${savedProfile.location.toUpperCase()}...`,
          `Dossiê reestabelecido para o Chefão ${savedProfile.name}. Conectando células ativas do bairro ${savedProfile.location.toUpperCase()}...`,
          "system",
          "📡"
        );
        return;
      }
      
      // Force registration: Login only works for already registered profiles (savedProfile)
      if (savedProfile) {
        setLoginError(
          lang === "en"
            ? `Dossier '${cleanName}' not found. An active dossier exists for '${savedProfile.name}' on this system, or create/register a new character.`
            : `Dossiê '${cleanName}' não encontrado. Existe um gângster salvo com o nome '${savedProfile.name}' neste sistema, ou crie/registre uma nova ficha.`
        );
      } else {
        setLoginError(
          lang === "en"
            ? "No active dossier found. You must register/create a new character first before connecting!"
            : "Nenhum gângster registrado neste sistema. Você precisa primeiro criar/registrar uma nova ficha!"
        );
      }
    } else {
      // Register Mode with selected archetype
      let customizedInitial = { ...initialPlayerState };
      if (selectedArchetype === "enforcer") {
        customizedInitial.strength = 18;
      } else if (selectedArchetype === "hustler") {
        customizedInitial.cash = 1800;
      } else if (selectedArchetype === "ghost") {
        customizedInitial.defense = 18;
      } else if (selectedArchetype === "don") {
        customizedInitial.respect = 180;
      }

      const state: PlayerState = {
        ...customizedInitial,
        name:干净TypeName(cleanName)
      };
      // let Name processing helper to make sure characters format cleanly
      function 干净TypeName(val: string) {
        return val.replace(/[^a-zA-Z0-9_\-\s]/g, "");
      }
      
      setPlayer(state);
      playSound.cash();
      triggerAlert(lang === "en" ? `Welcome to the streets, ${state.name}!` : `Bem-vindo às ruas da Máfia, ${state.name}!`);
      generateDrugPrices("brooklyn");
      
      const archetypeLabel = 
        selectedArchetype === "enforcer" ? (lang === "en" ? "Enforcer" : "Capanga") :
        selectedArchetype === "hustler" ? (lang === "en" ? "Hustler" : "Traficante") :
        selectedArchetype === "ghost" ? (lang === "en" ? "Ghost" : "Invisível") : (lang === "en" ? "Don" : "Padrinho");

      addGameLog(
        `New dossier created for ${state.name} [Class: ${archetypeLabel}]. Connected successfully to the Underworld Syndicate.`,
        `Novo dossiê criado para ${state.name} [Classe: ${archetypeLabel}]. Conectado com sucesso ao Sindicato da Máfia.`,
        "system",
        "📡"
      );
    }
  };

  // Resume saved campaign handler
  const handleResumeActiveDossier = () => {
    if (!savedProfile) return;
    setPlayer(savedProfile);
    playSound.cash();
    triggerAlert(lang === "en" ? `Welcome back, Boss ${savedProfile.name}!` : `Bem-vindo de volta, Chefão ${savedProfile.name}!`);
    generateDrugPrices(savedProfile.location || "brooklyn");
    addGameLog(
      `Dossier re-established for Boss ${savedProfile.name}. Connecting active nodes in ${savedProfile.location.toUpperCase()}...`,
      `Dossiê reestabelecido para o Chefão ${savedProfile.name}. Conectando células ativas do bairro ${savedProfile.location.toUpperCase()}...`,
      "system",
      "📡"
    );
  };

  // Solo Crime implementation
  const handleSoloCrime = (crime: Crime, rolledSuccess: boolean, lootAmount: number, x?: number, y?: number) => {
    if (!player) return;

    if (rolledSuccess && lootAmount > 0 && x && y) {
      spawnLootAnimation(lootAmount, x, y);
    }

    const isImmune = player.policeImmuneUntil && player.policeImmuneUntil > Date.now();
    const isSurveilled = player.underSurveillanceUntil && player.underSurveillanceUntil > Date.now();
    let addedHeat = isImmune
      ? 0
      : (rolledSuccess 
        ? Math.max(3, Math.round(crime.energyCost * 1.4)) 
        : Math.max(6, Math.round(crime.energyCost * 2.1)));
    if ((isSurveilled || (player.taxDebt !== undefined && player.taxDebt > 0)) && !isImmune) addedHeat *= 2;

    setPlayer((prev) => {
      if (!prev) return null;
      let nextLevel = prev.level;
      let nextExp = prev.exp;
      let nextExpNext = prev.expNext;
      let nextRespect = prev.respect;

      if (rolledSuccess) {
        nextExp += crime.rewardExp;
        nextRespect += crime.rewardRespect;

        // Log crime success
        addGameLog(
          `Solo Crime Success: ${crime.nameEn}! Plundered $${lootAmount.toLocaleString()} cash and gained +${crime.rewardExp} EXP / +${crime.rewardRespect} Respect.`,
          `Crime bem-sucedido: ${crime.namePt}! Saqueou $${lootAmount.toLocaleString()} de dinheiro e ganhou +${crime.rewardExp} EXP / +${crime.rewardRespect} pontos de Respeito.`,
          "crime",
          "🚨"
        );

        // Level Up calculations
        if (nextExp >= nextExpNext) {
          nextLevel += 1;
          nextExp = nextExp - nextExpNext;
          nextExpNext = Math.floor(nextExpNext * 1.35) + 100;
          
          // Boost Vital capacities
          const nextMaxEnergy = prev.maxEnergy + 10;
          const nextMaxHealth = prev.maxHealth + 10;

          setTimeout(() => {
            triggerAlert(
              lang === "en" 
                ? `🏆 RANK INCREASED! You are now Level ${nextLevel}! Attributes boosted!` 
                : `🏆 PATENTE AUMENTOU! Você subiu para o Nível ${nextLevel}! Seus limites vitais aumentaram!`,
              "success"
            );
          }, 600);

          addGameLog(
            `🏆 LEVEL UP! Reached Level ${nextLevel}! Vitals capacity expanded!`,
            `🏆 PATENTE ELEVADA! Subiu para o Nível ${nextLevel}! Limites vitais expandidos!`,
            "level",
            "⭐"
          );

          const updated = {
            ...prev,
            level: nextLevel,
            exp: nextExp,
            expNext: nextExpNext,
            respect: nextRespect + 250, // bonus respect for level up
            energy: nextMaxEnergy,
            maxEnergy: nextMaxEnergy,
            health: nextMaxHealth,
            maxHealth: nextMaxHealth,
            strength: prev.strength + 5,
            defense: prev.defense + 5,
            intellect: prev.intellect + 2,
            willpower: prev.willpower + 2,
            cash: prev.cash + lootAmount,
            crimesCommitted: prev.crimesCommitted + 1,
            heat: Math.min(100, (prev.heat ?? 0) + addedHeat)
          };
          return incrementDailyMission(updated, "crime_1", 1);
        }

        const updated = {
          ...prev,
          energy: prev.energy - crime.energyCost,
          cash: prev.cash + lootAmount,
          respect: nextRespect,
          exp: nextExp,
          crimesCommitted: prev.crimesCommitted + 1,
          heat: Math.min(100, (prev.heat ?? 0) + addedHeat)
        };
        return incrementDailyMission(updated, "crime_1", 1);
      } else {
        // failed
        addGameLog(
          `Solo Crime Failure: ${crime.nameEn}! Spotted sirens, escaping shortly. Wasted ${crime.energyCost} Energy and heat increased.`,
          `Fracasso no crime: ${crime.namePt}! Avistou sirens no beco e fugiu rápido. Perdeu ${crime.energyCost} de energia. Heat aumentado.`,
          "crime",
          "💀"
        );
        return {
          ...prev,
          energy: prev.energy - crime.energyCost,
          heat: Math.min(100, (prev.heat ?? 0) + addedHeat)
        };
      }
    });

    // Check for random police confrontation trigger
    setTimeout(() => {
      setPlayer((curr) => {
        if (!curr) return null;
        if (curr.policeImmuneUntil && curr.policeImmuneUntil > Date.now()) return curr;
        const currentHeat = curr.heat ?? 0;
        if (currentHeat < 12) return curr;

        // Trigger likelihood based on active heat levels (up to 33% at max heat)
        const encounterChance = currentHeat * 0.33;
        if (Math.random() * 100 < encounterChance) {
          playSound.notification();
          const isSweep = Math.random() < 0.35 || currentHeat > 60;

          setPoliceEvent({
            id: isSweep ? "precinct_warrant" : "street_stop",
            titleEn: isSweep ? "🚨 SPECIAL WARRANT LOCKDOWN RAID!" : "🚨 ROUTINE PATROL ENCOUNTER",
            titlePt: isSweep ? "🚨 INVASÃO DE MANDADO ESCRITO TÁTICO!" : "🚨 ENCONTRO COM PATRULHA ROUTINA",
            descEn: isSweep 
              ? `An SWAT task force squad launched a coordinated precinct warrant sweep at your hideout!`
              : `Routine patrol officers cornered you! They are inspecting IDs and eyeing your wallet bags suspiciously.`,
            descPt: isSweep 
              ? `A SWAT liderou um cerco tático de surpresa sob mandado preventivo em seu esconderijo!`
              : `Oficiais em ronda rotineira encurralaram você! Eles estão verificando fichas e pedindo identificação.`,
            bribeCost: Math.floor(curr.level * 220 + 350),
            bailCost: Math.max(300, Math.floor(curr.cash * (isSweep ? 0.20 : 0.10))),
            willpowerChance: Math.min(85, 30 + curr.willpower * 0.6),
            defenseChance: Math.min(85, isSweep ? (20 + curr.intellect * 0.75) : (25 + curr.defense * 0.65))
          });
        }
        return curr;
      });
    }, 1200);
  };

  // Organized Heist implementation
  const handleExecuteHeist = (heist: OrganizedHeist, rolledSuccess: boolean, lootAmount: number, x?: number, y?: number) => {
    if (!player) return;

    if (rolledSuccess && lootAmount > 0 && x && y) {
      spawnLootAnimation(lootAmount, x, y);
    }

    // Apply specific cool-down
    const cooldownAt = Date.now() + heist.cooldownSeconds * 1000;
    const isImmune = player.policeImmuneUntil && player.policeImmuneUntil > Date.now();
    const isSurveilled = player.underSurveillanceUntil && player.underSurveillanceUntil > Date.now();
    let addedHeat = isImmune
      ? 0
      : (rolledSuccess 
        ? Math.max(10, Math.round(heist.energyCost * 0.40)) 
        : Math.max(15, Math.round(heist.energyCost * 0.75)));
    if ((isSurveilled || (player.taxDebt !== undefined && player.taxDebt > 0)) && !isImmune) addedHeat *= 2;

    setPlayer((prev) => {
      if (!prev) return null;
      const nextCoords = { ...prev.heistCooldowns, [heist.id]: cooldownAt };

      let nextLevel = prev.level;
      let nextExp = prev.exp;
      let nextExpNext = prev.expNext;
      let nextRespect = prev.respect;

      if (rolledSuccess) {
        nextExp += heist.rewardExp;
        nextRespect += heist.rewardRespect;

        // Log heist success
        addGameLog(
          `Completed Organized Heist: ${heist.nameEn}! Looted a major payout of $${lootAmount.toLocaleString()} cash! +${heist.rewardExp} EXP / +${heist.rewardRespect} Respect.`,
          `Cúmplice de Assalto Organizado: ${heist.namePt}! Arrecadou um pagamento histórico de $${lootAmount.toLocaleString()}! +${heist.rewardExp} EXP / +${heist.rewardRespect} pontos de Respeito.`,
          "heist",
          "🔥"
        );

        // Check level progress
        if (nextExp >= nextExpNext) {
          nextLevel += 1;
          nextExp = nextExp - nextExpNext;
          nextExpNext = Math.floor(nextExpNext * 1.35) + 100;
          const nextMaxEnergy = prev.maxEnergy + 10;
          const nextMaxHealth = prev.maxHealth + 10;

          setTimeout(() => {
            triggerAlert(
              lang === "en" 
                ? `🏆 RANK UP! Level ${nextLevel} reached!` 
                : `🏆 NOVA ESCALA! Nível ${nextLevel} alcançado!`,
              "success"
            );
          }, 600);

          addGameLog(
            `🏆 LEVEL UP! Reached Level ${nextLevel}! Combat strength upgraded!`,
            `🏆 PATENTE ELEVADA! Subiu para o Nível ${nextLevel}! Força tática de fogo aumentada!`,
            "level",
            "⭐"
          );

          const updated = {
            ...prev,
            level: nextLevel,
            exp: nextExp,
            expNext: nextExpNext,
            respect: nextRespect + 500,
            energy: nextMaxEnergy,
            maxEnergy: nextMaxEnergy,
            health: nextMaxHealth,
            maxHealth: nextMaxHealth,
            strength: prev.strength + 8,
            defense: prev.defense + 8,
            intellect: prev.intellect + 4,
            cash: prev.cash + lootAmount,
            heistCooldowns: nextCoords,
            crimesCommitted: prev.crimesCommitted + 1,
            heat: Math.min(100, (prev.heat ?? 0) + addedHeat)
          };
          return incrementDailyMission(updated, "heist_1", 1);
        }

        const updated = {
          ...prev,
          energy: prev.energy - heist.energyCost,
          cash: prev.cash + lootAmount,
          respect: nextRespect,
          exp: nextExp,
          heistCooldowns: nextCoords,
          crimesCommitted: prev.crimesCommitted + 1,
          heat: Math.min(100, (prev.heat ?? 0) + addedHeat)
        };
        return incrementDailyMission(updated, "heist_1", 1);
      } else {
        // Failed organized operation. High bullet graze risks 10% health damage!
        const nextHealth = Math.max(1, prev.health - 12);
        addGameLog(
          `Organized Heist FAIL: ${heist.nameEn}! Team was ambushed. Health drops by 12% from combat injuries and heat soared.`,
          `Falha de Assalto Organizado: ${heist.namePt}! Equipe emboscada. Sua saúde caiu em 12% pelos hematomas de confronto e procurado disparou.`,
          "heist",
          "🚨"
        );
        return {
          ...prev,
          energy: prev.energy - heist.energyCost,
          health: nextHealth,
          heistCooldowns: nextCoords,
          respect: prev.respect + 10, // small sympathy respect
          heat: Math.min(100, (prev.heat ?? 0) + addedHeat)
        };
      }
    });

    // Check for random police confrontation trigger
    setTimeout(() => {
      setPlayer((curr) => {
        if (!curr) return null;
        if (curr.policeImmuneUntil && curr.policeImmuneUntil > Date.now()) return curr;
        const currentHeat = curr.heat ?? 0;
        if (currentHeat < 12) return curr;

        // Trigger likelihood based on active heat levels (up to 33% at max heat)
        const encounterChance = currentHeat * 0.33;
        if (Math.random() * 100 < encounterChance) {
          playSound.notification();
          const isSweep = Math.random() < 0.35 || currentHeat > 60;

          setPoliceEvent({
            id: isSweep ? "precinct_warrant" : "street_stop",
            titleEn: isSweep ? "🚨 SPECIAL WARRANT LOCKDOWN RAID!" : "🚨 ROUTINE PATROL ENCOUNTER",
            titlePt: isSweep ? "🚨 INVASÃO DE MANDADO ESCRITO TÁTICO!" : "🚨 ENCONTRO COM PATRULHA ROUTINA",
            descEn: isSweep 
              ? `An SWAT task force squad launched a coordinated precinct warrant sweep at your hideout!`
              : `Routine patrol officers cornered you! They are inspecting IDs and eyeing your wallet bags suspiciously.`,
            descPt: isSweep 
              ? `A SWAT liderou um cerco tático de surpresa sob mandado preventivo em seu esconderijo!`
              : `Oficiais em ronda rotineira encurralaram você! Eles estão verificando fichas e pedindo identificação.`,
            bribeCost: Math.floor(curr.level * 250 + 450),
            bailCost: Math.max(400, Math.floor(curr.cash * (isSweep ? 0.20 : 0.10))),
            willpowerChance: Math.min(85, 30 + curr.willpower * 0.6),
            defenseChance: Math.min(85, isSweep ? (20 + curr.intellect * 0.75) : (25 + curr.defense * 0.65))
          });
        }
        return curr;
      });
    }, 1200);
  };

  // Travelling system
  const handleTravelBoroughs = (locationId: string, energyCost: number, notification: string | null, isSmuggledFerry = false) => {
    if (!player) return;

    // Check travel cooldown
    const now = Date.now();
    if (player.travelCooldownUntil && now < player.travelCooldownUntil) {
      const remainingSecs = Math.ceil((player.travelCooldownUntil - now) / 1000);
      triggerAlert(
        lang === "en"
          ? `🚨 TRANSIT SURVEILLANCE: NYPD patrols are scanning transit lines. Wait ${remainingSecs}s for the next commute!`
          : `🚨 CONTROLE DE TRÂNSITO: Patrulhas do NYPD bloqueiam as linhas. Aguarde ${remainingSecs}s para viajar com segurança!`,
        "warn"
      );
      return;
    }

    // Trigger drug rate reevaluation
    generateDrugPrices(locationId, isSmuggledFerry);

    // Auto-switch mobile views to contraband market deals after traveling
    if (window.innerWidth < 1024) {
      setMobileActiveView("game");
      setActiveTab("traffic");
    }

    const currentLoc = NEIGHBORHOODS.find(n => n.id === locationId);
    const locNameEn = currentLoc?.nameEn || locationId;
    const locNamePt = currentLoc?.namePt || locationId;

    setPlayer((prev) => {
      if (!prev) return null;
      const bonusHealth = Math.min(prev.maxHealth, prev.health + (isSmuggledFerry ? 12 : 10));
      const bonusEnergy = isSmuggledFerry
        ? Math.max(0, prev.energy - energyCost)
        : Math.min(prev.maxEnergy, prev.energy - energyCost + 25);

      return {
        ...prev,
        location: locationId,
        energy: bonusEnergy,
        health: bonusHealth,
        lastUpdate: Date.now(),
        travelCooldownUntil: Date.now() + 60000 // 60 seconds (1 minute) cooldown
      };
    });

    if (isSmuggledFerry) {
      addGameLog(
        `Fast-traveled to Staten Island via Smuggler's Express Ferry! Consumed only ${energyCost} Energy and unlocked exclusive 'Smuggler's Bonus' market rates!`,
        `Viagem rápida para Staten Island de Balsa de Contrabandistas! Gastou apenas ${energyCost} ENER e ativou tarifas exclusivas do 'Bônus de Contrabandista'!`,
        "travel",
        "🚢"
      );
    } else {
      addGameLog(
        `Traveled transit line to ${locNameEn}. Commute safely completed.`,
        `Viajou de metrô para o ${locNamePt}. Viagem de trânsito concluída com sucesso.`,
        "travel",
        "🚇"
      );
    }

    if (notification) {
      triggerAlert(notification, "success");
    }
  };

  const handleBuyDrugs = (drugId: string, qty: number, price: number) => {
    if (!player) return;
    const totalCost = qty * price;

    const currentDrug = DRUGS.find(d => d.id === drugId);
    const drugEn = currentDrug?.nameEn || drugId;
    const drugPt = currentDrug?.namePt || drugId;

    setPlayer((prev) => {
      if (!prev) return null;
      const currentQty = prev.drugsInventory[drugId] || 0;
      return {
        ...prev,
        cash: prev.cash - totalCost,
        drugsInventory: {
          ...prev.drugsInventory,
          [drugId]: currentQty + qty
        }
      };
    });

    addGameLog(
      `Purchased ${qty} units of contraband ${drugEn} for a total of $${totalCost.toLocaleString()} inside ${player.location.toUpperCase()}.`,
      `Comprou ${qty} fardos de contrabandos de ${drugPt} por $${totalCost.toLocaleString()} no bairro de ${player.location.toUpperCase()}.`,
      "market",
      "📦"
    );

    const PT_PHRASES = [
      `Sucesso! Você descolou ${qty}x ${drugPt}. Bagulhinho da pura, meu parceiro! 😎`,
      `Trato feito! ${qty}x ${drugPt} escondido no porta-malas. Toca pro próximo bairro! 🚗`,
      `Carga preciosa garantida! Você descolou ${qty}x ${drugPt} pelo precinho. Lucro na certa! 💸`,
      `Sua conexão forte agilizou tudo: +${qty}x ${drugPt} pro seu estoque da máfia. Brabo! ⚡`,
      `Mercadoria stashed! Embolsou ${qty}x ${drugPt}. Agora viaja e faz valer cada centavo! 💎`
    ];
    const EN_PHRASES = [
      `Sweet deal! You secured ${qty}x ${drugEn}. Grade A stuff, my friend! 😎`,
      `Boom! Got ${qty}x ${drugEn} stashed in the trunk. Let's roll! 🚗`,
      `On the low! Grabbed ${qty}x ${drugEn} on a pristine street rate. Mastermind vibes! 💸`,
      `Local connections came through: +${qty}x ${drugEn} loaded to the inventory. Slick! ⚡`,
      `Cargo stashed! You grabbed ${qty}x ${drugEn}. Travel high, flip for raw gold! 💎`
    ];
    const randomIdx = Math.floor(Math.random() * PT_PHRASES.length);
    triggerAlert(lang === "en" ? EN_PHRASES[randomIdx] : PT_PHRASES[randomIdx]);
  };

  const handleSellDrugs = (drugId: string, qty: number, price: number) => {
    if (!player) return;
    const totalReturn = qty * price;

    const currentDrug = DRUGS.find(d => d.id === drugId);
    const drugEn = currentDrug?.nameEn || drugId;
    const drugPt = currentDrug?.namePt || drugId;

    setPlayer((prev) => {
      if (!prev) return null;
      const currentQty = prev.drugsInventory[drugId] || 0;
      return {
        ...prev,
        cash: prev.cash + totalReturn,
        drugsInventory: {
          ...prev.drugsInventory,
          [drugId]: Math.max(0, currentQty - qty)
        }
      };
    });

    addGameLog(
      `Sold ${qty} units of ${drugEn} for cash return of $${totalReturn.toLocaleString()} in ${player.location.toUpperCase()}.`,
      `Vendeu ${qty} fardos de ${drugPt} faturando um retorno de $${totalReturn.toLocaleString()} no bairro de ${player.location.toUpperCase()}.`,
      "market",
      "💰"
    );

    const PT_SELL_PHRASES = [
      `Deitou! Vendeu ${qty}x ${drugPt} e entupiu a carteira em +$${totalReturn.toLocaleString()}! 💸`,
      `Negócio fechado! ${qty}x ${drugPt} descarregado. Dinheiro sujo e cheiroso em mãos! 💰`,
      `Liquidou o estoque! Despachou ${qty}x ${drugPt} levando $${totalReturn.toLocaleString()} de volta! 📈`,
      `Só notas de cem! Passou adiante ${qty}x ${drugPt} pros contatos mais ricos. Brabo! 🔥`,
      `Tráfico lucrativo! Seu porta-malas de ${drugPt} esvaziou e rendeu +$${totalReturn.toLocaleString()}! 💎`
    ];
    const EN_SELL_PHRASES = [
      `Clean flip! Sold ${qty}x ${drugEn} and padded your wallet with +$${totalReturn.toLocaleString()}! 💸`,
      `Transaction done! ${qty}x ${drugEn} offloaded. Cold hard greens stashed! 💰`,
      `Cargo cleared! Sent ${qty}x ${drugEn} packing for a nice return of $${totalReturn.toLocaleString()}! 📈`,
      `Money printer! Dispatched ${qty}x ${drugEn} to financial fatcats. Boss play! 🔥`,
      `Traded off! Exchanged ${qty}x ${drugEn} for a sweet $${totalReturn.toLocaleString()} cash! 💎`
    ];
    const randomIdx = Math.floor(Math.random() * PT_SELL_PHRASES.length);
    triggerAlert(lang === "en" ? EN_SELL_PHRASES[randomIdx] : PT_SELL_PHRASES[randomIdx]);
  };

  const handleConsumeDrug = (drugId: string) => {
    if (!player) return;
    const currentQty = player.drugsInventory[drugId] || 0;
    if (currentQty <= 0) {
      triggerAlert(lang === "en" ? "You do not own any contraband of this type!" : "Você não possui contrabandos desse tipo!", "warn");
      return;
    }

    const drugDef = DRUGS.find(d => d.id === drugId);
    if (!drugDef) return;

    setPlayer((prev) => {
      if (!prev) return null;
      
      let nextHealth = prev.health;
      let nextEnergy = prev.energy;
      let nextStrength = prev.strength;
      let nextDefense = prev.defense;
      let nextIntellect = prev.intellect;
      let nextWillpower = prev.willpower;
      const isImmune = prev.policeImmuneUntil && prev.policeImmuneUntil > Date.now();
      let nextHeat = isImmune ? 0 : (prev.heat !== undefined ? prev.heat : 0);

      if (drugDef.effects) {
        if (drugDef.effects.health !== undefined) {
          nextHealth = Math.min(prev.maxHealth, Math.max(0, prev.health + drugDef.effects.health));
        }
        if (drugDef.effects.energy !== undefined) {
          nextEnergy = Math.min(prev.maxEnergy, Math.max(0, prev.energy + drugDef.effects.energy));
        }
        if (drugDef.effects.strength !== undefined) {
          nextStrength = Math.max(0, prev.strength + drugDef.effects.strength);
        }
        if (drugDef.effects.defense !== undefined) {
          nextDefense = Math.max(0, prev.defense + drugDef.effects.defense);
        }
        if (drugDef.effects.intellect !== undefined) {
          nextIntellect = Math.max(0, prev.intellect + drugDef.effects.intellect);
        }
        if (drugDef.effects.willpower !== undefined) {
          nextWillpower = Math.max(0, prev.willpower + drugDef.effects.willpower);
        }
        if (drugDef.effects.heat !== undefined) {
          nextHeat = isImmune ? 0 : Math.min(100, Math.max(0, nextHeat + drugDef.effects.heat));
        }
      }

      let addedContam = 15;
      if (drugId === "weed") addedContam = 4;
      else if (drugId === "skunk") addedContam = 6;
      else if (drugId === "crumble") addedContam = 8;
      else if (drugId === "og_kush") addedContam = 10;
      else if (drugId === "ice_extraction") addedContam = 12;
      else if (drugId === "pills") addedContam = 18;
      else if (drugId === "cocaine") addedContam = 25;
      else if (drugId === "meth") addedContam = 30;
      else if (drugId === "heroin") addedContam = 35;

      const nextContamination = Math.min(100, (prev.contamination ?? 0) + addedContam);

      return {
        ...prev,
        health: nextHealth,
        energy: nextEnergy,
        strength: nextStrength,
        defense: nextDefense,
        intellect: nextIntellect,
        willpower: nextWillpower,
        heat: nextHeat,
        contamination: nextContamination,
        drugsInventory: {
          ...prev.drugsInventory,
          [drugId]: Math.max(0, currentQty - 1)
        }
      };
    });

    playSound.notification();

    const dNameEn = drugDef.nameEn || drugId;
    const dNamePt = drugDef.namePt || drugId;

    addGameLog(
      `Consumed 1 unit of contraband ${dNameEn}. Active attributes boosted!`,
      `Consumiu 1 dose de ${dNamePt}. Atributos ativos fortalecidos!`,
      "system",
      "🍀"
    );

    triggerAlert(
      lang === "en" 
        ? `Consumed ${dNameEn} successfully.` 
        : `Consumiu ${dNamePt} com sucesso.`
    );
  };

  const handleBuyItem = (item: GameItem) => {
    if (!player) return;
    const { cost: dynamicCost, minLevel: dynamicMinLvl } = getDynamicItemProps(item, player);
    if (player.cash < dynamicCost) return;

    if (player.level < dynamicMinLvl) {
      triggerAlert(
        lang === "en" 
          ? `Purchasing this item requires character level ${dynamicMinLvl}!` 
          : `A aquisição deste item exige que você seja nível ${dynamicMinLvl}!`, 
        "warn"
      );
      return;
    }

    setPlayer((prev) => {
      if (!prev) return null;
      const currentProps = getDynamicItemProps(item, prev);
      const costToPay = currentProps.cost;
      
      if (prev.cash < costToPay) return prev;

      if (item.type === "weapon") {
        return {
          ...prev,
          cash: prev.cash - costToPay,
          weapons: [...prev.weapons, item.id],
          activeWeapon: item.id // auto equip newly bought
        };
      } else if (item.type === "vehicle") {
        return {
          ...prev,
          cash: prev.cash - costToPay,
          vehicles: [...prev.vehicles, item.id],
          activeVehicle: item.id
        };
      } else {
        // real estate
        return {
          ...prev,
          cash: prev.cash - costToPay,
          realEstate: [...prev.realEstate, item.id]
        };
      }
    });

    addGameLog(
      `Bought block asset ${item.nameEn} from Black Market for $${dynamicCost.toLocaleString()}.`,
      `Item adquirido no Mercado Negro: ${item.namePt} por $${dynamicCost.toLocaleString()}.`,
      "shop",
      "🛡️"
    );

    playSound.cash();
    triggerAlert(lang === "en" ? `Acquired ${item.nameEn} successfully!` : `Adquiriu ${item.namePt} com sucesso!`);
  };

  // Toggle active gear items from wardrobe
  const handleToggleActiveWeapon = (id: string) => {
    setPlayer((prev) => prev ? { ...prev, activeWeapon: id } : null);
    playSound.notification();
    const wName = SHOP_ITEMS.find((i) => i.id === id);
    if (wName) {
      addGameLog(
        `Equipped active weapon: ${wName.nameEn}. Strength and fire multiplier boosted.`,
        `Equipou arma principal de fogo: ${wName.namePt}. Multiplicador de força elevado.`,
        "shop",
        "🔫"
      );
    }
  };

  const handleToggleActiveVehicle = (id: string) => {
    setPlayer((prev) => prev ? { ...prev, activeVehicle: id } : null);
    playSound.notification();
    const vName = SHOP_ITEMS.find((i) => i.id === id);
    if (vName) {
      addGameLog(
        `Equipped escape vehicle cruise fleet: ${vName.nameEn}. Defense bonuses updated.`,
        `Equipou veículo tático de fuga: ${vName.namePt}. Bônus de evasão e defesa ajustados.`,
        "shop",
        "🚗"
      );
    }
  };

  const handleBuyPet = (petId: string, cost: number) => {
    if (!player) return;
    if (player.cash < cost) return;

    setPlayer((prev) => {
      if (!prev) return null;
      const updatedPets = { ...(prev.pets || {}) };
      updatedPets[petId] = { id: petId, level: 1 };
      
      // Auto-equip if no pet is active
      const nextActivePet = prev.activePet ? prev.activePet : petId;

      return {
        ...prev,
        cash: prev.cash - cost,
        pets: updatedPets,
        activePet: nextActivePet
      };
    });

    const petDef = PETS.find(p => p.id === petId);
    if (petDef) {
      addGameLog(
        `Acquired companion: ${petDef.nameEn} from Black Market for $${cost.toLocaleString()}.`,
        `Adquiriu companheiro mascote: ${petDef.namePt} por $${cost.toLocaleString()}.`,
        "shop",
        "🐾"
      );
      triggerAlert(
        lang === "en" 
          ? `Companion ${petDef.nameEn} hired!` 
          : `Mascote ${petDef.namePt} contratado!`
      );
    }
  };

  const handleLevelUpPet = (petId: string, cost: number) => {
    if (!player) return;
    if (player.cash < cost) return;

    setPlayer((prev) => {
      if (!prev) return null;
      const updatedPets = { ...(prev.pets || {}) };
      if (!updatedPets[petId]) return prev;
      
      const petDef = PETS.find(p => p.id === petId);
      const maxLvl = petDef?.maxLevel || 10;
      const currentLvl = updatedPets[petId].level;
      if (currentLvl >= maxLvl) return prev;

      updatedPets[petId] = {
        ...updatedPets[petId],
        level: currentLvl + 1
      };

      return {
        ...prev,
        cash: prev.cash - cost,
        pets: updatedPets
      };
    });

    const petDef = PETS.find(p => p.id === petId);
    if (petDef) {
      const nextLvl = (player.pets?.[petId]?.level || 1) + 1;
      addGameLog(
        `Trained companion ${petDef.nameEn} to level ${nextLvl}.`,
        `Treinou o companheiro ${petDef.namePt} para o nível ${nextLvl}.`,
        "shop",
        "🐾"
      );
      triggerAlert(
        lang === "en" 
          ? `${petDef.nameEn} trained up to level ${nextLvl}!` 
          : `${petDef.namePt} treinado para o nível ${nextLvl}!`
      );
    }
  };

  const handleToggleActivePet = (petId: string) => {
    if (!player) return;
    const isCurrentlyActive = player.activePet === petId;
    
    setPlayer((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        activePet: isCurrentlyActive ? null : petId
      };
    });

    const petDef = PETS.find(p => p.id === petId);
    if (petDef) {
      if (isCurrentlyActive) {
        addGameLog(
          `Dismissed active companion: ${petDef.nameEn}.`,
          `Dispensou companheiro ativo: ${petDef.namePt}.`,
          "shop",
          "🐾"
        );
      } else {
        addGameLog(
          `Ordered companion ${petDef.nameEn} to tag along in the streets. Benefits activated.`,
          `Comandou companheiro ${petDef.namePt} para te dar cobertura nas ruas. Bônus ativado.`,
          "shop",
          "🐾"
        );
      }
    }
  };

  const handleHospitalRecoverLife = (cost: number) => {
    setPlayer((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        cash: prev.cash - cost,
        health: prev.maxHealth
      };
    });

    addGameLog(
      `Underwent Advanced Trauma Care in the Central Hospital for $${cost.toLocaleString()}. Health fully recovered.`,
      `Passou por Cuidados de Trauma Avançados no Hospital Central por $${cost.toLocaleString()}. Saúde totalmente restabelecida.`,
      "shop",
      "🏥"
    );

    triggerAlert(lang === "en" ? "Medical care completes! Health 100% restored." : "Atendimento médico finalizado! Saúde 100% restabelecida.");
  };

  const handleHospitalCureIntoxication = (cost: number) => {
    setPlayer((prev) => {
      if (!prev) return null;
      const curedCount = prev.intoxicationCuredCount ?? 0;
      return {
        ...prev,
        cash: prev.cash - cost,
        contamination: 0,
        intoxicationCuredCount: curedCount + 1
      };
    });

    addGameLog(
      `Detoxified bloodstream from illegal chemical contamination for $${cost.toLocaleString()}.`,
      `Desintoxicou a corrente sanguínea de compostos químicos nocivos por $${cost.toLocaleString()}.`,
      "shop",
      "🧪"
    );

    triggerAlert(lang === "en" ? "Blood stream fully details chemical elements purged!" : "Corrente sanguínea limpa! Desintoxicação finalizada com sucesso!");
  };

  const handleHospitalPlasticSurgery = () => {
    const cost = 100000;
    if (player.level < 10) {
      triggerAlert(lang === "en" ? "You must be at least level 10 for plastic facial reconstruction!" : "Você precisa de nível mínimo 10 para operar uma reconstrução facial plástica!", "warn");
      return;
    }
    if (player.cash < cost) {
      triggerAlert(lang === "en" ? "Failure: Insufficient cash balance!" : "Fracasso: Dinheiro insuficiente para custos de cirurgia!", "warn");
      return;
    }

    setPlayer((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        cash: prev.cash - cost,
        heat: 0,
        policeImmuneUntil: Date.now() + 120000 // 2 minutes immunity
      };
    });

    addGameLog(
      `Underwent clandestine facial reconstruction plastic surgery for $100,000. Reset Wanted Level and secured 2 minutes police immunity!`,
      `Realizou cirurgia plástica clandestina reconstrutiva por $100.000. Zera ficha criminal e concede 2 minutos de imunidade policial total!`,
      "shop",
      "🎭"
    );

    triggerAlert(lang === "en" ? "Facial surgery successful! Officers failed to recognize your appearance. 2 Minutes Immunity activated!" : "Cirurgia facial realizada com sucesso! Ficha zerada e 2 Minutos de Imunidade Policial ativados!", "success");
    setIsHospitalOpen(false);
  };

  const handleHireVIPCompanion = (companionId: string, cost: number, healthPercentBonus: number, energyPercentBonus: number) => {
    setPlayer((prev) => {
      if (!prev) return null;
      
      const healthRecover = Math.round(prev.maxHealth * (healthPercentBonus / 100));
      const energyRecover = Math.round(prev.maxEnergy * (energyPercentBonus / 100));
      
      return {
        ...prev,
        cash: prev.cash - cost,
        health: Math.min(prev.maxHealth, prev.health + healthRecover),
        energy: Math.min(prev.maxEnergy, prev.energy + energyRecover)
      };
    });

    const comp = VIP_COMPANIONS.find(c => c.id === companionId);
    const nameStrEn = comp?.nameEn || companionId;
    const nameStrPt = comp?.namePt || companionId;

    addGameLog(
      `Spent time with ${nameStrEn} in the VIP lounge for $${cost.toLocaleString()}. Restored +${healthPercentBonus}% Health and +${energyPercentBonus}% Energy!`,
      `Passou momentos de lazer com ${nameStrPt} no lounge privado por $${cost.toLocaleString()}. Recuperou +${healthPercentBonus}% de Vida e +${energyPercentBonus}% de Energia!`,
      "shop",
      "💃"
    );

    triggerAlert(lang === "en" ? `Spent time with ${nameStrEn}! Restored health and energy!` : `Passou momento com ${nameStrPt}! Saúde e energia restabelecidas!`);
  };

  const handleBribePolice = (cost: number, heatCleared: number) => {
    setPlayer((prev) => {
      if (!prev) return null;
      const currentHeat = prev.heat ?? 0;
      const updated = {
        ...prev,
        cash: prev.cash - cost,
        heat: Math.max(0, currentHeat - heatCleared),
        totalBribesPaid: (prev.totalBribesPaid || 0) + cost
      };
      return incrementDailyMission(updated, "bribe_1", cost);
    });
    trackBribePayment(cost);

    addGameLog(
      `Bribed Lafayette Precinct Deputy with $${cost.toLocaleString()} to wipe files. Reduced police heat by -${heatCleared}%.`,
      `Molhou a mão do Delegado da Lafayette com $${cost.toLocaleString()} para limpar registros. Procurado reduzido em -${heatCleared}%.`,
      "shop",
      "👮"
    );

    triggerAlert(lang === "en" ? `NYPD files purged successfully! Heat level cooled down by -${heatCleared}%.` : `Registros policiais eliminados com sucesso! Nível de procurado reduzido em -${heatCleared}%.`);
  };

  const handleExecuteCombat = (log: CombatLog, won: boolean, cashChange: number, respectChange: number, xpGained: number, energyCost: number) => {
    if (!player) return;

    setPlayer((prev) => {
      if (!prev) return null;
      // Subtract health (deduct 30 health units from fighting roughly)
      const dmgTaken = Math.floor(Math.random() * 25) + 15;
      const nextHealth = Math.max(1, prev.health - dmgTaken);

      const isImmune = prev.policeImmuneUntil && prev.policeImmuneUntil > Date.now();
      const isSurveilled = prev.underSurveillanceUntil && prev.underSurveillanceUntil > Date.now();
      let addedHeat = isImmune ? 0 : Math.max(2, Math.round(energyCost * 0.6));
      if ((isSurveilled || (prev.taxDebt !== undefined && prev.taxDebt > 0)) && !isImmune) addedHeat *= 2;

      let nextLevel = prev.level;
      let nextExp = prev.exp + xpGained;
      let nextExpNext = prev.expNext;

      if (won) {
        addGameLog(
          `Defeated rival ${log.defender} in combat Arena! Spent ${energyCost} Energy, claimed +$${cashChange.toLocaleString()} and gained +${xpGained} XP / +${respectChange} Respect!`,
          `Derrotou o gângster rival ${log.defender} no Ringue! Gastou ${energyCost} de Energia, saqueou +$${cashChange.toLocaleString()} e obteve +${xpGained} EXP / +${respectChange} Respeito!`,
          "combat",
          "👊"
        );
      } else {
        addGameLog(
          `Lost arena match to rival ${log.defender}! Spent ${energyCost} Energy, lost $${Math.abs(cashChange).toLocaleString()} in mugging payout and sustained combat fractures.`,
          `Foi nocauteado pelo rival ${log.defender} no Ringue! Gastou ${energyCost} de Energia, perdeu $${Math.abs(cashChange).toLocaleString()} e sofreu contusões e fraturas.`,
          "combat",
          "💀"
        );
      }

      if (nextExp >= nextExpNext) {
        nextLevel += 1;
        nextExp = nextExp - nextExpNext;
        nextExpNext = Math.floor(nextExpNext * 1.35) + 100;
        
        // Boost Vital capacities
        const nextMaxEnergy = prev.maxEnergy + 10;
        const nextMaxHealth = prev.maxHealth + 10;

        setTimeout(() => {
          triggerAlert(lang === "en" ? `🏆 LEVEL UP! Ranked to ${nextLevel}!` : `🏆 SUBIDA DE PATENTE! Você subiu para o nível ${nextLevel}!`);
        }, 500);

        addGameLog(
          `🏆 LEVEL UP! Rank elevated to Nível ${nextLevel}! All stats capped + attributes boosted!`,
          `🏆 PATENTE ELEVADA! Promovido ao Nível ${nextLevel}! Limites vitais e atributos expandidos!`,
          "level",
          "⭐"
        );

        const updated = {
          ...prev,
          level: nextLevel,
          exp: nextExp,
          expNext: nextExpNext,
          cash: Math.max(0, prev.cash + cashChange),
          respect: Math.max(0, prev.respect + respectChange),
          energy: nextMaxEnergy,
          maxEnergy: nextMaxEnergy,
          health: nextMaxHealth,
          maxHealth: nextMaxHealth,
          strength: prev.strength + 5,
          defense: prev.defense + 5,
          intellect: prev.intellect + 2,
          willpower: prev.willpower + 2,
          fightsWon: won ? prev.fightsWon + 1 : prev.fightsWon,
          fightsLost: !won ? prev.fightsLost + 1 : prev.fightsLost,
          ringCooldownUntil: Date.now() + 30000,
          battlePoints: Math.max(0, (prev.battlePoints ?? 100) - 1),
          heat: Math.min(100, (prev.heat ?? 0) + addedHeat)
        };
        return won ? incrementDailyMission(updated, "combat_1", 1) : updated;
      }

      const updated = {
        ...prev,
        energy: Math.max(0, prev.energy - energyCost),
        cash: Math.max(0, prev.cash + cashChange),
        respect: Math.max(0, prev.respect + respectChange),
        health: nextHealth,
        exp: nextExp,
        fightsWon: won ? prev.fightsWon + 1 : prev.fightsWon,
        fightsLost: !won ? prev.fightsLost + 1 : prev.fightsLost,
        ringCooldownUntil: Date.now() + 30000,
        battlePoints: Math.max(0, (prev.battlePoints ?? 100) - 1),
        heat: Math.min(100, (prev.heat ?? 0) + addedHeat)
      };
      return won ? incrementDailyMission(updated, "combat_1", 1) : updated;
    });
  };

  const handleGymTraining = (attr: "strength" | "defense" | "intellect" | "willpower", energyCost: number, points: number, costType: "tp_energy" | "connection" = "tp_energy") => {
    setPlayer((prev) => {
      if (!prev) return null;
      if (costType === "tp_energy") {
        if (prev.trainingPoints < 1) {
          triggerAlert(lang === "en" ? "Not enough Training Points (TP). Wait until tomorrow." : "Pontos de Treino (TP) insuficientes. Aguarde até a meia-noite.", "warn");
          return prev;
        }
        return {
          ...prev,
          energy: prev.energy - energyCost,
          trainingPoints: prev.trainingPoints - 1,
          [attr]: prev[attr] + points
        };
      } else if (costType === "connection") {
        if ((prev.connections ?? 0) < 1) {
          triggerAlert(lang === "en" ? "Not enough Black Market Connections." : "Você não possui Conexões Clandestinas suficientes.", "warn");
          return prev;
        }
        return {
          ...prev,
          connections: prev.connections - 1,
          [attr]: prev[attr] + points
        };
      }
      return prev;
    });

    const attrCapitalized = attr === "strength" ? "FORÇA" : attr === "defense" ? "DEFESA" : attr === "intellect" ? "INTELECTO" : "VONTADE";
    const emoji = costType === "connection" ? "💉" : "🏋️";

    addGameLog(
      costType === "connection"
        ? `Used Chemical Enhancers! Trained ${attr.toUpperCase()}. Acquired +${points} points (-1 Connection).`
        : `Trained ${attr.toUpperCase()} in Underworld Gym. Acquired +${points} points (-${energyCost} energy, -1 TP).`,
      costType === "connection"
        ? `Injeção Química utilizada no Laboratório! Atributo ${attrCapitalized} elevado em +${points} pontos (-1 Conexão).`
        : `Realizou treino agressivo do atributo ${attrCapitalized}. Conquistou +${points} pontos (-${energyCost} energia, -1 Ponto de Treino).`,
      "system",
      emoji
    );

    triggerAlert(
      lang === "en" 
        ? costType === "connection" ? `CHEMIST UPGRADE: +${points} ${attr.toUpperCase()}` : `GYM WORKOUT: +${points} ${attr.toUpperCase()}`
        : costType === "connection" ? `LABORATÓRIO: +${points} EM ${attrCapitalized}` : `TREINO COMPLETO: +${points} EM ${attrCapitalized}`,
      "success"
    );
  };

  const handleBuyConnection = (amount: number) => {
    setPlayer((prev) => {
      if (!prev) return null;
      let currentPrice = prev.connectionPrice ?? 300000;
      let totalCost = 0;
      for (let i = 0; i < amount; i++) {
        totalCost += currentPrice;
        currentPrice = Math.floor(currentPrice * 1.02);
      }

      if (prev.cash < totalCost && prev.bank < totalCost) {
        triggerAlert(lang === "en" ? `Not enough funds. Need $${totalCost.toLocaleString()}` : `Fundos insuficientes. Necessita de $${totalCost.toLocaleString()}`, "warn");
        return prev;
      }
      
      const newCash = prev.cash >= totalCost ? prev.cash - totalCost : prev.cash;
      const newBank = prev.cash < totalCost ? prev.bank - totalCost : prev.bank;

      triggerAlert(lang === "en" ? `Bought ${amount} Connection(s)!` : `Comprou ${amount} Conexão(ões)!`, "success");
      return {
        ...prev,
        cash: newCash,
        bank: newBank,
        connections: (prev.connections ?? 0) + amount,
        connectionPrice: currentPrice
      };
    });
  };

  const handleSellConnection = (amount: number) => {
    setPlayer((prev) => {
      if (!prev) return null;
      if ((prev.connections ?? 0) < amount) {
        triggerAlert(lang === "en" ? "Not enough connections." : "Você não possui conexões suficientes para vender.", "warn");
        return prev;
      }
      let currentPrice = prev.connectionPrice ?? 300000;
      let revenue = 0;
      for (let i = 0; i < amount; i++) {
        revenue += currentPrice;
        currentPrice = Math.floor(currentPrice * 0.985);
        if (currentPrice < 10000) currentPrice = 10000;
      }

      triggerAlert(lang === "en" ? `Sold ${amount} Connection(s) for $${revenue.toLocaleString()}!` : `Vendeu ${amount} Conexão(ões) por $${revenue.toLocaleString()}!`, "success");
      return {
        ...prev,
        cash: prev.cash + revenue,
        connections: prev.connections - amount,
        connectionPrice: currentPrice
      };
    });
  };

  const handleDepositCoins = (amt: number) => {
    setPlayer((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        cash: prev.cash - amt,
        bank: prev.bank + amt,
        totalBankDeposits: (prev.totalBankDeposits || 0) + amt
      };
    });
    trackBankDeposit(amt);

    addGameLog(
      `Transferred $${amt.toLocaleString()} dirty cash safely to the Swiss Cayman Bank vaults.`,
      `Transferiu $${amt.toLocaleString()} lucros sujos em segurança para o cofre do Banco Suíço.`,
      "bank",
      "🏦"
    );

    triggerAlert(lang === "en" ? `Deposited $${amt.toLocaleString()} securely inside vault.` : `Depositou $${amt.toLocaleString()} com sucesso no cofre.`);
  };

  const handleWithdrawCoins = (amt: number) => {
    setPlayer((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        cash: prev.cash + amt,
        bank: prev.bank - amt
      };
    });

    addGameLog(
      `Withdrew $${amt.toLocaleString()} from Cayman vaults to hand ready for spending.`,
      `Sacou $${amt.toLocaleString()} de seu cofre Suíço de volta às mãos prontas para o crime.`,
      "bank",
      "🪙"
    );

    triggerAlert(lang === "en" ? `Withdrew ${amt} dirty cash.` : `Sacou ${amt} do cofre.`);
  };

  const handlePayTaxes = () => {
    if (!player) return;
    const debt = player.taxDebt ?? 0;
    if (debt <= 0) {
      triggerAlert(lang === "en" ? "You have no outstanding tax debt!" : "Você não possui impostos pendentes!", "success");
      return;
    }

    if (player.cash >= debt) {
      playSound.cash();
      setPlayer((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          cash: prev.cash - debt,
          taxDebt: 0
        };
      });
      triggerAlert(
        lang === "en" 
          ? `🏛️ Fully settled $${debt.toLocaleString()} tax debt using hand cash!` 
          : `🏛️ Regularizou $${debt.toLocaleString()} de impostos federais pagos em dinheiro!`, 
        "success"
      );
      addGameLog(
        `Settled all underworld tax liabilities ($${debt.toLocaleString()}). Purged records.`,
        `Liquidou todas passivas de taxas federais pendentes ($${debt.toLocaleString()}). Registros limpos.`,
        "bank",
        "⚖️"
      );
    } else {
      // Cash is not enough. Spend all cash first, then rest from bank.
      const cashSpent = player.cash;
      const remains = debt - cashSpent;
      
      if (player.bank >= remains) {
        playSound.cash();
        setPlayer((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            cash: 0,
            bank: prev.bank - remains,
            taxDebt: 0
          };
        });
        triggerAlert(
          lang === "en" 
            ? `🏛️ Settled $${debt.toLocaleString()} taxes ($${cashSpent.toLocaleString()} cash + $${remains.toLocaleString()} from vault)!` 
            : `🏛️ Impostos liquidados ($${cashSpent.toLocaleString()} em mãos + $${remains.toLocaleString()} debitados do cofre)!`,
          "success"
        );
        addGameLog(
          `Settled tax liabilities of $${debt.toLocaleString()} using joint holdings.`,
          `Regularizou pendências de taxas federais de $${debt.toLocaleString()} usando saldo misto.`,
          "bank",
          "⚖️"
        );
      } else {
        // Can't pay fully, but pay as much as possible with ALL cash!
        const totalAble = player.cash + player.bank;
        if (totalAble > 0) {
          playSound.cash();
          setPlayer((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              cash: 0,
              bank: 0,
              taxDebt: debt - totalAble
            };
          });
          triggerAlert(
            lang === "en" 
              ? `🏛️ Partial payment of $${totalAble.toLocaleString()} made. Outstanding debt: $${(debt - totalAble).toLocaleString()}`
              : `🏛️ Pagamento parcial de $${totalAble.toLocaleString()} efetuado. Saldo tributário devedor: $${(debt - totalAble).toLocaleString()}`,
            "warn"
          );
        } else {
          triggerAlert(
            lang === "en" 
              ? "You don't have any funds to pay taxes!" 
              : "Você não tem nenhum recurso disponível para pagar os impostos!", 
            "warn"
          );
        }
      }
    }
  };

  const handleLogout = () => {
    setPlayer(null);
    triggerAlert(lang === "en" ? "Safely disconnected." : "Gângster deslogado com sucesso.");
  };

  const handleResetGame = () => {
    let proceed = false;
    try {
      proceed = window.confirm(lang === "en" ? "WIPE ALL SAVES?" : "DESEJA RESETAR SEU GANGSTER?");
    } catch (e) {
      // Fallback if browser's conform dialog is blocked/restricted by iframe sandboxing configurations
      proceed = true;
    }
    if (proceed) {
      localStorage.removeItem(SAVE_KEY);
      setPlayer(null);
      setSavedProfile(null);
      setTermsAccepted(false);
      triggerAlert(lang === "en" ? "Archive wiped clean." : "Dossiê apagado com sucesso.");
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // Do not trigger mobile view swiping when sliding list filters, menus, sliders or interacting with gameplay buttons
    if (
      target.closest("#main-tab-nav") ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea") ||
      target.closest(".overflow-x-auto") ||
      target.closest("[role='slider']")
    ) {
      touchStartRef.current = null;
      return;
    }
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (window.innerWidth >= 1024) return;

    // Minimum horizontal swipe distance of 85px to be intentional, and max vertical deviation of 45px to ignore scroll drags
    if (Math.abs(deltaX) > 85 && Math.abs(deltaY) < 45) {
      if (deltaX < 0) {
        // Swipe Left: move to the right (status -> game -> locais)
        if (mobileActiveView === "status") {
          setMobileActiveView("game");
          playSound.notification();
          setTimeout(() => {
            document.getElementById("mobile-view-nav")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 55);
        } else if (mobileActiveView === "game") {
          setMobileActiveView("locais");
          playSound.notification();
          setTimeout(() => {
            document.getElementById("mobile-view-nav")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 55);
        }
      } else {
        // Swipe Right: move to the left (locais -> game -> status)
        if (mobileActiveView === "locais") {
          setMobileActiveView("game");
          playSound.notification();
          setTimeout(() => {
            document.getElementById("mobile-view-nav")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 55);
        } else if (mobileActiveView === "game") {
          setMobileActiveView("status");
          playSound.notification();
          setTimeout(() => {
            document.getElementById("mobile-view-nav")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 55);
        }
      }
    }
  };

  // Dynamic Police Encounter Math
  const getPoliceEncounterData = () => {
    if (!policeEvent) return null;
    const baseBribe = policeEvent.bribeCost;
    
    // Bribes:
    // 1. Low Bribe
    const lowBribeCost = Math.max(250, Math.round(baseBribe * 0.65));
    // Base 25%, plus small stat influence (up to max 35%)
    const lowBribeOdds = Math.min(35, 25 + Math.floor((player?.intellect ?? 0) * 0.05));
    
    // 2. Medium Bribe
    const mediumBribeCost = Math.max(500, Math.round(baseBribe * 1.55));
    const mediumBribeOdds = Math.min(65, 55 + Math.floor((player?.intellect ?? 0) * 0.06));
    
    // 3. High Bribe
    const highBribeCost = Math.max(1200, Math.round(baseBribe * 3.2));
    const highBribeOdds = Math.min(90, 85 + Math.floor((player?.intellect ?? 0) * 0.04)); // strict cap 90%
    
    // Escape Chance breakdown:
    const baseEscapeChance = 12;
    const carBonus = player?.activeVehicle ? 15 : 0;
    const weaponBonus = player?.activeWeapon ? 8 : 0;
    const petBonus = player?.activePet ? 6 : 0;
    // Stats bonus: (Defense + Strength)
    const statsBonus = Math.min(10, Math.floor(((player?.defense ?? 0) + (player?.strength ?? 0)) * 0.04));
    
    const escapeOddsRaw = baseEscapeChance + carBonus + weaponBonus + petBonus + statsBonus;
    // Strictly cap escape chance to 45% as asked: "com baixa chance de sucesso e alta de falhar e ser preso"
    const finalEscapeOdds = Math.min(45, escapeOddsRaw);
    
    return {
      lowBribeCost,
      lowBribeOdds,
      mediumBribeCost,
      mediumBribeOdds,
      highBribeCost,
      highBribeOdds,
      finalEscapeOdds,
      carBonus,
      weaponBonus,
      petBonus,
      statsBonus,
      baseEscapeChance
    };
  };
  const policeData = getPoliceEncounterData();

  return (
    <div className={`text-zinc-100 bg-[#070709] font-sans flex flex-col selection:bg-red-600 selection:text-white relative ${player ? "min-h-screen p-2.5 sm:p-4 bg-board-grid pb-12 sm:pb-16" : "min-h-screen p-4 sm:p-6 pb-12"} ${isNightMode ? "night-mode-active" : "night-mode-inactive"}`}>
      {/* Dynamic background based on active tab! */}
      {player && (
        <div className="fixed inset-0 z-0 pointer-events-none mix-blend-screen opacity-20 transition-opacity duration-1000">
          {activeTab === 'dash' && (
            <img src={player.location === 'manhattan' ? neighborhoodManhattanSpriteImage : player.location === 'queens' ? neighborhoodQueensSpriteImage : neighborhoodBrooklynSpriteImage} className="w-full h-full object-cover" alt="Dashboard View" />
          )}
          {activeTab === 'crimes' && <img src={crimesSprite} className="w-full h-full object-cover" alt="Crimes View" />}
          {activeTab === 'traffic' && <img src={contrabandSprite} className="w-full h-full object-cover" alt="Traffic View" />}
          {activeTab === 'shop' && <img src={shopSprite} className="w-full h-full object-cover" alt="Shop View" />}
          {activeTab === 'arena' && <img src={arenaSprite} className="w-full h-full object-cover" alt="Arena View" />}
          {activeTab === 'leader' && <img src={leaderSprite} className="w-full h-full object-cover" alt="Leader View" />}
          {activeTab === 'possessions' && <img src={possessionsSprite} className="w-full h-full object-cover" alt="Possessions View" />}
          {activeTab === 'metropole' && <img src={metropoleSprite} className="w-full h-full object-cover" alt="Metropole View" />}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/80 to-transparent pointer-events-none"></div>
        </div>
      )}

      {/* Dynamic atmospheric city background sky layer */}
      <div className="absolute inset-x-0 top-0 pointer-events-none overflow-hidden opacity-[0.05] flex flex-col select-none h-96 z-0">
        <div className="bg-radial-from-top from-red-500/20 to-transparent h-full"></div>
      </div>

      {/* HEADER BAR */}
      {!player && (
        <header className="mb-6 mx-auto w-full max-w-7xl px-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2 border-b border-zinc-900/50 pb-4">
            <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-widest text-zinc-400">
              <div className="flex items-center bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 shadow-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                <span className="font-semibold font-mono text-[10px] tracking-wider text-zinc-300">67 Mobsters Online</span>
              </div>
              <div className="flex items-center space-x-2 font-mono text-[10px] text-zinc-500 bg-zinc-900/30 px-3 py-1.5 rounded-full border border-zinc-800/20">
                <span>{currentTime.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
                <span className="text-zinc-700">|</span>
                <span>{currentTime.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })} BRT</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => { playSound.notification(); setLang(lang === "en" ? "pt" : "en"); }}
                className="flex items-center bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-805 text-[10px] hover:bg-zinc-800 text-zinc-300 font-bold tracking-widest font-mono transition"
              >
                <span className="mr-2 uppercase">{lang === "en" ? "ENGLISH / US" : "PORTUGUÊS / BR"}</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <div className="bg-red-600/10 border border-red-600/50 px-3 py-1 rounded-lg text-[10px] text-red-500 font-bold tracking-wider uppercase">
                18+ ONLY
              </div>
            </div>
          </div>
        </header>
      )}

      {/* FLOATING SUCCESS/WARNING ALERTS */}
      <div className="fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto sm:max-w-sm z-[99999] pointer-events-none flex flex-col gap-3">
        <AnimatePresence>
          {appAlerts.map(alert => (
            <motion.div 
              key={alert.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`pointer-events-auto p-4 border rounded-2xl text-[11px] font-mono shadow-2xl flex gap-3 overflow-hidden relative ${alert.type === "success" ? "bg-zinc-950/95 border-emerald-900/50 text-zinc-100 shadow-[0_10px_35px_-10px_rgba(16,185,129,0.3)]" : "bg-red-950/95 border-red-900/80 text-red-100 shadow-[0_10px_35px_-10px_rgba(239,68,68,0.4)]"}`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${alert.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}></div>
              <span className={`text-base select-none shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${alert.type === "success" ? "bg-emerald-950/50" : "bg-red-950/50"}`}>
                {alert.type === "success" ? "🪙" : "🚨"}
              </span>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className={`font-extrabold uppercase tracking-widest text-[8px] mb-0.5 ${alert.type === "success" ? "text-emerald-500" : "text-red-400"}`}>
                  {lang === "en" ? "System Alert //" : "Alerta de Sistema //"}
                </p>
                <p className="text-zinc-200 leading-normal font-sans max-h-[85px] overflow-y-auto pr-1 text-[11.5px] font-medium break-words md:tracking-wide">
                  {alert.msg}
                </p>
              </div>
              <button 
                onClick={() => setAppAlerts(prev => prev.filter(a => a.id !== alert.id))}
                className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-white rounded-md hover:bg-zinc-800 transition"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* PORTAL MAIN BODY */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-2 py-2 relative z-10 flex flex-col justify-center">
        
        {/* VIEW 1: AUTH REGISTRATION LOGIN PORTAL USING BENTO GRID DESIGN */}
        {!player && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none font-sans relative" id="login-portal">
            
            {/* Background Atmosphere - Animated Smoke Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 z-0">
              <span className="absolute text-5xl filter blur-sm select-none anim-slow-smoke" style={{ left: "10%", bottom: "5%", animationDelay: "0s" }}>💨</span>
              <span className="absolute text-4xl filter blur-xs select-none anim-slow-smoke" style={{ left: "45%", bottom: "2%", animationDelay: "4s" }}>💨</span>
              <span className="absolute text-6xl filter blur-md select-none anim-slow-smoke" style={{ left: "75%", bottom: "12%", animationDelay: "1s" }}>💨</span>
              <span className="absolute text-5xl filter blur-sm select-none anim-slow-smoke" style={{ left: "25%", bottom: "8%", animationDelay: "8s" }}>💨</span>
            </div>

            {/* Left Side: Cinematic Neon Title & Faction Showcase */}
            <div className="lg:col-span-8 industrial-panel p-5 sm:p-8 overflow-hidden flex flex-col justify-between min-h-[350px] lg:min-h-[500px] z-10">
              {/* Outer Neon Crimson Flare */}
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-red-600/10 rounded-full filter blur-3xl pointer-events-none"></div>
              
              {/* Top Banner Row */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-850 inline-flex shadow-inner">🕵️‍♂️</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/15 border border-red-900/40 rounded-full text-[9px] font-mono text-red-400 font-extrabold tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                  {lang === "en" ? "ACTIVE SYNDICATE WEB" : "REDE DA MÁFIA ATIVA"}
                </div>
              </div>

              {/* Title Header with Neon Flicker */}
              <div className="my-auto py-2">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-sans font-black tracking-tighter text-white mb-2 leading-none uppercase">
                  MOBSTER<span className="text-red-600 font-condensed tracking-normal ml-1 bg-gradient-to-r from-red-600 to-amber-500 bg-clip-text text-transparent anim-neon-flicker">CITY</span>
                </h1>
                <p className="text-zinc-300 max-w-lg text-xs sm:text-sm mb-6 leading-relaxed normal-case font-medium">
                  {lang === "en"
                    ? "Claim your piece of the asphalt. Navigate the dark city boroughs, trade contraband, build real estate passive empires, and dominate those who stand in your way. The premier web-text mafia simulation."
                    : "Reivindique o seu pedaço de asfalto. Vá de metrô pelos bairros, trafegue drogas de alta rentabilidade nas bocas, financie empresas de fachada, e dome os segredos da Máfia mais rentável da web."}
                </p>

                {/* Micro visual guides for new players */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-950/50 p-3 rounded-2xl border border-zinc-900/60 text-center font-mono">
                  <div className="p-1.5">
                    <span className="block text-lg mb-0.5">🌇</span>
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">{lang === "en" ? "6 DISTRICTS" : "6 BAIRROS"}</span>
                  </div>
                  <div className="p-1.5">
                    <span className="block text-lg mb-0.5">🎒</span>
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">{lang === "en" ? "SMUGGLING" : "TRÁFICO"}</span>
                  </div>
                  <div className="p-1.5">
                    <span className="block text-lg mb-0.5">💰</span>
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">{lang === "en" ? "BUSINESS EMPIRE" : "EMPREENDIMENTOS"}</span>
                  </div>
                  <div className="p-1.5">
                    <span className="block text-lg mb-0.5">⚔️</span>
                    <span className="text-[9px] font-bold text-zinc-400 block uppercase">{lang === "en" ? "ARENA COMBAT" : "RINGUE DE CRIME"}</span>
                  </div>
                </div>
              </div>
              
              {/* System Metadata Stats in footer of block */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-900/60 pt-4 font-mono text-[9px] tracking-wider uppercase text-zinc-500">
                <div className="flex gap-4">
                  <span>VER: <strong className="text-zinc-400">2.6 STABLE</strong></span>
                  <span>SYS: <strong className="text-emerald-500">SECURE</strong></span>
                </div>
                <div>
                  <span className="text-zinc-500">&copy; MOBSTER CITY CO.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-5 z-10" id="auth-column">
              
              {authMode === "login" ? (
                /* LOGIN SCREEN VIEW */
                <div className="industrial-panel p-5 sm:p-6 flex flex-col justify-between relative min-h-[350px] transition-all duration-300">
                  <div>
                    <div className="mb-4">
                      <h2 className="text-sm font-sans font-black text-white tracking-widest uppercase flex items-center gap-1.5">
                        <span>🕵️</span>
                        {lang === "en" ? "MEMBER ACCESS" : "ACESSO MEMBRO"}
                      </h2>
                      <p className="text-[10px] text-zinc-500">
                        {lang === "en" ? "Enter your codename to establish server uplink" : "Insira seu codinome para se conectar às ruas"}
                      </p>
                    </div>

                    {loginError && (
                      <div className="bg-red-950/20 border border-red-900/60 text-red-400 font-mono text-[10px] p-2.5 rounded-xl mb-4 text-center leading-normal">
                        📢 {loginError}
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      {/* Codename Input */}
                      <div>
                        <label className="block text-[8.5px] font-mono text-zinc-500 uppercase font-black tracking-widest mb-2" htmlFor="usr-codenom-login">
                          {lang === "en" ? "CODENAME" : "CODINOME DO GÂNGSTER"}
                        </label>
                        <input 
                          type="text"
                          id="usr-codenom-login"
                          value={tempUsername}
                          onChange={(e) => { setTempUsername(e.target.value); setLoginError(null); }}
                          placeholder={lang === "en" ? "Don_Vincenzo" : "Tony_Marreta"}
                          maxLength={18}
                          className="w-full bg-zinc-950/95 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-red-600 transition font-mono uppercase text-center font-bold tracking-widest"
                          autoComplete="off"
                        />
                      </div>

                      {/* Connect Button */}
                      <button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-zinc-800 to-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white py-3.5 rounded-xl font-mono font-black uppercase tracking-widest text-[10px] shadow-md shadow-black/50 transition cursor-pointer transform duration-150 active:scale-[0.98]"
                      >
                        🔫 {lang === "en" ? "CONNECT DOSSIER" : "ENTRAR NO SUBMUNDO"}
                      </button>
                    </form>

                    {/* OR divider */}
                    <div className="relative flex py-4 items-center">
                      <div className="flex-grow border-t border-zinc-900"></div>
                      <span className="flex-shrink mx-3 text-zinc-650 text-[8px] font-mono uppercase tracking-widest">{lang === "en" ? "OR" : "OU"}</span>
                      <div className="flex-grow border-t border-zinc-900"></div>
                    </div>

                    {/* Button to go to registration */}
                    <button
                      type="button"
                      onClick={() => {
                        playSound.notification();
                        setAuthMode("register");
                        setLoginError(null);
                        setTempUsername("");
                      }}
                      className="w-full bg-gradient-to-r from-red-950/30 to-red-900/10 border border-red-900/35 hover:border-red-600 text-red-400 py-3 rounded-xl font-mono text-[9.5px] uppercase tracking-wider transition cursor-pointer text-center font-extrabold"
                    >
                      🚪 {lang === "en" ? "RECRUIT NEW CHARACTER" : "NOVA FICHA / CRIAR GÂNSTER"}
                    </button>
                  </div>

                  {/* Saved Profile quick log in if exists */}
                  {savedProfile && (
                    <div className="mt-5 border-t border-zinc-900/70 pt-4">
                      <p className="text-[8.5px] font-mono text-zinc-500 uppercase font-black tracking-widest mb-2 text-center">
                        {lang === "en" ? "— PERSISTENT DECK DETECTED —" : "— DISPOSITIVO DE SALVAMENTO —"}
                      </p>
                      <div className="bg-zinc-950/60 border border-amber-500/15 rounded-2xl p-3 flex items-center justify-between shadow-inner">
                        <div className="min-w-0 pr-2">
                          <p className="text-[11px] text-white font-sans font-black uppercase tracking-wide truncate">{savedProfile.name}</p>
                          <p className="text-[9px] text-amber-500 font-mono tracking-wider">Level {savedProfile.level} — {getLevelTitle(savedProfile.level, lang)}</p>
                        </div>
                        <button
                          onClick={handleResumeActiveDossier}
                          className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-lg text-center font-mono font-black uppercase text-[9px] transition active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-1"
                        >
                          <span>⚡</span> {lang === "en" ? "RESUME" : "CONTINUAR"}
                        </button>
                      </div>

                      <div className="text-center mt-2.5 flex flex-col gap-2 justify-center items-center">
                        {!showWipeConfirm ? (
                          <button
                            type="button"
                            onClick={() => {
                              playSound.notification();
                              setShowWipeConfirm(true);
                            }}
                            className="text-[8px] text-zinc-600 hover:text-red-500 font-mono uppercase tracking-widest underline transition cursor-pointer"
                          >
                            {lang === "en" ? "[ Erase Dossier ]" : "[ Apagar Dossiê ]"}
                          </button>
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 p-2 bg-red-950/25 border border-red-900/40 rounded-xl max-w-xs mx-auto animate-pulse">
                            <span className="text-[8px] text-red-400 font-mono uppercase font-black tracking-widest leading-none">
                              {lang === "en" ? "REALLY DESTRUCT DOSSIER?" : "DELETAR PARA SEMPRE?"}
                            </span>
                            <div className="flex justify-center gap-3 w-full">
                              <button
                                type="button"
                                onClick={() => {
                                  playSound.crimeFail();
                                  localStorage.removeItem(SAVE_KEY);
                                  setSavedProfile(null);
                                  setShowWipeConfirm(false);
                                  triggerAlert(lang === "en" ? "Dossier deleted." : "Dossiê deletado de sua máquina.");
                                }}
                                className="text-[8px] text-red-500 hover:text-red-400 font-mono uppercase font-black tracking-wider underline transition cursor-pointer"
                              >
                                {lang === "en" ? "YES, DELETE" : "SIM, FILTRAR"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  playSound.notification();
                                  setShowWipeConfirm(false);
                                }}
                                className="text-[8px] text-zinc-500 hover:text-zinc-300 font-mono uppercase font-black tracking-wider underline transition cursor-pointer"
                              >
                                {lang === "en" ? "CANCEL" : "CANCELAR"}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {!showWipeConfirm && (
                          <button
                            type="button"
                            onClick={() => {
                              const data = localStorage.getItem(SAVE_KEY);
                              if (data) {
                                const blob = new Blob([data], { type: "application/json" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `mobster_save_${savedProfile.name}.json`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                playSound.cash();
                                triggerAlert(lang === "en" ? "Save file downloaded!" : "Arquivo de save baixado!");
                              }
                            }}
                            className="text-[8px] text-emerald-600 hover:text-emerald-400 font-mono uppercase tracking-widest underline transition cursor-pointer"
                          >
                            {lang === "en" ? "[ Export Save Data ]" : "[ Exportar Save ]"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Manual Backup Upload */}
                  <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-center relative">
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const data = event.target?.result as string;
                            const parsed = JSON.parse(data);
                            if (parsed && typeof parsed === "object" && "name" in parsed) {
                              localStorage.setItem(SAVE_KEY, data);
                              setSavedProfile(parsed);
                              triggerAlert(lang === "en" ? "Save data imported! You can now resume." : "Dados de save importados! Você já pode continuar.", "success");
                              playSound.notification();
                            } else {
                              throw new Error("Invalid format");
                            }
                          } catch (err) {
                            triggerAlert(lang === "en" ? "Failed to read save file." : "Falha ao ler o arquivo de save.", "warn");
                          }
                        };
                        reader.readAsText(file);
                        e.target.value = ""; // reset
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      title={lang === "en" ? "Click to import save file" : "Clique para importar arquivo de save"}
                    />
                    <button type="button" className="text-[8px] font-mono text-zinc-600 uppercase border border-zinc-800 rounded px-3 py-1 pointer-events-none flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      {lang === "en" ? "IMPORT BACKUP JSON" : "IMPORTAR SAVE JSON"}
                    </button>
                  </div>

                  {/* Footer safety instruction */}
                  <div className="mt-5 pt-3 border-t border-zinc-900/60 flex items-center gap-2 text-[8px] sm:text-[9px] text-zinc-500 leading-tight">
                    <span className="text-emerald-500">🔒</span>
                    <p className="normal-case text-[8.5px]">
                      {lang === "en" 
                        ? "Real-time auto-saves are bound to your browser's sandbox."
                        : "Progresso salvo automaticamente no armazenamento do navegador."}
                    </p>
                  </div>
                </div>
              ) : (
                /* REGISTRATION SCREEN VIEW: THE MAFIA RECRUITER */
                <div className="industrial-panel p-5 sm:p-6 flex flex-col justify-between relative min-h-[350px] transition-all duration-300">
                  <div>
                    <div className="mb-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-sm font-sans font-black text-white tracking-widest uppercase flex items-center gap-1.5">
                          <span>🕶️</span>
                          {lang === "en" ? "MAFIA RECRUITER" : "RECRUTADOR DE MAFIOSO"}
                        </h2>
                        <button
                          type="button"
                          onClick={() => {
                            playSound.notification();
                            setAuthMode("login");
                          }}
                          className="text-[9px] text-zinc-500 hover:text-zinc-300 font-mono font-bold uppercase tracking-wider"
                        >
                          {lang === "en" ? "← BACK" : "← VOLTAR"}
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {lang === "en" ? "Designate your credentials and acquire class-specific stats" : "Escolha sua especialidade mafiosa e ganhe bônus iniciais"}
                      </p>
                    </div>

                    {loginError && (
                      <div className="bg-red-950/20 border border-red-900/60 text-red-400 font-mono text-[10px] p-2.5 rounded-xl mb-4 text-center leading-normal">
                        📢 {loginError}
                      </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      {/* Archetype matrix */}
                      <div>
                        <label className="block text-[8.5px] font-mono text-zinc-500 uppercase mb-2 font-black tracking-widest">
                          {lang === "en" ? "1. SELECT SPECIALIST PROFILE" : "1. SELECIONE A CLASSE CRIMINAL"}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "enforcer", emoji: "🔫", labelEn: "Enforcer", labelPt: "Capanga", descEn: "Force Boost", descPt: "Mais Força" },
                            { id: "hustler", emoji: "💼", labelEn: "Hustler", labelPt: "Traficante", descEn: "Cash Boost", descPt: "Mais Grana" },
                            { id: "ghost", emoji: "🕶️", labelEn: "Ghost", labelPt: "Invisível", descEn: "Def Boost", descPt: "Mais Defesa" },
                            { id: "don", emoji: "👑", labelEn: "The Don", labelPt: "Dom Supremo", descEn: "Respect Boost", descPt: "Mais Respeito" }
                          ].map((arch) => {
                            const isActive = selectedArchetype === arch.id;
                            return (
                              <button
                                key={arch.id}
                                type="button"
                                onClick={() => {
                                  playSound.notification();
                                  setSelectedArchetype(arch.id);
                                  // Suggest specific names on click
                                  const sugestas: Record<string, string[]> = {
                                    enforcer: ["Tony_Marreta", "Rocco_Ironfist", "Vinnie_Bruto", "Al_Scarface_Jr"],
                                    hustler: ["Jimmy_Liso", "Luck_Hustler", "Neco_da_Boca", "Dealer_Danny"],
                                    ghost: ["Sombra_Muda", "Nico_Fantasma", "Viper_Secreto", "Silent_Saul"],
                                    don: ["Dom_Salieri", "Corleone_Neto", "Capo_Gotti", "Marcello_Dom"]
                                  };
                                  const pool = sugestas[arch.id];
                                  setTempUsername(pool[Math.floor(Math.random() * pool.length)]);
                                  setLoginError(null);
                                }}
                                className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer ${
                                  isActive 
                                    ? "border-red-600 bg-red-950/15 text-red-400 font-extrabold shadow-sm scale-102" 
                                    : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-805 hover:bg-zinc-900/40"
                                }`}
                              >
                                <span className="text-xl mb-1 filter drop-shadow">{arch.emoji}</span>
                                <span className="text-[10px] font-sans block truncate uppercase max-w-full font-black leading-tight">
                                  {lang === "en" ? arch.labelEn : arch.labelPt}
                                </span>
                                <span className="text-[7.5px] font-mono text-zinc-500 block leading-none">
                                  {lang === "en" ? arch.descEn : arch.descPt}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Name specification */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[8.5px] font-mono text-zinc-500 uppercase font-black tracking-widest" htmlFor="usr-codenom-reg">
                            {lang === "en" ? "2. CHOOSE CODENAME" : "2. DEFINIR CODINOME"}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              playSound.notification();
                              const pool = ["Chefe_Quente", "Tony_TwoTimes", "Zero_Capo", "Lucky_Salieri", "Mao_Boba", "Galo_Cego", "Corleone_V", "Rocco_Guns"];
                              setTempUsername(pool[Math.floor(Math.random() * pool.length)]);
                            }}
                            className="text-[7.5px] text-zinc-500 hover:text-zinc-300 font-mono font-extrabold tracking-white uppercase"
                          >
                            {lang === "en" ? "🎲 RANDOMIZE" : "🎲 GERAR"}
                          </button>
                        </div>
                        <input 
                          type="text"
                          id="usr-codenom-reg"
                          value={tempUsername}
                          onChange={(e) => { setTempUsername(e.target.value); setLoginError(null); }}
                          placeholder={lang === "en" ? "Don_Vincenzo" : "Felipe_Chapa_Quente"}
                          maxLength={18}
                          className="w-full bg-zinc-950/95 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-red-600 transition font-mono uppercase text-center font-bold tracking-widest"
                          autoComplete="off"
                        />
                      </div>

                      {/* Accept Terms */}
                      <div className="space-y-1 bg-zinc-950/90 p-2.5 rounded-xl border border-zinc-900 flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-[8.5px] font-mono text-zinc-400 leading-none">
                          <input 
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => { setTermsAccepted(e.target.checked); setLoginError(null); }}
                            className="w-4 h-4 accent-red-600 rounded bg-zinc-900 border-zinc-800 shrink-0"
                          />
                          <span>
                            {lang === "en" 
                              ? "I ACCEPT ALL SYNDICATE TERMS OF USE"
                              : "ACEITO AS LEIS DE RECRUTAMENTO MILITAR"}
                          </span>
                        </label>
                      </div>

                      {/* Recrutar Button */}
                      <button 
                        type="submit"
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3.5 rounded-xl font-mono font-black uppercase tracking-widest text-[10px] hover:from-red-500 hover:to-red-600 shadow-md shadow-red-950/50 transition cursor-pointer transform duration-150 active:scale-[0.98]"
                      >
                        🚀 {lang === "en" ? "RECRUIT MOBSTER" : "RECRUTAR MAFIOSO"}
                      </button>
                    </form>

                    {/* Returning toggle */}
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => {
                          playSound.notification();
                          setAuthMode("login");
                          setLoginError(null);
                        }}
                        className="text-[9px] font-mono text-zinc-500 hover:text-zinc-350 uppercase tracking-widest transition cursor-pointer underline"
                      >
                        {lang === "en" ? "Already have a dossier? [ Access Profile ]" : "Já possui um gângster? [ Fazer Login ]"}
                      </button>
                    </div>
                  </div>

                  {/* Age restriction label */}
                  <div className="mt-5 pt-3 border-t border-zinc-900/60 flex items-center gap-2 text-[8px] sm:text-[9px] text-zinc-500 leading-tight">
                    <span className="text-red-500">📵</span>
                    <p className="normal-case">
                      {lang === "en" 
                        ? "18+ restriction: Tactical gangster simulation with high risk digital micro assets. Act with caution."
                        : "Maiores de 18 anos. Contém simulação e ações com alta hostilidade e finanças."}
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Row: Informational bento panels & live activity feed */}
            
            {/* Live Feed Ticket block */}
            <div className="md:col-span-12 lg:col-span-6 industrial-panel p-4 flex flex-col justify-between min-h-[150px] z-10 font-mono">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-zinc-950">
                <span className="text-[9px] font-bold neon-text-pink uppercase tracking-widest">{lang === "en" ? "SYNDICATE TERMINAL WIRE" : "SINAL DO SUBMUNDO EM TEMPO REAL"}</span>
                <span className="text-[7.5px] bg-red-600/10 text-red-500 border border-red-900/30 px-1.5 py-0.5 rounded font-black animate-pulse uppercase">LIVE DATA FEED</span>
              </div>
              <div className="space-y-1.5 flex-1 flex flex-col justify-center text-[10px]">
                <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-900 flex justify-between gap-1">
                  <span className="text-zinc-400"><strong className="text-white">AlCapone_V</strong> {lang === "en" ? "escaped Lafayette precinct patrol" : "escapou da escolta policial no Brooklyn"}</span>
                  <span className="text-blue-400 font-black shrink-0">HEAT -45%</span>
                </div>
                <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-900 flex justify-between gap-1">
                  <span className="text-zinc-400"><strong className="text-white">Drogba_Slick</strong> {lang === "en" ? "safely stored Swiss Dividend" : "depositou no cofre da Suíça"}</span>
                  <span className="text-green-400 font-extrabold shrink-0">+$250,000</span>
                </div>
              </div>
            </div>

            {/* Street Bribes block */}
            <div className="sm:col-span-6 lg:col-span-3 industrial-panel p-4 flex flex-col justify-between min-h-[150px] z-10 font-mono">
              <div className="text-amber-500 bg-zinc-950/60 w-8 h-8 rounded-lg border border-zinc-900 flex items-center justify-center text-sm shadow-inner">
                🚨
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black neon-text-red tracking-tight">${globalBribesPaid.toLocaleString()}</p>
                <p className="text-[8.5px] text-zinc-500 uppercase tracking-widest font-black leading-none mt-1">{lang === "en" ? "STREET BRIBES" : "PROPINA NAS RUAS"}</p>
              </div>
            </div>

            {/* Switzerland Vaulted block */}
            <div className="sm:col-span-6 lg:col-span-3 industrial-panel p-4 flex flex-col justify-between min-h-[150px] z-10 font-mono">
              <div className="text-green-500 bg-zinc-950/60 w-8 h-8 rounded-lg border border-zinc-900 flex items-center justify-center text-sm shadow-inner">
                🏦
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black neon-text-blue tracking-tight">${globalCaymanDeposits.toLocaleString()}</p>
                <p className="text-[8.5px] text-zinc-500 uppercase tracking-widest font-black leading-none mt-1">{lang === "en" ? "CAYMAN DIVIDENDS" : "DIVIDENDOS EM CAYMAN"}</p>
              </div>
            </div>

            {/* Footer rights bar */}
            <div className="lg:col-span-12 text-center text-[9px] text-zinc-600 font-mono pt-4 leading-relaxed select-none border-t border-zinc-900/60">
              <p>&copy; 2026 Underworld Syndicate Software Foundation. Licensed under tactical operations treaty. All assets encoded.</p>
            </div>
          </div>
        )}

        {/* VIEW 2: LOGGED IN FULL MOBSTER CITY GAME */}
        {player && (
          <div className="w-full max-w-[1720px] mx-auto px-1 sm:px-4 relative flex gap-4 lg:gap-6 justify-center items-start pb-28 md:pb-24">
            {/* Left Side Gutter Art Overlay (hidden on tablets/mobile, sticky) */}
            <div className="hidden xl:flex w-[180px] shrink-0 industrial-panel overflow-hidden flex-col justify-between h-[420px] sticky top-24">
              <div className="flex-1 overflow-hidden relative">
                <img 
                  src="/src/assets/images/mafia_left_sidebar_art_1780811318076.png" 
                  alt="Mafia Gangsters" 
                  className="w-full h-full object-cover opacity-60 hover:opacity-85 transition duration-300 pointer-events-none select-none filter sepia-[0.35]"
                />
              </div>
              <div className="p-3 border-t border-zinc-900/60 bg-zinc-900/40 text-center shrink-0">
                <span className="text-[9px] font-mono font-bold text-red-500 uppercase tracking-widest">
                  {lang === "en" ? "Turf Enforcers" : "Controle de Bairro"}
                </span>
              </div>
            </div>

            {/* Core Middle Work area */}
            <div 
              className="flex-1 max-w-[1240px] h-full flex flex-col overflow-hidden min-h-0"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >

              {/* MOBILE VIEW NAVIGATION CONTROLLER (Fits everything on mobile without scroll hunts!) */}
              <div id="mobile-view-nav" className="lg:hidden sticky top-2 z-30 grid grid-cols-3 gap-2 mb-4 p-1.5 bg-zinc-950/95 backdrop-blur-md border border-zinc-900 rounded-2xl shadow-xl">
                {[
                  { id: "status", labelEn: "MOBSTER", labelPt: "GANGSTER", icon: "👤", descEn: "Vitals & Upgrades", descPt: "Ficha & Tratos", color: "text-red-500", border: "border-red-500/30", activeBg: "bg-red-500/10 border-red-500/40 text-red-400" },
                  { id: "game", labelEn: "OPERATIONS", labelPt: "SUBMUNDO", icon: "🔥", descEn: "Crimes & Gangs", descPt: "Crimes & Lutas", color: "text-amber-500", border: "border-amber-500/30", activeBg: "bg-amber-500/10 border-amber-500/40 text-amber-500" },
                  { id: "locais", labelEn: "METROPOLIS", labelPt: "METRÓPOLE", icon: "📍", descEn: "Locales & Logs", descPt: "Locais & Logs", color: "text-indigo-400", border: "border-indigo-500/30", activeBg: "bg-indigo-505/15 bg-indigo-500/10 border-indigo-500/40 text-indigo-400" }
                ].map((v) => {
                  const isActive = mobileActiveView === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        playSound.notification();
                        setMobileActiveView(v.id as any);
                        setTimeout(() => {
                          document.getElementById("mobile-view-nav")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 55);
                      }}
                      className={`relative py-2.5 px-0.5 rounded-xl border text-center transition-all duration-150 flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                        isActive 
                          ? `${v.activeBg} border-t-2 shadow-[0_4px_12px_rgba(0,0,0,0.6)]` 
                          : "bg-zinc-900/40 border-zinc-900/40 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <span className="text-xs flex items-center gap-1 font-bold">
                        <span className="text-xs leading-none">{v.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-wider">{lang === "en" ? v.labelEn : v.labelPt}</span>
                      </span>
                      <span className="text-[7px] font-mono tracking-wide uppercase opacity-70 leading-none">
                        {lang === "en" ? v.descEn : v.descPt}
                      </span>
                      {isActive && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-current animate-pulse" />
                      )}
                      {v.id === "game" && newContractIndicator && (
                        <>
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 border border-zinc-950 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start select-none font-sans" id="gamerpg-core-grid">
            
                {/* COLUMN 1: LEFT SIDEBAR (Vital Dashboard, Attributes, Gear Grid, Loyalty Timer) */}
                <div className={`${mobileActiveView === "status" ? `block ${mobileSlideDirection === "right" ? "animate-slide-from-right" : "animate-slide-from-left"}` : "hidden"} lg:block col-span-12 lg:col-span-3 space-y-4`}>

                  {/* RETRO STATS SPECIMEN CARDS (BENTO) */}
              <InteractiveCard className="p-5 shadow-2xl">
                <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-3">
                  {lang === "en" ? "PRIMARY ATTRIBUTES" : "ATRIBUTOS DO GANGSTER"}
                </h4>
                
                <div className="grid grid-cols-2 gap-2 text-zinc-400 font-mono text-[10px] select-none">
                  {/* STR Card */}
                  {(() => {
                    const itemBonus = player.activeWeapon ? 12 : 0; // weapon multiplier bonus
                    return (
                      <div className="bg-zinc-950 p-2 border border-zinc-900 rounded-xl relative">
                        <p className="text-[9px] text-zinc-500">FORÇA / STR</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-white font-bold">{player.strength}</span>
                          {itemBonus > 0 && <span className="text-[8px] px-1 bg-red-950 text-red-500 rounded font-black font-mono">+{itemBonus}</span>}
                        </div>
                      </div>
                    );
                  })()}

                  {/* DEF Card */}
                  {(() => {
                    const itemBonus = player.activeVehicle ? 15 : 0; // escape cruiser bonus multiplier
                    return (
                      <div className="bg-zinc-950 p-2 border border-zinc-900 rounded-xl relative">
                        <p className="text-[9px] text-zinc-500">DEFESA / DEF</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-white font-bold">{player.defense}</span>
                          {itemBonus > 0 && <span className="text-[8px] px-1 bg-blue-950 text-blue-500 rounded font-black font-mono">+{itemBonus}</span>}
                        </div>
                      </div>
                    );
                  })()}

                  {/* REP RESPECT */}
                  <div className="bg-zinc-950 p-2 border border-zinc-900 rounded-xl">
                    <p className="text-[9px] text-zinc-500">COTE RESPECT</p>
                    <p className="text-amber-500 font-bold mt-0.5">{player.respect.toLocaleString()}</p>
                  </div>

                  {/* COMBATS WON */}
                  <div className="bg-zinc-950 p-2 border border-zinc-900 rounded-xl">
                    <p className="text-[9px] text-zinc-500">FIGHTS / RINGUE</p>
                    <p className="text-indigo-400 font-bold mt-0.5">
                      {player.fightsWon}<span className="text-zinc-650 text-[8px] font-normal mx-0.5">/</span>{player.fightsLost}
                    </p>
                  </div>
                </div>

                {/* Visual Achievement Badges */}
                <div className="mt-4 pt-3.5 border-t border-zinc-900/60 space-y-2">
                  <div className="flex justify-between items-center select-none">
                    <p className="text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
                      {lang === "en" ? "UNDERWORLD CONQUESTS" : "CONQUISTAS DO SUBMUNDO"}
                    </p>
                    <span className="text-[8px] font-mono text-zinc-600 font-bold">
                      {
                        ([50, 100, 250].filter(t => player.strength >= t).length +
                         [50, 100, 250].filter(t => player.defense >= t).length)
                      }/6 UNLOCKED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 select-none">
                    {/* Strength Achievements Column */}
                    <div className="space-y-1">
                      <p className="text-[8px] font-mono text-red-500/80 font-bold uppercase tracking-wider">
                        ⚔️ {lang === "en" ? "ATTACK INTEL" : "FORÇA BRUTA"}
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { val: 50, icon: "👊", titleEn: "Brawler (50 STR)", titlePt: "Brigão (50 FOR)", color: "from-orange-600/30 to-orange-505/20 text-orange-400 border-orange-500/20 shadow-orange-500/5 hover:border-orange-500/40" },
                          { val: 100, icon: "💀", titleEn: "Enforcer (100 STR)", titlePt: "Executor (100 FOR)", color: "from-rose-600/30 to-red-650/20 text-red-400 border-red-500/20 shadow-red-550/5 hover:border-red-500/40" },
                          { val: 250, icon: "👑", titleEn: "Overlord (250 STR)", titlePt: "Soberano (250 FOR)", color: "from-yellow-500/30 to-amber-500/20 text-amber-300 border-yellow-500/20 shadow-yellow-500/5 hover:border-yellow-500/40" }
                        ].map((b) => {
                          const isUnlocked = player.strength >= b.val;
                          return (
                            <div 
                              key={b.val}
                              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all duration-300 ${
                                isUnlocked 
                                  ? `bg-gradient-to-b ${b.color} shadow-lg cursor-help hover:scale-110` 
                                  : "bg-zinc-950/40 border-zinc-900 text-zinc-700 cursor-not-allowed opacity-40 hover:opacity-60"
                              }`}
                              title={isUnlocked ? (lang === "en" ? `${b.titleEn} - Unlocked!` : `${b.titlePt} - Desbloqueado!`) : (lang === "en" ? `${b.titleEn} - Locked` : `${b.titlePt} - Bloqueado`)}
                            >
                              <span className={`text-sm ${isUnlocked ? "filter drop-shadow-[0_0_5px_currentColor]" : ""}`}>{isUnlocked ? b.icon : "🔒"}</span>
                              <span className="text-[7.5px] font-mono mt-1 font-bold">{b.val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Defense Achievements Column */}
                    <div className="space-y-1">
                      <p className="text-[8px] font-mono text-blue-500/80 font-bold uppercase tracking-wider">
                        🛡️ {lang === "en" ? "DEFENSE GEAR" : "RESISTÊNCIA"}
                      </p>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { val: 50, icon: "🛡️", titleEn: "Bulwark (50 DEF)", titlePt: "Bastião (50 DEF)", color: "from-blue-600/30 to-cyan-600/20 text-blue-400 border-blue-500/20 shadow-blue-500/5 hover:border-blue-500/40" },
                          { val: 100, icon: "🧱", titleEn: "Tactical (100 DEF)", titlePt: "Tático (100 DEF)", color: "from-cyan-600/30 to-teal-655/20 text-cyan-400 border-cyan-500/20 shadow-cyan-550/5 hover:border-cyan-500/40" },
                          { val: 250, icon: "🌌", titleEn: "Immortal (250 DEF)", titlePt: "Imortal (250 DEF)", color: "from-indigo-600/30 to-violet-655/20 text-violet-350 text-violet-300 border-indigo-500/20 shadow-indigo-500/5 hover:border-indigo-500/40" }
                        ].map((b) => {
                          const isUnlocked = player.defense >= b.val;
                          return (
                            <div 
                              key={b.val}
                              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all duration-300 ${
                                isUnlocked 
                                  ? `bg-gradient-to-b ${b.color} shadow-lg cursor-help hover:scale-110` 
                                  : "bg-zinc-950/40 border-zinc-900 text-zinc-700 cursor-not-allowed opacity-40 hover:opacity-60"
                              }`}
                              title={isUnlocked ? (lang === "en" ? `${b.titleEn} - Unlocked!` : `${b.titlePt} - Desbloqueado!`) : (lang === "en" ? `${b.titleEn} - Locked` : `${b.titlePt} - Bloqueado`)}
                            >
                              <span className={`text-sm ${isUnlocked ? "filter drop-shadow-[0_0_5px_currentColor]" : ""}`}>{isUnlocked ? b.icon : "🔒"}</span>
                              <span className="text-[7.5px] font-mono mt-1 font-bold">{b.val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </InteractiveCard>

              {/* EQUIPMENT GRID BOXES (WARDROBE ACQUISITIONS) */}
              <InteractiveCard className="p-5 shadow-2xl">
                <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-3.5">
                  {lang === "en" ? "EQUIPPED OFFENSIVE GEAR" : "EQUIPAMENTOS ATIVOS"}
                </h4>
                
                {/* 4 item slot tiles */}
                <div className="grid grid-cols-4 gap-2">
                  
                  {/* Weapon Slot */}
                  {(() => {
                    const weap = SHOP_ITEMS.find((i) => i.id === player.activeWeapon);
                    return (
                      <div 
                        className={`col-span-1 aspect-square bg-zinc-950 rounded-xl border flex flex-col items-center justify-center relative group select-none ${weap ? "border-red-900/60 shadow-lg shadow-red-955/20" : "border-zinc-900"}`}
                        title={weap ? (lang === "en" ? weap.nameEn : weap.namePt) : (lang === "en" ? "Empty Weapon Slot" : "Arma Desequipada")}
                      >
                        <span className="text-base select-none">{weap ? "🔫" : "❔"}</span>
                        <span className="text-[7px] font-mono text-zinc-600 tracking-widest font-black uppercase mt-0.5">
                          {weap ? weap.id.substring(0, 3).toUpperCase() : "STR"}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Bodyguard Slot */}
                  {(() => {
                    const hasBulldog = player.level >= 5;
                    return (
                      <div 
                        className={`col-span-1 aspect-square bg-zinc-950 rounded-xl border flex flex-col items-center justify-center relative select-none ${hasBulldog ? "border-amber-900/40 shadow shadow-amber-950/20" : "border-zinc-900 opacity-30"}`}
                        title={hasBulldog ? (lang === "en" ? "Elite Bulldog Secured" : "Buldogue Elite Ativo") : (lang === "en" ? "Locks at Level 5" : "Bloqueado Ní. 5")}
                      >
                        <span className="text-base select-none">🐕</span>
                        <span className="text-[7px] font-mono text-zinc-650 tracking-widest font-black uppercase mt-0.5">
                          {hasBulldog ? "DOG" : "LCK"}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Vehicle Slot */}
                  {(() => {
                    const veh = SHOP_ITEMS.find((i) => i.id === player.activeVehicle);
                    return (
                      <div 
                        className={`col-span-1 aspect-square bg-zinc-950 rounded-xl border flex flex-col items-center justify-center relative select-none ${veh ? "border-blue-900/60 shadow-lg shadow-blue-955/20" : "border-zinc-900"}`}
                        title={veh ? (lang === "en" ? veh.nameEn : veh.namePt) : (lang === "en" ? "Empty Escape Vehicle" : "Sem Getaway Car")}
                      >
                        <span className="text-base select-none">{veh ? "🚗" : "❔"}</span>
                        <span className="text-[7px] font-mono text-zinc-600 tracking-widest font-black uppercase mt-0.5">
                          {veh ? veh.id.substring(0, 3).toUpperCase() : "DEF"}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Safehouse Slot */}
                  {(() => {
                    const hasHouse = player.realEstate.length > 0;
                    return (
                      <div 
                        className={`col-span-1 aspect-square bg-zinc-950 rounded-xl border flex flex-col items-center justify-center relative select-none ${hasHouse ? "border-emerald-950 shadow-lg shadow-emerald-950/10" : "border-zinc-900 opacity-30"}`}
                        title={hasHouse ? (lang === "en" ? "Safehouse Network Running" : "Sede Operacional Adquirida") : (lang === "en" ? "No Estate Owned" : "Sem Imóveis")}
                      >
                        <span className="text-base select-none">🏠</span>
                        <span className="text-[7px] font-mono text-zinc-650 tracking-widest font-black uppercase mt-0.5">
                          {hasHouse ? "PROP" : "LCK"}
                        </span>
                      </div>
                    );
                  })()}

                </div>
              </InteractiveCard>

              {/* DIRECTORY NAVIGATION SHORTCUT LINK LIST */}
              <InteractiveCard className="p-5 shadow-2xl flex flex-col space-y-1">
                <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-3">
                  {lang === "en" ? "MINISTRY OPERATIONS" : "MENU DE INVESTIDA"}
                </h4>
                
                {/* Minhas Coisas - Shop tab */}
                <button 
                  onClick={() => { playSound.notification(); navigateAndScroll("possessions"); }}
                  className={`w-full py-2 px-3.5 rounded-xl border border-zinc-900/50 text-left font-mono font-bold text-xs uppercase transition-all duration-100 flex items-center justify-between group ${activeTab === "possessions" ? "bg-red-955/20 bg-red-950/20 border-red-500/20 text-red-500 font-bold" : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"}`}
                >
                  <span>🎩 {lang === "en" ? "My Possessions" : "Minhas Coisas"}</span>
                  <span className="text-[9px] bg-zinc-900 border border-zinc-850 px-1 rounded text-zinc-500 font-normal">
                    {player.weapons.length + player.vehicles.length + player.realEstate.length + Object.keys(player.pets || {}).length}
                  </span>
                </button>

                {/* Habilidades - Arena tab */}
                <button 
                  onClick={() => { playSound.notification(); navigateAndScroll("arena"); }}
                  className={`w-full py-2 px-3.5 rounded-xl border border-zinc-900/50 text-left font-mono font-bold text-xs uppercase transition-all duration-100 flex items-center justify-between group ${activeTab === "arena" ? "bg-red-955/20 bg-red-950/20 border-red-500/20 text-red-500 font-bold" : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"}`}
                >
                  <span>🧠 {lang === "en" ? "Attributes & Skills" : "Habilidades"}</span>
                  <span className="text-[9px] text-zinc-650 group-hover:text-red-400">&gt;</span>
                </button>

                {/* Caixa de Entrada Modal Trigger */}
                <button 
                  onClick={() => { playSound.notification(); setInboxOpen(true); }}
                  className="w-full py-2 px-3.5 rounded-xl bg-zinc-950 border border-zinc-900/50 text-left font-mono font-bold text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all duration-100 flex items-center justify-between group"
                >
                  <span className="flex items-center gap-1.5">
                    ✉️ {lang === "en" ? "Incoming Inbox" : "Caixa de Entrada"}
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                  </span>
                  <span className="text-[8px] font-black bg-red-650/10 text-red-550 text-red-500 px-1.5 py-0.5 rounded border border-red-950/40 animate-pulse">
                    NEW
                  </span>
                </button>

                {/* Histórico Auto-Scroll to logs */}
                <button 
                  onClick={() => { 
                    playSound.notification(); 
                    if (window.innerWidth < 1024) {
                      document.getElementById("logs-panel")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="w-full py-2 px-3.5 rounded-xl bg-zinc-950 border border-zinc-900/50 text-left font-mono font-bold text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition"
                >
                  <span>📜 {lang === "en" ? "Console History" : "Histórico de Logs"}</span>
                </button>
              </InteractiveCard>

              {/* LOYALTY TICKER (DAILY COUNTDOWN BOUNTY REWARD TIMER) */}
              <div className="bg-[#09090b] border border-zinc-900 rounded-3xl p-5 shadow-2xl relative select-none">
                <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  {lang === "en" ? "SYNDICATE PAYOUT TICK" : "COBRANÇA DE FIDELIDADE"}
                </h4>
                
                {bonusSeconds > 0 ? (
                  <div 
                    onClick={() => playSound.crimeFail()}
                    className="w-full py-3 px-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col items-center justify-center cursor-not-allowed group active:scale-95 duration-100 border-l border-l-zinc-800"
                  >
                    <span className="text-[9px] text-zinc-500 font-bold tracking-wider font-mono">
                      {lang === "en" ? "LOYALTY BOUNTY COOLDOWN" : "BÔNUS DIÁRIO COOLDOWN"}
                    </span>
                    <span className="text-sm font-black font-mono text-zinc-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-505 text-zinc-650" />
                      {(() => {
                        const h = String(Math.floor(bonusSeconds / 3600)).padStart(2, "0");
                        const m = String(Math.floor((bonusSeconds % 3600) / 60)).padStart(2, "0");
                        const s = String(bonusSeconds % 60).padStart(2, "0");
                        return `${h}:${m}:${s}`;
                      })()}
                    </span>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      playSound.cash();
                      const added = Math.floor(Math.random() * 1500) + 1200;
                      setPlayer((prev) => prev ? { ...prev, cash: prev.cash + added } : null);
                      addGameLog(
                        `Collected Syndicate Patron Dividend bonus of +$${added.toLocaleString()} cash!`,
                        `Coletou o Bônus de Fidelidade da Máfia de +$${added.toLocaleString()} em dinheiro!`,
                        "bonus",
                        "🎁"
                      );
                      triggerAlert(lang === "en" ? `Syndicate bonus claimed: +$${added}!` : `Bônus do Sindicato coletado: +$${added}!`, "success");
                      setBonusSeconds(1357); // 22 min 37s reset
                    }}
                    className="w-full py-3 px-4 bg-red-950/25 border border-red-500/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-red-950/35 active:scale-95 transition duration-150 border-l border-l-red-500 animate-pulse"
                  >
                    <span className="text-[10px] text-red-500 font-extrabold tracking-wider font-mono uppercase">
                      {lang === "en" ? "PAYOUT PENDING!" : "BRINDE DISPONÍVEL!"}
                    </span>
                    <span className="text-xs font-bold text-white mt-1 uppercase">
                      {lang === "en" ? "CLAIM DIVIDEND" : "COBRAR SALDO DIÁRIO"}
                    </span>
                  </button>
                )}
              </div>

            </div>

            {/* COLUMN 2: CENTER WORKBOARD (Stats bar, navigation, tab elements, console logs feed) */}
            <div className={`${mobileActiveView === "game" ? `block ${mobileSlideDirection === "right" ? "animate-slide-from-right" : "animate-slide-from-left"}` : "hidden"} lg:block col-span-12 lg:col-span-6 space-y-4`}>
              
              {/* LIQUID STATS BLOCK */}
              <div className="grid grid-cols-2 gap-3 industrial-panel p-3">
                <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-850/60 flex items-center gap-2 font-mono col-span-1">
                  <span className="text-base shrink-0">📍</span>
                  <div className="overflow-hidden">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{lang === "en" ? "BOROUGH" : "BAIRRO ATIVO"}</p>
                    <p className="text-xs font-black text-amber-500 uppercase truncate">
                      {lang === "en" 
                        ? (NEIGHBORHOODS.find((n) => n.id === player.location)?.nameEn || player.location)
                        : (NEIGHBORHOODS.find((n) => n.id === player.location)?.namePt || player.location)}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-850/60 flex items-center gap-2 font-mono col-span-1" title={lang === "en" ? `${getLevelTitle(player.level, "en")} (Level ${player.level})` : `${getLevelTitle(player.level, "pt")} (Nível ${player.level})`}>
                  <span className="text-base shrink-0">★</span>
                  <div className="overflow-hidden">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{lang === "en" ? "LEVEL RANK" : "PATENTE"}</p>
                    <p className="text-xs font-black text-indigo-400 truncate">Lvl {player.level}: {getLevelTitle(player.level, lang)}</p>
                  </div>
                </div>
              </div>

              {/* CORE ACTIVE TAB ACTION SELECTOR PANEL RIBBON */}
              <nav id="main-tab-nav" className="flex flex-nowrap overflow-x-auto no-scrollbar xl:grid xl:grid-cols-8 gap-2 p-1.5 bg-[#09090c] border border-zinc-800 rounded-2xl md:rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.9),_0_0_25px_rgba(220,38,38,0.08)] relative select-none">
                {[
                  { id: "dash", labelEn: "DOSSIER", labelPt: "GANGSTER", descEn: "Status & Vaults", descPt: "Status e Cofres", icon: "🥷", activeColor: "border-red-500 text-red-400 bg-zinc-900 shadow-[0_4px_25px_rgba(239,68,68,0.18)]" },
                  { id: "crimes", labelEn: "HEISTS", labelPt: "CRIMES", descEn: "Risk & Profits", descPt: "Riscos e Lucros", icon: "🔥", activeColor: "border-amber-500 text-amber-400 bg-zinc-900 shadow-[0_4px_25px_rgba(245,158,11,0.18)]", badge: "HOT" },
                  { id: "traffic", labelEn: "CONTRABAND", labelPt: "TRÂNSITO", descEn: "Subway Runs", descPt: "Viagens de Metrô", icon: "🚇", activeColor: "border-blue-500 text-blue-400 bg-zinc-900 shadow-[0_4px_25px_rgba(59,130,246,0.18)]" },
                  { id: "shop", labelEn: "ARMORY", labelPt: "LOJAS", descEn: "Weapons & Gear", descPt: "Armas e Tratos", icon: "🛍️", activeColor: "border-emerald-500 text-emerald-400 bg-zinc-900 shadow-[0_4px_25px_rgba(16,185,129,0.18)]" },
                  { id: "metropole", labelEn: "METROPOLIS", labelPt: "LOCAIS", descEn: "Estates & Street", descPt: "Imóveis e Rua", icon: "📍", activeColor: "border-cyan-500 text-cyan-400 bg-zinc-900 shadow-[0_4px_25px_rgba(6,182,212,0.18)]" },
                  { id: "possessions", labelEn: "MY THINGS", labelPt: "PATRIMÔNIO", descEn: "My Arsenal", descPt: "Seu Patrimônio", icon: "🎩", activeColor: "border-teal-500 text-teal-400 bg-zinc-900 shadow-[0_4px_25px_rgba(20,184,166,0.18)]" },
                  { id: "arena", labelEn: "ARENA", labelPt: "RINGUE", descEn: "Gym & Sparring", descPt: "Treino e Lutas", icon: "🥊", activeColor: "border-rose-500 text-rose-400 bg-zinc-900 shadow-[0_4px_25px_rgba(244,63,94,0.18)]", badge: "VS" },
                  { id: "leader", labelEn: "FAMILIES", labelPt: "RANKING", descEn: "Empire Fame", descPt: "Fama do Império", icon: "👑", activeColor: "border-indigo-500 text-indigo-400 bg-zinc-900 shadow-[0_4px_25px_rgba(99,102,241,0.18)]" },
                ].map((t) => {
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        playSound.notification();
                        setActiveTab(t.id);
                        if (t.id === "crimes") {
                          setNewContractIndicator(false);
                        }
                      }}
                      className={`relative px-3 py-2 md:py-2.5 rounded-xl md:rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 select-none overflow-hidden cursor-pointer group active:scale-95 shrink-0 min-w-[90px] md:min-w-0 md:shrink ${
                        isActive 
                          ? `${t.activeColor} border-t-2` 
                          : "bg-zinc-950/95 border-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 hover:border-zinc-700 shadow-md"
                      }`}
                    >
                      {/* Active gradient light highlight */}
                      {isActive && (
                        <div className="absolute top-0 inset-x-3 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent" />
                      )}

                      {/* Decorative active indicator dot */}
                      {isActive && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-current" />
                      )}

                      {/* Small badge overlay */}
                      {t.id === "crimes" && newContractIndicator ? (
                        <span className="absolute top-1 right-1 px-1 py-0.5 rounded text-[7px] font-black font-mono leading-none bg-emerald-500 text-black uppercase tracking-wider scale-90 origin-top-right animate-pulse border border-emerald-400/40 shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                          {lang === "en" ? "NEW CONTRACT" : "CONTRATO"}
                        </span>
                      ) : t.badge ? (
                        <span className="absolute top-1 right-1 px-1 py-0.5 rounded text-[7px] font-black font-mono leading-none bg-red-655 bg-red-600 text-white uppercase tracking-wider scale-90 origin-top-right animate-pulse">
                          {t.badge}
                        </span>
                      ) : null}

                      {/* Icon and Title */}
                      <span className="text-xs flex items-center gap-1.5 font-bold tracking-normal">
                        <span className="text-sm scale-100 group-hover:scale-110 transition-transform duration-100">{t.icon}</span>
                        <span className="font-sans text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                          {lang === "en" ? t.labelEn : t.labelPt}
                        </span>
                      </span>

                      {/* Captive subtitle */}
                      <span className="text-[7.5px] font-mono tracking-wide uppercase opacity-55 font-semibold text-zinc-500 group-hover:text-zinc-400 leading-none">
                        {lang === "en" ? t.descEn : t.descPt}
                      </span>
                    </button>
                  );
                })}
              </nav>

              {/* CENTRAL TAB VIEW MODULE */}
              <div className="min-h-[440px]">
                <AnimatePresence mode="wait">
                  {activeTab === "dash" && (
                    <motion.div
                      key="dash"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Dashboard 
                        player={player}
                        onDeposit={handleDepositCoins}
                        onWithdraw={handleWithdrawCoins}
                        lang={lang}
                        setLang={setLang}
                        onReset={handleResetGame}
                        onUpdatePlayerState={(updater) => {
                          setPlayer((prev) => prev ? updater(prev) : null);
                        }}
                        addGameLog={addGameLog}
                        triggerAlert={(msg, type) => triggerAlert(msg, type || "success")}
                      />
                    </motion.div>
                  )}

                  {activeTab === "crimes" && (
                    <motion.div
                      key="crimes"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Crimes 
                        player={player}
                        onCommitCrime={handleSoloCrime}
                        onExecuteHeist={handleExecuteHeist}
                        triggerAlert={triggerAlert}
                        lang={lang}
                      />
                    </motion.div>
                  )}

                  {activeTab === "traffic" && (
                    <motion.div
                      key="traffic"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      {/* Interactive Visual View Mode Selector */}
                      <div className="bg-zinc-950 p-2.5 border border-zinc-900 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-lg select-none">
                        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500 font-bold px-2 uppercase">
                          <span className="text-sm">👁️</span>
                          <span>{lang === "en" ? "VISUAL MODE" : "MODO DE VISUALIZAÇÃO"} :</span>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => { playSound.notification(); setUseIsometricMap(false); }}
                            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl border font-mono text-[10px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${!useIsometricMap ? "bg-red-955/35 border-red-500/60 text-red-400 font-black shadow-[0_0_12px_rgba(239,68,68,0.2)]" : "bg-zinc-900 border-zinc-900 text-zinc-400 hover:text-zinc-200"}`}
                          >
                            📊 {lang === "en" ? "GRID INFO" : "MODO TABELA"}
                          </button>
                          <button
                            onClick={() => { playSound.notification(); setUseIsometricMap(true); }}
                            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl border font-mono text-[10px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${useIsometricMap ? "bg-gradient-to-r from-red-600/25 to-rose-600/25 border-red-500 text-red-300 font-black shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse-slow" : "bg-zinc-900 border-zinc-900 text-zinc-400 hover:text-zinc-200"}`}
                          >
                            🏙️ {lang === "en" ? "3D CITY MAP" : "MAPA 3D DA CIDADE"}
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <AnimatePresence mode="wait">
                          {useIsometricMap ? (
                            <motion.div
                              key="map-view"
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                            >
                              <IsometricCityMap 
                                player={player}
                                prices={drugPrices}
                                onTravel={handleTravelBoroughs}
                                onBuyDrugs={handleBuyDrugs}
                                onSellDrugs={handleSellDrugs}
                                lang={lang}
                                smugglersBonusActive={smugglersBonusActive}
                                onCommitCrime={handleSoloCrime}
                                onExecuteHeist={handleExecuteHeist}
                                onHospitalRecovery={handleHospitalRecoverLife}
                                onBribePolice={handleBribePolice}
                                onTrainStats={handleGymTraining}
                                onDeposit={handleDepositCoins}
                                onWithdraw={handleWithdrawCoins}
                                onNavigateTab={(tab: string) => { playSound.notification(); navigateAndScroll(tab as any); }}
                              />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="grid-view"
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                            >
                              <BlackMarket 
                                player={player}
                                prices={drugPrices}
                                onTravel={handleTravelBoroughs}
                                onBuyDrugs={handleBuyDrugs}
                                onSellDrugs={handleSellDrugs}
                                lang={lang}
                                smugglersBonusActive={smugglersBonusActive}
                                onCommitCrime={handleSoloCrime}
                                onExecuteHeist={handleExecuteHeist}
                                onHospitalRecovery={handleHospitalRecoverLife}
                                onBribePolice={handleBribePolice}
                                onTrainStats={handleGymTraining}
                                onDeposit={handleDepositCoins}
                                onWithdraw={handleWithdrawCoins}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "shop" && (
                    <motion.div
                      key="shop"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Arsenal 
                        player={player}
                        onBuyItem={handleBuyItem}
                        onToggleWeapon={handleToggleActiveWeapon}
                        onToggleVehicle={handleToggleActiveVehicle}
                        onHospitalRecovery={handleHospitalRecoverLife}
                        onBribePolice={handleBribePolice}
                        onBuyPet={handleBuyPet}
                        onLevelUpPet={handleLevelUpPet}
                        onToggleActivePet={handleToggleActivePet}
                        onHireVIPCompanion={handleHireVIPCompanion}
                        lang={lang}
                        activeSubTab={shopSubTab}
                        onSubTabChange={setShopSubTab}
                      />
                    </motion.div>
                  )}

                  {activeTab === "metropole" && (
                    <motion.div
                      key="metropole"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Metropole 
                        player={player}
                        lang={lang}
                        onUpdatePlayerState={setPlayer}
                        onBuyItem={handleBuyItem}
                        onDeposit={() => {}}
                        onWithdraw={() => {}}
                        setLang={() => {}}
                        onReset={() => {}}
                        addGameLog={addGameLog}
                        triggerAlert={(m, t) => {}}
                      />
                    </motion.div>
                  )}

                  {activeTab === "possessions" && (
                    <motion.div
                      key="possessions"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                    >
                      <MyPossessions 
                        player={player}
                        lang={lang}
                        onToggleWeapon={handleToggleActiveWeapon}
                        onToggleVehicle={handleToggleActiveVehicle}
                        onToggleActivePet={handleToggleActivePet}
                        onLevelUpPet={handleLevelUpPet}
                        onConsumeDrug={handleConsumeDrug}
                      />
                    </motion.div>
                  )}

                  {activeTab === "arena" && (
                    <motion.div
                      key="arena"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Arena 
                        player={player}
                        onTrainStats={handleGymTraining}
                        onExecuteCombat={handleExecuteCombat}
                        lang={lang}
                        onUpdatePlayerState={setPlayer}
                        triggerAlert={triggerAlert}
                        addGameLog={addGameLog}
                      />
                    </motion.div>
                  )}

                  {activeTab === "leader" && (
                    <motion.div
                      key="leader"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Leaderboard 
                        player={player}
                        lang={lang}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Logs feed moved to HUD modal */}


              {/* RECOVERY Ticker Banner Recovery Warning */}
              <footer className="w-full industrial-panel p-4 text-center text-[10px] font-mono text-zinc-500 leading-relaxed">
                <p>
                  📟 {lang === "en" ? "SECURE CLIENT CONNECTION" : "SINAL ENCRIPTADO DA REDE"} //{" "}
                  {lang === "en"
                    ? "Subworld nodes transmitting live. Energy resets passive +5 NRG per ticks. Keep vaults stacked."
                    : "Servidor do submundo transmitindo sinal seguro. Energia recarrega +5 a cada 15 segundos."}
                </p>
              </footer>

            </div>

            {/* COLUMN 3: RIGHT SIDEBAR (Districts shortcuts list, system toggles, alerts) */}
            <div className={`${mobileActiveView === "locais" ? `block ${mobileSlideDirection === "right" ? "animate-slide-from-right" : "animate-slide-from-left"}` : "hidden"} lg:block col-span-12 lg:col-span-3 space-y-4`}>
              
              {/* LOCAIS DA CIDADE (METROPOLITAN HOOD SHORTCUTS) */}
              <InteractiveCard className="p-5 shadow-2xl select-none">
                <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-3.5">
                  {lang === "en" ? "METROPOLIS SECTORS" : "LOCAIS DA CIDADE"}
                </h4>
                
                {/* Cities shortcuts group */}
                <div className="flex flex-col space-y-1.5 font-mono text-xs select-none">
                  
                  {/* Minha Guarita - shortcut */}
                  <div 
                    onClick={() => { playSound.notification(); navigateAndScroll("metropole"); }}
                    className="p-2 px-3.5 rounded-xl bg-zinc-950 border border-zinc-900 /hover:border-red-500/35 hover:bg-zinc-900 text-zinc-300 font-bold transition flex items-center justify-between cursor-pointer"
                  >
                    <span>🏠 {lang === "en" ? "My Street Safehouse" : "Minha Rua / Sede"}</span>
                    <span className="text-[9px] text-zinc-500 uppercase">ACTIVE</span>
                  </div>

                  {/* Extorções / Patrimônio - shortcut */}
                  <div 
                    onClick={() => { playSound.notification(); navigateAndScroll("metropole"); }}
                    className="p-2 px-3.5 rounded-xl bg-zinc-950 border border-zinc-900 /hover:border-red-500/35 hover:bg-zinc-900 text-zinc-300 font-bold transition flex items-center justify-between cursor-pointer"
                  >
                    <span>🏢 {lang === "en" ? "Extortions / Estates" : "Extorções / Imóveis"}</span>
                    <span className="text-[9px] bg-zinc-900 border border-zinc-850 px-1 rounded text-emerald-500">
                      {(player?.realEstate?.length || 0)}/3
                    </span>
                  </div>

                  {/* Cidade Brooklyn Transit shortcut */}
                  <div 
                    onClick={() => { playSound.notification(); navigateAndScroll("traffic"); }}
                    className="p-2 px-3.5 rounded-xl bg-zinc-950 border border-zinc-900 /hover:border-red-500/35 hover:bg-zinc-900 text-zinc-300 font-bold transition flex items-center justify-between cursor-pointer"
                  >
                    <span>🚇 {lang === "en" ? "Subway Metro Lines" : "Cidade / Metrô"}</span>
                    <span className="text-[9px] text-amber-500 font-sans">10%HP</span>
                  </div>

                  {/* Conselheiro Advisor Modal Trigger shortcut */}
                  <div 
                    onClick={() => { playSound.notification(); setAdvisorOpen(true); }}
                    className="p-2 px-3.5 rounded-xl bg-zinc-950 border border-zinc-900 /hover:border-red-500/35 hover:bg-zinc-900 text-zinc-300 font-bold transition flex items-center justify-between cursor-pointer"
                  >
                    <span>👴 {lang === "en" ? "Talk to Consigliere" : "O Conselheiro"}</span>
                    <span className="text-[9px] text-red-550 text-red-500 font-black">HELP</span>
                  </div>

                  {/* Academia Gym training shortcut */}
                  <div 
                    onClick={() => { playSound.notification(); navigateAndScroll("arena"); }}
                    className="p-2 px-3.5 rounded-xl bg-zinc-950 border border-zinc-900 /hover:border-red-500/35 hover:bg-zinc-900 text-zinc-300 font-bold transition flex items-center justify-between cursor-pointer"
                  >
                    <span>🏋️ {lang === "en" ? "Combat Sparring Club" : "Academia de Luta"}</span>
                    <span className="text-[9px] text-zinc-555 tracking-wide font-sans">TRAIN</span>
                  </div>

                  {/* Contrabandista travel shortcut */}
                  <div 
                    onClick={() => { playSound.notification(); navigateAndScroll("traffic"); }}
                    className="p-2 px-3.5 rounded-xl bg-zinc-950 border border-zinc-900 /hover:border-red-500/35 hover:bg-zinc-900 text-zinc-300 font-bold transition flex items-center justify-between cursor-pointer"
                  >
                    <span>🚃 {lang === "en" ? "Smugglers Wharf" : "Contrabandista"}</span>
                    <span className="text-[9px] text-zinc-500">DEAL</span>
                  </div>

                  {/* Mercado Negro shortcut */}
                  <div 
                    onClick={() => { playSound.notification(); navigateAndScroll("shop", "equipment"); }}
                    className="p-2 px-3.5 rounded-xl bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 text-zinc-300 font-bold transition flex items-center justify-between cursor-pointer"
                  >
                    <span>🛍️ {lang === "en" ? "Underworld Markets" : "Mercado Negro"}</span>
                    <span className="text-[8px] border border-emerald-950 bg-emerald-950/20 px-1 rounded text-emerald-500 font-sans">SHOP</span>
                  </div>

                  {/* Hospital Healing shortcut */}
                  <div 
                    onClick={() => { playSound.notification(); setIsHospitalOpen(true); }}
                    className="p-2 px-3.5 rounded-xl bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 text-zinc-300 font-bold transition flex items-center justify-between cursor-pointer"
                  >
                    <span>🏥 {lang === "en" ? "Central Hospital" : "Hospital Central"}</span>
                    <span className="text-[9px] text-red-500 font-sans">HEAL</span>
                  </div>

                  {/* Delegacia Police shortcut */}
                  {(() => {
                    const isHighHeat = player && player.heat > 70 && !(player.policeImmuneUntil && player.policeImmuneUntil > Date.now());
                    return (
                      <div 
                        onClick={() => { playSound.notification(); setIsPrecinctOpen(true); }}
                        className={`p-2 px-3.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                          isHighHeat 
                            ? "bg-red-950/25 border-red-650/70 hover:bg-red-900/30 text-red-500 font-extrabold animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.45)]" 
                            : "bg-zinc-950 border-zinc-900 hover:bg-zinc-900 text-zinc-300 font-bold"
                        }`}
                        title={
                          isHighHeat 
                            ? (lang === "en" ? "🚨 SWAT RAID IMMINENT RISK! Lower wanted heat level immediately!" : "🚨 RISCO IMINENTE DE INVASÃO DA SWAT! Reduza seu nível de procurado imediatamente!") 
                            : (lang === "en" ? "Police Station (Click to negotiate)" : "Delegacia (Clique para negociar)")
                        }
                      >
                        <span className="flex items-center gap-1.5">
                          {isHighHeat ? (
                            <span className="inline-block animate-[bounce_1s_infinite] text-lg select-none">🚨</span>
                          ) : (
                            <span>👮</span>
                          )}
                          <span>
                            {isHighHeat 
                              ? (lang === "en" ? "SWAT RAID RISK!" : "Risco de Invasão SWAT!") 
                              : (lang === "en" ? "Police Station" : "Delegacia de Polícia")}
                          </span>
                        </span>
                        
                        {isHighHeat ? (
                          <span className="text-[8px] bg-red-600 border border-red-400 text-white font-black px-1.5 py-0.5 rounded-full animate-bounce font-sans">
                            {lang === "en" ? "CRITICAL" : "CRÍTICO"}
                          </span>
                        ) : (
                          <span className="text-[8px] border border-blue-950 bg-blue-950/20 px-1 rounded text-blue-500 font-sans">
                            BRIBE
                          </span>
                        )}
                      </div>
                    );
                  })()}

                </div>
              </InteractiveCard>

              {/* WORLD MAP METRIC BENTO COMPLIANCE (TERRITORY IN COMMAND) */}
              <div className="bg-[#09090b] border border-zinc-900 rounded-3xl p-5 shadow-2xl relative select-none">
                <h4 className="text-[10px] font-mono font-bold text-zinc-505 text-zinc-500 uppercase tracking-widest mb-3">
                  {lang === "en" ? "SYNDICATE STATISTICS" : "MÉTRICAS DO CONSELHO"}
                </h4>
                
                <div className="space-y-3 font-mono text-[10px] text-zinc-500 select-none">
                  {/* Stat line 1: Territory dominance */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>{lang === "en" ? "TERRITORIAL POWER" : "INFLUÊNCIA DE TERRITÓRIO"}</span>
                      <strong className="text-zinc-200">
                        {Math.min(100, Math.round((player.realEstate.length / 3) * 100))}%
                      </strong>
                    </div>
                    <div className="h-1 bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round((player.realEstate.length / 3) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Stat line 2: Combat record */}
                  {(() => {
                    const totalMatches = player.fightsWon + player.fightsLost;
                    const winRatio = totalMatches > 0 ? Math.round((player.fightsWon / totalMatches) * 100) : 0;
                    return (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span>{lang === "en" ? "COMBAT WIN RATIO" : "TAXA DE VITÓRIA RINGUE"}</span>
                          <strong className="text-zinc-200">
                            {winRatio}%
                          </strong>
                        </div>
                        <div className="h-1 bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${winRatio}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Extra informational line */}
                  <div className="pt-2 border-t border-zinc-900 text-[9px] text-zinc-600 leading-tight space-y-1">
                    <p>&bull; {lang === "en" ? "Swiss Vault interest yields flat +0.3% per metropolitan travel cycle." : "Os rendimentos do cofre Suíço flutuam em +0.3% flat a cada viagem de metrô."}</p>
                    <p>&bull; {lang === "en" ? "Real estates accumulate automatic passive rents." : "Imóveis do Arsenal geram aluguel passivo automático a cada trânsito comercial."}</p>
                  </div>
                </div>
              </div>

              {/* QUICK DISMISS SAFE DISCONNECT BUTTON */}
              <button 
                onClick={handleLogout}
                className="w-full py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono font-bold rounded-2xl hover:bg-zinc-800 hover:text-white active:scale-98 transition duration-155 uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                {lang === "en" ? "SAFE DISCONNECT (LOGOUT)" : "DESLOGAR CONTA (OFFLINE)"}
              </button>

            </div>
          </div>
        </div>

          {/* Right Side Gutter Art Overlay (hidden on tablets/mobile, sticky) */}
          <div className="hidden xl:flex w-[180px] shrink-0 industrial-panel overflow-hidden flex-col justify-between h-[420px] sticky top-24">
            <div className="flex-1 overflow-hidden relative">
              <img 
                src="/src/assets/images/mafia_right_sidebar_art_1780811332775.png" 
                alt="Mafia Finances" 
                className="w-full h-full object-cover opacity-60 hover:opacity-85 transition duration-300 pointer-events-none select-none filter sepia-[0.35]"
              />
            </div>
            <div className="p-3 border-t border-zinc-900/60 bg-zinc-900/40 text-center shrink-0">
              <span className="text-[9px] font-mono font-bold text-red-500 uppercase tracking-widest">
                {lang === "en" ? "Black Markets" : "Conselho do Submundo"}
              </span>
            </div>
          </div>

        </div>
      )}
      </main>

      {/* BOX INBOX DIALOGUE MESSAGE OVERLAYS */}
      <AnimatePresence>
        {inboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl font-mono select-none"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4 font-sans">
                <span className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  CITY NET MESSENGER
                </span>
                <button 
                  onClick={() => { playSound.notification(); setInboxOpen(false); }}
                  className="text-zinc-500 hover:text-white text-xs border border-zinc-900 px-2.5 py-1 rounded-lg uppercase tracking-wider bg-zinc-900 duration-100"
                >
                  {lang === "en" ? "Close" : "Fechar"}
                </button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                <div className="p-3 bg-zinc-900/50 border border-zinc-900 rounded-xl">
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                    <strong>Don Falcone</strong>
                    <span>07.06.2026</span>
                  </div>
                  <p className="text-zinc-200 text-xs font-sans font-medium">
                    {lang === "en" 
                      ? "Vinnie, Brooklyn is getting hot. Keep your cash locked in the Swiss Vault in your Dossier before taking down higher-profile syndicate heists. Keep your head low." 
                      : "Vinnie, o Brooklyn está ficando quente. Mantenha seu dinheiro trancado no Cofre Suíço para evitar perdas em combates! Continue progredindo."}
                  </p>
                </div>

                <div className="p-3 bg-zinc-900/50 border border-zinc-900 rounded-xl">
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                    <strong>{lang === "en" ? "Underworld Informant" : "Informante do Metrô"}</strong>
                    <span>1h {lang === "en" ? "ago" : "atrás"}</span>
                  </div>
                  <p className="text-zinc-200 text-xs font-sans font-medium">
                    {lang === "en" 
                      ? "Prices are shifting! Some contrabands sell for double the price in neighboring boroughs. Travel via City Transit Subway Map to swap markets." 
                      : "Dica das ruas: O contrabando de narcóticos flutua em preços de bairro para bairro. Use o mapa de Trânsito para viajar e lucrar alto!"}
                  </p>
                </div>

                <div className="p-3 bg-zinc-900/50 border border-zinc-900 rounded-xl opacity-60">
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                    <strong>Syndicate Guard</strong>
                    <span>4h {lang === "en" ? "ago" : "atrás"}</span>
                  </div>
                  <p className="text-zinc-200 text-xs font-sans font-medium">
                    {lang === "en" 
                      ? "Your safehouse lease has been automatically extended. Rents will accumulate in your wallet passive caches." 
                      : "Aluguéis automáticos de imóveis foram repassados com sucesso para sua carteira líquida."}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOX ADVISOR DIALOGUE OVERLAYS */}
      <AnimatePresence>
        {advisorOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 relative shadow-2xl font-mono select-none"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4 font-sans">
                <span className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                  <span>👴</span>
                  {lang === "en" ? "FAMILY CONSIGLIERE ADVICE" : "CONSELHOS DO CONSIGLIERE"}
                </span>
                <button 
                  onClick={() => { playSound.notification(); setAdvisorOpen(false); }}
                  className="text-zinc-500 hover:text-white text-xs border border-zinc-900 px-2.5 py-1 rounded-lg uppercase tracking-wider bg-zinc-900 duration-100"
                >
                  {lang === "en" ? "Close" : "Fechar"}
                </button>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 text-xs">
                <p className="text-zinc-400 font-sans leading-relaxed">
                  {lang === "en" 
                    ? "Welcome to the Mobster City family. As your secret consigliere, here is how you dominate the underground syndicate:" 
                    : "Bem-vindo ao conselho do Mobster City. Como seu conselheiro leal, aqui está o caminho para a soberania corporativa:"}
                </p>

                <ul className="space-y-2.5 list-disc list-inside text-zinc-300 font-sans text-xs">
                  <li>
                    <strong>{lang === "en" ? "Swiss Vault Shielding: " : "Escudo do Cofre Suíço: "}</strong>
                    {lang === "en" 
                      ? "When entering the Combat Ringue Arena, any raw cash in your wallet can be pillaged by combatants. Keeping it deposited protects you fully." 
                      : "Dinheiro livre na sua carteira corre o risco de ser roubado no Ringue por rivais. Use o Cofre Suíço para reter 100% de proteção."}
                  </li>
                  <li>
                    <strong>{lang === "en" ? "Arbitrage Trading: " : "Trânsito e Arbitragem: "}</strong>
                    {lang === "en" 
                      ? "Subway lines allow traveling to Queens, Brooklyn, and Manhattan. Buy commodities where they are cheap, and travel to sell where pricing skyrockets." 
                      : "Bairros diferentes cobram taxas e valores diferentes de contrabando. Compre barato em uma região e use o Metrô para vender caro."}
                  </li>
                  <li>
                    <strong>{lang === "en" ? "Gym Muscle Training: " : "Academia e Treino de Força: "}</strong>
                    {lang === "en" 
                      ? "Train Strength and Defense in the sparring club using energy. Your success index in street fights directly reflects these values." 
                      : "Invista sua energia na academia para aumentar sua força e defesa. Isso mudará drasticamente sua taxa de vitórias no ringue."}
                  </li>
                  <li>
                    <strong>{lang === "en" ? "Passive Real Estate: " : "Imobiliário Passivo: "}</strong>
                    {lang === "en" 
                      ? "Arsenal estate houses generate automatic rent payouts cash directly into your wallet. Snatch them as soon as your level permits." 
                      : "Mansões e apartamentos de luxo no menu Arsenal geram rendimentos automáticos de aluguel por ciclo. Compre-os imediato!"}
                  </li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POLICE ENCOUNTER OVERLAY PANEL */}
      <AnimatePresence>
        {policeEvent && (
          (() => {
            const activeVehicleObj = player?.activeVehicle ? SHOP_ITEMS.find((item) => item.id === player.activeVehicle) : null;
            const activeWeaponObj = player?.activeWeapon ? SHOP_ITEMS.find((item) => item.id === player.activeWeapon) : null;
            const activePetObj = player?.activePet ? PETS.find((p) => p.id === player.activePet) : null;

            const vehicleName = activeVehicleObj ? (lang === "en" ? activeVehicleObj.nameEn : activeVehicleObj.namePt) : null;
            const weaponName = activeWeaponObj ? (lang === "en" ? activeWeaponObj.nameEn : activeWeaponObj.namePt) : null;
            const petName = activePetObj ? (lang === "en" ? activePetObj.nameEn : activePetObj.namePt) : null;

            if (!policeData) return null;

            return (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/20 backdrop-blur-md"
              >
                {/* Pulsing alarm red visual cue indicator overlay behind */}
                <div className="absolute inset-0 bg-gradient-to-tr from-red-650/15 via-black/80 to-blue-650/15 opacity-70 animate-pulse pointer-events-none" />

                <motion.div 
                  initial={{ scale: 0.90, y: 30 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.90, y: 30 }}
                  className="bg-black border-2 border-red-500 rounded-3xl w-full max-w-[95vw] sm:max-w-lg p-4 sm:p-6 relative shadow-[0_0_50px_rgba(220,38,38,0.25)] font-sans select-none overflow-hidden z-10 animate-shake-gentle max-h-[90vh] flex flex-col"
                >
                  {/* Flashing blue and red strobe line at the top */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 flex">
                    <div className="w-1/2 bg-blue-600 h-full animate-pulse" />
                    <div className="w-1/2 bg-red-600 h-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2 sm:pb-3 mb-2 sm:mb-4 mt-1.5 shrink-0">
                    <span className="text-[10px] sm:text-[11px] font-black text-red-500 font-mono tracking-widest flex items-center gap-1.5 animate-pulse">
                      👮 {lang === "en" ? "ACTS OF CRIMINAL COMPROMISE" : "ABORDAGEM DA POLÍCIA"}
                    </span>
                    <span className="text-[9px] sm:text-[10px] bg-red-600 text-white font-mono rounded px-2 py-0.5 font-bold uppercase tracking-tighter">
                      {player.heat}% {lang === "en" ? "Wanted" : "Procurado"}
                    </span>
                  </div>

                  {/* Siren and details title */}
                  <div className="flex flex-col flex-1 min-h-0">
                    <div className="text-center py-1 sm:py-2 space-y-1 shrink-0">
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight uppercase">
                        {lang === "en" ? policeEvent.titleEn : policeEvent.titlePt}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-zinc-400 font-sans max-w-sm mx-auto leading-relaxed hidden sm:block">
                        {lang === "en" ? policeEvent.descEn : policeEvent.descPt}
                      </p>
                    </div>

                    {/* Sub-bento layout stats */}
                    <div className="grid grid-cols-1 gap-2 text-[11px] font-mono uppercase bg-zinc-950 p-2 sm:p-3 rounded-2xl border border-zinc-900 shrink-0 mt-2 sm:mt-0">
                      <div className="text-center">
                        <p className="text-[9px] text-zinc-500 font-sans">{lang === "en" ? "BASE CUSTODY FINE & COURT BAIL" : "PENALIDADE DE FIANÇA JUDICIAL BASE"}</p>
                        <p className="text-sm font-bold text-red-500 mt-0.5">${policeEvent.bailCost.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="text-[10px] sm:text-xs font-black text-zinc-400 uppercase tracking-widest pt-2 pb-1 shrink-0">
                      💼 {lang === "en" ? "NEGOTIATE CASH BRIBE OPTIONS (RISKY)" : "NEGOCIAR ACORDOS DE SUBORNO (SELO RISCO)"}
                    </div>

                    {/* Interactive Options list */}
                    <div className="space-y-2 flex-grow overflow-y-auto pr-2 pb-2">
                      
                      {/* LOW BRIBE */}
                      <button
                        onClick={() => {
                          const cost = policeData.lowBribeCost;
                          if (player.cash < cost) return;
                          const roll = Math.random() * 100;
                          
                          if (roll <= policeData.lowBribeOdds) {
                            setPlayer((p) => {
                              if (!p) return null;
                              return {
                                ...p,
                                cash: p.cash - cost,
                                heat: Math.max(0, (p.heat ?? 0) - 20),
                                totalBribesPaid: (p.totalBribesPaid || 0) + cost
                              };
                            });
                            trackBribePayment(cost);
                            playSound.gunshot();
                            addGameLog(
                              `Slipped away! Low bribe of $${cost.toLocaleString()} was accepted by greedy patrol officers. Heat cooled.`,
                              `Despachado sob custos mínimos! Propina baixa de $${cost.toLocaleString()} aceita por patrulheiros corruptos de rua. Nível de procurado reduzido.`,
                              "level",
                              "👮"
                            );
                            triggerAlert(lang === "en" ? "Bribe accepted! Slipped past officers." : "Suborno aceito! A guarnição liberou sua passagem silenciosa.", "success");
                          } else {
                            const totalBail = policeEvent.bailCost;
                            setPlayer((p) => {
                              if (!p) return null;
                              return {
                                ...p,
                                cash: Math.max(0, p.cash - cost - totalBail),
                                respect: Math.max(0, p.respect - Math.round(p.respect * 0.10)),
                                heat: 0,
                                underSurveillanceUntil: Date.now() + 120000,
                                totalBribesPaid: (p.totalBribesPaid || 0) + cost + totalBail
                              };
                            });
                            trackBribePayment(cost + totalBail);
                            playSound.crimeFail();
                            addGameLog(
                              `Disaster! Low bribe of $${cost.toLocaleString()} was REFUSED. Corrupt cops took the money anyways, arrested you, and forced $${totalBail.toLocaleString()} bail!`,
                              `Rejeitado! Propina fraca de $${cost.toLocaleString()} recusada. Oficiais corruptos roubaram o dinheiro, efetuaram prisão e forçaram $${totalBail.toLocaleString()} de fiança!`,
                              "crime",
                              "🚑"
                            );
                            triggerAlert(
                              lang === "en" 
                                ? `Bribe Refused! Cops stole cash & charged $${totalBail.toLocaleString()} bail!` 
                                : `Suborno Rejeitado! Copiaram seus recursos de suborno e cobraram extra de $${totalBail.toLocaleString()} de fiança!`,
                              "warn"
                            );
                          }
                          setPoliceEvent(null);
                        }}
                        disabled={player.cash < policeData.lowBribeCost}
                        className={`w-full p-3 rounded-xl border flex flex-col text-left transition ${
                          player.cash >= policeData.lowBribeCost
                            ? "bg-zinc-950 border-zinc-900 hover:border-rose-600 hover:bg-rose-950/10 text-zinc-300"
                            : "bg-zinc-950/40 border-zinc-900/40 text-zinc-650 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-mono font-bold text-[11px] flex items-center gap-1">
                            💸 1. {lang === "en" ? "LOW CASH PAYOFF" : "PAGAMENTO DE PROPINA BAIXA"}
                          </span>
                          <span className="font-mono font-black text-rose-500">
                            ${policeData.lowBribeCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center w-full mt-1 text-[10px] text-zinc-500 font-mono">
                          <span>{lang === "en" ? "Hand pocket change. High rejection risk!" : "Passar trocado rápido. Risco extremo de rejeição!"}</span>
                          <span className="text-rose-400 font-bold">{lang === "en" ? "Odds:" : "Chance:"} {policeData.lowBribeOdds}%</span>
                        </div>
                      </button>

                      {/* MEDIUM BRIBE */}
                      <button
                        onClick={() => {
                          const cost = policeData.mediumBribeCost;
                          if (player.cash < cost) return;
                          const roll = Math.random() * 100;
                          
                          if (roll <= policeData.mediumBribeOdds) {
                            setPlayer((p) => {
                              if (!p) return null;
                              return {
                                ...p,
                                cash: p.cash - cost,
                                heat: Math.max(0, (p.heat ?? 0) - 40),
                                totalBribesPaid: (p.totalBribesPaid || 0) + cost
                              };
                            });
                            trackBribePayment(cost);
                            playSound.gunshot();
                            addGameLog(
                              `Bribery Escaped! Handed $${cost.toLocaleString()} mid-tier payoff to officers. Heat cooled.`,
                              `Suborno intermediário efetuado! Pagou $${cost.toLocaleString()} aos oficiais para esquecerem a ocorrência. Procurado reduzido.`,
                              "level",
                              "👮"
                            );
                            triggerAlert(lang === "en" ? "Bribe Accepted! Cops swept your profile files clean." : "Suborno computado! Oficiais apagaram seu profile do terminal.", "success");
                          } else {
                            const totalBail = policeEvent.bailCost;
                            setPlayer((p) => {
                              if (!p) return null;
                              return {
                                ...p,
                                cash: Math.max(0, p.cash - cost - totalBail),
                                respect: Math.max(0, p.respect - Math.round(p.respect * 0.12)),
                                heat: 0,
                                underSurveillanceUntil: Date.now() + 120000,
                                totalBribesPaid: (p.totalBribesPaid || 0) + cost + totalBail
                              };
                            });
                            trackBribePayment(cost + totalBail);
                            playSound.crimeFail();
                            addGameLog(
                              `Bribe attempt backfired! Payoff of $${cost.toLocaleString()} was rejected. Arrested under custody charges with $${totalBail.toLocaleString()} bail fine.`,
                              `Tentativa de suborno falhou! Pacto de $${cost.toLocaleString()} recusado pela corregedoria. Detido em flagrante com fiança de $${totalBail.toLocaleString()}.`,
                              "crime",
                              "🚑"
                            );
                            triggerAlert(
                              lang === "en" 
                                ? `Arrested! Bribe failed. Charged $${totalBail.toLocaleString()} bail.` 
                                : `Fração Rejeitada! Acordo de suborno falhou. Cobrado $${totalBail.toLocaleString()} de fiança padrão.`,
                              "warn"
                            );
                          }
                          setPoliceEvent(null);
                        }}
                        disabled={player.cash < policeData.mediumBribeCost}
                        className={`w-full p-3 rounded-xl border flex flex-col text-left transition ${
                          player.cash >= policeData.mediumBribeCost
                            ? "bg-zinc-950 border-zinc-900 hover:border-amber-500 hover:bg-amber-950/10 text-zinc-300"
                            : "bg-zinc-950/40 border-zinc-900/40 text-zinc-650 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-mono font-bold text-[11px] flex items-center gap-1">
                            💼 2. {lang === "en" ? "MEDIUM BRIEFCASE SETTLE" : "PAGAR SUBORNO MÉDIO REGULAR"}
                          </span>
                          <span className="font-mono font-black text-amber-500">
                            ${policeData.mediumBribeCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center w-full mt-1 text-[10px] text-zinc-500 font-mono">
                          <span>{lang === "en" ? "Slide envelopes of bills. Decent survival." : "Passar envelopes com grana de rua. Chance equilibrada!"}</span>
                          <span className="text-amber-400 font-bold">{lang === "en" ? "Odds:" : "Chance:"} {policeData.mediumBribeOdds}%</span>
                        </div>
                      </button>

                      {/* HIGH BRIBE */}
                      <button
                        onClick={() => {
                          const cost = policeData.highBribeCost;
                          if (player.cash < cost) return;
                          const roll = Math.random() * 100;
                          
                          if (roll <= policeData.highBribeOdds) {
                            setPlayer((p) => {
                              if (!p) return null;
                              return {
                                ...p,
                                cash: p.cash - cost,
                                heat: Math.max(0, (p.heat ?? 0) - 75),
                                totalBribesPaid: (p.totalBribesPaid || 0) + cost
                              };
                            });
                            trackBribePayment(cost);
                            playSound.gunshot();
                            addGameLog(
                              `Elite payoffs! Officers received $${cost.toLocaleString()} cash suitcase, wiping active surveillance operations immediately!`,
                              `Contrato de elite completo! Oficiais receberam maleta preta de $${cost.toLocaleString()} limpando ficha imediatamente!`,
                              "level",
                              "👮"
                            );
                            triggerAlert(lang === "en" ? "Elite Settlement! Files purged perfectly." : "Suborno Alto Efetuado! Arquivos de procurado tático expurgados.", "success");
                          } else {
                            const totalBail = policeEvent.bailCost;
                            setPlayer((p) => {
                              if (!p) return null;
                              return {
                                ...p,
                                cash: Math.max(0, p.cash - cost - totalBail),
                                respect: Math.max(0, p.respect - Math.round(p.respect * 0.15)),
                                heat: 0,
                                underSurveillanceUntil: Date.now() + 120000,
                                totalBribesPaid: (p.totalBribesPaid || 0) + cost + totalBail
                              };
                            });
                            trackBribePayment(cost + totalBail);
                            playSound.crimeFail();
                            addGameLog(
                              `Extreme Bad Luck! High bribe of $${cost.toLocaleString()} leaked during tactical sting operation. Arrested and fined $${totalBail.toLocaleString()} bail.`,
                              `Infortúnio extremo! Suborno VIP de $${cost.toLocaleString()} interceptado por investigadores federais. Fiança de $${totalBail.toLocaleString()} aplicada.`,
                              "crime",
                              "🚑"
                            );
                            triggerAlert(
                              lang === "en" 
                                ? `Sting Operation! Elite bribe failed. Arrested, fined $${totalBail.toLocaleString()} bail.` 
                                : `Corregedoria Federal! Suborno VIP interceptado na corregedoria. Fiança de $${totalBail.toLocaleString()} aplicada.`,
                              "warn"
                            );
                          }
                          setPoliceEvent(null);
                        }}
                        disabled={player.cash < policeData.highBribeCost}
                        className={`w-full p-3 rounded-xl border flex flex-col text-left transition ${
                          player.cash >= policeData.highBribeCost
                            ? "bg-zinc-950 border-zinc-900 hover:border-emerald-500 hover:bg-emerald-950/15 text-zinc-300"
                            : "bg-zinc-950/40 border-zinc-900/40 text-zinc-650 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-mono font-bold text-[11px] flex items-center gap-1">
                            💰 3. {lang === "en" ? "ELITE HIGH BUSTER PAYOFF" : "SUBORNO DE ELITE ALTO (MAX CHANCE)"}
                          </span>
                          <span className="font-mono font-black text-emerald-400">
                            ${policeData.highBribeCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center w-full mt-1 text-[10px] text-zinc-500 font-mono">
                          <span>{lang === "en" ? "Heavy suitcase lube. Safest corrupt route." : "Maleta preta cheia de notas. Altíssima segurança!"}</span>
                          <span className="text-emerald-400 font-bold">{lang === "en" ? "Odds:" : "Chance:"} {policeData.highBribeOdds}%</span>
                        </div>
                      </button>

                      {/* ESCAPE THE CHASE SECTION */}
                      <div className="pt-2 border-t border-zinc-900">
                        <div className="text-[10px] font-black text-red-500 uppercase tracking-widest pb-1 flex items-center gap-1">
                          ⚡ {lang === "en" ? "TACTICAL ESCAPE / CHASE BARRIER" : "FUGIR EM ALTA VELOCIDADE (ALTÍSSIMO RISCO)"}
                        </div>
                        
                        <div className="bg-zinc-950 border border-red-950/40 p-2.5 rounded-xl space-y-1 text-[10px] font-mono text-zinc-500 mb-2">
                          <div className="flex justify-between items-center border-b border-zinc-900/80 pb-1">
                            <span>🏃 {lang === "en" ? "Base Fleeing Chance" : "Chance Base de Fuga"}</span>
                            <span>{policeData.baseEscapeChance}%</span>
                          </div>
                          
                          {vehicleName && (
                            <div className="flex justify-between items-center text-cyan-400">
                              <span>🏎️ {lang === "en" ? `Vehicle Cruise (${vehicleName})` : `Veículo de Escape (${vehicleName})`}</span>
                              <span>+{policeData.carBonus}%</span>
                            </div>
                          )}

                          {weaponName && (
                            <div className="flex justify-between items-center text-red-400">
                              <span>🔫 {lang === "en" ? `Weapon Support (${weaponName})` : `Poder de Fogo (${weaponName})`}</span>
                              <span>+{policeData.weaponBonus}%</span>
                            </div>
                          )}

                          {petName && (
                            <div className="flex justify-between items-center text-amber-500">
                              <span>🐾 {lang === "en" ? `Companion Cover (${petName})` : `Mascote de Distração (${petName})`}</span>
                              <span>+{policeData.petBonus}%</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-zinc-300">
                            <span>💪 {lang === "en" ? "Strength/Defense Attributes" : "Atributos de Força/Defesa"}</span>
                            <span>+{policeData.statsBonus}%</span>
                          </div>

                          <div className="pt-1 border-t border-zinc-900 flex justify-between items-center text-[10px] text-zinc-300 uppercase font-black tracking-wider">
                            <span>🛡️ {lang === "en" ? "CALCULATED CHANCE OF SUCCESS (CAPPED)" : "CHANCE DE SUCESSO COBRADA (LIMITE)"}</span>
                            <span className="text-red-500 font-extrabold">{policeData.finalEscapeOdds}%</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const roll = Math.random() * 100;
                            if (roll <= policeData.finalEscapeOdds) {
                              setPlayer((p) => {
                                if (!p) return null;
                                return {
                                  ...p,
                                  heat: Math.max(0, (p.heat ?? 0) - 25),
                                  exp: p.exp + 450,
                                  respect: p.respect + 150
                                };
                              });
                              playSound.crimeSuccess();
                              addGameLog(
                                `Tactical getaway complete! Slipped patrol barricade with precision high-speed chase maneuvers. Gained +450 EXP / +150 Respect.`,
                                `Fuga cinematográfica concluída! Escapou do comboio policial através de manobra em alta velocidade. Ganhou +450 EXP / +150 de Respeito!`,
                                "level",
                                "🛞"
                              );
                              triggerAlert(
                                lang === "en" 
                                  ? `Incredible Escape! You shook off the patrol units.` 
                                  : `Fuga de Sucesso! Você despistou as viaturas táticas nos túneis.`,
                                "success"
                              );
                            } else {
                              const totalBail = Math.round(policeEvent.bailCost * 1.5);
                              const healthDamage = 30;
                              setPlayer((p) => {
                                if (!p) return null;
                                return {
                                  ...p,
                                  cash: Math.max(0, p.cash - totalBail),
                                  health: Math.max(1, p.health - healthDamage),
                                  respect: Math.max(0, p.respect - Math.round(p.respect * 0.15)),
                                  heat: Math.min(100, (p.heat ?? 0) + 15),
                                  totalBribesPaid: (p.totalBribesPaid || 0) + totalBail
                                };
                              });
                              trackBribePayment(totalBail);
                              playSound.crimeFail();
                              addGameLog(
                                `Escape Attempt BUSTED! Intercepted physically. Sustained severe injuries (-${healthDamage} HP) and fined resistor bail of $${totalBail.toLocaleString()}.`,
                                `Fuga colidida na barricada tática! Rendido pelos negociadores sob força extrema (-${healthDamage} HP) e multado em $${totalBail.toLocaleString()} por resistência aérea.`,
                                "crime",
                                "💥"
                              );
                              triggerAlert(
                                lang === "en" 
                                  ? `Captured & Beatdown! Sustained -${healthDamage} HP, fined $${totalBail.toLocaleString()} bail.` 
                                  : `Capturado com Violência! Tomou -${healthDamage} de Vida e foi autuado em $${totalBail.toLocaleString()} de fiança penal com multa de desobediência.`,
                                "warn"
                              );
                            }
                            setPoliceEvent(null);
                          }}
                          className="w-full bg-red-900/80 hover:bg-red-800 text-white font-mono font-bold py-2.5 rounded-xl text-xs uppercase tracking-widest transition flex items-center justify-between px-4 border border-red-500 shadow-md shadow-red-950/25"
                        >
                          <span>🏃 {player.activeVehicle ? (lang === "en" ? "RUN THE BLOCKADE (GAS ESCAPE!)" : "TENTAR FUGIR (PISAR FUNDO NA MANOBRA)") : (lang === "en" ? "RUN THE CHASE" : "TENTAR FUGIR A PÉ")}</span>
                          <span className="font-mono font-black text-xs text-red-200">{policeData.finalEscapeOdds}% {lang === "en" ? "Odds" : "Sucesso"}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()
        )}

        {isBankModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 selection:bg-red-650"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-md bg-[#09090c]/95 border border-zinc-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85)] rounded-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              {/* Header */}
              <div className="relative px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-emerald-950/20 to-zinc-950/50 flex items-center justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">🇨🇭</span>
                    <h3 className="font-mono font-black text-xs sm:text-sm tracking-wider text-white uppercase">
                      {lang === "en" ? "Swiss Underworld Bank" : "Banco Suíço Underground"}
                    </h3>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 tracking-tight lowercase">
                    {lang === "en" ? "secretive confidential ledger system" : "registro offshore altamente confidencial"}
                  </p>
                </div>
                <button
                  onClick={() => setIsBankModalOpen(false)}
                  className="p-1 sm:p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Balances Area */}
              <div className="p-6 space-y-5 overflow-y-auto min-h-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#111116] border border-zinc-800/80 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                      {lang === "en" ? "Dirty Cash" : "Dinheiro em Mão"}
                    </span>
                    <span className="text-base sm:text-lg font-mono font-black text-emerald-400 leading-none mt-1">
                      ${player.cash.toLocaleString()}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl flex flex-col justify-between transition-all duration-300 ${
                    player.taxDebt && player.taxDebt > 0 
                      ? "bg-red-950/20 border-2 border-red-500/80 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.25)]" 
                      : "bg-[#111116] border border-zinc-800/85"
                  }`}>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                      player.taxDebt && player.taxDebt > 0 ? "text-red-450 text-red-400 font-extrabold" : "text-zinc-400"
                    }`}>
                      {lang === "en" ? "Vault Balance" : "Saldo no Cofre"}
                    </span>
                    <span className={`text-base sm:text-lg font-mono font-black leading-none mt-1 ${
                      player.taxDebt && player.taxDebt > 0 ? "text-red-400 text-red-500" : "text-amber-500"
                    }`}>
                      ${player.bank.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Underworld Tax Panel */}
                <div className="bg-gradient-to-r from-red-950/10 via-[#0d0d12] to-red-950/10 border border-zinc-900 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative overflow-hidden">
                  {player.taxDebt && player.taxDebt > 0 && (
                    <div className="absolute inset-x-0 bottom-0 h-[2.5px] bg-red-600 animate-pulse" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">⚖️</span>
                      <span className="text-[10px] font-mono font-black text-red-400 uppercase tracking-widest leading-none">
                        {lang === "en" ? "Unpaid Underworld Tax" : "Impostos Pendentes"}
                      </span>
                    </div>
                    <span className={`text-base sm:text-lg font-mono font-black block leading-none ${player.taxDebt && player.taxDebt > 0 ? "text-red-500 animate-pulse" : "text-zinc-500"}`}>
                      ${(player.taxDebt ?? 0).toLocaleString()}
                    </span>
                    <p className="text-[9px] font-mono text-zinc-500 leading-tight">
                      {lang === "en" 
                        ? "Evading taxes sparks federal monitoring, doubling the Wanted level heat you generate on crimes!" 
                        : "Sonegar impostos atrai vigilância federal, dobrando o risco de Procurado gerado ao cometer crimes!"}
                    </p>
                  </div>
                  {player.taxDebt && player.taxDebt > 0 ? (
                    <button
                      onClick={() => handlePayTaxes()}
                      className="py-2.5 px-3 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-mono font-black text-[9.5px] uppercase tracking-wider rounded-lg transition-all shadow-md active:translate-y-[1px] hover:shadow-red-650/20 shrink-0 inline-flex items-center gap-1 justify-center align-middle"
                    >
                      🏛️ {lang === "en" ? "Pay Taxes" : "Pagar Imposto"}
                    </button>
                  ) : (
                    <div className="text-[9.5px] font-mono text-emerald-500 font-bold flex items-center gap-1 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg shrink-0 select-none">
                      ✅ {lang === "en" ? "Tax Compliant" : "Imposto em Dia"}
                    </div>
                  )}
                </div>

                {/* Input Panel */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    {lang === "en" ? "Transaction Amount" : "Valor da Operação"}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-zinc-500 font-mono font-bold">$</span>
                    </div>
                    <input
                      type="number"
                      placeholder="0"
                      value={modalBankAmount}
                      onChange={(e) => setModalBankAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => {
                      const quarter = Math.floor(player.cash * 0.25);
                      setModalBankAmount(quarter > 0 ? quarter.toString() : "0");
                    }}
                    className="py-1 px-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-[9px] font-mono font-black text-zinc-300 rounded-lg transition uppercase"
                  >
                    +25% Cash
                  </button>
                  <button
                    onClick={() => {
                      const half = Math.floor(player.cash * 0.5);
                      setModalBankAmount(half > 0 ? half.toString() : "0");
                    }}
                    className="py-1 px-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-[9px] font-mono font-black text-zinc-300 rounded-lg transition uppercase"
                  >
                    +50% Cash
                  </button>
                  <button
                    onClick={() => {
                      setModalBankAmount(player.cash.toString());
                    }}
                    className="py-1 px-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-[9px] font-mono font-black text-emerald-400 rounded-lg transition uppercase"
                  >
                    Max Cash
                  </button>
                  <button
                    onClick={() => {
                      setModalBankAmount(player.bank.toString());
                    }}
                    className="py-1 px-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-[9px] font-mono font-black text-amber-500 rounded-lg transition uppercase"
                  >
                    Max Vault
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      const amt = parseInt(modalBankAmount, 10);
                      if (isNaN(amt) || amt <= 0) {
                        triggerAlert(lang === "en" ? "Enter a valid positive number." : "Digite um valor válido e positivo.", "warn");
                        return;
                      }
                      if (amt > player.cash) {
                        triggerAlert(lang === "en" ? "Not enough physical cash on hand." : "Dinheiro em mãos insuficiente para depositar.", "warn");
                        return;
                      }
                      handleDepositCoins(amt);
                      setModalBankAmount("");
                    }}
                    className="py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-90 active:scale-95 text-white font-mono font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg hover:brightness-110"
                  >
                    📥 {lang === "en" ? "Deposit" : "Depositar"}
                  </button>

                  <button
                    onClick={() => {
                      const amt = parseInt(modalBankAmount, 10);
                      if (isNaN(amt) || amt <= 0) {
                        triggerAlert(lang === "en" ? "Enter a valid positive number." : "Digite um valor válido e positivo.", "warn");
                        return;
                      }
                      if (amt > player.bank) {
                        triggerAlert(lang === "en" ? "You don't have that much inside vault." : "Valor de saque maior que o saldo guardado.", "warn");
                        return;
                      }
                      handleWithdrawCoins(amt);
                      setModalBankAmount("");
                    }}
                    className="py-3 bg-gradient-to-r from-amber-600 to-yellow-500 hover:opacity-90 active:scale-95 text-zinc-950 font-mono font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-lg hover:brightness-110"
                  >
                    📤 {lang === "en" ? "Withdraw" : "Sacar"}
                  </button>
                </div>
                
                {/* Connections Exchange Panel */}
                <div className="pt-4 mt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
                      {lang === "en" ? "Black Market Connections (Premium)" : "Conexões Premium (Dinâmico)"}
                    </span>
                    <span className="text-xs font-mono font-bold text-white bg-purple-500/20 px-2 py-0.5 rounded">
                      🔗 {player.connections ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-zinc-500">
                      {lang === "en" ? "Market Price" : "Preço Atual"}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-500">
                      ${(player.connectionPrice ?? 300000).toLocaleString()} <span className="text-[9px] text-zinc-500">/ un</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <button
                      onClick={() => handleBuyConnection(1)}
                      className="py-2.5 bg-zinc-900 hover:bg-purple-900/30 active:scale-95 text-purple-400 font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all border border-purple-500/30 hover:border-purple-500 flex justify-center items-center gap-1"
                    >
                      {lang === "en" ? "Buy 1x🔗" : "Comprar 1x🔗"}
                    </button>
                    <button
                      onClick={() => handleSellConnection(1)}
                      className="py-2.5 bg-zinc-900 hover:bg-red-900/30 active:scale-95 text-red-400 font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all border border-red-500/30 hover:border-red-500 flex justify-center items-center gap-1"
                    >
                      {lang === "en" ? "Sell 1x🔗" : "Vender 1x🔗"}
                    </button>
                  </div>
                  
                  {player.location === "manhattan" && (
                    <div className="mt-3 p-3 bg-indigo-950/20 border border-indigo-900/50 rounded-xl">
                      <p className="text-[9px] font-mono font-bold text-indigo-400 mb-2 uppercase text-center tracking-widest flex items-center justify-center gap-1">
                        <span>👔</span> {lang === "en" ? "Wall Street Whale Desk" : "Mesa VIP de Manhattan"}
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <button
                          onClick={() => handleBuyConnection(10)}
                          className="py-2 bg-indigo-950 hover:bg-indigo-900 active:scale-95 text-indigo-300 font-mono font-bold text-[9px] uppercase tracking-wider rounded transition-all border border-indigo-500/30 flex justify-center items-center gap-1"
                        >
                          {lang === "en" ? "Buy 10x🔗" : "Comprar 10x🔗"}
                        </button>
                        <button
                          onClick={() => handleSellConnection(10)}
                          className="py-2 bg-indigo-950 hover:bg-indigo-900 active:scale-95 text-indigo-300 font-mono font-bold text-[9px] uppercase tracking-wider rounded transition-all border border-indigo-500/30 flex justify-center items-center gap-1"
                        >
                          {lang === "en" ? "Sell 10x🔗" : "Vender 10x🔗"}
                        </button>
                        <button
                          onClick={() => handleBuyConnection(100)}
                          className="py-2 bg-indigo-900/50 hover:bg-indigo-800/80 active:scale-95 text-indigo-200 font-mono font-bold text-[9px] uppercase tracking-wider rounded transition-all border border-indigo-400/50 flex justify-center items-center gap-1"
                        >
                          {lang === "en" ? "Buy 100x🔗" : "Comprar 100x🔗"}
                        </button>
                        <button
                          onClick={() => handleSellConnection(100)}
                          className="py-2 bg-indigo-900/50 hover:bg-indigo-800/80 active:scale-95 text-indigo-200 font-mono font-bold text-[9px] uppercase tracking-wider rounded transition-all border border-indigo-400/50 flex justify-center items-center gap-1"
                        >
                          {lang === "en" ? "Sell 100x🔗" : "Vender 100x🔗"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CENTRAL METROPOLIS HOSPITAL OVERLAY MODAL */}
      <AnimatePresence>
        {isHospitalOpen && player && (() => {
          const healthRecoverCost = Math.max(150, player.level * 220);
          const curesCount = player.intoxicationCuredCount ?? 0;
          const intoxicationCureCost = Math.round(1500 * Math.pow(1.35, curesCount));
          const plasticSurgeryCost = 100000;
          
          const isVitallyMaxed = player.health >= player.maxHealth;
          const isTotallyCleanOfContamination = player.contamination === 0;

          const isImmune = player.policeImmuneUntil && player.policeImmuneUntil > Date.now();
          const immuneMsLeft = player.policeImmuneUntil ? player.policeImmuneUntil - Date.now() : 0;
          const immuneSecsLeft = Math.ceil(immuneMsLeft / 1000);
          const immuneMin = Math.floor(immuneSecsLeft / 60);
          const immuneSec = immuneSecsLeft % 60;
          const immuneTimerStr = `${immuneMin}:${immuneSec < 10 ? "0" : ""}${immuneSec}`;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.94, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 15 }}
                className="w-full max-w-md bg-[#0a0a0e] border-2 border-red-950/50 shadow-[0_0_50px_rgba(239,68,68,0.15)] rounded-2xl p-6 relative overflow-y-auto max-h-[95vh]"
              >
                {/* Sleek Close Button */}
                <button
                  onClick={() => { playSound.notification(); setIsHospitalOpen(false); }}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white transition text-xs font-mono font-bold border border-zinc-850 px-2 py-1 rounded bg-zinc-950/50 hover:bg-zinc-900"
                >
                  ✕ {lang === "en" ? "CLOSE" : "FECHAR"}
                </button>

                {/* Hospital Header Title */}
                <div className="text-center space-y-1 mb-6 mt-1">
                  <div className="w-11 h-11 bg-red-950/30 border border-red-500/30 text-rose-500 rounded-full flex items-center justify-center text-xl mx-auto animate-pulse">
                    🏥
                  </div>
                  <h3 className="text-sm font-black font-mono text-zinc-100 uppercase tracking-wider mt-2">
                    {lang === "en" ? "Central Metropolitan Hospital" : "Hospital Central Metropolitano"}
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-500 leading-none">
                    {lang === "en" ? "Authorized Medical Care Facilities" : "Instalações de Atendimento Médico Autorizadas"}
                  </p>
                </div>

                {/* Vitals Diagnostics summary */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3.5 space-y-2 mb-5 font-mono text-[10px]">
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                    {lang === "en" ? "PATIENT DIAGNOSTIC BOARD" : "QUADRO DE DIAGNÓSTICO DO PACIENTE"}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-zinc-900/50 p-1.5 rounded border border-zinc-850/50">
                      <span className="text-zinc-500 block text-[8px] uppercase">{lang === "en" ? "Health" : "Saúde"}</span>
                      <span className={`text-xs font-black ${player.health < 35 ? "text-red-500 animate-pulse" : "text-rose-400"}`}>
                        {player.health}%
                      </span>
                    </div>
                    <div className="bg-zinc-900/50 p-1.5 rounded border border-zinc-850/50">
                      <span className="text-zinc-500 block text-[8px] uppercase">{lang === "en" ? "Energy" : "Energia"}</span>
                      <span className="text-xs font-black text-amber-500">
                        {player.energy}%
                      </span>
                    </div>
                    <div className="bg-zinc-900/50 p-1.5 rounded border border-zinc-850/50">
                      <span className="text-zinc-500 block text-[8px] uppercase">{lang === "en" ? "Toxicity" : "Toxicidade"}</span>
                      <span className={`text-xs font-black ${player.contamination > 50 ? "text-emerald-500 animate-pulse" : "text-emerald-400"}`}>
                        {player.contamination}%
                      </span>
                    </div>
                  </div>

                  {isImmune && (
                    <div className="bg-blue-955/20 border border-blue-500/20 text-blue-400 p-2 rounded text-center text-[9px] uppercase font-bold animate-pulse mt-2">
                      🛡️ {lang === "en" ? `POLICE IMMUNITY ACTIVE: ${immuneTimerStr}` : `IMUNIDADE POLICIAL ATIVA: ${immuneTimerStr}`}
                    </div>
                  )}
                </div>

                {/* SERVICES CONTAINER */}
                <div className="space-y-3">
                  
                  {/* SERVICE 1: Emergency care */}
                  <div className="bg-zinc-955 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-850 transition">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-rose-400 uppercase tracking-wide">
                          💉 {lang === "en" ? "Trauma Treatment" : "Tratamento de Traumas"}
                        </h4>
                        <span className="text-xs font-mono font-black text-emerald-400">
                          ${healthRecoverCost.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-normal font-mono">
                        {lang === "en" 
                          ? "Instantly restore 100% vital Health capacity." 
                          : "Restaura imediatamente 100% de sua Saúde vital."}
                      </p>
                    </div>

                    <button
                      onClick={() => { playSound.notification(); handleHospitalRecoverLife(healthRecoverCost); }}
                      disabled={player.cash < healthRecoverCost || isVitallyMaxed}
                      className="w-full mt-3 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:hover:bg-red-650 text-white font-mono font-black text-[10px] uppercase tracking-wider rounded-lg transition"
                    >
                      {player.cash < healthRecoverCost 
                        ? (lang === "en" ? "INSUFFICIENT FUNDS" : "SALDO INSUFICIENTE")
                        : isVitallyMaxed 
                          ? (lang === "en" ? "HEALTH AT 100%" : "SAÚDE EM 100%")
                          : (lang === "en" ? "BUY TRAUMA RECOVER" : "CONTRATAR RECUPERAÇÃO DE VIDA")}
                    </button>
                  </div>

                  {/* SERVICE 2: Chemical decontamination */}
                  <div className="bg-zinc-955 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-855 transition">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-[#10b981] uppercase tracking-wide">
                          🧪 {lang === "en" ? "Blood Detoxification" : "Purificação de Sangue"}
                        </h4>
                        <span className="text-xs font-mono font-black text-emerald-400">
                          ${intoxicationCureCost.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-normal font-mono">
                        {lang === "en" 
                          ? `Neutralises chemical elements and purges contamination. Price scales.` 
                          : `Nulifica todos os compostos químicos ativos do organismo. Valor escala dinamicamente.`}
                      </p>
                      <span className="text-[8px] font-mono text-zinc-500 block">
                        {lang === "en" ? `Treatments purchased: ${curesCount}` : `Tratamentos contratados: ${curesCount}`}
                      </span>
                    </div>

                    <button
                      onClick={() => { playSound.notification(); handleHospitalCureIntoxication(intoxicationCureCost); }}
                      disabled={player.cash < intoxicationCureCost || isTotallyCleanOfContamination}
                      className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white font-mono font-black text-[10px] uppercase tracking-wider rounded-lg transition"
                    >
                      {player.cash < intoxicationCureCost 
                        ? (lang === "en" ? "INSUFFICIENT FUNDS" : "SALDO INSUFICIENTE")
                        : isTotallyCleanOfContamination 
                          ? (lang === "en" ? "0% TOXICITY DETECTED" : "ORGANISMO LIVRE DE TOXINAS")
                          : (lang === "en" ? "BUY DETOX CLEANSE" : "PURGAR NÍVEL DE INTOXICAÇÃO")}
                    </button>
                  </div>

                  {/* SERVICE 3: Plastic reconstructive surgery */}
                  <div className="bg-zinc-955 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-855 transition relative overflow-hidden">
                    {player.level < 10 && (
                      <div className="absolute inset-0 bg-black/85 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 text-center z-10">
                        <span className="text-base">🔒</span>
                        <p className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider mt-1">
                          {lang === "en" ? "Plastic Surgery Locked" : "Cirurgia Plástica Bloqueada"}
                        </p>
                        <p className="text-[8px] font-mono text-red-500">
                          {lang === "en" ? "Requires Player Level 10+" : "Requer Nível do Personagem 10+"}
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black text-rose-500 uppercase tracking-wide">
                          🎭 {lang === "en" ? "Plastic Reconstruction" : "Cirurgia Plástica Facial"}
                        </h4>
                        <span className="text-xs font-mono font-black text-amber-500">
                          $100,000
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-normal font-mono">
                        {lang === "en" 
                          ? "Rebuilds facial layout. Instantly resets Wanted/Heat level to 0% and grants 2 Minutes of Police Immunity!" 
                          : "Reconstrói simetria facial. Zera nível de procurado (Heat) e concede 2 minutos de imunidade policial total!"}
                      </p>
                    </div>

                    <button
                      onClick={() => { playSound.notification(); handleHospitalPlasticSurgery(); }}
                      disabled={player.cash < plasticSurgeryCost || player.level < 10}
                      className="w-full mt-3 py-2.5 bg-gradient-to-r from-rose-700 to-rose-600 hover:opacity-90 disabled:opacity-30 text-white font-mono font-black text-[10px] uppercase tracking-wider rounded-lg transition"
                    >
                      {player.cash < plasticSurgeryCost 
                        ? (lang === "en" ? "INSUFFICIENT CASH" : "DINHEIRO INSUFICIENTE")
                        : (lang === "en" ? "BUY RECONSTRUCTIVE SURGERY" : "EFETUAR CIRURGIA PLÁSTICA")}
                    </button>
                  </div>

                </div>

              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* GAME LOGS OVERLAY MODAL */}
      <AnimatePresence>
        {isLogsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLogsOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[85vh] overflow-y-auto"
            >
              {/* Dynamic Opacity & Clean UI wrapper via LogsFeed */}
              <div className="relative isolate">
                {/* Close Button top-right over logs feed */}
                <button
                  onClick={() => setIsLogsOpen(false)}
                  className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
                >
                  ✕
                </button>
                <div className="opacity-95 hover:opacity-100 transition-opacity duration-300">
                  <LogsFeed 
                    logs={gameLogs} 
                    lang={lang} 
                    onClear={() => {
                      playSound.notification();
                      setGameLogs([]);
                      localStorage.setItem("street_mobster_logs", JSON.stringify([]));
                    }} 
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CENTRAL POLICE STATION OVERLAY MODAL */}
      <AnimatePresence>
        {isPrecinctOpen && player && (() => {
          const currentHeat = player.heat ?? 0;
          const hasHeat = currentHeat > 0;

          const bribeCost = Math.max(500, player.level * 240 + 600);
          const fullClearnessCost = Math.max(2500, player.level * 850 + Math.round(currentHeat * 150));

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.94, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 15 }}
                className="w-full max-w-md bg-[#0a0a0e] border-2 border-blue-950/50 shadow-[0_0_50px_rgba(59,130,246,0.15)] rounded-2xl p-6 relative overflow-y-auto max-h-[95vh]"
              >
                {/* Sleek Close Button */}
                <button
                  onClick={() => { playSound.notification(); setIsPrecinctOpen(false); }}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white transition text-xs font-mono font-bold border border-zinc-850 px-2 py-1 rounded bg-zinc-950/50 hover:bg-zinc-900"
                >
                  ✕ {lang === "en" ? "CLOSE" : "FECHAR"}
                </button>

                {/* Precinct Header */}
                <div className="text-center space-y-1 mb-6 mt-1">
                  <div className="w-11 h-11 bg-blue-950/30 border border-blue-500/30 text-blue-400 rounded-full flex items-center justify-center text-xl mx-auto">
                    👮
                  </div>
                  <h3 className="text-sm font-black font-mono text-zinc-100 uppercase tracking-wider mt-2">
                    {lang === "en" ? "Lafayette Precinct Command" : "Comando Central de Delegacia"}
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-500 leading-none">
                    {lang === "en" ? "Settle Offensive Records Non-officially" : "Negociação Inoficial de Ficha Criminal"}
                  </p>
                </div>

                {/* Heat level analysis board */}
                <div className="bg-zinc-955 border border-zinc-900 rounded-xl p-4 space-y-3 mb-5 font-mono">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider">
                      {lang === "en" ? "WARRANT SUSPICION RATING" : "RELATÓRIO DE MONITORAMENTO"}
                    </span>
                    <span className={`font-black uppercase text-[9px] px-1.5 py-0.5 rounded ${currentHeat > 50 ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-zinc-900 border border-zinc-850 text-zinc-400"}`}>
                      {currentHeat > 50 ? (lang === "en" ? "SWAT Sweep Threat" : "Risco de Invasão") : (lang === "en" ? "Stable" : "Sob Controle")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-zinc-900 rounded-full p-0.5 overflow-hidden relative shadow-inner border border-zinc-850">
                      <div 
                        className="bg-gradient-to-r from-blue-950 via-blue-600 to-rose-600 h-full rounded-full transition-all duration-300 relative"
                        style={{ width: `${Math.min(100, currentHeat)}%` }}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.12)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.12)_75%,transparent_75%,transparent)] bg-[length:6px_6px] opacity-35 rounded-full" />
                      </div>
                    </div>
                    <span className="text-xs font-black text-rose-500 min-w-[28px] text-right shrink-0">
                      {Math.round(currentHeat)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* DEAL option 1: Bribe Captain */}
                  <div className="bg-zinc-955 border border-zinc-900 rounded-xl p-4 hover:border-zinc-850 transition">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-blue-400 uppercase tracking-wide">
                        🤝 {lang === "en" ? "Under-table Agreement" : "Propina Direta Tática"}
                      </h4>
                      <span className="text-xs font-mono font-black text-emerald-400">
                        ${bribeCost.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-normal font-mono mt-1">
                      {lang === "en"
                        ? "Grease the local captain's palms. Purges tactical records and reduces current Heat by 40% immediately."
                        : "Suborne os comissários locais. Rasga relatórios imediatos reduzindo seu nível de procurado atual em 40%."}
                    </p>

                    <button
                      onClick={() => { playSound.notification(); handleBribePolice(bribeCost, 40); }}
                      disabled={player.cash < bribeCost || !hasHeat}
                      className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white font-mono font-black text-[10px] uppercase tracking-wider rounded-lg transition"
                    >
                      {player.cash < bribeCost 
                        ? (lang === "en" ? "INSUFFICIENT CASH" : "DINHEIRO INSUFICIENTE")
                        : !hasHeat
                          ? (lang === "en" ? "RECORD IS CLEAN" : "RELAÇÃO DE CRIMES LIMPA")
                          : (lang === "en" ? "PAY 40% RECORD PURGE" : "PAGAR ACORDO DIRETO (CRIME -40%)")}
                    </button>
                  </div>

                  {/* DEAL option 2: Wipe Archive completely */}
                  <div className="bg-zinc-955 border border-zinc-900 rounded-xl p-4 hover:border-zinc-850 transition">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black text-blue-500 uppercase tracking-wide">
                        📝 {lang === "en" ? "Complete Record Deletion" : "Extinção Total de Ficha"}
                      </h4>
                      <span className="text-xs font-mono font-black text-emerald-400">
                        ${fullClearnessCost.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-normal font-mono mt-1">
                      {lang === "en"
                        ? "Wipe ALL suspect folders entirely from precinct archive. Reduces Heat Wanted level to absolute 0%!"
                        : "Remove de forma definitiva todas as pastas de suspeito nos arquivos centrais. Reseta seu nível de procurado para 0%."}
                    </p>

                    <button
                      onClick={() => { playSound.notification(); handleBribePolice(fullClearnessCost, 100); }}
                      disabled={player.cash < fullClearnessCost || !hasHeat}
                      className="w-full mt-3 py-2.5 bg-gradient-to-r from-blue-700 to-cyan-600 hover:opacity-90 disabled:opacity-30 text-white font-mono font-black text-[10px] uppercase tracking-wider rounded-lg transition"
                    >
                      {player.cash < fullClearnessCost 
                        ? (lang === "en" ? "INSUFFICIENT CASH" : "DINHEIRO INSUFICIENTE")
                        : !hasHeat
                          ? (lang === "en" ? "RECORD IS CLEAN" : "RELAÇÃO DE CRIMES LIMPA")
                          : (lang === "en" ? "BUY TOTAL RECORDS WIPE" : "EFETUAR LIMPEZA DE FICHA INDICIADA (0%)")}
                    </button>
                  </div>
                </div>

              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* LEVEL UP CELEBRATION MODAL */}
      <AnimatePresence>
        {levelUpModalData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-3 select-none overflow-y-auto"
          >
            {/* Ambient Background Glowing Orbs */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />

            {/* Glowing Golden Badge & Stars */}
            <motion.div
              initial={{ scale: 0.2, y: 80, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 16, delay: 0.1 }}
              className="text-center max-w-sm sm:max-w-md w-full bg-[#0a0a0e]/95 border-2 border-amber-500/45 shadow-[0_0_80px_rgba(245,158,11,0.25)] rounded-2xl p-5 sm:p-6 md:p-7 relative overflow-y-auto max-h-[92vh]"
            >
              {/* Premium Cyber Decals & Corner Brackets */}
              <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-500 pointer-events-none z-20" />
              <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-500 pointer-events-none z-20" />
              <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-500 pointer-events-none z-20" />
              <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-500 pointer-events-none z-20" />

              <div className="absolute top-6 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent pointer-events-none z-20" />
              <div className="absolute bottom-6 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent pointer-events-none z-20" />

              {/* Digital Grid Layer */}
              <div className="absolute inset-0 bg-board-grid opacity-[0.3] pointer-events-none z-0" />

              {/* Shining Glass Sweep Animation */}
              <div className="absolute top-0 -left-1/2 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-25 transform skew-x-12 animate-[pulse_3s_infinite] pointer-events-none" />

              {/* Particle Stream (Fake Confetti with Motion) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute bg-amber-400 rounded-full"
                    style={{
                      width: Math.random() * 6 + 4,
                      height: Math.random() * 6 + 4,
                      left: `${10 + Math.random() * 80}%`,
                      top: `${30 + Math.random() * 50}%`,
                    }}
                    animate={{
                      y: [-25, -170],
                      x: [0, (Math.random() - 0.5) * 100],
                      opacity: [0, 1, 0],
                      scale: [0.5, 1.3, 0],
                    }}
                    transition={{
                      duration: 1.4 + Math.random() * 1.4,
                      repeat: Infinity,
                      delay: Math.random() * 0.8,
                    }}
                  />
                ))}
              </div>
 
              {/* Crown / Medallion */}
              <motion.div 
                animate={{ rotate: [0, -4, 4, -4, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-5xl sm:text-6xl mb-2 filter drop-shadow-[0_0_20px_rgba(234,179,8,0.65)]"
              >
                👑
              </motion.div>
 
              <h2 className="font-display font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 uppercase tracking-widest leading-none drop-shadow-md">
                {lang === "en" ? "Level Upgraded!" : "Nível Elevado!"}
              </h2>
              
              <p className="font-mono text-[8px] sm:text-[10px] text-amber-500 font-extrabold uppercase tracking-[0.3em] mt-1.5">
                {lang === "en" ? "Underworld Reputation Gained" : "Reputação no Submundo Aumentada"}
              </p>
 
              {/* Levels Transition */}
              <div className="flex items-center justify-center gap-4 my-4 bg-gradient-to-r from-transparent via-amber-950/20 to-transparent border-t border-b border-amber-950/45 py-2.5 px-6 w-full shadow-inner z-10 relative">
                <span className="text-sm font-mono text-zinc-400">Lvl {levelUpModalData.level - 1}</span>
                <span className="text-amber-550 text-base font-bold animate-pulse">➜</span>
                <span className="text-lg font-mono font-black text-yellow-300 drop-shadow-[0_0_8px_rgba(234,179,8,0.7)]">
                  Lvl {levelUpModalData.level}
                </span>
              </div>
 
              {/* New Title Card */}
              <div className="mb-4 bg-gradient-to-r from-[#0d0d12] via-amber-950/20 to-[#0d0d12] border border-amber-500/10 rounded-xl py-3 px-4 relative">
                {/* Tech micro line indicator */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-[2px] bg-amber-500" />
                <span className="text-[8px] sm:text-[9.5px] font-mono text-zinc-450 uppercase tracking-widest block mb-0.5">
                  {lang === "en" ? "NEW RANK TITLE" : "NOVA PATENTE DE RUA"}
                </span>
                <span className="text-sm sm:text-base font-display font-black text-white tracking-wide uppercase drop-shadow-md">
                  {levelUpModalData.title}
                </span>
              </div>
 
              {/* Attributes Gained Grid */}
              <div className="space-y-2 text-left relative z-10">
                <h4 className="text-[9px] sm:text-[10px] font-mono font-black text-zinc-450 uppercase tracking-widest mb-1.5 pl-1">
                  📊 {lang === "en" ? "STAT UPGRADES:" : "ATRIBUTOS RECEBIDOS:"}
                </h4>
 
                <div className="grid grid-cols-2 gap-2">
                  {/* Strength */}
                  <div className="bg-black/45 border border-zinc-900 rounded-xl py-2 px-3 flex items-center justify-between shadow-dark transition-all hover:border-orange-500/30">
                    <span className="text-[11px] font-sans text-zinc-400 flex items-center gap-1.5">
                      👊 {lang === "en" ? "Strength" : "Força"}
                    </span>
                    <span className="text-xs font-mono font-black text-orange-400 drop-shadow-[0_0_4px_rgba(251,146,60,0.3)]">
                      +{levelUpModalData.strengthGain}
                    </span>
                  </div>
 
                  {/* Defense */}
                  <div className="bg-black/45 border border-zinc-900 rounded-xl py-2 px-3 flex items-center justify-between shadow-dark transition-all hover:border-sky-500/30">
                    <span className="text-[11px] font-sans text-zinc-400 flex items-center gap-1.5">
                      🛡️ {lang === "en" ? "Defense" : "Defesa"}
                    </span>
                    <span className="text-xs font-mono font-black text-sky-400 drop-shadow-[0_0_4px_rgba(56,189,248,0.3)]">
                      +{levelUpModalData.defenseGain}
                    </span>
                  </div>
 
                  {/* Intellect */}
                  <div className="bg-black/45 border border-zinc-900 rounded-xl py-2 px-3 flex items-center justify-between shadow-dark transition-all hover:border-cyan-500/30">
                    <span className="text-[11px] font-sans text-zinc-400 flex items-center gap-1.5">
                      🧠 {lang === "en" ? "Intellect" : "Intelecto"}
                    </span>
                    <span className="text-xs font-mono font-black text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.3)]">
                      +{levelUpModalData.intellectGain}
                    </span>
                  </div>
 
                  {/* Luck */}
                  <div className="bg-black/45 border border-zinc-900 rounded-xl py-2 px-3 flex items-center justify-between shadow-dark transition-all hover:border-amber-500/30">
                    <span className="text-[11px] font-sans text-zinc-400 flex items-center gap-1.5">
                      🍀 {lang === "en" ? "Luck" : "Sorte"}
                    </span>
                    <span className="text-xs font-mono font-black text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]">
                      +{levelUpModalData.luckGain}
                    </span>
                  </div>
                </div>
              </div>
 
              {/* Continue button */}
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  playSound.notification();
                  setLevelUpModalData(null);
                }}
                className="mt-5 sm:mt-6 w-full py-3 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-zinc-950 font-mono font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_8px_25px_rgba(245,158,11,0.3)] hover:brightness-110 active:brightness-95 transition-all text-center cursor-pointer relative overflow-hidden"
              >
                {/* Tech button flare overlay */}
                <span className="absolute inset-x-0 top-0 h-[1px] bg-white/40" />
                {lang === "en" ? "Continue Operations" : "Continuar Operações"}
              </motion.button>
 
            </motion.div>
 
              {/* Continue button */}

 
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Animated Loot (Crimes) Overlay */}
      <AnimatePresence>
        {animatedLoots.map((loot) => (
          <motion.div
            key={loot.id}
            initial={{ opacity: 0, scale: 0.5, x: loot.x, y: loot.y }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              scale: [0.5, 1.3, 1, 0.5], 
              x: typeof window !== 'undefined' ? [loot.x, window.innerWidth / 2] : [loot.x, 200], 
              y: typeof window !== 'undefined' ? [loot.y, 40] : [loot.y, 40] 
            }}
            transition={{ duration: 1.8, ease: "easeOut", times: [0, 0.15, 0.8, 1] }}
            className="fixed pointer-events-none z-[10000] drop-shadow-2xl flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: 0, top: 0 }}
          >
            <span className="text-2xl sm:text-3xl pt-1 font-mono font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">
              +${loot.amount.toLocaleString()}
            </span>
            <span className="text-xl">💵</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* RPG Damage/Reward Floating Popup Overlay */}
      <div className="fixed inset-x-0 bottom-1/3 md:bottom-2/5 flex flex-col items-center pointer-events-none z-[9999]" id="floating-rewards-overlay">
        <div className="relative w-full max-w-sm flex items-center justify-center">
          <AnimatePresence>
            {floatingPopups.map((popup) => (
              <motion.div
                key={popup.id}
                initial={{ opacity: 0, scale: 0.4, y: 40, x: popup.x }}
                animate={{ opacity: 1, scale: 1.25, y: -120 - popup.y, x: popup.x }}
                exit={{ opacity: 0, scale: 0.75, y: -220 - popup.y, filter: "blur(3px)" }}
                transition={{
                  type: "spring",
                  stiffness: 140,
                  damping: 15,
                  duration: 1.4
                }}
                className={`absolute pointer-events-none select-none font-mono text-xs md:text-sm tracking-widest font-black px-4 py-2 rounded-2xl bg-[#09090b]/95 border border-zinc-800 shadow-2xl flex items-center gap-2 whitespace-nowrap ${popup.color}`}
              >
                {popup.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* PERSISTENT TRANSLUCENT BOTTOM HUD BAR */}
      {player && (() => {
        const activeEffects = [];

        // Police Immunity timer calculation
        const policeImmuneMsLeft = player.policeImmuneUntil ? player.policeImmuneUntil - Date.now() : 0;
        const isImmune = policeImmuneMsLeft > 0;
        const secs = isImmune ? Math.ceil(policeImmuneMsLeft / 1000) : 0;
        const minPart = Math.floor(secs / 60);
        const secPart = secs % 60;
        const timerStr = `${minPart}:${secPart < 10 ? "0" : ""}${secPart}`;

        // Police Surveillance timer calculation
        const surveilMsLeft = player.underSurveillanceUntil ? player.underSurveillanceUntil - Date.now() : 0;
        const isSurveilled = surveilMsLeft > 0;
        const sSecs = isSurveilled ? Math.ceil(surveilMsLeft / 1000) : 0;
        const sMinPart = Math.floor(sSecs / 60);
        const sSecPart = sSecs % 60;
        const sTimerStr = `${sMinPart}:${sSecPart < 10 ? "0" : ""}${sSecPart}`;

        if (isImmune) {
          activeEffects.push({
            id: "police_immunity",
            icon: "🛡️",
            labelEn: `IMMUNE (${timerStr})`,
            labelPt: `IMUNE (${timerStr})`,
            color: "text-emerald-400 border-emerald-500/35 bg-emerald-950/20 shadow-[0_0_10px_rgba(16,185,129,0.35)] animate-pulse",
            tooltipEn: "Police immunity active from plastic surgery. Officers do not recognize you.",
            tooltipPt: "Imunidade policial ativa gerada por cirurgia plástica. Oficiais não te reconhecem."
          });
        }
        if (isSurveilled && !isImmune) {
          activeEffects.push({
            id: "police_surveillance",
            icon: "👁️",
            labelEn: `SURVEILLED (${sTimerStr})`,
            labelPt: `VIGIADO (${sTimerStr})`,
            color: "text-amber-400 border-amber-500/35 bg-amber-950/20 shadow-[0_0_10px_rgba(245,158,11,0.35)] animate-pulse",
            tooltipEn: "Police surveillance active after rejected bribe. Crimes generate double heat.",
            tooltipPt: "Vigilância policial ativa devido a suborno rejeitado. Crimes geram o dobro de procurado."
          });
        }

        // 1. Drug Buzz
        if ((player.contamination ?? 0) > 0 && (player.contamination ?? 0) <= 50) {
          activeEffects.push({
            id: "buzz",
            icon: "🌀",
            labelEn: "BUZZING",
            labelPt: "ONDA",
            color: "text-cyan-400 border-cyan-500/25 bg-cyan-950/20 shadow-[0_0_10px_rgba(34,211,238,0.15)]",
            tooltipEn: "Drug high active. Restless focus, willpower & luck multiplier engaged.",
            tooltipPt: "Efeito ativo de entorpecentes. Foco de rua intensificado, mandingas e multiplicadores ativos."
          });
        }

        // 2. High Overdose
        if ((player.contamination ?? 0) > 50) {
          activeEffects.push({
            id: "toxic",
            icon: "☠️",
            labelEn: "TOXIC OVERDOSE",
            labelPt: "SOBRECARGA",
            color: "text-lime-400 border-lime-500/35 bg-lime-950/30 shadow-[0_0_12px_rgba(163,230,53,0.35)] animate-pulse",
            tooltipEn: "Severe drug contamination! Vital systems strained. HP decays passively.",
            tooltipPt: "Altíssima contaminação química! HP drena passivamente devido ao excesso tóxico."
          });
        }

        // 3. Wanted Patrol Alert
        if ((player.heat ?? 0) > 60) {
          activeEffects.push({
            id: "hunted",
            icon: "🚨",
            labelEn: "WANTED",
            labelPt: "PROCURADO",
            color: "text-rose-500 border-rose-500/40 bg-zinc-950/70 shadow-[0_0_15px_rgba(239,68,68,0.35)] animate-bounce",
            tooltipEn: "Police patrol squad on hunt! Open crimes invite high arrest penalties.",
            tooltipPt: "Rastreamento policial total! Cometer crimes convida repressão máxima imediata."
          });
        } else if ((player.heat ?? 0) > 10) {
          activeEffects.push({
            id: "heat",
            icon: "🕵️",
            labelEn: "SUSPECTED",
            labelPt: "DE OLHO",
            color: "text-amber-500 border-amber-500/30 bg-amber-950/20 shadow-[0_0_8px_rgba(245,158,11,0.15)]",
            tooltipEn: "Under surveillance. Low profile recommended to allow heat decay.",
            tooltipPt: "Sob vigilância do distrito. Mantenha descrição para acalmar a poeira."
          });
        }

        // 4. Critical Wounded
        if (player.health <= 25) {
          activeEffects.push({
            id: "wounded",
            icon: "🩸",
            labelEn: "CRITICAL HP",
            labelPt: "FERIDO",
            color: "text-rose-500 border-rose-500/40 bg-rose-950/25 shadow-[0_0_12px_rgba(244,63,94,0.25)] animate-pulse",
            tooltipEn: "Terminal wounds active. Consume medicine supplies or rest under hospital care.",
            tooltipPt: "Ferimentos corporais severos. Use compostos médicos para recuperar HP."
          });
        }

        // 5. Adrenaline Rush (Power)
        if (player.energy >= 90) {
          activeEffects.push({
            id: "charged",
            icon: "🔥",
            labelEn: "CHARGED",
            labelPt: "ENERGIZADO",
            color: "text-yellow-400 border-yellow-500/25 bg-yellow-950/20 shadow-[0_0_12px_rgba(234,179,8,0.25)]",
            tooltipEn: "Full energetic reserve! Standard crime/battle success and recovery optimized.",
            tooltipPt: "Reservas de energia totalizadas! Suas operações e golpes cooperativos estão no topo."
          });
        }

        // 6. Fatigue
        if (player.energy < 15) {
          activeEffects.push({
            id: "fatigued",
            icon: "💤",
            labelEn: "TIRED",
            labelPt: "EXAUSTO",
            color: "text-violet-400 border-violet-500/25 bg-violet-950/20 shadow-[0_0_8px_rgba(167,139,250,0.15)]",
            tooltipEn: "Physical fatigue limits execution of extreme multi-stage street crimes.",
            tooltipPt: "Estamina exaurida. Use energéticos sintéticos ou descanse no crib."
          });
        }

        // 7. Armed
        if (player.activeWeapon) {
          activeEffects.push({
            id: "armed",
            icon: "🔫",
            labelEn: "ARMED",
            labelPt: "ARMADO",
            color: "text-zinc-300 border-zinc-700/30 bg-zinc-900/35 shadow-[0_0_6px_rgba(255,255,255,0.05)]",
            tooltipEn: "Lethal firepower ready for arena faceoffs and street reputation defense.",
            tooltipPt: "Poder de fogo letal armado na cintura. Ativo para legítima defesa em combates."
          });
        }

        // 8. Active Wheels / Mobility
        if (player.activeVehicle) {
          activeEffects.push({
            id: "wheels",
            icon: "🚗",
            labelEn: "WHEELS",
            labelPt: "MOTORIZADO",
            color: "text-emerald-400 border-emerald-500/20 bg-emerald-950/10 shadow-[0_0_6px_rgba(16,185,129,0.05)]",
            tooltipEn: "Active wheels configured. Grants defense shielding bonus.",
            tooltipPt: "Rodas de fuga prontas. Confere bônus protetor de defesa pelas quadras."
          });
        }

        const currentWeapon = SHOP_ITEMS.find((items) => items.id === player.activeWeapon);
        const currentVehicle = SHOP_ITEMS.find((items) => items.id === player.activeVehicle);
        const totalContrabandDrugs = Object.values(player.drugsInventory).reduce((a, b) => (a as number) + (b as number), 0);
        const levelPct = Math.min(100, Math.round((player.exp / (player.expNext || 100)) * 100));

        const weaponBonus = currentWeapon?.bonusStrength || 0;
        const vehicleBonus = currentVehicle?.bonusDefense || 0;

        // Apply passive skills (iron_grip, tactical_armor)
        let baseStrength = player.strength;
        const ironGripLevel = player.unlockedSkills?.["iron_grip"] || 0;
        if (ironGripLevel > 0) {
          baseStrength = Math.round(baseStrength * (1 + ironGripLevel * 0.10));
        }
        const syncStrength = baseStrength + weaponBonus;

        const petBonus = getActivePetBonus(player);
        let baseDefense = player.defense;
        const tacticalArmorLevel = player.unlockedSkills?.["tactical_armor"] || 0;
        if (tacticalArmorLevel > 0) {
          baseDefense = Math.round(baseDefense * (1 + tacticalArmorLevel * 0.10));
        }
        let syncDefense = baseDefense + vehicleBonus;
        if (petBonus.type === "defense") {
          syncDefense = Math.round(syncDefense * (1 + petBonus.value));
        }

        return (
          <>
            {isHudMinimized ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed bottom-3 right-3 sm:bottom-4 sm:right-6 z-40 select-none pb-safe"
              >
                <button
                  onClick={() => {
                    playSound.notification();
                    setIsHudMinimized(false);
                  }}
                  className="flex items-center gap-1.5 p-2.5 px-4 rounded-xl border border-[#caa560]/45 text-[#ead5ba] font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-[0_12px_35px_rgba(0,0,0,0.98)] cursor-pointer hover:border-[#caa560]/80 bg-[#161311]/95 transition-all duration-150 select-none active:scale-95"
                >
                  <span className="text-[12px] filter drop-shadow animate-pulse">👁️</span>
                  <span>{lang === "en" ? "SHOW HUD" : "EXIBIR HUD"}</span>
                </button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={`fixed bottom-0 left-0 right-0 z-40 w-full rounded-t-xl sm:rounded-t-2xl border-t shadow-[0_-6px_25px_rgba(0,0,0,0.95)] p-1.5 px-3 md:px-6 flex flex-col gap-1 select-none text-[#ead5ba] font-sans transition-all duration-300 hover:brightness-105`}
              id="stylish-bottom-hud"
              style={{ 
                background: `linear-gradient(to bottom, rgba(24, 21, 18, ${hudOpacity}), rgba(10, 8, 7, ${hudOpacity + 0.04}))`,
                borderColor: `rgba(202, 165, 96, ${0.40 + (hudOpacity * 0.20)})`,
                backdropFilter: "blur(14px) saturate(110%)",
                WebkitBackdropFilter: "blur(14px) saturate(110%)"
              }}
            >
              {/* Corner metal rivets */}
              <div className="absolute top-1 left-2 w-1 h-1 rounded-full bg-zinc-800 border border-zinc-650 flex items-center justify-center text-[3px] font-bold text-zinc-600 shadow-inner select-none pointer-events-none">•</div>
              <div className="absolute top-1 right-2 w-1 h-1 rounded-full bg-zinc-800 border border-[#caa560]/40 flex items-center justify-center text-[3px] font-bold text-zinc-600 shadow-inner select-none pointer-events-none">•</div>

              {/* Dynamic status banner floating on core top edge */}
              {(() => {
                let dynamicStatusLabel = lang === "en" ? "MOB BOSS" : "CORPORE SEGURO";
                let dynamicStatusColor = "from-amber-600 to-yellow-800 border-yellow-500/80 text-yellow-101 shadow-[0_0_15px_rgba(234,179,8,0.35)]";
                let emojiPrefix = "👑";

                if (player.health <= 25) {
                  dynamicStatusLabel = lang === "en" ? "WOUNDED" : "CRÍTICO";
                  dynamicStatusColor = "from-rose-800 to-red-950 border-red-500/80 text-rose-101 shadow-[0_0_15px_rgba(239,68,68,0.45)] animate-pulse";
                  emojiPrefix = "🩸";
                } else if (player.energy < 15) {
                  dynamicStatusLabel = lang === "en" ? "FATIGUED" : "EXAUSTO";
                  dynamicStatusColor = "from-[#4c3b22] to-amber-900 border-yellow-700/60 text-amber-201 shadow-[0_0_10px_rgba(234,179,8,0.25)]";
                  emojiPrefix = "💤";
                } else if ((player.heat ?? 0) > 60) {
                  dynamicStatusLabel = lang === "en" ? "WANTED" : "PROCURADO";
                  dynamicStatusColor = "from-rose-950 to-red-950 border-red-655 text-red-101 shadow-[0_0_20px_rgba(239,68,68,0.5)]";
                  emojiPrefix = "🚨";
                } else if (player.energy >= 90) {
                  dynamicStatusLabel = lang === "en" ? "ACTIVE" : "VIGOROSO";
                  dynamicStatusColor = "from-amber-700 via-amber-800 to-yellow-855 border-yellow-555 text-yellow-105 shadow-[0_0_15px_rgba(202,165,96,0.55)]";
                  emojiPrefix = "🔥";
                }

                return (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4.5 py-0.5 rounded-full border bg-gradient-to-b ${dynamicStatusColor} uppercase text-[8.5px] font-black tracking-widest flex items-center gap-1.5 z-45 select-none`}>
                    <span>{emojiPrefix}</span>
                    <span>{dynamicStatusLabel}</span>
                    <span>{emojiPrefix}</span>
                  </div>
                );
              })()}

              {/* Decorative Antique Brass Knuckles weapon overlapping top center-right */}
              <svg width="105" height="50" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -top-9.5 right-[24%] pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] z-20 hidden lg:block opacity-95 select-none scale-105 hover:rotate-1 hover:scale-110 transition duration-300">
                <path d="M 15 45 C 30 35, 90 35, 105 45 L 95 55 C 80 50, 40 50, 25 55 Z" fill="url(#brass-grad-hud)" stroke="#4c3d22" strokeWidth="1.5" />
                <circle cx="28" cy="22" r="11" fill="none" stroke="url(#brass-grad-hud)" strokeWidth="4.5" />
                <circle cx="28" cy="22" r="8" fill="none" stroke="#4c3d22" strokeWidth="1" />
                <circle cx="50" cy="18" r="11" fill="none" stroke="url(#brass-grad-hud)" strokeWidth="4.5" />
                <circle cx="50" cy="18" r="8" fill="none" stroke="#4c3d22" strokeWidth="1" />
                <circle cx="72" cy="18" r="11" fill="none" stroke="url(#brass-grad-hud)" strokeWidth="4.5" />
                <circle cx="72" cy="18" r="8" fill="none" stroke="#4c3d22" strokeWidth="1" />
                <circle cx="94" cy="22" r="11" fill="none" stroke="url(#brass-grad-hud)" strokeWidth="4.5" />
                <circle cx="94" cy="22" r="8" fill="none" stroke="#4c3d22" strokeWidth="1" />
                <path d="M 17 22 L 105 22" stroke="url(#brass-grad-hud)" strokeWidth="2.5" />
                <defs>
                  <linearGradient id="brass-grad-hud" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#d4af37" />
                    <stop offset="50%" stopColor="#c5a02c" />
                    <stop offset="100%" stopColor="#553a00" />
                  </linearGradient>
                </defs>
              </svg>

              {/* ACTIVE EFFECTS BAR (COMPACT OR SECOND CONTAINER OUT OF GRID) */}
              {activeEffects.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 border-b border-[#caa560]/20 pb-1.5 mb-1 w-full">
                  {activeEffects.map((effect) => (
                    <div
                      key={`btmeffect-${effect.id}`}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[7.5px] font-mono font-bold uppercase ${effect.color}`}
                      title={lang === "en" ? effect.tooltipEn : effect.tooltipPt}
                    >
                      <span>{effect.icon}</span>
                      <span>{lang === "en" ? effect.labelEn : effect.labelPt}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* DYNAMIC ADAPTIVE HUD WRAPPER - PREVENTS OVERFLOW ON MOBILE SCREEN SIZES */}
              <div className="flex flex-wrap xl:flex-nowrap items-center justify-center xl:justify-between gap-2 xl:gap-3 w-full text-xs">
                
                {/* SUBBLOCK A: PROFILE RIVETED PORTRAIT + SHIELD LEVEL + LEVEL BAR */}
                <div className="flex items-center justify-center xl:justify-start gap-2.5 shrink-0 select-none w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const frameStyle = isImmune 
                        ? "shadow-[0_0_15px_rgba(16,185,129,0.95)] animate-pulse border-emerald-500 bg-gradient-to-r from-emerald-600 via-green-400 to-emerald-600" 
                        : "bg-gradient-to-b from-[#caa560] via-zinc-800 to-zinc-950 border-[#caa560]/30";
                      
                      return (
                        <div className={`relative p-[2.5px] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.7)] border transition-all duration-300 ${frameStyle}`}>
                          {/* Corner bolts */}
                          <span className="absolute top-[1.5px] left-[2.5px] text-[4px] text-zinc-500 opacity-70">•</span>
                          <span className="absolute top-[1.5px] right-[2.5px] text-[4px] text-zinc-500 opacity-70">•</span>
                          <span className="absolute bottom-[1.5px] left-[2.5px] text-[4px] text-zinc-500 opacity-70">•</span>
                          <span className="absolute bottom-[1.5px] right-[2.5px] text-[4px] text-zinc-500 opacity-70">•</span>
                          
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-zinc-950 bg-zinc-955 shrink-0 relative">
                            <img 
                              src="/src/assets/images/assassin_avatar_1781148272934.png" 
                              alt="Avatar" 
                              className="w-full h-full object-cover filter sepia-[0.25] brightness-110 contrast-105"
                            />
                            {isImmune && (
                              <div className="absolute inset-x-0 bottom-0 bg-emerald-600/90 text-white font-mono font-black text-[6px] tracking-wide text-center py-0.5 select-none leading-none border-t border-emerald-400">
                                {lang === "en" ? "IMMUNE" : "IMUNE"}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Retro Gold Shield Badge (Level) */}
                    <div 
                      className="relative flex flex-col items-center justify-center p-1 sm:p-1.5 bg-[#251e15] border border-[#caa560]/40 rounded-xl shadow-[0_2px_12px_rgba(184,149,67,0.2)] text-[#caa560] font-sans font-black text-center min-w-[34px] min-h-[34px] sm:min-w-[40px]"
                      title={lang === "en" ? `Level ${player.level}` : `Nível ${player.level}`}
                    >
                      <span className="text-[7px] font-mono font-bold uppercase tracking-widest text-[#caa560]/85 leading-none">LV</span>
                      <span className="text-xs sm:text-sm font-black leading-none text-[#facc15] drop-shadow-[0_1.5px_3px_rgba(250,204,21,0.45)] mt-0.5">{player.level}</span>
                    </div>

                    {/* Level Progress Bar */}
                    <div className="flex flex-col justify-center min-w-[55px] xs:min-w-[70px] sm:min-w-[85px] shrink-0">
                      <div className="flex justify-between items-center text-[7.5px] font-mono text-zinc-400 font-bold">
                        <span>XP</span>
                        <span>{player.exp}/{player.expNext}</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-950 rounded-full border border-zinc-800 p-[1px] mt-0.5 overflow-hidden relative shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-[#caa560] via-amber-500 to-yellow-400 h-full rounded-full transition-all duration-300 shadow-[0_0_6px_rgba(202,165,96,0.5)]"
                          style={{ width: `${levelPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* MINI PILL WITH METADATA (Dossier name) */}
                  <div className="hidden min-[350px]:block text-left sm:text-right max-w-[85px] leading-tight select-none">
                    <span className="text-[7.5px] font-mono font-bold tracking-widest text-[#968266] uppercase block">{lang === "en" ? "REQUISITION" : "FICHA AGENTE"}</span>
                    <span className="text-[10px] font-bold text-stone-200 border-b border-[#caa560]/20 truncate block pb-0.5 uppercase">{player.name}</span>
                  </div>
                </div>

                {/* SUBBLOCK B: RETRO GLASSMORPHISM METRIC TUBES (VIDA, ENERGIA, PROCURADO, INTOXICAÇÃO) */}
                <div className="flex-1 min-w-[280px] max-w-full grid grid-cols-2 md:flex md:flex-row items-center justify-around gap-1.5 sm:gap-2 bg-neutral-950/80 p-1 rounded-2xl border border-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] overflow-hidden shrink-0">
                  
                  {/* Health ("VIDA") */}
                  <div 
                    onClick={() => { playSound.notification(); setIsHospitalOpen(true); }}
                    className="flex items-center justify-start gap-1 cursor-pointer hover:bg-zinc-900/40 px-1 py-0.5 rounded-xl transition w-full"
                    title={lang === "en" ? `Health: ${player.health}%` : `Saúde: ${player.health}%`}
                  >
                    <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 border border-[#caa560]/25 flex items-center justify-center shadow shadow-red-950/50 shrink-0">
                      <span className="text-[10px] filter drop-shadow-[0_0_4px_rgba(239,68,68,0.7)] animate-pulse" role="img" aria-label="Health">❤️</span>
                    </div>
                    
                    {/* Red translucent tube glass bar */}
                    <div className="flex-1 h-3.5 bg-neutral-950 rounded-full border border-zinc-850 p-[1.5px] overflow-hidden relative shadow-inner animate-pulse">
                      <div 
                        className="bg-gradient-to-r from-red-950 via-red-600 to-rose-500 h-full rounded-full transition-all duration-300 relative shadow-[0_0_10px_rgba(239,68,68,0.35)]" 
                        style={{ width: `${Math.min(100, player.health)}%` }} 
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.12)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.12)_75%,transparent_75%,transparent)] bg-[length:6px_6px] opacity-35 rounded-full" />
                      </div>
                    </div>
                    
                    <span className="text-[9.5px] md:text-[10.5px] font-mono font-black text-rose-400 tracking-tight shrink-0">
                      {player.health}%
                    </span>
                  </div>

                  {/* Energy ("ENERGIA") */}
                  {(() => {
                    const energyPct = Math.min(100, Math.round((player.energy / player.maxEnergy) * 100));
                    return (
                      <div 
                        onClick={() => { playSound.notification(); navigateAndScroll("possessions"); }}
                        className="flex items-center justify-start gap-1 cursor-pointer hover:bg-zinc-900/40 px-1 py-0.5 rounded-xl transition border-l border-zinc-800/40 pl-1.5 w-full"
                        title={lang === "en" ? `Energy: ${player.energy}/${player.maxEnergy}` : `Energia: ${player.energy}/${player.maxEnergy}`}
                      >
                        <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 border border-[#caa560]/25 flex items-center justify-center shadow shadow-yellow-950/50 shrink-0">
                          <span className="text-[10px] filter drop-shadow-[0_0_4px_rgba(234,179,8,0.7)]" role="img" aria-label="Energy">⚡</span>
                        </div>
                        
                        {/* Gold translucent tube glass bar */}
                        <div className="flex-1 h-3.5 bg-neutral-950 rounded-full border border-zinc-855 p-[1.5px] overflow-hidden relative shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-amber-900 via-yellow-500 to-yellow-300 h-full rounded-full transition-all duration-300 relative shadow-[0_0_10px_rgba(234,179,8,0.35)]" 
                            style={{ width: `${energyPct}%` }} 
                          >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.12)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.12)_75%,transparent_75%,transparent)] bg-[length:6px_6px] opacity-35 rounded-full" />
                          </div>
                        </div>
                        
                        <span className="text-[9.5px] md:text-[10.5px] font-mono font-black text-amber-500 tracking-tight shrink-0">
                          {player.energy}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Wanted ratio ("PROCURADO") */}
                  <div 
                    onClick={() => { playSound.notification(); setIsPrecinctOpen(true); }}
                    className={`flex items-center justify-start gap-1 cursor-pointer hover:bg-zinc-900/40 px-1 py-0.5 rounded-xl transition border-l border-zinc-800/40 pl-1.5 w-full ${isImmune ? "bg-emerald-950/15 border-l-emerald-500/70" : (isSurveilled ? "bg-amber-950/15 border-l-amber-500/70" : "")}`}
                    title={isImmune ? (lang === "en" ? `Police Immunity: ${timerStr} left` : `Imunidade Policial: restam ${timerStr}`) : isSurveilled ? (lang === "en" ? `Police Surveillance: ${sTimerStr} left` : `Vigilância Policial: restam ${sTimerStr}`) : (lang === "en" ? `Wanted level: ${Math.round(player.heat)}%` : `Nível de Procurado: ${Math.round(player.heat)}%`)}
                  >
                    <div className={`w-5.5 h-5.5 rounded-full bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 border flex items-center justify-center shrink-0 relative ${isImmune ? "border-emerald-500/50 shadow-emerald-950/50" : isSurveilled ? "border-amber-500/50 shadow-amber-950/50" : "border-[#caa560]/25 shadow-red-950/50"}`}>
                      {isImmune ? (
                        <div className="bg-emerald-500/35 rounded-full absolute inset-0 animate-ping pointer-events-none z-0" />
                      ) : isSurveilled ? (
                        <div className="bg-amber-500/35 rounded-full absolute inset-0 animate-ping pointer-events-none z-0" />
                      ) : player.heat > 10 ? (
                        <div className="bg-red-650/30 rounded-full absolute inset-0 animate-ping pointer-events-none z-0" />
                      ) : null}
                      
                      {isImmune ? (
                        <span className="z-10 text-[10px] text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.95)] animate-pulse" role="img" aria-label="Immune">🛡️</span>
                      ) : isSurveilled ? (
                        <span className="z-10 text-[10px] text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.95)] animate-pulse" role="img" aria-label="Surveilled">👁️</span>
                      ) : (player.taxDebt !== undefined && player.taxDebt > 0) ? (
                        <span className="z-10 text-[11px] drop-shadow-[0_0_5px_rgba(239,68,68,0.95)] animate-bounce" role="img" aria-label="Taxes Owed">🕵️‍♂️</span>
                      ) : (
                        <span className="z-10 text-[10px] text-rose-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.7)]" role="img" aria-label="Wanted">🚨</span>
                      )}
                    </div>
                    
                    {/* Red translucent tube glass bar (which turns green active when immune!) */}
                    <div className={`flex-1 h-3.5 bg-neutral-950 rounded-full border p-[1.5px] overflow-hidden relative shadow-inner ${isImmune ? "border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.25)]" : isSurveilled ? "border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]" : "border-zinc-850"}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-300 relative ${isImmune ? "bg-gradient-to-r from-emerald-950 via-emerald-500 to-green-400 shadow-[0_0_12px_rgba(16,185,129,0.75)]" : isSurveilled ? "bg-gradient-to-r from-amber-950 via-yellow-500 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.75)]" : "bg-gradient-to-r from-red-950 via-rose-700 to-red-500 shadow-[0_0_10px_rgba(239,68,68,0.35)]"}`} 
                        style={{ width: `${isImmune || isSurveilled ? 100 : Math.min(100, player.heat)}%` }} 
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.12)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.12)_75%,transparent_75%,transparent)] bg-[length:6px_6px] opacity-35 rounded-full" />
                      </div>
                    </div>
                    
                    <span className={`text-[9.5px] md:text-[10.5px] font-mono font-black tracking-tight shrink-0 ${isImmune ? "text-emerald-400 animate-pulse font-extrabold text-[8.5px] sm:text-[9.5px]" : isSurveilled ? "text-amber-400 animate-pulse font-extrabold text-[8.5px] sm:text-[9.5px]" : "text-rose-500"}`}>
                      {isImmune ? timerStr : isSurveilled ? sTimerStr : `${Math.round(player.heat)}%`}
                    </span>
                  </div>

                  {/* Intoxication / Toxicity ("QUÍMICOS") */}
                  <div 
                    onClick={() => { playSound.notification(); setIsHospitalOpen(true); }}
                    className="flex items-center justify-start gap-1 cursor-pointer hover:bg-zinc-900/40 px-1 py-0.5 rounded-xl transition border-l border-zinc-800/40 pl-1.5 w-full"
                    title={lang === "en" ? `Intoxication: ${player.contamination}%` : `Intoxicação: ${player.contamination}%`}
                  >
                    <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 border border-[#caa560]/25 flex items-center justify-center shadow shadow-emerald-950/50 shrink-0 select-none">
                      <span className="text-[10px] filter drop-shadow-[0_0_4px_rgba(16,185,129,0.7)]" role="img" aria-label="Toxicity">
                        {player.contamination > 55 ? "🤢" : "💊"}
                      </span>
                    </div>
                    
                    {/* Emerald glass tube bar */}
                    <div className="flex-1 h-3.5 bg-neutral-950 rounded-full border border-zinc-855 p-[1.5px] overflow-hidden relative shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-emerald-950 via-emerald-600 to-green-500 h-full rounded-full transition-all duration-300 relative shadow-[0_0_10px_rgba(16,185,129,0.35)]" 
                        style={{ width: `${Math.min(100, player.contamination)}%` }} 
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.12)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.12)_50%,rgba(255,255,255,0.12)_75%,transparent_75%,transparent)] bg-[length:6px_6px] opacity-35 rounded-full" />
                      </div>
                    </div>
                    
                    <span className="text-[9.5px] md:text-[10.5px] font-mono font-black text-emerald-400 tracking-tight shrink-0">
                      {player.contamination}%
                    </span>
                  </div>

                </div>

                {/* SUBBLOCK C: CURRENCIES (CASH & CAYMAN BANK) - ENVELOPE PILLS & EXPAND FULL HUD */}
                <div className="flex items-center justify-center xl:justify-end gap-1.5 shrink-0 select-none w-full sm:w-auto">
                  {/* Cash pocket money - Dinheiro */}
                  <div 
                    onClick={() => { playSound.cash(); setIsBankModalOpen(true); }}
                    className={`cursor-pointer bg-gradient-to-b p-1.5 px-2.5 transition rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-md h-8.5 shrink-0 active:scale-95 ${
                      player.taxDebt && player.taxDebt > 0
                        ? "from-red-950/40 via-red-900/30 to-red-950/50 border-2 border-red-500 hover:brightness-125 animate-[pulse_1.2s_infinite] shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                        : "from-[#1b1916] via-[#211e1a] to-[#12100d] border border-[#caa560]/30 hover:brightness-125"
                    }`}
                    title={lang === "en" 
                      ? (player.taxDebt && player.taxDebt > 0 ? "❗️ PAY OUTSTANDING TAXES! Click to clear" : "Pocket Money (Open Swiss Vault)") 
                      : (player.taxDebt && player.taxDebt > 0 ? "❗️ PAGUE OS IMPOSTOS PENDENTES! Clique para regularizar" : "Dinheiro na mão")
                    }
                  >
                    <span className={`text-[10px] ${player.taxDebt && player.taxDebt > 0 ? "animate-bounce" : "filter drop-shadow-[0_1px_3px_rgba(52,211,153,0.45)]"}`} role="img" aria-label="Cash">💵</span>
                    <span className={`text-[9.5px] sm:text-[11px] font-mono font-extrabold tracking-tight select-none ${
                      player.taxDebt && player.taxDebt > 0 ? "text-red-450 text-red-500 font-extrabold" : "text-emerald-400"
                    }`}>
                      ${player.cash.toLocaleString()}
                    </span>
                  </div>

                  {/* Connections Premium Currency */}
                  <div 
                    className="cursor-default bg-gradient-to-b from-[#1b1916] via-[#211e1a] to-[#12100d] p-1.5 px-2.5 hover:brightness-125 transition border border-purple-500/40 rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-md h-8.5 shrink-0 active:scale-95 border-b-purple-500/20 shadow-purple-900/10"
                    title={lang === "en" ? "Connections (Premium)" : "Conexões (Premium)"}
                  >
                    <span className="text-[10px] filter drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]" role="img" aria-label="Connections">🔗</span>
                    <span className="text-[9.5px] sm:text-[11px] font-mono text-purple-400 font-extrabold tracking-tight select-none">
                      {player.connections?.toLocaleString() || 0}
                    </span>
                  </div>

                  {/* Swiss Cayman Vault */}
                  <div 
                    onClick={() => { playSound.cash(); setIsBankModalOpen(true); }}
                    className={`cursor-pointer bg-gradient-to-b p-1.5 px-2.5 transition rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-md h-8.5 shrink-0 mix-blend-screen hidden xs:flex active:scale-95 ${
                      player.taxDebt && player.taxDebt > 0
                        ? "from-red-950/40 via-red-900/30 to-red-950/50 border-2 border-red-500/80 hover:brightness-125 animate-[pulse_1s_infinite] shadow-[0_0_10px_rgba(239,68,68,0.55)]"
                        : "from-[#1b1916] via-[#211e1a] to-[#12100d] border border-amber-500/25 hover:brightness-125"
                    }`}
                    title={lang === "en" 
                      ? (player.taxDebt && player.taxDebt > 0 ? "⚠️ IRS Audit Evasion Risk (Pay Tax!)" : "Swiss Vault Records") 
                      : (player.taxDebt && player.taxDebt > 0 ? "⚠️ Risco de Fiscalização da SWAT (Pague o Imposto!)" : "Depósito Cayman")
                    }
                  >
                    <span className={`text-[10px] ${player.taxDebt && player.taxDebt > 0 ? "text-red-500 animate-pulse animate-[pulse_1s_infinite]" : "filter drop-shadow-[0_1px_3px_rgba(202,165,96,0.5)]"}`} role="img" aria-label="Bank">🏦</span>
                    <span className={`text-[9.5px] sm:text-[11px] font-mono font-black tracking-tight select-none ${
                      player.taxDebt && player.taxDebt > 0 ? "text-red-400 font-extrabold" : "text-[#caa560]"
                    }`}>
                      ${player.bank.toLocaleString()}
                    </span>
                  </div>

                  {/* Real-time Dividends Cooldown Timer */}
                  <div 
                    onClick={() => { playSound.cash(); setIsBankModalOpen(true); }}
                    className="cursor-pointer bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 p-1.5 px-2 hover:brightness-125 transition border border-zinc-805 border-zinc-800 rounded-xl flex items-center gap-1 sm:gap-1.5 shadow-md h-8.5 shrink-0 hover:border-emerald-500/20 active:scale-95"
                    title={lang === "en" ? "Time remaining until next passive paycheck / bank interest payout" : "Tempo restante para receber novos juros e aluguéis passivos"}
                  >
                    <span className="text-[10px] filter drop-shadow-[0_1px_3px_rgba(52,211,153,0.45)] animate-pulse">💸</span>
                    <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-zinc-500 hidden sm:inline">
                      {lang === "en" ? "Pay: " : "Ciclo: "}
                    </span>
                    <span className="text-[9.5px] sm:text-[11px] font-mono text-emerald-400 font-extrabold tracking-tight shrink-0">
                      {Math.floor(dividendCooldown / 60)}m {dividendCooldown % 60}s
                    </span>
                  </div>

                  {/* Logs Menu Button */}
                  <div className="shrink-0">
                    <button 
                      onClick={() => { 
                        playSound.notification(); 
                        setIsLogsOpen(!isLogsOpen); 
                      }}
                      className={`h-8.5 w-8.5 rounded-xl border flex items-center justify-center transition-all duration-200 outline-none relative group cursor-pointer ${
                        isLogsOpen 
                          ? "bg-red-900/30 text-red-500 border-red-500/75 shadow-[0_0_15px_rgba(239,68,68,0.35)]" 
                          : "bg-[#141210] hover:bg-zinc-900 border-zinc-850 hover:border-red-500/35 text-zinc-400 hover:text-white"
                      }`}
                      title={lang === "en" ? "Game Logs" : "Registro de Logs"}
                    >
                      <span className="text-[11px] group-hover:scale-110 transition duration-150">📜</span>
                      {gameLogs.length > 0 && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>}
                    </button>
                  </div>

                  {/* Character sheet Expandable button */}
                  <div className="shrink-0">
                    <button 
                      onClick={() => { 
                        playSound.notification(); 
                        setIsHudStatsExpanded(!isHudStatsExpanded); 
                      }}
                      className={`h-8.5 w-8.5 rounded-xl border flex items-center justify-center transition-all duration-200 outline-none relative group cursor-pointer ${
                        isHudStatsExpanded 
                          ? "bg-[#caa560]/20 text-[#caa560] border-[#caa560]/75 shadow-[0_0_15px_rgba(202,165,96,0.35)]" 
                          : "bg-[#141210] hover:bg-zinc-900 border-zinc-850 hover:border-[#caa560]/35 text-zinc-400 hover:text-white"
                      }`}
                      title={lang === "en" ? "Confidential Dossier & Systems" : "Informações e Dossier"}
                    >
                      <span className="text-[11px] group-hover:scale-110 transition duration-150">💼</span>
                      <span className="absolute bottom-[0.5px] right-[1.5px] text-[5px] text-[#caa560] opacity-75 font-black font-sans">
                        {isHudStatsExpanded ? "▲" : "▼"}
                      </span>
                    </button>
                  </div>

                  {/* Clean screen Minimize HUD button */}
                  <div className="shrink-0">
                    <button 
                      onClick={() => { 
                        playSound.notification(); 
                        setIsHudMinimized(true);
                        setIsHudStatsExpanded(false); 
                      }}
                      className="h-8.5 w-8.5 rounded-xl border bg-[#141210] hover:bg-zinc-900 border-zinc-850 hover:border-[#caa560]/35 text-zinc-400 hover:text-white flex items-center justify-center transition-all duration-200 outline-none relative group cursor-pointer"
                      title={lang === "en" ? "Minimize HUD (Clean screen)" : "Minimizar HUD (Tela limpa)"}
                    >
                      <span className="text-[12px] group-hover:scale-110 transition duration-150">👁️</span>
                      <span className="absolute bottom-[0.5px] right-[1.5px] text-[4.5px] text-[#caa560] opacity-75 font-black font-sans uppercase">
                        {lang === "en" ? "HIDE" : "OCULT."}
                      </span>
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
            )}

            {/* EXPANDABLE STATS & UTILITIES DRAWER - FLOATING BOX WITH ADJUSTED OPACITY */}
            {isHudStatsExpanded && (
              <>
                {/* Backdrop shade overlay */}
                <div 
                  className="fixed inset-0 z-45 bg-[#0a0807]/75 backdrop-blur-[3.5px] transition-opacity duration-300"
                  onClick={() => setIsHudStatsExpanded(false)}
                />
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="fixed bottom-[55px] xs:bottom-[65px] sm:bottom-[72px] left-1/2 -translate-x-1/2 z-50 w-[96%] sm:w-[90%] md:w-[85%] max-w-3xl rounded-xl sm:rounded-2xl border-2 p-3.5 sm:p-4.5 flex flex-col gap-2.5 select-none text-[#ead5ba] font-sans"
                  style={{ 
                    background: `linear-gradient(to bottom, rgba(18, 15, 12, ${Math.min(0.99, hudOpacity + 0.16)}), rgba(10, 8, 7, ${Math.min(0.99, hudOpacity + 0.24)}))`,
                    borderColor: `rgba(202, 165, 96, ${0.45 + (hudOpacity * 0.30)})`,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    boxShadow: "0 25px 60px -15px rgba(0,0,0,0.98), inset 0 1px 3px rgba(255, 255, 255, 0.06)"
                  }}
                >
                  {/* Floating cabinet header with compact close button */}
                  <div className="flex justify-between items-center border-b border-[#caa560]/25 pb-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">💼</span>
                      <span className="font-mono text-[9px] sm:text-[10px] font-black tracking-[0.16em] text-[#caa560] uppercase">
                        {lang === "en" ? "FEDERAL DOSSIER / SYSTEM CENTRAL" : "DOSSIÊ CONFIDENCIAL / MEIO AMBIENTE"}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => { playSound.notification(); setIsHudStatsExpanded(false); }}
                      className="text-[8.5px] font-mono font-black text-rose-500 hover:text-white bg-red-955/20 hover:bg-neutral-900 border border-red-900/30 px-2 py-0.5 rounded-md cursor-pointer transition duration-150"
                      title={lang === "en" ? "Close dossier panel" : "Fechar dossiê"}
                    >
                      ✕ {lang === "en" ? "CLOSE" : "FECHAR"}
                    </button>
                  </div>

                  {/* 4-Column Responsive Grid panel */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] sm:text-xs">
                  
                  {/* COL 1: CHARACTER FIGHTING ATTRIBUTES */}
                  <div className="bg-zinc-950/40 p-2 rounded-xl border border-zinc-900/30 flex flex-col gap-1">
                    <span className="text-[7px] font-mono font-bold text-zinc-500 uppercase tracking-widest block border-b border-zinc-900/30 pb-0.5">
                      ⚔️ {lang === "en" ? "ATTRIBUTES" : "ATRIBUTOS"}
                    </span>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <div className="px-1.5 py-0.5 bg-zinc-950/80 rounded-lg flex items-center justify-between border border-zinc-900/40" title={lang === "en" ? `Strength (Total: ${syncStrength})` : `Força (Total: ${syncStrength})`}>
                        <span className="text-[10px]">⚔️</span>
                        <span className="font-mono font-black text-red-500">{syncStrength}</span>
                      </div>
                      <div className="px-1.5 py-0.5 bg-zinc-950/80 rounded-lg flex items-center justify-between border border-zinc-900/40" title={lang === "en" ? `Defense (Total: ${syncDefense})` : `Defesa (Total: ${syncDefense})`}>
                        <span className="text-[10px]">🛡️</span>
                        <span className="font-mono font-black text-blue-400">{syncDefense}</span>
                      </div>
                      <div className="px-1.5 py-0.5 bg-zinc-950/80 rounded-lg flex items-center justify-between border border-zinc-900/40" title={lang === "en" ? "Intellect" : "Intelecto"}>
                        <span className="text-[10px]">💡</span>
                        <span className="font-mono font-black text-cyan-400">{player.intellect}</span>
                      </div>
                      <div className="px-1.5 py-0.5 bg-zinc-950/80 rounded-lg flex items-center justify-between border border-zinc-900/40" title={lang === "en" ? "Willpower / Luck" : "Sorte / Willpower"}>
                        <span className="text-[10px]">🍀</span>
                        <span className="font-mono font-black text-amber-500">{player.willpower}</span>
                      </div>
                    </div>
                  </div>

                  {/* COL 2: INFLUENCE & RESPECT CURRENCIES */}
                  <div className="bg-zinc-950/40 p-2 rounded-xl border border-zinc-900/30 flex flex-col gap-1">
                    <span className="text-[7px] font-mono font-bold text-zinc-500 uppercase tracking-widest block border-b border-zinc-900/30 pb-0.5">
                      ⭐ {lang === "en" ? "INFLUENCE" : "PRESTÍGIO"}
                    </span>
                    <div className="flex flex-col gap-1 mt-1 font-mono text-[8.5px] sm:text-[9.5px]">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">⭐ {lang === "en" ? "RESPECT" : "RESPEITO"}:</span>
                        <span className="text-purple-400 font-extrabold">{player.respect.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">🌿 {lang === "en" ? "WEED BAG" : "ERVA CONTR."}:</span>
                        <span className="text-green-400 font-extrabold">{player.drugsInventory["weed"] || 0} u</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">🚨 {lang === "en" ? "WANTED HEAT" : "POLÍCIA"}:</span>
                        <span className={`font-black ${player.heat > 50 ? "text-rose-500 animate-pulse" : "text-yellow-500"}`}>{player.heat}%</span>
                      </div>
                    </div>
                  </div>

                  {/* COL 3: EQUIPMENTS IN USE */}
                  <div className="bg-zinc-950/40 p-2 rounded-xl border border-zinc-900/30 flex flex-col gap-1">
                    <span className="text-[7px] font-mono font-bold text-zinc-500 uppercase tracking-widest block border-b border-zinc-900/30 pb-0.5">
                      🔫 {lang === "en" ? "EQUIPMENT" : "EQUIPADO"}
                    </span>
                    <div className="flex flex-col gap-1 mt-1 text-[8.5px] sm:text-[9px]">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">🔫 {lang === "en" ? "WEAP" : "ARMA"}:</span>
                        <span className="text-zinc-300 font-extrabold truncate max-w-[70px] sm:max-w-none text-right">
                          {currentWeapon ? (lang === "en" ? currentWeapon.nameEn : currentWeapon.namePt).split(" ").slice(0, 2).join(" ") : (lang === "en" ? "None" : "Nenhuma")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">🚗 {lang === "en" ? "RIDE" : "CARRO"}:</span>
                        <span className="text-rose-400 font-extrabold truncate max-w-[70px] sm:max-w-none text-right">
                          {currentVehicle ? (lang === "en" ? currentVehicle.nameEn : currentVehicle.namePt).split(" ").slice(0, 2).join(" ") : (lang === "en" ? "None" : "Nenhum")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-zinc-900/30 pt-0.5 mt-0.5">
                        <span className="text-zinc-500">📦 {lang === "en" ? "TOTAL BAG" : "MALETA"}:</span>
                        <span className="text-emerald-400 font-bold">{totalContrabandDrugs} u</span>
                      </div>
                    </div>
                  </div>

                  {/* COL 4: TRANSACTIONS & SYSTEM HUD PREFERENCES */}
                  <div className="bg-zinc-950/40 p-2 rounded-xl border border-zinc-900/30 flex flex-col gap-1">
                    <span className="text-[7px] font-mono font-bold text-zinc-500 uppercase tracking-widest block border-b border-zinc-900/30 pb-0.5">
                      ⚙️ {lang === "en" ? "HUD SETTINGS" : "AJUSTES"}
                    </span>
                    


                    {/* Integrated mini buttons row */}
                    <div className="grid grid-cols-4 gap-1 border-t border-zinc-900/30 pt-1.5 mt-1">
                      {/* Language toggling */}
                      <button 
                        onClick={() => { playSound.notification(); setLang(lang === "en" ? "pt" : "en"); }}
                        className="h-5 bg-zinc-900 border border-zinc-850 text-[10px] rounded hover:text-white hover:bg-zinc-800 transition flex items-center justify-center"
                        title={lang === "en" ? "Toggle Language locale" : "Traduzir idioma"}
                      >
                        {lang === "en" ? "🇺🇸" : "🇧🇷"}
                      </button>

                      {/* Sound Toggle */}
                      <button 
                        onClick={() => { setSoundEnabled(!soundEnabled); }}
                        className={`h-5 rounded border text-[10px] flex items-center justify-center transition ${soundEnabled ? "bg-zinc-900 border-zinc-850 text-zinc-300" : "bg-red-955/20 border-red-500/30 text-red-500"}`}
                        title={lang === "en" ? `Sounds: ${soundEnabled ? "On" : "Off"}` : `Sons: ${soundEnabled ? "On" : "Off"}`}
                      >
                        {soundEnabled ? "🔊" : "🔇"}
                      </button>

                      {/* Ambient Night shift mode */}
                      <button 
                        onClick={() => { playSound.notification(); setIsNightMode(!isNightMode); }}
                        className={`h-5 rounded border text-[10px] flex items-center justify-center transition-all duration-150 ${isNightMode ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-400 shadow" : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200"}`}
                        title={lang === "en" ? "Toggle day/night ambient palette" : "Mudar paleta noite/dia"}
                      >
                        🌙
                      </button>

                      {/* Mail console shortcut */}
                      <button 
                        onClick={() => {
                          playSound.notification();
                          setInboxOpen(true);
                        }}
                        className="h-5 bg-zinc-900 border border-zinc-850 text-zinc-400 flex items-center justify-center rounded relative hover:text-white transition"
                        title={lang === "en" ? "Consolidated Post Mailbox" : "Caixa de correspondência"}
                      >
                        <Mail className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                        <span className="absolute top-0 right-0 w-1 h-1 bg-rose-500 rounded-full animate-ping"></span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Level up progress line across full drawer width */}
                <div className="bg-zinc-950/50 p-1 rounded-xl border border-zinc-900/30 w-full flex items-center justify-between text-[8px] sm:text-[9.5px] font-mono gap-2 mt-0.5 select-none">
                  <span className="text-zinc-500 shrink-0">⭐ {lang === "en" ? "LEVEL EXP PROGRESS" : "PROGRESSO DE EXPERIÊNCIA"}:</span>
                  <div className="flex-1 h-1 bg-zinc-950 rounded-full overflow-hidden relative border border-zinc-900/10">
                    <div 
                      className="bg-gradient-to-r from-red-500 via-rose-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.round((player.exp / player.expNext) * 100))}%` }}
                    />
                  </div>
                  <span className="text-indigo-400 font-extrabold shrink-0 truncate max-w-[124px] text-right">
                    {player.exp.toLocaleString()}/{player.expNext.toLocaleString()} ({Math.min(100, Math.round((player.exp / player.expNext) * 100))}%)
                  </span>
                </div>

                {/* Syndicate Dividend & Wipe Character (Espanador) row in Bottom HUD */}
                <div className="grid grid-cols-2 gap-2 pt-1.5 w-full">
                  <div>
                    {bonusSeconds > 0 ? (
                      <div className="py-1 px-2.5 bg-zinc-950/80 border border-zinc-900 rounded-xl flex items-center justify-between text-[8px] sm:text-[9px] font-mono h-[30px] sm:h-[34px]">
                        <span className="text-zinc-500 tracking-wider font-bold uppercase">{lang === "en" ? "DIVIDEND" : "LUCRO"}</span>
                        <span className="text-zinc-400 font-extrabold flex items-center gap-1">
                          <Clock className="w-2 h-2 text-zinc-500" />
                          {(() => {
                            const h = String(Math.floor(bonusSeconds / 3600)).padStart(2, "0");
                            const m = String(Math.floor((bonusSeconds % 3600) / 60)).padStart(2, "0");
                            const s = String(bonusSeconds % 60).padStart(2, "0");
                            return `${h}:${m}:${s}`;
                          })()}
                        </span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          playSound.cash();
                          const added = Math.floor(Math.random() * 1500) + 1205;
                          setPlayer((prev) => prev ? { ...prev, cash: prev.cash + added } : null);
                          addGameLog(
                            `Collected Syndicate Patron Dividend bonus of +$${added.toLocaleString()} cash!`,
                            `Coletou o Bônus de Fidelidade da Máfia de +$${added.toLocaleString()} em dinheiro!`,
                            "bonus",
                            "🎁"
                          );
                          triggerAlert(lang === "en" ? `Syndicate bonus claimed: +$${added}!` : `Bônus do Sindicato coletado: +$${added}!`, "success");
                          setBonusSeconds(1357);
                        }}
                        className="w-full h-[30px] sm:h-[34px] py-1 px-2.5 bg-gradient-to-r from-red-600/15 to-red-950/30 border border-red-500/30 rounded-xl text-center text-[8.5px] sm:text-[9.5px] font-mono font-bold text-red-400 hover:text-white select-none cursor-pointer duration-150 uppercase tracking-wider flex items-center justify-center gap-1 hover:border-red-500/60"
                      >
                        🎁 {lang === "en" ? "DIVIDEND" : "LUCRO MÁFIA"}
                      </button>
                    )}
                  </div>

                  {/* Espanador (Wipe Character File) */}
                  <button 
                    onClick={handleResetGame}
                    className="h-[30px] sm:h-[34px] py-1 px-2.5 bg-red-950/15 hover:bg-red-900/10 border border-red-900/30 hover:border-red-500/60 rounded-xl text-center text-[8.5px] sm:text-[9.5px] font-mono font-extrabold text-red-400 hover:text-white select-none cursor-pointer duration-150 uppercase tracking-wider flex items-center justify-center gap-1.5"
                    title={lang === "en" ? "Wipe Game save" : "Deletar / Limpar ficha personagem"}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                    <span>{lang === "en" ? "WIPE DOSSIER" : "ESPANAR FICHA"}</span>
                  </button>
                </div>

              </motion.div>
            </>
          )}
        </>
        );
      })()}



       {/* GLOBAL BACKGROUND FOOTER LIMIT COMPLIANCE */}
       <footer className="py-6 border-t border-zinc-900 text-center text-[10px] text-zinc-650 text-zinc-500 font-mono select-none mt-auto">
         <p>Mobster City RPG Online &bull; App Business Ventures LLC &copy; 2026. All rights reserved.</p>
       </footer>
     </div>
   );
 }
