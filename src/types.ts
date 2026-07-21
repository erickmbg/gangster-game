export interface PlayerState {
  name: string;
  level: number;
  exp: number;
  expNext: number;
  respect: number;
  energy: number;
  maxEnergy: number;
  health: number;
  maxHealth: number;
  cash: number;
  bank: number;
  strength: number;
  defense: number;
  intellect: number;
  willpower: number;
  location: string;
  weapons: string[]; // item IDs
  activeWeapon: string | null;
  vehicles: string[]; // item IDs
  activeVehicle: string | null;
  realEstate: string[]; // item IDs
  crimesCommitted: number;
  fightsWon: number;
  fightsLost: number;
  heistCooldowns: Record<string, number>; // itemId -> timestamp
  drugsInventory: Record<string, number>; // drugId -> quantity
  lastUpdate: number; // For passive recovery
  heat?: number; // Police wanted level (0-100)
  contamination?: number; // Drug contamination/toxicity levels (0-100)
  pets?: Record<string, { id: string; level: number }>;
  activePet?: string | null;
  travelCooldownUntil?: number;
  ringCooldownUntil?: number;
  intoxicationCuredCount?: number;
  policeImmuneUntil?: number;
  underSurveillanceUntil?: number;
  connections: number;
  battlePoints: number;
  trainingPoints: number;
  lastPointsReset: number;
  connectionPrice: number;
  totalBribesPaid?: number;
  totalBankDeposits?: number;
  taxDebt?: number;
  ammo?: number;
  fuel?: number;
  petFood?: number;
  empresarioLvl?: number;
  extortions?: number;
  laboratoryDrugs?: Record<string, number>;
  customDrinks?: Record<string, number>;
  prostitutes?: string[];
  streetSlots?: Array<{ id: string; purchased: boolean; buildingId: string | null; level: number }>;
  intoxication?: number;
  wantedLevel?: number;
  skillPoints?: number;
  unlockedSkills?: Record<string, number>;
  dailyMissions?: Array<{
    id: string;
    titlePt: string;
    titleEn: string;
    target: number;
    current: number;
    rewardType: "cash" | "connections" | "item" | "ammo";
    rewardValue: number;
    rewardItem?: string;
    completed: boolean;
    claimed: boolean;
  }>;
}

export interface GameItem {
  id: string;
  nameEn: string;
  namePt: string;
  descriptionEn: string;
  descriptionPt: string;
  cost: number;
  type: "weapon" | "vehicle" | "realestate";
  bonusStrength?: number;
  bonusDefense?: number;
  passiveIncome?: number; // Income per hour (or cycle)
  minLevel?: number; // Minimum level required to buy
  emoji?: string;
}

export interface Drug {
  id: string;
  nameEn: string;
  namePt: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  emoji?: string;
  effects?: {
    health?: number;
    energy?: number;
    strength?: number;
    defense?: number;
    intellect?: number;
    willpower?: number;
    heat?: number;
  };
  descriptionEn?: string;
  descriptionPt?: string;
}

export interface Crime {
  id: string;
  nameEn: string;
  namePt: string;
  descriptionEn: string;
  descriptionPt: string;
  energyCost: number;
  successRate: number; // Base rate between 0 and 1
  minIntellect: number;
  rewardCashMin: number;
  rewardCashMax: number;
  rewardExp: number;
  rewardRespect: number;
}

export interface OrganizedHeist {
  id: string;
  nameEn: string;
  namePt: string;
  descriptionEn: string;
  descriptionPt: string;
  energyCost: number;
  cooldownSeconds: number;
  successRate: number; // Base rate between 0 and 1
  rewardCashMin: number;
  rewardCashMax: number;
  rewardExp: number;
  rewardRespect: number;
}

export interface Neighborhood {
  id: string;
  nameEn: string;
  namePt: string;
  travelCost: number;
  descriptionEn: string;
  descriptionPt: string;
}

export interface CombatLog {
  attacker: string;
  defender: string;
  rounds: {
    round: number;
    attackerDamage: number;
    defenderDamage: number;
    attackerCrit: boolean;
    defenderCrit: boolean;
    textEn: string;
    textPt: string;
  }[];
  winner: string;
  lootCash: number;
  lootRespect: number;
  xpGained: number;
}

export interface GameLog {
  id: string;
  timestamp: number;
  textEn: string;
  textPt: string;
  type: "crime" | "heist" | "combat" | "travel" | "market" | "shop" | "bank" | "level" | "system" | "bonus";
  icon: string;
}

export interface Opponent {
  id: string;
  name: string;
  avatar: string;
  level: number;
  strength: number;
  defense: number;
  health: number;
  respect: number;
  cashRewardMin: number;
  cashRewardMax: number;
  difficulty: "easy" | "normal" | "hard" | "boss";
  energyCost: number;
}

// Static Definitions
export const NEIGHBORHOODS: Neighborhood[] = [
  {
    id: "brooklyn",
    nameEn: "Brooklyn",
    namePt: "Brooklyn",
    travelCost: 15,
    descriptionEn: "Your starting turf. Hipsters, brownstones, and rising crime.",
    descriptionPt: "O seu território inicial. Brownstones clássicos e criminalidade em ascensão.",
  },
  {
    id: "bronx",
    nameEn: "The Bronx",
    namePt: "O Bronx",
    travelCost: 30,
    descriptionEn: "Heavy industrial area and gritty streets. High drug price volatility.",
    descriptionPt: "Área industrial pesada e ruas degradadas. Alta volatilidade no preço das substâncias.",
  },
  {
    id: "queens",
    nameEn: "Queens",
    namePt: "Queens",
    travelCost: 25,
    descriptionEn: "Highly diverse residential turf. Good place for local deals.",
    descriptionPt: "Território residencial extremamente diverso. Ótimo para acordos locais.",
  },
  {
    id: "manhattan",
    nameEn: "Manhattan",
    namePt: "Manhattan",
    travelCost: 50,
    descriptionEn: "The financial heart of the city. Elite targets, tight security.",
    descriptionPt: "O coração financeiro do império. Alvos de elite e segurança apertada.",
  },
  {
    id: "staten_island",
    nameEn: "Staten Island",
    namePt: "Staten Island",
    travelCost: 20,
    descriptionEn: "Quiet, suburban atmosphere. Perfect for hiding out and cheap cargo.",
    descriptionPt: "Atmosfera suburbana pacífica. Perfeito para se esconder e carregar cargas baratas.",
  },
  {
    id: "suburbio",
    nameEn: "Suburbs",
    namePt: "Subúrbio",
    travelCost: 35,
    descriptionEn: "Unpredictable derelict outskirts with a shrouded local economy. Rumors whisper of hidden opportunities.",
    descriptionPt: "Periferia imprevisível de becos escuros e economia paralela. Boatos sussurram sobre oportunidades ocultas.",
  }
];

