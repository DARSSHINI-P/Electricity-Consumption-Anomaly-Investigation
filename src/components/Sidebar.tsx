import React from 'react';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Gauge, 
  FileSearch, 
  BookOpen, 
  Download,
  Database,
  Activity,
  Zap,
  FolderArchive
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  anomaliesCount: number;
  highPriorityCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  anomaliesCount,
  highPriorityCount,
}) => {
  const { isDark } = useTheme();

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'anomalies',
      label: 'Anomaly Cases',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: anomaliesCount > 0 ? anomaliesCount : undefined,
    },
    {
      id: 'meters',
      label: 'Meter Analysis',
      icon: <Gauge className="w-4 h-4" />,
    },
    {
      id: 'investigation',
      label: 'AI Investigation',
      icon: <FileSearch className="w-4 h-4" />,
      badge: highPriorityCount > 0 ? `${highPriorityCount} High` : undefined,
    },
    {
      id: 'about',
      label: 'About Project',
      icon: <BookOpen className="w-4 h-4" />,
    },
  ];

  return (
    <aside className={`w-64 flex flex-col shrink-0 min-h-screen border-r transition-colors duration-150 ${
      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
    }`}>
      {/* Brand & System Identifier */}
      <div className={`p-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Zap className="w-5 h-5 fill-white/20" />
          </div>
          <div className="min-w-0">
            <div className={`text-xs font-bold uppercase tracking-wider truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Grid Anomaly AI
            </div>
            <div className={`text-[11px] font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Utility Decision Support
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1 flex-1">
        <div className={`px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          System Navigation
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? isDark
                    ? 'bg-slate-800 text-sky-300 font-semibold border-l-2 border-sky-400 rounded-l-none'
                    : 'bg-white text-sky-700 font-semibold shadow-sm border-l-2 border-sky-600 rounded-l-none'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-semibold ${
                    typeof item.badge === 'string' && item.badge.includes('High')
                      ? isDark
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-800/60'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                      : isActive
                        ? isDark
                          ? 'bg-slate-700 text-sky-200'
                          : 'bg-sky-100 text-sky-800'
                        : isDark
                          ? 'bg-slate-800/80 text-slate-400'
                          : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Dataset Details & Project Archive Box */}
      <div className={`p-3.5 border-t space-y-2.5 ${isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-100/70'}`}>
        <div className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 ${
          isDark ? 'border-slate-800 bg-slate-900/60 text-slate-400' : 'border-slate-200 bg-white text-slate-600'
        }`}>
          <div className={`flex items-center justify-between font-semibold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-sky-500" />
              Source Dataset
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Loaded
            </span>
          </div>
          <div className="font-mono text-[10px] text-slate-400 truncate" title="electricity_consumption_demo_under_20mb.csv">
            demo_under_20mb.csv
          </div>
          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/50">
            <span>30 Meters</span>
            <span className="font-mono">10,950 Records</span>
          </div>
        </div>

        {/* Quick Zip Download for user */}
        <a
          href="/api/download-zip"
          download="Electricity-Anomaly-Investigation.zip"
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-xs'
          }`}
        >
          <FolderArchive className="w-3.5 h-3.5 text-sky-500" />
          <span>Project Codebase (.zip)</span>
        </a>

        <div className={`text-[10px] text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Academic Demo &bull; Decision Support
        </div>
      </div>
    </aside>
  );
};
