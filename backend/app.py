"""Flask Web Backend for Electricity Consumption Anomaly Detection and Investigation.

Serves the academic decision-support dashboard, Chart.js telemetry,
and Agentic AI investigation forensic reports.
"""

import os
import sys
import pandas as pd
from flask import Flask, render_template, request, jsonify, redirect, url_for

# Ensure workspace root is in python path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from agent.investigation_agent import ElectricityInvestigationAgent
from anomaly_detection.detector import ElectricityAnomalyDetector

TEMPLATES_DIR = os.path.join(ROOT_DIR, 'dashboard', 'templates')
STATIC_DIR = os.path.join(ROOT_DIR, 'dashboard', 'static')
PROCESSED_DIR = os.path.join(ROOT_DIR, 'data', 'processed')

def create_app():
    app = Flask(
        __name__,
        template_folder=TEMPLATES_DIR,
        static_folder=STATIC_DIR,
        static_url_path='/static'
    )

    def check_processed_data_exists():
        anomalies_file = os.path.join(PROCESSED_DIR, 'anomalies.csv')
        daily_file = os.path.join(PROCESSED_DIR, 'daily_consumption.csv')
        all_results_file = os.path.join(PROCESSED_DIR, 'all_results.csv')
        return os.path.exists(anomalies_file) and os.path.exists(daily_file) and os.path.exists(all_results_file)

    @app.route('/')
    def dashboard():
        if not check_processed_data_exists():
            return render_template('index.html', data_ready=False)

        try:
            anomalies_df = pd.read_csv(os.path.join(PROCESSED_DIR, 'anomalies.csv'))
            daily_df = pd.read_csv(os.path.join(PROCESSED_DIR, 'daily_consumption.csv'))
            all_df = pd.read_csv(os.path.join(PROCESSED_DIR, 'all_results.csv'))

            # Summary Metrics
            meters_list = sorted(list(daily_df['meter_id'].unique()))
            total_meters = len(meters_list)
            total_days = int(daily_df['date'].nunique())
            total_anomalies = len(anomalies_df)
            high_priority_count = len(anomalies_df[anomalies_df['priority'] == 'HIGH'])

            # Selected meter for chart (default to first meter or query param)
            selected_meter = request.args.get('meter', meters_list[0] if meters_list else 'MT_001')

            # Prepare chart data for selected meter
            meter_records = all_df[all_df['meter_id'] == selected_meter].sort_values('date')
            chart_labels = meter_records['date'].astype(str).tolist()
            chart_consumption = meter_records['consumption'].round(2).tolist()
            chart_baseline = meter_records['historical_average'].round(2).tolist()
            chart_rolling = meter_records['rolling_7d_avg'].round(2).tolist() if 'rolling_7d_avg' in meter_records.columns else []
            
            # Anomaly points indices and coordinates
            anomaly_dates = set(anomalies_df[anomalies_df['meter_id'] == selected_meter]['date'].astype(str))
            chart_anomalies = [
                {'x': row['date'], 'y': row['consumption'], 'priority': row['priority']}
                for _, row in meter_records.iterrows()
                if str(row['date']) in anomaly_dates
            ]

            # Convert anomaly rows to dict
            anomalies_table = anomalies_df.to_dict(orient='records')

            return render_template(
                'index.html',
                data_ready=True,
                total_meters=total_meters,
                total_days=total_days,
                total_anomalies=total_anomalies,
                high_priority_count=high_priority_count,
                meters=meters_list,
                selected_meter=selected_meter,
                chart_labels=chart_labels,
                chart_consumption=chart_consumption,
                chart_baseline=chart_baseline,
                chart_rolling=chart_rolling,
                chart_anomalies=chart_anomalies,
                anomalies=anomalies_table
            )
        except Exception as e:
            return render_template('index.html', data_ready=False, error_message=str(e))

    @app.route('/investigate/<meter_id>/<date>')
    def investigate(meter_id, date):
        if not check_processed_data_exists():
            return redirect(url_for('dashboard'))

        try:
            anomalies_file = os.path.join(PROCESSED_DIR, 'anomalies.csv')
            anomalies_df = pd.read_csv(anomalies_file)
            
            # Match record
            match = anomalies_df[(anomalies_df['meter_id'] == meter_id) & (anomalies_df['date'].astype(str) == str(date))]
            anomaly_record = match.iloc[0].to_dict() if not match.empty else None

            # Execute Agentic AI investigation
            agent = ElectricityInvestigationAgent()
            report = agent.investigate(meter_id, date, anomaly_record)

            return render_template(
                'investigation.html',
                report=report,
                meter_id=meter_id,
                date=date
            )
        except Exception as e:
            return f"Investigation processing error: {e}", 500

    @app.route('/api/investigate/<meter_id>/<date>')
    def api_investigate(meter_id, date):
        try:
            anomalies_file = os.path.join(PROCESSED_DIR, 'anomalies.csv')
            if not os.path.exists(anomalies_file):
                return jsonify({'error': 'Data not processed yet'}), 400

            anomalies_df = pd.read_csv(anomalies_file)
            match = anomalies_df[(anomalies_df['meter_id'] == meter_id) & (anomalies_df['date'].astype(str) == str(date))]
            anomaly_record = match.iloc[0].to_dict() if not match.empty else None

            agent = ElectricityInvestigationAgent()
            report = agent.investigate(meter_id, date, anomaly_record)
            return jsonify({'success': True, 'report': report})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/anomalies')
    def api_anomalies():
        anomalies_file = os.path.join(PROCESSED_DIR, 'anomalies.csv')
        if not os.path.exists(anomalies_file):
            return jsonify({'error': 'Data not processed yet'}), 400

        df = pd.read_csv(anomalies_file)
        return jsonify({
            'total': len(df),
            'anomalies': df.to_dict(orient='records')
        })

    @app.route('/api/chart-data')
    def api_chart_data():
        meter_id = request.args.get('meter', 'MT_001')
        all_results_file = os.path.join(PROCESSED_DIR, 'all_results.csv')
        anomalies_file = os.path.join(PROCESSED_DIR, 'anomalies.csv')

        if not os.path.exists(all_results_file):
            return jsonify({'error': 'Data not processed yet'}), 400

        all_df = pd.read_csv(all_results_file)
        anomalies_df = pd.read_csv(anomalies_file) if os.path.exists(anomalies_file) else pd.DataFrame()

        meter_records = all_df[all_df['meter_id'] == meter_id].sort_values('date')
        if meter_records.empty:
            return jsonify({'error': f'Meter {meter_id} not found'}), 404

        anomaly_dates = set(anomalies_df[anomalies_df['meter_id'] == meter_id]['date'].astype(str)) if not anomalies_df.empty else set()

        return jsonify({
            'meter_id': meter_id,
            'labels': meter_records['date'].astype(str).tolist(),
            'consumption': meter_records['consumption'].round(2).tolist(),
            'historical_average': meter_records['historical_average'].round(2).tolist(),
            'rolling_7d_avg': meter_records['rolling_7d_avg'].round(2).tolist() if 'rolling_7d_avg' in meter_records.columns else [],
            'anomalies': [
                {'date': str(row['date']), 'consumption': float(row['consumption']), 'priority': str(row.get('priority', 'MEDIUM'))}
                for _, row in meter_records.iterrows()
                if str(row['date']) in anomaly_dates
            ]
        })

    @app.route('/api/summary')
    def api_summary():
        if not check_processed_data_exists():
            return jsonify({'ready': False, 'message': 'Run python run.py --process first'})

        anomalies_df = pd.read_csv(os.path.join(PROCESSED_DIR, 'anomalies.csv'))
        daily_df = pd.read_csv(os.path.join(PROCESSED_DIR, 'daily_consumption.csv'))

        return jsonify({
            'ready': True,
            'total_meters': int(daily_df['meter_id'].nunique()),
            'total_days': int(daily_df['date'].nunique()),
            'total_anomalies': int(len(anomalies_df)),
            'high_priority_cases': int(len(anomalies_df[anomalies_df['priority'] == 'HIGH'])),
            'medium_priority_cases': int(len(anomalies_df[anomalies_df['priority'] == 'MEDIUM'])),
        })

    @app.route('/api/trigger-process', methods=['POST'])
    def trigger_process():
        try:
            detector = ElectricityAnomalyDetector()
            stats = detector.run()
            return jsonify({'success': True, 'stats': stats})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
