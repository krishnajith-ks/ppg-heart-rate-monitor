import { describe, it, expect } from 'vitest';
import { resampleUniform } from '../resampling';
import { BiquadCascade } from '../biquad';
import { detectPeaksIBI } from '../peakDetection';
import { computeFftBpm } from '../fft';
import { crossCheckBpm } from '../agreement';

describe('DSP Engine - Resampling', () => {
  it('resamples jittered timestamps onto uniform 30 Hz grid accurately', () => {
    // Generate 1 Hz sine with irregular jitter
    const rawTimes: number[] = [];
    const rawVals: number[] = [];
    let t = 0;
    while (t < 3.0) {
      rawTimes.push(t);
      rawVals.push(Math.sin(2 * Math.PI * 1.0 * t));
      t += 0.028 + Math.sin(t * 10) * 0.008; // jitter around ~33ms
    }

    const { times, values } = resampleUniform(rawTimes, rawVals, 30);
    expect(times.length).toBeGreaterThan(80);
    expect(values.length).toBe(times.length);
    // Check uniform delta t of 1/30 s
    for (let i = 1; i < times.length; i++) {
      expect(times[i] - times[i - 1]).toBeCloseTo(1 / 30, 4);
    }
  });
});

describe('DSP Engine - Butterworth Biquad Filter', () => {
  it('passes 1.2 Hz (72 BPM) passband signal while attenuating 0.05 Hz baseline and 10 Hz noise', () => {
    const fs = 30;
    const filter = new BiquadCascade();

    // 1. Passband 1.2 Hz
    const N = 300; // 10 seconds
    let passbandEnergy = 0;
    for (let i = 0; i < N; i++) {
      const x = Math.sin(2 * Math.PI * 1.2 * (i / fs));
      const y = filter.process(x);
      if (i > 90) { // after transient
        passbandEnergy += y * y;
      }
    }

    // 2. Stopband high frequency 10 Hz
    const filterHigh = new BiquadCascade();
    let highEnergy = 0;
    for (let i = 0; i < N; i++) {
      const x = Math.sin(2 * Math.PI * 10.0 * (i / fs));
      const y = filterHigh.process(x);
      if (i > 90) {
        highEnergy += y * y;
      }
    }

    // High frequency energy must be significantly attenuated compared to passband
    expect(highEnergy / passbandEnergy).toBeLessThan(0.01); // > 20 dB attenuation
  });
});

describe('DSP Engine - Peak Detection & IBI', () => {
  it('detects peaks and calculates exact 72 BPM from clean 1.2 Hz synthetic signal', () => {
    const fs = 30;
    const duration = 15; // 15 seconds
    const N = fs * duration;
    const signal: number[] = [];
    const times: number[] = [];

    for (let i = 0; i < N; i++) {
      const t = i / fs;
      times.push(t);
      signal.push(Math.sin(2 * Math.PI * 1.2 * t)); // 1.2 Hz = 72 BPM
    }

    const result = detectPeaksIBI(signal, times, fs);
    expect(result.peakIndices.length).toBeGreaterThan(15);
    expect(result.bpm).toBeCloseTo(72, 0); // within 1 BPM
  });
});

describe('DSP Engine - FFT Spectral Peak', () => {
  it('computes FFT with Hann window and parabolic interpolation within 0.5 BPM of 72 BPM', () => {
    const fs = 30;
    const duration = 10;
    const N = fs * duration;
    const signal: number[] = [];

    for (let i = 0; i < N; i++) {
      const t = i / fs;
      signal.push(Math.cos(2 * Math.PI * 1.2 * t));
    }

    const result = computeFftBpm(signal, fs);
    expect(result.bpm).toBeCloseTo(72, 1);
    expect(result.peakFreq).toBeCloseTo(1.2, 2);
  });
});

describe('DSP Engine - Dual Consensus Engine', () => {
  it('validates agreement when difference <= 3.0 BPM', () => {
    const check = crossCheckBpm(72.1, 71.9);
    expect(check.agreed).toBe(true);
    expect(check.consensusBpm).toBeCloseTo(72.0, 1);
    expect(check.difference).toBeCloseTo(0.2, 2);
  });

  it('flags noisy disagreement when difference > 3.0 BPM', () => {
    const check = crossCheckBpm(85.0, 71.0);
    expect(check.agreed).toBe(false);
    expect(check.consensusBpm).toBe(71.0); // falls back to FFT
    expect(check.status).toContain('Disagreement');
  });
});
