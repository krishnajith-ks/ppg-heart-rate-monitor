// src/dsp/fft.js
// Hand-crafted Radix-2 Cooley-Tukey Fast Fourier Transform (FFT) with Hann windowing and zero-padding.
//
// Why this exists:
// The FFT transforms a finite time-domain signal window x[n] into its discrete frequency spectrum X[k].
//
// Key DSP Viva Concepts:
// 1. Hann Windowing: Multiplied across x[n] to smoothly taper both edges to zero.
//    This eliminates boundary discontinuities that would otherwise cause "spectral leakage" (sidelobes).
// 2. Zero-Padding (to 2048 points): Appending zeros interpolates the Discrete-Time Fourier Transform (DTFT).
//    It does not increase true physical resolution (which is strictly fs / N_window), but provides a smooth,
//    fine frequency sampling grid (spacing fs / 2048 ≈ 0.0146 Hz ≈ 0.88 BPM).
// 3. Parabolic Interpolation: Fits a 2nd-degree parabola over the 3 highest magnitude bins to locate the true
//    continuous peak frequency between discrete bins.

/**
 * Computes the power-of-two Radix-2 in-place Cooley-Tukey FFT.
 * @param {Float64Array} real - Real part array (length must be power of 2)
 * @param {Float64Array} imag - Imaginary part array (length must be power of 2)
 */
export function radix2FFT(real, imag) {
  const n = real.length;

  // Step 1: Bit-reversal permutation
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      let tempR = real[i]; real[i] = real[j]; real[j] = tempR;
      let tempI = imag[i]; imag[i] = imag[j]; imag[j] = tempI;
    }
    let k = n >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  // Step 2: Butterfly computation stages
  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1;
    const angle = (-2.0 * Math.PI) / len;
    const wStepR = Math.cos(angle);
    const wStepI = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let wR = 1.0;
      let wI = 0.0;

      for (let k = 0; k < halfLen; k++) {
        const idxEven = i + k;
        const idxOdd = i + k + halfLen;

        const uR = real[idxEven];
        const uI = imag[idxEven];

        // Complex multiplication: (real + j*imag) * (wR + j*wI)
        const vR = real[idxOdd] * wR - imag[idxOdd] * wI;
        const vI = real[idxOdd] * wI + imag[idxOdd] * wR;

        real[idxEven] = uR + vR;
        imag[idxEven] = uI + vI;
        real[idxOdd] = uR - vR;
        imag[idxOdd] = uI - vI;

        // Advance twiddle factor
        const nextWR = wR * wStepR - wI * wStepI;
        const nextWI = wR * wStepI + wI * wStepR;
        wR = nextWR;
        wI = nextWI;
      }
    }
  }
}

/**
 * Computes the windowed, zero-padded FFT spectrum and extracts dominant frequency in 0.5–4.0 Hz.
 *
 * @param {Float64Array|Float32Array|Array<number>} signal - Filtered uniform time-domain signal
 * @param {number} fs - Sampling rate in Hz
 * @param {object} options - FFT configuration
 * @returns {{
 *   valid: boolean,
 *   bpm: number|null,
 *   peakFreq: number,
 *   frequencies: Float64Array,
 *   magnitudes: Float64Array,
 *   fftSize: number,
 *   deltaF: number
 * }}
 */
export function computeSpectrum(signal, fs = 30, options = {}) {
  const n = signal.length;
  const fftSize = options.fftSize ?? 2048;
  const minFreq = options.minFreq ?? 0.5;
  const maxFreq = options.maxFreq ?? 4.0;

  if (n < 10) {
    return {
      valid: false,
      bpm: null,
      peakFreq: 0,
      frequencies: new Float64Array(0),
      magnitudes: new Float64Array(0),
      fftSize,
      deltaF: fs / n
    };
  }

  // Check if signal has meaningful variation
  let sum = 0;
  for (let i = 0; i < n; i++) sum += signal[i];
  const mean = sum / n;
  let varSum = 0;
  for (let i = 0; i < n; i++) varSum += (signal[i] - mean) ** 2;
  const std = Math.sqrt(varSum / n);

  if (std < 1e-6) {
    return {
      valid: false,
      bpm: null,
      peakFreq: 0,
      frequencies: new Float64Array(0),
      magnitudes: new Float64Array(0),
      fftSize,
      deltaF: fs / n
    };
  }

  const real = new Float64Array(fftSize);
  const imag = new Float64Array(fftSize);

  // Apply Hann window and copy into zero-padded buffer
  for (let i = 0; i < n; i++) {
    const hann = 0.5 * (1.0 - Math.cos((2.0 * Math.PI * i) / (n - 1)));
    real[i] = signal[i] * hann;
  }

  // Execute in-place FFT
  radix2FFT(real, imag);

  // Compute magnitude spectrum for positive frequencies (first half of FFT)
  const halfSize = fftSize / 2;
  const frequencies = new Float64Array(halfSize);
  const magnitudes = new Float64Array(halfSize);

  let maxMag = -1.0;
  let maxIdx = -1;

  for (let i = 0; i < halfSize; i++) {
    const freq = (i * fs) / fftSize;
    frequencies[i] = freq;
    const mag = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
    magnitudes[i] = mag;

    // Search for maximum peak only inside the physiological passband (0.5 to 4.0 Hz)
    if (freq >= minFreq && freq <= maxFreq) {
      if (mag > maxMag) {
        maxMag = mag;
        maxIdx = i;
      }
    }
  }

  if (maxIdx <= 0 || maxMag <= 1e-6) {
    return {
      valid: false,
      bpm: null,
      peakFreq: 0,
      frequencies,
      magnitudes,
      fftSize,
      deltaF: fs / n
    };
  }

  // Parabolic interpolation for sub-bin peak refinement
  let refinedFreq = frequencies[maxIdx];
  if (maxIdx > 0 && maxIdx < halfSize - 1) {
    const yLeft = magnitudes[maxIdx - 1];
    const yCenter = magnitudes[maxIdx];
    const yRight = magnitudes[maxIdx + 1];
    const denominator = yLeft - 2.0 * yCenter + yRight;
    if (Math.abs(denominator) > 1e-9) {
      const delta = (0.5 * (yLeft - yRight)) / denominator;
      const binWidth = fs / fftSize;
      refinedFreq += delta * binWidth;
    }
  }

  const bpm = refinedFreq * 60.0;

  return {
    valid: true,
    bpm,
    peakFreq: refinedFreq,
    frequencies,
    magnitudes,
    fftSize,
    deltaF: fs / n
  };
}
