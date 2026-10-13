// src/camera/frameSampler.js
// Frame downsampling, RGB channel averaging, and optical finger detection.
//
// Why this exists:
// High-resolution video frames (e.g. 640x480 = 307,200 pixels) contain unnecessary spatial detail
// and would burn excessive CPU cycles if read at 30 fps.
// We draw each frame into a single reused 64x64 offscreen canvas (4,096 pixels) created with
// { willReadFrequently: true }, enabling fast CPU pixel readback via getImageData.
//
// Why Green Channel for Pulse?
// Oxygenated and deoxygenated hemoglobin have an absorption peak for green light (~530–570 nm).
// Variations in blood volume therefore create the largest signal-to-noise ratio in the GREEN channel.
//
// Why Red Channel for Finger Detection?
// Human skin and tissue transmit red wavelengths while absorbing green and blue.
// When a finger firmly covers the camera and flash, the image turns predominantly deep red
// (high Mean R, low Mean G & B).

import { CONFIG } from '../config.js';

export class FrameSampler {
  /**
   * @param {HTMLVideoElement} videoElement - Attached video element playing the camera stream
   * @param {function} onFrameCallback - Called each frame with { t, r, g, b, hasFinger }
   */
  constructor(videoElement, onFrameCallback) {
    this.video = videoElement;
    this.onFrame = onFrameCallback;
    this.isRunning = false;

    // Single reused offscreen canvas per GUIDE.md Section 11 Rule 4
    this.canvasSize = CONFIG.SAMPLING.CANVAS_SIZE; // 64x64
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvasSize;
    this.canvas.height = this.canvasSize;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.callbackId = null;
    this.useVideoFrameCallback = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

    // Rolling window of recent red values to test AC variance
    this.recentRedValues = [];
    this.maxRecent = 30; // ~1 second of frames at 30 fps
  }

  /**
   * Starts frame capture loop.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.recentRedValues = [];
    this.scheduleNextFrame();
  }

  /**
   * Stops frame capture and cancels scheduled callbacks.
   */
  stop() {
    this.isRunning = false;
    if (this.callbackId !== null) {
      if (this.useVideoFrameCallback && this.video.cancelVideoFrameCallback) {
        this.video.cancelVideoFrameCallback(this.callbackId);
      } else {
        cancelAnimationFrame(this.callbackId);
      }
      this.callbackId = null;
    }
  }

  scheduleNextFrame() {
    if (!this.isRunning) return;

    if (this.useVideoFrameCallback && this.video.requestVideoFrameCallback) {
      this.callbackId = this.video.requestVideoFrameCallback((now, metadata) => {
        // mediaTime provides the exact hardware presentation timestamp in seconds
        const t = metadata?.mediaTime ?? (now / 1000.0);
        this.processFrame(t);
        this.scheduleNextFrame();
      });
    } else {
      this.callbackId = requestAnimationFrame((timestamp) => {
        const t = timestamp / 1000.0;
        this.processFrame(t);
        this.scheduleNextFrame();
      });
    }
  }

  processFrame(t) {
    if (!this.isRunning || !this.video || this.video.readyState < 2) {
      return;
    }

    const size = this.canvasSize;
    // Draw current video frame downscaled onto the 64x64 canvas
    this.ctx.drawImage(this.video, 0, 0, size, size);

    // Read pixel data once
    const imgData = this.ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    const numPixels = size * size; // 4096 pixels

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;

    // Fast 1D pixel iteration: RGBA sequence [r, g, b, a, r, g, b, a, ...]
    for (let i = 0; i < data.length; i += 4) {
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
    }

    const meanR = totalR / numPixels;
    const meanG = totalG / numPixels;
    const meanB = totalB / numPixels;

    // Track variance over recent frames
    this.recentRedValues.push(meanR);
    if (this.recentRedValues.length > this.maxRecent) {
      this.recentRedValues.shift();
    }

    let variance = 0;
    if (this.recentRedValues.length > 5) {
      let rSum = 0;
      for (let i = 0; i < this.recentRedValues.length; i++) rSum += this.recentRedValues[i];
      const rMean = rSum / this.recentRedValues.length;
      let varSum = 0;
      for (let i = 0; i < this.recentRedValues.length; i++) varSum += (this.recentRedValues[i] - rMean) ** 2;
      variance = varSum / this.recentRedValues.length;
    }

    // Finger presence validation per GUIDE.md Section 6.4:
    // 1. Mean Red is high (skin tissue transmission)
    // 2. Red exceeds Green by ratio
    // 3. Not saturated at maximum 255
    // 4. Minor AC variance present (not a flat artificial red card)
    const hasFinger =
      meanR >= CONFIG.FINGER.MIN_RED_MEAN &&
      meanR / (meanG + 1e-4) >= CONFIG.FINGER.RED_GREEN_RATIO &&
      meanR <= CONFIG.FINGER.MAX_RED_SATURATION &&
      (this.recentRedValues.length <= 5 || variance >= CONFIG.FINGER.MIN_VARIANCE);

    if (this.onFrame) {
      this.onFrame({
        t,
        r: meanR,
        g: meanG,
        b: meanB,
        hasFinger,
        variance
      });
    }
  }
}
