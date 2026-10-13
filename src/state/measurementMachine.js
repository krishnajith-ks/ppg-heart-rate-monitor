// src/state/measurementMachine.js
// Explicit finite state machine for the PPG measurement lifecycle.
//
// States per GUIDE.md Section 8:
// - IDLE: Initial state, user taps "Start Measurement"
// - REQUESTING_CAMERA: Waiting for browser getUserMedia permission
// - WAITING_FOR_FINGER: Camera active, prompt user to cover lens + flash
// - SETTLING: Finger detected; 3 s calibration to discard filter startup transient
// - MEASURING: 12 s active recording window collecting steady pulse data
// - PAUSED_LOST: Finger lifted mid-session; timer paused up to 5 s
// - RESULT: Active recording finished; camera turns off, final BPM frozen
// - ERROR: Permission denied, no camera, or hardware error

export const STATES = {
  IDLE: 'IDLE',
  REQUESTING_CAMERA: 'REQUESTING_CAMERA',
  WAITING_FOR_FINGER: 'WAITING_FOR_FINGER',
  SETTLING: 'SETTLING',
  MEASURING: 'MEASURING',
  PAUSED_LOST: 'PAUSED_LOST',
  RESULT: 'RESULT',
  ERROR: 'ERROR'
};

export class MeasurementMachine {
  /**
   * @param {object} config - Timing thresholds
   * @param {function} onStateChange - Callback invoked when state or progress updates
   */
  constructor(config, onStateChange) {
    this.config = config;
    this.onStateChange = onStateChange;

    this.state = STATES.IDLE;
    this.errorMessage = null;

    // Timing counters in milliseconds
    this.settlingTargetMs = config.TIMING.SETTLING_MS;   // 3000 ms
    this.measuringTargetMs = config.TIMING.MEASURING_MS; // 12000 ms
    this.lostTimeoutMs = config.TIMING.FINGER_LOST_TIMEOUT_MS; // 5000 ms

    this.settlingElapsedMs = 0;
    this.measuringElapsedMs = 0;
    this.lostElapsedMs = 0;
    this.fingerPresentConsecutiveMs = 0;

    this.lastTickTime = null;
  }

  getState() {
    return this.state;
  }

  getSnapshot() {
    let progress = 0;
    let secondsRemaining = 0;

    if (this.state === STATES.SETTLING) {
      progress = Math.min(100, (this.settlingElapsedMs / this.settlingTargetMs) * 100);
      secondsRemaining = Math.max(0, Math.ceil((this.settlingTargetMs - this.settlingElapsedMs) / 1000));
    } else if (this.state === STATES.MEASURING || this.state === STATES.PAUSED_LOST) {
      progress = Math.min(100, (this.measuringElapsedMs / this.measuringTargetMs) * 100);
      secondsRemaining = Math.max(0, Math.ceil((this.measuringTargetMs - this.measuringElapsedMs) / 1000));
    }

    return {
      state: this.state,
      errorMessage: this.errorMessage,
      progress: Math.round(progress),
      secondsRemaining,
      settlingElapsedMs: this.settlingElapsedMs,
      measuringElapsedMs: this.measuringElapsedMs
    };
  }

  transition(newState, errorMessage = null) {
    this.state = newState;
    this.errorMessage = errorMessage;
    if (this.onStateChange) {
      this.onStateChange(this.getSnapshot());
    }
  }

  start() {
    this.settlingElapsedMs = 0;
    this.measuringElapsedMs = 0;
    this.lostElapsedMs = 0;
    this.fingerPresentConsecutiveMs = 0;
    this.lastTickTime = performance.now();
    this.transition(STATES.REQUESTING_CAMERA);
  }

  onCameraReady() {
    this.settlingElapsedMs = 0;
    this.measuringElapsedMs = 0;
    this.transition(STATES.WAITING_FOR_FINGER);
  }

  onError(message) {
    this.transition(STATES.ERROR, message);
  }

  reset() {
    this.settlingElapsedMs = 0;
    this.measuringElapsedMs = 0;
    this.lostElapsedMs = 0;
    this.fingerPresentConsecutiveMs = 0;
    this.lastTickTime = null;
    this.transition(STATES.IDLE);
  }

  /**
   * Called every frame with latest optical finger detection state.
   * @param {boolean} hasFinger - Whether finger coverage criteria were met
   * @param {function} onComplete - Callback executed when 12 s measurement finishes
   */
  update(hasFinger, onComplete) {
    const now = performance.now();
    const dt = this.lastTickTime ? Math.min(100, now - this.lastTickTime) : 33;
    this.lastTickTime = now;

    switch (this.state) {
      case STATES.WAITING_FOR_FINGER:
        if (hasFinger) {
          this.fingerPresentConsecutiveMs += dt;
          // Must detect finger steadily for 1 second before entering settling
          if (this.fingerPresentConsecutiveMs >= this.config.TIMING.FINGER_STABLE_MS) {
            this.settlingElapsedMs = 0;
            this.transition(STATES.SETTLING);
          }
        } else {
          this.fingerPresentConsecutiveMs = 0;
        }
        break;

      case STATES.SETTLING:
        if (!hasFinger) {
          // Lost finger during settling -> return to waiting
          this.fingerPresentConsecutiveMs = 0;
          this.settlingElapsedMs = 0;
          this.transition(STATES.WAITING_FOR_FINGER);
        } else {
          this.settlingElapsedMs += dt;
          if (this.settlingElapsedMs >= this.settlingTargetMs) {
            // Settling complete: discard these transient samples and begin measuring
            this.measuringElapsedMs = 0;
            this.transition(STATES.MEASURING);
          } else {
            this.notifyProgress();
          }
        }
        break;

      case STATES.MEASURING:
        if (!hasFinger) {
          // Pause timer when finger lifted
          this.lostElapsedMs = 0;
          this.transition(STATES.PAUSED_LOST);
        } else {
          this.measuringElapsedMs += dt;
          if (this.measuringElapsedMs >= this.measuringTargetMs) {
            // 12 seconds collected: transition to RESULT
            this.transition(STATES.RESULT);
            if (onComplete) onComplete();
          } else {
            this.notifyProgress();
          }
        }
        break;

      case STATES.PAUSED_LOST:
        if (hasFinger) {
          // Finger returned: resume measuring
          this.lostElapsedMs = 0;
          this.transition(STATES.MEASURING);
        } else {
          this.lostElapsedMs += dt;
          // If lost for more than 5 seconds, abort and return to WAITING_FOR_FINGER
          if (this.lostElapsedMs >= this.lostTimeoutMs) {
            this.measuringElapsedMs = 0;
            this.settlingElapsedMs = 0;
            this.transition(STATES.WAITING_FOR_FINGER);
          } else {
            this.notifyProgress();
          }
        }
        break;

      default:
        break;
    }
  }

  notifyProgress() {
    if (this.onStateChange) {
      this.onStateChange(this.getSnapshot());
    }
  }
}
