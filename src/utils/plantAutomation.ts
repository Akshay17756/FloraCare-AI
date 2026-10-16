import type {
  GardenPlant,
  PlantIdentification,
  WeatherProfile,
  AutomationRule,
  AutomationLog,
  CareInstructions,
} from '../types/gardening.ts';
import { getWateringStatus } from './plantCareCalc.ts';

export const DEFAULT_WEATHER_PROFILES: WeatherProfile[] = [
  {
    id: 'spring_mild',
    label: 'Spring Mild Growth',
    season: 'spring',
    tempC: 21,
    humidityPercent: 55,
    weatherCondition: 'moderate',
    description: 'Optimal ambient temperature, moderate humidity, active vegetative growth window.',
  },
  {
    id: 'summer_heatwave',
    label: 'Summer Heatwave',
    season: 'summer',
    tempC: 32,
    humidityPercent: 35,
    weatherCondition: 'heatwave',
    description: 'High heat and dry air accelerate soil evaporation by ~35%. Plants need rapid hydration.',
  },
  {
    id: 'rainy_monsoon',
    label: 'Humid Rainy Period',
    season: 'summer',
    tempC: 24,
    humidityPercent: 85,
    weatherCondition: 'rainy',
    description: 'High ambient humidity slows transpiration. Outdoor pots stay wet significantly longer.',
  },
  {
    id: 'autumn_cool',
    label: 'Autumn Cool Down',
    season: 'autumn',
    tempC: 17,
    humidityPercent: 50,
    weatherCondition: 'moderate',
    description: 'Gentle cooling and reduced photoperiod; growth slows down naturally.',
  },
  {
    id: 'winter_dormancy',
    label: 'Winter Dormancy',
    season: 'winter',
    tempC: 12,
    humidityPercent: 40,
    weatherCondition: 'cold',
    description: 'Reduced metabolic activity. Indoor heating may dry foliage while soil stays cold.',
  },
];

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule-weather-adaptive',
    name: 'Weather-Adaptive Hydration',
    description:
      'Dynamically recalibrates watering frequencies based on temperature and ambient humidity spikes.',
    enabled: true,
    type: 'weather_adaptive',
    actionsCount: 8,
    lastTriggeredAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'rule-auto-water-overdue',
    name: 'Automated Smart Irrigation Assistant',
    description:
      'Automatically logs hydration maintenance for specimens when they reach critical moisture deficits.',
    enabled: false,
    type: 'auto_water',
    triggerThreshold: 'Overdue by >= 1 day',
    actionsCount: 5,
    lastTriggeredAt: Date.now() - 3600000 * 24,
  },
  {
    id: 'rule-health-quarantine',
    name: 'Botanical Quarantine Protector',
    description:
      'Automatically isolates plants detected as diseased or pest-infested to greenhouse/isolation and schedules clinic triage.',
    enabled: true,
    type: 'quarantine_alert',
    actionsCount: 2,
    lastTriggeredAt: Date.now() - 3600000 * 48,
  },
  {
    id: 'rule-seasonal-feeding',
    name: 'Seasonal Nutrition Governor',
    description:
      'Freezes fertilization reminders during cold winter dormancy and auto-resumes bi-weekly feeding in spring.',
    enabled: true,
    type: 'auto_fertilize',
    actionsCount: 12,
    lastTriggeredAt: Date.now() - 3600000 * 12,
  },
];

/**
 * Calculates a dynamic multiplier for watering frequency based on microclimate/weather.
 * Value < 1.0 means plants dry faster and need more frequent water (shorter interval).
 * Value > 1.0 means plants dry slower and need less frequent water (longer interval).
 */
