/**
 * Frontend Telemetry & Interactive Chart Engine
 * AI-Driven Electricity Consumption Anomaly Detection and Investigation
 */

let consumptionChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  initTelemetryChart();
  initMeterSelector();
  initTableFiltering();
  initProcessButton();
});

function initTelemetryChart() {
  const canvas = document.getElementById('consumptionChart');
  if (!canvas || !window.INITIAL_CHART_DATA) return;

  const data = window.INITIAL_CHART_DATA;
  if (!data.labels || data.labels.length === 0) return;

  // Build point stylings: normal points are hidden (radius 0), anomaly points are red circles (radius 6)
  const anomalyDateSet = new Set((data.anomalies || []).map(a => a.date || a.x));

  const pointRadius = data.labels.map(label => anomalyDateSet.has(label) ? 6 : 0);
  const pointHoverRadius = data.labels.map(label => anomalyDateSet.has(label) ? 9 : 3);
  const pointBackgroundColors = data.labels.map(label => anomalyDateSet.has(label) ? '#f43f5e' : '#38bdf8');
  const pointBorderColors = data.labels.map(label => anomalyDateSet.has(label) ? '#ffffff' : '#38bdf8');

  const ctx = canvas.getContext('2d');
  consumptionChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: 'Daily Consumption (kWh)',
          data: data.consumption,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          fill: true,
          tension: 0.2,
          borderWidth: 2,
          pointRadius: pointRadius,
          pointHoverRadius: pointHoverRadius,
          pointBackgroundColor: pointBackgroundColors,
          pointBorderColor: pointBorderColors,
          pointBorderWidth: 2,
          order: 2
        },
        {
          label: 'Historical Average Baseline',
          data: data.baseline,
          borderColor: '#c084fc',
          borderWidth: 1.8,
          borderDash: [5, 4],
          pointRadius: 0,
          fill: false,
          tension: 0.1,
          order: 3
        },
        {
          label: '7-Day Rolling Average',
          data: data.rolling || [],
          borderColor: '#2dd4bf',
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          tension: 0.3,
          order: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#f1f5f9',
          bodyColor: '#cbd5e1',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            afterBody: function(context) {
              const dateStr = context[0].label;
              if (anomalyDateSet.has(dateStr)) {
                return ['\n🚨 ANOMALY FLAGGED: Isolation Forest deviation', 'Click point to launch Agentic Investigation'];
              }
              return [];
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.04)'
          },
          ticks: {
            color: '#64748b',
            maxTicksLimit: 14,
            font: {
              family: 'JetBrains Mono, monospace',
              size: 11
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.06)'
          },
          ticks: {
            color: '#94a3b8',
            font: {
              family: 'JetBrains Mono, monospace',
              size: 11
            },
            callback: function(value) {
              return value + ' kWh';
            }
          }
        }
      },
      onClick: function(event, elements) {
        if (!elements || elements.length === 0) return;
        const index = elements[0].index;
        const dateStr = data.labels[index];
        const meterId = document.getElementById('meterSelect')?.value || data.selectedMeter || 'MT_001';
        if (anomalyDateSet.has(dateStr)) {
          window.location.href = `/investigate/${meterId}/${dateStr}`;
        }
      }
    }
  });
}

function initMeterSelector() {
  const select = document.getElementById('meterSelect');
  if (!select) return;

  select.addEventListener('change', async (e) => {
    const meterId = e.target.value;
    try {
      const res = await fetch(`/api/chart-data?meter=${meterId}`);
      if (!res.ok) throw new Error('Failed to load meter telemetry');
      const data = await res.json();

      if (!consumptionChartInstance) return;

      const anomalyDateSet = new Set((data.anomalies || []).map(a => a.date));
      const pointRadius = data.labels.map(l => anomalyDateSet.has(l) ? 6 : 0);
      const pointHoverRadius = data.labels.map(l => anomalyDateSet.has(l) ? 9 : 3);
      const pointBackgroundColors = data.labels.map(l => anomalyDateSet.has(l) ? '#f43f5e' : '#38bdf8');
      const pointBorderColors = data.labels.map(l => anomalyDateSet.has(l) ? '#ffffff' : '#38bdf8');

      // Update datasets
      consumptionChartInstance.data.labels = data.labels;
      consumptionChartInstance.data.datasets[0].data = data.consumption;
      consumptionChartInstance.data.datasets[0].pointRadius = pointRadius;
      consumptionChartInstance.data.datasets[0].pointHoverRadius = pointHoverRadius;
      consumptionChartInstance.data.datasets[0].pointBackgroundColor = pointBackgroundColors;
      consumptionChartInstance.data.datasets[0].pointBorderColor = pointBorderColors;

      consumptionChartInstance.data.datasets[1].data = data.historical_average;
      if (consumptionChartInstance.data.datasets[2]) {
        consumptionChartInstance.data.datasets[2].data = data.rolling_7d_avg || [];
      }

      // Update cached globals
      window.INITIAL_CHART_DATA.labels = data.labels;
      window.INITIAL_CHART_DATA.consumption = data.consumption;
      window.INITIAL_CHART_DATA.anomalies = data.anomalies;
      window.INITIAL_CHART_DATA.selectedMeter = meterId;

      consumptionChartInstance.update();
    } catch (err) {
      console.error('Error refreshing chart:', err);
    }
  });
}

function initTableFiltering() {
  const searchInput = document.getElementById('tableSearch');
  const priorityFilter = document.getElementById('priorityFilter');
  const visibleCount = document.getElementById('visibleCount');
  const rows = document.querySelectorAll('.anomaly-row');

  if (!searchInput || !priorityFilter || rows.length === 0) return;

  function applyFilters() {
    const q = (searchInput.value || '').trim().toLowerCase();
    const priority = priorityFilter.value;
    let visible = 0;

    rows.forEach(row => {
      const meter = (row.dataset.meter || '').toLowerCase();
      const date = (row.dataset.date || '').toLowerCase();
      const rowPriority = row.dataset.priority || '';

      const matchQuery = !q || meter.includes(q) || date.includes(q);
      const matchPriority = priority === 'ALL' || rowPriority === priority;

      if (matchQuery && matchPriority) {
        row.style.display = '';
        visible++;
      } else {
        row.style.display = 'none';
      }
    });

    if (visibleCount) {
      visibleCount.textContent = visible;
    }
  }

  searchInput.addEventListener('input', applyFilters);
  priorityFilter.addEventListener('change', applyFilters);
}

function initProcessButton() {
  const form = document.getElementById('processForm');
  const btn = document.getElementById('processBtn');
  if (!form || !btn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.innerHTML = '<span>Processing Telemetry & Isolation Forest...</span>';

    try {
      const res = await fetch('/api/trigger-process', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        window.location.reload();
      } else {
        alert('Processing failed: ' + (result.error || 'Unknown error'));
        btn.disabled = false;
        btn.innerHTML = '<span>Run Pipeline Now</span>';
      }
    } catch (err) {
      alert('Error triggering pipeline: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = '<span>Run Pipeline Now</span>';
    }
  });
}
