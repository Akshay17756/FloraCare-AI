import React, { useState } from 'react';
import {
  Zap,
  Play,
  RotateCw,
  Sun,
  CloudRain,
  Flame,
  Snowflake,
  ShieldAlert,
  Droplets,
  Calendar,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  Sliders,
  Check,
  Pause,
  Loader2,
} from 'lucide-react';
import {
  GardenPlant,
  WeatherProfile,
  AutomationRule,
  AutomationLog,
  GardenSweepResult,
  RecommendedRoutineAction,
} from '../types/gardening.ts';
import {
  DEFAULT_WEATHER_PROFILES,
  getWeatherWateringMultiplier,
  evaluateAutomationRules,
} from '../utils/plantAutomation.ts';

interface AutomationHubProps {
  garden: GardenPlant[];
  weather: WeatherProfile;
  onUpdateWeather: (weather: WeatherProfile) => void;
  rules: AutomationRule[];
  onToggleRule: (ruleId: string) => void;
  logs: AutomationLog[];
  onTriggerAutomations: () => void;
  onClearLogs: () => void;
  onBatchExecuteActions: (actions: RecommendedRoutineAction[]) => void;
}

export const AutomationHub: React.FC<AutomationHubProps> = ({
  garden,
  weather,
  onUpdateWeather,
  rules,
  onToggleRule,
  logs,
  onTriggerAutomations,
  onClearLogs,
  onBatchExecuteActions,
}) => {
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState<GardenSweepResult | null>(null);
  const [sweepError, setSweepError] = useState<string | null>(null);

  // Audio briefing state (Gemini 3.8 TTS)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Custom weather adjustments modal/drawer
  const [customTemp, setCustomTemp] = useState<number>(weather.tempC);
  const [customHumidity, setCustomHumidity] = useState<number>(weather.humidityPercent);
  const [isCustomizingWeather, setIsCustomizingWeather] = useState(false);

  const wateringMultiplier = getWeatherWateringMultiplier(weather);
  const activeRulesCount = rules.filter((r) => r.enabled).length;

  const handleRunGardenSweep = async () => {
    if (garden.length === 0) {
      setSweepError('Add at least one plant to your garden to run an AI sweep.');
      return;
    }

    setIsSweeping(true);
    setSweepError(null);

    try {
      const response = await fetch('/api/automated-garden-sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plants: garden,
          weather,
        }),
      });

      if (!response.ok) {
        throw new Error('AI Garden Sweep API encountered an error.');
      }

      const data: GardenSweepResult = await response.json();
      setSweepResult(data);
    } catch (err: any) {
      console.warn('Backend sweep error, using client-side deterministic evaluation fallback:', err);
      // Deterministic fallback so user never gets blocked
      const simulatedActions: RecommendedRoutineAction[] = garden.map((plant) => {
        const msSinceWater = Date.now() - plant.lastWateredAt;
        const daysSince = Math.round(msSinceWater / (24 * 60 * 60 * 1000));
        const freq = plant.careInstructions.watering.frequencyDays;
        if (daysSince >= freq) {
          return {
            plantId: plant.id,
            plantName: plant.nickname || plant.commonName,
            action: 'water',
            reason: `Moisture depletion detected (${daysSince}d since last hydration, frequency is ${freq}d).`,
            priority: daysSince > freq + 2 ? 'urgent' : 'today',
          };
        }
        if (plant.healthStatus === 'diseased' || plant.healthStatus === 'stressed') {
          return {
            plantId: plant.id,
            plantName: plant.nickname || plant.commonName,
            action: 'inspect',
            reason: `Specimen is flagged as ${plant.healthStatus}. Soil moisture check and foliage inspection required.`,
            priority: 'today',
          };
        }
        return {
          plantId: plant.id,
          plantName: plant.nickname || plant.commonName,
          action: 'mist',
          reason: `Routine humidity maintenance recommended under ${weather.label}.`,
          priority: 'upcoming',
        };
      });

      setSweepResult({
        summary: `AI Garden Diagnostic evaluated ${garden.length} specimens under ${weather.label} (${weather.tempC}°C, ${weather.humidityPercent}% humidity).`,
        urgentCount: simulatedActions.filter((a) => a.priority === 'urgent').length,
        recommendedActions: simulatedActions,
        weatherImpactAdvice: `Current climate profile is applying a ${wateringMultiplier}x watering interval factor. Keep foliage monitored for dehydration.`,
        overallVitalityQuote: 'Consistent automated surveillance prevents chronic root stress before visible leaf wilt occurs.',
        timestamp: Date.now(),
      });
    } finally {
      setIsSweeping(false);
    }
  };

  const handlePlayAudioBriefing = async (textToSpeak: string) => {
    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
      return;
    }

    setAudioLoading(true);

    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          voiceName: 'Kore',
        }),
      });

      if (!response.ok) {
        throw new Error('TTS service failed');
      }

      const data = await response.json();
      const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setIsPlayingAudio(false);
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
      };

      audio.play();
      setAudioElement(audio);
      setIsPlayingAudio(true);
    } catch (err: any) {
      console.error('Audio playback error:', err);
      // Web Speech API fallback if server-side TTS fails
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak.slice(0, 300));
        utterance.rate = 1.0;
        utterance.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    } finally {
      setAudioLoading(false);
    }
  };

  const handleApplyCustomWeather = () => {
    onUpdateWeather({
      ...weather,
      id: 'custom_profile',
      label: `Custom Ambient (${customTemp}°C, ${customHumidity}%)`,
      tempC: customTemp,
      humidityPercent: customHumidity,
      weatherCondition: customTemp >= 30 ? 'heatwave' : customTemp <= 14 ? 'cold' : 'moderate',
      description: `Custom calibrated indoor/outdoor climate: ${customTemp}°C with ${customHumidity}% ambient humidity.`,
    });
    setIsCustomizingWeather(false);
  };

  const getWeatherIcon = (cond: WeatherProfile['weatherCondition']) => {
    switch (cond) {
      case 'heatwave':
      case 'sunny':
        return <Sun className="w-4 h-4 text-amber-500" aria-hidden="true" />;
      case 'rainy':
        return <CloudRain className="w-4 h-4 text-sky-500" aria-hidden="true" />;
      case 'cold':
        return <Snowflake className="w-4 h-4 text-cyan-600" aria-hidden="true" />;
      default:
        return <Flame className="w-4 h-4 text-emerald-600" aria-hidden="true" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header & Automated Orchestration Hero */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <Zap className="w-3 h-3 text-emerald-700" aria-hidden="true" />
              <span>AI Automation Engine Active</span>
            </span>
            <span className="text-xs text-stone-500">
              {activeRulesCount} of {rules.length} rules active
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            Garden Automations & Smart Care Routines
          </h1>
          <p className="mt-1 text-sm text-stone-600 leading-relaxed max-w-2xl">
            Simulated environmental sensing, dynamic weather-adaptive hydration intervals, biological quarantine guards, and one-click AI daily sweeps.
          </p>
        </div>

        {/* Global Manual Run Trigger */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onTriggerAutomations}
            className="px-4 py-2.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all flex items-center gap-2 shadow-2xs active:scale-[0.98]"
          >
            <RotateCw className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
            <span>Trigger Rules Cycle</span>
          </button>
        </div>
      </div>

      {/* Microclimate / Weather Simulation Section */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                {getWeatherIcon(weather.weatherCondition)}
              </div>
              <h2 className="text-base font-bold text-stone-900">
                Microclimate & Environmental Context
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Automations dynamically recalibrate plant transpiration based on ambient temperature and air humidity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-[11px] font-medium text-stone-500 block">Watering Multiplier</span>
              <span
                className={`text-base font-bold tabular-nums ${
                  wateringMultiplier < 1.0
                    ? 'text-amber-700'
                    : wateringMultiplier > 1.0
                    ? 'text-sky-700'
                    : 'text-emerald-800'
                }`}
              >
                {wateringMultiplier}x Interval
              </span>
            </div>
            <button
              onClick={() => setIsCustomizingWeather(!isCustomizingWeather)}
              className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              title="Calibrate custom temperature and humidity"
            >
              <Sliders className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Preset Selector Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {DEFAULT_WEATHER_PROFILES.map((prof) => {
            const isSelected = weather.id === prof.id;
            return (
              <button
                key={prof.id}
                onClick={() => onUpdateWeather(prof)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-emerald-700 bg-emerald-50/60 shadow-2xs ring-1 ring-emerald-700'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-stone-900 leading-tight">
                    {prof.label}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-800 shrink-0" />}
                </div>
                <div className="text-[11px] text-stone-500 tabular-nums">
                  {prof.tempC}°C · {prof.humidityPercent}% RH
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Weather Drawer (if opened) */}
        {isCustomizingWeather && (
          <div className="mt-4 p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
              Calibrate Custom Room Climate
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-stone-600 mb-1">
                  Room Temperature: <span className="font-bold text-stone-900">{customTemp}°C</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="42"
                  value={customTemp}
                  onChange={(e) => setCustomTemp(Number(e.target.value))}
                  className="w-full accent-emerald-700"
                />
              </div>
              <div>
                <label className="block text-stone-600 mb-1">
                  Relative Humidity: <span className="font-bold text-stone-900">{customHumidity}%</span>
                </label>
                <input
                  type="range"
                  min="15"
                  max="95"
                  value={customHumidity}
                  onChange={(e) => setCustomHumidity(Number(e.target.value))}
                  className="w-full accent-emerald-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCustomizingWeather(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCustomWeather}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
              >
                Apply Custom Climate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Daily Garden Sweep Feature */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-stone-950 text-white rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-emerald-400">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Autonomous Garden Diagnostics
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">AI Daily Garden Sweep</h2>
            <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-xl leading-relaxed">
              Gemini analyzes all registered specimens against your current microclimate, synthesizing prioritized hydration and care recommendations.
            </p>
          </div>

          <button
            onClick={handleRunGardenSweep}
            disabled={isSweeping || garden.length === 0}
            className={`px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md shrink-0 ${
              isSweeping
                ? 'bg-emerald-800 text-white cursor-wait opacity-90'
                : 'bg-white text-emerald-950 hover:bg-emerald-50 active:scale-[0.98]'
            }`}
          >
            {isSweeping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-900" aria-hidden="true" />
                <span>Synthesizing Garden Protocol...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-emerald-950" aria-hidden="true" />
                <span>Run AI Garden Sweep</span>
              </>
            )}
          </button>
        </div>

        {sweepError && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
            {sweepError}
          </div>
        )}

        {/* Sweep Output Card */}
        {sweepResult && (
          <div className="bg-emerald-900/60 border border-emerald-800/80 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-emerald-800/70">
              <div>
                <span className="text-[11px] text-emerald-300 uppercase tracking-wider block font-semibold">
                  Executive Botanical Briefing
                </span>
                <p className="text-sm text-white font-medium mt-0.5">{sweepResult.summary}</p>
              </div>

              {/* TTS Spoken Audio Briefing Button */}
              <button
                onClick={() =>
                  handlePlayAudioBriefing(
                    `${sweepResult.summary} Weather guidance: ${sweepResult.weatherImpactAdvice} There are ${sweepResult.urgentCount} plants requiring immediate care.`
                  )
                }
                disabled={audioLoading}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white flex items-center gap-2 transition-colors shrink-0 shadow-2xs border border-emerald-700"
              >
                {audioLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>Preparing Audio...</span>
                  </>
                ) : isPlayingAudio ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-emerald-200" aria-hidden="true" />
                    <span>Pause Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-200" aria-hidden="true" />
                    <span>Listen to AI Briefing</span>
                  </>
                )}
              </button>
            </div>

            {/* Weather Impact Advice */}
            <div className="text-xs text-emerald-100 bg-emerald-950/50 rounded-xl p-3.5 border border-emerald-800/50">
              <span className="font-semibold text-emerald-300">Weather Adaptation: </span>
              {sweepResult.weatherImpactAdvice}
            </div>

            {/* Action Items List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-200">
                  Prioritized Routine Actions ({sweepResult.recommendedActions.length})
                </span>
                {sweepResult.recommendedActions.length > 0 && (
                  <button
                    onClick={() => onBatchExecuteActions(sweepResult.recommendedActions)}
                    className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                  >
                    Execute All Recommended Actions
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sweepResult.recommendedActions.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-emerald-950/70 border border-emerald-800/60 rounded-xl p-3.5 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{item.plantName}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${
                          item.priority === 'urgent'
                            ? 'bg-rose-900/80 text-rose-200'
                            : item.priority === 'today'
                            ? 'bg-amber-900/80 text-amber-200'
                            : 'bg-emerald-900 text-emerald-200'
                        }`}
                      >
                        {item.priority} · {item.action}
                      </span>
                    </div>
                    <p className="text-emerald-200/80 leading-relaxed">{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {sweepResult.overallVitalityQuote && (
              <p className="text-[11px] text-emerald-300/80 italic text-center pt-2">
                "{sweepResult.overallVitalityQuote}" — Dr. Flora AI
              </p>
            )}
          </div>
        )}
      </div>

      {/* Active Automation Rules Matrix */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900">
              Configured Automation Rules
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Toggle automated behaviors or inspect execution triggers for your garden collection.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => {
            const isEnabled = rule.enabled;
            return (
              <div
                key={rule.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between ${
                  isEnabled ? 'border-emerald-300/90' : 'border-stone-200 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        {rule.type === 'auto_water' ? (
                          <Droplets className="w-4 h-4" aria-hidden="true" />
                        ) : rule.type === 'quarantine_alert' ? (
                          <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                        ) : rule.type === 'auto_fertilize' ? (
                          <Zap className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Sun className="w-4 h-4" aria-hidden="true" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 leading-snug">
                          {rule.name}
                        </h3>
                        <span className="text-[11px] text-stone-500 capitalize">
                          {rule.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => onToggleRule(rule.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-emerald-700' : 'bg-stone-300'
                      }`}
                      role="switch"
                      aria-checked={isEnabled}
                      aria-label={`Toggle ${rule.name}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed mb-3">
                    {rule.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
                    <span>
                      {rule.lastTriggeredAt
                        ? `Last run ${new Date(rule.lastTriggeredAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : 'Scheduled standby'}
                    </span>
                  </div>
                  <span className="font-semibold text-emerald-800 tabular-nums">
                    {rule.actionsCount} actions executed
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Automation Execution Log */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Live Automation Audit Trail
            </h2>
            <p className="text-xs text-stone-500">
              Record of automated microclimate adjustments, auto-watering cycles, and quarantine actions.
            </p>
          </div>

          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-xs text-stone-500 hover:text-stone-800 transition-colors"
            >
              Clear Log History
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500">
            No automation events recorded yet. Trigger a rules cycle or run an AI garden sweep above!
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      log.status === 'alert'
                        ? 'bg-rose-500'
                        : log.status === 'applied'
                        ? 'bg-emerald-500'
                        : 'bg-stone-400'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">{log.ruleName}</span>
                      <span className="text-stone-400">·</span>
                      <span className="text-emerald-800 font-medium">{log.plantName}</span>
                    </div>
                    <p className="text-stone-600 mt-0.5">{log.actionTaken}</p>
                  </div>
                </div>

                <span className="text-[10px] text-stone-400 tabular-nums shrink-0 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