export function getWeatherWateringMultiplier(weather: WeatherProfile): number {
  let multiplier = 1.0;

  // Temperature adjustment
  if (weather.tempC >= 30) {
    multiplier *= 0.75; // 25% faster drying in high heat
  } else if (weather.tempC >= 25) {
    multiplier *= 0.88;
  } else if (weather.tempC <= 14) {
    multiplier *= 1.35; // 35% slower drying in cold
  } else if (weather.tempC <= 18) {
    multiplier *= 1.15;
  }

  // Humidity adjustment
  if (weather.humidityPercent >= 75) {
    multiplier *= 1.25; // Slower evaporation in humid air
  } else if (weather.humidityPercent <= 35) {
    multiplier *= 0.85; // Faster evaporation in dry air
  }

  // Weather conditions override
  if (weather.weatherCondition === 'rainy') {
    multiplier *= 1.2;
  } else if (weather.weatherCondition === 'heatwave') {
    multiplier *= 0.85;
  } else if (weather.weatherCondition === 'cold') {
    multiplier *= 1.25;
  }

  // Clamp within reasonable biological bounds
  return Math.max(0.5, Math.min(2.0, Number(multiplier.toFixed(2))));
}

/**
 * Evaluates active automation rules against the user's garden and microclimate profile.
 */
export function evaluateAutomationRules(
  plants: GardenPlant[],
  rules: AutomationRule[],
  weather: WeatherProfile,
  nowMs: number = Date.now()
): {
  updatedPlants: GardenPlant[];
  logs: AutomationLog[];
  appliedRuleIds: string[];
} {
  let currentPlants = [...plants];
  const logs: AutomationLog[] = [];
  const appliedRuleIds: string[] = [];

  const weatherRule = rules.find((r) => r.id === 'rule-weather-adaptive' && r.enabled);
  const autoWaterRule = rules.find((r) => r.id === 'rule-auto-water-overdue' && r.enabled);
  const quarantineRule = rules.find((r) => r.id === 'rule-health-quarantine' && r.enabled);
  const seasonalFeedRule = rules.find((r) => r.id === 'rule-seasonal-feeding' && r.enabled);

  // 1. Weather Adaptive Multiplier check
  if (weatherRule) {
    const mult = getWeatherWateringMultiplier(weather);
    if (mult !== 1.0) {
      appliedRuleIds.push(weatherRule.id);
      logs.push({
        id: `log-${nowMs}-${Math.random().toString(36).substring(2, 6)}`,
        ruleId: weatherRule.id,
        ruleName: weatherRule.name,
        plantId: 'all',
        plantName: 'All Garden Plants',
        actionTaken: `Recalibrated watering intervals by ${Math.round((1 / mult - 1) * 100)}% based on ${weather.label} (${weather.tempC}°C, ${weather.humidityPercent}% humidity)`,
        timestamp: nowMs,
        status: 'applied',
      });
    }
  }

  // 2. Quarantine Protector
  if (quarantineRule) {
    currentPlants = currentPlants.map((plant) => {
      if ((plant.healthStatus === 'diseased' || plant.healthStatus === 'pest_infested') && plant.location !== 'greenhouse') {
        appliedRuleIds.push(quarantineRule.id);
        logs.push({
          id: `log-${nowMs}-${plant.id}`,
          ruleId: quarantineRule.id,
          ruleName: quarantineRule.name,
          plantId: plant.id,
          plantName: plant.nickname || plant.commonName,
          actionTaken: `Automated isolation: Moved ${plant.nickname || plant.commonName} to greenhouse quarantine to prevent spore spread.`,
          timestamp: nowMs,
          status: 'alert',
        });
        return {
          ...plant,
          location: 'greenhouse',
          notes: `${plant.notes ? plant.notes + ' | ' : ''}Auto-quarantined on ${new Date(nowMs).toLocaleDateString()}`,
        };
      }
      return plant;
    });
  }

  // 3. Auto-Water Overdue Plants
  if (autoWaterRule) {
    currentPlants = currentPlants.map((plant) => {
      const waterStatus = getWateringStatus(plant.lastWateredAt, plant.careInstructions.watering.frequencyDays, nowMs);
      if (waterStatus.status === 'overdue' && Math.abs(waterStatus.daysRemaining) >= 1) {
        appliedRuleIds.push(autoWaterRule.id);
        logs.push({
          id: `log-${nowMs}-water-${plant.id}`,
          ruleId: autoWaterRule.id,
          ruleName: autoWaterRule.name,
          plantId: plant.id,
          plantName: plant.nickname || plant.commonName,
          actionTaken: `Auto-hydrated ${plant.nickname || plant.commonName} (${waterStatus.label}). Reset hydration tracker.`,
          timestamp: nowMs,
          status: 'applied',
        });
        return {
          ...plant,
          lastWateredAt: nowMs,
        };
      }
      return plant;
    });
  }

  // 4. Seasonal Nutrition Governor
  if (seasonalFeedRule && weather.season === 'winter') {
    appliedRuleIds.push(seasonalFeedRule.id);
    logs.push({
      id: `log-${nowMs}-winter-feed`,
      ruleId: seasonalFeedRule.id,
      ruleName: seasonalFeedRule.name,
      plantId: 'all',
      plantName: 'Garden Collection',
      actionTaken: 'Winter Dormancy Protection active: Paused non-essential fertilizer schedules to prevent root burn.',
      timestamp: nowMs,
      status: 'applied',
    });
  }

  return {
    updatedPlants: currentPlants,
    logs,
    appliedRuleIds: Array.from(new Set(appliedRuleIds)),
  };
}

