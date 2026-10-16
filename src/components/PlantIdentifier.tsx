import React, { useState, useRef } from 'react';
import { Camera, Upload, AlertCircle, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { PlantIdentification } from '../types/gardening.ts';
import { SAMPLE_PLANTS } from '../utils/samplePlants.ts';
import { PlantIllustration } from './PlantIllustration.tsx';

interface PlantIdentifierProps {
  onPlantIdentified: (plant: PlantIdentification) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const PlantIdentifier: React.FC<PlantIdentifierProps> = ({
  onPlantIdentified,
  isLoading,
  setIsLoading,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('Uploading plant image...');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file (JPEG, PNG, WEBP).');
      return;
    }
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!selectedImage) {
      setErrorMessage('Please upload or snap a photo of your plant first.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('Analyzing morphology, leaf venation & foliage structure...');

    const timer1 = setTimeout(() => {
      setLoadingStep('Consulting botanical database & diagnosing plant health...');
    }, 1800);

    const timer2 = setTimeout(() => {
      setLoadingStep('Generating comprehensive care matrix & watering schedule...');
    }, 3800);

    try {
      const response = await fetch('/api/identify-plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          notes: notes.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const plantData: PlantIdentification = await response.json();
      plantData.imageUrl = selectedImage;
      onPlantIdentified(plantData);
    } catch (err: any) {
      console.error('Identification failed:', err);
      setErrorMessage(
        err.message ||
          'Plant analysis failed. Please ensure the photo has clear lighting and focus on leaf details.'
      );
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsLoading(false);
    }
  };

  const handleSelectSample = (sample: PlantIdentification) => {
    setSelectedImage(null);
    setNotes('');
    setErrorMessage(null);
    onPlantIdentified(sample);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Editorial Header */}
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 balance">
          Identify Any Plant & Get Personalized Care Protocols
        </h1>
        <p className="mt-3 text-base text-stone-600 leading-relaxed">
          Snap or upload a photo to identify botanical species, evaluate health conditions, and generate precision schedules for watering, light, soil, and feeding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Photo Upload & Diagnostic Input (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all bg-white ${
              dragActive
                ? 'border-emerald-600 bg-emerald-50/50'
                : selectedImage
                ? 'border-emerald-300'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            {selectedImage ? (
              <div className="space-y-4">
                <div className="relative max-h-80 mx-auto overflow-hidden rounded-xl bg-stone-900/5">
                  <img
                    src={selectedImage}
                    alt="Uploaded plant to identify"
                    className="w-full h-72 object-contain mx-auto rounded-lg"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                  >
                    Change Photo
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                  >
                    Select Another
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-800">
                  <Camera className="w-7 h-7" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-base font-semibold text-stone-900">
                    Upload or snap a plant photo
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Drag and drop, browse files, or use your phone camera
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" aria-hidden="true" />
                    <span>Upload Image</span>
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isLoading}
                    className="px-4 py-2.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" aria-hidden="true" />
                    <span>Take Photo</span>
                  </button>
                </div>
                <p className="text-[11px] text-stone-400">
                  Supported formats: JPG, PNG, WEBP · Max 20MB
                </p>
              </div>
            )}

            {/* Hidden File Inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Optional Observation Notes */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
            <label
              htmlFor="symptom-notes"
              className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5"
            >
              Optional: What have you observed?
            </label>
            <textarea
              id="symptom-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Lower leaves turning pale yellow, repotted 2 weeks ago into fresh potting soil..."
              className="w-full text-sm text-stone-900 placeholder-stone-400 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold">Analysis Notice</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Analyze Primary CTA */}
          <div>
            <button
              onClick={handleAnalyzePhoto}
              disabled={isLoading || !selectedImage}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                !selectedImage
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : isLoading
                  ? 'bg-emerald-900 text-white cursor-wait opacity-90'
                  : 'bg-emerald-800 hover:bg-emerald-900 text-white active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>{loadingStep}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span>Identify & Diagnose Plant</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instant Exploration: Sample Botanical Presets (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-stone-50/70 border border-stone-200/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-stone-900">
                Or Try Sample Botanical Presets
              </h2>
              <span className="text-xs text-stone-500">Instant Care Preview</span>
            </div>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Click any specimen to immediately explore deep care instructions, watering intervals, and health diagnosis:
            </p>

            <div className="space-y-2.5">
              {SAMPLE_PLANTS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="w-full text-left p-3.5 rounded-xl bg-white border border-stone-200 hover:border-emerald-600 hover:shadow-xs transition-all flex items-center justify-between group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                >
                  <div className="flex items-center gap-3.5">
                    <PlantIllustration type={sample.commonName} className="w-11 h-11 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-stone-900 group-hover:text-emerald-800 transition-colors">
                        {sample.commonName}
                      </h3>
                      <p className="text-xs text-stone-500 italic">
                        {sample.scientificName}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                        <span>Water: every {sample.careInstructions.watering.frequencyDays}d</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{sample.healthStatus}</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-stone-100 group-hover:bg-emerald-50 text-stone-400 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Photography Tips for Accurate Diagnosis
            </h3>
            <ul className="mt-2.5 space-y-1.5 text-xs text-emerald-200/90 leading-relaxed list-disc list-inside">
              <li>Capture leaves in bright, natural daytime light without flash glare.</li>
              <li>Include both healthy foliage and any discolored or damaged spots.</li>
              <li>Frame the base stem or pot rim so soil condition is visible.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
