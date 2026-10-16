import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header.tsx';
import { PlantIdentifier } from './components/PlantIdentifier.tsx';
import { PlantCareDetail } from './components/PlantCareDetail.tsx';
import { GardeningChat } from './components/GardeningChat.tsx';
import { MyGarden } from './components/MyGarden.tsx';
import { PlantDoctor } from './components/PlantDoctor.tsx';
import { AutomationHub } from './components/AutomationHub.tsx';
import {
  GardenPlant,
  PlantIdentification,
  WeatherProfile,
  AutomationRule,
  AutomationLog,
  RecommendedRoutineAction,
} from './types/gardening.ts';
import { SAMPLE_PLANTS } from './utils/samplePlants.ts';
import {
  DEFAULT_WEATHER_PROFILES,
  DEFAULT_AUTOMATION_RULES,
  evaluateAutomationRules,
} from './utils/plantAutomation.ts';

const LOCAL_STORAGE_GARDEN_KEY = 'floracare_user_garden';
const LOCAL_STORAGE_WEATHER_KEY = 'floracare_user_weather';
const LOCAL_STORAGE_RULES_KEY = 'floracare_user_rules';
const LOCAL_STORAGE_LOGS_KEY = 'floracare_user_logs';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('identify');
  const [currentPlant, setCurrentPlant] = useState<PlantIdentification>(SAMPLE_PLANTS[0]);
  const [chatPlantContext, setChatPlantContext] = useState<PlantIdentification | null>(SAMPLE_PLANTS[0]);
  const [isIdentifying, setIsIdentifying] = useState(false);

  // Weather state
  const [weather, setWeather] = useState<WeatherProfile>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_WEATHER_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_WEATHER_PROFILES[0];
  });

  // Automation Rules state
  const [rules, setRules] = useState<AutomationRule[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_RULES_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_AUTOMATION_RULES;
  });

  // Automation Execution Logs
  const [logs, setLogs] = useState<AutomationLog[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'seed-log-1',
        ruleId: 'rule-weather-adaptive',
        ruleName: 'Weather-Adaptive Hydration',
        plantId: 'all',
        plantName: 'All Garden Plants',
        actionTaken: 'Initial microclimate sync calibrated baseline watering cycles for moderate spring.',
        timestamp: Date.now() - 3600000 * 2,
        status: 'applied',
      },
    ];
  });

  // Persistent user garden collection
  const [garden, setGarden] = useState<GardenPlant[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_GARDEN_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed reading garden from localStorage', e);
    }
    const monstera = SAMPLE_PLANTS[0];
    const basil = SAMPLE_PLANTS[3];
    return [
      {
        id: 'seed-monstera',
        commonName: monstera.commonName,
        scientificName: monstera.scientificName,
        nickname: 'Living Room Monstera',
        location: 'indoor',
        careInstructions: monstera.careInstructions,
        healthStatus: monstera.healthStatus,
        addedAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
        lastWateredAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
        lastFertilizedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'seed-basil',
        commonName: basil.commonName,
        scientificName: basil.scientificName,
        nickname: 'Kitchen Window Herb',
        location: 'balcony',
        careInstructions: basil.careInstructions,
        healthStatus: basil.healthStatus,
        addedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        lastWateredAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_GARDEN_KEY, JSON.stringify(garden));
    } catch (e) {
      console.error('Failed writing garden to localStorage', e);
    }
  }, [garden]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_WEATHER_KEY, JSON.stringify(weather));
    } catch (e) {
      console.error(e);
    }
  }, [weather]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_RULES_KEY, JSON.stringify(rules));
    } catch (e) {
      console.error(e);
    }
  }, [rules]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error(e);
    }
  }, [logs]);

  const handlePlantIdentified = (plant: PlantIdentification) => {
    setCurrentPlant(plant);
    setChatPlantContext(plant);
    setActiveTab('care');
  };

  const handleAddToGarden = (
    plant: PlantIdentification,
    location: 'indoor' | 'balcony' | 'outdoor' | 'greenhouse'
  ) => {
    const existing = garden.find(
      (g) => g.commonName.toLowerCase() === plant.commonName.toLowerCase()
    );
    if (existing) return;

    const newGardenPlant: GardenPlant = {
      id: `garden-${Date.now()}`,
      commonName: plant.commonName,
      scientificName: plant.scientificName,
      location,
      careInstructions: plant.careInstructions,
      healthStatus: plant.healthStatus,
      imageUrl: plant.imageUrl,
      addedAt: Date.now(),
      lastWateredAt: Date.now(),
    };

    setGarden((prev) => [newGardenPlant, ...prev]);
  };

  const handleWaterPlant = (plantId: string) => {
    setGarden((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, lastWateredAt: Date.now() } : p))
    );
  };

  const handleFertilizePlant = (plantId: string) => {
    setGarden((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, lastFertilizedAt: Date.now() } : p))
    );
  };

  const handleRemovePlant = (plantId: string) => {
    setGarden((prev) => prev.filter((p) => p.id !== plantId));
  };

  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleTriggerAutomations = () => {
    const evalResult = evaluateAutomationRules(garden, rules, weather, Date.now());
    setGarden(evalResult.updatedPlants);

    if (evalResult.logs.length > 0) {
      setLogs((prev) => [...evalResult.logs, ...prev].slice(0, 50));
      setRules((prev) =>
        prev.map((r) => {
          if (evalResult.appliedRuleIds.includes(r.id)) {
            return {
              ...r,
              actionsCount: r.actionsCount + 1,
              lastTriggeredAt: Date.now(),
            };
          }
          return r;
        })
      );
    }
  };

  const handleQuickAutoWaterAll = () => {
    const now = Date.now();
    const newLogs: AutomationLog[] = [];
    const updated = garden.map((plant) => {
      const daysSince = Math.round((now - plant.lastWateredAt) / (24 * 60 * 60 * 1000));
      if (daysSince >= plant.careInstructions.watering.frequencyDays) {
        newLogs.push({
          id: `log-autowater-${now}-${plant.id}`,
          ruleId: 'rule-auto-water-overdue',
          ruleName: 'Automated Smart Irrigation Assistant',
          plantId: plant.id,
          plantName: plant.nickname || plant.commonName,
          actionTaken: `Quick-Hydrated ${plant.nickname || plant.commonName} (${daysSince}d without water).`,
          timestamp: now,
          status: 'applied',
        });
        return { ...plant, lastWateredAt: now };
      }
      return plant;
    });

    setGarden(updated);
    if (newLogs.length > 0) {
      setLogs((prev) => [...newLogs, ...prev].slice(0, 50));
    }
  };

  const handleBatchExecuteActions = (actions: RecommendedRoutineAction[]) => {
    const now = Date.now();
    const newLogs: AutomationLog[] = [];

    setGarden((prev) =>
      prev.map((plant) => {
        const matchingAction = actions.find((a) => a.plantId === plant.id);
        if (!matchingAction) return plant;

        if (matchingAction.action === 'water') {
          newLogs.push({
            id: `log-${now}-${plant.id}`,
            ruleId: 'rule-sweep',
            ruleName: 'AI Garden Sweep Routine',
            plantId: plant.id,
            plantName: plant.nickname || plant.commonName,
            actionTaken: `Executed automated watering: ${matchingAction.reason}`,
            timestamp: now,
            status: 'applied',
          });
          return { ...plant, lastWateredAt: now };
        } else if (matchingAction.action === 'fertilize') {
          newLogs.push({
            id: `log-${now}-${plant.id}`,
            ruleId: 'rule-sweep',
            ruleName: 'AI Garden Sweep Routine',
            plantId: plant.id,
            plantName: plant.nickname || plant.commonName,
            actionTaken: `Executed feeding protocol: ${matchingAction.reason}`,
            timestamp: now,
            status: 'applied',
          });
          return { ...plant, lastFertilizedAt: now };
        } else if (matchingAction.action === 'quarantine') {
          return { ...plant, location: 'greenhouse' };
        }
        return plant;
      })
    );

    if (newLogs.length > 0) {
      setLogs((prev) => [...newLogs, ...prev].slice(0, 50));
    }
  };

  const isCurrentPlantSaved = garden.some(
    (g) => g.commonName.toLowerCase() === currentPlant.commonName.toLowerCase()
  );

  const activeRulesCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        gardenCount={garden.length}
        activeRulesCount={activeRulesCount}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'identify' && (
          <PlantIdentifier
            onPlantIdentified={handlePlantIdentified}
            isLoading={isIdentifying}
            setIsLoading={setIsIdentifying}
          />
        )}

        {activeTab === 'care' && (
          <PlantCareDetail
            plant={currentPlant}
            onAddToGarden={handleAddToGarden}
            onAskChatbot={(plant) => {
              setChatPlantContext(plant);
              setActiveTab('chat');
            }}
            isSavedInGarden={isCurrentPlantSaved}
          />
        )}

        {activeTab === 'chat' && (
          <GardeningChat
            currentPlantContext={chatPlantContext}
            onClearPlantContext={() => setChatPlantContext(null)}
          />
        )}

        {activeTab === 'garden' && (
          <MyGarden
            garden={garden}
            onWaterPlant={handleWaterPlant}
            onFertilizePlant={handleFertilizePlant}
            onRemovePlant={handleRemovePlant}
            onViewPlantDetail={(plant) => {
              setCurrentPlant(plant);
              setActiveTab('care');
            }}
            onNavigateToIdentify={() => setActiveTab('identify')}
            onNavigateToAutomations={() => setActiveTab('automations')}
            onQuickAutoWaterAll={handleQuickAutoWaterAll}
          />
        )}

        {activeTab === 'automations' && (
          <AutomationHub
            garden={garden}
            weather={weather}
            onUpdateWeather={setWeather}
            rules={rules}
            onToggleRule={handleToggleRule}
            logs={logs}
            onTriggerAutomations={handleTriggerAutomations}
            onClearLogs={() => setLogs([])}
            onBatchExecuteActions={handleBatchExecuteActions}
          />
        )}

        {activeTab === 'doctor' && (
          <PlantDoctor
            onAskChatbotWithIssue={(question) => {
              setActiveTab('chat');
            }}
          />
        )}
      </main>

      <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 FloraCare AI · Botanical Intelligence & Garden Care Assistant</p>
          <div className="flex items-center gap-4 text-stone-600">
            <span>Powered by Akshay R Bamman</span>
            <span aria-hidden="true">·</span>
            <span>Accurate Botanical Diagnostics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

