/**
 * Agentic AI Reasoning Layer using @google/genai.
 * Combines statistical tool telemetry with Gemini 3.8 Flash
 * to synthesize expert forensic utility reports with deterministic fallback.
 */

import { GoogleGenAI } from '@google/genai';
import {
  getMeterHistory,
  getConsumptionStatistics,
  calculateDeviation,
  analyzeRecentPattern,
  MeterHistoryWindow,
  MeterStatistics,
  DeviationAnalysis,
  RecentPatternSummary,
} from './agentTools';

export interface FullInvestigationReport {
  meter_id: string;
  date: string;
  consumer_type: string;
  location: string;
  investigation_priority: 'HIGH' | 'MEDIUM' | 'LOW';
  observed_pattern: string;
  consumption_analysis: {
    recorded_kwh: number;
    baseline_kwh: number;
    percentage_change: number;
    anomaly_score: number;
    z_score: number;
    consecutive_abnormal_days: number;
    historical_mean: number;
    historical_std: number;
  };
  historical_comparison: string;
  possible_causes: Array<{
    category: string;
    title: string;
    description: string;
  }>;
  contextual_interpretation: string;
  recommended_actions: Array<{
    step: number;
    title: string;
    action: string;
  }>;
  system_limitation: string;
  reasoning_source: 'GEMINI_AI' | 'DETERMINISTIC_EXPERT_SYSTEM';
  history_window: MeterHistoryWindow[];
}

const SYSTEM_LIMITATION_DISCLAIMER =
  'This system identifies anomalous consumption patterns. It does not prove electricity theft. Human and technical verification are required.';

