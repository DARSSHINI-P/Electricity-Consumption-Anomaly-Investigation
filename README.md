# AI-Driven Electricity Consumption Anomaly Detection and Investigation using Big Data and Agentic AI

An academic decision-support prototype designed for electricity distribution utilities, combining high-volume time-series telemetry preprocessing, unsupervised machine learning (Isolation Forest), and Agentic AI forensic reasoning.

---

## 1. Problem Statement

Electricity distribution utilities confront significant operational challenges stemming from anomalous consumption patterns, including meter technical faults, wiring degradation, current transformer (CT) phase disconnection, operational load changes, and unauthorized non-technical losses (NTL).

Traditional rule-based threshold filters suffer from severe false-positive rates and fail to account for diurnal rhythms, customer-specific baselines, and seasonal shifts. Furthermore, raw algorithmic flags lack contextual reasoning, forcing field inspection teams to manually parse complex telemetry without actionable triage priorities.

## 2. Motivation

Utility engineering teams require an integrated decision-support system that not only detects multidimensional consumption anomalies with high statistical sensitivity, but also conducts automated **forensic triage**. By synthesizing historical consumption baselines, volatility metrics, and engineering failure archetypes, an Agentic AI layer can generate transparent, explainable investigation reports before field resources are dispatched.

## 3. Project Objectives

- **Efficient Big Data Processing:** Ingest high-volume 15-minute interval smart meter readings (UCI ElectricityLoadDiagrams benchmark), selectively parsing target meters without memory bloat.
- **Feature Engineering:** Derive dynamic longitudinal baselines including expanding historical means, 7-day rolling trends, and absolute/relative deviations.
- **Unsupervised Anomaly Detection:** Train scikit-learn's `IsolationForest` to isolate outliers across multi-attribute feature spaces without requiring labeled ground truth.
- **Agentic AI Forensic Reasoning:** Provide an automated multi-step investigation agent that formulates plausible hypotheses (outage, hardware failure, operational shift, or suspicious behavior) and outlines sequential field verification actions.
- **Transparent Academic Interface:** Deliver an interactive, responsive dashboard featuring Chart.js telemetry curves, anomaly markers, priority filters, and printable forensic case dossiers.

---

## 4. System Architecture

```text
Electricity Consumption Data (15-min Intervals)
        ↓
Data Processing (Column filtering, comma-decimal & timestamp parsing)
        ↓
Feature Engineering (Daily aggregates, 7-day rolling, historical baseline)
        ↓
Isolation Forest (Unsupervised tree isolation, decision scoring)
        ↓
Anomalous Consumption Cases (-1 prediction flagged)
        ↓
Agentic AI Investigation (History retrieval, deviation audit, hypothesis synthesis)
        ↓
Explanation + Priority (HIGH / MEDIUM / NORMAL triage)
        ↓
Recommended Verification Action (Step-by-step technical inspection checklist)
        ↓
Dashboard (Interactive Chart.js trends, anomaly queue)
        ↓
Human / Field Verification (Physical verification & metering checks)
```

---

## 5. Technology Stack

- **Core Runtime:** Python 3.10+
- **Data Processing & Analysis:** Pandas, NumPy
- **Machine Learning:** Scikit-Learn (`sklearn.ensemble.IsolationForest`)
- **Web Application Framework:** Flask
- **Frontend & Visualization:** HTML5, CSS3, JavaScript (ES6+), Chart.js
- **Typography:** Inter, JetBrains Mono

---

## 6. How Anomaly Detection Works

1. **Selective Column Ingestion:** Rather than loading the entire 694 MB dataset across 370 meters into memory, the detector reads `timestamp` and only the specified target meters (`usecols`).
2. **Safe Type Conversion & Aggregation:** Comma decimals are standardized, missing intervals are interpolated, and 15-minute kW readings are aggregated into daily cumulative consumption (kWh).
3. **Feature Matrix Construction:**
   - `consumption`: Total daily energy volume.
   - `historical_average`: Cumulative expanding baseline up to observation date.
   - `rolling_7d_avg`: 7-day moving baseline capturing weekly trend.
   - `absolute_deviation`: $| \text{consumption} - \text{historical\_average} |$.
   - `percentage_change`: Normalized relative deviation from baseline.