export const DRUGS: Drug[] = [
  {
    id: "weed",
    nameEn: "Weed",
    namePt: "Maconha",
    basePrice: 50,
    minPrice: 15,
    maxPrice: 120,
    emoji: "🌿",
    effects: { health: 15, heat: -5 },
    descriptionEn: "Calming herbal smoke. Lowers wanted level, heals slight injuries.",
    descriptionPt: "Erva relaxante defumada. Reduz o nível de procurado (heat) e cura leves escoriações."
  },
  {
    id: "skunk",
    nameEn: "Skunk Hydroponic",
    namePt: "Skunk Hidropônico",
    basePrice: 250,
    minPrice: 90,
    maxPrice: 620,
    emoji: "🦨",
    effects: { health: 25, heat: -8, willpower: 1 },
    descriptionEn: "Stronger high-grade THC. Relieves stress, lowers heat, boosts willpower.",
    descriptionPt: "Variedade potente com alto teor de THC. Alivia tensões das ruas, reduz procurado e treina determinação."
  },
  {
    id: "crumble",
    nameEn: "Crumble Wax",
    namePt: "Crumble Concentrado",
    basePrice: 800,
    minPrice: 300,
    maxPrice: 1900,
    emoji: "🍯",
    effects: { health: 35, energy: 25, intellect: 2 },
    descriptionEn: "Highly concentrated honey wax extract. Refines brain reflexes.",
    descriptionPt: "Extrato de alta concentração de resina. Estimula conexões mentais, aumentando o intelecto."
  },
  {
    id: "og_kush",
    nameEn: "OG Kush Premium",
    namePt: "OG Kush Suprema",
    basePrice: 600,
    minPrice: 200,
    maxPrice: 1550,
    emoji: "🌲",
    effects: { health: 40, energy: 15, heat: -15, willpower: 3 },
    descriptionEn: "Top-tier legendary strain. Instant calm, high heat reduction and major will boost.",
    descriptionPt: "Garantia de pura tranquilidade. Limpa arquivos policiais drasticamente e gera foco puro."
  },
  {
    id: "ice_extraction",
    nameEn: "Ice Extraction",
    namePt: "Extração Ice-O-Lator",
    basePrice: 1200,
    minPrice: 450,
    maxPrice: 3100,
    emoji: "❄️",
    effects: { health: 50, heat: -20, willpower: 4 },
    descriptionEn: "Premium mechanical resin extraction. Maximum purity, extreme stress relief and zero trail left.",
    descriptionPt: "Extração de resina mecânica premium. Graus de pureza extrema, elimina rastro criminoso e foca a mente."
  },
  {
    id: "pills",
    nameEn: "Ecstasy Pills",
    namePt: "Ecstasy",
    basePrice: 180,
    minPrice: 40,
    maxPrice: 550,
    emoji: "💊",
    effects: { energy: 30, health: -5 },
    descriptionEn: "Hyper energy stimulant. Fast energy recovery but damages health.",
    descriptionPt: "Estimulante sintético acelerado. Recupera energia muito rápido mas corrói um pouco a saúde."
  },
  {
    id: "meth",
    nameEn: "Crystal Meth",
    namePt: "Metanfetamina",
    basePrice: 3550,
    minPrice: 120,
    maxPrice: 900,
    emoji: "💎",
    effects: { energy: 50, heat: 10, health: -10, willpower: 2 },
    descriptionEn: "Dangerous synthetic surge. Major energy boost, details paranoia but hardens drive.",
    descriptionPt: "Surgimento sintético de energia. Surto elétrico potente, aumenta procurado mas endurece foco."
  },
  {
    id: "cocaine",
    nameEn: "Pure Cocaine",
    namePt: "Cocaína Pura",
    basePrice: 950,
    minPrice: 400,
    maxPrice: 2200,
    emoji: "❄️",
    effects: { energy: 80, strength: 5, health: -15 },
    descriptionEn: "Elite Colombian stimulant. Near-instant full energy and hard hitting power.",
    descriptionPt: "Injeção letal de ânimo. Energia nas alturas e aumento provisório instantâneo de força de ataque."
  },
  {
    id: "heroin",
    nameEn: "Pure Heroin",
    namePt: "Heroína Pura",
    basePrice: 1800,
    minPrice: 800,
    maxPrice: 4500,
    emoji: "💉",
    effects: { health: 100, energy: -40 },
    descriptionEn: "Heavy opiate painkiller. Fully numbs all pain, but causes serious exhaustion.",
    descriptionPt: "Anestésico bruto e potente. Zera qualquer ferida e regenera vida cheia, mas desliga sua energia."
  },
  {
    id: "lanca_perfume",
    nameEn: "Lança Perfume",
    namePt: "Lança Perfume",
    basePrice: 140,
    minPrice: 50,
    maxPrice: 380,
    emoji: "🧪",
    effects: { health: -5, energy: 25, willpower: 1 },
    descriptionEn: "Inhalant ether solvent. Instant sweet burst of pure physical energy, damages health slightly.",
    descriptionPt: "Solvente inalável metalizado e perfumado. Dá um pico instantâneo de energia e bem-estar, mas corrói um pouco a saúde."
  },
  {
    id: "crack",
    nameEn: "Crack Rock",
    namePt: "Crack",
    basePrice: 50,
    minPrice: 15,
    maxPrice: 180,
    emoji: "🪨",
    effects: { health: -15, energy: 40, heat: 12 },
    descriptionEn: "Fast hit ultra stimulator. Massive initial energy surge at the expense of high police attention (paranoia) and health damage.",
    descriptionPt: "Pedra de alta queima. Fornece uma recarga brutal de energia por custos baixíssimos, mas destrói sua saúde e eleva a agitação policial (heat)."
  },
  {
    id: "ayahuasca",
    nameEn: "Ayahuasca Tea",
    namePt: "Chá de Ayahuasca",
    basePrice: 950,
    minPrice: 400,
    maxPrice: 2200,
    emoji: "🍵",
    effects: { health: 25, energy: -15, intellect: 4, willpower: 5 },
    descriptionEn: "Amazonian sacred brew. Heavy physiological purge, lowers immediate energy but permanently elevates intellect and willpower.",
    descriptionPt: "Bebida ancestral sagrada amazônica. Provoca purga inicial de energia física, mas eleva permanentemente seu intelecto e determinação."
  },
  {
    id: "mounjaro",
    nameEn: "Mounjaro Shot",
    namePt: "Dose de Mounjaro",
    basePrice: 1800,
    minPrice: 800,
    maxPrice: 3900,
    emoji: "💉",
    effects: { health: 65, energy: 65 },
    descriptionEn: "High-grade cellular metabolic modulator peptide. Exceptional full biological energy and health restoration.",
    descriptionPt: "Caneta de reprogramação metabólica de última geração. Entrega uma recuperação extrema e limpa de 65% de energia e vida simultâneas."
  }
];

export const CRIMES: Crime[] = [
  {
    id: "pickpocket",
    nameEn: "Pickpocket a Passerby",
    namePt: "Bater Carteira de Transeunte",
    descriptionEn: "Snatch a wallet from a distracted tourist near the subway.",
    descriptionPt: "Puxar a carteira de um turista distraído perto do metrô.",
    energyCost: 5,
    successRate: 0.85,
    minIntellect: 0,
    rewardCashMin: 20,
    rewardCashMax: 100,
    rewardExp: 5,
    rewardRespect: 10,
  },
  {
    id: "shoplift",
    nameEn: "Rob a Convenience Store",
    namePt: "Assaltar Loja de Conveniência",
    descriptionEn: "Hold up the clerk at night. Fast cash but high alarm risk.",
    descriptionPt: "Render o caixa no turno da noite. Grana rápida, mas risco de alarme.",
    energyCost: 12,
    successRate: 0.70,
    minIntellect: 10,
    rewardCashMin: 120,
    rewardCashMax: 450,
    rewardExp: 15,
    rewardRespect: 25,
  },
  {
    id: "car_theft",
    nameEn: "Steal a Luxury Vehicle",
    namePt: "Roubar Carro de Luxo",
    descriptionEn: "Hotwire an unlocked sports car in a fancy parking structure.",
    descriptionPt: "Fazer uma ligação direta em um carro esportivo em um estacionamento nobre.",
    energyCost: 20,
    successRate: 0.55,
    minIntellect: 25,
    rewardCashMin: 600,
    rewardCashMax: 1500,
    rewardExp: 35,
    rewardRespect: 60,
  },
  {
    id: "atm_hack",
    nameEn: "Hack a Bank ATM",
    namePt: "Hackear Caixa Eletrônico",
    descriptionEn: "Use a pocket skimmer and custom hardware malware to trigger cash dispersion.",
    descriptionPt: "Usar um chupa-cabra e malware personalizado para cuspir notas de dinheiro.",
    energyCost: 28,
    successRate: 0.45,
    minIntellect: 50,
    rewardCashMin: 1800,
    rewardCashMax: 4200,
    rewardExp: 80,
    rewardRespect: 120,
  },
  {
    id: "jewelry_rub",
    nameEn: "Smash & Grab Jewelry Store",
    namePt: "Assalto de Vitrine em Joalheria",
    descriptionEn: "Shatter bulletproof glass with a sledgehammer and scoop up diamonds.",
    descriptionPt: "Quebrar o vidro blindado com uma marreta e limpar os mostruários de diamantes.",
    energyCost: 35,
    successRate: 0.35,
    minIntellect: 75,
    rewardCashMin: 4500,
    rewardCashMax: 9500,
    rewardExp: 150,
    rewardRespect: 250,
  }
];

