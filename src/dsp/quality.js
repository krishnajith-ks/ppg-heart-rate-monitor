// src/dsp/quality.js
// Signal Quality Index (SNR) and Dual-Method Agreement Validation.
//
// Why this exists:
// Measuring heart rate with a mobile camera can be contaminated by hand tremor,
// ambient light variations, or fluctuating finger pressure.
// Rather than trusting a single method blindly, we compare two independent mathematical domains:
// 1. Time domain (systolic peak detection: interval analysis)
// 2. Frequency domain (spectral magnitude: dominant harmonic frequency)
//
// If |BPM_peak - BPM_fft| <= 5 BPM, confidence is HIGH.
// Furthermore, the Signal-to-Noise Ratio (SNR) compares power concentrated around the heart rate peak
// versus noise power across the rest of the 0.5–4.0 Hz band.

/**
 * Computes the spectral Signal-to-Noise Ratio (SNR) in the 0.5–4.0 Hz physiological band.
 * SNR = (Power in [f_peak - 0.2 Hz, f_peak + 0.2 Hz]) / (Power in rest of 0.5–4.0 Hz band)
 *
 * @param {Float64Array} frequencies - FFT frequency array
 * @param {Float64Array} magnitudes - FFT magnitude array
 * @param {number} peakFreq - Dominant detected peak frequency (Hz)
 * @param {number} halfWidthHz - Peak signal band half-width (default 0.2 Hz)
 * @returns {{ snr: number, signalPower: number, noisePower: number, qualityLabel: 'Good'|'Weak' }}
 */
export function computeSNR(frequencies, magnitudes, peakFreq, halfWidthHz = 0.2) {
  let signalPower = 0.0;
  let noisePower = 0.0;

  const fMin = 0.5;
  const fMax = 4.0;
  const fPeakLower = Math.max(fMin, peakFreq - halfWidthHz);
  const fPeakUpper = Math.min(fMax, peakFreq + halfWidthHz);

  for (let i = 0; i < frequencies.length; i++) {
    const f = frequencies[i];
    if (f >= fMin && f <= fMax) {
      const power = magnitudes[i] * magnitudes[i]; // Power is proportional to magnitude squared
      if (f >= fPeakLower && f <= fPeakUpper) {
        signalPower += power;
      } else {
        noisePower += power;
      }
    }
  }

  // Avoid division by zero
  const snr = noisePower > 1e-9 ? signalPower / noisePower : (signalPower > 0 ? 10.0 : 0.0);
  const qualityLabel = snr >= 1.8 ? 'Good' : 'Weak';

  return { snr, signalPower, noisePower, qualityLabel };
}

/**
 * Evaluates agreement between time-domain and frequency-domain BPM estimates.
 *
 * @param {number|null} bpmPeak - BPM from peak detection
 * @param {number|null} bpmFFT - BPM from FFT spectrum
 * @param {number} snr - Computed SNR value
 * @param {number} maxDiff - Maximum allowed difference for agreement (default 5 BPM)
 * @returns {{
 *   agrees: boolean,
 *   diff: number|null,
 *   headlineBpm: number|null,
 *   confidence: 'High'|'Low'|'Invalid',
 *   statusText: string
 * }}
 */
export function evaluateAgreement(bpmPeak, bpmFFT, snr, maxDiff = 5.0) {
  if (bpmPeak === null && bpmFFT === null) {
    return {
      agrees: false,
      diff: null,
      headlineBpm: null,
      confidence: 'Invalid',
      statusText: 'No valid pulse detected'
    };
  }

  if (bpmPeak === null || bpmFFT === null) {
    const singleBpm = bpmPeak ?? bpmFFT;
    return {
      agrees: false,
      diff: null,
      headlineBpm: Math.round(singleBpm),
      confidence: 'Low',
      statusText: 'Single-method estimate (Low Confidence)'
    };
  }

  const diff = Math.abs(bpmPeak - bpmFFT);
  const agrees = diff <= maxDiff;

  if (agrees) {
    // Both methods closely agree: average them for highest precision
    const headlineBpm = Math.round((bpmPeak + bpmFFT) / 2.0);
    return {
      agrees: true,
      diff,
      headlineBpm,
      confidence: snr >= 1.8 ? 'High' : 'Medium',
      statusText: 'Methods Agree (High Confidence)'
    };
  } else {
    // Methods disagree: transparently report both without artificial clamping
    return {
      agrees: false,
      diff,
      headlineBpm: Math.round(bpmFFT), // Fall back to dominant spectral frequency
      confidence: 'Low',
      statusText: `Methods Disagree by ${diff.toFixed(1)} BPM (Low Confidence)`
    };
  }
}
