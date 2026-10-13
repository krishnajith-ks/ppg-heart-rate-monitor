// run_dsp_tests.mjs - Standalone DSP validation test suite
// Verifies Section 6.6 biquad coefficients and Section 6.10 synthetic test vectors

function computeBiquad(type, fc, fs) {
  const w0 = 2 * Math.PI * fc / fs;
  const Q = 1 / Math.SQRT2;
  const alpha = Math.sin(w0) / (2 * Q);
  let b0, b1, b2;

  if (type === 'highpass') {
    b0 = (1 + Math.cos(w0)) / 2;
    b1 = -(1 + Math.cos(w0));
    b2 = (1 + Math.cos(w0)) / 2;
  } else if (type === 'lowpass') {
    b0 = (1 - Math.cos(w0)) / 2;
    b1 = 1 - Math.cos(w0);
    b2 = (1 - Math.cos(w0)) / 2;
  } else {
    throw new Error('Unknown biquad type: ' + type);
  }

  const a0 = 1 + alpha;
  const a1 = -2 * Math.cos(w0);
  const a2 = 1 - alpha;

  return {
    b0: b0 / a0,
    b1: b1 / a0,
    b2: b2 / a0,
    a1: a1 / a0,
    a2: a2 / a0
  };
}

function applyBiquad(coeffs, input) {
  const { b0, b1, b2, a1, a2 } = coeffs;
  const output = new Float64Array(input.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;

  for (let i = 0; i < input.length; i++) {
    const x = input[i];
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    output[i] = y;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
  }
  return output;
}

function detrend(signal, fs) {
  const n = signal.length;
  const windowSize = Math.max(3, Math.round(1.5 * fs));
  const half = Math.floor(windowSize / 2);
  const result = new Float64Array(n);

  let sum = 0;
  for (let i = 0; i < n; i++) sum += signal[i];
  const mean = sum / n;

  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(n - 1, i + half);
    let winSum = 0;
    for (let j = start; j <= end; j++) winSum += signal[j];
    const movingAvg = winSum / (end - start + 1);
    result[i] = (signal[i] - movingAvg);
  }

  let finalSum = 0;
  for (let i = 0; i < n; i++) finalSum += result[i];
  const finalMean = finalSum / n;
  for (let i = 0; i < n; i++) result[i] -= finalMean;

  return result;
}

function filterCascade(signal, fs) {
  const hpCoeffs = computeBiquad('highpass', 0.5, fs);
  const lpCoeffs = computeBiquad('lowpass', 4.0, fs);
  const hpOut = applyBiquad(hpCoeffs, signal);
  return applyBiquad(lpCoeffs, hpOut);
}

function detectPeaks(signal, fs) {
  const n = signal.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += signal[i];
  const mean = sum / n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (signal[i] - mean) ** 2;
  const std = Math.sqrt(variance / n);

  if (std < 1e-6) return { valid: false, bpm: null, peaks: [] };

  const threshold = 0.3 * std;
  const minDistanceSamples = Math.round(0.33 * fs);
  const rawPeaks = [];

  for (let i = 1; i < n - 1; i++) {
    if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1] && signal[i] > threshold) {
      rawPeaks.push({ index: i, val: signal[i] });
    }
  }

  const filteredPeaks = [];
  for (const peak of rawPeaks) {
    if (filteredPeaks.length === 0) {
      filteredPeaks.push(peak);
    } else {
      const last = filteredPeaks[filteredPeaks.length - 1];
      if (peak.index - last.index < minDistanceSamples) {
        if (peak.val > last.val) filteredPeaks[filteredPeaks.length - 1] = peak;
      } else {
        filteredPeaks.push(peak);
      }
    }
  }

  const intervals = [];
  for (let i = 1; i < filteredPeaks.length; i++) {
    const dt = (filteredPeaks[i].index - filteredPeaks[i - 1].index) / fs;
    if (dt >= 0.3 && dt <= 2.0) intervals.push(dt);
  }

  if (intervals.length < 4) {
    return { valid: false, bpm: null, peaks: filteredPeaks };
  }

  intervals.sort((a, b) => a - b);
  const mid = Math.floor(intervals.length / 2);
  const medianInterval = intervals.length % 2 === 0
    ? (intervals[mid - 1] + intervals[mid]) / 2
    : intervals[mid];

  const bpm = 60 / medianInterval;
  return { valid: true, bpm, peaks: filteredPeaks };
}