export function getCrimesForNeighborhood(location: string): Crime[] {
  const loc = location ? location.toLowerCase() : "brooklyn";
  switch (loc) {
    case "manhattan":
      return [
        {
          id: "pickpocket",
          nameEn: "Wall Street Pocket Lift",
          namePt: "Bater Carteira na Wall Street",
          descriptionEn: "Snatch a designer leather wallet containing platinum cards from a wealthy hedge fund manager.",
          descriptionPt: "Puxar a carteira de grife contendo cartões platinum de um investidor ricaço.",
          energyCost: 6,
          successRate: 0.65, // Higher risk in Manhattan
          minIntellect: 5,
          rewardCashMin: 120,
          rewardCashMax: 450,
          rewardExp: 10,
          rewardRespect: 18,
        },
        {
          id: "shoplift",
          nameEn: "Heist Fifth Avenue Boutique",
          namePt: "Limpar Boutique da 5ª Avenida",
          descriptionEn: "Slip a diamond-studded luxury watch past computerized designer sensors.",
          descriptionPt: "Burlar os sensores computadorizados e surrupiar um relógio cravejado de diamantes.",
          energyCost: 14,
          successRate: 0.55,
          minIntellect: 25,
          rewardCashMin: 800,
          rewardCashMax: 2400,
          rewardExp: 25,
          rewardRespect: 45,
        },
        {
          id: "car_theft",
          nameEn: "Hijack Armored Executive Limo",
          namePt: "Sequestro de Limusine Real blindada",
          descriptionEn: "Infiltrate a subterranean parking bay and hotwire a luxury bulletproof executive cruiser.",
          descriptionPt: "Infiltrar uma garagem VIP e hackear a ignição de uma limousine blindada executiva.",
          energyCost: 22,
          successRate: 0.40,
          minIntellect: 45,
          rewardCashMin: 2200,
          rewardCashMax: 6500,
          rewardExp: 55,
          rewardRespect: 95,
        },
        {
          id: "atm_hack",
          nameEn: "Underworld Mainframe Wire Hack",
          namePt: "Hackear Mainframe da City",
          descriptionEn: "Tap into an industrial communications vault to spoof high-value corporate bank balances.",
          descriptionPt: "Intercetar roteadores industriais de telecomunicações para desviar transações corporativas de alta grana.",
          energyCost: 30,
          successRate: 0.32,
          minIntellect: 75,
          rewardCashMin: 6500,
          rewardCashMax: 18000,
          rewardExp: 110,
          rewardRespect: 180,
        },
        {
          id: "jewelry_rub",
          nameEn: "Heist Elite Diamond District Vault",
          namePt: "Invadir Cofre do Diamond District",
          descriptionEn: "Use a heavy thermal lance drill to blast into deep concrete security vaults.",
          descriptionPt: "Utilizar uma lança tétrica térmica para perfurar os cofres de alta segurança de diamantes brutos.",
          energyCost: 38,
          successRate: 0.22,
          minIntellect: 90,
          rewardCashMin: 15000,
          rewardCashMax: 45000,
          rewardExp: 220,
          rewardRespect: 380,
        }
      ];
    case "bronx":
      return [
        {
          id: "pickpocket",
          nameEn: "Subway Scuffle Grab",
          namePt: "Furto em Confusão no Metrô do Bronx",
          descriptionEn: "Subtly bump into subway commuters on the 4 Train and pick their copper chains.",
          descriptionPt: "Esbarrar estrategicamente em passageiros no trem da linha 4 e puxar correntes e carteiras.",
          energyCost: 4,
          successRate: 0.88,
          minIntellect: 0,
          rewardCashMin: 15,
          rewardCashMax: 65,
          rewardExp: 4,
          rewardRespect: 12,
        },
        {
          id: "shoplift",
          nameEn: "Bodega Counter Stick-up",
          namePt: "Render Caixa de Bodega do Bronx",
          descriptionEn: "Flash a street-made pistol behind dry Plexiglas shields and empty the cashbox drawer.",
          descriptionPt: "Apontar um cano curto por trás das placas de vidro e esvaziar a caixa registradora de madrugada.",
          energyCost: 11,
          successRate: 0.72,
          minIntellect: 8,
          rewardCashMin: 90,
          rewardCashMax: 320,
          rewardExp: 12,
          rewardRespect: 22,
        },
        {
          id: "car_theft",
          nameEn: "Hijack Industrial Cargo Carrier",
          namePt: "Carga Roubada de Distribuidora",
          descriptionEn: "Overpower freight drivers during scheduled unloading and redirect delivery assets.",
          descriptionPt: "Render motoristas de carga pesada durante o descarregamento de eletrônicos do galpão.",
          energyCost: 18,
          successRate: 0.58,
          minIntellect: 20,
          rewardCashMin: 1150,
          rewardCashMax: 2900,
          rewardExp: 30,
          rewardRespect: 55,
        },
        {
          id: "atm_hack",
          nameEn: "Re-code Local Gas Station ATM",
          namePt: "Clonar Caixa de Posto de Beira de Linha",
          descriptionEn: "Inject custom physical card scraper code inside a lonely fuel station terminal.",
          descriptionPt: "Conectar um dispositivo fraudador de cartões na porta de diagnósticos de um posto industrial.",
          energyCost: 26,
          successRate: 0.45,
          minIntellect: 40,
          rewardCashMin: 1700,
          rewardCashMax: 3500,
          rewardExp: 70,
          rewardRespect: 105,
        },
        {
          id: "jewelry_rub",
          nameEn: "Raid Rival Mobsters Smuggle Loot",
          namePt: "Invadir Depósito de Drogas Rival",
          descriptionEn: "Breach an unmonitored backroad drophouse owned by a competing street crew.",
          descriptionPt: "Invadir de surpresa uma central de esconderijo de gangues rivais e roubar o cofre de emergência.",
          energyCost: 35,
          successRate: 0.32,
          minIntellect: 60,
          rewardCashMin: 4500,
          rewardCashMax: 12000,
          rewardExp: 130,
          rewardRespect: 210,
        }
      ];
    case "queens":
      return [
        {
          id: "pickpocket",
          nameEn: "Unisphere Tourist Slip",
          namePt: "Bater Carteiras na Praça Unisphere",
          descriptionEn: "Stroll around sports centers and carefully fish wallets from naive crowds.",
          descriptionPt: "Fazer o limpo nas mochilas de grupos de turistas nos arredores esportivos de Queens.",
          energyCost: 5,
          successRate: 0.85,
          minIntellect: 0,
          rewardCashMin: 22,
          rewardCashMax: 95,
          rewardExp: 5,
          rewardRespect: 11,
        },
        {
          id: "shoplift",
          nameEn: "Rob Astoria Seafood Terminal",
          namePt: "Interceptar Carga de Frutos do Mar",
          descriptionEn: "Coerce local import managers to bypass billing and slip valuable freight items in your bag.",
          descriptionPt: "Forçar gerentes de importação local a 'ignorar' a ausência de caixas caras de iguarias.",
          energyCost: 12,
          successRate: 0.68,
          minIntellect: 12,
          rewardCashMin: 130,
          rewardCashMax: 440,
          rewardExp: 14,
          rewardRespect: 24,
        },
        {
          id: "car_theft",
          nameEn: "Boost JFK Airport Tuner Car",
          namePt: "Furtar Carro Modificado do Aeroporto",
          descriptionEn: "Access executive long-term parking lot and hotwire a fast turbo-charged street machine.",
          descriptionPt: "Entrar no estacionamento de longa estadia do JFK e dar partida em um bólido turbo modificado.",
          energyCost: 20,
          successRate: 0.52,
          minIntellect: 24,
          rewardCashMin: 750,
          rewardCashMax: 1900,
          rewardExp: 32,
          rewardRespect: 58,
        },
        {
          id: "atm_hack",
          nameEn: "Flushing Internet Cafe Node Attack",
          namePt: "Ataque a Rede de Lan House em Flushing",
          descriptionEn: "Inject custom malicious firmware into high-traffic cybercafe lines to extract coin reserves.",
          descriptionPt: "Injetar firmware malicioso nos canais de uma lan house em Flushing para sugar fundos eletrônicos.",
          energyCost: 27,
          successRate: 0.42,
          minIntellect: 48,
          rewardCashMin: 1850,
          rewardCashMax: 4300,
          rewardExp: 75,
          rewardRespect: 115,
        },
        {
          id: "jewelry_rub",
          nameEn: "Smash Queens Traditional Gold Bazaar",
          namePt: "Saque Express ao Bazar de Ouro",
          descriptionEn: "Shatter heavy safety display glasses at the local neighborhood Indian gold merchant shop.",
          descriptionPt: "Quebrar vitrines blindadas do tradicional comerciante de ouro e carregar correntes maciças.",
          energyCost: 35,
          successRate: 0.34,
          minIntellect: 68,
          rewardCashMin: 5200,
          rewardCashMax: 13500,
          rewardExp: 140,
          rewardRespect: 230,
        }
      ];
    case "staten_island":
      return [
        {
          id: "pickpocket",
          nameEn: "Ferry Terminal Slip-off",
          namePt: "Puxar Carteiras na Balsa de Staten",
          descriptionEn: "Pretend to stumble near sleepy business commuters during the long deck crossing.",
          descriptionPt: "Simular esbarrão em executivos sonolentos voltando do trabalho no deque da balsa.",
          energyCost: 5,
          successRate: 0.90, // Safer harbor commute
          minIntellect: 0,
          rewardCashMin: 20,
          rewardCashMax: 85,
          rewardExp: 4,
          rewardRespect: 10,
        },
        {
          id: "shoplift",
          nameEn: "Loot Harbor Container Yard",
          namePt: "Saquear Caixas do Porto Industrial",
          descriptionEn: "Infiltrate unmonitored harbor docks to steal valuable imported mechanical components.",
          descriptionPt: "Invadir cais remotos à procura de caixas importadas de ferramentas e autopeças caras.",
          energyCost: 12,
          successRate: 0.74,
          minIntellect: 10,
          rewardCashMin: 140,
          rewardCashMax: 500,
          rewardExp: 13,
          rewardRespect: 25,
        },
        {
          id: "car_theft",
          nameEn: "Steal Tugboat Yard Heavy Flatbed",
          namePt: "Furtar Caminhão de Carga Pesada",
          descriptionEn: "Infiltrate shipyard loading zones and steal a high-power diesel flatbed cargo truck.",
          descriptionPt: "Aproveitar descuido no estaleiro naval para dar partida numa picape de reboque blindada.",
          energyCost: 19,
          successRate: 0.56,
          minIntellect: 22,
          rewardCashMin: 850,
          rewardCashMax: 2200,
          rewardExp: 34,
          rewardRespect: 60,
        },
        {
          id: "atm_hack",
          nameEn: "Port Authority System Breach",
          namePt: "Hackear Terminal Aduaneiro de Carga",
          descriptionEn: "Tap harbor fee data logs and deviate automated transit payments directly into secure wallets.",
          descriptionPt: "Utilizar redirecionador USB nas fiações de controle alfandegário e faturar depósitos suspensos.",
          energyCost: 28,
          successRate: 0.46,
          minIntellect: 50,
          rewardCashMin: 2100,
          rewardCashMax: 5400,
          rewardExp: 78,
          rewardRespect: 120,
        },
        {
          id: "jewelry_rub",
          nameEn: "Infiltrate Smuggler Yacht Vault",
          namePt: "Interceptar Iate de Contrabando Naval",
          descriptionEn: "Board an elite pleasure boat loaded with undeclared gold and rare black-market luxury gear.",
          descriptionPt: "Navegar de fininho até um iate ancorado com barras e diamantes não declarados e limpar o cofre.",
          energyCost: 36,
          successRate: 0.36,
          minIntellect: 74,
          rewardCashMin: 6800,
          rewardCashMax: 18000,
          rewardExp: 145,
          rewardRespect: 240,
        }
      ];
    case "suburbio":
      return [
        {
          id: "pickpocket",
          nameEn: "Highway Toll Plaza Trick",
          namePt: "Subtrair Troco de Alças de Rodovia",
          descriptionEn: "Nab loose cash-carrying bags and mail from unattended delivery vans near road exits.",
          descriptionPt: "Puxar malotes de correspondência e moedas soltas de furgões de entrega parados na rodovia.",
          energyCost: 3,
          successRate: 0.93,
          minIntellect: 0,
          rewardCashMin: 12,
          rewardCashMax: 55,
          rewardExp: 3,
          rewardRespect: 8,
        },
        {
          id: "shoplift",
          nameEn: "Rob Feed & Supply Depot",
          namePt: "Assalto ao Celeiro Central de Insumos",
          descriptionEn: "Acquire specialized farm machinery tools and industrial chemicals for dark synthesizers.",
          descriptionPt: "Render o vigia do galpão de insumos e roubar ferramentas de corte e insumos químicos raros.",
          energyCost: 10,
          successRate: 0.78,
          minIntellect: 5,
          rewardCashMin: 85,
          rewardCashMax: 290,
          rewardExp: 10,
          rewardRespect: 18,
        },
        {
          id: "car_theft",
          nameEn: "Boost Off-Road Quad or Tractor",
          namePt: "Furtar Quadriciclo Pro ou Trator",
          descriptionEn: "Steal performance farming vehicles, ATV crafts or expensive flatbeds parked in wood lots.",
          descriptionPt: "Dar partida em quadriciclos de rali ou tratores utilitários deixados sem chaves em sítios.",
          energyCost: 17,
          successRate: 0.62,
          minIntellect: 15,
          rewardCashMin: 450,
          rewardCashMax: 1300,
          rewardExp: 26,
          rewardRespect: 48,
        },
        {
          id: "atm_hack",
          nameEn: "Strip Mall Local ATM Spoof",
          namePt: "Fraudar Caixa de Mercado do Subúrbio",
          descriptionEn: "Hook up an unmonitored local automated teller in an isolated strip mall to dispatch double dollar rolls.",
          descriptionPt: "Hackear o caixa eletrônico do mercadinho local desprotegido usando emulador de pacotes portátil.",
          energyCost: 25,
          successRate: 0.50,
          minIntellect: 35,
          rewardCashMin: 1400,
          rewardCashMax: 3100,
          rewardExp: 65,
          rewardRespect: 98,
        },
        {
          id: "jewelry_rub",
          nameEn: "Loot Clandestine Growhouse Cash Vault",
          namePt: "Assaltar Escritório de Estufa Clandestina",
          descriptionEn: "Raid an isolated rural farmhouse serving as a hidden drug stash point and seize their raw safe box.",
          descriptionPt: "Invadir uma cabana isolada usada por facções de interior e fugir com o baú de arrecadação do local.",
          energyCost: 33,
          successRate: 0.40,
          minIntellect: 55,
          rewardCashMin: 3800,
          rewardCashMax: 9000,
          rewardExp: 115,
          rewardRespect: 190,
        }
      ];
    default: // Brooklyn as standard
      return [
        {
          id: "pickpocket",
          nameEn: "Dumbo Cafeteria Lift",
          namePt: "Bater Carteira em Café de Dumbo",
          descriptionEn: "Fish standard leather wallets from art gallery customers and hipsters drinking expensive coffees.",
          descriptionPt: "Puxar carteiras de couro de hipsters e curadores de arte tomando café perto da ponte.",
          energyCost: 5,
          successRate: 0.85,
          minIntellect: 0,
          rewardCashMin: 20,
          rewardCashMax: 100,
          rewardExp: 5,
          rewardRespect: 10,
        },
        {
          id: "shoplift",
          nameEn: "Rob Williamsburg Vintage Store",
          namePt: "Assaltar Brechó Fino em Williamsburg",
          descriptionEn: "Slip fancy historic apparel and leather designer wear away into prepared bags.",
          descriptionPt: "Furtar jaquetas raras e roupas vintage de estilistas renomeados para revenda.",
          energyCost: 12,
          successRate: 0.70,
          minIntellect: 10,
          rewardCashMin: 120,
          rewardCashMax: 450,
          rewardExp: 15,
          rewardRespect: 25,
        },
        {
          id: "car_theft",
          nameEn: "Steal Eco Smart EV",
          namePt: "Roubar Carro Elétrico Ecológico",
          descriptionEn: "Connect high-density software tools to bypass keyless start in a premium charging station.",
          descriptionPt: "Utilizar cabo emulador para burlar partida eletrônica de utilitário ecológico estacionado.",
          energyCost: 20,
          successRate: 0.55,
          minIntellect: 25,
          rewardCashMin: 600,
          rewardCashMax: 1500,
          rewardExp: 35,
          rewardRespect: 60,
        },
        {
          id: "atm_hack",
          nameEn: "Diner Retro ATM Skimmer",
          namePt: "Hackear Caixa de Lanchonete Retrô",
          descriptionEn: "Connect malware adapters behind older diner cash teller units to deploy double bills.",
          descriptionPt: "Fixar um emulador clandestino na fiação de caixa cinzento de lanchonete retrô.",
          energyCost: 28,
          successRate: 0.45,
          minIntellect: 50,
          rewardCashMin: 1800,
          rewardCashMax: 4200,
          rewardExp: 80,
          rewardRespect: 120,
        },
        {
          id: "jewelry_rub",
          nameEn: "Raid Brooklyn Modern Art Vault",
          namePt: "Roubar Galeria de Arte Contemporânea",
          descriptionEn: "Infiltrate a private exhibition storeroom and cart away valuable modern sculptures.",
          descriptionPt: "Infiltrar galpão de exposição particular e subtrair esculturas de bronze raras e valas.",
          energyCost: 35,
          successRate: 0.35,
          minIntellect: 75,
          rewardCashMin: 4500,
          rewardCashMax: 9500,
          rewardExp: 150,
          rewardRespect: 250,
        }
      ];
  }
}

