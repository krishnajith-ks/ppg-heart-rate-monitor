// src/pages/Measure.jsx - Milestone 3: Camera capture, 64x64 frame sampling, and live sensor debug view
import React, { useState, useEffect, useRef } from 'react';
import { CameraSession } from '../camera/cameraSession.js';
import { FrameSampler } from '../camera/frameSampler.js';
import { RingBuffer } from '../dsp/ringBuffer.js';
import { CONFIG } from '../config.js';

export function Measure() {
  const [isMobile, setIsMobile] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [torchActive, setTorchActive] = useState(false);

  // Low-frequency UI state (updated ~1-2x/second only, per GUIDE.md Section 11 Rule 2)
  const [debugStats, setDebugStats] = useState({
    fps: 0,
    meanR: 0,
    meanG: 0,
    meanB: 0,
    rgRatio: 0,
    hasFinger: false,
    sampleCount: 0
  });

  const videoRef = useRef(null);
  const cameraSessionRef = useRef(null);
  const frameSamplerRef = useRef(null);

  // High-frequency mutable storage (NEVER put per-frame samples into React state)
  const ringBufferRef = useRef(new RingBuffer(CONFIG.SAMPLING.BUFFER_SIZE));
  const latestFrameStatsRef = useRef({
    r: 0,
    g: 0,
    b: 0,
    hasFinger: false
  });

  useEffect(() => {
    // Detect mobile device per GUIDE.md Section 12
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasTouch = navigator.maxTouchPoints > 0;
    setIsMobile(hasCoarsePointer || hasTouch);

    cameraSessionRef.current = new CameraSession();

    // Low-frequency interval (1 Hz) to update UI debug numbers without re-rendering per frame
    const intervalId = setInterval(() => {
      if (ringBufferRef.current && ringBufferRef.current.size() > 2) {
        const samples = ringBufferRef.current.toArray();
        const n = samples.t.length;
        const duration = samples.t[n - 1] - samples.t[0];
        const fps = duration > 0 ? (n - 1) / duration : 0;
        const latest = latestFrameStatsRef.current;

        setDebugStats({
          fps: Number(fps.toFixed(1)),
          meanR: Number(latest.r.toFixed(1)),
          meanG: Number(latest.g.toFixed(1)),
          meanB: Number(latest.b.toFixed(1)),
          rgRatio: latest.g > 0 ? Number((latest.r / latest.g).toFixed(2)) : 0,
          hasFinger: latest.hasFinger,
          sampleCount: n
        });
      }
    }, 500);

    return () => {
      clearInterval(intervalId);
      // Clean up on component unmount
      if (frameSamplerRef.current) frameSamplerRef.current.stop();
      if (cameraSessionRef.current) cameraSessionRef.current.stop();
    };
  }, []);

  const handleStartCamera = async () => {
    setErrorMessage(null);
    ringBufferRef.current.clear();

    try {
      const { stream, hasTorch } = await cameraSessionRef.current.start();
      setTorchActive(hasTorch);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // Initialize frame sampler on video element
        frameSamplerRef.current = new FrameSampler(videoRef.current, (frame) => {
          // Store green channel brightness in ring buffer with timestamp
          ringBufferRef.current.push(frame.t, frame.g);

          // Update latest frame stats ref (no React re-render here!)
          latestFrameStatsRef.current = {
            r: frame.r,
            g: frame.g,
            b: frame.b,
            hasFinger: frame.hasFinger
          };
        });

        frameSamplerRef.current.start();
        setIsCapturing(true);
      }
    } catch (err) {
      console.error('Camera start error:', err);
      setErrorMessage(err.message || 'Failed to start camera.');
      setIsCapturing(false);
    }
  };

  const handleStopCamera = () => {
    if (frameSamplerRef.current) {
      frameSamplerRef.current.stop();
      frameSamplerRef.current = null;
    }
    if (cameraSessionRef.current) {
      cameraSessionRef.current.stop();
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
    setTorchActive(false);
  };

  return (
    <div className="main-content">
      <div className="disclaimer-banner">
        Educational DSP Demonstration • Not a Medical Device
      </div>

      {!isMobile && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <h2 className="card-title">Desktop / Laptop Detected</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Live fingertip camera measurement works on phones. Open this site on your mobile phone to measure your pulse.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Desktop note: You can still use the camera debug controls below if a webcam is available, or use the video upload demo mode in the Admin Panel.
          </p>
        </div>
      )}

      {/* Error banner */}
      {errorMessage && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-pulse)' }}>
          <h3 className="card-title" style={{ color: 'var(--accent-pulse)' }}>Camera Access Error</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{errorMessage}</p>
          {!window.isSecureContext && (
            <p style={{ color: 'var(--accent-yellow)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              ⚠️ Camera access requires HTTPS. If testing on a phone over local Wi-Fi, run an HTTPS tunnel (e.g. ngrok or Vercel preview).
            </p>
          )}
        </div>
      )}

      {/* Camera Session & Controls Card */}
      <div className="card">
        <h2 className="card-title">
          <span>Camera Capture (Milestone 3)</span>
          <span className={`badge ${isCapturing ? 'badge-green' : 'badge-yellow'}`}>
            {isCapturing ? 'Stream Active' : 'Idle'}
          </span>
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1.25rem' }}>
          {isCapturing
            ? 'Cover the rear camera lens and flashlight firmly with your fingertip.'
            : 'Press Start Camera to request camera access, engage the torch, and begin sampling.'}
        </p>

        {/* Video feed element (muted, playsInline) */}
        <div style={{ display: isCapturing ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{
              width: '180px',
              height: '135px',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--border-subtle)',
              objectFit: 'cover',
              backgroundColor: '#000'
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Rear Stream (640×480 downsampled to 64×64 offscreen)
          </span>
        </div>

        {/* Controls */}
        {!isCapturing ? (
          <button className="button-primary" onClick={handleStartCamera}>
            Start Camera
          </button>
        ) : (
          <button
            className="button-primary"
            style={{ backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
            onClick={handleStopCamera}
          >
            Stop Camera
          </button>
        )}
      </div>

      {/* Sensor & Frame Diagnostics Card */}
      {isCapturing && (
        <div className="card">
          <h3 className="card-title">Live Sensor & Frame Diagnostics</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Finger Detected</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: debugStats.hasFinger ? 'var(--accent-green)' : 'var(--accent-pulse)' }}>
                {debugStats.hasFinger ? '✓ YES' : '✗ NO FINGER'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Measured Frame Rate</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: debugStats.fps >= 24 ? 'var(--accent-cyan)' : 'var(--accent-yellow)' }}>
                {debugStats.fps} Hz
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mean Red (Tissue)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-pulse)' }}>
                {debugStats.meanR} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 255</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mean Green (Pulse)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-green)' }}>
                {debugStats.meanG} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ 255</span>
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Red / Green Ratio</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: debugStats.rgRatio >= 1.15 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                {debugStats.rgRatio}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Flashlight (Torch)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: torchActive ? 'var(--accent-yellow)' : 'var(--text-muted)' }}>
                {torchActive ? 'Active' : 'Unavailable (iOS/No flash)'}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Stored Samples in Float32Array: <strong>{debugStats.sampleCount}</strong> / {CONFIG.SAMPLING.BUFFER_SIZE}
          </div>
        </div>
      )}
    </div>
  );
}

export default Measure;
