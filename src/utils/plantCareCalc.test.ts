import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSeasonalMultiplier,
  calculateNextWateringDate,
  getWateringStatus,
  calculateGardenHealthScore,
  filterGardenPlants,
} from './plantCareCalc.ts';
import type { GardenPlant } from '../types/gardening.ts';

test('getSeasonalMultiplier adjusts according to season months', () => {
  // January (month 0) should be Winter factor 1.35
  const winterDate = new Date(2026, 0, 15);
  assert.equal(getSeasonalMultiplier(winterDate), 1.35);

  // July (month 6) should be Summer factor 0.85
  const summerDate = new Date(2026, 6, 15);
  assert.equal(getSeasonalMultiplier(summerDate), 0.85);

  // April (month 3) should be Spring neutral factor 1.0
  const springDate = new Date(2026, 3, 15);
  assert.equal(getSeasonalMultiplier(springDate), 1.0);
});

test('calculateNextWateringDate adds effective days correctly', () => {
  const baseTime = 1776000000000;
  const springDate = new Date(2026, 3, 15); // multiplier 1.0
  const nextWater = calculateNextWateringDate(baseTime, 7, true, springDate);
  const expectedDiffMs = 7 * 24 * 60 * 60 * 1000;
  assert.equal(nextWater, baseTime + expectedDiffMs);
});

test('getWateringStatus accurately detects overdue, due today, and upcoming', () => {
  const now = 1776000000000;
  const dayMs = 24 * 60 * 60 * 1000;

  // Plant watered 10 days ago with 5-day frequency (in spring) -> overdue
  const springDate = new Date(now);
  const watered10DaysAgo = now - 10 * dayMs;
  const overdueStatus = getWateringStatus(watered10DaysAgo, 5, now);
  assert.equal(overdueStatus.status, 'overdue');
  assert.match(overdueStatus.label, /overdue/i);

  // Plant watered 5 days ago with 5-day frequency -> due today
  const watered5DaysAgo = now - 5 * dayMs;
  const dueTodayStatus = getWateringStatus(watered5DaysAgo, 5, now);
  assert.equal(dueTodayStatus.status, 'due_today');

  // Plant watered yesterday with 7-day frequency -> upcoming
  const wateredYesterday = now - 1 * dayMs;
  const upcomingStatus = getWateringStatus(wateredYesterday, 7, now);
  assert.equal(upcomingStatus.status, 'upcoming');
  assert.equal(upcomingStatus.daysRemaining > 0, true);
});

test('calculateGardenHealthScore returns 100 for empty or all-healthy garden', () => {
  const emptyRes = calculateGardenHealthScore([]);
  assert.equal(emptyRes.healthScore, 100);
  assert.equal(emptyRes.totalPlants, 0);

  const mockPlant: GardenPlant = {
    id: 'test-1',
    commonName: 'Fiddle Leaf Fig',
    scientificName: 'Ficus lyrata',
    location: 'indoor',
    healthStatus: 'healthy',
    addedAt: Date.now() - 100000,
    lastWateredAt: Date.now(),
    careInstructions: {
      light: { summary: 'Bright indirect', hours: '6-8', direct: false, level: 'bright_indirect' },
      watering: { summary: 'Water weekly', frequencyDays: 7, dryThreshold: 'Top 2 inches', seasonalTips: '' },
      soil: { type: 'Well-draining peat mix', phRange: '6.0-7.0', drainage: 'High', repottingCadenceMonths: 24 },
      temperature: { idealMinC: 18, idealMaxC: 28, minToleranceC: 12, humidityLevel: 'High (50-60%)' },
      fertilizer: { type: 'Balanced liquid 10-10-10', schedule: 'Monthly in spring/summer', activeSeasonOnly: true },
      toxicity: { toxicToDogs: true, toxicToCats: true, toxicToHumans: false, details: 'Toxic to pets' },
      propagation: { methods: ['Stem cuttings'], bestSeason: 'Spring', difficulty: 'moderate' },
    },
  };

  const scoreRes = calculateGardenHealthScore([mockPlant]);
  assert.equal(scoreRes.healthScore, 100);
  assert.equal(scoreRes.overdueCount, 0);
  assert.equal(scoreRes.healthyCount, 1);
});

test('filterGardenPlants correctly filters by search term and location', () => {
  const plants: GardenPlant[] = [
    {
      id: '1',
      commonName: 'Monstera Deliciosa',
      scientificName: 'Monstera deliciosa',
      nickname: 'Monty',
      location: 'indoor',
      healthStatus: 'healthy',
      addedAt: 1,
      lastWateredAt: 1,
      careInstructions: {} as any,
    },
    {
      id: '2',
      commonName: 'Sweet Basil',
      scientificName: 'Ocimum basilicum',
      nickname: 'Kitchen Basil',
      location: 'balcony',
      healthStatus: 'healthy',
      addedAt: 1,
      lastWateredAt: 1,
      careInstructions: {} as any,
    },
  ];

  const searchMonty = filterGardenPlants(plants, 'monty');
  assert.equal(searchMonty.length, 1);
  assert.equal(searchMonty[0].id, '1');

  const balconyPlants = filterGardenPlants(plants, '', 'balcony');
  assert.equal(balconyPlants.length, 1);
  assert.equal(balconyPlants[0].id, '2');

  const indoorPlants = filterGardenPlants(plants, '', 'indoor');
  assert.equal(indoorPlants.length, 1);
  assert.equal(indoorPlants[0].id, '1');
});
