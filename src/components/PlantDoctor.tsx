import React, { useState } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  Camera,
  Upload,
  X,
  Volume2,
  Pause,
} from 'lucide-react';

interface PlantDoctorProps {
  onAskChatbotWithIssue: (question: string) => void;
}

const COMMON_SYMPTOMS = [
  {
    id: 'yellow_leaves',
    title: 'Yellowing Lower Leaves',
    sub: 'Old leaves turning pale yellow while top leaves remain green',
    likely: 'Overwatering or nitrogen deficit',
  },
  {
    id: 'brown_tips',
    title: 'Crispy Brown Tips',
    sub: 'Dry leaf edges curling and crisping',
    likely: 'Low relative humidity or fluoride in tap water',
  },
  {
    id: 'drooping',
    title: 'Drooping & Wilting',
    sub: 'Stems lost turgor pressure; leaves sagging',
    likely: 'Severe underwatering or root rot asphyxiation',
  },
  {
    id: 'white_spots',
    title: 'White Powdery Coating',
    sub: 'Fluffy flour-like film on upper leaf blades',
    likely: 'Powdery mildew fungal infestation',
  },
  {
    id: 'fine_webbing',
    title: 'Fine Webbing & Stippling',
    sub: 'Tiny yellowish dots on leaves with fine micro-webs underneath',
    likely: 'Spider mite infestation in dry environments',
  },
  {
    id: 'dark_spots',
    title: 'Brown Spots with Yellow Halos',
    sub: 'Circular or irregular lesions spreading on leaves',
    likely: 'Bacterial leaf spot or fungal anthracnose',
  },
];