export async function runAgenticInvestigation(
  meter_id: string,
  date: string
): Promise<FullInvestigationReport> {
  // Step 1: Query Agentic Tools
  const stats = getConsumptionStatistics(meter_id);
  const history = getMeterHistory(meter_id, date, 7);
  const targetRecord = history.find((h) => h.date === date);

  const currentConsumption = targetRecord?.consumption || 0;
  const baselineConsumption = targetRecord?.historical_average || stats?.mean_consumption || 1;
  const anomalyScore = targetRecord?.anomaly_score || 0.65;

  // Step 2: Deviation Analysis Tool
  const dev = calculateDeviation(currentConsumption, baselineConsumption, stats?.std_consumption || 30);

  // Step 3: Pattern Evolution Tool
  const pattern = analyzeRecentPattern(meter_id, date);

  // Step 4: Priority Calculation
  let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (Math.abs(dev.percentage_change) >= 45 || anomalyScore >= 0.7 || Math.abs(dev.z_score) >= 2.8) {
    priority = 'HIGH';
  } else if (Math.abs(dev.percentage_change) >= 25 || anomalyScore >= 0.55 || Math.abs(dev.z_score) >= 1.8) {
    priority = 'MEDIUM';
  }

  // Base deterministic analysis
  const deterministicReport = buildDeterministicReport(
    meter_id,
    date,
    stats,
    dev,
    pattern,
    anomalyScore,
    priority,
    history
  );

  // Step 5: If GEMINI_API_KEY is configured, call Gemini 3.8 Flash for contextual reasoning
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return deterministicReport;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `
You are an expert power utility forensic analyst and data scientist for a distribution utility in Chennai.
Analyze the following anomalous smart meter telemetry and generate a structured JSON investigation dossier.

METADATA:
- Meter ID: ${meter_id}
- Date: ${date}
- Consumer Type: ${stats?.consumer_type || 'Unknown'}
- Location: ${stats?.location || 'Chennai'}
- Current Consumption: ${dev.recorded} kWh
- Historical Baseline Average: ${dev.baseline} kWh
- Relative Deviation: ${dev.percentage_change}%
- Standardized Z-Score: ${dev.z_score}
- Anomaly Score: ${anomalyScore}
- Consecutive Abnormal Days: ${pattern.consecutive_abnormal_days}
- Investigation Priority: ${priority}

IMPORTANT MANDATORY GUIDELINE:
You must NEVER claim or conclude that electricity theft has occurred.
Frame observations objectively as "anomalous consumption pattern" or "potentially suspicious consumption pattern requiring verification".
Include diverse engineering, operational, and customer explanations (e.g. meter hardware failure, CT loss, phase drop, operational shifts, customer absence/holidays, seasonal shutdown, or possible unauthorized tapping requiring inspection).

Return ONLY valid JSON matching this schema:
{
  "observed_pattern": "string describing what changed",
  "historical_comparison": "string comparing with normal historical range and seasonality",
  "contextual_interpretation": "string interpreting consumer type (${stats?.consumer_type}) and location (${stats?.location}) context",
  "possible_causes": [
    { "category": "reduced_activity | meter_issue | operational_change | data_quality | suspicious_behaviour", "title": "string", "description": "string" }
  ],
  "recommended_actions": [
    { "step": 1, "title": "string", "action": "string" },
    { "step": 2, "title": "string", "action": "string" },
    { "step": 3, "title": "string", "action": "string" },
    { "step": 4, "title": "string", "action": "string" }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return {
        ...deterministicReport,
        observed_pattern: parsed.observed_pattern || deterministicReport.observed_pattern,
        historical_comparison: parsed.historical_comparison || deterministicReport.historical_comparison,
        contextual_interpretation: parsed.contextual_interpretation || deterministicReport.contextual_interpretation,
        possible_causes: Array.isArray(parsed.possible_causes) && parsed.possible_causes.length > 0
          ? parsed.possible_causes
          : deterministicReport.possible_causes,
        recommended_actions: Array.isArray(parsed.recommended_actions) && parsed.recommended_actions.length > 0
          ? parsed.recommended_actions
          : deterministicReport.recommended_actions,
        reasoning_source: 'GEMINI_AI',
      };
    }
  } catch (err: any) {
    console.warn('[Gemini] Fallback to deterministic investigation report:', err.message);
  }

  return deterministicReport;
}

function buildDeterministicReport(
  meter_id: string,
  date: string,
  stats: MeterStatistics | null,
  dev: DeviationAnalysis,
  pattern: RecentPatternSummary,
  anomalyScore: number,
  priority: 'HIGH' | 'MEDIUM' | 'LOW',
  history: MeterHistoryWindow[]
): FullInvestigationReport {
  const isDrop = dev.percentage_change < 0;
  const absPct = Math.abs(dev.percentage_change);
  const consumerType = stats?.consumer_type || 'Consumer';
  const location = stats?.location || 'Distribution Sector';

  // Observed pattern
  let observed_pattern = '';
  if (isDrop) {
    observed_pattern = `Consumption on ${date} dropped by ${absPct}% (${dev.recorded} kWh vs historical baseline of ${dev.baseline} kWh). This represents a statistically significant negative load depression (Z-score: ${dev.z_score}).`;
  } else {
    observed_pattern = `Consumption on ${date} spiked by +${absPct}% (${dev.recorded} kWh vs historical baseline of ${dev.baseline} kWh). This represents an acute demand surge (Z-score: ${dev.z_score}).`;
  }

  // Historical comparison
  const historical_comparison = `Meter ${meter_id} records an overall historical daily average of ${stats?.mean_consumption || dev.baseline} kWh (\u03C3 = ${stats?.std_consumption || 25} kWh). Over ${pattern.consecutive_abnormal_days > 1 ? `${pattern.consecutive_abnormal_days} consecutive days` : 'the observed period'}, readings deviated by ${absPct}%, indicating an atypical trajectory compared to typical ${consumerType} demand in ${location}.`;

  // Contextual interpretation
  const contextual_interpretation = `As a ${consumerType} installation in ${location}, baseline energy patterns typically fluctuate with weekly working cycles and regional cooling demand. A ${isDrop ? 'sharp drop' : 'sudden spike'} of this magnitude warrants formal review to confirm whether operational shutdowns, equipment changes, or metering irregularities occurred.`;

  // Possible causes
  const possible_causes = [];
  if (isDrop) {
    possible_causes.push({
      category: 'reduced_activity',
      title: 'Reduced Customer Activity or Temporary Closure',
      description: 'Premises vacancy, scheduled plant maintenance, holiday shutdown, or load migration to alternative generation.',
    });
    possible_causes.push({
      category: 'meter_issue',
      title: 'Current Transformer (CT) Defect or Phase Loss',
      description: 'Physical meter hardware malfunction, loose secondary wiring, blown voltage fuse, or optical sensor drift.',
    });
    possible_causes.push({
      category: 'suspicious_behaviour',
      title: 'Potentially Suspicious Consumption Behaviour',
      description: 'Secondary circuit bridging, unauthorized shunt installation, or illegal bypass diverting electrical load.',
    });
    possible_causes.push({
      category: 'data_quality',
      title: 'Telecommunication or AMI Register Dropout',
      description: 'Smart meter AMR/AMI head-end communication packet drop resulting in partial interval capture.',
    });
  } else {
    possible_causes.push({
      category: 'operational_change',
      title: 'Unplanned Equipment Energization / Expansion',
      description: 'Commissioning of new heavy industrial motors, auxiliary HVAC chillers, or overtime manufacturing shifts.',
    });
    possible_causes.push({
      category: 'meter_issue',
      title: 'Meter Multiplier or Calibration Drift',
      description: 'CT ratio misconfiguration, billing meter register inversion, or transient voltage spike.',
    });
    possible_causes.push({
      category: 'suspicious_behaviour',
      title: 'Unauthorized Load Interconnection',
      description: 'Unaccounted connection of adjacent load circuits feeding through the monitored utility service point.',
    });
  }

  // Recommended actions
  const recommended_actions = [
    {
      step: 1,
      title: 'Customer Account & Billing Audit',
      action: 'Verify customer contract demand, active tariff status, recent complaints, and service work orders.',
    },
    {
      step: 2,
      title: 'SCADA Substation Feeder Correlation',
      action: 'Cross-check incident timestamp with 11kV/33kV distribution feeder event logs to rule out utility outages.',
    },
    {
      step: 3,
      title: 'Smart Meter Tamper Register Inspection',
      action: 'Extract AMI diagnostic flags (terminal cover opening, reverse energy flow, magnetic tamper, neutral disturbance).',
    },
    {
      step: 4,
      title: 'Field Verification & Clamp Meter Test',
      action: 'Dispatch field inspection team to verify meter seal integrity, examine CT/PT wiring, and measure instantaneous load.',
    },
  ];

  return {
    meter_id,
    date,
    consumer_type: consumerType,
    location,
    investigation_priority: priority,
    observed_pattern,
    consumption_analysis: {
      recorded_kwh: dev.recorded,
      baseline_kwh: dev.baseline,
      percentage_change: dev.percentage_change,
      anomaly_score: anomalyScore,
      z_score: dev.z_score,
      consecutive_abnormal_days: pattern.consecutive_abnormal_days,
      historical_mean: stats?.mean_consumption || dev.baseline,
      historical_std: stats?.std_consumption || 25,
    },
    historical_comparison,
    possible_causes,
    contextual_interpretation,
    recommended_actions,
    system_limitation: SYSTEM_LIMITATION_DISCLAIMER,
    reasoning_source: 'DETERMINISTIC_EXPERT_SYSTEM',
    history_window: history,
  };
}