4. **Isolation Forest Model:**
   - Partitions feature observations using randomized decision trees. Anomalous instances require fewer random splits to isolate and receive negative decision function scores.
   - Anomaly flag assigned as $-1$ (outlier) or $+1$ (inlier).
5. **Priority Assignment Rules:**
   - **HIGH Priority:** Flagged anomaly with acute deviation ($|\Delta\%| \ge 50\%$, zero-reading, or decision score $\ge 0.14$).
   - **MEDIUM Priority:** Flagged anomaly with moderate deviation ($25\% \le |\Delta\%| < 50\%$).
   - **NORMAL:** Inlier observations.

---

## 7. How the Agentic AI Investigation Layer Works

The investigation layer acts as a decision-support copilot for utility field technicians. When an anomaly is investigated:

1. **Tool Invocation (`agent/tools.py`):**
   - `get_meter_history()` queries longitudinal records and isolates the 14-day window around the incident date.
   - `get_consumption_statistics()` calculates distribution quartiles, standard deviations, and median baselines.
   - `calculate_deviation()` computes standardized Z-scores and directional vectors (drop vs. surge).
2. **Forensic Hypothesis Evaluation (`agent/investigation_agent.py`):**
   - Evaluates whether patterns correspond to customer vacations, seasonal shutdowns, supply outages, meter hardware phase disconnects, CT failure, or potentially suspicious bypasses.
3. **Action Recommendation Engine:**
   - Synthesizes a 4-step field checklist: Customer Desk Review &rarr; SCADA Outage Correlation &rarr; Smart Meter Tamper Register Audit &rarr; Physical Clamp & Seal Inspection.
4. **Deterministic & Pluggable Architecture:**
   - Runs deterministically out-of-the-box with **zero API key dependencies**.
   - If a `GEMINI_API_KEY` is present, it can optionally invoke Google's GenAI SDK to draft executive briefings.

---

## 8. Installation & Setup

### Prerequisites

- Python 3.10 or higher
- Git

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

*(Or via apt on Debian/Ubuntu systems: `apt-get install python3-pandas python3-numpy python3-sklearn python3-flask`)*

---

## 9. Data Processing & Pipeline Execution

To process the dataset and run Isolation Forest anomaly detection:

```bash
python run.py --process
```

This pipeline executes:
- Ingestion of `data/raw/LD2011_2014.txt`
- Daily aggregation and feature engineering
- Isolation Forest anomaly inference
- Generation of processed files in `data/processed/`:
  - `data/processed/daily_consumption.csv`
  - `data/processed/all_results.csv`
  - `data/processed/anomalies.csv`

---

## 10. Running the Dashboard

Start the Flask application:

```bash
python run.py
```

Open your browser at:
```
http://127.0.0.1:5000
```

### Custom Port or Meters:
```bash
python run.py --port 5000 --meters MT_001 MT_002 MT_003 MT_004 MT_005
```

---

## 11. User Workflow

1. **Dashboard Overview:** Monitor aggregate telemetry across meters, overall days, flagged anomalies, and high-priority cases.
2. **Telemetry Trend Chart:** Inspect daily consumption trends, historical average baselines, and 7-day rolling curves via Chart.js. Click on red anomaly indicators to drill down.
3. **Anomaly Queue:** Review prioritized anomaly records with percentage deviations and anomaly scores.
4. **Agentic Investigation:** Click **"Investigate &rarr;"** on any record to open the forensic case dossier, examining observed patterns, statistical Z-scores, differential causes, and field verification steps.

---

## 12. Academic Safety & Critical Limitation

> **CRITICAL NOTICE:**
> The system identifies **"potentially suspicious consumption patterns"** and **"anomalous consumption deviations"**.
> **An anomaly does not prove electricity theft.**
> Consumption anomalies frequently arise from customer vacations, industrial shutdowns, solar PV installation, feeder outages, CT failures, or sensor communications errors. Human and technical field verifications are mandatory before drawing regulatory, commercial, or legal conclusions.