export const ORGANIZED_HEISTS: OrganizedHeist[] = [
  {
    id: "bank_vault",
    nameEn: "Break into Fort Knox Depot",
    namePt: "Invasão ao Depósito Fort Knox",
    descriptionEn: "Meticulous operation to bypass bank mainframe laser grid and drill into gold vault.",
    descriptionPt: "Operação meticulosa para burlar lasers do mainframe do banco e furar o cofre de barras de ouro.",
    energyCost: 50,
    cooldownSeconds: 180, // 3 minutes
    successRate: 0.30,
    rewardCashMin: 35000,
    rewardCashMax: 90000,
    rewardExp: 600,
    rewardRespect: 1000,
  },
  {
    id: "casino_heist",
    nameEn: "Las Vegas Casino Underworld Heist",
    namePt: "Roubo Subterrâneo ao Cassino Las Vegas",
    descriptionEn: "Subdue vault guards and hijack the casino counting chamber during a championship.",
    descriptionPt: "Render os guardas e interceptar a sala de contagem de dinheiro do cassino durante um campeonato.",
    energyCost: 65,
    cooldownSeconds: 420, // 7 minutes
    successRate: 0.20,
    rewardCashMin: 120000,
    rewardCashMax: 280000,
    rewardExp: 1500,
    rewardRespect: 2500,
  },
  {
    id: "federal_reserve",
    nameEn: "Federal Reserve Train Robbery",
    namePt: "Roubo ao Trem da Reserva Federal",
    descriptionEn: "Sabotage railway signals, extract cash printing plates right before scheduled disposal.",
    descriptionPt: "Sabotar sinais ferroviários e extrair placas de impressão de notas antes do descarte agendado.",
    energyCost: 80,
    cooldownSeconds: 900, // 15 minutes
    successRate: 0.12,
    rewardCashMin: 450000,
    rewardCashMax: 1100000,
    rewardExp: 4000,
    rewardRespect: 6000,
  }
];

