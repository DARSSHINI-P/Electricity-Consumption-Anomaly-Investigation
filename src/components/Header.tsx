import React from 'react';
import { Download, AlertCircle, Cpu, Sparkles, Moon, Sun, Database } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  geminiActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ geminiActive }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className={`${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200'} border-b shrink-0 transition-colors duration-150`}>
      {/* Top Application Bar */}
      <div className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Title and Subtitle as per project requirements */}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className={`text-base font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              AI-Driven Electricity Consumption Anomaly Detection and Investigation
            </h1>
            <span className={isDark ? 'text-slate-600' : 'text-slate-300'} aria-hidden="true">|</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isDark ? 'bg-slate-800 text-sky-300 border border-slate-700/80' : 'bg-sky-50 text-sky-700 border border-sky-200'}`}>
              Big Data + Anomaly Detection + Agentic AI Decision Support
            </span>
          </div>
          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-1 flex-wrap`}>
            <span className="flex items-center gap-1 font-mono">
              <Database className="w-3 h-3 text-sky-500" />
              electricity_consumption_demo_under_20mb.csv
            </span>
            <span aria-hidden="true">&bull;</span>
            <span>30 Meters (Residential, Commercial, Industrial, Institutional)</span>
            <span aria-hidden="true">&bull;</span>
            <span>365 Days (10,950 Records)</span>
            <span aria-hidden="true">&bull;</span>
            <span>Isolation Forest Pipeline</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* AI Reasoner Status Badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
            geminiActive
              ? isDark
                ? 'bg-purple-950/40 text-purple-300 border-purple-800/60'
                : 'bg-purple-50 text-purple-700 border-purple-200'
              : isDark
                ? 'bg-slate-800/80 text-sky-300 border-slate-700'
                : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            {geminiActive ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Gemini API (Server-Side)</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-sky-500" />
                <span>Deterministic Fallback Engine</span>
              </>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-md border text-xs flex items-center gap-1.5 transition-colors ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
            aria-label="Toggle visual theme"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            <span className="hidden sm:inline font-medium">{isDark ? 'Light' : 'Dark'}</span>
          </button>

          {/* Direct Codebase ZIP Export */}
          <a
            href="/api/download-zip"
            download="Electricity-Anomaly-Investigation.zip"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md shadow-sm transition-colors whitespace-nowrap"
            title="Download complete project codebase and dataset (.zip)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Project (.zip)</span>
          </a>
        </div>
      </div>

      {/* Authoritative Field Verification Protocol Notice */}
      <div className={`px-6 py-2 text-xs border-t transition-colors ${
        isDark
          ? 'bg-amber-950/25 border-amber-500/20 text-amber-200/90'
          : 'bg-amber-50/90 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-start sm:items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <strong className={isDark ? 'text-amber-300 font-semibold' : 'text-amber-950 font-bold'}>
              Standard Operating Procedure:
            </strong>{' '}
            All highlighted flags indicate statistical variance from historical baseline load.{' '}
            <span className={`font-semibold underline ${isDark ? 'text-amber-200 decoration-amber-400/50' : 'text-amber-950 decoration-amber-600/50'}`}>
              An anomaly does not prove electricity theft. Human and technical verification are required.
            </span>{' '}
            Verify meter condition, utility billing history, and physical operating conditions prior to field enforcement.
          </p>
        </div>
      </div>
    </header>
  );
};
