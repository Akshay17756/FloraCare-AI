import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Trash2,
  X,
  Stethoscope,
  Compass,
  Zap,
} from 'lucide-react';
import { ChatMessage, ChatRoleConfig, ChatRoleId, PlantIdentification } from '../types/gardening.ts';

const CHAT_ROLES: ChatRoleConfig[] = [
  {
    id: 'botanist',
    name: 'Dr. Flora',
    title: 'Master Botanist & Pathologist',
    model: 'gemini-3.8-flash',
    description: 'Complex botanical pathology, cellular diagnostics, soil chemistry, and emergency rescue protocols.',
    tagline: 'Deep Scientific Diagnostic',
    systemInstruction:
      'You are Dr. Flora, a world-class Master Botanist and Plant Pathologist. Answer with scientific depth and actionable care.',
    sampleQuestions: [
      'What causes brown crispy leaf tips on indoor aroids?',
      'How do I definitively diagnose root rot vs underwatering?',
      'What soil pH is required for micronutrient absorption?',
      'How can I eradicate spider mites without harsh chemicals?',
    ],
  },
  {
    id: 'care_guide',
    name: 'Willow',
    title: 'Garden Care Companion',
    model: 'gemini-3.8-flash',
    description: 'Everyday watering routines, seasonal pruning, repotting, and companion planting guidance.',
    tagline: 'Practical Everyday Gardening',
    systemInstruction:
      'You are Willow, an encouraging garden care guide. Give clear, friendly, structured advice.',
    sampleQuestions: [
      'How should I adjust my watering routine in winter?',
      'What is the best way to repot a root-bound plant?',
      'Can you recommend companion herbs for a balcony garden?',
      'How do I prune leggy stems to stimulate bushier growth?',
    ],
  },
  {
    id: 'quick_tips',
    name: 'Sprout',
    title: 'Instant Botanical Facts',
    model: 'gemini-3.1-flash-lite',
    description: 'Rapid-fire answers, pet toxicity verification, sunlight requirements, and fast facts in seconds.',
    tagline: 'Fast Answers in 2-3 Sentences',
    systemInstruction:
      'You are Sprout, a fast botanical assistant. Keep responses strictly concise (2-3 sentences max).',
    sampleQuestions: [
      'Is Fiddle Leaf Fig safe around cats?',
      'Can I root basil cuttings in plain water?',
      'Does Snake Plant need direct sunlight?',
      'How often should I fertilize succulents?',
    ],
  },
];

interface GardeningChatProps {
  currentPlantContext?: PlantIdentification | null;
  onClearPlantContext: () => void;
}