export const SHOP_ITEMS: GameItem[] = [
  // Weapons
  {
    id: "brass_knuckles",
    nameEn: "Brass Knuckles",
    namePt: "Soco Inglês",
    descriptionEn: "Simple iron knuckles for back-alley disputes. Boosts combat power.",
    descriptionPt: "Nós de ferro simples para disputas em becos escuros. Aumenta poder de combate.",
    cost: 550,
    type: "weapon",
    bonusStrength: 8,
    minLevel: 1,
  },
  {
    id: "heavy_baton",
    nameEn: "Reinforced Police Baton",
    namePt: "Cassetete Tático Reforçado",
    descriptionEn: "Heavy carbon fiber baton used for riot control. Quick-striking.",
    descriptionPt: "Cassetete pesado de fibra de carbono para controle de tumultos. Ataques rápidos.",
    cost: 2800,
    type: "weapon",
    bonusStrength: 15,
    minLevel: 2,
  },
  {
    id: "revolver",
    nameEn: ".38 Revolver",
    namePt: "Revólver .38",
    descriptionEn: "Reliable classic sidearm. Hard-hitting and cheap to maintain.",
    descriptionPt: "Arma lateral clássica e confiável. Tiro pesado e fácil de esconder.",
    cost: 12500,
    type: "weapon",
    bonusStrength: 35,
    minLevel: 4,
  },
  {
    id: "desert_eagle",
    nameEn: ".50 Golden Desert Eagle",
    namePt: "Desert Eagle .50 de Ouro",
    descriptionEn: "Flashy and extremely lethal pistol with customized engraving. Status and supreme direct fire power.",
    descriptionPt: "Pistola reluzente e extremamente letal com gravuras personalizadas. Puro status e poder de fogo direto.",
    cost: 35000,
    type: "weapon",
    bonusStrength: 70,
    minLevel: 6,
  },
  {
    id: "shotgun",
    nameEn: "Pump Action Shotgun",
    namePt: "Espingarda Calibre 12",
    descriptionEn: "Spreads brutal force at close quarters. Devastating backup.",
    descriptionPt: "Espalha chumbo devastador em ambientes fechados. Suporte letal.",
    cost: 88000,
    type: "weapon",
    bonusStrength: 150,
    minLevel: 9,
  },
  {
    id: "katana",
    nameEn: "Ninja Clan Katana",
    namePt: "Espada Katana Dobrada",
    descriptionEn: "Hand-forged razor steel. Extremely silent and slice-efficient.",
    descriptionPt: "Aço dobrado forjado à mão. Extremamente silenciosa e cortante.",
    cost: 195000,
    type: "weapon",
    bonusStrength: 320,
    minLevel: 12,
  },
  {
    id: "ar15_carbine",
    nameEn: "AR-15 Assault Carbine",
    namePt: "Carabina de Assalto AR-15",
    descriptionEn: "Highly customizable lightweight modular rifle. Exceptional rate of fire and target acquisition.",
    descriptionPt: "Rifle modular leve e altamente customizável. Excelente cadência de tiro e precisão.",
    cost: 410000,
    type: "weapon",
    bonusStrength: 650,
    minLevel: 16,
  },
  {
    id: "ak47",
    nameEn: "Tactical AK-47",
    namePt: "AK-47 Tático",
    descriptionEn: "Soviet classic assault rifle. Absolute dominance on the concrete jungle.",
    descriptionPt: "Rifle de assalto clássico soviético. Domínio total na selva de pedra.",
    cost: 780000,
    type: "weapon",
    bonusStrength: 1200,
    minLevel: 19,
  },
  {
    id: "dual_smgs",
    nameEn: "Dual Micro-UZIs",
    namePt: "Submetralhadoras Micro-UZIs Duplas",
    descriptionEn: "Blazing fast fire rates. Shreds targets in fractions of a second.",
    descriptionPt: "Cadência de tiros insana. Desintegra alvos em frações de segundo.",
    cost: 1550000,
    type: "weapon",
    bonusStrength: 2500,
    minLevel: 22,
  },
  {
    id: "m249_saw",
    nameEn: "M249 SAW Machine Gun",
    namePt: "Metralhadora Leve M249 SAW",
    descriptionEn: "Belt-fed squad automatic weapon. Lays down overwhelming suppression fire for turf wars.",
    descriptionPt: "Arma automática de esquadrão alimentada por fita. Dispara rajadas avassaladoras nas guerras de territórios.",
    cost: 3200000,
    type: "weapon",
    bonusStrength: 5200,
    minLevel: 26,
  },
  {
    id: "rocket_launcher",
    nameEn: "RPG-7 Rocket Launcher",
    namePt: "Lançador de Mísseis RPG-7",
    descriptionEn: "Military-grade heavy explosive launcher. Overkill for street beefs.",
    descriptionPt: "Lançador de explosivo militar pesado. Poder destrutivo absoluto.",
    cost: 6800000,
    type: "weapon",
    bonusStrength: 11000,
    minLevel: 30,
  },
  {
    id: "sniper_rifle",
    nameEn: ".50 Caliber Sniper Rifle",
    namePt: "Rifle Sniper de Precisão .50",
    descriptionEn: "Ultra-range armor piercing rifle. Neutralizes anything across town blocks.",
    descriptionPt: "Rifle de longo alcance perfurador de blindagens. Derruba blindados e alvos à distância.",
    cost: 13500000,
    type: "weapon",
    bonusStrength: 25000,
    minLevel: 34,
  },
  {
    id: "gatling_minigun",
    nameEn: "Microgun Vulcan Gatling",
    namePt: "Metralhadora Rotativa Minigun",
    descriptionEn: "Six-barrel rotary machine gun. Obliterates any rival defense armor in fractions of a second.",
    descriptionPt: "Metralhadora rotativa de seis canos. Pulveriza qualquer defesa rival em frações de segundo.",
    cost: 29000000,
    type: "weapon",
    bonusStrength: 60000,
    minLevel: 39,
  },

  // Vehicles
  {
    id: "cheap_sedan",
    nameEn: "Beater Sedan",
    namePt: "Sedã Velho",
    descriptionEn: "Rusty getaway ride. Keeps you safe from random patrol blocks.",
    descriptionPt: "Lata de lixo enferrujada para fuga. Te esconde de patrulhas aleatórias.",
    cost: 42000,
    type: "vehicle",
    bonusDefense: 15,
    minLevel: 1,
  },
  {
    id: "custom_chopper",
    nameEn: "V-Twin Hardtail Chopper",
    namePt: "Moto Chopper Customizada",
    descriptionEn: "Sleek low rider bike. High speed weaving through city grids.",
    descriptionPt: "Moto estilo chopper de assento baixo. Ideal para costurar pelo trânsito urbano.",
    cost: 14500,
    type: "vehicle",
    bonusDefense: 35,
    minLevel: 3,
  },
  {
    id: "lowrider_hydraulics",
    nameEn: "Hydraulic Impala Lowrider",
    namePt: "Chevrolet Impala Lowrider",
    descriptionEn: "Retro cruiser with active hydraulic hop suspension. Adds styled defense, perfect roll-by cruising.",
    descriptionPt: "Espetacular clássico modificado com suspensão hidráulica pneumática. Estilo puro e ótima armadura de colisão.",
    cost: 32000,
    type: "vehicle",
    bonusDefense: 75,
    minLevel: 5,
  },
  {
    id: "muscle_car",
    nameEn: "Aero Cruiser Muscle",
    namePt: "Muscle Aero Cruiser",
    descriptionEn: "Supercharged V8 engine. Loud, fast, and gives decent defense shield.",
    descriptionPt: "Motor V8 superalimentado. Barulhento, veloz e fornece uma boa defesa.",
    cost: 72000,
    type: "vehicle",
    bonusDefense: 140,
    minLevel: 7,
  },
  {
    id: "armored_pickup",
    nameEn: "Plated 4x4 Heavy Pickup",
    namePt: "Picape Brutal Blindada 4x4",
    descriptionEn: "Steel-grilled monster truck built to ram road spikes and gridlocks.",
    descriptionPt: "Caminhonete gigante com grade de aço para romper bloqueios e engarrafamentos.",
    cost: 150050,
    type: "vehicle",
    bonusDefense: 280,
    minLevel: 10,
  },
  {
    id: "armored_suv",
    nameEn: "Midnight Bulletproof SUV",
    namePt: "SUV Blindado Midnight",
    descriptionEn: "Plated security truck. Absorbs fire like a tank.",
    descriptionPt: "Caminhonete blindada de alta resistência. Absorve disparos como um tanque.",
    cost: 310000,
    type: "vehicle",
    bonusDefense: 550,
    minLevel: 14,
  },
  {
    id: "supercar_f90",
    nameEn: "Twin-Turbo Italian Supercar",
    namePt: "Supercarro Italiano F90",
    descriptionEn: "Screaming Italian hypercar with high carbon plates. Accelerates past police road barriers in a flash.",
    descriptionPt: "Hipercarro italiano estrondoso com fibra de carbono balística. Cruza bloqueios policiais em frações de segundo.",
    cost: 850000,
    type: "vehicle",
    bonusDefense: 1200,
    minLevel: 18,
  },
  {
    id: "heavy_helicopter",
    nameEn: "Underworld Stealth Chopper",
    namePt: "Helicóptero Furtivo",
    descriptionEn: "Fly above the urban grid. Extremely tough build.",
    descriptionPt: "Voe acima das restrições da cidade. Armadura extremamente resistente.",
    cost: 2400000,
    type: "vehicle",
    bonusDefense: 3200,
    minLevel: 22,
  },
  {
    id: "bulletproof_limo",
    nameEn: "Presidential Guard Armored Limo",
    namePt: "Limusine Blindada Presidencial",
    descriptionEn: "Unbreakable executive tank on wheels. Full medical oxygen canisters and lead plating.",
    descriptionPt: "Fortaleza corporativa móvel indestrutível. Blindagem opaca pesada contra projéteis de alto calibre.",
    cost: 5500000,
    type: "vehicle",
    bonusDefense: 6500,
    minLevel: 26,
  },
  {
    id: "armored_apc",
    nameEn: "Heavy Infantry APC Tank",
    namePt: "Blindado de Combate APC",
    descriptionEn: "Eight-wheeled military tank. Virtually indestructible by police forces.",
    descriptionPt: "Blindado de infantaria militar de 8 eixos. Virtualmente indestrutível nas ruas.",
    cost: 11500000,
    type: "vehicle",
    bonusDefense: 15000,
    minLevel: 30,
  },
  {
    id: "stealth_private_jet",
    nameEn: "Stealth Gulfstream Jet",
    namePt: "Jato Furtivo Gulfstream",
    descriptionEn: "Delta-wing blacked out jet. Untrackable by aviation radars, ultimate getaway speed.",
    descriptionPt: "Jato executivo preto fosco com tecnologia anti-radar. O ápice supremo de evasão corporativa.",
    cost: 38000000,
    type: "vehicle",
    bonusDefense: 45000,
    minLevel: 36,
  },

  // Real Estate (Income)
  {
    id: "safehouse",
    nameEn: "Brooklyn Safehouse",
    namePt: "Esconderijo no Brooklyn",
    descriptionEn: "Small apartment in the back-alleys. Holds small contraband.",
    descriptionPt: "Pequeno apartamento em beco sem saída. Armazena contrabando e gera fundos.",
    cost: 18500, // Keep it close to original
    type: "realestate",
    passiveIncome: 250, // per game hour/tick
    minLevel: 2,
    emoji: "🏠",
  },
  {
    id: "weed_greenhouse",
    nameEn: "Subterranean Cannabis Farm",
    namePt: "Estufa de Cultivo Subterrânea",
    descriptionEn: "Hydroponic lab concealed beneath an abandoned laundry service.",
    descriptionPt: "Laboratório hidropônico oculto sob uma lavanderia abandonada.",
    cost: 145000,
    type: "realestate",
    passiveIncome: 1800,
    minLevel: 6,
    emoji: "🌿",
  },
  {
    id: "underground_casino",
    nameEn: "Underground High Stakes Casino",
    namePt: "Cassino Clandestino de Alto Risco",
    descriptionEn: "Illegal gambling den filled with corrupt politicians and dirty cash.",
    descriptionPt: "Covil ilegal de apostas frequentado por políticos corruptos e dinheiro sujo.",
    cost: 750000,
    type: "realestate",
    passiveIncome: 8200,
    minLevel: 13,
    emoji: "🎰",
  },
  {
    id: "commercial_port",
    nameEn: "Smuggling Boat Docks",
    namePt: "Porto de Carga de Contrabando",
    descriptionEn: "Control a pier to import and distribute unchecked container shipments.",
    descriptionPt: "Controle as docas para importar e distribuir contêineres sem fiscalização.",
    cost: 4800000,
    type: "realestate",
    passiveIncome: 45000,
    minLevel: 21,
    emoji: "🚢",
  }
];