function computeFFT(signal, fs) {
  const n = signal.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += signal[i];
  const mean = sum / n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (signal[i] - mean) ** 2;
  const std = Math.sqrt(variance / n);

  if (std < 1e-6) return { valid: false, bpm: null, peakFreq: 0 };

  const fftSize = 2048;
  const real = new Float64Array(fftSize);
  const imag = new Float64Array(fftSize);

  for (let i = 0; i < n; i++) {
    const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    real[i] = signal[i] * hann;
  }

  // Radix-2 Cooley-Tukey in-place FFT
  let j = 0;
  for (let i = 0; i < fftSize - 1; i++) {
    if (i < j) {
      let tr = real[i]; real[i] = real[j]; real[j] = tr;
      let ti = imag[i]; imag[i] = imag[j]; imag[j] = ti;
    }
    let k = fftSize >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  for (let len = 2; len <= fftSize; len <<= 1) {
    const half = len >> 1;
    const angle = -2 * Math.PI / len;
    const wStepR = Math.cos(angle);
    const wStepI = Math.sin(angle);
    for (let i = 0; i < fftSize; i += len) {
      let wR = 1, wI = 0;
      for (let k = 0; k < half; k++) {
        const uR = real[i + k];
        const uI = imag[i + k];
        const vR = real[i + k + half] * wR - imag[i + k + half] * wI;
        const vI = real[i + k + half] * wI + imag[i + k + half] * wR;
        real[i + k] = uR + vR;
        imag[i + k] = uI + vI;
        real[i + k + half] = uR - vR;
        imag[i + k + half] = uI - vI;
        const nextWR = wR * wStepR - wI * wStepI;
        const nextWI = wR * wStepI + wI * wStepR;
        wR = nextWR;
        wI = nextWI;
      }
    }
  }

  let maxMag = -1;
  let peakFreq = 0;
  for (let i = 0; i < fftSize / 2; i++) {
    const freq = (i * fs) / fftSize;
    if (freq >= 0.5 && freq <= 4.0) {
      const mag = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
      if (mag > maxMag) {
        maxMag = mag;
        peakFreq = freq;
      }
    }
  }

  if (maxMag <= 1e-6) return { valid: false, bpm: null, peakFreq: 0 };
  return { valid: true, bpm: peakFreq * 60, peakFreq };
}

function runPipeline(rawSignal, fs) {
  const detrended = detrend(rawSignal, fs);
  const filtered = filterCascade(detrended, fs);
  // discard start-up filter transient (first 3s of 30Hz)
  const settlingSamples = Math.round(3 * fs);
  const steadySignal = filtered.slice(settlingSamples);
  const peakResult = detectPeaks(steadySignal, fs);
  const fftResult = computeFFT(steadySignal, fs);
  return { peakResult, fftResult };
}

// ==========================================
// Test Execution
// ==========================================
console.log('--- DSP Verification Test Suite ---');
let allPassed = true;

// 1. Table 6.6 Biquad Coefficients Check
console.log('\n[1/5] Checking Biquad Coefficients at fs = 30 Hz (to 6 decimals)...');
const refHP = { b0: 0.92862378, b1: -1.85724756, b2: 0.92862378, a1: -1.85214649, a2: 0.86234863 };
const refLP = { b0: 0.10844744, b1: 0.21689488, b2: 0.10844744, a1: -0.87727063, a2: 0.31106039 };
const calcHP = computeBiquad('highpass', 0.5, 30);
const calcLP = computeBiquad('lowpass', 4.0, 30);

let coeffMismatch = false;
for (const k of ['b0', 'b1', 'b2', 'a1', 'a2']) {
  if (Math.abs(calcHP[k] - refHP[k]) > 1e-6) {
    console.error(`  FAIL: Highpass ${k}: expected ${refHP[k]}, got ${calcHP[k]}`);
    coeffMismatch = true;
  }
  if (Math.abs(calcLP[k] - refLP[k]) > 1e-6) {
    console.error(`  FAIL: Lowpass ${k}: expected ${refLP[k]}, got ${calcLP[k]}`);
    coeffMismatch = true;
  }
}

if (!coeffMismatch) {
  console.log('  PASS: All Highpass and Lowpass biquad coefficients match Section 6.6 table to 6 decimals.');
} else {
  allPassed = false;
}

// 2. Synthetic 72 BPM Test (1.2 Hz)
console.log('\n[2/5] Testing Synthetic 72 BPM Signal (1.2 Hz, 15 s duration)...');
const fs = 30;
const dur = 15;
const N = fs * dur;
const sig72 = new Float64Array(N);
for (let i = 0; i < N; i++) {
  const t = i / fs;
  sig72[i] = 100 + 0.5 * Math.sin(2 * Math.PI * 1.2 * t) + 0.05 * t;
}
const res72 = runPipeline(sig72, fs);
const pBpm72 = res72.peakResult.bpm;
const fBpm72 = res72.fftResult.bpm;
console.log(`  Peak BPM: ${pBpm72?.toFixed(2)}, FFT BPM: ${fBpm72?.toFixed(2)}`);
if (Math.abs(pBpm72 - 72) <= 1.5 && Math.abs(fBpm72 - 72) <= 1.5) {
  console.log('  PASS: 72 BPM detected within +/- 1.5 BPM tolerance.');
} else {
  console.error('  FAIL: 72 BPM out of tolerance.');
  allPassed = false;
}

// 3. Synthetic 48 BPM Test (0.8 Hz)
console.log('\n[3/5] Testing Synthetic 48 BPM Signal (0.8 Hz, 15 s duration)...');
const sig48 = new Float64Array(N);
for (let i = 0; i < N; i++) {
  const t = i / fs;
  sig48[i] = 100 + 0.5 * Math.sin(2 * Math.PI * 0.8 * t) + 0.05 * t;
}
const res48 = runPipeline(sig48, fs);
const pBpm48 = res48.peakResult.bpm;
const fBpm48 = res48.fftResult.bpm;
console.log(`  Peak BPM: ${pBpm48?.toFixed(2)}, FFT BPM: ${fBpm48?.toFixed(2)}`);
if (Math.abs(pBpm48 - 48) <= 1.5 && Math.abs(fBpm48 - 48) <= 1.5) {
  console.log('  PASS: 48 BPM detected within +/- 1.5 BPM tolerance.');
} else {
  console.error('  FAIL: 48 BPM out of tolerance.');
  allPassed = false;
}

// 4. Synthetic 120 BPM Test (2.0 Hz)
console.log('\n[4/5] Testing Synthetic 120 BPM Signal (2.0 Hz, 15 s duration)...');
const sig120 = new Float64Array(N);
for (let i = 0; i < N; i++) {
  const t = i / fs;
  sig120[i] = 100 + 0.5 * Math.sin(2 * Math.PI * 2.0 * t) + 0.05 * t;
}
const res120 = runPipeline(sig120, fs);
const pBpm120 = res120.peakResult.bpm;
const fBpm120 = res120.fftResult.bpm;
console.log(`  Peak BPM: ${pBpm120?.toFixed(2)}, FFT BPM: ${fBpm120?.toFixed(2)}`);
if (Math.abs(pBpm120 - 120) <= 1.5 && Math.abs(fBpm120 - 120) <= 1.5) {
  console.log('  PASS: 120 BPM detected within +/- 1.5 BPM tolerance.');
} else {
  console.error('  FAIL: 120 BPM out of tolerance.');
  allPassed = false;
}

// 5. Flat Signal Test (No valid data)
console.log('\n[5/5] Testing Flat Signal (Zero AC component)...');
const sigFlat = new Float64Array(N);
sigFlat.fill(100.0);
const resFlat = runPipeline(sigFlat, fs);
const flatPeakValid = resFlat.peakResult.valid;
const flatFFTValid = resFlat.fftResult.valid;
console.log(`  Peak Valid: ${flatPeakValid}, FFT Valid: ${flatFFTValid}`);
if (!flatPeakValid && !flatFFTValid) {
  console.log('  PASS: Flat signal correctly reported as invalid (no valid data).');
} else {
  console.error('  FAIL: Flat signal incorrectly reported valid beats.');
  allPassed = false;
}

console.log('\n----------------------------------------');
if (allPassed) {
  console.log('OVERALL: ALL TESTS PASSED (Exit code 0)');
  process.exit(0);
} else {
  console.error('OVERALL: TESTS FAILED (Exit code 1)');
  process.exit(1);
}