export const PlantDoctor: React.FC<PlantDoctorProps> = ({ onAskChatbotWithIssue }) => {
  const [plantName, setPlantName] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [environment, setEnvironment] = useState('Indoor apartment, moderate filtered light');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio briefing
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSelectPreset = (symptom: typeof COMMON_SYMPTOMS[0]) => {
    setSymptoms(`${symptom.title}: ${symptom.sub}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select a valid image file (JPG, PNG).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiagnose = async () => {
    if (!symptoms.trim() && !selectedImage) {
      setErrorMsg('Please describe symptoms or upload a photo of the affected plant.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setDiagnosisResult(null);

    try {
      const response = await fetch('/api/diagnose-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plantName: plantName.trim() || 'Indoor Houseplant',
          symptoms: symptoms.trim() || 'Visual evaluation requested from attached photo.',
          environment: environment.trim(),
          imageBase64: selectedImage || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Diagnostic service failed');
      }

      const data = await response.json();
      setDiagnosisResult(data.diagnosis);
    } catch (err: any) {
      console.error('Diagnosis error:', err);
      setErrorMsg('Unable to complete diagnostic triage. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudioDiagnosis = async () => {
    if (!diagnosisResult) return;

    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
      return;
    }

    setIsAudioLoading(true);

    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Clinical plant diagnostic triage report. ${diagnosisResult.slice(0, 450)}`,
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
      console.warn('TTS playback error, falling back to speech synthesis', err);
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(diagnosisResult.slice(0, 300));
        u.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(u);
        setIsPlayingAudio(true);
      }
    } finally {
      setIsAudioLoading(false);
    }
  };


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">
          Plant Doctor Clinic & Symptom Diagnostic
        </h1>
        <p className="mt-2 text-sm text-stone-600 leading-relaxed">
          Pinpoint leaf abnormalities, root rot, fungal infections, and environmental stress with clinical triage protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Triage Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5 bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div>
            <label htmlFor="doctor-plant-name" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Plant Specimen (Optional)
            </label>
            <input
              id="doctor-plant-name"
              type="text"
              value={plantName}
              onChange={(e) => setPlantName(e.target.value)}
              placeholder="e.g. Monstera Deliciosa, Fiddle Leaf Fig, Peace Lily..."
              className="w-full text-sm text-stone-900 placeholder-stone-400 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="doctor-symptoms" className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                Observed Symptoms & Progression
              </label>
              <span className="text-[11px] text-stone-400">Click a preset below or type</span>
            </div>
            <textarea
              id="doctor-symptoms"
              rows={3}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe color changes, moisture level, leaf texture, or any visible insects..."
              className="w-full text-sm text-stone-900 placeholder-stone-400 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
            />
          </div>

          {/* Photo Upload Attachment */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Attach Leaf / Symptom Photo (Multimodal Diagnosis)
            </label>
            {selectedImage ? (
              <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-stone-900/5 p-2 flex items-center gap-3">
                <img
                  src={selectedImage}
                  alt="Affected leaf preview"
                  className="w-16 h-16 object-cover rounded-xl border border-stone-200 shrink-0"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <span className="font-semibold text-emerald-900 block truncate">Photo Attached</span>
                  <span className="text-stone-500 text-[11px]">Gemini will perform visual pathology scan</span>
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition-colors"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-200 hover:border-emerald-600 rounded-2xl p-4 text-center cursor-pointer bg-stone-50/50 hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2.5 text-xs text-stone-600"
              >
                <Camera className="w-4 h-4 text-emerald-800" aria-hidden="true" />
                <span>Upload or snap a photo of damaged leaves / pests</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div>
            <label htmlFor="doctor-environment" className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Growing Environment & Care History
            </label>
            <input
              id="doctor-environment"
              type="text"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              placeholder="e.g. North window, drafty hallway, watered every 4 days with tap water"
              className="w-full text-sm text-stone-900 placeholder-stone-400 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
            />
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleDiagnose}
            disabled={isLoading || (!symptoms.trim() && !selectedImage)}
            className={`w-full py-3.5 px-6 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs ${
              !symptoms.trim() && !selectedImage
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : isLoading
                ? 'bg-emerald-900 text-white cursor-wait opacity-90'
                : 'bg-emerald-800 hover:bg-emerald-900 text-white active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Running Botanical Pathology Triage...</span>
              </>
            ) : (
              <>
                <Stethoscope className="w-4 h-4" aria-hidden="true" />
                <span>Diagnose & Generate Rescue Plan</span>
              </>
            )}
          </button>
        </div>

        {/* Common Symptoms Library (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-sm font-semibold text-stone-900">
            Frequently Observed Symptoms
          </h2>
          <div className="space-y-2">
            {COMMON_SYMPTOMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectPreset(item)}
                className="w-full text-left p-3 rounded-xl bg-white border border-stone-200 hover:border-emerald-600 hover:shadow-xs transition-all text-xs group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-stone-900 group-hover:text-emerald-800 transition-colors">
                    {item.title}
                  </h3>
                  <span className="text-[10px] text-stone-400 group-hover:text-emerald-700">Select</span>
                </div>
                <p className="text-stone-500 mt-0.5">{item.sub}</p>
                <p className="text-[11px] text-emerald-800 font-medium mt-1">
                  Suspected: {item.likely}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clinical Diagnostic Result Output */}
      {diagnosisResult && (
        <div className="bg-white border border-emerald-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2.5 text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <h2 className="text-lg font-bold tracking-tight">Clinical Diagnostic Findings</h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Audio Listen Button */}
              <button
                onClick={handlePlayAudioDiagnosis}
                disabled={isAudioLoading}
                className="text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 border border-emerald-200/60"
              >
                {isAudioLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : isPlayingAudio ? (
                  <Pause className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                )}
                <span>{isPlayingAudio ? 'Pause Voice' : 'Listen Aloud'}</span>
              </button>

              <button
                onClick={() => onAskChatbotWithIssue(`Here is my plant diagnosis for ${plantName || 'my plant'}: ${diagnosisResult}. Can you give me step-by-step guidance?`)}
                className="text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 border border-emerald-200/60"
              >
                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Discuss in AI Chat</span>
              </button>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-line space-y-2">
            {diagnosisResult}
          </div>
        </div>
      )}
    </div>
  );
};
