"""Electricity Consumption Anomaly Detection Pipeline.

Uses Isolation Forest on engineered daily consumption features.
Academic decision-support prototype for electricity distribution utilities.
"""

import os
import re
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DATA_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'LD2011_2014.txt')
PROCESSED_DIR = os.path.join(BASE_DIR, 'data', 'processed')

DEFAULT_METERS = ['MT_001', 'MT_002', 'MT_003', 'MT_004', 'MT_005']

class ElectricityAnomalyDetector:
    def __init__(self, raw_path=RAW_DATA_PATH, processed_dir=PROCESSED_DIR, meters=None):
        self.raw_path = raw_path
        self.processed_dir = processed_dir
        self.meters = meters or DEFAULT_METERS
        os.makedirs(self.processed_dir, exist_ok=True)

    def _get_available_columns(self):
        """Inspect the header of the raw dataset to find exact column names (accounting for quotes)."""
        if not os.path.exists(self.raw_path):
            raise FileNotFoundError(f"Raw dataset not found at: {self.raw_path}")
        
        with open(self.raw_path, 'r', encoding='utf-8', errors='ignore') as f:
            header_line = f.readline().strip()
        
        # Split by semicolon and strip quotes and whitespace
        raw_cols = [c.strip().strip('"').strip("'") for c in header_line.split(';')]
        return raw_cols

    def load_and_preprocess(self):
        """Read only requested meter columns, parse timestamps, and handle comma decimals."""
        print(f"[Detector] Reading raw data from: {self.raw_path}")
        available_cols = self._get_available_columns()
        
        # Match timestamp column
        ts_col = None
        for col in available_cols:
            if col.lower() in ['timestamp', 'date', 'time']:
                ts_col = col
                break
        if not ts_col:
            ts_col = available_cols[0]

        # Determine which target meters exist in the dataset
        selected_cols = [ts_col]
        valid_meters = []
        for m in self.meters:
            if m in available_cols:
                selected_cols.append(m)
                valid_meters.append(m)
            else:
                # Try case-insensitive or stripped match
                match = next((c for c in available_cols if c.strip('"') == m), None)
                if match:
                    selected_cols.append(match)
                    valid_meters.append(match)

        if not valid_meters:
            # Fallback to first few meter columns
            valid_meters = [c for c in available_cols if c != ts_col][:5]
            selected_cols = [ts_col] + valid_meters

        print(f"[Detector] Selected meters to load: {valid_meters}")

        # In pandas, if column names in file have quotes, specify a callable or column names
        # Reading with usecols avoids loading 370 columns into memory
        def usecol_filter(col_name):
            cleaned = col_name.strip().strip('"').strip("'")
            return cleaned == ts_col or cleaned in valid_meters

        df = pd.read_csv(
            self.raw_path,
            sep=';',
            decimal=',',
            usecols=usecol_filter,
            dtype=str,
            low_memory=False
        )

        # Clean column names
        df.columns = [c.strip().strip('"').strip("'") for c in df.columns]

        # Parse timestamp safely
        df[ts_col] = pd.to_datetime(df[ts_col].astype(str).str.strip('"'), errors='coerce')
        df = df.dropna(subset=[ts_col])
        df = df.rename(columns={ts_col: 'timestamp'})

        # Convert values to numeric safely (handling decimal commas if string)
        for m in valid_meters:
            if m in df.columns:
                if df[m].dtype == object:
                    df[m] = df[m].astype(str).str.replace(',', '.')
                df[m] = pd.to_numeric(df[m], errors='coerce').fillna(0.0)

        df['date'] = df['timestamp'].dt.date
        print(f"[Detector] Loaded {len(df)} 15-minute readings across {len(valid_meters)} meters.")
        return df, valid_meters

    def aggregate_daily_and_engineer_features(self, df, valid_meters):
        """Aggregate 15-minute readings into daily consumption and engineer baseline features."""
        print("[Detector] Aggregating 15-minute readings into daily consumption...")
        daily_records = []

        for m in valid_meters:
            m_daily = df.groupby('date')[m].sum().reset_index()
            m_daily.columns = ['date', 'consumption']
            m_daily['meter_id'] = m
            m_daily = m_daily.sort_values('date').reset_index(drop=True)

            # Feature Engineering:
            # 1. Historical Average (cumulative expanding mean up to the current day)
            m_daily['historical_average'] = m_daily['consumption'].expanding(min_periods=1).mean()

            # 2. 7-Day Rolling Average
            m_daily['rolling_7d_avg'] = m_daily['consumption'].rolling(window=7, min_periods=1).mean()

            # 3. Absolute Deviation from historical average
            m_daily['absolute_deviation'] = (m_daily['consumption'] - m_daily['historical_average']).abs()

            # 4. Percentage Change from historical average
            # Safe division avoiding divide-by-zero
            denom = m_daily['historical_average'].replace(0, np.nan)
            m_daily['percentage_change'] = ((m_daily['consumption'] - m_daily['historical_average']) / denom) * 100.0
            m_daily['percentage_change'] = m_daily['percentage_change'].fillna(0.0)

            # 5. Volatility / Rolling standard deviation
            m_daily['rolling_7d_std'] = m_daily['consumption'].rolling(window=7, min_periods=1).std().fillna(0.0)

            daily_records.append(m_daily)

        combined_daily = pd.concat(daily_records, ignore_index=True)
        print(f"[Detector] Total daily aggregated records: {len(combined_daily)}")
        return combined_daily

    def detect_anomalies(self, daily_df):
        """Run Isolation Forest on engineered daily consumption features and assign transparent priorities."""
        print("[Detector] Training Isolation Forest for anomaly detection...")
        results = []

        # Feature matrix columns for anomaly detection
        feature_cols = ['consumption', 'historical_average', 'rolling_7d_avg', 'absolute_deviation', 'percentage_change']

        # Process per meter so each meter's intrinsic scale is respected
        for meter_id, group in daily_df.groupby('meter_id'):
            group = group.copy().sort_values('date').reset_index(drop=True)

            X = group[feature_cols].copy()
            # Replace NaNs/Infs
            X = X.replace([np.inf, -np.inf], np.nan).fillna(0.0)

            # Isolation Forest with 4% contamination rate
            model = IsolationForest(
                n_estimators=100,
                contamination=0.04,
                random_state=42
            )
            model.fit(X)

            # Prediction: -1 is anomalous, 1 is normal
            preds = model.predict(X)
            # Decision function: lower values mean more anomalous
            # Standardize score into positive anomaly score where higher = more anomalous
            scores = -model.decision_function(X)

            group['anomaly'] = preds
            group['anomaly_score'] = scores.round(4)

            # Priority assignment transparent heuristic
            # HIGH: anomaly == -1 and (major drop/spike |abs(percentage_change)| >= 50% or anomaly_score >= 0.15)
            # MEDIUM: anomaly == -1 and moderate deviation
            # NORMAL: anomaly == 1
            priorities = []
            for _, row in group.iterrows():
                if row['anomaly'] == -1:
                    pct = abs(row['percentage_change'])
                    score = row['anomaly_score']
                    if pct >= 50.0 or score >= 0.14 or row['consumption'] == 0:
                        priorities.append('HIGH')
                    else:
                        priorities.append('MEDIUM')
                else:
                    priorities.append('NORMAL')

            group['priority'] = priorities
            results.append(group)

        final_df = pd.concat(results, ignore_index=True)
        return final_df

    def run(self):
        """Run full end-to-end data processing and anomaly detection pipeline."""
        df_raw, valid_meters = self.load_and_preprocess()
        daily_df = self.aggregate_daily_and_engineer_features(df_raw, valid_meters)

        # Save daily consumption
        daily_csv = os.path.join(self.processed_dir, 'daily_consumption.csv')
        daily_df.to_csv(daily_csv, index=False)
        print(f"[Detector] Saved daily consumption to: {daily_csv}")

        # Anomaly detection
        all_results_df = self.detect_anomalies(daily_df)

        # Format and round columns cleanly
        all_results_df['consumption'] = all_results_df['consumption'].round(2)
        all_results_df['historical_average'] = all_results_df['historical_average'].round(2)
        all_results_df['rolling_7d_avg'] = all_results_df['rolling_7d_avg'].round(2)
        all_results_df['percentage_change'] = all_results_df['percentage_change'].round(2)
        all_results_df['absolute_deviation'] = all_results_df['absolute_deviation'].round(2)

        # Reorder columns as requested
        output_cols = [
            'meter_id',
            'date',
            'consumption',
            'historical_average',
            'percentage_change',
            'anomaly_score',
            'anomaly',
            'priority'
        ]

        # Save all_results.csv
        all_csv = os.path.join(self.processed_dir, 'all_results.csv')
        all_results_df[output_cols].to_csv(all_csv, index=False)
        print(f"[Detector] Saved all results to: {all_csv} ({len(all_results_df)} rows)")

        # Save anomalies.csv (only anomaly == -1)
        anomalies_df = all_results_df[all_results_df['anomaly'] == -1].copy()
        # Sort anomalies by priority (HIGH first) and absolute percentage change descending
        priority_rank = {'HIGH': 0, 'MEDIUM': 1, 'NORMAL': 2}
        anomalies_df['p_rank'] = anomalies_df['priority'].map(priority_rank)
        anomalies_df = anomalies_df.sort_values(by=['p_rank', 'anomaly_score'], ascending=[True, False]).drop(columns=['p_rank'])

        anomalies_csv = os.path.join(self.processed_dir, 'anomalies.csv')
        anomalies_df[output_cols].to_csv(anomalies_csv, index=False)
        print(f"[Detector] Saved anomalies to: {anomalies_csv} ({len(anomalies_df)} anomalies found)")

        return {
            'total_meters': len(valid_meters),
            'total_records': len(all_results_df),
            'total_anomalies': len(anomalies_df),
            'high_priority': len(anomalies_df[anomalies_df['priority'] == 'HIGH'])
        }

def run_pipeline(meters=None):
    detector = ElectricityAnomalyDetector(meters=meters)
    return detector.run()

if __name__ == '__main__':
    run_pipeline()
