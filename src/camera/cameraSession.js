// src/camera/cameraSession.js
// Smartphone rear camera stream acquisition, torch (flashlight) control, and lifecycle management.
//
// Why this exists:
// PPG requires the phone's rear camera (facingMode: 'environment') pressed against the fingertip.
// The rear flashlight illuminates tissue so subtle capillary pulsations can be detected.
//
// Key Viva Concepts:
// 1. Insecure Contexts: Browsers strictly forbid camera access on plain HTTP (except localhost).
// 2. iOS Safari Torch Limitation: WebKit on iOS does not support the 'torch' constraint.
//    We attempt torch activation in a try-catch block and gracefully proceed if unsupported.
// 3. Complete Track Release: Calling track.stop() on EVERY track ensures the camera hardware
//    and flashlight immediately turn off, preserving battery and respecting user privacy.

export class CameraSession {
  constructor() {
    this.stream = null;
    this.videoTrack = null;
    this.hasTorch = false;
  }

  /**
   * Requests rear camera access and attempts to activate the flashlight.
   * @returns {Promise<{ stream: MediaStream, hasTorch: boolean }>}
   */
  async start() {
    // 1. Check for secure context
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      throw new Error('Camera access requires HTTPS or localhost.');
    }

    // 2. Check for MediaDevices API availability
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser does not support camera streaming (getUserMedia).');
    }

    // 3. Request rear camera with 640x480 at 30 fps
    // We intentionally request low resolution to minimize memory bandwidth and CPU load
    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30 }
      }
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('No camera found on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        throw new Error('Camera is currently in use by another application.');
      } else {
        throw new Error(`Failed to access camera: ${err.message || err.name}`);
      }
    }

    // Extract the active video track
    const tracks = this.stream.getVideoTracks();
    if (tracks.length === 0) {
      throw new Error('No video track returned by camera stream.');
    }
    this.videoTrack = tracks[0];

    // 4. Attempt to activate flashlight/torch (supported on Android Chrome; fails safely on iOS)
    try {
      const capabilities = this.videoTrack.getCapabilities ? this.videoTrack.getCapabilities() : {};
      if (capabilities.torch) {
        await this.videoTrack.applyConstraints({
          advanced: [{ torch: true }]
        });
        this.hasTorch = true;
      } else {
        this.hasTorch = false;
      }
    } catch (torchErr) {
      // Torch constraint failed (e.g. iOS Safari) - proceed without torch
      console.warn('Torch activation not supported on this device/browser:', torchErr);
      this.hasTorch = false;
    }

    return {
      stream: this.stream,
      hasTorch: this.hasTorch
    };
  }

  /**
   * Stops all camera tracks and releases hardware.
   */
  stop() {
    if (this.stream) {
      const tracks = this.stream.getTracks();
      for (const track of tracks) {
        track.stop();
      }
      this.stream = null;
      this.videoTrack = null;
      this.hasTorch = false;
    }
  }

  /**
   * Returns current active stream.
   */
  getStream() {
    return this.stream;
  }
}