export const GardeningChat: React.FC<GardeningChatProps> = ({
  currentPlantContext,
  onClearPlantContext,
}) => {
  const [selectedRole, setSelectedRole] = useState<ChatRoleId>('botanist');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome-1',
        role: 'model',
        content:
          "Hello! I'm Dr. Flora, your AI Botanical Specialist. I can diagnose leaf symptoms, analyze soil conditions, formulate watering schedules, and guide you through complex plant care. How can I help your garden today?",
        timestamp: Date.now(),
        roleId: 'botanist',
      },
    ];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeRoleConfig = CHAT_ROLES.find((r) => r.id === selectedRole) || CHAT_ROLES[0];

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      roleId: selectedRole,
      plantContextName: currentPlantContext?.commonName,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      // Send conversation history to backend Gemini API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          roleId: selectedRole,
          plantContext: currentPlantContext
            ? {
                commonName: currentPlantContext.commonName,
                scientificName: currentPlantContext.scientificName,
                family: currentPlantContext.family,
                healthStatus: currentPlantContext.healthStatus,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to get answer from AI');
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: data.reply,
        timestamp: Date.now(),
        roleId: selectedRole,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: `Error: ${err.message || 'Unable to contact botanical server. Please try again.'}`,
        timestamp: Date.now(),
        roleId: selectedRole,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (roleId: ChatRoleId) => {
    setSelectedRole(roleId);
    const newConfig = CHAT_ROLES.find((r) => r.id === roleId)!;
    // Add brief intro greeting from the newly selected specialist
    const introMsg: ChatMessage = {
      id: `switch-${Date.now()}`,
      role: 'model',
      content: `I'm ${newConfig.name} (${newConfig.title}). ${newConfig.description}`,
      timestamp: Date.now(),
      roleId: roleId,
    };
    setMessages((prev) => [...prev, introMsg]);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `fresh-${Date.now()}`,
        role: 'model',
        content: `Conversation refreshed. How may ${activeRoleConfig.name} assist your plants?`,
        timestamp: Date.now(),
        roleId: selectedRole,
      },
    ]);
  };

  // Basic formatting helper for clean bolding and bullet lists
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      // Header lines
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-bold text-stone-900 mt-2 mb-1 text-sm">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="font-bold text-stone-900 mt-3 mb-1 text-base">
            {line.replace('## ', '')}
          </h3>
        );
      }
      // Bullet list items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const bulletContent = line.trim().substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-stone-800 leading-relaxed my-0.5">
            <span
              dangerouslySetInnerHTML={{
                __html: bulletContent
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>'),
              }}
            />
          </li>
        );
      }
      // Numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <li key={idx} className="ml-4 list-decimal text-stone-800 leading-relaxed my-0.5">
            <span
              dangerouslySetInnerHTML={{
                __html: line
                  .replace(/^\d+\.\s/, '')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>'),
              }}
            />
          </li>
        );
      }
      // Standard paragraph
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p
          key={idx}
          className="leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: line
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>'),
          }}
        />
      );
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-10rem)] min-h-[620px] flex flex-col">
      {/* Top Controls: Role Selection Tabs & Context Pill */}
      <div className="bg-white border border-stone-200 rounded-2xl p-3.5 mb-4 shadow-xs shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Functional Segmented Role Selector */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => handleRoleChange('botanist')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                selectedRole === 'botanist'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>Dr. Flora</span>
              <span className="hidden lg:inline text-[10px] text-stone-400 font-normal">(Pathologist)</span>
            </button>

            <button
              onClick={() => handleRoleChange('care_guide')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                selectedRole === 'care_guide'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              <span>Willow</span>
              <span className="hidden lg:inline text-[10px] text-stone-400 font-normal">(Care Guide)</span>
            </button>

            <button
              onClick={() => handleRoleChange('quick_tips')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                selectedRole === 'quick_tips'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
              <span>Sprout</span>
              <span className="hidden lg:inline text-[10px] text-stone-400 font-normal">(Fast Facts)</span>
            </button>
          </div>

          {/* Right Action: Clear history */}
          <button
            onClick={handleClearHistory}
            className="text-xs text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1.5 self-end sm:self-auto py-1 px-2"
            title="Start fresh conversation"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear Chat</span>
          </button>
        </div>

        {/* Active Role Description */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-stone-600 gap-2 pt-1 border-t border-stone-100">
          <div>
            <span className="font-semibold text-stone-900">{activeRoleConfig.name}</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>{activeRoleConfig.description}</span>
          </div>

          {/* Plant Context Pill (if user came from plant inspection) */}
          {currentPlantContext && (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-lg shrink-0">
              <span className="font-medium">Specimen: {currentPlantContext.commonName}</span>
              <button
                onClick={onClearPlantContext}
                className="text-emerald-700 hover:text-emerald-950 p-0.5 rounded"
                title="Clear specimen context"
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Conversation Thread */}
      <div className="flex-1 overflow-y-auto bg-stone-50/60 border border-stone-200 rounded-2xl p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 max-w-3xl ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isUser
                    ? 'bg-emerald-800 text-white'
                    : 'bg-white border border-stone-200 text-emerald-800 shadow-2xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-xs ${
                  isUser
                    ? 'bg-emerald-800 text-white rounded-tr-xs'
                    : 'bg-white border border-stone-200/90 text-stone-800 rounded-tl-xs'
                }`}
              >
                {!isUser && msg.roleId && (
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800 mb-1">
                    {CHAT_ROLES.find((r) => r.id === msg.roleId)?.name || 'Botanist'}
                  </div>
                )}
                {isUser && msg.plantContextName && (
                  <div className="text-[10px] text-emerald-200 mb-1">
                    Context: {msg.plantContextName}
                  </div>
                )}
                <div className="space-y-1">{renderFormattedText(msg.content)}</div>
                <div
                  className={`text-[10px] mt-1.5 text-right ${
                    isUser ? 'text-emerald-200' : 'text-stone-400'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 max-w-md mr-auto">
            <div className="w-8 h-8 rounded-full bg-white border border-stone-200 text-emerald-800 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-stone-500 flex items-center gap-2 shadow-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
              <span>{activeRoleConfig.name} is examining botanical factors...</span>
            </div>
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* Suggested Questions Pills */}
      <div className="py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[11px] text-stone-400 uppercase tracking-wider shrink-0 font-medium">
          Suggested:
        </span>
        {activeRoleConfig.sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="text-xs px-3 py-1 bg-white border border-stone-200 hover:border-emerald-600 hover:text-emerald-800 text-stone-700 rounded-lg whitespace-nowrap shrink-0 transition-colors shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="mt-1 flex items-center gap-2 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Ask ${activeRoleConfig.name} about symptoms, soil, watering, or pruning...`}
          disabled={isLoading}
          className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all shadow-xs"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className={`h-11 px-5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shrink-0 ${
            !inputValue.trim() || isLoading
              ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
              : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs active:scale-[0.98]'
          }`}
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
};
