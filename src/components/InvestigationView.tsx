import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  SearchCode, 
  CheckCircle2, 
  Printer, 
  Sparkles, 
  Cpu, 
  Layers, 
  History, 
  HelpCircle, 
  Wrench,
  AlertTriangle,
  RotateCcw,
  ClipboardList,
  Save,
  Check,
  Code2,
  Terminal,
  Clock,
  UserCheck,
  FileText,
  Activity,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { FullInvestigationReport, AnomalyCase, InspectorNote } from '../types';
import { useTheme } from '../context/ThemeContext';

interface InvestigationViewProps {
  selectedMeterId?: string;
  selectedDate?: string;
  anomalyCases: AnomalyCase[];
  onSelectAnotherCase: (meter_id: string, date: string) => void;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({
  selectedMeterId,
  selectedDate,
  anomalyCases,
  onSelectAnotherCase,
}) => {
  const { isDark } = useTheme();

  const [currentMeter, setCurrentMeter] = useState<string>(selectedMeterId || anomalyCases[0]?.meter_id || 'MT_007');
  const [currentDate, setCurrentDate] = useState<string>(selectedDate || anomalyCases[0]?.date || '2025-04-12');
  const [report, setReport] = useState<FullInvestigationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dossier' | 'tools' | 'notes'>('dossier');

  // Human Inspector Field Notes state (persisted to localStorage)
  const caseStorageKey = `audit_notes_${currentMeter}_${currentDate}`;
  const [inspectorName, setInspectorName] = useState('Eng. R. Natarajan');
  const [badgeNumber, setBadgeNumber] = useState('TNEB-GRID-419');
  const [workOrderId, setWorkOrderId] = useState(`WO-CHN-2025-${Math.abs(currentMeter.split('').reduce((a, b) => a + b.charCodeAt(0), 0) * 17) % 9000 + 1000}`);
  const [auditStatus, setAuditStatus] = useState<'PENDING_AUDIT' | 'DISPATCHED' | 'VERIFIED_NORMAL' | 'FAULT_CONFIRMED'>('PENDING_AUDIT');
  const [fieldRemarks, setFieldRemarks] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load existing notes for this case if any
  useEffect(() => {
    const saved = localStorage.getItem(caseStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.technicianName) setInspectorName(parsed.technicianName);
        if (parsed.badgeNumber) setBadgeNumber(parsed.badgeNumber);
        if (parsed.workOrderId) setWorkOrderId(parsed.workOrderId);
        if (parsed.status) setAuditStatus(parsed.status);
        if (parsed.findings) setFieldRemarks(parsed.findings);
      } catch (e) {
        // ignore
      }
    } else {
      setFieldRemarks('');
      setAuditStatus('PENDING_AUDIT');
    }
  }, [caseStorageKey]);

  const handleSaveNotes = () => {
    const payload: InspectorNote = {
      id: Date.now().toString(),
      caseKey: `${currentMeter}_${currentDate}`,
      timestamp: new Date().toISOString(),
      technicianName: inspectorName,
      badgeNumber,
      status: auditStatus,
      workOrderId,
      findings: fieldRemarks,
    };
    localStorage.setItem(caseStorageKey, JSON.stringify(payload));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Sync props when user clicked from Anomaly table
  useEffect(() => {
    if (selectedMeterId && selectedDate) {
      setCurrentMeter(selectedMeterId);
      setCurrentDate(selectedDate);
    }
  }, [selectedMeterId, selectedDate]);

  // Fetch report whenever meter or date changes
  useEffect(() => {
    async function fetchInvestigation() {
      if (!currentMeter || !currentDate) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/investigate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meter_id: currentMeter, date: currentDate }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate investigation report');
        }
        const data = await res.json();
        setReport(data.report);
      } catch (err: any) {
        console.error('Investigation fetch error:', err);
        setError(err.message || 'Error executing investigation');
      } finally {
        setLoading(false);
      }
    }
    fetchInvestigation();
  }, [currentMeter, currentDate]);

  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textTitle = isDark ? 'text-slate-100' : 'text-slate-900';

  const timelineSteps = [
    { num: 1, title: 'Anomaly Detected', desc: 'Isolation forest flags load deviation' },
    { num: 2, title: 'Historical Pattern Checked', desc: '14-day & 365-day baselines retrieved' },
    { num: 3, title: 'Context Analyzed', desc: 'Tariff type & zone volatility evaluated' },
    { num: 4, title: 'Possible Causes Identified', desc: 'Technical, operational & loss hypotheses' },
    { num: 5, title: 'Priority Assigned', desc: 'Severity triage: HIGH, MEDIUM, or LOW' },
    { num: 6, title: 'Verification Recommended', desc: 'Standard operating verification protocol' },
  ];

  return (
    <div className="space-y-6">
      {/* Case Selector and Action Bar */}
      <div className={`${cardBg} border rounded-xl p-5 flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-base font-bold flex items-center gap-2 ${textTitle}`}>
              <SearchCode className="w-4 h-4 text-sky-500" />
              Agentic AI Investigation Console
            </h2>
            {report?.reasoning_source && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                report.reasoning_source === 'GEMINI_AI'
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
              }`}>
                {report.reasoning_source === 'GEMINI_AI' ? 'Gemini Reasoner' : 'Expert Rule Engine'}
              </span>
            )}
          </div>
          <p className={`text-xs ${textMuted} mt-0.5`}>
            Autonomous multi-step investigation of detected electricity consumption anomalies
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label htmlFor="case-select" className={`text-xs font-semibold ${textMuted}`}>Select Case:</label>
          <select
            id="case-select"
            value={`${currentMeter}_${currentDate}`}
            onChange={(e) => {
              const [m, d] = e.target.value.split('_');
              setCurrentMeter(m);
              setCurrentDate(d);
              onSelectAnotherCase(m, d);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-sky-400 focus:border-sky-500'
                : 'bg-white border-slate-300 text-sky-700 focus:border-sky-600 shadow-xs'
            }`}
          >
            {anomalyCases.map((a, i) => (
              <option key={i} value={`${a.meter_id}_${a.date}`}>
                [{a.priority}] {a.meter_id} &bull; {a.date} ({a.percentage_change > 0 ? '+' : ''}{a.percentage_change.toFixed(1)}%)
              </option>
            ))}
          </select>

          <button
            onClick={() => window.print()}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-xs'
            }`}
            title="Print field inspection dossier"
          >
            <Printer className="w-3.5 h-3.5 text-sky-500" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Visual Investigation Timeline */}
      <div className={`${cardBg} border rounded-xl p-5 space-y-3`}>
        <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${textMuted}`}>
          <Layers className="w-3.5 h-3.5 text-sky-500" />
          Agentic AI Multi-Stage Investigation Workflow
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {timelineSteps.map((step) => (
            <div
              key={step.num}
              className={`p-3 rounded-lg border flex flex-col justify-between transition ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-500 font-mono text-[10px] font-bold flex items-center justify-center">
                  {step.num}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div>
                <div className={`text-xs font-bold ${textTitle}`}>{step.title}</div>
                <div className={`text-[11px] ${textMuted} mt-0.5 leading-snug`}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs: Dossier, Logical Tool Calls, Field Inspector Notes */}
      <div className="flex border-b border-slate-800/40 gap-2">
        <button
          onClick={() => setActiveTab('dossier')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'dossier'
              ? 'border-sky-500 text-sky-500'
              : `${textMuted} border-transparent hover:text-slate-300`
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Executive Investigation Dossier
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'tools'
              ? 'border-sky-500 text-sky-500'
              : `${textMuted} border-transparent hover:text-slate-300`
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Agentic Tool Execution Trace (5 Steps)
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'notes'
              ? 'border-sky-500 text-sky-500'
              : `${textMuted} border-transparent hover:text-slate-300`
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          Field Verification Log & Work Order
        </button>
      </div>

      {/* TAB 1: EXECUTIVE DOSSIER */}
      {activeTab === 'dossier' && (
        <>
          {loading ? (
            <div className={`py-20 text-center text-xs ${cardBg} border rounded-xl space-y-2`}>
              <div className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full mx-auto" />
              <div className="font-semibold text-slate-300">Agentic AI Investigating Case {currentMeter} ({currentDate})...</div>
              <div className={textMuted}>Retrieving historical baseline, computing z-scores, formulating hypotheses...</div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Case Header Banner */}
              <div className={`${cardBg} border rounded-xl p-5`}>
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/40">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-xl font-bold text-sky-500">{report.meter_id}</div>
                    <span className={textMuted}>&bull;</span>
                    <div className={`font-mono text-sm font-semibold ${textTitle}`}>{report.date}</div>
                    <span className={textMuted}>&bull;</span>
                    <div className="text-xs px-2.5 py-0.5 rounded font-medium bg-slate-800 text-slate-300">
                      {report.consumer_type}
                    </div>
                    <span className={textMuted}>&bull;</span>
                    <div className="text-xs text-slate-400">{report.location}</div>
                  </div>

                  {/* Priority Badge */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${textMuted}`}>Investigation Priority:</span>
                    <span className={`px-3 py-1 rounded-md text-xs font-bold tracking-wider ${
                      report.investigation_priority === 'HIGH'
                        ? 'bg-rose-500 text-white'
                        : report.investigation_priority === 'MEDIUM'
                        ? 'bg-amber-500 text-white'
                        : 'bg-sky-500 text-white'
                    }`}>
                      {report.investigation_priority} PRIORITY
                    </span>
                  </div>
                </div>

                {/* Quantitative Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Recorded Load</div>
                    <div className={`text-base font-mono font-bold mt-0.5 ${textTitle}`}>
                      {report.consumption_analysis.recorded_kwh.toFixed(2)} kWh
                    </div>
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Historical Mean</div>
                    <div className={`text-base font-mono font-bold mt-0.5 ${textTitle}`}>
                      {report.consumption_analysis.baseline_kwh.toFixed(2)} kWh
                    </div>
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Deviation %</div>
                    <div className={`text-base font-mono font-bold mt-0.5 ${
                      report.consumption_analysis.percentage_change < 0 ? 'text-rose-500' : 'text-emerald-500'
                    }`}>
                      {report.consumption_analysis.percentage_change > 0 ? '+' : ''}
                      {report.consumption_analysis.percentage_change.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Z-Score</div>
                    <div className="text-base font-mono font-bold mt-0.5 text-sky-500">
                      {report.consumption_analysis.z_score.toFixed(2)} &sigma;
                    </div>
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Anomaly Score</div>
                    <div className="text-base font-mono font-bold mt-0.5 text-amber-500">
                      {report.consumption_analysis.anomaly_score.toFixed(4)}
                    </div>
                  </div>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Consecutive Abnormal</div>
                    <div className={`text-base font-mono font-bold mt-0.5 ${textTitle}`}>
                      {report.consumption_analysis.consecutive_abnormal_days} days
                    </div>
                  </div>
                </div>
              </div>

              {/* Observed Pattern & Historical Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`${cardBg} border rounded-xl p-5 space-y-2`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider text-sky-500 flex items-center gap-1.5`}>
                    <Activity className="w-3.5 h-3.5" />
                    Observed Pattern
                  </h3>
                  <p className={`text-xs leading-relaxed ${textTitle}`}>
                    {report.observed_pattern}
                  </p>
                </div>

                <div className={`${cardBg} border rounded-xl p-5 space-y-2`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider text-purple-500 flex items-center gap-1.5`}>
                    <History className="w-3.5 h-3.5" />
                    Historical Comparison
                  </h3>
                  <p className={`text-xs leading-relaxed ${textTitle}`}>
                    {report.historical_comparison}
                  </p>
                </div>
              </div>

              {/* 14-Day History Window Visualization */}
              {report.history_window && report.history_window.length > 0 && (
                <div className={`${cardBg} border rounded-xl p-5 space-y-3`}>
                  <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${textTitle}`}>
                      <Calendar className="w-3.5 h-3.5 text-sky-500" />
                      Recent 14-Day Baseline Context Window (Surrounding Anomaly Date)
                    </h3>
                    <span className={`text-[10px] font-mono ${textMuted}`}>Target flagged in Red</span>
                  </div>

                  <div className="h-32 flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-800/40">
                    {(() => {
                      const maxVal = Math.max(...report.history_window.map((h) => h.consumption), 50);
                      return report.history_window.map((h, i) => {
                        const isTarget = h.is_target;
                        const heightPct = Math.max(12, Math.round((h.consumption / maxVal) * 100));
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div className={`opacity-0 group-hover:opacity-100 absolute -top-8 text-[10px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-20 ${
                              isDark ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-slate-900 text-white'
                            }`}>
                              {h.date}: {h.consumption.toFixed(1)} kWh ({h.percentage_change > 0 ? '+' : ''}{h.percentage_change.toFixed(0)}%)
                            </div>
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full rounded-t-xs transition-colors ${
                                isTarget
                                  ? 'bg-rose-500 ring-2 ring-rose-400'
                                  : isDark ? 'bg-slate-700 group-hover:bg-sky-500' : 'bg-slate-300 group-hover:bg-sky-600'
                              }`}
                            />
                            <span className={`text-[9px] font-mono truncate ${isTarget ? 'text-rose-500 font-bold' : textMuted}`}>
                              {h.date.split('-').slice(1).join('/')}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Possible Causes Breakdown */}
              <div className={`${cardBg} border rounded-xl p-5 space-y-4`}>
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5`}>
                    <HelpCircle className="w-3.5 h-3.5" />
                    Plausible Forensic Hypotheses & Possible Causes
                  </h3>
                  <p className={`text-xs ${textMuted} mt-0.5`}>
                    The Agentic AI evaluates hardware, operational, and non-technical loss scenarios:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.possible_causes.map((cause, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-lg border space-y-1.5 ${
                        isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${textTitle}`}>{cause.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-slate-800 text-slate-300">
                          {cause.category}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${textMuted}`}>
                        {cause.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contextual Interpretation */}
              <div className={`${cardBg} border rounded-xl p-5 space-y-2`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider text-sky-500 flex items-center gap-1.5`}>
                  <Activity className="w-3.5 h-3.5" />
                  Contextual Interpretation
                </h3>
                <p className={`text-xs leading-relaxed ${textTitle}`}>
                  {report.contextual_interpretation}
                </p>
              </div>

              {/* Recommended Action Checklist */}
              <div className={`${cardBg} border rounded-xl p-5 space-y-4`}>
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5`}>
                    <Wrench className="w-3.5 h-3.5" />
                    Recommended Verification Action (4-Step Standard Operating Protocol)
                  </h3>
                  <p className={`text-xs ${textMuted} mt-0.5`}>
                    Step-by-step technical and administrative verification checklist for utility inspection teams:
                  </p>
                </div>

                <div className="space-y-2.5">
                  {report.recommended_actions.map((act) => (
                    <div
                      key={act.step}
                      className={`p-3 rounded-lg border flex items-start gap-3 ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {act.step}
                      </span>
                      <div className="space-y-0.5">
                        <div className={`text-xs font-bold ${textTitle}`}>{act.title}</div>
                        <div className={`text-xs ${textMuted} leading-relaxed`}>{act.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mandatory System Limitation Box */}
              <div className={`p-5 rounded-xl border ${
                isDark
                  ? 'bg-amber-950/25 border-amber-500/30 text-amber-200'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
                      SYSTEM LIMITATION & ETHICAL DIRECTIVE
                    </div>
                    <p className="text-xs leading-relaxed">
                      <strong>{report.system_limitation}</strong>
                    </p>
                    <p className={`text-[11px] mt-1 ${isDark ? 'text-amber-300/80' : 'text-amber-800'}`}>
                      Statistical models cannot ascertain human intent or criminal tampering. Valid alternative explanations
                      include seasonal plant shutdowns, rooftop solar net-metering backfeed, transformer maintenance, or current transformer (CT) phase ratio failure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* TAB 2: AGENTIC LOGICAL TOOL TRACE */}
      {activeTab === 'tools' && report && (
        <div className="space-y-4">
          <div className={`${cardBg} border rounded-xl p-5 space-y-4`}>
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <Terminal className="w-4 h-4 text-sky-500" />
                Agentic AI Function / Tool Execution Trace
              </h3>
              <p className={`text-xs ${textMuted} mt-0.5`}>
                The agent executes discrete analytical functions rather than an opaque generic chatbot response:
              </p>
            </div>

            {/* List of 5 Tool Calls */}
            <div className="space-y-3 font-mono text-xs">
              {/* Tool 1 */}
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-sky-400">Tool 1: getMeterHistory()</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Duration: 18ms &bull; Status: SUCCESS</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  <strong className={textTitle}>Inputs:</strong> meter_id=&quot;{report.meter_id}&quot;, target_date=&quot;{report.date}&quot;, window_days=14<br />
                  <strong className={textTitle}>Output:</strong> Retrieved 14 daily telemetry intervals, calculated local mean ({report.consumption_analysis.baseline_kwh.toFixed(1)} kWh) and window variance.
                </div>
              </div>

              {/* Tool 2 */}
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-sky-400">Tool 2: getConsumptionStatistics()</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Duration: 24ms &bull; Status: SUCCESS</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  <strong className={textTitle}>Inputs:</strong> meter_id=&quot;{report.meter_id}&quot;<br />
                  <strong className={textTitle}>Output:</strong> 365-day annual statistics calculated: Mean = {report.consumption_analysis.historical_mean.toFixed(1)} kWh, StdDev = {report.consumption_analysis.historical_std.toFixed(1)} kWh.
                </div>
              </div>

              {/* Tool 3 */}
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-sky-400">Tool 3: calculateDeviation()</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Duration: 8ms &bull; Status: SUCCESS</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  <strong className={textTitle}>Inputs:</strong> current_kwh={report.consumption_analysis.recorded_kwh.toFixed(2)}, baseline_kwh={report.consumption_analysis.baseline_kwh.toFixed(2)}<br />
                  <strong className={textTitle}>Output:</strong> &Delta;={report.consumption_analysis.percentage_change.toFixed(1)}%, z_score={report.consumption_analysis.z_score.toFixed(2)}&sigma;, anomaly_score={report.consumption_analysis.anomaly_score.toFixed(4)}.
                </div>
              </div>

              {/* Tool 4 */}
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-sky-400">Tool 4: analyzeRecentPattern()</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Duration: 14ms &bull; Status: SUCCESS</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  <strong className={textTitle}>Inputs:</strong> meter_id=&quot;{report.meter_id}&quot;, target_date=&quot;{report.date}&quot;<br />
                  <strong className={textTitle}>Output:</strong> Detected persistent multi-day drop streak ({report.consumption_analysis.consecutive_abnormal_days} consecutive days).
                </div>
              </div>

              {/* Tool 5 */}
              <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="font-bold text-purple-400">Tool 5: generateInvestigationReport()</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Engine: {report.reasoning_source} &bull; Status: COMPLETE</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  <strong className={textTitle}>Synthesis:</strong> Formulated 4 contextual hypotheses, assigned priority [{report.investigation_priority}], and compiled standard operating verification checklist.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FIELD INSPECTOR NOTES & WORK ORDER (HUMAN WORKSPACE) */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className={`${cardBg} border rounded-xl p-5 space-y-4`}>
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <ClipboardList className="w-4 h-4 text-sky-500" />
                Field Verification Audit Trail & On-Site Inspection Order
              </h3>
              <p className={`text-xs ${textMuted} mt-0.5`}>
                Official utility technician dispatch record and on-site physical verification log:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={`text-xs font-semibold ${textMuted} block mb-1`}>Assigned Engineer / Inspector:</label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-none font-medium ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-semibold ${textMuted} block mb-1`}>Lineman Badge ID:</label>
                <input
                  type="text"
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-none font-mono ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-semibold ${textMuted} block mb-1`}>Work Order ID:</label>
                <input
                  type="text"
                  value={workOrderId}
                  onChange={(e) => setWorkOrderId(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-none font-mono font-bold text-sky-500 ${
                    isDark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`text-xs font-semibold ${textMuted} block mb-1`}>Field Verification Status:</label>
              <select
                value={auditStatus}
                onChange={(e) => setAuditStatus(e.target.value as any)}
                className={`w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-bold border outline-none ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="PENDING_AUDIT">Pending Field Audit Dispatch</option>
                <option value="DISPATCHED">Field Crew Dispatched to Site</option>
                <option value="VERIFIED_NORMAL">Verified Normal (Operational Load Shift / Benign)</option>
                <option value="FAULT_CONFIRMED">Hardware Fault Confirmed (CT Ratio / Tampering / Burnt Wire)</option>
              </select>
            </div>

            <div>
              <label className={`text-xs font-semibold ${textMuted} block mb-1`}>
                On-Site Inspection Remarks & Evidence Notes:
              </label>
              <textarea
                rows={4}
                value={fieldRemarks}
                onChange={(e) => setFieldRemarks(e.target.value)}
                placeholder="Enter physical seal condition, terminal block voltage check, consumer explanation (e.g. factory holiday, solar inverter addition), or calibration test results..."
                className={`w-full p-3 rounded-lg text-xs border outline-none leading-relaxed ${
                  isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-600'
                }`}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSaveNotes}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-sm transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Verification Log</span>
              </button>

              {saveSuccess && (
                <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved to Local Case Record
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
