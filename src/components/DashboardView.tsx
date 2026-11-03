import React from 'react';
import { 
  Activity, 
  Database, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  MapPin, 
  Building2, 
  PieChart, 
  Calendar,
  ArrowRight
} from 'lucide-react';
import { KpiSummary, ChartDataSets, AnomalyCase } from '../types';
import { useTheme } from '../context/ThemeContext';

interface DashboardViewProps {
  kpi: KpiSummary | null;
  charts: ChartDataSets | null;
  recentAnomalies: AnomalyCase[];
  onSelectAnomaly: (meter_id: string, date: string) => void;
  onNavigateToAnomalies: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  kpi,
  charts,
  recentAnomalies,
  onSelectAnomaly,
  onNavigateToAnomalies,
}) => {
  const { isDark } = useTheme();

  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textTitle = isDark ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Meters */}
        <div className={`${cardBg} border rounded-xl p-5 transition-all`}>
          <div className={`flex items-center justify-between ${textMuted} text-xs font-semibold uppercase tracking-wider mb-2`}>
            <span>Total Meters</span>
            <div className={`p-1.5 rounded-md ${isDark ? 'bg-slate-800 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-mono tabular-nums font-bold ${textTitle}`}>
            {kpi ? kpi.total_meters : '30'}
          </div>
          <div className={`text-xs ${textMuted} mt-2 flex items-center gap-1.5`}>
            <span>Chennai 5 Zones</span>
            <span aria-hidden="true">&bull;</span>
            <span className="text-emerald-500 font-medium">100% Active Feeder Telemetry</span>
          </div>
        </div>

        {/* Total Records */}
        <div className={`${cardBg} border rounded-xl p-5 transition-all`}>
          <div className={`flex items-center justify-between ${textMuted} text-xs font-semibold uppercase tracking-wider mb-2`}>
            <span>Total Records</span>
            <div className={`p-1.5 rounded-md ${isDark ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-mono tabular-nums font-bold ${textTitle}`}>
            {kpi ? kpi.total_records.toLocaleString() : '10,950'}
          </div>
          <div className={`text-xs ${textMuted} mt-2 flex items-center gap-1.5`}>
            <span>365 Consecutive Days</span>
            <span aria-hidden="true">&bull;</span>
            <span>CY 2025 Daily Intervals</span>
          </div>
        </div>

        {/* Total Anomalies */}
        <div className={`${cardBg} border rounded-xl p-5 transition-all`}>
          <div className={`flex items-center justify-between ${textMuted} text-xs font-semibold uppercase tracking-wider mb-2`}>
            <span>Total Anomalies</span>
            <div className={`p-1.5 rounded-md ${isDark ? 'bg-amber-950/40 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-mono tabular-nums font-bold text-amber-500">
            {kpi ? kpi.total_anomalies : '—'}
          </div>
          <div className={`text-xs ${textMuted} mt-2 flex items-center gap-1.5`}>
            <span>Isolation Forest Filter</span>
            <span aria-hidden="true">&bull;</span>
            <span>~2.5% Detection Threshold</span>
          </div>
        </div>

        {/* High Priority Cases */}
        <div className={`${cardBg} border rounded-xl p-5 transition-all`}>
          <div className={`flex items-center justify-between ${textMuted} text-xs font-semibold uppercase tracking-wider mb-2`}>
            <span>High Priority Cases</span>
            <div className={`p-1.5 rounded-md ${isDark ? 'bg-rose-950/40 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-mono tabular-nums font-bold text-rose-500">
            {kpi ? kpi.high_priority_cases : '—'}
          </div>
          <div className={`text-xs ${textMuted} mt-2 flex items-center gap-1.5`}>
            <span>Acute Deviation (&ge;40%)</span>
            <span aria-hidden="true">&bull;</span>
            <span className="text-rose-500 font-semibold">Immediate Field Action</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid (Charts 1 and 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Electricity Consumption Trend */}
        <div className={`${cardBg} border rounded-xl p-5`}>
          <div className={`flex items-center justify-between mb-4 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div>
              <h2 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <TrendingUp className="w-4 h-4 text-sky-500" />
                1. Electricity Consumption Trend
              </h2>
              <p className={`text-xs ${textMuted} mt-0.5`}>
                Aggregated monthly daily average load across all 30 smart meters (kWh/day)
              </p>
            </div>
            <span className={`text-xs font-mono px-2 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
              Unit: kWh/day
            </span>
          </div>

          <div className={`h-56 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            {charts && charts.consumption_trend.length > 0 ? (
              charts.consumption_trend.map((pt, i) => {
                const maxVal = Math.max(...charts.consumption_trend.map((c) => c.average_kwh), 100);
                const heightPct = Math.max(14, Math.round((pt.average_kwh / maxVal) * 100));
                const monthName = pt.period.split('-')[1];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className={`opacity-0 group-hover:opacity-100 absolute -top-8 text-[11px] font-mono px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap z-20 transition ${
                      isDark ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-slate-900 text-white'
                    }`}>
                      {pt.period}: {pt.average_kwh.toFixed(1)} kWh/d
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-sm transition-colors ${
                        isDark ? 'bg-slate-700 group-hover:bg-sky-500' : 'bg-sky-200 group-hover:bg-sky-600'
                      }`}
                    />
                    <span className={`text-[10px] font-mono mt-1 ${textMuted}`}>{monthName}</span>
                  </div>
                );
              })
            ) : (
              <div className={`text-xs m-auto ${textMuted}`}>Loading telemetry...</div>
            )}
          </div>
          <div className={`flex items-center justify-between text-xs ${textMuted} mt-2.5 px-1`}>
            <span>Jan 2025</span>
            <span className="text-[11px]">Summer Peak Cooling Demand (May–Jul)</span>
            <span>Dec 2025</span>
          </div>
        </div>

        {/* Chart 2: Anomalies Over Time */}
        <div className={`${cardBg} border rounded-xl p-5`}>
          <div className={`flex items-center justify-between mb-4 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div>
              <h2 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <Calendar className="w-4 h-4 text-amber-500" />
                2. Anomalies Over Time
              </h2>
              <p className={`text-xs ${textMuted} mt-0.5`}>
                Monthly detection frequency classified by High, Medium, and Low severity
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-rose-500" /> High</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-amber-500" /> Med</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-xs bg-sky-500" /> Low</span>
            </div>
          </div>

          <div className={`h-56 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            {charts && charts.anomalies_over_time.length > 0 ? (
              charts.anomalies_over_time.map((pt, i) => {
                const maxTotal = Math.max(...charts.anomalies_over_time.map((a) => a.total), 30);
                const monthName = pt.period.split('-')[1];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                    <div className={`opacity-0 group-hover:opacity-100 absolute -top-10 text-[11px] font-mono px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap z-20 transition ${
                      isDark ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-slate-900 text-white'
                    }`}>
                      {pt.period}: {pt.total} (H:{pt.high} M:{pt.medium} L:{pt.low})
                    </div>
                    {/* Stacked Bars */}
                    <div className="w-full flex flex-col-reverse justify-end items-center" style={{ height: `${Math.max(15, (pt.total / maxTotal) * 100)}%` }}>
                      <div style={{ height: `${(pt.high / Math.max(1, pt.total)) * 100}%` }} className="w-full bg-rose-500 rounded-t-xs" />
                      <div style={{ height: `${(pt.medium / Math.max(1, pt.total)) * 100}%` }} className="w-full bg-amber-500" />
                      <div style={{ height: `${(pt.low / Math.max(1, pt.total)) * 100}%` }} className="w-full bg-sky-500" />
                    </div>
                    <span className={`text-[10px] font-mono mt-1 ${textMuted}`}>{monthName}</span>
                  </div>
                );
              })
            ) : (
              <div className={`text-xs m-auto ${textMuted}`}>Loading temporal data...</div>
            )}
          </div>
          <div className={`flex items-center justify-between text-xs ${textMuted} mt-2.5 px-1`}>
            <span>Total Flagged: {charts ? charts.anomalies_over_time.reduce((acc, c) => acc + c.total, 0) : '—'}</span>
            <span className="text-[11px]">Highest anomaly clustering in Q2 summer peak</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid (Charts 3, 4, and 5) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart 3: Consumption by Consumer Type */}
        <div className={`${cardBg} border rounded-xl p-5 flex flex-col justify-between`}>
          <div>
            <div className={`flex items-center justify-between mb-3 pb-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <h2 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <Building2 className="w-4 h-4 text-purple-500" />
                3. Consumption by Consumer Type
              </h2>
            </div>
            <p className={`text-xs ${textMuted} mb-4`}>
              Annual load distribution and daily intensity by sector category
            </p>

            <div className="space-y-3.5">
              {charts && charts.consumption_by_type.length > 0 ? (
                charts.consumption_by_type.map((item, i) => {
                  const maxTotal = Math.max(...charts.consumption_by_type.map((t) => t.total_kwh));
                  const pct = Math.round((item.total_kwh / maxTotal) * 100);
                  const colors = ['bg-indigo-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500'];
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-semibold ${textTitle}`}>{item.type}</span>
                        <span className={`font-mono ${textMuted}`}>{item.avg_daily_kwh} kWh/d mean</span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full ${colors[i % colors.length]} rounded-full transition-all`}
                        />
                      </div>
                      <div className={`flex justify-between text-[10px] font-mono ${textMuted}`}>
                        <span>Total: {item.total_kwh.toLocaleString()} kWh</span>
                        <span>{pct}% share</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={`text-xs ${textMuted}`}>Loading consumer categories...</div>
              )}
            </div>
          </div>
          <div className={`text-[11px] pt-3 mt-4 border-t ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
            Industrial loads exhibit highest baselines and variance.
          </div>
        </div>

        {/* Chart 4: Anomalies by Location */}
        <div className={`${cardBg} border rounded-xl p-5 flex flex-col justify-between`}>
          <div>
            <div className={`flex items-center justify-between mb-3 pb-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <h2 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <MapPin className="w-4 h-4 text-emerald-500" />
                4. Anomalies by Location
              </h2>
            </div>
            <p className={`text-xs ${textMuted} mb-4`}>
              Regional distribution across Chennai distribution divisions
            </p>

            <div className="space-y-3">
              {charts && charts.anomalies_by_location.length > 0 ? (
                charts.anomalies_by_location.map((loc, i) => {
                  const maxAnom = Math.max(...charts.anomalies_by_location.map((l) => l.total_anomalies));
                  const pct = Math.round((loc.total_anomalies / maxAnom) * 100);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${textTitle}`}>{loc.location}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-rose-500 font-semibold">{loc.high_priority} High</span>
                          <span className={`font-mono text-xs ${textMuted}`}>/ {loc.total_anomalies} total</span>
                        </div>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={`text-xs ${textMuted}`}>Loading location metrics...</div>
              )}
            </div>
          </div>
          <div className={`text-[11px] pt-3 mt-4 border-t ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
            Tambaram and Avadi show high commercial feeder volatility.
          </div>
        </div>

        {/* Chart 5: Investigation Priority Distribution */}
        <div className={`${cardBg} border rounded-xl p-5 flex flex-col justify-between`}>
          <div>
            <div className={`flex items-center justify-between mb-3 pb-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <h2 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
                <PieChart className="w-4 h-4 text-rose-500" />
                5. Investigation Priority Distribution
              </h2>
            </div>
            <p className={`text-xs ${textMuted} mb-4`}>
              Triage priority breakdown based on statistical deviation magnitude
            </p>

            <div className="space-y-4">
              {charts && charts.priority_distribution.length > 0 ? (
                (() => {
                  const total = charts.priority_distribution.reduce((acc, p) => acc + p.count, 0) || 1;
                  return charts.priority_distribution.map((p, i) => {
                    const pct = Math.round((p.count / total) * 100);
                    const colorMap: Record<string, { bar: string; text: string; bg: string }> = {
                      HIGH: { bar: 'bg-rose-500', text: 'text-rose-500', bg: isDark ? 'bg-rose-950/40' : 'bg-rose-50' },
                      MEDIUM: { bar: 'bg-amber-500', text: 'text-amber-500', bg: isDark ? 'bg-amber-950/40' : 'bg-amber-50' },
                      LOW: { bar: 'bg-sky-500', text: 'text-sky-500', bg: isDark ? 'bg-sky-950/40' : 'bg-sky-50' },
                    };
                    const c = colorMap[p.priority] || { bar: 'bg-slate-500', text: 'text-slate-400', bg: 'bg-slate-800' };

                    return (
                      <div key={i} className={`p-3 rounded-lg border ${isDark ? 'border-slate-800' : 'border-slate-100'} ${c.bg}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${c.text}`}>{p.priority} PRIORITY</span>
                          <span className={`text-xs font-mono font-bold ${textTitle}`}>
                            {p.count} cases ({pct}%)
                          </span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden mt-2 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                          <div style={{ width: `${pct}%` }} className={`h-full ${c.bar} rounded-full`} />
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <div className={`text-xs ${textMuted}`}>Loading distribution...</div>
              )}
            </div>
          </div>
          <div className={`text-[11px] pt-3 mt-4 border-t ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
            Priority reflects investigation urgency, NOT theft probability.
          </div>
        </div>
      </div>

      {/* Recent Flagged Anomalies Quick Triage Section */}
      <div className={`${cardBg} border rounded-xl p-5`}>
        <div className={`flex items-center justify-between mb-4 pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <h2 className={`text-sm font-bold flex items-center gap-2 ${textTitle}`}>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Recent Flagged Anomalies requiring Investigation
            </h2>
            <p className={`text-xs ${textMuted} mt-0.5`}>
              Immediate priority cases requiring technical review and verification
            </p>
          </div>
          <button
            onClick={onNavigateToAnomalies}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border transition ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700'
                : 'bg-slate-50 hover:bg-slate-100 text-sky-700 border-slate-200'
            }`}
          >
            <span>View All Anomaly Cases ({recentAnomalies.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400 bg-slate-950/40' : 'border-slate-200 text-slate-500 bg-slate-50'}`}>
                <th className="py-2.5 px-3 font-semibold">Meter ID</th>
                <th className="py-2.5 px-3 font-semibold">Date</th>
                <th className="py-2.5 px-3 font-semibold">Type</th>
                <th className="py-2.5 px-3 font-semibold">Location</th>
                <th className="py-2.5 px-3 font-semibold text-right">Daily Load</th>
                <th className="py-2.5 px-3 font-semibold text-right">Baseline Mean</th>
                <th className="py-2.5 px-3 font-semibold text-right">Deviation</th>
                <th className="py-2.5 px-3 font-semibold text-center">Score</th>
                <th className="py-2.5 px-3 font-semibold text-center">Priority</th>
                <th className="py-2.5 px-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {recentAnomalies.slice(0, 8).map((a, i) => (
                <tr key={i} className={`transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                  <td className={`py-2 px-3 font-mono font-bold ${textTitle}`}>{a.meter_id}</td>
                  <td className={`py-2 px-3 font-mono ${textMuted}`}>{a.date}</td>
                  <td className="py-2 px-3">{a.consumer_type}</td>
                  <td className="py-2 px-3">{a.location}</td>
                  <td className={`py-2 px-3 font-mono font-semibold text-right ${textTitle}`}>{a.consumption.toFixed(1)} kWh</td>
                  <td className={`py-2 px-3 font-mono text-right ${textMuted}`}>{a.historical_average.toFixed(1)} kWh</td>
                  <td className={`py-2 px-3 font-mono font-bold text-right ${a.percentage_change < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {a.percentage_change > 0 ? '+' : ''}{a.percentage_change.toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 font-mono text-center">{a.anomaly_score.toFixed(3)}</td>
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
                      onClick={() => onSelectAnomaly(a.meter_id, a.date)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-sky-600 hover:text-sky-500 hover:underline"
                    >
                      Investigate &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
