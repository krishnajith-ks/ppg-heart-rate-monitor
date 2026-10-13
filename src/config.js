// src/config.js
// Centralized configuration and tunable thresholds for the PPG DSP Pipeline.
// All values are documented and can be tuned without changing algorithm code.

export const CONFIG = {
  // Sampling specifications
  SAMPLING: {
    TARGET_FS: 30,             // Nominal camera frame rate (Hz)
    CANVAS_SIZE: 64,           // Offscreen downsampling canvas width & height (pixels)
    BUFFER_SECONDS: 15,        // Ring buffer history span in seconds
    BUFFER_SIZE: 450,          // Total ring buffer slots (15 s * 30 Hz)
    MIN_RELIABLE_FS: 20        // Below this, warn user about low camera framerate
  },

  // Finger coverage validation thresholds (evaluated on 64x64 canvas)
  FINGER: {
    MIN_RED_MEAN: 115,         // Average red channel value required to consider finger present
    RED_GREEN_RATIO: 1.15,     // Red must exceed green channel by this ratio
    MIN_VARIANCE: 0.4,         // Minimum AC variance (rejects flat static scene)
    MAX_RED_SATURATION: 254    // If red is clamped to 255 constantly, avoid sensor saturation
  },

  // State machine duration thresholds
  TIMING: {
    FINGER_STABLE_MS: 1000,    // Stable finger detection before entering settling (ms)
    SETTLING_MS: 3000,         // Settling time to discard filter startup transient (ms)
    MEASURING_MS: 12000,       // Duration of active measurement window (ms)
    FINGER_LOST_TIMEOUT_MS: 5000 // Return to WAITING_FOR_FINGER if finger absent > 5s
  },

  // Hand-crafted Butterworth biquad filter parameters
  FILTER: {
    HP_CUTOFF_HZ: 0.5,         // High-pass cutoff (0.5 Hz = 30 BPM) to eliminate DC/drift
    LP_CUTOFF_HZ: 4.0,         // Low-pass cutoff (4.0 Hz = 240 BPM) to eliminate high-freq noise
    Q: 0.7071067811865476      // Butterworth Q factor (1 / sqrt(2))
  },

  // Detrending parameters
  DETREND: {
    MOVING_AVG_WINDOW_SEC: 1.5 // Window size in seconds for moving average baseline removal
  },

  // Time-domain peak detection parameters
  PEAKS: {
    STD_THRESHOLD_FACTOR: 0.3, // Peak threshold = 0.3 * std(filtered_signal)
    MIN_DISTANCE_SEC: 0.33,    // Minimum distance between adjacent peaks (~180 BPM max)
    MIN_INTERVAL_SEC: 0.3,     // Discard intervals shorter than 0.3 s
    MAX_INTERVAL_SEC: 2.0,     // Discard intervals longer than 2.0 s
    MIN_VALID_PEAKS: 5         // Minimum beats required to calculate reliable BPM
  },

  // Frequency-domain FFT parameters
  FFT: {
    SIZE: 2048,                // Zero-padded FFT length (power of 2)
    SEARCH_MIN_HZ: 0.5,        // Search passband start (0.5 Hz = 30 BPM)
    SEARCH_MAX_HZ: 4.0         // Search passband end (4.0 Hz = 240 BPM)
  },

  // Metrics, Quality, and Agreement
  METRICS: {
    MAX_AGREEMENT_DIFF_BPM: 5.0, // |BPM_peak - BPM_fft| <= 5 BPM indicates high confidence
    SNR_BAND_HALF_WIDTH_HZ: 0.2, // Band around peak for signal power in SNR computation
    SNR_GOOD_THRESHOLD: 1.8      // SNR ratio above which signal is classified "Good"
  }
};
