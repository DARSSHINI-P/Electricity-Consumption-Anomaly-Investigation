/**
 * Anomaly Detection Pipeline.
 * Implements feature engineering and Isolation Forest-style multi-dimensional
 * unsupervised outlier detection on electricity load behavior.
 */

import { RawReading, loadRawReadings } from './dataProcessor';

export interface ProcessedMeterRecord {
  meter_id: string;
  date: string;
  consumer_type: string;
  location: string;
  consumption: number;
  historical_average: number;
  rolling_average: number;
  percentage_change: number;
  consumption_change: number;
  absolute_deviation: number;
  anomaly_score: number;
  is_anomaly: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL';
}

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
  rolling_average: number;
  consumption_change: number;
}

// Simple deterministic PRNG for reproducible isolation tree partitions
function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Average path length of unsuccessful search in BST
function cFactor(n: number): number {
  if (n <= 1) return 1;
  if (n === 2) return 1;
  const eulerMascheroni = 0.5772156649;
  return 2 * (Math.log(n - 1) + eulerMascheroni) - (2 * (n - 1)) / n;
}

class IsolationTree {
  splitFeature: number = 0;
  splitValue: number = 0;
  left: IsolationTree | null = null;
  right: IsolationTree | null = null;
  size: number = 0;

  constructor(data: number[][], currentHeight: number, maxHeight: number, seed: number) {
    this.size = data.length;
    if (currentHeight >= maxHeight || data.length <= 1) {
      return;
    }

    const numFeatures = data[0].length;
    this.splitFeature = Math.floor(pseudoRandom(seed + currentHeight * 7) * numFeatures);

    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const row of data) {
      const val = row[this.splitFeature];
      if (val < minVal) minVal = val;
      if (val > maxVal) maxVal = val;
    }

    if (minVal === maxVal) {
      return;
    }

    this.splitValue = minVal + pseudoRandom(seed + currentHeight * 13 + 3) * (maxVal - minVal);

    const leftData: number[][] = [];
    const rightData: number[][] = [];

    for (const row of data) {
      if (row[this.splitFeature] < this.splitValue) {
        leftData.push(row);
      } else {
        rightData.push(row);
      }
    }

    if (leftData.length === 0 || rightData.length === 0) {
      return;
    }

    this.left = new IsolationTree(leftData, currentHeight + 1, maxHeight, seed * 2 + 1);
    this.right = new IsolationTree(rightData, currentHeight + 1, maxHeight, seed * 2 + 2);
  }

  pathLength(sample: number[], currentHeight: number): number {
    if (!this.left || !this.right || this.size <= 1) {
      return currentHeight + cFactor(this.size);
    }
    if (sample[this.splitFeature] < this.splitValue) {
      return this.left.pathLength(sample, currentHeight + 1);
    } else {
      return this.right.pathLength(sample, currentHeight + 1);
    }
  }
}

class IsolationForestEngine {
  trees: IsolationTree[] = [];
  numTrees: number = 40;
  subsampleSize: number = 128;
  cVal: number = 1;

  train(data: number[][], baseSeed = 42) {
    this.trees = [];
    const n = Math.min(data.length, this.subsampleSize);
    this.cVal = cFactor(n);
    const maxHeight = Math.ceil(Math.log2(n));

    for (let t = 0; t < this.numTrees; t++) {
      // Subsample indices
      const sampleIndices: number[] = [];
      for (let i = 0; i < n; i++) {
        const idx = Math.floor(pseudoRandom(baseSeed + t * 31 + i * 5) * data.length);
        sampleIndices.push(idx);
      }
      const sampledData = sampleIndices.map((i) => data[i]);
      const tree = new IsolationTree(sampledData, 0, maxHeight, baseSeed + t * 97);
      this.trees.push(tree);
    }
  }

  computeScore(sample: number[]): number {
    if (this.trees.length === 0) return 0.5;
    let totalPath = 0;
    for (const tree of this.trees) {
      totalPath += tree.pathLength(sample, 0);
    }
    const avgPath = totalPath / this.trees.length;
    // Anomaly score s = 2 ^ (-E(h) / c(n))
    const score = Math.pow(2, -avgPath / this.cVal);
    return Math.max(0, Math.min(1, score));
  }
}

export class AnomalyPipeline {
  private allProcessed: ProcessedMeterRecord[] = [];
  private anomalyCases: AnomalyCase[] = [];
  private isProcessed = false;

