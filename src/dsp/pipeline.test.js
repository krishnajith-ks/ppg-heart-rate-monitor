// src/dsp/pipeline.test.js
// Automated verification suite for the DSP engine.
// Verifies Section 6.6 biquad coefficients, ring buffer operations, and Section 6.10 test vectors.

import { RingBuffer } from './ringBuffer.js';
import { computeBiquadCoefficients } from './biquad.js';
import { runDspPipeline } from './pipeline.js';

let allPassed = true;

function assert(condition, message) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    allPassed = false;
  } else {
    console.log(`  PASS: ${message}`);
  }
}

console.log('=== PPG DSP Engine Unit & Verification Tests ===\n');

// 1. RingBuffer Tests
console.log('[1/4] Testing RingBuffer (capacity & wraparound)...');
const rb = new RingBuffer(5);
for (let i = 0; i < 7; i++) {
  rb.push(i * 0.1, i * 10);
}
assert(rb.size() === 5, 'RingBuffer size is capped at capacity (5)');
const arr = rb.toArray();
assert(Math.abs(arr.t[0] - 0.2) < 1e-4 && arr.v[0] === 20, 'Oldest samples wrapped around correctly');
assert(Math.abs(arr.t[4] - 0.6) < 1e-4 && arr.v[4] === 60, 'Newest sample at tail of array');

// 2. Biquad Coefficients vs Section 6.6 Table
console.log('\n[2/4] Verifying Biquad Coefficients vs Section 6.6 at fs = 30 Hz...');
const refHP = { b0: 0.92862378, b1: -1.85724756, b2: 0.92862378, a1: -1.85214649, a2: 0.86234863 };
const refLP = { b0: 0.10844744, b1: 0.21689488, b2: 0.10844744, a1: -0.87727063, a2: 0.31106039 };

const hpCalc = computeBiquadCoefficients('highpass', 0.5, 30);
const lpCalc = computeBiquadCoefficients('lowpass', 4.0, 30);

let coeffsMatch = true;
for (const k of ['b0', 'b1', 'b2', 'a1', 'a2']) {
  if (Math.abs(hpCalc[k] - refHP[k]) > 1e-6 || Math.abs(lpCalc[k] - refLP[k]) > 1e-6) {
    coeffsMatch = false;
  }
}
assert(coeffsMatch, 'High-pass and Low-pass biquad coefficients match Section 6.6 to 6 decimal places');

// 3. Synthetic Signals (72, 48, 120 BPM)
console.log('\n[3/4] Testing Synthetic Vectors (Section 6.10)...');
const fs = 30;
const dur = 15;
const N = fs * dur;

function generateSignal(freqHz) {
  const t = new Float32Array(N);
  const v = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const time = i / fs;
    t[i] = time;
    v[i] = 100 + 0.5 * Math.sin(2 * Math.PI * freqHz * time) + 0.05 * time;
  }
  return { t, v };
}

// 72 BPM (1.2 Hz)
const sig72 = generateSignal(1.2);
const res72 = runDspPipeline(sig72.t, sig72.v, fs);
assert(
  res72.success && Math.abs(res72.metrics.headlineBpm - 72) <= 1.5,
  `72 BPM detected accurately (got ${res72.metrics.headlineBpm} BPM, peak: ${res72.metrics.bpmPeak}, fft: ${res72.metrics.bpmFFT})`
);

// 48 BPM (0.8 Hz)
const sig48 = generateSignal(0.8);
const res48 = runDspPipeline(sig48.t, sig48.v, fs);
assert(
  res48.success && Math.abs(res48.metrics.headlineBpm - 48) <= 1.5,
  `48 BPM detected accurately (got ${res48.metrics.headlineBpm} BPM, peak: ${res48.metrics.bpmPeak}, fft: ${res48.metrics.bpmFFT})`
);

// 120 BPM (2.0 Hz)
const sig120 = generateSignal(2.0);
const res120 = runDspPipeline(sig120.t, sig120.v, fs);
assert(
  res120.success && Math.abs(res120.metrics.headlineBpm - 120) <= 1.5,
  `120 BPM detected accurately (got ${res120.metrics.headlineBpm} BPM, peak: ${res120.metrics.bpmPeak}, fft: ${res120.metrics.bpmFFT})`
);

// 4. Flat Signal (Zero AC Variation)
console.log('\n[4/4] Testing Flat Signal...');
const flatT = new Float32Array(N);
const flatV = new Float32Array(N);
for (let i = 0; i < N; i++) {
  flatT[i] = i / fs;
  flatV[i] = 100.0;
}
const resFlat = runDspPipeline(flatT, flatV, fs);
assert(
  resFlat.metrics.bpmPeak === null && (resFlat.metrics.bpmFFT === null || resFlat.metrics.confidence === 'Invalid'),
  'Flat signal correctly reported as invalid (no false pulse fabricated)'
);

console.log('\n================================================');
if (allPassed) {
  console.log('RESULT: ALL MILESTONE 2 DSP TESTS PASSED (Exit code 0)');
  process.exit(0);
} else {
  console.error('RESULT: TESTS FAILED (Exit code 1)');
  process.exit(1);
}
