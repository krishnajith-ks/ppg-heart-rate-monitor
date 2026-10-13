// src/dsp/detrend.js
// Baseline wander removal and DC offset subtraction.
//
// Why this exists:
// In photoplethysmography (PPG), tissue and bone reflect a massive constant amount of light (DC offset).
// The actual arterial pulse wave (AC pulsation) is tiny—often less than 1% to 2% of the total brightness.
// Furthermore, breathing (respiration) and involuntary finger pressure changes introduce slow baseline drift (0.1–0.3 Hz).
// Detrending computes a moving average over ~1.5 seconds (the approximate period of one slow breath/movement)
// and subtracts it, centering the heart signal around zero (zero-mean AC).

/**
 * Detrends a 1D discrete-time signal by subtracting its moving average and removing DC mean.
 * @param {Float64Array|Float32Array|Array<number>} signal - Discrete input signal x[n]
 * @param {number} fs - Sampling rate in Hz (e.g. 30 Hz)
 * @param {number} windowSec - Moving average duration in seconds (default 1.5 s)
 * @returns {Float64Array} - Zero-mean detrended AC signal
 */
export function detrend(signal, fs = 30, windowSec = 1.5) {
  const n = signal.length;
  if (n === 0) return new Float64Array(0);

  // Window size in samples for the moving average filter
  const windowSize = Math.max(3, Math.round(windowSec * fs));
  const halfWindow = Math.floor(windowSize / 2);
  const detrended = new Float64Array(n);

  // Step 1: Subtract moving average (centered moving window)
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(n - 1, i + halfWindow);
    let sum = 0;
    for (let j = start; j <= end; j++) {
      sum += signal[j];
    }
    const movingAverage = sum / (end - start + 1);
    detrended[i] = signal[i] - movingAverage;
  }

  // Step 2: Remove any remaining overall DC mean
  let totalSum = 0;
  for (let i = 0; i < n; i++) {
    totalSum += detrended[i];
  }
  const mean = totalSum / n;
  for (let i = 0; i < n; i++) {
    detrended[i] -= mean;
  }

  return detrended;
}
