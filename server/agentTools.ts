/**
 * Agentic AI Investigation Tools.
 * Provides analytical tool capabilities for smart meter forensic audit.
 */

import { pipelineInstance, ProcessedMeterRecord } from './anomalyDetector';

export interface MeterHistoryWindow {
  date: string;
  consumption: number;
  historical_average: number;
  percentage_change: number;
  anomaly_score: number;
  is_target: boolean;
}

export interface MeterStatistics {
  meter_id: string;
  consumer_type: string;
  location: string;
  total_days: number;
  mean_consumption: number;
  median_consumption: number;
  std_consumption: number;
  min_consumption: number;
  max_consumption: number;
  total_kwh: number;
  anomalies_count: number;
}

export interface DeviationAnalysis {
  recorded: number;
  baseline: number;
  signed_diff: number;
  abs_diff: number;
  percentage_change: number;
  z_score: number;
  direction: 'SHARP_DROP' | 'SHARP_SPIKE' | 'SUSTAINED_DROP' | 'MODERATE_VARIATION';
  is_drastic: boolean;
}

export interface RecentPatternSummary {
  preceding_7d_avg: number;
  consecutive_abnormal_days: number;
  pattern_type: 'ACUTE_SINGLE_DAY' | 'MULTI_DAY_BURST' | 'SUSTAINED_SHIFT' | 'PERSISTENT_SUPPRESSION';
  stability_index: number;
}

/**
 * Tool 1: getMeterHistory
 * Retrieves chronological consumption around the incident date.
 */
export function getMeterHistory(meter_id: string, target_date?: string, window_days = 7): MeterHistoryWindow[] {
  const records = pipelineInstance.getAllProcessed().filter((r) => r.meter_id === meter_id);
  records.sort((a, b) => a.date.localeCompare(b.date));

  if (records.length === 0) return [];

  let startIndex = 0;
  let endIndex = records.length;

  if (target_date) {
    const targetIdx = records.findIndex((r) => r.date === target_date);
    if (targetIdx !== -1) {
      startIndex = Math.max(0, targetIdx - window_days);
      endIndex = Math.min(records.length, targetIdx + window_days + 1);
    }
  }

  const slice = records.slice(startIndex, endIndex);
  return slice.map((r) => ({
    date: r.date,
    consumption: r.consumption,
    historical_average: r.historical_average,
    percentage_change: r.percentage_change,
    anomaly_score: r.anomaly_score,
    is_target: r.date === target_date,
  }));
}

/**
 * Tool 2: getConsumptionStatistics
 * Computes longitudinal baseline metrics for the meter.
 */
export function getConsumptionStatistics(meter_id: string): MeterStatistics | null {
  const records = pipelineInstance.getAllProcessed().filter((r) => r.meter_id === meter_id);
  if (records.length === 0) return null;

  const vals = records.map((r) => r.consumption).sort((a, b) => a - b);
  const totalDays = records.length;
  const totalKwh = vals.reduce((a, b) => a + b, 0);
  const mean = totalKwh / totalDays;

  const median =
    totalDays % 2 === 0
      ? (vals[totalDays / 2 - 1] + vals[totalDays / 2]) / 2
      : vals[Math.floor(totalDays / 2)];

  const variance = vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / totalDays;
  const std = Math.sqrt(variance);

  const anomaliesCount = records.filter((r) => r.is_anomaly).length;

  return {
    meter_id,
    consumer_type: records[0].consumer_type,
    location: records[0].location,
    total_days: totalDays,
    mean_consumption: Math.round(mean * 100) / 100,
    median_consumption: Math.round(median * 100) / 100,
    std_consumption: Math.round(std * 100) / 100,
    min_consumption: vals[0],
    max_consumption: vals[vals.length - 1],
    total_kwh: Math.round(totalKwh * 100) / 100,
    anomalies_count: anomaliesCount,
  };
}

/**
 * Tool 3: calculateDeviation
 * Performs statistical distance calculations from expected baseline.
 */
export function calculateDeviation(current: number, baseline: number, std = 30.0): DeviationAnalysis {
  const signed_diff = current - baseline;
  const abs_diff = Math.abs(signed_diff);
  const percentage_change = baseline > 0 ? (signed_diff / baseline) * 100 : 0;
  const z_score = std > 0 ? signed_diff / std : 0;

  let direction: DeviationAnalysis['direction'] = 'MODERATE_VARIATION';
  if (percentage_change <= -45) {
    direction = 'SHARP_DROP';
  } else if (percentage_change <= -20) {
    direction = 'SUSTAINED_DROP';
  } else if (percentage_change >= 45) {
    direction = 'SHARP_SPIKE';
  }

  return {
    recorded: Math.round(current * 100) / 100,
    baseline: Math.round(baseline * 100) / 100,
    signed_diff: Math.round(signed_diff * 100) / 100,
    abs_diff: Math.round(abs_diff * 100) / 100,
    percentage_change: Math.round(percentage_change * 10) / 10,
    z_score: Math.round(z_score * 100) / 100,
    direction,
    is_drastic: Math.abs(percentage_change) >= 40 || Math.abs(z_score) >= 2.5,
  };
}

/**
 * Tool 4: analyzeRecentPattern
 * Audits trajectory length and persistence of abnormality.
 */
export function analyzeRecentPattern(meter_id: string, date: string): RecentPatternSummary {
  const history = getMeterHistory(meter_id, date, 10);
  const targetIdx = history.findIndex((h) => h.date === date);

  let precedingSum = 0;
  let count = 0;
  for (let i = 0; i < targetIdx; i++) {
    precedingSum += history[i].consumption;
    count++;
  }
  const preceding_7d_avg = count > 0 ? precedingSum / count : history[targetIdx]?.consumption || 0;

  // Check how many neighboring days are also anomalous
  let abnormalConsecutive = 0;
  for (let i = targetIdx; i < history.length; i++) {
    if (Math.abs(history[i].percentage_change) >= 25) {
      abnormalConsecutive++;
    } else {
      break;
    }
  }

  let pattern_type: RecentPatternSummary['pattern_type'] = 'ACUTE_SINGLE_DAY';
  if (abnormalConsecutive > 5) {
    pattern_type = 'PERSISTENT_SUPPRESSION';
  } else if (abnormalConsecutive > 2) {
    pattern_type = 'MULTI_DAY_BURST';
  }

  return {
    preceding_7d_avg: Math.round(preceding_7d_avg * 100) / 100,
    consecutive_abnormal_days: abnormalConsecutive,
    pattern_type,
    stability_index: count > 0 ? Math.round((preceding_7d_avg / (history[targetIdx]?.historical_average || 1)) * 100) : 100,
  };
}