export const OPPONENTS: Opponent[] = [
  {
    id: "npc_thug",
    name: "Tony 'Two-Times'",
    avatar: "🕵️‍♂️",
    level: 2,
    strength: 15,
    defense: 10,
    health: 120,
    respect: 30,
    cashRewardMin: 80,
    cashRewardMax: 200,
    difficulty: "easy",
    energyCost: 10
  },
  {
    id: "npc_enforcer",
    name: "Guido 'The Sledge'",
    avatar: "🧌",
    level: 8,
    strength: 45,
    defense: 35,
    health: 220,
    respect: 120,
    cashRewardMin: 400,
    cashRewardMax: 900,
    difficulty: "normal",
    energyCost: 15
  },
  {
    id: "npc_capo",
    name: "Don Falcone's Heir",
    avatar: "🕴️",
    level: 16,
    strength: 110,
    defense: 100,
    health: 480,
    respect: 450,
    cashRewardMin: 2200,
    cashRewardMax: 5000,
    difficulty: "hard",
    energyCost: 20
  },
  {
    id: "npc_don",
    name: "The Godfather Salvatore",
    avatar: "👑",
    level: 30,
    strength: 450,
    defense: 400,
    health: 1200,
    respect: 2000,
    cashRewardMin: 18000,
    cashRewardMax: 45000,
    difficulty: "boss",
    energyCost: 25
  }
];

export interface VIPCompanion {
  id: string;
  nameEn: string;
  namePt: string;
  avatar: string;
  cost: number;
  minLevel: number;
  healthBonus: number; // e.g. 35 for 35%
  energyBonus: number; // e.g. 50 for 50%
  descriptionEn: string;
  descriptionPt: string;
}

export const VIP_COMPANIONS: VIPCompanion[] = [
  {
    id: "melanie_escort",
    nameEn: "Melanie (High-Roller Hostess)",
    namePt: "Melanie (Recepcionista VIP)",
    avatar: "💄",
    cost: 4500,
    minLevel: 2,
    healthBonus: 30,
    energyBonus: 30,
    descriptionEn: "Charismatic lounge hostess. Provides delightful company, soothing fatigue and restoring basic health.",
    descriptionPt: "Recepcionista muito simpática e atenciosa. Acalma os nervos, zera o estsaço das ruas e recupera vida inicial."
  },
  {
    id: "gabriela_bunny",
    nameEn: "Gabriela (Casino VIP Bunny)",
    namePt: "Gabriela (Coelhinha do Cassino)",
    avatar: "🐰",
    cost: 18500,
    minLevel: 5,
    healthBonus: 50,
    energyBonus: 50,
    descriptionEn: "Elite cocktail club entertainer. Her exclusive service delivers outstanding comfort and high metabolic recovery.",
    descriptionPt: "Modelo e animadora oficial de camarotes. Trata você como rei, restabelecendo metade de todas as suas forças."
  },
  {
    id: "sasha_courtesan",
    nameEn: "Sasha (Syndicate Courtesan)",
    namePt: "Sasha (Acompanhante de Luxo)",
    avatar: "💃",
    cost: 95000,
    minLevel: 12,
    healthBonus: 80,
    energyBonus: 80,
    descriptionEn: "Highly connected international escort. Offers advanced botanical treatments and deep muscle therapy.",
    descriptionPt: "Acompanhante de elite altamente influente. Oferece massagem tântrica e terapias que recarregam quase toda a vida."
  },
  {
    id: "natasha_duchess",
    nameEn: "Natasha (The Duchess of Underworld)",
    namePt: "Natasha (Duquesa Imperial)",
    avatar: "👑",
    cost: 350000,
    minLevel: 20,
    healthBonus: 100,
    energyBonus: 100,
    descriptionEn: "The supreme queen of elite private suites. Grants absolute revitalization and full physical and mental reset.",
    descriptionPt: "A rainha absoluta dos camarins privados de Manhattan. Dá um banho de reabilitação supremo e energia vital transbordante."
  }
];