/**
 * Calculates microclimate custom care adjustments for a plant given specific user home metrics.
 */
export function calculateCustomCareAdjustments(
  baseCare: CareInstructions,
  conditions: {
    tempC?: number;
    humidityLevel?: 'low' | 'moderate' | 'high';
    sunlightExposureHours?: number;
    indoorEnvironment?: 'air_conditioned' | 'radiator_heated' | 'standard' | 'bathroom';
  }
): {
  adjustedFrequencyDays: number;
  reasoning: string[];
  climateWarning?: string;
} {
  let adjustedFrequency = baseCare.watering.frequencyDays;
  const reasoning: string[] = [];
  let climateWarning: string | undefined;

  // Temperature effect
  if (conditions.tempC !== undefined) {
    if (conditions.tempC > 27) {
      adjustedFrequency = Math.max(1, Math.round(adjustedFrequency * 0.8));
      reasoning.push(`High room temperature (${conditions.tempC}°C) speeds soil evaporation: watering reduced by ~20%.`);
    } else if (conditions.tempC < 16) {
      adjustedFrequency = Math.round(adjustedFrequency * 1.3);
      reasoning.push(`Cool room temperature (${conditions.tempC}°C) reduces metabolic uptake: watering extended by ~30%.`);
      if (conditions.tempC < baseCare.temperature.minToleranceC) {
        climateWarning = `Warning: ${conditions.tempC}°C is below this species minimum tolerance floor (${baseCare.temperature.minToleranceC}°C). Cold injury or root stagnation possible.`;
      }
    }
  }

  // Humidity effect
  if (conditions.humidityLevel === 'low') {
    adjustedFrequency = Math.max(1, Math.round(adjustedFrequency * 0.85));
    reasoning.push('Dry indoor air increases leaf transpiration: schedule adjusted for earlier watering.');
  } else if (conditions.humidityLevel === 'high') {
    adjustedFrequency = Math.round(adjustedFrequency * 1.2);
    reasoning.push('High ambient humidity retains potting soil moisture longer: watering spaced out.');
  }

  // Indoor environment specifics
  if (conditions.indoorEnvironment === 'air_conditioned' || conditions.indoorEnvironment === 'radiator_heated') {
    reasoning.push('Forced air heating or AC creates micro-drafts and dry air. Regular foliage misting or pebble tray recommended.');
  } else if (conditions.indoorEnvironment === 'bathroom') {
    reasoning.push('High shower humidity is excellent for tropical aroids and ferns; soil dries at a moderate pace.');
  }

  return {
    adjustedFrequencyDays: adjustedFrequency,
    reasoning,
    climateWarning,
  };
}
