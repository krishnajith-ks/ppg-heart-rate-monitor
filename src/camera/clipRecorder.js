// src/camera/clipRecorder.js
// Temporary in-memory MediaRecorder for viva demonstration and video replay.
//
// Key rules per GUIDE.md Section 10 & Section 13:
// 1. Transient memory ONLY: Held as a single Blob/Object URL in browser RAM.
// 2. NO localStorage, NO IndexedDB, and NO download button.
// 3. DSP runs on the LIVE camera stream, NEVER on compressed recorded clips.
// 4. Object URL is strictly revoked on Discard, new measurement, or page unload.
// 5. Capped at 20 seconds at low bitrate (~1 Mbps).

export class ClipRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.blobUrl = null;
    this.blob = null;
    this.isRecording = false;
  }

  /**
   * Finds the best supported MIME type for the browser (WebM on Android/Chrome, MP4 on Safari).
   */
  static getSupportedMimeType() {
    if (typeof MediaRecorder === 'undefined') return null;

    const candidateTypes = [
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4;codecs=avc1',
      'video/mp4'
    ];

    for (const type of candidateTypes) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  }

  /**
   * Starts recording a media stream in memory.
   * @param {MediaStream} stream - Active camera stream
   */
  start(stream) {
    if (!stream || typeof MediaRecorder === 'undefined') return;

    this.discard(); // Clear any previous clip and revoke object URL
    this.recordedChunks = [];

    const mimeType = ClipRecorder.getSupportedMimeType();
    const options = {
      videoBitsPerSecond: 1000000 // Low bitrate (~1 Mbps) to stay light on memory
    };
    if (mimeType) {
      options.mimeType = mimeType;
    }

    try {
      this.mediaRecorder = new MediaRecorder(stream, options);
    } catch (err) {
      console.warn('MediaRecorder init with options failed, falling back:', err);
      try {
        this.mediaRecorder = new MediaRecorder(stream);
      } catch (fallbackErr) {
        console.error('MediaRecorder completely unsupported:', fallbackErr);
        return;
      }
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      if (this.recordedChunks.length > 0) {
        const type = this.recordedChunks[0].type || 'video/webm';
        this.blob = new Blob(this.recordedChunks, { type });
        this.blobUrl = URL.createObjectURL(this.blob);
      }
      this.isRecording = false;
    };

    this.mediaRecorder.start();
    this.isRecording = true;
  }

  /**
   * Stops recording.
   * @returns {Promise<string|null>} Resolves with the Blob object URL once finished
   */
  stop() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(this.blobUrl);
        return;
      }

      const origOnStop = this.mediaRecorder.onstop;
      this.mediaRecorder.onstop = () => {
        if (origOnStop) origOnStop();
        resolve(this.blobUrl);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Completely discards the recorded clip and revokes the Blob URL from memory.
   */
  discard() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    this.blob = null;
    this.recordedChunks = [];
    this.isRecording = false;
  }

  getBlobUrl() {
    return this.blobUrl;
  }

  hasClip() {
    return Boolean(this.blobUrl);
  }
}

// Shared singleton for holding the last captured replay clip in transient memory
export const sharedClipRecorder = new ClipRecorder();
