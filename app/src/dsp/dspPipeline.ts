import { resampleUniform } from './resampling';
import { BiquadCascade } from './biquad';
import { detectPeaksIBI } from './peakDetection';
import { computeFftBpm } from './fft';
import { crossCheckBpm, type ConsensusResult } from './agreement';

export type OpticalChannel = 'green' | 'red' | 'blue' | 'rgb';

export interface DspState {
  rawBuffer: { time: number; val: number }[];
  biquad: BiquadCascade;
  filteredBuffer: number[];
  consensus: ConsensusResult;
  lastBpm: number;
  fftSpectrum: { freqs: number[]; mags: number[]; peakFreq: number };
  peakIndices: number[];
  fs: number;
  windowSeconds: number;
}

export class DspPipeline {
  private rawTimes: number[] = [];
  private rawVals: number[] = [];
  private biquad = new BiquadCascade();
  private maxSamples: number;
  private fs = 30;

  constructor(windowSeconds = 30, fs = 30) {
    this.fs = fs;
    this.maxSamples = windowSeconds * fs;
  }

  reset(): void {
    this.rawTimes = [];
    this.rawVals = [];
    this.biquad.reset();
  }

  addSample(timestamp: number, r: number, g: number, b: number, channel: OpticalChannel = 'green'): {
    rawVal: number;
    filteredVal: number;
  } {
    let chosenVal = g;
    if (channel === 'red') chosenVal = r;
    else if (channel === 'blue') chosenVal = b;
    else if (channel === 'rgb') chosenVal = (r + g + b) / 3;

    this.rawTimes.push(timestamp);
    this.rawVals.push(chosenVal);

    if (this.rawTimes.length > this.maxSamples) {
      this.rawTimes.shift();
      this.rawVals.shift();
    }

    const filteredVal = this.biquad.process(chosenVal);
    return { rawVal: chosenVal, filteredVal };
  }

  computeFullAnalysis(): {
    resampledTimes: number[];
    filteredSignal: number[];
    rawDetrended: number[];
    consensus: ConsensusResult;
    peakIndices: number[];
    fft: { freqs: number[]; magnitudes: number[]; peakFreq: number; bpm: number };
  } {
    if (this.rawTimes.length < 45) {
      return {
        resampledTimes: [],
        filteredSignal: [],
        rawDetrended: [],
        consensus: crossCheckBpm(0, 0),
        peakIndices: [],
        fft: { freqs: [], magnitudes: [], peakFreq: 0, bpm: 0 }
      };
    }

    // 1. Resample to uniform 30 Hz
    const { times, values } = resampleUniform(this.rawTimes, this.rawVals, this.fs);

    // 2. DC Detrend (Moving average subtraction)
    const m = Math.min(15, Math.floor(times.length / 4));
    const rawDetrended: number[] = new Array(values.length);
    for (let i = 0; i < values.length; i++) {
      let localSum = 0;
      let count = 0;
      for (let j = Math.max(0, i - m); j <= Math.min(values.length - 1, i + m); j++) {
        localSum += values[j];
        count++;
      }
      rawDetrended[i] = values[i] - localSum / count;
    }

    // 3. 4th-Order Butterworth bandpass
    const filteredSignal = this.biquad.processArray(rawDetrended);

    // Discard initial 3.0 seconds (90 samples) filter transient if buffer is long enough
    const transientCutoff = times.length > 120 ? 60 : 0;
    const cleanSignal = filteredSignal.slice(transientCutoff);
    const cleanTimes = times.slice(transientCutoff);

    // 4. Method A: Peak detection
    const peakRes = detectPeaksIBI(cleanSignal, cleanTimes, this.fs);

    // 5. Method B: FFT spectral peak
    const fftRes = computeFftBpm(cleanSignal, this.fs, 4096);

    // 6. Dual consensus
    const consensus = crossCheckBpm(peakRes.bpm, fftRes.bpm);

    return {
      resampledTimes: cleanTimes,
      filteredSignal: cleanSignal,
      rawDetrended: rawDetrended.slice(transientCutoff),
      consensus,
      peakIndices: peakRes.peakIndices,
      fft: {
        freqs: fftRes.freqs,
        magnitudes: fftRes.magnitudes,
        peakFreq: fftRes.peakFreq,
        bpm: fftRes.bpm
      }
    };
  }
}
