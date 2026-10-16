import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getWeatherWateringMultiplier,
  evaluateAutomationRules,
  calculateCustomCareAdjustments,
  DEFAULT_WEATHER_PROFILES,
  DEFAULT_AUTOMATION_RULES,
} from './plantAutomation.ts';
import type { GardenPlant, WeatherProfile, AutomationRule } from '../types/gardening.ts';

test('getWeatherWateringMultiplier adjusts for heatwave and rain', () => {
  const heatwave: WeatherProfile = {
    id: 'test-heat',
    label: 'Heatwave',
    season: 'summer',
    tempC: 34,
    humidityPercent: 30,
    weatherCondition: 'heatwave',
    description: 'Hot and dry',
  };

  const mult = getWeatherWateringMultiplier(heatwave);
  // Should be significantly less than 1.0 (faster drying)
  assert.equal(mult < 0.8, true);

  const rainy: WeatherProfile = {
    id: 'test-rain',
    label: 'Rainy',
    season: 'summer',
    tempC: 22,
    humidityPercent: 85,
    weatherCondition: 'rainy',
    description: 'Humid and rainy',
  };

  const rainMult = getWeatherWateringMultiplier(rainy);
  // Should be greater than 1.0 (slower drying)
  assert.equal(rainMult > 1.2, true);
});

test('evaluateAutomationRules auto-quarantines diseased specimens', () => {
  const diseasedPlant: GardenPlant = {
    id: 'sick-1',
    commonName: 'Fiddle Leaf Fig',
    scientificName: 'Ficus lyrata',
    location: 'indoor',
    healthStatus: 'diseased',
    addedAt: 1000,
    lastWateredAt: 1000,
    careInstructions: {
      watering: { frequencyDays: 7 } as any,
    } as any,
  };

  const rules: AutomationRule[] = [
    {
      id: 'rule-health-quarantine',
      name: 'Quarantine Protector',
      description: 'Quarantine sick plants',
      enabled: true,
      type: 'quarantine_alert',
      actionsCount: 0,
    },
  ];

  const weather = DEFAULT_WEATHER_PROFILES[0];
  const { updatedPlants, logs } = evaluateAutomationRules([diseasedPlant], rules, weather, 2000);

  assert.equal(updatedPlants[0].location, 'greenhouse');
  assert.equal(logs.length, 1);
  assert.equal(logs[0].status, 'alert');
  assert.match(logs[0].actionTaken, /quarantine/i);
});

test('evaluateAutomationRules auto-waters overdue plants when auto_water is enabled', () => {
  const dayMs = 24 * 60 * 60 * 1000;
  const now = 1776000000000;

  const overduePlant: GardenPlant = {
    id: 'thirsty-1',
    commonName: 'Peace Lily',
    scientificName: 'Spathiphyllum',
    location: 'indoor',
    healthStatus: 'stressed',
    addedAt: now - 30 * dayMs,
    lastWateredAt: now - 10 * dayMs, // 10 days ago, frequency is 4 days -> overdue
    careInstructions: {
      watering: { frequencyDays: 4 } as any,
    } as any,
  };

  const rules: AutomationRule[] = [
    {
      id: 'rule-auto-water-overdue',
      name: 'Automated Smart Irrigation Assistant',
      description: 'Auto water overdue',
      enabled: true,
      type: 'auto_water',
      actionsCount: 0,
    },
  ];

  const weather = DEFAULT_WEATHER_PROFILES[0];
  const { updatedPlants, logs } = evaluateAutomationRules([overduePlant], rules, weather, now);

  assert.equal(updatedPlants[0].lastWateredAt, now);
  assert.equal(logs.length, 1);
  assert.match(logs[0].actionTaken, /Auto-hydrated/i);
});

test('calculateCustomCareAdjustments responds accurately to temperature and indoor heating', () => {
  const baseCare = {
    watering: { frequencyDays: 10, summary: '', dryThreshold: '', seasonalTips: '' },
    temperature: { idealMinC: 18, idealMaxC: 28, minToleranceC: 12, humidityLevel: 'Medium' },
  } as any;

  const hotResult = calculateCustomCareAdjustments(baseCare, {
    tempC: 30,
    humidityLevel: 'low',
    indoorEnvironment: 'air_conditioned',
  });

  // Hot + dry should shorten interval
  assert.equal(hotResult.adjustedFrequencyDays < 10, true);
  assert.equal(hotResult.reasoning.length >= 2, true);

  const coldResult = calculateCustomCareAdjustments(baseCare, {
    tempC: 10,
    humidityLevel: 'high',
  });

  // 10C is below minToleranceC (12C), so warning should be present
  assert.equal(coldResult.adjustedFrequencyDays > 10, true);
  assert.equal(typeof coldResult.climateWarning, 'string');
});
