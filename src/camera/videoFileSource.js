// src/camera/videoFileSource.js
// Video file playback source for demo mode (laptop presentations without live camera).
//
// Key rules per GUIDE.md Section 7.3 item 5:
// 1. Zero server upload: File loaded strictly via in-memory object URL (URL.createObjectURL).
// 2. Plays at 1x real-time speed.
// 3. Reads frames via requestVideoFrameCallback (using mediaTime as timestamp).
// 4. Feeds frames directly into the SAME frameSampler and SAME dspEngine as live camera.
// 5. Cleans up and revokes object URL on Clear or page unload.

export class VideoFileSource {
  constructor(videoElement, onFrameCallback) {
    this.video = videoElement;
    this.onFrame = onFrameCallback;
    this.objectUrl = null;
    this.isPlaying = false;
    this.callbackId = null;
    this.useVideoFrameCallback = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
  }

  /**
   * Loads a local video File into the video player via transient object URL.
   * @param {File} file - User-selected video file (mp4, webm, mov)
   * @returns {Promise<{ duration: number, url: string }>}
   */
  loadFile(file) {
    this.clear(); // Revoke any previously loaded file

    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('video/')) {
        reject(new Error('Please select a valid video file (.mp4, .webm, .mov).'));
        return;
      }

      this.objectUrl = URL.createObjectURL(file);
      this.video.src = this.objectUrl;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.playbackRate = 1.0; // Play at normal 1x speed

      const onLoadedMetadata = () => {
        this.video.removeEventListener('loadedmetadata', onLoadedMetadata);
        const duration = this.video.duration;
        if (duration < 10.0) {
          reject(new Error(`Video is too short (${duration.toFixed(1)}s). Please upload at least 10–15 seconds of fingertip video.`));
          return;
        }
        resolve({ duration, url: this.objectUrl });
      };

      const onError = () => {
        this.video.removeEventListener('error', onError);
        reject(new Error('Failed to load video file. Please ensure it is a supported video format.'));
      };

      this.video.addEventListener('loadedmetadata', onLoadedMetadata);
      this.video.addEventListener('error', onError);
    });
  }

  /**
   * Starts playing the video and sampling frames at 1x speed.
   */
  async play() {
    if (!this.objectUrl || this.isPlaying) return;
    this.video.currentTime = 0;
    await this.video.play();
    this.isPlaying = true;
    this.scheduleFrame();
  }

  /**
   * Pauses video playback.
   */
  pause() {
    this.isPlaying = false;
    this.video.pause();
    if (this.callbackId !== null) {
      if (this.useVideoFrameCallback && this.video.cancelVideoFrameCallback) {
        this.video.cancelVideoFrameCallback(this.callbackId);
      } else {
        cancelAnimationFrame(this.callbackId);
      }
      this.callbackId = null;
    }
  }

  scheduleFrame() {
    if (!this.isPlaying) return;

    if (this.useVideoFrameCallback && this.video.requestVideoFrameCallback) {
      this.callbackId = this.video.requestVideoFrameCallback((now, metadata) => {
        const t = metadata?.mediaTime ?? this.video.currentTime;
        if (this.onFrame) {
          this.onFrame(t);
        }
        if (!this.video.ended && this.isPlaying) {
          this.scheduleFrame();
        } else {
          this.isPlaying = false;
        }
      });
    } else {
      this.callbackId = requestAnimationFrame(() => {
        const t = this.video.currentTime;
        if (this.onFrame) {
          this.onFrame(t);
        }
        if (!this.video.ended && this.isPlaying) {
          this.scheduleFrame();
        } else {
          this.isPlaying = false;
        }
      });
    }
  }

  /**
   * Fully revokes the object URL and resets video source.
   */
  clear() {
    this.pause();
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    if (this.video) {
      this.video.src = '';
    }
  }

  getUrl() {
    return this.objectUrl;
  }
}
