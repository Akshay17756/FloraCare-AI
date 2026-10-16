export type HealthStatus = 'healthy' | 'stressed' | 'diseased' | 'pest_infested';
export type LightLevel = 'low' | 'medium' | 'bright_indirect' | 'direct_sun';
export type PropagationDifficulty = 'easy' | 'moderate' | 'difficult';

export interface CareInstructions {
  light: {
    summary: string;
    hours: string;
    direct: boolean;
    level: LightLevel;
  };
  watering: {
    summary: string;
    frequencyDays: number;
    dryThreshold: string;
    seasonalTips: string;
  };
  soil: {
    type: string;
    phRange: string;
    drainage: string;
    repottingCadenceMonths: number;
  };
  temperature: {
    idealMinC: number;
    idealMaxC: number;
    minToleranceC: number;
    humidityLevel: string;
  };
  fertilizer: {
    type: string;
    schedule: string;
    activeSeasonOnly: boolean;
  };
  toxicity: {
    toxicToDogs: boolean;
    toxicToCats: boolean;
    toxicToHumans: boolean;
    details: string;
  };
  propagation: {
    methods: string[];
    bestSeason: string;
    difficulty: PropagationDifficulty;
  };
}

export interface PlantIssue {
  issue: string;
  severity: 'low' | 'moderate' | 'high';
  cause: string;
  actionPlan: string[];
}

export interface PlantIdentification {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  confidence: number;
  healthStatus: HealthStatus;
  healthSummary: string;
  characteristics: string;
  nativeRegion: string;
  careInstructions: CareInstructions;
  detectedIssues: PlantIssue[];
  quickTips: string[];
  imageUrl?: string;
  timestamp: number;
}

export interface GardenPlant {
  id: string;
  commonName: string;
  scientificName: string;
  nickname?: string;
  location: 'indoor' | 'balcony' | 'outdoor' | 'greenhouse';
  imageUrl?: string;
  careInstructions: CareInstructions;
  healthStatus: HealthStatus;
  addedAt: number;
  lastWateredAt: number;
  lastFertilizedAt?: number;
  notes?: string;
}

export type ChatRoleId = 'botanist' | 'care_guide' | 'quick_tips';

export interface ChatRoleConfig {
  id: ChatRoleId;
  name: string;
  title: string;
  model: string;
  description: string;
  tagline: string;
  systemInstruction: string;
  sampleQuestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  roleId?: ChatRoleId;
  plantContextName?: string;
}

export interface WeatherProfile {
  id: string;
  label: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  tempC: number;
  humidityPercent: number;
  weatherCondition: 'sunny' | 'heatwave' | 'rainy' | 'moderate' | 'dry' | 'cold';
  description: string;
}

export type AutomationType =
  | 'weather_adaptive'
  | 'auto_water'
  | 'auto_fertilize'
  | 'quarantine_alert'
  | 'soil_moisture_estimate';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: AutomationType;
  triggerThreshold?: string;
  actionsCount: number;
  lastTriggeredAt?: number;
}

export interface AutomationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  plantId: string;
  plantName: string;
  actionTaken: string;
  timestamp: number;
  status: 'applied' | 'skipped' | 'alert';
}

export interface RecommendedRoutineAction {
  plantId: string;
  plantName: string;
  action: 'water' | 'fertilize' | 'inspect' | 'quarantine' | 'relocate' | 'mist';
  reason: string;
  priority: 'urgent' | 'today' | 'upcoming';
}

export interface GardenSweepResult {
  summary: string;
  urgentCount: number;
  recommendedActions: RecommendedRoutineAction[];
  weatherImpactAdvice: string;
  overallVitalityQuote: string;
  timestamp: number;
}

