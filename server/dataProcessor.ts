/**
 * Data Processing Layer for Electricity Consumption Anomaly Detection.
 * Ingests and standardizes raw utility smart meter records.
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface RawReading {
  meter_id: string;
  date: string;
  consumer_type: 'Residential' | 'Commercial' | 'Industrial' | 'Institutional';
  location: 'Chennai North' | 'Chennai South' | 'Chennai Central' | 'Tambaram' | 'Avadi';
  consumption_kwh: number;
  demo_pattern?: string;
}

const DATA_FILENAME = 'electricity_consumption_demo_under_20mb.csv';

export function getDatasetPath(): string {
  // Check root workspace, data/ directory, and current dir
  const rootPath = path.resolve(process.cwd(), DATA_FILENAME);
  if (fs.existsSync(rootPath)) return rootPath;

  const dataSubdirPath = path.resolve(process.cwd(), 'data', DATA_FILENAME);
  if (fs.existsSync(dataSubdirPath)) return dataSubdirPath;

  return rootPath;
}

export function loadRawReadings(): RawReading[] {
  const filePath = getDatasetPath();

  if (!fs.existsSync(filePath)) {
    throw new Error(`Dataset not found at ${filePath}. Ensure ${DATA_FILENAME} exists in the workspace.`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, any>[];

  const parsedList: RawReading[] = [];

  for (const row of records) {
    const consumption = parseFloat(row.consumption_kwh);
    if (isNaN(consumption)) continue;

    parsedList.push({
      meter_id: String(row.meter_id || '').trim(),
      date: String(row.date || '').trim(),
      consumer_type: row.consumer_type as RawReading['consumer_type'],
      location: row.location as RawReading['location'],
      consumption_kwh: Math.round(consumption * 100) / 100,
      demo_pattern: row.demo_pattern ? String(row.demo_pattern).trim() : 'Normal',
    });
  }

  return parsedList;
}
