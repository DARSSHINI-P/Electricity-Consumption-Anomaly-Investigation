"""Agentic AI Investigation Engine for Electricity Consumption Anomalies.

Performs multi-step forensic reasoning on anomalous consumption patterns,
generating transparent decision-support reports for utility engineers.
"""

import os
import json
from agent.tools import get_meter_history, get_consumption_statistics, calculate_deviation

SYSTEM_LIMITATION_DISCLAIMER = (
    "An anomaly does not prove electricity theft. "
    "Human and technical verification are required before drawing any regulatory or contractual conclusions."
)

class ElectricityInvestigationAgent:
    def __init__(self, use_llm_if_available=True):
        self.use_llm_if_available = use_llm_if_available
        self.api_key = os.environ.get('GEMINI_API_KEY')

    def investigate(self, meter_id, target_date, anomaly_record=None):
        """Execute multi-step forensic investigation workflow.
        
        Workflow:
        1. Query Meter History & Longitudinal Baselines
        2. Calculate Statistical Deviations & Volatility
        3. Formulate Plausible Hypotheses / Possible Causes
        4. Assess Verification Priority
        5. Formulate Step-by-Step Recommended Verification Actions
        """
        # Step 1: Collect contextual telemetry
        stats = get_consumption_statistics(meter_id) or {}
        history = get_meter_history(meter_id, target_date, window_days=7)

        # Extract record attributes
        if anomaly_record:
            curr_consumption = float(anomaly_record.get('consumption', 0))
            hist_avg = float(anomaly_record.get('historical_average', stats.get('mean_daily_consumption', 0)))
            pct_change = float(anomaly_record.get('percentage_change', 0))
            anomaly_score = float(anomaly_record.get('anomaly_score', 0))
            raw_priority = str(anomaly_record.get('priority', 'MEDIUM')).upper()
        else:
            # Look up from history
            target_entry = next((item for item in history if str(item.get('date')) == str(target_date)), None)
            if target_entry:
                curr_consumption = float(target_entry.get('consumption', 0))
                hist_avg = float(target_entry.get('historical_average', stats.get('mean_daily_consumption', 0)))
                pct_change = float(target_entry.get('percentage_change', 0))
                anomaly_score = float(target_entry.get('anomaly_score', 0))
                raw_priority = str(target_entry.get('priority', 'MEDIUM')).upper()
            else:
                curr_consumption = 0.0
                hist_avg = float(stats.get('mean_daily_consumption', 50.0))
                pct_change = -100.0 if hist_avg > 0 else 0.0
                anomaly_score = 0.15
                raw_priority = 'HIGH'

        # Step 2: Deviation analysis
        dev = calculate_deviation(
            curr_consumption,
            hist_avg,
            stats.get('std_daily_consumption')
        )

        # Step 3: Determine Pattern, Causes, Priority, and Action
        investigation_result = self._deterministic_investigation(
            meter_id=meter_id,
            target_date=target_date,
            consumption=curr_consumption,
            historical_avg=hist_avg,
            pct_change=pct_change,
            anomaly_score=anomaly_score,
            raw_priority=raw_priority,
            dev=dev,
            stats=stats,
            history=history
        )

        # Step 4: Optional LLM enrichment if GEMINI_API_KEY is configured
        if self.use_llm_if_available and self.api_key and self.api_key != "MY_GEMINI_API_KEY":
            try:
                llm_summary = self._call_llm_synthesis(investigation_result)
                if llm_summary:
                    investigation_result['llm_enhanced_summary'] = llm_summary
            except Exception as e:
                # Fallback silently to deterministic report
                pass

        return investigation_result

    def _deterministic_investigation(self, meter_id, target_date, consumption, historical_avg,
                                    pct_change, anomaly_score, raw_priority, dev, stats, history):
        """Domain-grounded deterministic expert reasoning engine."""
        
        # Priority refinement
        abs_pct = abs(pct_change)
        if raw_priority == 'HIGH' or abs_pct >= 55.0 or consumption == 0 or anomaly_score >= 0.15:
            priority = 'HIGH'
        elif abs_pct >= 25.0 or anomaly_score >= 0.08:
            priority = 'MEDIUM'
        else:
            priority = 'NORMAL'

        # Observed pattern diagnosis
        direction = dev['direction']
        if consumption == 0:
            observed_pattern = (
                f"Meter {meter_id} recorded complete zero consumption on {target_date}, "
                f"representing a 100% collapse from its historical baseline average of {historical_avg:.2f} kWh/day."
            )
        elif direction == 'drop':
            observed_pattern = (
                f"Consumption on {target_date} ({consumption:.2f} kWh) decreased by "
                f"{abs(pct_change):.1f}% compared with the historical baseline ({historical_avg:.2f} kWh/day). "
                f"This constitutes an acute negative deviation."
            )
        elif direction == 'surge':
            observed_pattern = (
                f"Consumption on {target_date} ({consumption:.2f} kWh) experienced an anomalous surge of "
                f"+{pct_change:.1f}% over the historical baseline ({historical_avg:.2f} kWh/day)."
            )
        else:
            observed_pattern = (
                f"Consumption on {target_date} ({consumption:.2f} kWh) is closely aligned with "
                f"the historical average of {historical_avg:.2f} kWh/day."
            )

        # Plausible Causes evaluation
        possible_causes = []
        if consumption == 0:
            possible_causes.append({
                'category': 'meter_malfunction',
                'title': 'Meter Hardware Disconnection / CT Failure',
                'description': 'Current transformer (CT) open circuit, blown potential fuse, or internal register lockup.'
            })
            possible_causes.append({
                'category': 'operational_change',
                'title': 'Supply De-energization or Planned Outage',
                'description': 'Account disconnected for scheduled maintenance, seasonal suspension, or feeder outage.'
            })
            possible_causes.append({
                'category': 'potentially_suspicious',
                'title': 'Potentially Suspicious Physical Bypass',
                'description': 'Total secondary circuit shunt or meter terminal bridge diverting entire service load.'
            })
            possible_causes.append({
                'category': 'data_quality',
                'title': 'Data Telemetry / Head-End Drop',
                'description': 'Communication modem packet drop leading to null or defaulted zero registers.'
            })
        elif direction == 'drop':
            possible_causes.append({
                'category': 'customer_activity',
                'title': 'Reduced Customer Activity or Temporary Closure',
                'description': 'Customer holiday, factory turnaround, scheduled vacancy, or energy efficiency measures.'
            })
            possible_causes.append({
                'category': 'meter_malfunction',
                'title': 'Meter Current Drift / Phase Loss',
                'description': 'Partial phase failure on polyphase meter or calibration drift under-registering volume.'
            })
            possible_causes.append({
                'category': 'potentially_suspicious',
                'title': 'Potentially Suspicious Consumption Behaviour',
                'description': 'Partial circuit bypass or illegal load tapping causing a systematic under-recording.'
            })
            possible_causes.append({
                'category': 'operational_change',
                'title': 'Sub-panel Reconfiguration',
                'description': 'On-site load transfer to local generation (e.g., solar PV) or independent backup generator.'
            })
        else:
            possible_causes.append({
                'category': 'operational_change',
                'title': 'Industrial Ramp-up / Overtime Shift',
                'description': 'Temporary high-demand equipment commissioning, auxiliary heating, or additional operating shifts.'
            })
            possible_causes.append({
                'category': 'meter_malfunction',
                'title': 'Meter Register Inversion or Multiplier Error',
                'description': 'CT ratio calculation glitch, billing meter constant misconfiguration, or voltage surge.'
            })
            possible_causes.append({
                'category': 'potentially_suspicious',
                'title': 'Unauthorized Sub-feeder Connection',
                'description': 'Unaccounted connection of neighboring loads to the monitored circuit.'
            })

        # Recommended Verification Actions
        recommended_actions = [
            {
                'step': 1,
                'type': 'Desk Review & Customer Account Validation',
                'detail': 'Review customer billing history, contact records, contract capacity, and recent service requests.'
            },
            {
                'step': 2,
                'type': 'Grid Outage & SCADA Cross-Check',
                'detail': 'Correlate event timestamp with distribution substation SCADA logs to rule out feeder outages.'
            },
            {
                'step': 3,
                'type': 'AMI Telemetry & Event Log Audit',
                'detail': 'Inspect smart meter tamper registers (magnetic tamper, terminal cover open flags, reverse energy).'
            },
            {
                'step': 4,
                'type': 'On-Site Technical & Physical Verification',
                'detail': 'Dispatch field technician to inspect meter seal integrity, verify CT/PT wiring, and take reference clamp readings.'
            }
        ]

        # Historical comparison snippet
        history_window = []
        for h in history:
            history_window.append({
                'date': str(h.get('date')),
                'consumption': round(float(h.get('consumption', 0)), 2),
                'historical_average': round(float(h.get('historical_average', 0)), 2),
                'percentage_change': round(float(h.get('percentage_change', 0)), 2),
                'is_target': str(h.get('date')) == str(target_date)
            })

        return {
            'meter_id': meter_id,
            'date': target_date,
            'current_consumption': round(consumption, 2),
            'historical_average': round(historical_avg, 2),
            'percentage_change': round(pct_change, 2),
            'anomaly_score': round(anomaly_score, 4),
            'investigation_priority': priority,
            'observed_pattern': observed_pattern,
            'consumption_details': {
                'recorded_consumption': f"{consumption:.2f} kWh",
                'historical_baseline': f"{historical_avg:.2f} kWh",
                'absolute_deviation': f"{dev['absolute_deviation']:.2f} kWh",
                'percentage_change': f"{pct_change:+.1f}%",
                'standard_deviation': f"{stats.get('std_daily_consumption', 0):.2f} kWh",
                'z_score': dev.get('z_score'),
                'meter_total_days': stats.get('total_recorded_days', 0)
            },
            'possible_causes': possible_causes,
            'recommended_actions': recommended_actions,
            'history_window': history_window,
            'system_limitation': SYSTEM_LIMITATION_DISCLAIMER
        }

    def _call_llm_synthesis(self, result):
        """Optional synthesis using Google GenAI SDK if API key is provided."""
        from google import genai
        client = genai.Client(api_key=self.api_key)
        prompt = (
            f"You are a utility forensic decision-support assistant.\n"
            f"Summarize this electrical meter investigation concisely for a utility engineering briefing:\n"
            f"Meter: {result['meter_id']}, Date: {result['date']}\n"
            f"Consumption: {result['current_consumption']} kWh (Baseline: {result['historical_average']} kWh, Change: {result['percentage_change']}%)\n"
            f"Priority: {result['investigation_priority']}\n"
            f"Remember: An anomaly does not prove electricity theft. Frame recommendations objectively."
        )
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
