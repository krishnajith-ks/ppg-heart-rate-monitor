/**
 * Fast Fourier Transform (FFT) with Hann Window and Parabolic Peak Refinement
 */

export interface FftResult {
  bpm: number;
  peakFreq: number;
  magnitudes: number[];
  freqs: number[];
}

/**
 * In-place Radix-2 Cooley-Tukey FFT
 */
function fftRadix2(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  // Bit-reversal permutation
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      const tempR = re[i]; re[i] = re[j]; re[j] = tempR;
      const tempI = im[i]; im[i] = im[j]; im[j] = tempI;
    }
    let k = n >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  // Butterfly updates
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wstepR = Math.cos(angle);
    const wstepI = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let wR = 1;
      let wI = 0;
      for (let k = 0; k < half; k++) {
        const pos = i + k;
        const match = pos + half;
        const tr = wR * re[match] - wI * im[match];
        const ti = wR * im[match] + wI * re[match];

        re[match] = re[pos] - tr;
        im[match] = im[pos] - ti;
        re[pos] += tr;
        im[pos] += ti;

        const nextWR = wR * wstepR - wI * wstepI;
        const nextWI = wR * wstepI + wI * wstepR;
        wR = nextWR;
        wI = nextWI;
      }
    }
  }
}

export function computeFftBpm(
  signal: number[],
  fs = 30,
  fftSize = 4096
): FftResult {
  const n = signal.length;
  if (n < 30) {
    return { bpm: 0, peakFreq: 0, magnitudes: [], freqs: [] };
  }

  // 1. Hann window & zero-padding
  const re = new Float64Array(fftSize);
  const im = new Float64Array(fftSize);

  // Remove DC
  let sum = 0;
  for (let i = 0; i < n; i++) sum += signal[i];
  const mean = sum / n;

  for (let i = 0; i < n; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    re[i] = (signal[i] - mean) * w;
  }

  // 2. Execute FFT
  fftRadix2(re, im);

  // 3. Magnitude spectrum up to Nyquist (fs / 2)
  const halfN = fftSize / 2;
  const magnitudes: number[] = new Array(halfN);
  const freqs: number[] = new Array(halfN);

  for (let k = 0; k < halfN; k++) {
    magnitudes[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
    freqs[k] = (k * fs) / fftSize;
  }

  // 4. Find peak in cardiac band [0.5 Hz, 4.0 Hz] (30 to 240 BPM)
  const minBin = Math.max(1, Math.floor((0.5 * fftSize) / fs));
  const maxBin = Math.min(halfN - 2, Math.ceil((4.0 * fftSize) / fs));

  let peakBin = minBin;
  let maxMag = magnitudes[minBin];

  for (let k = minBin; k <= maxBin; k++) {
    if (magnitudes[k] > maxMag) {
      maxMag = magnitudes[k];
      peakBin = k;
    }
  }

  // 5. Three-point parabolic interpolation for sub-bin frequency refinement
  let peakFreq = freqs[peakBin];
  if (peakBin > 0 && peakBin < halfN - 1) {
    const alpha = magnitudes[peakBin - 1];
    const beta = magnitudes[peakBin];
    const gamma = magnitudes[peakBin + 1];
    const denom = 2 * (2 * beta - alpha - gamma);
    if (Math.abs(denom) > 1e-12) {
      const delta = (gamma - alpha) / denom;
      peakFreq = ((peakBin + delta) * fs) / fftSize;
    }
  }

  const bpm = peakFreq * 60;
  return { bpm, peakFreq, magnitudes, freqs };
}
