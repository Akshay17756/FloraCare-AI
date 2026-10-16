import type { GardenPlant, PlantIdentification } from '../types/gardening.ts';

/**
 * Returns seasonal watering adjustment multiplier.
 * Winter (Nov-Feb) -> 1.35x (plants dry slower and need less water)
 * Summer (Jun-Aug) -> 0.85x (plants dry faster and need more frequent water)
 * Spring/Autumn -> 1.0x
 */
export function getSeasonalMultiplier(date: Date = new Date()): number {
  const month = date.getMonth(); // 0-11
  if (month === 11 || month === 0 || month === 1) {
    return 1.35; // Winter
  }
  if (month >= 5 && month <= 7) {
    return 0.85; // Summer
  }
  return 1.0; // Spring / Autumn
}

/**
 * Calculates next watering timestamp in milliseconds.
 */
export function calculateNextWateringDate(
  lastWateredAt: number,
  baseFrequencyDays: number,
  applySeasonality = true,
  currentDate = new Date()
): number {
  const safeFrequency = Math.max(1, baseFrequencyDays);
  const multiplier = applySeasonality ? getSeasonalMultiplier(currentDate) : 1.0;
  const effectiveDays = Math.max(1, Math.round(safeFrequency * multiplier));
  const msInDay = 24 * 60 * 60 * 1000;
  return lastWateredAt + effectiveDays * msInDay;
}

export interface WateringStatus {
  status: 'overdue' | 'due_today' | 'upcoming';
  daysRemaining: number;
  label: string;
}

/**
 * Evaluates whether a plant is overdue, due today, or upcoming for watering.
 */
export function getWateringStatus(
  lastWateredAt: number,
  baseFrequencyDays: number,
  nowMs: number = Date.now()
): WateringStatus {
  const nextWaterMs = calculateNextWateringDate(lastWateredAt, baseFrequencyDays, true, new Date(nowMs));
  const msInDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((nextWaterMs - nowMs) / msInDay);

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      status: 'overdue',
      daysRemaining: diffDays,
      label: overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`,
    };
  }

  if (diffDays === 0) {
    return {
      status: 'due_today',
      daysRemaining: 0,
      label: 'Due today',
    };
  }

  return {
    status: 'upcoming',
    daysRemaining: diffDays,
    label: diffDays === 1 ? 'In 1 day' : `In ${diffDays} days`,
  };
}

/**
 * Computes an overall garden health index (0 - 100) based on overdue plants and reported health.
 */
export function calculateGardenHealthScore(plants: GardenPlant[], nowMs: number = Date.now()): {
  healthScore: number;
  overdueCount: number;
  healthyCount: number;
  totalPlants: number;
} {
  if (plants.length === 0) {
    return { healthScore: 100, overdueCount: 0, healthyCount: 0, totalPlants: 0 };
  }

  let penalty = 0;
  let overdueCount = 0;
  let healthyCount = 0;

  for (const plant of plants) {
    const status = getWateringStatus(plant.lastWateredAt, plant.careInstructions.watering.frequencyDays, nowMs);
    if (status.status === 'overdue') {
      overdueCount += 1;
      penalty += Math.min(25, 10 + Math.abs(status.daysRemaining) * 5);
    }
    if (plant.healthStatus === 'healthy') {
      healthyCount += 1;
    } else if (plant.healthStatus === 'stressed') {
      penalty += 10;
    } else {
      penalty += 20;
    }
  }

  const rawScore = 100 - Math.round(penalty / plants.length);
  const healthScore = Math.max(10, Math.min(100, rawScore));

  return {
    healthScore,
    overdueCount,
    healthyCount,
    totalPlants: plants.length,
  };
}

/**
 * Filter and search garden plants by query and location.
 */
export function filterGardenPlants(
  plants: GardenPlant[],
  query: string,
  locationFilter: string = 'all'
): GardenPlant[] {
  const normalizedQuery = query.trim().toLowerCase();

  return plants.filter((plant) => {
    if (locationFilter !== 'all' && plant.location !== locationFilter) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return (
      plant.commonName.toLowerCase().includes(normalizedQuery) ||
      plant.scientificName.toLowerCase().includes(normalizedQuery) ||
      (plant.nickname && plant.nickname.toLowerCase().includes(normalizedQuery)) ||
      plant.location.toLowerCase().includes(normalizedQuery)
    );
  });
}
