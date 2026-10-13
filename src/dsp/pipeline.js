// src/dsp/pipeline.js
// Complete end-to-end discrete-time DSP processing pipeline.
//
// Chains:
// raw samples -> resampleToUniform -> detrend -> filterBandpassCascade -> detectPeaks & computeSpectrum -> computeSNR & evaluateAgreement
//
// Key rule:
// Returns both final results for the UI and ALL intermediate mathematical parameters
// for the Admin Panel calculations view (viva presentation).

import { CONFIG } from '../config.js';
import { resampleToUniform } from './resample.js';
import { detrend } from './detrend.js';
import { filterBandpassCascade, computeFilterFrequencyResponse } from './biquad.js';
import { detectPeaks } from './peaks.js';
import { computeSpectrum } from './fft.js';
import { computeSNR, evaluateAgreement } from './quality.js';

/**
 * Runs the complete DSP pipeline on collected raw camera samples.
 *
 * @param {Float32Array|Array<number>} timestamps - Raw frame timestamps in seconds
 * @param {Float32Array|Array<number>} rawValues - Raw mean green channel brightness values
 * @param {number} targetFs - Desired uniform sampling rate (default 30 Hz)
 * @returns {object} - Complete DSP result with all viva metrics
 */
export function runDspPipeline(timestamps, rawValues, targetFs = CONFIG.SAMPLING.TARGET_FS) {
  const nRaw = timestamps.length;
  if (nRaw < 10) {
    return {
      success: false,
      error: 'Not enough samples collected yet'
    };
  }

  const tFirst = timestamps[0];
  const tLast = timestamps[nRaw - 1];
  const durationSec = tLast - tFirst;

  if (durationSec <= 0.5) {
    return {
      success: false,
      error: 'Duration too short'
    };
  }

  // 1. Measure real average frame rate: fs = (N - 1) / duration
  const fsMeasured = (nRaw - 1) / durationSec;
  const nyquistFreq = fsMeasured / 2.0;

  // 2. Uniform linear resampling to ensure equidistant grid
  const { tUniform, vUniform } = resampleToUniform(timestamps, rawValues, targetFs);
  const nUniform = vUniform.length;

  // Compute DC statistics on the resampled raw signal
  let sumRaw = 0;
  for (let i = 0; i < nUniform; i++) sumRaw += vUniform[i];
  const dcMean = sumRaw / nUniform;

  let varRawSum = 0;
  for (let i = 0; i < nUniform; i++) varRawSum += (vUniform[i] - dcMean) ** 2;
  const rawStd = Math.sqrt(varRawSum / nUniform);

  // 3. Detrending: moving-average baseline removal and DC centering
  const detrended = detrend(vUniform, targetFs, CONFIG.DETREND.MOVING_AVG_WINDOW_SEC);

  // 4. Butterworth band-pass filter cascade (0.5 Hz high-pass + 4.0 Hz low-pass)
  const { filtered, hpCoeffs, lpCoeffs } = filterBandpassCascade(detrended, targetFs);

  // 5. Time-domain systolic peak detection
  const peakResult = detectPeaks(filtered, targetFs, {
    stdFactor: CONFIG.PEAKS.STD_THRESHOLD_FACTOR,
    minDistanceSec: CONFIG.PEAKS.MIN_DISTANCE_SEC,
    minIntervalSec: CONFIG.PEAKS.MIN_INTERVAL_SEC,
    maxIntervalSec: CONFIG.PEAKS.MAX_INTERVAL_SEC,
    minValidPeaks: CONFIG.PEAKS.MIN_VALID_PEAKS
  });

  // 6. Frequency-domain radix-2 FFT spectrum analysis
  const fftResult = computeSpectrum(filtered, targetFs, {
    fftSize: CONFIG.FFT.SIZE,
    minFreq: CONFIG.FFT.SEARCH_MIN_HZ,
    maxFreq: CONFIG.FFT.SEARCH_MAX_HZ
  });

  // 7. Signal Quality Index (SNR) and Dual-Method Agreement
  const snrResult = computeSNR(
    fftResult.frequencies,
    fftResult.magnitudes,
    fftResult.peakFreq,
    CONFIG.METRICS.SNR_BAND_HALF_WIDTH_HZ
  );

  const agreementResult = evaluateAgreement(
    peakResult.bpm,
    fftResult.bpm,
    snrResult.snr,
    CONFIG.METRICS.MAX_AGREEMENT_DIFF_BPM
  );

  // 8. Filter magnitude frequency response curve for Admin visualization
  const filterFreqResponse = computeFilterFrequencyResponse(hpCoeffs, lpCoeffs, targetFs, 120);

  // Frequency resolution delta_f = fs / N
  const deltaF = targetFs / nUniform;
  const deltaFBpm = deltaF * 60.0;

  return {
    success: true,

    // Time grids and signals for canvas graphing
    signals: {
      tUniform,
      raw: vUniform,
      detrended,
      filtered,
      peakIndices: peakResult.peakIndices,
      fftFrequencies: fftResult.frequencies,
      fftMagnitudes: fftResult.magnitudes,
      filterFreqs: filterFreqResponse.frequencies,
      filterMags: filterFreqResponse.magnitudes
    },

    // Headline measurements
    metrics: {
      headlineBpm: agreementResult.headlineBpm,
      bpmPeak: peakResult.bpm ? Number(peakResult.bpm.toFixed(1)) : null,
      bpmFFT: fftResult.bpm ? Number(fftResult.bpm.toFixed(1)) : null,
      peakFreq: Number(fftResult.peakFreq.toFixed(2)),
      agrees: agreementResult.agrees,
      diffBpm: agreementResult.diff !== null ? Number(agreementResult.diff.toFixed(1)) : null,
      confidence: agreementResult.confidence,
      qualityLabel: snrResult.qualityLabel,
      snr: Number(snrResult.snr.toFixed(2)),
      statusText: agreementResult.statusText
    },

    // Viva Calculations & Diagnostic Parameters (Admin Panel Section 7.3)
    calculations: {
      sampling: {
        rawSampleCount: nRaw,
        uniformSampleCount: nUniform,
        durationSec: Number(durationSec.toFixed(2)),
        fsMeasured: Number(fsMeasured.toFixed(1)),
        targetFs,
        nyquistFreq: Number(nyquistFreq.toFixed(1)),
        deltaFHz: Number(deltaF.toFixed(3)),
        deltaFBpm: Number(deltaFBpm.toFixed(1)),
        fftSize: CONFIG.FFT.SIZE
      },
      signalStats: {
        dcMean: Number(dcMean.toFixed(2)),
        rawStd: Number(rawStd.toFixed(3)),
        filteredStd: Number(peakResult.std.toFixed(3))
      },
      filterCoeffs: {
        hp: hpCoeffs,
        lp: lpCoeffs
      },
      timeDomain: {
        peakCount: peakResult.peakCount,
        medianIntervalSec: peakResult.medianInterval ? Number(peakResult.medianInterval.toFixed(3)) : null,
        threshold: Number(peakResult.threshold.toFixed(3)),
        formulaStr: peakResult.medianInterval 
          ? `BPM_peak = 60 / ${peakResult.medianInterval.toFixed(3)} s = ${peakResult.bpm?.toFixed(1)} BPM`
          : 'Not enough valid peaks (min 5 required)'
      },
      frequencyDomain: {
        peakFreqHz: Number(fftResult.peakFreq.toFixed(3)),
        formulaStr: fftResult.peakFreq > 0 
          ? `BPM_fft = 60 × ${fftResult.peakFreq.toFixed(3)} Hz = ${fftResult.bpm?.toFixed(1)} BPM`
          : 'No dominant peak found in 0.5–4.0 Hz'
      },
      quality: {
        snrValue: Number(snrResult.snr.toFixed(2)),
        signalPower: Number(snrResult.signalPower.toFixed(2)),
        noisePower: Number(snrResult.noisePower.toFixed(2)),
        qualityLabel: snrResult.qualityLabel
      }
    }
  };
}
