"""Agentic AI Investigation Tools.

Provides analytical tools for meter historical analysis, deviation calculation,
contextual statistics, and investigation synthesis.
"""

import os
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROCESSED_DIR = os.path.join(BASE_DIR, 'data', 'processed')

def get_meter_history(meter_id, target_date=None, window_days=14):
    """Retrieve historical daily consumption records for a specific meter around a target date.
    
    Args:
        meter_id: Meter identifier (e.g. 'MT_001')
        target_date: Target ISO date string (YYYY-MM-DD). If None, returns recent history.
        window_days: Number of preceding and succeeding days to inspect.
    """
    all_results_file = os.path.join(PROCESSED_DIR, 'all_results.csv')
    if not os.path.exists(all_results_file):
        daily_file = os.path.join(PROCESSED_DIR, 'daily_consumption.csv')
        if not os.path.exists(daily_file):
            return []
        df = pd.read_csv(daily_file)
    else:
        df = pd.read_csv(all_results_file)

    meter_df = df[df['meter_id'] == meter_id].copy()
    if meter_df.empty:
        return []

    meter_df['date'] = pd.to_datetime(meter_df['date'])
    meter_df = meter_df.sort_values('date').reset_index(drop=True)

    if target_date:
        t_date = pd.to_datetime(target_date)
        start_date = t_date - pd.Timedelta(days=window_days)
        end_date = t_date + pd.Timedelta(days=window_days)
        window_df = meter_df[(meter_df['date'] >= start_date) & (meter_df['date'] <= end_date)].copy()
    else:
        window_df = meter_df.tail(window_days * 2).copy()

    window_df['date'] = window_df['date'].dt.strftime('%Y-%m-%d')
    return window_df.to_dict(orient='records')

def get_consumption_statistics(meter_id):
    """Compute aggregate statistical baseline metrics for a meter over its entire recorded period."""
    all_results_file = os.path.join(PROCESSED_DIR, 'all_results.csv')
    if not os.path.exists(all_results_file):
        return None

    df = pd.read_csv(all_results_file)
    meter_df = df[df['meter_id'] == meter_id]
    if meter_df.empty:
        return None

    consumption = meter_df['consumption'].values
    return {
        'meter_id': meter_id,
        'total_recorded_days': int(len(consumption)),
        'mean_daily_consumption': float(np.mean(consumption).round(2)),
        'median_daily_consumption': float(np.median(consumption).round(2)),
        'std_daily_consumption': float(np.std(consumption).round(2)),
        'min_daily_consumption': float(np.min(consumption).round(2)),
        'max_daily_consumption': float(np.max(consumption).round(2)),
        'q25': float(np.percentile(consumption, 25).round(2)),
        'q75': float(np.percentile(consumption, 75).round(2)),
    }

def calculate_deviation(current_consumption, baseline_consumption, std_consumption=None):
    """Calculate absolute, relative, and standardized (Z-score) deviations."""
    current = float(current_consumption)
    baseline = float(baseline_consumption) if baseline_consumption != 0 else 1e-6
    
    absolute_diff = current - baseline
    percentage_change = (absolute_diff / baseline) * 100.0
    
    z_score = None
    if std_consumption and std_consumption > 0:
        z_score = round(absolute_diff / std_consumption, 2)

    return {
        'absolute_deviation': round(abs(absolute_diff), 2),
        'signed_difference': round(absolute_diff, 2),
        'percentage_change': round(percentage_change, 2),
        'z_score': z_score,
        'direction': 'drop' if absolute_diff < 0 else ('surge' if absolute_diff > 0 else 'flat')
    }

def generate_investigation_report(meter_id, date, anomaly_data=None):
    """Generate structured analytical investigation findings combining data tools."""
    from agent.investigation_agent import ElectricityInvestigationAgent
    agent = ElectricityInvestigationAgent()
    return agent.investigate(meter_id, date, anomaly_data)
