// src/dsp/resample.js
// Uniform grid linear resampling.
//
// Why this exists:
// Camera frames in web browsers arrive with minor timing jitter (e.g. 33 ms, 31 ms, 36 ms).
// However, digital filtering (difference equations) and the Fast Fourier Transform (FFT)
// assume a strictly uniform discrete-time grid x[n] with a constant sampling interval Ts = 1/fs.
// This function performs 1-D linear interpolation to resample the raw non-uniform signal
// onto an exact uniform time grid at targetFs (default 30 Hz).

/**
 * Resamples non-uniform timestamped data onto an exact uniform time grid.
 * @param {Float32Array|Array<number>} tIn - Array of timestamps in seconds (strictly increasing)
 * @param {Float32Array|Array<number>} vIn - Array of signal amplitudes
 * @param {number} targetFs - Desired uniform sampling frequency (Hz), typically 30 Hz
 * @returns {{ tUniform: Float64Array, vUniform: Float64Array, fs: number }}
 */
export function resampleToUniform(tIn, vIn, targetFs = 30) {
  const nIn = tIn.length;
  if (nIn < 2) {
    return {
      tUniform: new Float64Array(0),
      vUniform: new Float64Array(0),
      fs: targetFs
    };
  }

  const tStart = tIn[0];
  const tEnd = tIn[nIn - 1];
  const duration = tEnd - tStart;

  if (duration <= 0) {
    return {
      tUniform: new Float64Array(0),
      vUniform: new Float64Array(0),
      fs: targetFs
    };
  }

  // Calculate number of uniform intervals
  const dt = 1.0 / targetFs;
  const numUniformSamples = Math.floor(duration / dt) + 1;
  const tUniform = new Float64Array(numUniformSamples);
  const vUniform = new Float64Array(numUniformSamples);

  let inIdx = 0;

  for (let k = 0; k < numUniformSamples; k++) {
    const tTarget = tStart + k * dt;
    tUniform[k] = tTarget;

    // Advance input index until tTarget is bracketed by tIn[inIdx] and tIn[inIdx + 1]
    while (inIdx < nIn - 2 && tIn[inIdx + 1] < tTarget) {
      inIdx++;
    }

    const t0 = tIn[inIdx];
    const t1 = tIn[inIdx + 1];
    const v0 = vIn[inIdx];
    const v1 = vIn[inIdx + 1];

    if (t1 === t0) {
      vUniform[k] = v0;
    } else {
      // Linear interpolation formula: v = v0 + (tTarget - t0) * (v1 - v0) / (t1 - t0)
      const fraction = (tTarget - t0) / (t1 - t0);
      vUniform[k] = v0 + fraction * (v1 - v0);
    }
  }

  return { tUniform, vUniform, fs: targetFs };
}
