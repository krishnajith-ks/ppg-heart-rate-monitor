// src/state/dspEngine.js
// The ONE centralized DSP engine shared across the Measure page and Admin panel.
//
// Why this exists per GUIDE.md Section 9:
// "The Measure page and the Admin Panel both read from the same dspEngine. Never duplicate DSP code."
//
// Data flow:
// 1. Camera frames -> frameSampler -> push to ringBuffer (in mutable Float32Array memory)
// 2. ~Once per second: runDspPipeline processes the ring buffer window
// 3. Produces a DSP result object containing:
//    - Latest headline BPM, peak BPM, FFT BPM, SNR, quality
//    - Uniform signals (raw, detrended, filtered, peaks, FFT spectrum) for canvas rendering
//    - Detailed intermediate calculation metrics for the Admin Panel
// 4. Graph renderers read signal buffers directly via getSignals() without React re-render overhead.

import { CONFIG } from '../config.js';
import { RingBuffer } from '../dsp/ringBuffer.js';
import { runDspPipeline } from '../dsp/pipeline.js';

export class DspEngine {
  constructor() {
    this.ringBuffer = new RingBuffer(CONFIG.SAMPLING.BUFFER_SIZE);
    this.latestResult = null;
    this.lastProcessedTime = 0;
    this.processIntervalMs = 1000; // Run pipeline once per second per Section 11 Rule 3
    this.listeners = new Set();
    this.bpmHistory = []; // Stored as array of { t: seconds, bpm: number }
    this.startTime = null;
  }

  /**
   * Resets all internal buffers and state.
   */
  reset() {
    this.ringBuffer.clear();
    this.latestResult = null;
    this.lastProcessedTime = 0;
    this.bpmHistory = [];
    this.startTime = null;
    this.notify();
  }

  /**
   * Subscribes a listener callback to pipeline update events (~1x/sec).
   * @param {function} listener
   * @returns {function} unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.latestResult);
      } catch (err) {
        console.error('DSP listener error:', err);
      }
    }
  }

  /**
   * Ingests a new frame sample from frameSampler.
   * High frequency (~30 fps). Runs synchronously without allocations.
   *
   * @param {number} t - Timestamp in seconds
   * @param {number} g - Mean green channel brightness
   * @param {boolean} hasFinger - Whether optical finger coverage was validated
   */
  addSample(t, g, hasFinger) {
    if (this.startTime === null) {
      this.startTime = t;
    }

    if (!hasFinger) {
      // If finger is removed, do not pollute the ring buffer
      return;
    }

    this.ringBuffer.push(t, g);

    // Periodically run the full pipeline once per second
    const now = performance.now();
    if (now - this.lastProcessedTime >= this.processIntervalMs) {
      this.lastProcessedTime = now;
      this.runPipeline();
    }
  }

  /**
   * Runs the complete DSP pipeline on the accumulated ring buffer window.
   */
  runPipeline() {
    if (this.ringBuffer.size() < 30) {
      // Need at least ~1 second of samples
      return;
    }

    const { t, v } = this.ringBuffer.toArray();
    const result = runDspPipeline(t, v, CONFIG.SAMPLING.TARGET_FS);

    if (result.success) {
      this.latestResult = result;

      // Track session BPM trend if valid
      if (result.metrics.headlineBpm) {
        const sessionElapsed = t[t.length - 1] - this.startTime;
        this.bpmHistory.push({
          t: Number(sessionElapsed.toFixed(1)),
          bpm: result.metrics.headlineBpm
        });

        // Limit trend history to last 60 readings
        if (this.bpmHistory.length > 60) {
          this.bpmHistory.shift();
        }
      }

      this.notify();
    }
  }

  /**
   * Directly retrieves raw and filtered signals for high-frequency Canvas rendering.
   */
  getSignals() {
    return this.latestResult?.signals ?? null;
  }

  /**
   * Directly retrieves the session BPM trend history.
   */
  getBpmHistory() {
    return this.bpmHistory;
  }

  /**
   * Retrieves the latest computed metrics.
   */
  getMetrics() {
    return this.latestResult?.metrics ?? null;
  }

  /**
   * Retrieves intermediate mathematical calculations for the Admin Panel.
   */
  getCalculations() {
    return this.latestResult?.calculations ?? null;
  }
}

// Export singleton instance shared by Measure and Admin pages
export const sharedDspEngine = new DspEngine();
