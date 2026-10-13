// src/dsp/peaks.js
// Time-domain systolic peak detection and inter-beat interval (IBI) analysis.
//
// Why this exists:
// Each ventricular contraction pumps a bolus of oxygenated blood into the fingertip,
// causing a rhythmic peak in the filtered optical density.
// By measuring the time intervals between successive peaks (the Inter-Beat Interval or IBI),
// we estimate the instantaneous heart rate in beats per minute (BPM_peak = 60 / median_interval).
// The median is specifically chosen over the mean because a single missed or noisy spike
// does not distort the median, guaranteeing robustness against motion artifacts.

/**
 * Detects systolic peaks and calculates time-domain heart rate.
 *
 * Rules per GUIDE.md Section 6.7:
 * 1. Find local maxima (sample strictly larger than both neighbors).
 * 2. Threshold: keep only peaks exceeding 0.3 * std of the filtered window.
 * 3. Enforce minimum refractory distance of ~0.33 s (~180 BPM max). Keep the taller peak when too close.
 * 4. Compute intervals: discard intervals < 0.3 s or > 2.0 s (30 to 200 BPM valid physiological range).
 * 5. Minimum 5 peaks required to declare valid heart rate.
 *
 * @param {Float64Array|Float32Array|Array<number>} signal - Filtered discrete-time signal
 * @param {number} fs - Sampling rate in Hz
 * @param {object} options - Threshold configurations
 * @returns {{
 *   valid: boolean,
 *   bpm: number|null,
 *   peakIndices: number[],
 *   peakCount: number,
 *   medianInterval: number|null,
 *   intervals: number[],
 *   threshold: number,
 *   std: number
 * }}
 */
export function detectPeaks(signal, fs = 30, options = {}) {
  const n = signal.length;
  const stdFactor = options.stdFactor ?? 0.3;
  const minDistanceSec = options.minDistanceSec ?? 0.33;
  const minIntervalSec = options.minIntervalSec ?? 0.3;
  const maxIntervalSec = options.maxIntervalSec ?? 2.0;
  const minValidPeaks = options.minValidPeaks ?? 5;

  if (n < 3) {
    return {
      valid: false,
      bpm: null,
      peakIndices: [],
      peakCount: 0,
      medianInterval: null,
      intervals: [],
      threshold: 0,
      std: 0
    };
  }

  // Calculate signal mean and standard deviation (std)
  let sum = 0;
  for (let i = 0; i < n; i++) sum += signal[i];
  const mean = sum / n;

  let varianceSum = 0;
  for (let i = 0; i < n; i++) varianceSum += (signal[i] - mean) ** 2;
  const std = Math.sqrt(varianceSum / n);

  // If signal has near-zero variation, it is flat/dead
  if (std < 1e-6) {
    return {
      valid: false,
      bpm: null,
      peakIndices: [],
      peakCount: 0,
      medianInterval: null,
      intervals: [],
      threshold: 0,
      std
    };
  }

  const threshold = stdFactor * std;
  const minDistanceSamples = Math.max(1, Math.round(minDistanceSec * fs));

  // Step 1: Candidate local maxima above threshold
  const candidates = [];
  for (let i = 1; i < n - 1; i++) {
    const val = signal[i];
    if (val > signal[i - 1] && val > signal[i + 1] && val > threshold) {
      candidates.push({ index: i, val });
    }
  }

  // Step 2: Enforce refractory distance (keep taller peak when two are within minDistanceSamples)
  const filteredPeaks = [];
  for (const cand of candidates) {
    if (filteredPeaks.length === 0) {
      filteredPeaks.push(cand);
    } else {
      const last = filteredPeaks[filteredPeaks.length - 1];
      if (cand.index - last.index < minDistanceSamples) {
        if (cand.val > last.val) {
          filteredPeaks[filteredPeaks.length - 1] = cand; // Replace with taller peak
        }
      } else {
        filteredPeaks.push(cand);
      }
    }
  }

  // Step 3: Compute inter-peak intervals in seconds
  const intervals = [];
  for (let i = 1; i < filteredPeaks.length; i++) {
    const dt = (filteredPeaks[i].index - filteredPeaks[i - 1].index) / fs;
    if (dt >= minIntervalSec && dt <= maxIntervalSec) {
      intervals.push(dt);
    }
  }

  const peakIndices = filteredPeaks.map(p => p.index);

  // Step 4: Check if enough valid peaks were found
  if (filteredPeaks.length < minValidPeaks || intervals.length < minValidPeaks - 1) {
    return {
      valid: false,
      bpm: null,
      peakIndices,
      peakCount: filteredPeaks.length,
      medianInterval: null,
      intervals,
      threshold,
      std
    };
  }

  // Step 5: Compute median interval for robust BPM
  const sortedIntervals = [...intervals].sort((a, b) => a - b);
  const mid = Math.floor(sortedIntervals.length / 2);
  const medianInterval = sortedIntervals.length % 2 === 0
    ? (sortedIntervals[mid - 1] + sortedIntervals[mid]) / 2
    : sortedIntervals[mid];

  const bpm = 60.0 / medianInterval;

  return {
    valid: true,
    bpm,
    peakIndices,
    peakCount: filteredPeaks.length,
    medianInterval,
    intervals,
    threshold,
    std
  };
}
