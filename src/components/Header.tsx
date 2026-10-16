import React from 'react';
import { Camera, Sparkles } from 'lucide-react';

export type ActiveTab = 'identify' | 'care' | 'chat' | 'garden' | 'doctor' | 'automations';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  gardenCount: number;
  activeRulesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  gardenCount,
  activeRulesCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 border-b border-stone-200 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onSelectTab('identify')}
          className="text-lg font-bold tracking-tight text-emerald-950 hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded"
          aria-label="FloraCare AI Home"
        >
          <span className="text-emerald-700">Flora</span>Care AI
        </button>

        {/* Zone 2: Navigation links */}
        <nav
          className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600"
          aria-label="Main Navigation"
        >
          <button
            onClick={() => onSelectTab('identify')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'identify'
                ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700'
                : 'hover:text-stone-900'
            }`}
          >
            Identify Plant
          </button>
          <button
            onClick={() => onSelectTab('care')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'care'
                ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700'
                : 'hover:text-stone-900'
            }`}
          >
            Care Guide
          </button>
          <button
            onClick={() => onSelectTab('chat')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'chat'
                ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700'
                : 'hover:text-stone-900'
            }`}
          >
            AI Botanist Chat
          </button>
          <button
            onClick={() => onSelectTab('garden')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'garden'
                ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700'
                : 'hover:text-stone-900'
            }`}
          >
            <span>My Garden</span>
            {gardenCount > 0 && (
              <span className="text-xs text-stone-500 tabular-nums">({gardenCount})</span>
            )}
          </button>
          <button
            onClick={() => onSelectTab('automations')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'automations'
                ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700'
                : 'hover:text-stone-900'
            }`}
          >
            <span>AI Automations</span>
            {activeRulesCount > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                {activeRulesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onSelectTab('doctor')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'doctor'
                ? 'text-emerald-800 font-semibold border-b-2 border-emerald-700'
                : 'hover:text-stone-900'
            }`}
          >
            Plant Doctor
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('identify')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] transition-all rounded-lg shadow-sm whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            <Camera className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Identify Photo</span>
          </button>
        </div>
      </div>

      {/* Mobile Secondary Navigation Row */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-stone-100 no-scrollbar bg-stone-50/50">
        <button
          onClick={() => onSelectTab('identify')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'identify'
              ? 'bg-emerald-800 text-white'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Identify
        </button>
        <button
          onClick={() => onSelectTab('care')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'care'
              ? 'bg-emerald-800 text-white'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Care Guide
        </button>
        <button
          onClick={() => onSelectTab('chat')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'chat'
              ? 'bg-emerald-800 text-white'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          AI Chat
        </button>
        <button
          onClick={() => onSelectTab('garden')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'garden'
              ? 'bg-emerald-800 text-white'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Garden ({gardenCount})
        </button>
        <button
          onClick={() => onSelectTab('automations')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'automations'
              ? 'bg-emerald-800 text-white'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Automations
        </button>
        <button
          onClick={() => onSelectTab('doctor')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'doctor'
              ? 'bg-emerald-800 text-white'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Doctor
        </button>
      </div>
    </header>
  );
};
