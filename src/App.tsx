/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AnomalyCasesView } from './components/AnomalyCasesView';
import { MeterAnalysisView } from './components/MeterAnalysisView';
import { InvestigationView } from './components/InvestigationView';
import { AboutProjectView } from './components/AboutProjectView';
import { ActiveTab, KpiSummary, ChartDataSets, AnomalyCase } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function MainLayout() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [kpi, setKpi] = useState<KpiSummary | null>(null);
  const [charts, setCharts] = useState<ChartDataSets | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyCase[]>([]);
  const [geminiActive, setGeminiActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Active investigation target
  const [investigateTarget, setInvestigateTarget] = useState<{ meter_id: string; date: string } | null>(null);

  // Load backend state on mount
  useEffect(() => {
    async function initPlatform() {
      try {
        setLoading(true);
        const [statusRes, kpiRes, chartsRes, anomRes] = await Promise.all([
          fetch('/api/status'),
          fetch('/api/kpi'),
          fetch('/api/charts'),
          fetch('/api/anomalies'),
        ]);

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setGeminiActive(Boolean(statusData.gemini_available));
        }
        if (kpiRes.ok) {
          const kpiData = await kpiRes.json();
          setKpi(kpiData);
        }
        if (chartsRes.ok) {
          const chartData = await chartsRes.json();
          setCharts(chartData);
        }
        if (anomRes.ok) {
          const anomData = await anomRes.json();
          setAnomalies(anomData.anomalies || []);
          if (anomData.anomalies && anomData.anomalies.length > 0 && !investigateTarget) {
            setInvestigateTarget({
              meter_id: anomData.anomalies[0].meter_id,
              date: anomData.anomalies[0].date,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load initial platform data:', err);
      } finally {
        setLoading(false);
      }
    }

    initPlatform();
  }, []);

  const handleLaunchInvestigation = (meter_id: string, date: string) => {
    setInvestigateTarget({ meter_id, date });
    setActiveTab('investigation');
  };

  return (
    <div className={`min-h-screen flex flex-row font-sans transition-colors duration-150 selection:bg-sky-500 selection:text-white ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/70 text-slate-900'
    }`}>
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        anomaliesCount={anomalies.length}
        highPriorityCount={kpi?.high_priority_cases || 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <Header geminiActive={geminiActive} />

        <main className="p-6 flex-1 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 gap-3">
              <div className="animate-spin w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full" />
              <div className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Ingesting Uploaded Telemetry & Running Anomaly Detection Pipeline...
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  kpi={kpi}
                  charts={charts}
                  recentAnomalies={anomalies}
                  onSelectAnomaly={handleLaunchInvestigation}
                  onNavigateToAnomalies={() => setActiveTab('anomalies')}
                />
              )}

              {activeTab === 'anomalies' && (
                <AnomalyCasesView
                  anomalies={anomalies}
                  onInvestigate={handleLaunchInvestigation}
                />
              )}

              {activeTab === 'meters' && (
                <MeterAnalysisView
                  initialMeterId={investigateTarget?.meter_id || 'MT_001'}
                  onInvestigate={handleLaunchInvestigation}
                />
              )}

              {activeTab === 'investigation' && (
                <InvestigationView
                  selectedMeterId={investigateTarget?.meter_id}
                  selectedDate={investigateTarget?.date}
                  anomalyCases={anomalies}
                  onSelectAnotherCase={(m, d) => setInvestigateTarget({ meter_id: m, date: d })}
                />
              )}

              {activeTab === 'about' && <AboutProjectView />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainLayout />
    </ThemeProvider>
  );
}
