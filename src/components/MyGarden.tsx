import React, { useState } from 'react';
import {
  Droplets,
  Calendar,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  HeartPulse,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { GardenPlant, PlantIdentification } from '../types/gardening.ts';
import {
  getWateringStatus,
  calculateGardenHealthScore,
  filterGardenPlants,
} from '../utils/plantCareCalc.ts';
import { PlantIllustration } from './PlantIllustration.tsx';

interface MyGardenProps {
  garden: GardenPlant[];
  onWaterPlant: (plantId: string) => void;
  onFertilizePlant: (plantId: string) => void;
  onRemovePlant: (plantId: string) => void;
  onViewPlantDetail: (plant: PlantIdentification) => void;
  onNavigateToIdentify: () => void;
  onNavigateToAutomations?: () => void;
  onQuickAutoWaterAll?: () => void;
}

export const MyGarden: React.FC<MyGardenProps> = ({
  garden,
  onWaterPlant,
  onFertilizePlant,
  onRemovePlant,
  onViewPlantDetail,
  onNavigateToIdentify,
  onNavigateToAutomations,
  onQuickAutoWaterAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [justWateredId, setJustWateredId] = useState<string | null>(null);

  const filteredPlants = filterGardenPlants(garden, searchQuery, selectedLocation);
  const healthStats = calculateGardenHealthScore(garden);

  const handleWaterClick = (id: string) => {
    onWaterPlant(id);
    setJustWateredId(id);
    setTimeout(() => setJustWateredId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Garden Header & Metric Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            My Botanical Garden
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Track daily hydration, feeding rhythms, and individual plant wellness.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigateToAutomations && (
            <button
              onClick={onNavigateToAutomations}
              className="px-3.5 py-2.5 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>AI Automations</span>
            </button>
          )}

          {healthStats.overdueCount > 0 && onQuickAutoWaterAll && (
            <button
              onClick={onQuickAutoWaterAll}
              className="px-3.5 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Automatically water all overdue plants"
            >
              <Droplets className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Auto-Water Overdue ({healthStats.overdueCount})</span>
            </button>
          )}

          <button
            onClick={onNavigateToIdentify}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add New Plant</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row (tabular numbers, anti-cockpit clutter) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wider block">
            Plants Under Care
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-stone-900 tabular-nums">
              {healthStats.totalPlants}
            </span>
            <span className="text-xs text-stone-500">specimens registered</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wider block">
            Hydration Attention
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold tabular-nums ${
                healthStats.overdueCount > 0 ? 'text-amber-700' : 'text-emerald-800'
              }`}
            >
              {healthStats.overdueCount}
            </span>
            <span className="text-xs text-stone-500">
              {healthStats.overdueCount === 1 ? 'specimen overdue' : 'specimens overdue'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wider block">
            Garden Health Index
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-800 tabular-nums">
              {healthStats.healthScore}%
            </span>
            <span className="text-xs text-stone-500">optimal vitality</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Interactive Segmented Location Filter */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl overflow-x-auto">
          {['all', 'indoor', 'balcony', 'outdoor', 'greenhouse'].map((loc) => (
            <button
              key={loc}
              onClick={() => setSelectedLocation(loc)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition-colors ${
                selectedLocation === loc
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {loc === 'all' ? 'All Spaces' : loc}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search species or nickname..."
            className="w-full pl-9 pr-3 py-2 text-xs text-stone-900 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Garden Plant Cards Grid */}
      {filteredPlants.length === 0 ? (
        <div className="bg-stone-50/60 border border-stone-200 rounded-3xl p-10 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-3">
            <Droplets className="w-6 h-6" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-stone-900">No plants found</h3>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            {garden.length === 0
              ? 'You have not added any plants to your garden yet. Scan a plant or pick from our sample collection to begin tracking!'
              : 'No plants matched your current search or location filter.'}
          </p>
          {garden.length === 0 && (
            <button
              onClick={onNavigateToIdentify}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors"
            >
              Scan Your First Plant
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlants.map((plant) => {
            const waterStatus = getWateringStatus(
              plant.lastWateredAt,
              plant.careInstructions.watering.frequencyDays
            );

            const isOverdue = waterStatus.status === 'overdue';
            const isDueToday = waterStatus.status === 'due_today';
            const wasJustWatered = justWateredId === plant.id;

            return (
              <div
                key={plant.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all"
              >
                <div>
                  {/* Top row: thumbnail + title + remove */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      {plant.imageUrl ? (
                        <img
                          src={plant.imageUrl}
                          alt={plant.commonName}
                          className="w-12 h-12 rounded-xl object-cover border border-stone-100 shrink-0"
                        />
                      ) : (
                        <PlantIllustration type={plant.commonName} className="w-12 h-12 rounded-xl shrink-0" />
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 leading-snug">
                          {plant.nickname || plant.commonName}
                        </h3>
                        {plant.nickname && (
                          <p className="text-xs text-stone-500">{plant.commonName}</p>
                        )}
                        <p className="text-[11px] text-emerald-800 italic">{plant.scientificName}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemovePlant(plant.id)}
                      className="text-stone-300 hover:text-rose-600 transition-colors p-1"
                      title="Remove plant from garden"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Metadata and Care Status */}
                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Location</span>
                      <span className="font-semibold text-stone-800 capitalize">
                        {plant.location}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Watering Schedule</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          isOverdue
                            ? 'text-rose-700'
                            : isDueToday
                            ? 'text-amber-700'
                            : 'text-emerald-800'
                        }`}
                      >
                        {wasJustWatered ? 'Watered!' : waterStatus.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Frequency</span>
                      <span className="text-stone-700 tabular-nums">
                        Every {plant.careInstructions.watering.frequencyDays} days
                      </span>
                    </div>

                    {plant.lastFertilizedAt && (
                      <div className="flex items-center justify-between text-[11px] text-stone-400">
                        <span>Last fed</span>
                        <span>{new Date(plant.lastFertilizedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                  <button
                    onClick={() => handleWaterClick(plant.id)}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      wasJustWatered
                        ? 'bg-emerald-100 text-emerald-800'
                        : isOverdue || isDueToday
                        ? 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-2xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                    }`}
                  >
                    <Droplets className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{wasJustWatered ? 'Refreshed' : 'Mark Watered'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onFertilizePlant(plant.id);
                    }}
                    className="p-2 text-stone-600 hover:text-emerald-800 bg-stone-50 hover:bg-emerald-50 rounded-xl transition-colors border border-stone-200/60"
                    title="Mark Fed / Fertilized"
                  >
                    <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>

                  <button
                    onClick={() => {
                      // Construct full PlantIdentification object to inspect
                      onViewPlantDetail({
                        id: plant.id,
                        commonName: plant.commonName,
                        scientificName: plant.scientificName,
                        family: 'Cultivated Botanical',
                        confidence: 100,
                        healthStatus: plant.healthStatus,
                        healthSummary: 'Active garden member under routine care schedule.',
                        characteristics: 'Thriving cultivated specimen.',
                        nativeRegion: 'Domestic Collection',
                        careInstructions: plant.careInstructions,
                        detectedIssues: [],
                        quickTips: [
                          'Check soil dampness at finger depth before routine watering.',
                          'Ensure adequate drainage so roots never sit in standing stagnant water.',
                        ],
                        imageUrl: plant.imageUrl,
                        timestamp: plant.addedAt,
                      });
                    }}
                    className="p-2 text-stone-600 hover:text-emerald-800 bg-stone-50 hover:bg-emerald-50 rounded-xl transition-colors border border-stone-200/60"
                    title="View Full Care Instructions"
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
