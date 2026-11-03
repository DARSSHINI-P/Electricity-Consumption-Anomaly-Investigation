"""Script to generate electricity_consumption_demo_under_20mb.csv matching the uploaded dataset specifications.
30 meters x 365 days = 10,950 records.
Contains normal consumption across consumer types and locations, with realistic baseline variations
and the exact injected anomalous periods.
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_csv(output_path='electricity_consumption_demo_under_20mb.csv'):
    np.random.seed(42)

    meters_info = [
        ('MT_001', 'Residential', 'Chennai North', 750.0, 50.0, None),
        ('MT_002', 'Commercial', 'Chennai South', 600.0, 45.0, None),
        ('MT_003', 'Industrial', 'Chennai Central', 220.0, 18.0, None),
        ('MT_004', 'Institutional', 'Tambaram', 900.0, 60.0, None),
        ('MT_005', 'Residential', 'Avadi', 780.0, 55.0, None),
        ('MT_006', 'Commercial', 'Chennai North', 760.0, 50.0, None),
        ('MT_007', 'Industrial', 'Chennai South', 370.0, 28.0, ('2025-04-10', '2025-04-24', 'Sudden Drop', 0.25)),
        ('MT_008', 'Institutional', 'Chennai Central', 900.0, 65.0, None),
        ('MT_009', 'Residential', 'Tambaram', 520.0, 40.0, None),
        ('MT_010', 'Commercial', 'Avadi', 210.0, 16.0, None),
        ('MT_011', 'Industrial', 'Chennai North', 820.0, 60.0, None),
        ('MT_012', 'Institutional', 'Chennai South', 900.0, 65.0, None),
        ('MT_013', 'Residential', 'Chennai Central', 530.0, 40.0, None),
        ('MT_014', 'Commercial', 'Tambaram', 350.0, 26.0, ('2025-06-15', '2025-06-25', 'Sudden Spike', 2.8)),
        ('MT_015', 'Industrial', 'Avadi', 330.0, 25.0, None),
        ('MT_016', 'Institutional', 'Chennai North', 670.0, 50.0, None),
        ('MT_017', 'Residential', 'Chennai South', 620.0, 45.0, None),
        ('MT_018', 'Commercial', 'Chennai Central', 720.0, 55.0, None),
        ('MT_019', 'Industrial', 'Tambaram', 760.0, 55.0, None),
        ('MT_020', 'Institutional', 'Avadi', 670.0, 50.0, None),
        ('MT_021', 'Residential', 'Chennai North', 700.0, 50.0, ('2025-08-01', '2025-08-20', 'Sustained Drop', 0.38)),
        ('MT_022', 'Commercial', 'Chennai South', 660.0, 48.0, None),
        ('MT_023', 'Industrial', 'Chennai Central', 470.0, 35.0, None),
        ('MT_024', 'Institutional', 'Tambaram', 440.0, 32.0, None),
        ('MT_025', 'Residential', 'Avadi', 500.0, 38.0, None),
        ('MT_026', 'Commercial', 'Chennai North', 730.0, 52.0, None),
        ('MT_027', 'Industrial', 'Chennai South', 680.0, 48.0, None),
        ('MT_028', 'Institutional', 'Chennai Central', 490.0, 38.0, ('2025-10-05', '2025-10-15', 'Unusual Spike', 2.1)),
        ('MT_029', 'Residential', 'Tambaram', 520.0, 40.0, None),
        ('MT_030', 'Commercial', 'Avadi', 205.0, 16.0, None)
    ]

    dates = pd.date_range(start='2025-01-01', end='2025-12-31', freq='D')
    rows = []

    for meter_id, c_type, loc, base_mean, base_std, anomaly_spec in meters_info:
        for d in dates:
            d_str = d.strftime('%Y-%m-%d')
            day_of_week = d.dayofweek
            day_of_year = d.dayofyear

            # Weekend effect (lower for commercial/residential/institutional, varying)
            if day_of_week in [5, 6]:
                weekend_factor = 0.85 if c_type == 'Residential' else 0.72
            else:
                weekend_factor = 1.02

            # Seasonal weather curve (summer AC peak in April-June in Chennai)
            summer_boost = 1.0 + 0.12 * np.sin((day_of_year - 60) * np.pi / 180)

            noise = np.random.normal(0, base_std * 0.7)
            val = (base_mean * weekend_factor * summer_boost) + noise

            pattern = 'Normal'

            # Apply anomaly if within window
            if anomaly_spec:
                start_a, end_a, anom_type, mult = anomaly_spec
                if start_a <= d_str <= end_a:
                    val = val * mult
                    pattern = anom_type

            val = max(5.0, round(float(val), 2))
            rows.append({
                'meter_id': meter_id,
                'date': d_str,
                'consumer_type': c_type,
                'location': loc,
                'consumption_kwh': val,
                'demo_pattern': pattern
            })

    df = pd.DataFrame(rows)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} records in {output_path}")

    # Also save to data/
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/electricity_consumption_demo_under_20mb.csv', index=False)
    return df

if __name__ == '__main__':
    generate_csv()
