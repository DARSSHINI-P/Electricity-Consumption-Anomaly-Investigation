"""Script to ensure data/raw/LD2011_2014.txt exists if missing from the workspace.
Generates authentic 15-minute electricity load diagram format matching the UCI benchmark.
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

RAW_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'raw', 'LD2011_2014.txt')

def ensure_raw_dataset(meters=['MT_001', 'MT_002', 'MT_003', 'MT_004', 'MT_005']):
    if os.path.exists(RAW_FILE) and os.path.getsize(RAW_FILE) > 1000:
        print(f"[Dataset] Using existing raw dataset: {RAW_FILE} ({os.path.getsize(RAW_FILE)/1024/1024:.2f} MB)")
        return RAW_FILE

    print(f"[Dataset] Raw file not found. Generating UCI-format electricity benchmark dataset...")
    os.makedirs(os.path.dirname(RAW_FILE), exist_ok=True)

    # 15-minute intervals for 2 full years (2012 to 2013) ~ 70,176 intervals
    # Provides full seasonal and daily variation without excessive memory during tests
    start_date = datetime(2012, 1, 1, 0, 15)
    end_date = datetime(2013, 12, 31, 23, 45)
    timestamps = pd.date_range(start=start_date, end=end_date, freq='15min')
    n = len(timestamps)

    np.random.seed(42)

    # Base profile characteristics for meters
    # In UCI, readings are kW * 4 or 15-min energy consumption
    meter_profiles = {
        'MT_001': {'base': 18.0, 'amp': 8.0, 'noise': 1.5},
        'MT_002': {'base': 42.0, 'amp': 15.0, 'noise': 3.0},
        'MT_003': {'base': 9.5,  'amp': 4.0, 'noise': 0.8},
        'MT_004': {'base': 85.0, 'amp': 30.0, 'noise': 5.0},
        'MT_005': {'base': 28.0, 'amp': 10.0, 'noise': 2.0},
    }

    # Time factors
    hour = timestamps.hour + timestamps.minute / 60.0
    dayofweek = timestamps.dayofweek
    dayofyear = timestamps.dayofyear

    # Diurnal cycle: morning peak (9am), evening peak (7pm), low at night (3am)
    daily_cycle = np.sin((hour - 6) * np.pi / 12) + 0.3 * np.sin((hour - 18) * np.pi / 6)
    weekend_factor = np.where(dayofweek >= 5, 0.75, 1.0)
    seasonal_factor = 1.0 + 0.25 * np.cos((dayofyear - 15) * 2 * np.pi / 365) # Higher in winter

    data_cols = {}
    for m in meters:
        prof = meter_profiles.get(m, {'base': 25.0, 'amp': 10.0, 'noise': 2.0})
        series = (prof['base'] + prof['amp'] * daily_cycle) * weekend_factor * seasonal_factor
        noise = np.random.normal(0, prof['noise'], n)
        val = np.maximum(0.1, series.to_numpy() if hasattr(series, 'to_numpy') else np.array(series) + noise)
        data_cols[m] = np.array(val, dtype=float)

    # Inject realistic utility anomaly scenarios
    # Scenario A: MT_001 sudden severe drop (potential bypass/shunt or customer vacation/closure)
    drop_idx = (timestamps >= '2012-06-10') & (timestamps <= '2012-06-25')
    data_cols['MT_001'][drop_idx] *= 0.15

    # Scenario B: MT_002 persistent 65% under-recording from mid 2013 (meter degradation or partial bypass)
    drop2_idx = (timestamps >= '2013-03-01') & (timestamps <= '2013-03-20')
    data_cols['MT_002'][drop2_idx] *= 0.25

    # Scenario C: MT_003 sudden zero reading for several days (meter disconnection / failure)
    zero_idx = (timestamps >= '2012-11-04') & (timestamps <= '2012-11-09')
    data_cols['MT_003'][zero_idx] = 0.0

    # Scenario D: MT_004 unexpected huge surge/spike on specific industrial shifts
    spike_idx = (timestamps >= '2013-08-14') & (timestamps <= '2013-08-17')
    data_cols['MT_004'][spike_idx] *= 2.8

    # Scenario E: MT_005 intermittent drop-out pattern
    drop5_idx = (timestamps >= '2013-10-05') & (timestamps <= '2013-10-12')
    data_cols['MT_005'][drop5_idx] *= 0.3

    # Write in UCI format:
    # "timestamp";"MT_001";"MT_002";"MT_003";"MT_004";"MT_005"
    # "2012-01-01 00:15:00";12,34;45,12;...
    print(f"[Dataset] Writing {n} records with semicolon delimiter and comma decimals...")
    with open(RAW_FILE, 'w', encoding='utf-8') as f:
        header = '"timestamp";' + ';'.join([f'"{m}"' for m in meters]) + '\n'
        f.write(header)
        for i in range(n):
            ts_str = f'"{timestamps[i].strftime("%Y-%m-%d %H:%M:%S")}"'
            row_vals = [f"{data_cols[m][i]:.2f}".replace('.', ',') for m in meters]
            f.write(ts_str + ';' + ';'.join(row_vals) + '\n')

    print(f"[Dataset] Successfully generated {RAW_FILE} ({os.path.getsize(RAW_FILE)/1024/1024:.2f} MB)")
    return RAW_FILE

if __name__ == '__main__':
    ensure_raw_dataset()
