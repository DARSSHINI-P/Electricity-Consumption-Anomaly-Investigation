import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gauge, 
  Calendar, 
  AlertTriangle, 
  Activity, 
  ArrowRight, 
  Building2, 
  MapPin, 
  TrendingUp, 
  Zap,
  Info
} from 'lucide-react';
import { MeterSummary } from '../types';
import { useTheme } from '../context/ThemeContext';

interface MeterDetailResponse {
  stats: MeterSummary;
  records: Array<{
    meter_id: string;
    date: string;
    consumption: number;
    historical_average: number;
    rolling_average: number;
    percentage_change: number;
    is_anomaly: boolean;
    priority: string;
    anomaly_score: number;
  }>;
  anomalous_dates: string[];
}

interface MeterAnalysisViewProps {
  initialMeterId?: string;
  onInvestigate: (meter_id: string, date: string) => void;
}

export const MeterAnalysisView: React.FC<MeterAnalysisViewProps> = ({
  initialMeterId = 'MT_001',
  onInvestigate,
}) => {
  const { isDark } = useTheme();

  const [metersList, setMetersList] = useState<MeterSummary[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<string>(initialMeterId);
  const [meterDetail, setMeterDetail] = useState<MeterDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('ALL');
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    consumption: number;
    baseline: number;
    diff: number;
    is_anomaly: boolean;
    priority: string;
  } | null>(null);

  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textTitle = isDark ? 'text-slate-100' : 'text-slate-900';

  // Load meters list on mount
  useEffect(() => {
    async function loadMeters() {
      try {
        const res = await fetch('/api/meters');
        if (res.ok) {
          const data = await res.json();
          setMetersList(data.meters || []);
        }
      } catch (err) {
        console.error('Error loading meters:', err);
      }
    }
    loadMeters();
  }, []);

  // Load details when selected meter changes
  useEffect(() => {
    async function loadDetail() {
      if (!selectedMeterId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/meter/${selectedMeterId}`);
        if (res.ok) {
          const data = await res.json();
          setMeterDetail(data);
        }
      } catch (err) {
        console.error('Error loading meter detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [selectedMeterId]);

  // Filter records by timeframe if requested
  const displayedRecords = useMemo(() => {
    if (!meterDetail?.records) return [];
    if (timeframe === 'ALL') return meterDetail.records;
    if (timeframe === 'Q1') return meterDetail.records.filter((r) => r.date >= '2025-01-01' && r.date <= '2025-03-31');
    if (timeframe === 'Q2') return meterDetail.records.filter((r) => r.date >= '2025-04-01' && r.date <= '2025-06-30');
    if (timeframe === 'Q3') return meterDetail.records.filter((r) => r.date >= '2025-07-01' && r.date <= '2025-09-30');
    if (timeframe === 'Q4') return meterDetail.records.filter((r) => r.date >= '2025-10-01' && r.date <= '2025-12-31');
    return meterDetail.records;
  }, [meterDetail, timeframe]);

  // SVG Chart calculation
  const chartSvg = useMemo(() => {
    if (!displayedRecords || displayedRecords.length === 0) return null;

    const width = 1000;
    const height = 260;
    const padding = { top: 25, right: 30, bottom: 35, left: 55 };

    const records = displayedRecords;
    const maxVal = Math.max(...records.map((r) => r.consumption), ...records.map((r) => r.historical_average), 100) * 1.15;
    const minVal = 0;

    const points = records.map((r, i) => {
      const x = padding.left + (i / Math.max(1, records.length - 1)) * (width - padding.left - padding.right);
      const y = height - padding.bottom - ((r.consumption - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);
      const yBase = height - padding.bottom - ((r.historical_average - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);
      return { x, y, yBase, record: r };
    });

    const consumptionPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const baselinePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yBase.toFixed(1)}`).join(' ');

    const anomalyPoints = points.filter((p) => p.record.is_anomaly);

    return {
      width,
      height,
      padding,
      maxVal,
      points,
      consumptionPath,
      baselinePath,
      anomalyPoints,
    };
  }, [displayedRecords]);

  const stats = meterDetail?.stats;
  const anomaliesList = useMemo(() => {
    if (!meterDetail?.records) return [];
    return meterDetail.records.filter((r) => r.is_anomaly);
  }, [meterDetail]);

  return (
    <div className="space-y-6">
      {/* Meter Selection Header */}
      <div className={`${cardBg} border rounded-xl p-5 flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <h2 className={`text-base font-bold flex items-center gap-2 ${textTitle}`}>
            <Gauge className="w-4 h-4 text-sky-500" />
            Meter Analysis & Longitudinal Load Profiling
          </h2>
          <p className={`text-xs ${textMuted} mt-0.5`}>
            Detailed 365-day consumption trajectory, statistical baselines, and flagged anomaly dates
          </p>
        </div>

        {/* Meter Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label htmlFor="meter-select" className={`text-xs font-semibold ${textMuted}`}>Select Meter Node:</label>
          <select
            id="meter-select"
            value={selectedMeterId}
            onChange={(e) => setSelectedMeterId(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-sky-400 focus:border-sky-500'
                : 'bg-white border-slate-300 text-sky-700 focus:border-sky-600 shadow-xs'
            }`}
          >
            {metersList.map((m) => (
              <option key={m.meter_id} value={m.meter_id}>
                {m.meter_id} &bull; {m.consumer_type} ({m.location})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards: The 8 required metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Meter ID */}
        <div className={`${cardBg} border rounded-lg p-3`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Meter ID</div>
          <div className="text-base font-mono font-bold text-sky-500 mt-1">{selectedMeterId}</div>
          <div className={`text-[10px] ${textMuted} truncate`}>Smart Feeder</div>
        </div>

        {/* Consumer Type */}
        <div className={`${cardBg} border rounded-lg p-3`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Consumer Type</div>
          <div className={`text-xs font-bold mt-1 truncate ${textTitle}`}>{stats?.consumer_type || '—'}</div>
          <div className={`text-[10px] ${textMuted} flex items-center gap-1`}>
            <Building2 className="w-2.5 h-2.5 text-purple-400" /> Tariff Class
          </div>
        </div>

        {/* Location */}
        <div className={`${cardBg} border rounded-lg p-3`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Location</div>
          <div className={`text-xs font-bold mt-1 truncate ${textTitle}`}>{stats?.location || '—'}</div>
          <div className={`text-[10px] ${textMuted} flex items-center gap-1`}>
            <MapPin className="w-2.5 h-2.5 text-emerald-400" /> Chennai Grid
          </div>
        </div>

        {/* Average Consumption */}
        <div className={`${cardBg} border rounded-lg p-3`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Average Load</div>
          <div className={`text-sm font-mono font-bold mt-1 ${textTitle}`}>
            {stats ? `${stats.mean_consumption.toFixed(1)}` : '—'} <span className="text-[10px] font-normal">kWh/d</span>
          </div>
          <div className={`text-[10px] ${textMuted}`}>Daily Mean</div>
        </div>

        {/* Minimum Consumption */}
        <div className={`${cardBg} border rounded-lg p-3`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Min Load</div>
          <div className={`text-sm font-mono font-bold mt-1 text-sky-500`}>
            {stats ? `${stats.min_consumption.toFixed(1)}` : '—'} <span className="text-[10px] font-normal">kWh/d</span>
          </div>
          <div className={`text-[10px] ${textMuted}`}>Lowest Record</div>
        </div>

        {/* Maximum Consumption */}
        <div className={`${cardBg} border rounded-lg p-3`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Max Load</div>
          <div className={`text-sm font-mono font-bold mt-1 text-amber-500`}>
            {stats ? `${stats.max_consumption.toFixed(1)}` : '—'} <span className="text-[10px] font-normal">kWh/d</span>
          </div>
          <div className={`text-[10px] ${textMuted}`}>Peak Demand</div>
        </div>

        {/* Total Consumption */}
        <div className={`${cardBg} border rounded-lg p-3`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Total Load</div>
          <div className={`text-sm font-mono font-bold mt-1 ${textTitle}`}>
            {stats ? `${Math.round(stats.total_kwh).toLocaleString()}` : '—'} <span className="text-[10px] font-normal">kWh</span>
          </div>
          <div className={`text-[10px] ${textMuted}`}>Annual Sum</div>
        </div>

        {/* Number of Anomalies */}
        <div className={`${cardBg} border rounded-lg p-3`}>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${textMuted}`}>Anomalies</div>
          <div className="text-sm font-mono font-bold text-rose-500 mt-1">
            {stats?.anomalies_count !== undefined ? stats.anomalies_count : '—'}
          </div>
          <div className={`text-[10px] text-rose-500/80`}>Flagged Days</div>
        </div>
      </div>

      {/* Interactive Consumption Trend Chart */}
      <div className={`${cardBg} border rounded-xl p-5 space-y-4`}>
        <div className={`flex flex-wrap items-center justify-between pb-3 border-b gap-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
              <TrendingUp className="w-4 h-4 text-sky-500" />
              Interactive Daily Consumption Trajectory vs Baseline
            </h3>
            <p className={`text-xs ${textMuted} mt-0.5`}>
              Blue line: Recorded consumption &bull; Grey dashed line: Historical mean baseline &bull; Highlighted dots: Anomalous events
            </p>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold mr-1 ${textMuted}`}>Window:</span>
            {(['ALL', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                  timeframe === tf
                    ? 'bg-sky-600 text-white border-sky-600'
                    : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {tf === 'ALL' ? 'Full Year (365d)' : tf}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Visualization Canvas */}
        {loading ? (
          <div className={`h-64 flex items-center justify-center text-xs ${textMuted}`}>
            Loading meter telemetry records...
          </div>
        ) : chartSvg ? (
          <div className="relative">
            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                className={`absolute top-2 right-4 text-xs font-mono p-3 rounded-lg border shadow-lg z-20 space-y-1 pointer-events-none ${
                  isDark ? 'bg-slate-800/95 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <div className="font-bold flex items-center justify-between gap-3">
                  <span>{hoveredPoint.date}</span>
                  {hoveredPoint.is_anomaly && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      [{hoveredPoint.priority}] ANOMALY
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  Recorded Load: <strong className={textTitle}>{hoveredPoint.consumption.toFixed(2)} kWh</strong>
                </div>
                <div className="text-[11px] text-slate-400">
                  Historical Mean: <strong>{hoveredPoint.baseline.toFixed(2)} kWh</strong>
                </div>
                <div className={`text-[11px] font-bold ${hoveredPoint.diff < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  Deviation: {hoveredPoint.diff > 0 ? '+' : ''}{hoveredPoint.diff.toFixed(1)}%
                </div>
              </div>
            )}

            <svg
              viewBox={`0 0 ${chartSvg.width} ${chartSvg.height}`}
              className="w-full h-64 overflow-visible"
            >
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = chartSvg.height - chartSvg.padding.bottom - pct * (chartSvg.height - chartSvg.padding.top - chartSvg.padding.bottom);
                const val = (pct * chartSvg.maxVal).toFixed(0);
                return (
                  <g key={i}>
                    <line
                      x1={chartSvg.padding.left}
                      y1={y}
                      x2={chartSvg.width - chartSvg.padding.right}
                      y2={y}
                      stroke={isDark ? '#1e293b' : '#e2e8f0'}
                      strokeDasharray="3 3"
                    />
                    <text
                      x={chartSvg.padding.left - 8}
                      y={y + 4}
                      fill={isDark ? '#64748b' : '#94a3b8'}
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Baseline Path (Dashed) */}
              <path
                d={chartSvg.baselinePath}
                fill="none"
                stroke={isDark ? '#475569' : '#94a3b8'}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Consumption Path (Solid Blue) */}
              <path
                d={chartSvg.consumptionPath}
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
              />

              {/* Anomalous Points Markers */}
              {chartSvg.anomalyPoints.map((pt, i) => {
                const isHigh = pt.record.priority === 'HIGH';
                return (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHigh ? 5 : 4}
                      fill={isHigh ? '#f43f5e' : '#f59e0b'}
                      stroke={isDark ? '#0f172a' : '#ffffff'}
                      strokeWidth="1.5"
                      className="cursor-pointer hover:r-6 transition-all"
                      onMouseEnter={() =>
                        setHoveredPoint({
                          date: pt.record.date,
                          consumption: pt.record.consumption,
                          baseline: pt.record.historical_average,
                          diff: pt.record.percentage_change,
                          is_anomaly: true,
                          priority: pt.record.priority,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => onInvestigate(selectedMeterId, pt.record.date)}
                    />
                  </g>
                );
              })}
            </svg>
            <div className={`flex items-center justify-between text-[11px] font-mono px-4 pt-1 ${textMuted}`}>
              <span>{displayedRecords[0]?.date || ''}</span>
              <span>Click any highlighted anomaly marker to launch Agentic AI investigation</span>
              <span>{displayedRecords[displayedRecords.length - 1]?.date || ''}</span>
            </div>
          </div>
        ) : (
          <div className={`h-64 flex items-center justify-center text-xs ${textMuted}`}>
            No telemetry records available for this meter.
          </div>
        )}
      </div>

      {/* Detected Anomalies for Selected Meter Table */}
      <div className={`${cardBg} border rounded-xl p-5`}>
        <div className={`flex items-center justify-between mb-4 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Flagged Anomaly Dates for Meter {selectedMeterId} ({anomaliesList.length})
            </h3>
            <p className={`text-xs ${textMuted} mt-0.5`}>
              All isolated variance points exceeding the unsupervised detection boundary
            </p>
          </div>
        </div>

        {anomaliesList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400 bg-slate-950/40' : 'border-slate-200 text-slate-500 bg-slate-50'}`}>
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Daily Load</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Baseline Mean</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Deviation</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Anomaly Score</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Priority</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {anomaliesList.map((a, i) => (
                  <tr key={i} className={`transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                    <td className={`py-2 px-3 font-mono font-bold ${textTitle}`}>{a.date}</td>
                    <td className={`py-2 px-3 font-mono text-right font-semibold ${textTitle}`}>{a.consumption.toFixed(2)} kWh</td>
                    <td className={`py-2 px-3 font-mono text-right ${textMuted}`}>{a.historical_average.toFixed(2)} kWh</td>
                    <td className={`py-2 px-3 font-mono font-bold text-right ${a.percentage_change < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {a.percentage_change > 0 ? '+' : ''}{a.percentage_change.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 font-mono text-center">{a.anomaly_score.toFixed(4)}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.priority === 'HIGH'
                          ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                          : a.priority === 'MEDIUM'
                          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          : 'bg-sky-500/15 text-sky-500 border border-sky-500/30'
                      }`}>
                        {a.priority}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => onInvestigate(selectedMeterId, a.date)}
                        className="px-2.5 py-1 text-xs font-semibold text-sky-600 hover:text-sky-500 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Investigate</span>
                        <span>&rarr;</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={`py-8 text-center text-xs ${textMuted}`}>
            No anomalies flagged for meter {selectedMeterId}. Consumption is within normal baseline parameters.
          </div>
        )}
      </div>
    </div>
  );
};
