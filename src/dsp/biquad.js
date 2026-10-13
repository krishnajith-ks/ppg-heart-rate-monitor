// src/dsp/biquad.js
// Hand-crafted Butterworth biquad (2nd-order IIR) filter design and Direct Form I implementation.
//
// Why this exists:
// A Butterworth filter provides a maximally flat magnitude response in the passband with no ripple,
// which faithfully preserves the true shape of the physiological arterial pulse wave.
// Direct Form I biquad cascade is used instead of a single 4th-order polynomial because cascading
// paired 2nd-order sections avoids coefficient quantization errors and numerical instability.
//
// Stage 1: 2nd-order Butterworth High-Pass at fc = 0.5 Hz (rejects drift below 30 BPM).
// Stage 2: 2nd-order Butterworth Low-Pass at fc = 4.0 Hz (rejects high-frequency sensor noise above 240 BPM).

/**
 * Calculates normalized Direct Form I biquad coefficients for a 2nd-order Butterworth section.
 * Standard audio EQ / digital filter design equations:
 *   w0 = 2 * pi * fc / fs
 *   alpha = sin(w0) / (2 * Q), where Q = 1/sqrt(2) ≈ 0.70710678
 *
 * @param {'highpass'|'lowpass'} type - Filter type
 * @param {number} fc - Cutoff frequency in Hz (0.5 or 4.0)
 * @param {number} fs - Sampling frequency in Hz (typically ~30 Hz)
 * @param {number} Q - Quality factor (default 1/sqrt(2))
 * @returns {{ b0: number, b1: number, b2: number, a1: number, a2: number, fc: number, fs: number, type: string }}
 */
export function computeBiquadCoefficients(type, fc, fs, Q = 1 / Math.SQRT2) {
  const w0 = (2 * Math.PI * fc) / fs;
  const cosW0 = Math.cos(w0);
  const sinW0 = Math.sin(w0);
  const alpha = sinW0 / (2 * Q);

  let b0, b1, b2;

  if (type === 'highpass') {
    b0 = (1 + cosW0) / 2;
    b1 = -(1 + cosW0);
    b2 = (1 + cosW0) / 2;
  } else if (type === 'lowpass') {
    b0 = (1 - cosW0) / 2;
    b1 = 1 - cosW0;
    b2 = (1 - cosW0) / 2;
  } else {
    throw new Error(`Unsupported biquad filter type: ${type}`);
  }

  const a0 = 1 + alpha;
  const a1 = -2 * cosW0;
  const a2 = 1 - alpha;

  // Normalize all coefficients by dividing by a0 (so a0 becomes 1.0)
  return {
    type,
    fc,
    fs,
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0
  };
}

/**
 * Filters a discrete 1-D signal through a single biquad section using Direct Form I:
 *   y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
 *
 * @param {{ b0: number, b1: number, b2: number, a1: number, a2: number }} coeffs
 * @param {Float64Array|Float32Array|Array<number>} input - Input signal x[n]
 * @returns {Float64Array} - Output filtered signal y[n]
 */
export function applyBiquadFilter(coeffs, input) {
  const n = input.length;
  const output = new Float64Array(n);
  const { b0, b1, b2, a1, a2 } = coeffs;

  let x1 = 0; // x[n-1]
  let x2 = 0; // x[n-2]
  let y1 = 0; // y[n-1]
  let y2 = 0; // y[n-2]

  for (let i = 0; i < n; i++) {
    const x0 = input[i];
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    output[i] = y0;

    // Shift delay registers
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }

  return output;
}

/**
 * Applies the complete 4th-order Butterworth bandpass cascade (High-Pass 0.5 Hz -> Low-Pass 4.0 Hz).
 * @param {Float64Array|Float32Array|Array<number>} input - Input discrete-time signal
 * @param {number} fs - Sampling rate in Hz
 * @returns {{ filtered: Float64Array, hpCoeffs: object, lpCoeffs: object }}
 */
export function filterBandpassCascade(input, fs = 30) {
  const hpCoeffs = computeBiquadCoefficients('highpass', 0.5, fs);
  const lpCoeffs = computeBiquadCoefficients('lowpass', 4.0, fs);

  // Cascade: signal -> high-pass -> low-pass
  const hpOutput = applyBiquadFilter(hpCoeffs, input);
  const bandpassOutput = applyBiquadFilter(lpCoeffs, hpOutput);

  return {
    filtered: bandpassOutput,
    hpCoeffs,
    lpCoeffs
  };
}

/**
 * Computes the theoretical magnitude frequency response |H(f)| of the cascaded biquad filter.
 * Used in Admin Panel Section 7.3 to display the frequency response curve to viva examiners.
 *
 * For a biquad H(e^(jw)):
 *   Numerator:   B(e^(jw)) = b0 + b1*e^(-jw) + b2*e^(-2jw)
 *   Denominator: A(e^(jw)) = 1  + a1*e^(-jw) + a2*e^(-2jw)
 *
 * @param {object} hpCoeffs - Highpass coefficients
 * @param {object} lpCoeffs - Lowpass coefficients
 * @param {number} fs - Sampling frequency (Hz)
 * @param {number} numPoints - Number of frequency bins to evaluate (e.g. 100 points from 0 to 6 Hz)
 * @returns {{ frequencies: Float64Array, magnitudes: Float64Array }}
 */
export function computeFilterFrequencyResponse(hpCoeffs, lpCoeffs, fs = 30, numPoints = 120) {
  const maxFreq = 6.0; // Show up to 6 Hz (covers DC to past 4 Hz cutoff)
  const freqs = new Float64Array(numPoints);
  const mags = new Float64Array(numPoints);

  function evalSection(coeffs, w) {
    const cos1 = Math.cos(w);
    const sin1 = Math.sin(w);
    const cos2 = Math.cos(2 * w);
    const sin2 = Math.sin(2 * w);

    // Numerator B(e^jw) = b0 + b1*cos(w) + b2*cos(2w) - j*(b1*sin(w) + b2*sin(2w))
    const numR = coeffs.b0 + coeffs.b1 * cos1 + coeffs.b2 * cos2;
    const numI = -(coeffs.b1 * sin1 + coeffs.b2 * sin2);

    // Denominator A(e^jw) = 1 + a1*cos(w) + a2*cos(2w) - j*(a1*sin(w) + a2*sin(2w))
    const denR = 1.0 + coeffs.a1 * cos1 + coeffs.a2 * cos2;
    const denI = -(coeffs.a1 * sin1 + coeffs.a2 * sin2);

    const numMagSq = numR * numR + numI * numI;
    const denMagSq = denR * denR + denI * denI;

    return Math.sqrt(numMagSq / denMagSq);
  }

  for (let i = 0; i < numPoints; i++) {
    const f = (i / (numPoints - 1)) * maxFreq;
    const w = (2 * Math.PI * f) / fs;
    const magHP = evalSection(hpCoeffs, w);
    const magLP = evalSection(lpCoeffs, w);
    freqs[i] = f;
    mags[i] = magHP * magLP; // Cascaded system magnitude is the product of individual magnitudes
  }

  return { frequencies: freqs, magnitudes: mags };
}
