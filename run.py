#!/usr/bin/env python3
"""Main Entry Point for Electricity Consumption Anomaly Detection and Investigation.

Commands:
    python run.py --process
        Preprocess 15-minute readings into daily baselines,
        engineer features, run Isolation Forest anomaly detection,
        and generate data/processed/ CSV files.

    python run.py [--port 5000]
        Starts the Flask decision-support web dashboard and investigation server.
"""

import os
import sys
import argparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from ensure_data import ensure_raw_dataset
from anomaly_detection.detector import ElectricityAnomalyDetector
from backend.app import create_app

def run_processing(meters=None):
    print("=" * 70)
    print("ELECTRICITY CONSUMPTION ANOMALY DETECTION PIPELINE")
    print("AI-Driven Decision Support System using Big Data & Isolation Forest")
    print("=" * 70)

    # 1. Ensure raw dataset exists
    raw_path = os.path.join(BASE_DIR, 'data', 'raw', 'LD2011_2014.txt')
    if not os.path.exists(raw_path):
        print(f"[Run] Raw dataset not found at {raw_path}. Initializing benchmark dataset...")
        ensure_raw_dataset(meters=meters or ['MT_001', 'MT_002', 'MT_003', 'MT_004', 'MT_005'])

    # 2. Run detector pipeline
    detector = ElectricityAnomalyDetector(meters=meters)
    stats = detector.run()

    print("-" * 70)
    print("PIPELINE COMPLETED SUCCESSFULLY:")
    print(f"  • Monitored Meters:  {stats['total_meters']}")
    print(f"  • Daily Records:     {stats['total_records']}")
    print(f"  • Flagged Anomalies: {stats['total_anomalies']}")
    print(f"  • High Priority:     {stats['high_priority']}")
    print(f"  • Processed Files:")
    print(f"      - data/processed/daily_consumption.csv")
    print(f"      - data/processed/all_results.csv")
    print(f"      - data/processed/anomalies.csv")
    print("=" * 70)
    print("Notice: An anomaly does not prove electricity theft.")
    print("Human and technical verification are required.")
    print("=" * 70)
    return stats

def run_server(host='0.0.0.0', port=5000, debug=False):
    # Check if processed data exists; if not, automatically run processing first so the user gets a working app immediately!
    anomalies_file = os.path.join(BASE_DIR, 'data', 'processed', 'anomalies.csv')
    if not os.path.exists(anomalies_file):
        print("[Run] Processed data not found. Running processing pipeline automatically...")
        run_processing()

    print("=" * 70)
    print("ELECTRICITY ANOMALY DETECTION & INVESTIGATION DASHBOARD")
    print(f"Server starting on http://127.0.0.1:{port}")
    print("=" * 70)

    app = create_app()
    app.run(host=host, port=port, debug=debug)

def main():
    parser = argparse.ArgumentParser(
        description="AI-Driven Electricity Consumption Anomaly Detection and Investigation"
    )
    parser.add_argument(
        '--process',
        action='store_true',
        help='Run Big Data processing and Isolation Forest anomaly detection'
    )
    parser.add_argument(
        '--port',
        type=int,
        default=int(os.environ.get('PORT', 5000)),
        help='Port to run the Flask application (default: 5000)'
    )
    parser.add_argument(
        '--host',
        type=str,
        default='0.0.0.0',
        help='Host to bind to (default: 0.0.0.0)'
    )
    parser.add_argument(
        '--meters',
        nargs='+',
        default=['MT_001', 'MT_002', 'MT_003', 'MT_004', 'MT_005'],
        help='Meter IDs to process (default: MT_001 MT_002 MT_003 MT_004 MT_005)'
    )
    parser.add_argument(
        '--debug',
        action='store_true',
        help='Run Flask in debug mode'
    )

    args = parser.parse_args()

    if args.process:
        run_processing(meters=args.meters)
    else:
        run_server(host=args.host, port=args.port, debug=args.debug)

if __name__ == '__main__':
    main()