export function getLevelTitle(lvl: number, lang: "en" | "pt"): string {
  if (lang === "en") {
    if (lvl <= 1) return "Street Urchin";
    if (lvl === 2) return "Lookout Scout";
    if (lvl === 3) return "Slick Runner";
    if (lvl === 4) return "Pocket Picker";
    if (lvl === 5) return "Skid Row Associate";
    if (lvl === 6) return "Smuggler Apprentice";
    if (lvl === 7) return "Docks Hijacker";
    if (lvl === 8) return "Extortion Collector";
    if (lvl === 9) return "Backalley Enforcer";
    if (lvl === 10) return "Heist Specialist";
    if (lvl === 11) return "Loan Shark Deputy";
    if (lvl === 12) return "Street Crew Leader";
    if (lvl === 13) return "Underworld Cleaner";
    if (lvl === 14) return "Black Market Dealer";
    if (lvl === 15) return "Whiskey Bootlegger";
    if (lvl === 16) return "District Boss";
    if (lvl === 17) return "Made Man (Initiated)";
    if (lvl === 18) return "Trusted Hitman";
    if (lvl === 19) return "Money Launderer";
    if (lvl === 20) return "Underboss Deputy";
    if (lvl === 21) return "Caporegime";
    if (lvl === 22) return "Consigliere Elder";
    if (lvl === 23) return "Underboss of Brooklyn";
    if (lvl === 24) return "Vice Overlord";
    if (lvl === 25) return "Metropolitan Don";
    if (lvl === 26) return "Family Patriarch";
    if (lvl === 27) return "Underworld Mogul";
    if (lvl === 28) return "Executive Boss";
    if (lvl === 29) return "Empirical Capo";
    return "The Godfather / Capo di Tutti Capi";
  } else {
    if (lvl <= 1) return "Pivete de Rua";
    if (lvl === 2) return "Olheiro de Esquina";
    if (lvl === 3) return "Estafeta Ligeiro";
    if (lvl === 4) return "Batedor de Carteira";
    if (lvl === 5) return "Associado de Beco";
    if (lvl === 6) return "Aprendiz de Contrabando";
    if (lvl === 7) return "Saqueador de Cargas";
    if (lvl === 8) return "Cobrador de Juros";
    if (lvl === 9) return "Capanga de Aluguel";
    if (lvl === 10) return "Especialista em Assaltos";
    if (lvl === 11) return "Sub-Agiota de Distrito";
    if (lvl === 12) return "Chefe de Quadrilha";
    if (lvl === 13) return "Limpador de Evidências";
    if (lvl === 14) return "Negociante Negro";
    if (lvl === 15) return "Contrabandista de Elite";
    if (lvl === 16) return "Chefete de Distrito";
    if (lvl === 17) return "Membro Iniciado (Made Man)";
    if (lvl === 18) return "Sicário de Confiança";
    if (lvl === 19) return "Lavador de Capitais";
    if (lvl === 20) return "Subchefe Interino (Deputy)";
    if (lvl === 21) return "Caporegime da Família";
    if (lvl === 22) return "Conselheiro Consular";
    if (lvl === 23) return "Subchefe de Brooklyn";
    if (lvl === 24) return "Vice-Soberano do Crime";
    if (lvl === 25) return "Don Metropolitano";
    if (lvl === 26) return "Patriarca da Família";
    if (lvl === 27) return "Magnata do Submundo";
    if (lvl === 28) return "Diretor-Geral da Máfia";
    if (lvl === 29) return "Capo Imperial Supremo";
    return "O Poderoso Chefão / Capo di Tutti Capi";
  }
}

export interface PetItem {
  id: string;
  nameEn: string;
  namePt: string;
  descriptionEn: string;
  descriptionPt: string;
  avatar: string; // Emoji
  baseCost: number;
  bonusType: "defense" | "crime_success";
  baseBonusPercent: number; // base percentage bonus e.g. 4 for 4%
  bonusPerLevelPercent: number; // bonus increase per level, e.g. 1.5 for 1.5%
  maxLevel: number;
  minLevel?: number; // Minimum level required to buy
}

export const PETS: PetItem[] = [
  {
    id: "street_ferret",
    nameEn: "Urban Street Ferret",
    namePt: "Furão de Sarjeta",
    descriptionEn: "Highly nimble and stealthy. Can distract guards, swipe keys, or squeeze into lockboxes.",
    descriptionPt: "Extremamente ágil e silencioso. Distrai vigias, surrupia chaves de acesso e entra em dutos estreitos.",
    avatar: "🦦",
    baseCost: 12500,
    bonusType: "crime_success",
    baseBonusPercent: 2,
    bonusPerLevelPercent: 1.0,
    maxLevel: 10,
    minLevel: 1
  },
  {
    id: "bulldog_bruiser",
    nameEn: "Bulldog Bruiser",
    namePt: "Buldogue de Combate",
    descriptionEn: "Low center of gravity, heavy bite, and built like a fire hydrant. Intimidates rival street crews.",
    descriptionPt: "Centro de gravidade baixo, mordida implacável e forte como uma viga de aço. Intimida capangas rivais.",
    avatar: "🐽",
    baseCost: 34000,
    bonusType: "defense",
    baseBonusPercent: 4,
    bonusPerLevelPercent: 1.5,
    maxLevel: 10,
    minLevel: 4
  },
  {
    id: "trained_falcon",
    nameEn: "Shadow Scout Falcon",
    namePt: "Falcão de Varredura Sombra",
    descriptionEn: "Flies overhead to map police vectors in real-time. Unlocks deep street blindspots.",
    descriptionPt: "Sobrevoa a vizinhança mapeando barreiras policiais em tempo real. Melhora sucesso em golpes.",
    avatar: "🦅",
    baseCost: 65000,
    bonusType: "crime_success",
    baseBonusPercent: 5,
    bonusPerLevelPercent: 1.5,
    maxLevel: 10,
    minLevel: 7
  },
  {
    id: "trained_doberman",
    nameEn: "Trained Doberman",
    namePt: "Doberman Amestrado",
    descriptionEn: "Guards your escape path perfectly. Elite reflexes and razor-sharp intellect.",
    descriptionPt: "Garante cobertura total para suas rotas de fuga. Reflexos de elite e inteligência tática afiada.",
    avatar: "🐕",
    baseCost: 185000,
    bonusType: "crime_success",
    baseBonusPercent: 4,
    bonusPerLevelPercent: 1.5,
    maxLevel: 10,
    minLevel: 9
  },
  {
    id: "trained_chimpanzee",
    nameEn: "Tactical Robbery Chimpanzee",
    namePt: "Chimpanzé de Assalto Tático",
    descriptionEn: "Exceedingly smart primate trained in lock-picking, tool usage, and safe cracking distraction.",
    descriptionPt: "Primata gênio treinado em ligação direta, arrombamento de cofres e sabotagem ativa.",
    avatar: "🐒",
    baseCost: 120000,
    bonusType: "crime_success",
    baseBonusPercent: 6,
    bonusPerLevelPercent: 2.0,
    maxLevel: 10,
    minLevel: 11
  },
  {
    id: "guard_pitbull",
    nameEn: "Apex Guard Pitbull",
    namePt: "Pitbull Alfa",
    descriptionEn: "The absolute pinnacle of personal defense. Lethal force when under pressure.",
    descriptionPt: "O ápice absoluto da segurança urbana pessoal. Força letal acionada ao menor sinal de emboscada.",
    avatar: "🐶",
    baseCost: 320000,
    bonusType: "defense",
    baseBonusPercent: 6,
    bonusPerLevelPercent: 2.0,
    maxLevel: 10,
    minLevel: 15
  },
  {
    id: "cyber_panther",
    nameEn: "Cybernetic Onyx Panther",
    namePt: "Pantera Negra Biônica",
    descriptionEn: "Liquid-carbon sleek biomechanical panther designed for silent stalking and security. Absorbs heavy impact.",
    descriptionPt: "Pantera negra modificada de titânio fosco. Agilidade incrível, sensor de proximidade e absorção de choques.",
    avatar: "🐈‍⬛",
    baseCost: 850000,
    bonusType: "defense",
    baseBonusPercent: 9,
    bonusPerLevelPercent: 2.8,
    maxLevel: 10,
    minLevel: 20
  },
  {
    id: "cyber_tiger",
    nameEn: "Neo Cybernetic Tiger",
    namePt: "Tigre Siberiano Elite",
    descriptionEn: "Biomechanical enhance feline. Unrivaled speed, thermal targeting, jaw crushing power.",
    descriptionPt: "Felino com micro-modificações neurais. Velocidade inigualável, mira térmica e mordida esmagadora.",
    avatar: "🐅",
    baseCost: 1950000,
    bonusType: "defense",
    baseBonusPercent: 10,
    bonusPerLevelPercent: 3.0,
    maxLevel: 10,
    minLevel: 22
  },
  {
    id: "crimson_dragon",
    nameEn: "Geno Crimson Komodo Dragon",
    namePt: "Dragão de Komodo Mutante",
    descriptionEn: "Genetically augmented crimson lizard with bullet-repelling scales and highly toxic intimidating presence.",
    descriptionPt: "Réptil mutante modificado geneticamente com escamas blindadas resistentes a disparos e presença aterrorizante.",
    avatar: "🦎",
    baseCost: 4500000,
    bonusType: "defense",
    baseBonusPercent: 14,
    bonusPerLevelPercent: 4.0,
    maxLevel: 10,
    minLevel: 27
  }
];

