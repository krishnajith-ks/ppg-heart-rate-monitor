/**
 * Systolic Peak Detection & Inter-Beat Interval (IBI) Heart Rate Estimator
 */

export interface PeakDetectionResult {
  bpm: number;
  peakIndices: number[];
  ibis: number[];
}

export function detectPeaksIBI(
  signal: number[],
  times: number[],
  fs = 30
): PeakDetectionResult {
  if (signal.length < fs * 2) {
    return { bpm: 0, peakIndices: [], ibis: [] };
  }

  // 1. Z-score normalization
  let sum = 0;
  for (let i = 0; i < signal.length; i++) sum += signal[i];
  const mean = sum / signal.length;

  let varSum = 0;
  for (let i = 0; i < signal.length; i++) {
    const diff = signal[i] - mean;
    varSum += diff * diff;
  }
  const std = Math.sqrt(varSum / signal.length) || 1e-6;

  const norm = signal.map((s) => (s - mean) / std);

  // 2. Refractory lockout: 0.30s (max 200 BPM)
  const refractorySamples = Math.round(0.30 * fs);
  const threshold = 0.35; // dynamic threshold above mean in z-score units

  const peakIndices: number[] = [];
  let lastPeakIdx = -refractorySamples;

  for (let i = 1; i < norm.length - 1; i++) {
    if (i - lastPeakIdx < refractorySamples) continue;

    // Check local maximum and threshold
    if (norm[i] > norm[i - 1] && norm[i] >= norm[i + 1] && norm[i] > threshold) {
      peakIndices.push(i);
      lastPeakIdx = i;
    }
  }

  if (peakIndices.length < 2) {
    return { bpm: 0, peakIndices, ibis: [] };
  }

  // 3. Compute IBIs
  const rawIbis: number[] = [];
  for (let i = 1; i < peakIndices.length; i++) {
    const idx0 = peakIndices[i - 1];
    const idx1 = peakIndices[i];
    const dt = times[idx1] - times[idx0];
    if (dt > 0.25 && dt < 2.0) { // physiological limits: 30 to 240 BPM
      rawIbis.push(dt);
    }
  }

  if (rawIbis.length === 0) {
    return { bpm: 0, peakIndices, ibis: [] };
  }

  // 4. Outlier rejection using median
  const sorted = [...rawIbis].sort((a, b) => a - b);
  const medianIbi = sorted[Math.floor(sorted.length / 2)];

  const cleanIbis = rawIbis.filter((ibi) => Math.abs(ibi - medianIbi) <= 0.35 * medianIbi);
  const finalIbis = cleanIbis.length > 0 ? cleanIbis : rawIbis;

  const meanIbi = finalIbis.reduce((a, b) => a + b, 0) / finalIbis.length;
  const bpm = meanIbi > 0 ? 60 / meanIbi : 0;

  return { bpm, peakIndices, ibis: finalIbis };
}
