import React from 'react';
import { 
  BookOpen, 
  Layers, 
  Lightbulb, 
  ShieldAlert, 
  Server, 
  Cpu, 
  GitBranch, 
  Workflow, 
  FileCheck2,
  HardDrive,
  Zap,
  ArrowDown,
  Database,
  UserCheck,
  Code
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const AboutProjectView: React.FC = () => {
  const { isDark } = useTheme();

  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textTitle = isDark ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Title Card */}
      <div className={`${cardBg} border rounded-xl p-6 shadow-sm`}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-500 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
            Academic Project Demonstration
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Smart Grid Analytics & Decision Support
          </span>
        </div>
        <h2 className={`text-xl font-bold mt-3 ${textTitle}`}>
          AI-Driven Electricity Consumption Anomaly Detection and Investigation using Big Data and Agentic AI
        </h2>
        <p className={`text-xs mt-2 leading-relaxed ${textMuted}`}>
          An end-to-end decision-support prototype for electricity distribution utilities that integrates 
          high-dimensional time-series anomaly detection with an Agentic AI reasoning layer to explain anomalies 
          and guide field verification teams.
        </p>
      </div>

      {/* Problem, Solution, Contribution, Limitation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Problem */}
        <div className={`${cardBg} border rounded-xl p-6 space-y-2.5`}>
          <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <h3>PROBLEM</h3>
          </div>
          <p className={`text-xs leading-relaxed ${textMuted}`}>
            Electricity distribution utilities need to review large volumes of consumer consumption records to identify 
            unusual behaviour that may require investigation. Conventional thresholding produces unmanageable false positives, 
            while pure machine-learning flags lack human-interpretable explanations.
          </p>
        </div>

        {/* Proposed Solution */}
        <div className={`${cardBg} border rounded-xl p-6 space-y-2.5`}>
          <div className="flex items-center gap-2 text-sky-500 font-bold text-sm">
            <Lightbulb className="w-4 h-4" />
            <h3>PROPOSED SOLUTION</h3>
          </div>
          <p className={`text-xs leading-relaxed ${textMuted}`}>
            The system combines consumption anomaly detection with an Agentic AI investigation layer that interprets detected anomalies, 
            analyzes context, generates explanations, assigns investigation priority and recommends verification actions.
          </p>
        </div>

        {/* Key Contribution */}
        <div className={`${cardBg} border rounded-xl p-6 space-y-2.5`}>
          <div className="flex items-center gap-2 text-purple-500 font-bold text-sm">
            <Workflow className="w-4 h-4" />
            <h3>KEY CONTRIBUTION</h3>
          </div>
          <p className={`text-xs leading-relaxed ${textMuted}`}>
            The key contribution is the <strong>integration of anomaly detection with an Agentic AI investigation layer</strong>. 
            Instead of stopping after detecting an anomaly, the system attempts to explain the anomaly and support the next investigation step.
          </p>
        </div>

        {/* System Limitation */}
        <div className={`border rounded-xl p-6 space-y-2.5 ${
          isDark
            ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
            <FileCheck2 className="w-4 h-4" />
            <h3>LIMITATION</h3>
          </div>
          <p className="text-xs leading-relaxed">
            The system is a decision-support prototype. <strong>It does not prove electricity theft.</strong> Physical and 
            technical verification are required. Legitimate explanations (vacations, factory closures, solar backfeed, meter hardware faults) 
            frequently present identical load signatures.
          </p>
        </div>
      </div>

      {/* Proposed Big Data Scalable Architecture */}
      <div className={`${cardBg} border rounded-xl p-6 space-y-5`}>
        <div>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
            <Server className="w-4 h-4 text-sky-500" />
            Scalable Big Data Production Architecture
          </h3>
          <p className={`text-xs ${textMuted} mt-1`}>
            Proposed production pipeline for processing millions of smart meter data streams in a distributed grid infrastructure:
          </p>
        </div>

        {/* Scalable Architecture Flow Diagram */}
        <div className={`p-5 rounded-lg border text-xs font-mono overflow-x-auto ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex flex-col items-center gap-2 text-center max-w-xl mx-auto py-2">
            <div className="px-4 py-2 rounded-lg bg-slate-800 text-slate-100 border border-slate-700 w-64 shadow-xs">
              Large-Scale Electricity Data
            </div>
            <ArrowDown className="w-4 h-4 text-sky-500" />

            <div className="px-4 py-2 rounded-lg bg-slate-800 text-sky-300 border border-slate-700 w-64 shadow-xs">
              HDFS (Distributed Storage)
            </div>
            <ArrowDown className="w-4 h-4 text-sky-500" />

            <div className="px-4 py-2 rounded-lg bg-slate-800 text-sky-300 border border-slate-700 w-64 shadow-xs">
              PySpark (Distributed Processing)
            </div>
            <ArrowDown className="w-4 h-4 text-sky-500" />

            <div className="px-4 py-2 rounded-lg bg-slate-800 text-indigo-300 border border-slate-700 w-64 shadow-xs">
              Feature Engineering
            </div>
            <ArrowDown className="w-4 h-4 text-sky-500" />

            <div className="px-4 py-2 rounded-lg bg-slate-800 text-amber-300 border border-slate-700 w-64 shadow-xs">
              Anomaly Detection (Isolation Forest)
            </div>
            <ArrowDown className="w-4 h-4 text-sky-500" />

            <div className="px-4 py-2 rounded-lg bg-slate-800 text-purple-300 border border-slate-700 w-64 shadow-xs">
              Agentic AI Investigation (Gemini / Tools)
            </div>
            <ArrowDown className="w-4 h-4 text-sky-500" />

            <div className="px-4 py-2 rounded-lg bg-slate-800 text-emerald-300 border border-slate-700 w-64 shadow-xs">
              Dashboard (Operations Console)
            </div>
            <ArrowDown className="w-4 h-4 text-sky-500" />

            <div className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold w-64 shadow-xs">
              Human / Field Verification
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border text-xs leading-relaxed ${
          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <strong className={textTitle}>Demonstration Implementation Note:</strong> The current demo runs on Node.js / Express 
          and React using the uploaded dataset (<code className="font-mono text-sky-500">electricity_consumption_demo_under_20mb.csv</code>, 
          10,950 records across 30 meters over 365 days) so that the entire pipeline operates with near-instantaneous query times 
          and zero external distributed cluster dependencies.
        </div>
      </div>
    </div>
  );
};