export function getActivePetBonus(player: PlayerState): { type: "defense" | "crime_success" | null; value: number } {
  if (!player.activePet || !player.pets || !player.pets[player.activePet]) {
    return { type: null, value: 0 };
  }
  const petRecord = player.pets[player.activePet];
  const petDef = PETS.find(p => p.id === petRecord.id);
  if (!petDef) return { type: null, value: 0 };
  
  const pct = petDef.baseBonusPercent + (petRecord.level - 1) * petDef.bonusPerLevelPercent;
  return { type: petDef.bonusType, value: pct / 100 };
}

export interface DynamicCostResult {
  cost: number;
  minLevel: number;
  markupPercent: number;
  factorBreakdown: { volatility: number; heat: number; reputation: number };
}

export function getDynamicItemProps(item: GameItem, player: PlayerState): DynamicCostResult {
  const baseCost = item.cost;
  const baseLvl = item.minLevel || 1;

  // 1. Smuggling Volatility (fluctuates based on total committed crimes)
  // Fluctuates dynamically by +-15%
  const crimeSeed = player.crimesCommitted || 0;
  const volatility = Math.sin(crimeSeed * 0.48) * 0.15;

  // 2. High-heat smuggler risk premium (only weapons & vehicles)
  const isContraband = item.type === "weapon" || item.type === "vehicle";
  const heatFactor = (isContraband && player.heat) ? (player.heat / 100) * 0.35 : 0; // up to +35%

  // 3. Underworld Broker fee (increases with status/level)
  // Up to +25%
  const reputation = Math.min((player.level - 1) * 0.012, 0.25);

  const totalMultiplier = 1.0 + volatility + heatFactor + reputation;
  const finalCost = Math.max(Math.round(baseCost * totalMultiplier), Math.round(baseCost * 0.5));

  return {
    cost: finalCost,
    minLevel: baseLvl,
    markupPercent: Math.round((totalMultiplier - 1.0) * 100),
    factorBreakdown: {
      volatility: Math.round(volatility * 100),
      heat: Math.round(heatFactor * 100),
      reputation: Math.round(reputation * 100)
    }
  };
}

export function getDynamicPetProps(pet: PetItem, player: PlayerState): {
  cost: number;
  minLevel: number;
  markupPercent: number;
} {
  const baseCost = pet.baseCost;
  const baseLvl = pet.minLevel || 1;
  const crimeSeed = player.crimesCommitted || 0;
  
  // Companions demand more based on player's level and general crime frequency
  const volatility = Math.cos(crimeSeed * 0.35) * 0.12;
  const reputation = Math.min((player.level - 1) * 0.015, 0.20);
  
  const multiplier = 1.0 + volatility + reputation;
  const finalCost = Math.max(Math.round(baseCost * multiplier), Math.round(baseCost * 0.6));

  return {
    cost: finalCost,
    minLevel: baseLvl,
    markupPercent: Math.round((multiplier - 1.0) * 100)
  };
}

export function getDynamicVIPProps(comp: VIPCompanion, player: PlayerState): {
  cost: number;
  minLevel: number;
  markupPercent: number;
} {
  const baseCost = comp.cost;
  const baseLvl = comp.minLevel || 1;
  const crimeSeed = player.crimesCommitted || 0;
  
  // Luxury VIP lounge prices escalate heavily based on player status (level)
  const reputation = Math.min((player.level - 1) * 0.035, 0.40); // up to +40% elite service charge
  const volatility = Math.sin(crimeSeed * 0.72) * 0.08; // fluctuation
  
  const multiplier = 1.0 + reputation + volatility;
  const finalCost = Math.round(baseCost * multiplier);

  return {
    cost: finalCost,
    minLevel: baseLvl,
    markupPercent: Math.round((multiplier - 1.0) * 100)
  };
}

export interface GangsterSkill {
  id: string;
  nameEn: string;
  namePt: string;
  descEn: string;
  descPt: string;
  maxLevel: number;
  effectEn: string;
  effectPt: string;
  emoji: string;
}

export const GANGSTER_SKILLS: GangsterSkill[] = [
  {
    id: "iron_fist",
    nameEn: "Iron Fist",
    namePt: "Punho de Ferro",
    descEn: "Hardens your hand-to-hand and weapon combat. Increases overall attack rating.",
    descPt: "Rigidez absoluta no combate físico e armado. Aumenta o seu poder de ataque geral.",
    maxLevel: 5,
    effectEn: "+10% Weapon Attack bonus per level",
    effectPt: "+10% de bônus de Ataque de Arma por nível",
    emoji: "✊"
  },
  {
    id: "kevlar_armor",
    nameEn: "Kevlar Plating",
    namePt: "Placas de Kevlar",
    descEn: "Reinforces your escape vehicle protection shielding. Increases total defense rating.",
    descPt: "Reforço na blindagem de carros de fuga. Aumenta a sua taxa de defesa total.",
    maxLevel: 5,
    effectEn: "+10% Vehicle Defense bonus per level",
    effectPt: "+10% de bônus de Defesa de Veículo por nível",
    emoji: "🛡️"
  },
  {
    id: "syndicate_brain",
    nameEn: "Syndicate Brain",
    namePt: "Mente Sindicato",
    descEn: "Improves your tactical intelligence. Increases intellect stat and crime success rate.",
    descPt: "Otimização de rotas e frieza tática. Eleva o intelecto e taxa de sucesso de crimes.",
    maxLevel: 5,
    effectEn: "+8% Crime success rate per level",
    effectPt: "+8% de chance de sucesso em crimes por nível",
    emoji: "🧠"
  },
  {
    id: "lucky_bastard",
    nameEn: "Lucky Bastard",
    namePt: "Sortudo de Respeito",
    descEn: "Increases your willpower and luck. Reduces energy costs for training and fights.",
    descPt: "Eleva sua sorte natural e força de vontade. Reduz fadiga de treinos e lutas.",
    maxLevel: 5,
    effectEn: "-5% Energy cost for training/ring matches per level",
    effectPt: "-5% de custo de Energia em treinos/ringue por nível",
    emoji: "🍀"
  },
  {
    id: "money_launderer",
    nameEn: "Money Launderer",
    namePt: "Lavador de Notas",
    descEn: "Cleans dirty hotel payouts and extortion revenues more efficiently.",
    descPt: "Lava notas frias e extorque pequenos quarteirões com maior eficiência de royalties.",
    maxLevel: 5,
    effectEn: "+15% Passive income and active building activities payouts per level",
    effectPt: "+15% de faturamento passivo e ações de edifícios por nível",
    emoji: "💵"
  },
  {
    id: "street_overlord",
    nameEn: "Street Overlord",
    namePt: "Soberano do Asfalto",
    descEn: "Lowers your active wanted level and wanted heat rate decay passively.",
    descPt: "Controla a poeira baixa e vigília do BOPE. Acelera decaimento de nível de procurado.",
    maxLevel: 5,
    effectEn: "+20% Faster wanted level heat decay per level",
    effectPt: "+20% de decaimento mais rápido de nível de procurado por nível",
    emoji: "👑"
  }
];

export function generateDailyMissions(): PlayerState["dailyMissions"] {
  return [
    {
      id: "crime_1",
      titleEn: "Commit 5 Street Crimes",
      titlePt: "Cometer 5 Crimes de Rua",
      target: 5,
      current: 0,
      rewardType: "cash",
      rewardValue: 2500,
      completed: false,
      claimed: false,
    },
    {
      id: "heist_1",
      titleEn: "Execute 2 Organized Heists",
      titlePt: "Executar 2 Grandes Assaltos",
      target: 2,
      current: 0,
      rewardType: "connections",
      rewardValue: 10,
      completed: false,
      claimed: false,
    },
    {
      id: "combat_1",
      titleEn: "Win 3 Ring Sparring Matches",
      titlePt: "Vencer 3 Lutas no Ringue",
      target: 3,
      current: 0,
      rewardType: "ammo",
      rewardValue: 150,
      completed: false,
      claimed: false,
    },
    {
      id: "bribe_1",
      titleEn: "Pay $5,000 in Police Bribes",
      titlePt: "Pagar $5.000 em Propinas Policiais",
      target: 5000,
      current: 0,
      rewardType: "item",
      rewardValue: 1,
      rewardItem: "bulletproof_vest",
      completed: false,
      claimed: false,
    }
  ];
}

export function incrementDailyMission(prev: PlayerState, id: string, amount: number): PlayerState {
  if (!prev.dailyMissions) {
    prev.dailyMissions = generateDailyMissions();
  }
  const dailyMissions = prev.dailyMissions.map((m) => {
    if (m.id === id && !m.claimed) {
      const nextCurrent = Math.min(m.current + amount, m.target);
      const isCompleted = nextCurrent >= m.target;
      return {
        ...m,
        current: nextCurrent,
        completed: isCompleted
      };
    }
    return m;
  });
  return { ...prev, dailyMissions };
}

