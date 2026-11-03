import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  ArrowUpDown, 
  FileDown, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  X
} from 'lucide-react';
import { AnomalyCase } from '../types';
import { useTheme } from '../context/ThemeContext';

interface AnomalyCasesViewProps {
  anomalies: AnomalyCase[];
  onInvestigate: (meter_id: string, date: string) => void;
}

export const AnomalyCasesView: React.FC<AnomalyCasesViewProps> = ({
  anomalies,
  onInvestigate,
}) => {
  const { isDark } = useTheme();

  const [search, setSearch] = useState('');
  const [meterFilter, setMeterFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'DROP' | 'SURGE'>('ALL');

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'consumption' | 'percentage_change' | 'anomaly_score' | 'priority' | 'meter_id'>('priority');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const cardBg = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const textTitle = isDark ? 'text-slate-100' : 'text-slate-900';

  // Extract unique meters and options
  const uniqueMeters = useMemo(() => {
    return Array.from(new Set(anomalies.map((a) => a.meter_id))).sort();
  }, [anomalies]);

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(anomalies.map((a) => a.location))).sort();
  }, [anomalies]);

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(anomalies.map((a) => a.consumer_type))).sort();
  }, [anomalies]);

  // Filter & sort
  const filteredCases = useMemo(() => {
    return anomalies
      .filter((a) => {
        if (meterFilter !== 'ALL' && a.meter_id !== meterFilter) return false;
        if (typeFilter !== 'ALL' && a.consumer_type !== typeFilter) return false;
        if (locationFilter !== 'ALL' && a.location !== locationFilter) return false;
        if (priorityFilter !== 'ALL' && a.priority !== priorityFilter) return false;
        if (dateFilter && !a.date.includes(dateFilter)) return false;
        if (directionFilter === 'DROP' && a.percentage_change >= 0) return false;
        if (directionFilter === 'SURGE' && a.percentage_change <= 0) return false;

        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const match =
            a.meter_id.toLowerCase().includes(q) ||
            a.date.includes(q) ||
            a.location.toLowerCase().includes(q) ||
            a.consumer_type.toLowerCase().includes(q);
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'meter_id') cmp = a.meter_id.localeCompare(b.meter_id);
        else if (sortField === 'date') cmp = a.date.localeCompare(b.date);
        else if (sortField === 'consumption') cmp = a.consumption - b.consumption;
        else if (sortField === 'percentage_change') cmp = Math.abs(a.percentage_change) - Math.abs(b.percentage_change);
        else if (sortField === 'anomaly_score') cmp = a.anomaly_score - b.anomaly_score;
        else if (sortField === 'priority') {
          const rank: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          cmp = (rank[a.priority] || 0) - (rank[b.priority] || 0);
        }
        return sortAsc ? cmp : -cmp;
      });
  }, [anomalies, meterFilter, typeFilter, locationFilter, priorityFilter, dateFilter, directionFilter, search, sortField, sortAsc]);

  // Paginated records
  const totalPages = Math.ceil(filteredCases.length / pageSize) || 1;
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCases.slice(start, start + pageSize);
  }, [filteredCases, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearch('');
    setMeterFilter('ALL');
    setTypeFilter('ALL');
    setLocationFilter('ALL');
    setPriorityFilter('ALL');
    setDateFilter('');
    setDirectionFilter('ALL');
    setCurrentPage(1);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Export filtered rows to CSV
  const exportFilteredCSV = () => {
    const headers = [
      'meter_id',
      'date',
      'consumer_type',
      'location',
      'consumption_kwh',
      'historical_average_kwh',
      'percentage_change',
      'anomaly_score',
      'priority',
    ];
    const rows = filteredCases.map((c) => [
      c.meter_id,
      c.date,
      `"${c.consumer_type}"`,
      `"${c.location}"`,
      c.consumption.toFixed(2),
      c.historical_average.toFixed(2),
      c.percentage_change.toFixed(2),
      c.anomaly_score.toFixed(4),
      c.priority,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anomaly_cases_filtered_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className={`${cardBg} border rounded-xl p-5 space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className={`text-base font-bold flex items-center gap-2 ${textTitle}`}>
              <Filter className="w-4 h-4 text-sky-500" />
              Anomaly Cases Triage & Investigation Queue
            </h2>
            <p className={`text-xs ${textMuted} mt-0.5`}>
              Searchable catalog of statistical outliers identified by the Isolation Forest pipeline
            </p>
          </div>

          {/* Quick Stats & CSV Export */}
          <div className="flex items-center gap-3">
            <span className={`text-xs font-mono font-medium ${textMuted}`}>
              Showing <strong className={textTitle}>{filteredCases.length}</strong> of {anomalies.length} cases
            </span>
            <button
              onClick={exportFilteredCSV}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-xs'
              }`}
              title="Export currently filtered rows as CSV for field engineers"
            >
              <FileDown className="w-3.5 h-3.5 text-sky-500" />
              <span>Export Filtered CSV</span>
            </button>
          </div>
        </div>

        {/* Preset Quick Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/40">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${textMuted}`}>Presets:</span>
          <button
            onClick={() => { setPriorityFilter('ALL'); setDirectionFilter('ALL'); setTypeFilter('ALL'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${
              priorityFilter === 'ALL' && directionFilter === 'ALL' && typeFilter === 'ALL'
                ? 'bg-sky-600 text-white border-sky-600'
                : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            All Cases ({anomalies.length})
          </button>
          <button
            onClick={() => { setPriorityFilter('HIGH'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${
              priorityFilter === 'HIGH'
                ? 'bg-rose-600 text-white border-rose-600'
                : isDark ? 'bg-rose-950/40 text-rose-300 border-rose-800/50' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            High Priority Only
          </button>
          <button
            onClick={() => { setDirectionFilter('DROP'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition flex items-center gap-1 ${
              directionFilter === 'DROP'
                ? 'bg-amber-600 text-white border-amber-600'
                : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
            Consumption Drops (Loss Hypothesis)
          </button>
          <button
            onClick={() => { setDirectionFilter('SURGE'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition flex items-center gap-1 ${
              directionFilter === 'SURGE'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            Consumption Surges
          </button>
          <button
            onClick={() => { setTypeFilter('Industrial'); setCurrentPage(1); }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition ${
              typeFilter === 'Industrial'
                ? 'bg-purple-600 text-white border-purple-600'
                : isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            Industrial Feeders
          </button>
        </div>

        {/* Detailed Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Search Input */}
          <div className="relative">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-3 ${textMuted}`} />
            <input
              type="text"
              placeholder="Search meter, date, zone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className={`w-full pl-8 pr-7 py-2 rounded-lg text-xs border outline-none font-mono ${
                isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-600'
              }`}
            />
            {search && (
              <button onClick={() => setSearch('')} className={`absolute right-2.5 top-2.5 ${textMuted}`}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Meter Filter */}
          <div>
            <select
              value={meterFilter}
              onChange={(e) => { setMeterFilter(e.target.value); setCurrentPage(1); }}
              className={`w-full px-2.5 py-2 rounded-lg text-xs border outline-none font-mono ${
                isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-600'
              }`}
            >
              <option value="ALL">All Meters (30)</option>
              {uniqueMeters.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Consumer Type */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className={`w-full px-2.5 py-2 rounded-lg text-xs border outline-none ${
                isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-600'
              }`}
            >
              <option value="ALL">All Consumer Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <select
              value={locationFilter}
              onChange={(e) => { setLocationFilter(e.target.value); setCurrentPage(1); }}
              className={`w-full px-2.5 py-2 rounded-lg text-xs border outline-none ${
                isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-600'
              }`}
            >
              <option value="ALL">All Locations</option>
              {uniqueLocations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className={`w-full px-2.5 py-2 rounded-lg text-xs border outline-none ${
                isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-600'
              }`}
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">HIGH Priority</option>
              <option value="MEDIUM">MEDIUM Priority</option>
              <option value="LOW">LOW Priority</option>
            </select>
          </div>

          {/* Date Search / Reset */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Date (YYYY-MM)"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              className={`w-full px-2.5 py-2 rounded-lg text-xs border outline-none font-mono ${
                isDark ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-sky-500' : 'bg-white border-slate-300 text-slate-900 focus:border-sky-600'
              }`}
            />
            <button
              onClick={handleResetFilters}
              title="Reset Filters"
              className={`p-2 rounded-lg border transition ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className={`${cardBg} border rounded-xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b select-none ${isDark ? 'border-slate-800 text-slate-300 bg-slate-950/60' : 'border-slate-200 text-slate-700 bg-slate-50'}`}>
                <th
                  onClick={() => handleSort('meter_id')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-sky-500 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Meter ID</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-sky-500 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-3 font-semibold">Consumer Type</th>
                <th className="py-3 px-3 font-semibold">Location</th>
                <th
                  onClick={() => handleSort('consumption')}
                  className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-sky-500 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Consumption</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-3 font-semibold text-right">Historical Average</th>
                <th
                  onClick={() => handleSort('percentage_change')}
                  className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-sky-500 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Percentage Change</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('anomaly_score')}
                  className="py-3 px-3 font-semibold text-center cursor-pointer hover:text-sky-500 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Anomaly Score</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('priority')}
                  className="py-3 px-3 font-semibold text-center cursor-pointer hover:text-sky-500 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Priority</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {paginatedCases.length > 0 ? (
                paginatedCases.map((a, i) => (
                  <tr
                    key={i}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className={`py-3 px-3 font-mono font-bold ${textTitle}`}>
                      {a.meter_id}
                    </td>
                    <td className={`py-3 px-3 font-mono ${textMuted}`}>{a.date}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {a.consumer_type}
                      </span>
                    </td>
                    <td className="py-3 px-3">{a.location}</td>
                    <td className={`py-3 px-3 font-mono font-semibold text-right ${textTitle}`}>
                      {a.consumption.toFixed(2)} kWh
                    </td>
                    <td className={`py-3 px-3 font-mono text-right ${textMuted}`}>
                      {a.historical_average.toFixed(2)} kWh
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-right">
                      <span className={a.percentage_change < 0 ? 'text-rose-500' : 'text-emerald-500'}>
                        {a.percentage_change > 0 ? '+' : ''}{a.percentage_change.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-center">
                      <span className="font-semibold">{a.anomaly_score.toFixed(4)}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                        a.priority === 'HIGH'
                          ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                          : a.priority === 'MEDIUM'
                          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          : 'bg-sky-500/15 text-sky-500 border border-sky-500/30'
                      }`}>
                        {a.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onInvestigate(a.meter_id, a.date)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition-colors shadow-xs"
                      >
                        <span>Investigate</span>
                        <span>&rarr;</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className={`py-12 text-center ${textMuted}`}>
                    No anomaly cases match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
          isDark ? 'border-slate-800 bg-slate-950/40 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className={`px-2 py-1 rounded border outline-none font-mono ${
                isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="ml-2 font-mono">
              Page {currentPage} of {totalPages} ({filteredCases.length} records)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className={`p-1.5 rounded border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
              }`}
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
              let pageNum = idx + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = Math.min(currentPage - 2 + idx, totalPages - 4 + idx);
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded text-xs font-mono font-medium border transition ${
                    currentPage === pageNum
                      ? 'bg-sky-600 text-white border-sky-600'
                      : isDark
                      ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className={`p-1.5 rounded border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
              }`}
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