  public process(): { totalRecords: number; totalAnomalies: number; highPriority: number } {
    const rawReadings = loadRawReadings();
    if (!rawReadings || rawReadings.length === 0) {
      throw new Error('No raw readings available to process.');
    }

    // Group by meter
    const meterMap = new Map<string, RawReading[]>();
    for (const r of rawReadings) {
      if (!meterMap.has(r.meter_id)) {
        meterMap.set(r.meter_id, []);
      }
      meterMap.get(r.meter_id)!.push(r);
    }

    const processedList: ProcessedMeterRecord[] = [];
    const anomalyList: AnomalyCase[] = [];

    // Process each meter independently to preserve individual baselines
    for (const [meterId, readings] of meterMap.entries()) {
      // Sort chronologically
      readings.sort((a, b) => a.date.localeCompare(b.date));

      const meterDays = readings.length;
      const consumptions = readings.map((r) => r.consumption_kwh);
      const overallMean = consumptions.reduce((sum, v) => sum + v, 0) / meterDays;

      // Variance & StdDev
      const variance =
        consumptions.reduce((sum, v) => sum + Math.pow(v - overallMean, 2), 0) / meterDays;
      const overallStd = Math.sqrt(variance) || 1e-4;

      // Engineer features
      const featureRows: Array<{
        reading: RawReading;
        histAvg: number;
        rollingAvg: number;
        pctChange: number;
        consChange: number;
        absDev: number;
        zScore: number;
        vector: number[];
      }> = [];

      let runningSum = 0;
      for (let i = 0; i < meterDays; i++) {
        const reading = readings[i];
        const val = reading.consumption_kwh;
        runningSum += val;

        // Expanding historical average up to that day
        const histAvg = runningSum / (i + 1);

        // 7-day rolling window
        const windowStart = Math.max(0, i - 6);
        const windowSlice = consumptions.slice(windowStart, i + 1);
        const rollingAvg = windowSlice.reduce((s, x) => s + x, 0) / windowSlice.length;

        const consChange = val - rollingAvg;
        const absDev = Math.abs(val - histAvg);
        const pctChange = histAvg > 0 ? ((val - histAvg) / histAvg) * 100 : 0;
        const zScore = (val - rollingAvg) / overallStd;

        // Vector for isolation forest
        const vector = [val, Math.abs(pctChange), Math.abs(consChange), Math.abs(zScore)];

        featureRows.push({
          reading,
          histAvg,
          rollingAvg,
          pctChange,
          consChange,
          absDev,
          zScore,
          vector,
        });
      }

      // Train Isolation Forest on this meter's feature matrix
      const forest = new IsolationForestEngine();
      forest.train(featureRows.map((f) => f.vector), 101);

      // Evaluate anomaly scores and assign priorities
      for (const item of featureRows) {
        const rawScore = forest.computeScore(item.vector);
        // Calibrate score into 0-1 range with clean sensitivity
        const anomalyScore = Math.round(rawScore * 10000) / 10000;
        const absPct = Math.abs(item.pctChange);
        const absZ = Math.abs(item.zScore);

        // Algorithmic determination:
        // Outlier condition requires elevated anomaly score and significant relative or standardized shift
        const isAnomaly = (anomalyScore >= 0.58 && absPct >= 20) || (absPct >= 45 && absZ >= 2.0) || (absPct >= 70);

        let priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL' = 'NORMAL';

        if (isAnomaly) {
          if (absPct >= 50 || anomalyScore >= 0.72 || absZ >= 3.0) {
            priority = 'HIGH';
          } else if (absPct >= 25 || anomalyScore >= 0.62 || absZ >= 2.0) {
            priority = 'MEDIUM';
          } else {
            priority = 'LOW';
          }
        }

        const processedRecord: ProcessedMeterRecord = {
          meter_id: item.reading.meter_id,
          date: item.reading.date,
          consumer_type: item.reading.consumer_type,
          location: item.reading.location,
          consumption: Math.round(item.reading.consumption_kwh * 100) / 100,
          historical_average: Math.round(item.histAvg * 100) / 100,
          rolling_average: Math.round(item.rollingAvg * 100) / 100,
          percentage_change: Math.round(item.pctChange * 100) / 100,
          consumption_change: Math.round(item.consChange * 100) / 100,
          absolute_deviation: Math.round(item.absDev * 100) / 100,
          anomaly_score: anomalyScore,
          is_anomaly: isAnomaly,
          priority,
        };

        processedList.push(processedRecord);

        if (isAnomaly) {
          anomalyList.push({
            meter_id: processedRecord.meter_id,
            date: processedRecord.date,
            consumer_type: processedRecord.consumer_type,
            location: processedRecord.location,
            consumption: processedRecord.consumption,
            historical_average: processedRecord.historical_average,
            percentage_change: processedRecord.percentage_change,
            anomaly_score: processedRecord.anomaly_score,
            priority: priority as 'HIGH' | 'MEDIUM' | 'LOW',
            rolling_average: processedRecord.rolling_average,
            consumption_change: processedRecord.consumption_change,
          });
        }
      }
    }

    // Sort anomalies by priority severity (HIGH > MEDIUM > LOW) then anomaly score descending
    const priorityRank: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, NORMAL: 3 };
    anomalyList.sort((a, b) => {
      const pDiff = priorityRank[a.priority] - priorityRank[b.priority];
      if (pDiff !== 0) return pDiff;
      return b.anomaly_score - a.anomaly_score;
    });

    this.allProcessed = processedList;
    this.anomalyCases = anomalyList;
    this.isProcessed = true;

    const highCount = anomalyList.filter((a) => a.priority === 'HIGH').length;

    return {
      totalRecords: processedList.length,
      totalAnomalies: anomalyList.length,
      highPriority: highCount,
    };
  }

  public getAllProcessed(): ProcessedMeterRecord[] {
    if (!this.isProcessed) this.process();
    return this.allProcessed;
  }

  public getAnomalyCases(): AnomalyCase[] {
    if (!this.isProcessed) this.process();
    return this.anomalyCases;
  }
}

// Global pipeline singleton
export const pipelineInstance = new AnomalyPipeline();
