import React, { useState } from 'react';
import {
  Sun,
  Droplets,
  Layers,
  Thermometer,
  Zap,
  AlertTriangle,
  GitBranch,
  ShieldAlert,
  ShieldCheck,
  Plus,
  MessageSquare,
  Check,
  Sparkles,
  HeartPulse,
  Volume2,
  Pause,
  Loader2,
  Sliders,
  X,
} from 'lucide-react';
import { PlantIdentification } from '../types/gardening.ts';
import { PlantIllustration } from './PlantIllustration.tsx';
import { calculateCustomCareAdjustments } from '../utils/plantAutomation.ts';

interface PlantCareDetailProps {
  plant: PlantIdentification;
  onAddToGarden: (plant: PlantIdentification, location: 'indoor' | 'balcony' | 'outdoor' | 'greenhouse') => void;
  onAskChatbot: (plant: PlantIdentification) => void;
  isSavedInGarden: boolean;
}

export const PlantCareDetail: React.FC<PlantCareDetailProps> = ({
  plant,
  onAddToGarden,
  onAskChatbot,
  isSavedInGarden,
}) => {
  const { careInstructions } = plant;
  const [selectedLocation, setSelectedLocation] = React.useState<'indoor' | 'balcony' | 'outdoor' | 'greenhouse'>('indoor');
  const [addedSuccess, setAddedSuccess] = React.useState(false);

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // AI Microclimate Calibration Modal/Panel
  const [showTuner, setShowTuner] = useState(false);
  const [tunerTemp, setTunerTemp] = useState(21);
  const [tunerHumidity, setTunerHumidity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [tunerEnvironment, setTunerEnvironment] = useState<'standard' | 'air_conditioned' | 'radiator_heated' | 'bathroom'>('standard');
  const [calibratedPlan, setCalibratedPlan] = useState<{ adjustedFrequencyDays: number; reasoning: string[]; climateWarning?: string } | null>(null);

  const handleRunCalibration = () => {
    const result = calculateCustomCareAdjustments(careInstructions, {
      tempC: tunerTemp,
      humidityLevel: tunerHumidity,
      indoorEnvironment: tunerEnvironment,
    });
    setCalibratedPlan(result);
  };

  const handlePlayAudioCare = async () => {
    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
      return;
    }

    setAudioLoading(true);

    try {
      const summaryText = `Care guide for ${plant.commonName}. Water every ${careInstructions.watering.frequencyDays} days. ${careInstructions.watering.summary} Light requirement: ${careInstructions.light.summary} Ideal temperature: ${careInstructions.temperature.idealMinC} to ${careInstructions.temperature.idealMaxC} degrees Celsius.`;

      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: summaryText,
          voiceName: 'Kore',
        }),
      });

      if (!response.ok) throw new Error('Audio generation failed');

      const data = await response.json();
      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);

      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);

      audio.play();
      setAudioElement(audio);
      setIsPlayingAudio(true);
    } catch (err) {
      console.warn('TTS playback error, using speech synthesis fallback', err);
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(`Care guide for ${plant.commonName}. Water every ${careInstructions.watering.frequencyDays} days.`);
        u.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(u);
        setIsPlayingAudio(true);
      }
    } finally {
      setAudioLoading(false);
    }
  };

  const handleAdd = () => {
    onAddToGarden(plant, selectedLocation);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const isHealthy = plant.healthStatus === 'healthy';


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Specimen Hero Banner */}
      <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-stone-100">
          <div className="flex items-center gap-5">
            {plant.imageUrl ? (
              <img
                src={plant.imageUrl}
                alt={plant.commonName}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl shadow-xs border border-stone-100 shrink-0"
              />
            ) : (
              <PlantIllustration type={plant.commonName} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shrink-0" />
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-1">
                <span>{plant.family}</span>
                <span aria-hidden="true">·</span>
                <span>Native to {plant.nativeRegion}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{plant.confidence}% Confidence</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                {plant.commonName}
              </h1>
              <p className="text-sm font-medium text-emerald-800 italic mt-0.5">
                {plant.scientificName}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={handlePlayAudioCare}
              disabled={audioLoading}
              className="px-3.5 py-2.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-emerald-200/60 shadow-2xs"
              title="Listen to AI voice spoken care guide"
            >
              {audioLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : isPlayingAudio ? (
                <Pause className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              )}
              <span>{isPlayingAudio ? 'Pause' : 'Audio Guide'}</span>
            </button>

            <button
              onClick={() => {
                setShowTuner(!showTuner);
                if (!calibratedPlan) handleRunCalibration();
              }}
              className="px-3.5 py-2.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              title="Calibrate care for your specific home climate"
            >
              <Sliders className="w-3.5 h-3.5 text-stone-600" aria-hidden="true" />
              <span>Tune Climate</span>
            </button>

            <button
              onClick={() => onAskChatbot(plant)}
              className="px-3.5 py-2.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-emerald-200/60"
            >
              <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ask Botanist</span>
            </button>

            <div className="flex items-center gap-2 flex-1 md:flex-none">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value as any)}
                aria-label="Garden Location"
                className="text-xs bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2.5 text-stone-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              >
                <option value="indoor">Indoor</option>
                <option value="balcony">Balcony</option>
                <option value="outdoor">Outdoor</option>
                <option value="greenhouse">Greenhouse</option>
              </select>

              <button
                onClick={handleAdd}
                disabled={isSavedInGarden || addedSuccess}
                className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  isSavedInGarden || addedSuccess
                    ? 'bg-stone-100 text-stone-500 cursor-default'
                    : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs active:scale-[0.98]'
                }`}
              >
                {isSavedInGarden || addedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                    <span>In My Garden</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add to Garden</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Microclimate Tuner Drawer */}
        {showTuner && (
          <div className="mt-4 p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-xs uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                <span>AI Home Microclimate Calibration</span>
              </div>
              <button onClick={() => setShowTuner(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-stone-600 mb-1">
                  Room Temp: <span className="font-bold text-stone-900">{tunerTemp}°C</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="35"
                  value={tunerTemp}
                  onChange={(e) => {
                    setTunerTemp(Number(e.target.value));
                  }}
                  className="w-full accent-emerald-700"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Air Humidity Level</label>
                <select
                  value={tunerHumidity}
                  onChange={(e) => setTunerHumidity(e.target.value as any)}
                  className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                >
                  <option value="low">Low / Dry (Under 40%)</option>
                  <option value="moderate">Moderate (40 - 65%)</option>
                  <option value="high">High Tropical (Over 65%)</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 mb-1">Indoor Airflow Environment</label>
                <select
                  value={tunerEnvironment}
                  onChange={(e) => setTunerEnvironment(e.target.value as any)}
                  className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                >
                  <option value="standard">Standard Household Room</option>
                  <option value="air_conditioned">Forced Air / Air Conditioned</option>
                  <option value="radiator_heated">Radiator / Heater Proximity</option>
                  <option value="bathroom">Steamy Bathroom / Shower</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleRunCalibration}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors"
              >
                Recalibrate Care Cadence
              </button>
            </div>

            {calibratedPlan && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950">
                    Calibrated Watering Cadence: Every {calibratedPlan.adjustedFrequencyDays} days
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    Baseline was every {careInstructions.watering.frequencyDays} days
                  </span>
                </div>
                {calibratedPlan.climateWarning && (
                  <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-[11px]">
                    {calibratedPlan.climateWarning}
                  </div>
                )}
                <ul className="list-disc list-inside space-y-1 text-emerald-900">
                  {calibratedPlan.reasoning.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}


        {/* Health Evaluation Row */}
        <div className="mt-6 pt-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-stone-50/70 rounded-2xl p-4 border border-stone-200/60">
          <div className="flex items-center gap-2.5 shrink-0">
            <HeartPulse
              className={`w-5 h-5 ${
                isHealthy ? 'text-emerald-700' : 'text-amber-600'
              }`}
              aria-hidden="true"
            />
            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">
                Health Status
              </span>
              <span className={`text-sm font-semibold capitalize ${isHealthy ? 'text-emerald-800' : 'text-amber-800'}`}>
                {plant.healthStatus.replace('_', ' ')}
              </span>
            </div>
          </div>
          <div className="border-t sm:border-t-0 sm:border-l border-stone-200 pt-2 sm:pt-0 sm:pl-4 text-xs text-stone-700 leading-relaxed">
            {plant.healthSummary}
          </div>
        </div>

        {/* Botanical Characteristics */}
        <div className="mt-4 text-xs text-stone-600 leading-relaxed">
          <span className="font-semibold text-stone-800">Growth Habit: </span>
          {plant.characteristics}
        </div>
      </div>

      {/* Detected Clinical Issues & Action Plans (if any) */}
      {plant.detectedIssues && plant.detectedIssues.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-700" aria-hidden="true" />
            <h2 className="text-base font-bold tracking-tight">
              Clinical Observations & Remediation Steps
            </h2>
          </div>

          <div className="space-y-4">
            {plant.detectedIssues.map((issue, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-sm font-semibold text-stone-900">{issue.issue}</h3>
                  <span className="text-[11px] font-medium text-amber-800 uppercase tracking-wide px-2 py-0.5 bg-amber-50 rounded">
                    {issue.severity} severity
                  </span>
                </div>
                <p className="text-xs text-stone-600 mb-3">
                  <span className="font-semibold text-stone-800">Underlying Cause: </span>
                  {issue.cause}
                </p>
                <div>
                  <span className="text-xs font-semibold text-stone-800 block mb-1.5">Action Plan:</span>
                  <ul className="space-y-1.5 text-xs text-stone-700 list-disc list-inside">
                    {issue.actionPlan.map((step, sIdx) => (
                      <li key={sIdx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comprehensive Care Matrix Grid (Anti-card-in-card; clean bordered cards with generous spacing) */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-stone-900 mb-4">
          Detailed Botanical Care Schedule
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Watering & Moisture */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 text-emerald-800 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">Watering Schedule</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-baseline justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Frequency</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  Every {careInstructions.watering.frequencyDays} days
                </span>
              </div>
              <div className="flex items-baseline justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Moisture Threshold</span>
                <span className="font-medium text-stone-800">{careInstructions.watering.dryThreshold}</span>
              </div>
              <p className="text-stone-600 pt-1 leading-relaxed">{careInstructions.watering.summary}</p>
              {careInstructions.watering.seasonalTips && (
                <p className="text-[11px] text-stone-500 italic pt-1 border-t border-stone-100">
                  Seasonal note: {careInstructions.watering.seasonalTips}
                </p>
              )}
            </div>
          </div>

          {/* 2. Light & Sunlight */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 text-amber-700 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Sun className="w-4 h-4 text-amber-600" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">Light Exposure</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-baseline justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Exposure Level</span>
                <span className="font-semibold text-stone-900 capitalize">
                  {careInstructions.light.level.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-baseline justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Photoperiod</span>
                <span className="font-medium text-stone-800">{careInstructions.light.hours}</span>
              </div>
              <p className="text-stone-600 pt-1 leading-relaxed">{careInstructions.light.summary}</p>
            </div>
          </div>

          {/* 3. Soil & Substrate */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 text-stone-700 mb-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                <Layers className="w-4 h-4 text-stone-600" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">Soil & Substrate</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-baseline justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">pH Target Range</span>
                <span className="font-semibold text-stone-900">{careInstructions.soil.phRange}</span>
              </div>
              <div className="flex items-baseline justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Repotting Cadence</span>
                <span className="font-medium text-stone-800 tabular-nums">
                  Every {careInstructions.soil.repottingCadenceMonths} months
                </span>
              </div>
              <p className="text-stone-600 pt-1 leading-relaxed">{careInstructions.soil.type}</p>
            </div>
          </div>

          {/* 4. Temperature & Humidity */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 text-rose-700 mb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                <Thermometer className="w-4 h-4 text-rose-600" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">Climate & Humidity</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-baseline justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Ideal Temp Range</span>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {careInstructions.temperature.idealMinC}°C – {careInstructions.temperature.idealMaxC}°C
                </span>
              </div>
              <div className="flex items-baseline justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Frost Floor (Min)</span>
                <span className="font-medium text-stone-800 tabular-nums">
                  {careInstructions.temperature.minToleranceC}°C
                </span>
              </div>
              <p className="text-stone-600 pt-1 leading-relaxed">
                Humidity: {careInstructions.temperature.humidityLevel}
              </p>
            </div>
          </div>

          {/* 5. Fertilizer & Nutrition */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 text-emerald-700 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">Nutrition & Feeding</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-baseline justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Schedule</span>
                <span className="font-semibold text-stone-900">{careInstructions.fertilizer.schedule}</span>
              </div>
              <div className="flex items-baseline justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Active Season Only</span>
                <span className="font-medium text-stone-800">
                  {careInstructions.fertilizer.activeSeasonOnly ? 'Yes (Spring/Summer)' : 'Year-round'}
                </span>
              </div>
              <p className="text-stone-600 pt-1 leading-relaxed">{careInstructions.fertilizer.type}</p>
            </div>
          </div>

          {/* 6. Toxicity & Safety */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2.5 text-purple-700 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-purple-600" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">Toxicity & Bio-Safety</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <span className="text-stone-600">Dogs</span>
                <span className={`font-semibold ${careInstructions.toxicity.toxicToDogs ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {careInstructions.toxicity.toxicToDogs ? 'Toxic' : 'Non-toxic'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-stone-100">
                <span className="text-stone-600">Cats</span>
                <span className={`font-semibold ${careInstructions.toxicity.toxicToCats ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {careInstructions.toxicity.toxicToCats ? 'Toxic' : 'Non-toxic'}
                </span>
              </div>
              <p className="text-stone-600 pt-1 leading-relaxed">{careInstructions.toxicity.details}</p>
            </div>
          </div>

          {/* 7. Propagation Methods */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-2.5 text-stone-800 mb-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                <GitBranch className="w-4 h-4 text-stone-700" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">Propagation & Division</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-stone-500 block mb-1">Recommended Methods</span>
                <ul className="space-y-1 font-medium text-stone-800 list-disc list-inside">
                  {careInstructions.propagation.methods.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-stone-500 block mb-1">Optimal Window</span>
                <span className="font-semibold text-stone-900">{careInstructions.propagation.bestSeason}</span>
              </div>
              <div>
                <span className="text-stone-500 block mb-1">Difficulty</span>
                <span className="font-semibold text-stone-900 capitalize">
                  {careInstructions.propagation.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Golden Grower Tips */}
      {plant.quickTips && plant.quickTips.length > 0 && (
        <div className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-4 text-emerald-400">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
            <h2 className="text-base font-bold tracking-tight">Expert Botanical Care Tips</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plant.quickTips.map((tip, idx) => (
              <div key={idx} className="bg-emerald-900/60 rounded-2xl p-4 border border-emerald-800/80">
                <p className="text-xs text-emerald-100 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
