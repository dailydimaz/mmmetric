/**
 * Local statistical forecasting engine.
 * Uses linear regression, simple moving averages, and basic
 * seasonality detection — no external AI/ML API required.
 */

export interface ForecastPoint {
  date: string;           // ISO date string
  predicted: number;      // point forecast
  lower: number;          // lower confidence bound
  upper: number;          // upper confidence bound
}

export interface ForecastResult {
  forecast: ForecastPoint[];
  trend: "up" | "down" | "flat";
  trendStrength: number;      // 0-1, how strong the trend is
  seasonalityDetected: boolean;
  avgGrowthRate: number;       // daily % growth
  confidence: number;          // 0-1
}

// ─── Helpers ────────────────────────────────────────────────

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / (arr.length - 1));
}

/**
 * Ordinary least-squares linear regression.
 * Returns slope, intercept, and R² for the fit.
 */
function linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0, r2: 0 };

  const xs = values.map((_, i) => i);
  const xMean = mean(xs);
  const yMean = mean(values);

  let ssXY = 0;
  let ssXX = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    ssXY += (xs[i] - xMean) * (values[i] - yMean);
    ssXX += (xs[i] - xMean) ** 2;
    ssTot += (values[i] - yMean) ** 2;
  }

  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = yMean - slope * xMean;

  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i;
    ssRes += (values[i] - predicted) ** 2;
  }

  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r2: Math.max(0, r2) };
}

/**
 * Detect weekly seasonality by computing average day-of-week indices.
 * Returns an array of 7 seasonal factors (Mon=0 … Sun=6).
 * A factor > 1 means that day typically runs above trend, < 1 below.
 */
function detectWeeklySeasonality(
  values: number[],
  startDayOfWeek: number,
): { factors: number[]; detected: boolean } {
  if (values.length < 14) return { factors: Array(7).fill(1), detected: false };

  // Detrend with simple moving average (window=7)
  const detrended: number[] = [];
  for (let i = 3; i < values.length - 3; i++) {
    const window = values.slice(i - 3, i + 4);
    const ma = mean(window);
    detrended.push(ma === 0 ? 1 : values[i] / ma);
  }

  // Group by day of week
  const buckets: number[][] = Array.from({ length: 7 }, () => []);
  for (let i = 0; i < detrended.length; i++) {
    const day = (startDayOfWeek + i + 3) % 7;
    buckets[day].push(detrended[i]);
  }

  const factors = buckets.map((b) => (b.length > 0 ? mean(b) : 1));

  // Is there enough variation to call it seasonal?
  const factorStd = stdDev(factors);
  const detected = factorStd > 0.05; // >5 % variation across days

  return { factors, detected };
}

/**
 * Simple exponential smoothing for short-term adjustment.
 */
function exponentialSmoothing(values: number[], alpha = 0.3): number {
  if (values.length === 0) return 0;
  let s = values[0];
  for (let i = 1; i < values.length; i++) {
    s = alpha * values[i] + (1 - alpha) * s;
  }
  return s;
}

// ─── Main API ───────────────────────────────────────────────

export interface ForecastInput {
  /** Historical daily values (pageviews, visitors, etc.) */
  values: number[];
  /** ISO date string of the first value */
  startDate: string;
  /** How many days to forecast */
  horizon?: number;
}

/**
 * Generate a traffic forecast from historical daily data.
 *
 * Approach:
 *  1. Fit a linear trend via OLS.
 *  2. Detect weekly seasonality from detrended residuals.
 *  3. Combine trend + season + exponential smoothing bias-correction.
 *  4. Build confidence intervals from historical residual spread.
 */
export function generateForecast({
  values,
  startDate,
  horizon = 14,
}: ForecastInput): ForecastResult {
  if (values.length < 3) {
    // Not enough data — return flat projection
    const lastVal = values[values.length - 1] ?? 0;
    const start = new Date(startDate);
    const forecast: ForecastPoint[] = [];
    for (let i = 0; i < horizon; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + values.length + i);
      forecast.push({
        date: d.toISOString().slice(0, 10),
        predicted: Math.round(lastVal),
        lower: Math.round(lastVal * 0.7),
        upper: Math.round(lastVal * 1.3),
      });
    }
    return {
      forecast,
      trend: "flat",
      trendStrength: 0,
      seasonalityDetected: false,
      avgGrowthRate: 0,
      confidence: 0.2,
    };
  }

  // 1. Linear trend
  const { slope, intercept, r2 } = linearRegression(values);

  // 2. Seasonality
  const startDay = new Date(startDate).getDay(); // 0=Sun
  const { factors: seasonFactors, detected: seasonalityDetected } =
    detectWeeklySeasonality(values, startDay);

  // 3. Residuals for confidence interval
  const residuals: number[] = values.map((v, i) => {
    const trendVal = intercept + slope * i;
    const dayIdx = (startDay + i) % 7;
    const seasonal = seasonalityDetected ? seasonFactors[dayIdx] : 1;
    return v - trendVal * seasonal;
  });
  const residualStd = stdDev(residuals);

  // 4. Bias correction via exponential smoothing of recent residuals
  const recentResiduals = residuals.slice(-7);
  const bias = exponentialSmoothing(recentResiduals, 0.4);

  // 5. Generate forecast
  const start = new Date(startDate);
  const forecast: ForecastPoint[] = [];
  const n = values.length;

  for (let i = 0; i < horizon; i++) {
    const t = n + i;
    const d = new Date(start);
    d.setDate(d.getDate() + t);

    const trendVal = intercept + slope * t;
    const dayIdx = (startDay + t) % 7;
    const seasonal = seasonalityDetected ? seasonFactors[dayIdx] : 1;

    // Widen confidence as we project further
    const widening = 1 + i * 0.08;
    let predicted = trendVal * seasonal + bias * Math.pow(0.9, i);

    // Ensure non-negative
    predicted = Math.max(0, predicted);

    const margin = residualStd * 1.96 * widening;
    forecast.push({
      date: d.toISOString().slice(0, 10),
      predicted: Math.round(predicted),
      lower: Math.max(0, Math.round(predicted - margin)),
      upper: Math.round(predicted + margin),
    });
  }

  // Trend classification
  const avgVal = mean(values);
  const dailyGrowthRate = avgVal === 0 ? 0 : slope / avgVal;
  const trendStrength = Math.min(1, Math.abs(dailyGrowthRate) * 30); // scaled to ~monthly

  let trend: "up" | "down" | "flat";
  if (dailyGrowthRate > 0.005) trend = "up";
  else if (dailyGrowthRate < -0.005) trend = "down";
  else trend = "flat";

  // Confidence based on R² and data length
  const dataConfidence = Math.min(1, values.length / 30);
  const confidence = Math.min(1, (r2 * 0.6 + dataConfidence * 0.4));

  return {
    forecast,
    trend,
    trendStrength,
    seasonalityDetected,
    avgGrowthRate: dailyGrowthRate * 100,
    confidence,
  };
}
