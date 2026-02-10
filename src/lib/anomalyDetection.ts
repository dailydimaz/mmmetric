/**
 * Local Statistical Anomaly Detection Engine
 * 
 * Uses multiple statistical methods to detect unusual traffic patterns:
 * 1. Z-Score Analysis - detects values far from the mean
 * 2. IQR (Interquartile Range) - robust outlier detection
 * 3. Moving Average Deviation - detects sudden shifts from recent trends
 * 4. Seasonal Decomposition - accounts for day-of-week patterns
 */

export type AnomalyType = "spike" | "drop";
export type AnomalySeverity = "low" | "medium" | "high";

export interface Anomaly {
  date: string;
  value: number;
  expected: number;
  deviation: number; // percentage deviation from expected
  type: AnomalyType;
  severity: AnomalySeverity;
  metric: string;
  methods: string[]; // which methods flagged it
  confidence: number; // 0-1
}

export interface AnomalyDetectionResult {
  anomalies: Anomaly[];
  summary: {
    totalAnomalies: number;
    spikes: number;
    drops: number;
    highSeverity: number;
    overallVolatility: number; // coefficient of variation
  };
}

interface DetectionParams {
  values: number[];
  dates: string[];
  metric: string;
  zScoreThreshold?: number;
  iqrMultiplier?: number;
  movingAvgWindow?: number;
  movingAvgThreshold?: number;
}

// ── Statistics Helpers ──

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

// ── Detection Methods ──

/** Z-Score: flags values > threshold standard deviations from mean */
function zScoreDetection(values: number[], threshold: number): Set<number> {
  const flagged = new Set<number>();
  const m = mean(values);
  const sd = stdDev(values);
  if (sd === 0) return flagged;

  for (let i = 0; i < values.length; i++) {
    const z = Math.abs((values[i] - m) / sd);
    if (z > threshold) flagged.add(i);
  }
  return flagged;
}

/** IQR: flags values outside Q1 - multiplier*IQR or Q3 + multiplier*IQR */
function iqrDetection(values: number[], multiplier: number): Set<number> {
  const flagged = new Set<number>();
  const q1 = percentile(values, 25);
  const q3 = percentile(values, 75);
  const iqr = q3 - q1;
  if (iqr === 0) return flagged;

  const lower = q1 - multiplier * iqr;
  const upper = q3 + multiplier * iqr;

  for (let i = 0; i < values.length; i++) {
    if (values[i] < lower || values[i] > upper) flagged.add(i);
  }
  return flagged;
}

/** Moving Average Deviation: flags sudden shifts from recent trend */
function movingAvgDetection(
  values: number[],
  window: number,
  threshold: number
): Set<number> {
  const flagged = new Set<number>();
  if (values.length < window + 1) return flagged;

  for (let i = window; i < values.length; i++) {
    const windowSlice = values.slice(i - window, i);
    const avg = mean(windowSlice);
    const sd = stdDev(windowSlice);
    if (avg === 0 || sd === 0) continue;

    const deviation = Math.abs(values[i] - avg) / sd;
    if (deviation > threshold) flagged.add(i);
  }
  return flagged;
}

/** Seasonal Decomposition: accounts for day-of-week patterns */
function seasonalDetection(
  values: number[],
  dates: string[],
  threshold: number
): Set<number> {
  const flagged = new Set<number>();
  if (values.length < 14) return flagged; // need at least 2 weeks

  // Group by day of week
  const dayBuckets: number[][] = [[], [], [], [], [], [], []];
  for (let i = 0; i < values.length; i++) {
    const day = new Date(dates[i]).getDay();
    dayBuckets[day].push(values[i]);
  }

  // Compute expected value and std dev per day of week
  const dayMeans = dayBuckets.map((b) => mean(b));
  const dayStds = dayBuckets.map((b) => stdDev(b));

  for (let i = 0; i < values.length; i++) {
    const day = new Date(dates[i]).getDay();
    const expected = dayMeans[day];
    const sd = dayStds[day];
    if (sd === 0) continue;

    const deviation = Math.abs(values[i] - expected) / sd;
    if (deviation > threshold) flagged.add(i);
  }
  return flagged;
}

// ── Main Detection ──

export function detectAnomalies({
  values,
  dates,
  metric,
  zScoreThreshold = 2.0,
  iqrMultiplier = 1.5,
  movingAvgWindow = 7,
  movingAvgThreshold = 2.5,
}: DetectionParams): AnomalyDetectionResult {
  if (values.length < 7) {
    return {
      anomalies: [],
      summary: {
        totalAnomalies: 0,
        spikes: 0,
        drops: 0,
        highSeverity: 0,
        overallVolatility: 0,
      },
    };
  }

  const m = mean(values);
  const sd = stdDev(values);
  const volatility = m === 0 ? 0 : sd / m;

  // Run all methods
  const zFlags = zScoreDetection(values, zScoreThreshold);
  const iqrFlags = iqrDetection(values, iqrMultiplier);
  const maFlags = movingAvgDetection(values, movingAvgWindow, movingAvgThreshold);
  const seasonalFlags = seasonalDetection(values, dates, zScoreThreshold);

  // Collect all flagged indices
  const allFlagged = new Set<number>();
  [zFlags, iqrFlags, maFlags, seasonalFlags].forEach((s) =>
    s.forEach((i) => allFlagged.add(i))
  );

  const anomalies: Anomaly[] = [];

  for (const idx of allFlagged) {
    const methods: string[] = [];
    if (zFlags.has(idx)) methods.push("z-score");
    if (iqrFlags.has(idx)) methods.push("iqr");
    if (maFlags.has(idx)) methods.push("moving-avg");
    if (seasonalFlags.has(idx)) methods.push("seasonal");

    const value = values[idx];
    const expected = m;
    const deviation = expected === 0 ? 100 : ((value - expected) / expected) * 100;
    const type: AnomalyType = value > expected ? "spike" : "drop";

    // Confidence based on how many methods agree
    const confidence = methods.length / 4;

    // Severity based on deviation magnitude and method agreement
    const absDev = Math.abs(deviation);
    let severity: AnomalySeverity = "low";
    if (methods.length >= 3 || absDev > 100) {
      severity = "high";
    } else if (methods.length >= 2 || absDev > 50) {
      severity = "medium";
    }

    anomalies.push({
      date: dates[idx],
      value,
      expected: Math.round(expected),
      deviation: Math.round(deviation * 10) / 10,
      type,
      severity,
      metric,
      methods,
      confidence,
    });
  }

  // Sort by severity (high first), then by absolute deviation
  anomalies.sort((a, b) => {
    const sevOrder = { high: 0, medium: 1, low: 2 };
    if (sevOrder[a.severity] !== sevOrder[b.severity])
      return sevOrder[a.severity] - sevOrder[b.severity];
    return Math.abs(b.deviation) - Math.abs(a.deviation);
  });

  return {
    anomalies,
    summary: {
      totalAnomalies: anomalies.length,
      spikes: anomalies.filter((a) => a.type === "spike").length,
      drops: anomalies.filter((a) => a.type === "drop").length,
      highSeverity: anomalies.filter((a) => a.severity === "high").length,
      overallVolatility: Math.round(volatility * 1000) / 1000,
    },
  };
}
