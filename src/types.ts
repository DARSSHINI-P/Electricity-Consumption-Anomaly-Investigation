export interface AnomalyCase {
  meter_id: string;
  date: string;
  consumer_type: string;
  location: string;
  consumption: number;
  historical_average: number;
  percentage_change: number;
  anomaly_score: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  rolling_average?: number;
  consumption_change?: number;
}

export interface KpiSummary {
  total_meters: number;
  total_records: number;
  total_anomalies: number;
  high_priority_cases: number;
  medium_priority_cases: number;
  low_priority_cases: number;
}

export interface ChartDataSets {
  consumption_trend: Array<{ period: string; average_kwh: number; total_kwh: number }>;
  anomalies_over_time: Array<{ period: string; high: number; medium: number; low: number; total: number }>;
  consumption_by_type: Array<{ type: string; total_kwh: number; avg_daily_kwh: number }>;
  anomalies_by_location: Array<{ location: string; total_anomalies: number; high_priority: number }>;
  priority_distribution: Array<{ priority: string; count: number }>;
}

export interface MeterSummary {
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

export interface InspectorNote {
  id: string;
  caseKey: string;
  timestamp: string;
  technicianName: string;
  badgeNumber: string;
  status: 'PENDING_AUDIT' | 'DISPATCHED' | 'VERIFIED_NORMAL' | 'FAULT_CONFIRMED';
  workOrderId: string;
  findings: string;
}

export interface AgentToolTraceItem {
  name: string;
  description: string;
  durationMs: number;
  status: 'SUCCESS' | 'EXECUTING';
  inputs: Record<string, any>;
  outputs: Record<string, any>;
}

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
  history_window: Array<{
    date: string;
    consumption: number;
    historical_average: number;
    percentage_change: number;
    anomaly_score: number;
    is_target: boolean;
  }>;
}

export type ActiveTab = 'dashboard' | 'anomalies' | 'meters' | 'investigation' | 'about';
