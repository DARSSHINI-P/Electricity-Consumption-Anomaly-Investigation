import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

import { pipelineInstance } from './server/anomalyDetector';
import { getConsumptionStatistics, getMeterHistory } from './server/agentTools';
import { runAgenticInvestigation } from './server/geminiInvestigator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize data processing and anomaly detection pipeline
  console.log('[Pipeline] Initializing electricity anomaly detection on uploaded dataset...');
  try {
    const stats = pipelineInstance.process();
    console.log(
      `[Pipeline] Successfully processed ${stats.totalRecords} records across 30 meters. Found ${stats.totalAnomalies} anomalies (${stats.highPriority} HIGH priority).`
    );
  } catch (err: any) {
    console.error('[Pipeline Error]:', err.message);
  }

  // -------------------------------------------------------------
  // API Routes
  // -------------------------------------------------------------

  // 1. System Status & Dataset Check
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'active',
      dataset: 'electricity_consumption_demo_under_20mb.csv',
      total_records: pipelineInstance.getAllProcessed().length,
      total_anomalies: pipelineInstance.getAnomalyCases().length,
      gemini_available: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  // Download Project ZIP Endpoint
  app.get('/api/download-zip', (req, res) => {
    const zipPath = path.resolve(__dirname, 'Electricity-Anomaly-Investigation.zip');
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, 'Electricity-Anomaly-Investigation.zip');
    } else {
      res.status(404).json({ error: 'Zip archive not found' });
    }
  });

  // 2. KPI Summary Cards
  app.get('/api/kpi', (req, res) => {
    const all = pipelineInstance.getAllProcessed();
    const anomalies = pipelineInstance.getAnomalyCases();

    const metersSet = new Set(all.map((r) => r.meter_id));
    const highCount = anomalies.filter((a) => a.priority === 'HIGH').length;
    const medCount = anomalies.filter((a) => a.priority === 'MEDIUM').length;
    const lowCount = anomalies.filter((a) => a.priority === 'LOW').length;

    res.json({
      total_meters: metersSet.size || 30,
      total_records: all.length,
      total_anomalies: anomalies.length,
      high_priority_cases: highCount,
      medium_priority_cases: medCount,
      low_priority_cases: lowCount,
    });
  });

  // 3. Five Analytics Charts
  app.get('/api/charts', (req, res) => {
    const all = pipelineInstance.getAllProcessed();
    const anomalies = pipelineInstance.getAnomalyCases();

    // Chart 1: Electricity Consumption Trend (aggregated monthly across all meters)
    const monthMap = new Map<string, { total: number; count: number }>();
    for (const r of all) {
      const month = r.date.substring(0, 7); // YYYY-MM
      if (!monthMap.has(month)) monthMap.set(month, { total: 0, count: 0 });
      const m = monthMap.get(month)!;
      m.total += r.consumption;
      m.count++;
    }
    const consumption_trend = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        period: month,
        average_kwh: Math.round((data.total / data.count) * 100) / 100,
        total_kwh: Math.round(data.total * 100) / 100,
      }));

    // Chart 2: Anomalies Over Time (monthly breakdown)
    const anomMonthMap = new Map<string, { high: number; medium: number; low: number }>();
    for (const a of anomalies) {
      const month = a.date.substring(0, 7);
      if (!anomMonthMap.has(month)) anomMonthMap.set(month, { high: 0, medium: 0, low: 0 });
      const m = anomMonthMap.get(month)!;
      if (a.priority === 'HIGH') m.high++;
      else if (a.priority === 'MEDIUM') m.medium++;
      else m.low++;
    }
    const anomalies_over_time = Array.from(anomMonthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, counts]) => ({
        period: month,
        high: counts.high,
        medium: counts.medium,
        low: counts.low,
        total: counts.high + counts.medium + counts.low,
      }));

    // Chart 3: Consumption by Consumer Type
    const typeMap = new Map<string, { total_kwh: number; count: number }>();
    for (const r of all) {
      const t = r.consumer_type;
      if (!typeMap.has(t)) typeMap.set(t, { total_kwh: 0, count: 0 });
      const m = typeMap.get(t)!;
      m.total_kwh += r.consumption;
      m.count++;
    }
    const consumption_by_type = Array.from(typeMap.entries()).map(([type, d]) => ({
      type,
      total_kwh: Math.round(d.total_kwh),
      avg_daily_kwh: Math.round(d.total_kwh / d.count),
    }));

    // Chart 4: Anomalies by Location
    const locMap = new Map<string, { total: number; high: number }>();
    for (const a of anomalies) {
      const loc = a.location;
      if (!locMap.has(loc)) locMap.set(loc, { total: 0, high: 0 });
      const m = locMap.get(loc)!;
      m.total++;
      if (a.priority === 'HIGH') m.high++;
    }
    const anomalies_by_location = Array.from(locMap.entries()).map(([location, d]) => ({
      location,
      total_anomalies: d.total,
      high_priority: d.high,
    }));

    // Chart 5: Investigation Priority Distribution
    const priority_distribution = [
      { priority: 'HIGH', count: anomalies.filter((a) => a.priority === 'HIGH').length },
      { priority: 'MEDIUM', count: anomalies.filter((a) => a.priority === 'MEDIUM').length },
      { priority: 'LOW', count: anomalies.filter((a) => a.priority === 'LOW').length },
    ];

    res.json({
      consumption_trend,
      anomalies_over_time,
      consumption_by_type,
      anomalies_by_location,
      priority_distribution,
    });
  });

  // 4. Filterable Anomaly Cases
  app.get('/api/anomalies', (req, res) => {
    let cases = [...pipelineInstance.getAnomalyCases()];

    const { meter, consumer_type, location, priority, date, search } = req.query;

    if (meter && typeof meter === 'string' && meter !== 'ALL') {
      cases = cases.filter((c) => c.meter_id === meter);
    }
    if (consumer_type && typeof consumer_type === 'string' && consumer_type !== 'ALL') {
      cases = cases.filter((c) => c.consumer_type === consumer_type);
    }
    if (location && typeof location === 'string' && location !== 'ALL') {
      cases = cases.filter((c) => c.location === location);
    }
    if (priority && typeof priority === 'string' && priority !== 'ALL') {
      cases = cases.filter((c) => c.priority === priority);
    }
    if (date && typeof date === 'string') {
      cases = cases.filter((c) => c.date.includes(date));
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      cases = cases.filter(
        (c) =>
          c.meter_id.toLowerCase().includes(q) ||
          c.date.includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.consumer_type.toLowerCase().includes(q)
      );
    }

    res.json({
      total: cases.length,
      anomalies: cases,
    });
  });

  // 5. Meter Directory
  app.get('/api/meters', (req, res) => {
    const all = pipelineInstance.getAllProcessed();
    const meterMap = new Map<string, { consumer_type: string; location: string }>();

    for (const r of all) {
      if (!meterMap.has(r.meter_id)) {
        meterMap.set(r.meter_id, { consumer_type: r.consumer_type, location: r.location });
      }
    }

    const summaries = Array.from(meterMap.keys())
      .sort()
      .map((meter_id) => {
        const stats = getConsumptionStatistics(meter_id);
        return stats || { meter_id, ...meterMap.get(meter_id)! };
      });

    res.json({ meters: summaries });
  });

  // 6. Specific Meter Telemetry (365 days)
  app.get('/api/meter/:id', (req, res) => {
    const meter_id = req.params.id;
    const stats = getConsumptionStatistics(meter_id);
    if (!stats) {
      return res.status(404).json({ error: `Meter ${meter_id} not found.` });
    }

    const records = pipelineInstance
      .getAllProcessed()
      .filter((r) => r.meter_id === meter_id)
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      stats,
      records,
      anomalous_dates: records.filter((r) => r.is_anomaly).map((r) => r.date),
    });
  });

  // 7. Agentic AI Investigation Request
  app.all('/api/investigate', async (req, res) => {
    const meter_id = (req.body?.meter_id || req.query?.meter_id) as string;
    const date = (req.body?.date || req.query?.date) as string;

    if (!meter_id || !date) {
      return res.status(400).json({ error: 'Both meter_id and date are required.' });
    }

    try {
      const report = await runAgenticInvestigation(meter_id, date);
      res.json({ success: true, report });
    } catch (err: any) {
      console.error('[Investigation Error]:', err.message);
      res.status(500).json({ error: err.message || 'Failed to complete forensic investigation.' });
    }
  });

  // -------------------------------------------------------------
  // Frontend Serving (Vite middleware in dev / Static in prod)
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Full-Stack App] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
