// src/pages/Measure.jsx - Streamlined, distraction-free Measure page matching user design
import React, { useState, useEffect, useRef } from 'react';
import { CameraSession } from '../camera/cameraSession.js';
import { FrameSampler } from '../camera/frameSampler.js';
import { sharedDspEngine } from '../state/dspEngine.js';
import { MeasurementMachine, STATES } from '../state/measurementMachine.js';
import { ProgressRing } from '../components/ProgressRing.jsx';
import { HeartbeatLoader } from '../components/HeartbeatLoader.jsx';
import { sharedClipRecorder } from '../camera/clipRecorder.js';
import { CONFIG } from '../config.js';

export function Measure() {
  const [isMobile, setIsMobile] = useState(true);
  const [sessionState, setSessionState] = useState({
    state: STATES.IDLE,
    errorMessage: null,
    progress: 0,
    secondsRemaining: 0
  });

  const [metrics, setMetrics] = useState(null);
  const [fps, setFps] = useState(0);

  const videoRef = useRef(null);
  const cameraSessionRef = useRef(null);
  const frameSamplerRef = useRef(null);
  const machineRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(0);

  useEffect(() => {
    // Detect mobile / touchscreen device
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasTouch = navigator.maxTouchPoints > 0;
    setIsMobile(hasCoarsePointer || hasTouch);

    cameraSessionRef.current = new CameraSession();
    machineRef.current = new MeasurementMachine(CONFIG, (snapshot) => {
      setSessionState(snapshot);
    });

    // Handle tab visibility change (pause measuring when backgrounded per Section 11 Rule 7)
    const handleVisibility = () => {
      if (document.hidden && machineRef.current.getState() === STATES.MEASURING) {
        machineRef.current.transition(STATES.PAUSED_LOST);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      handleStopCamera();
    };
  }, []);

  const handleStartMeasurement = async () => {
    setMetrics(null);
    sharedDspEngine.reset();
    machineRef.current.start();
    frameCountRef.current = 0;
    lastFpsTimeRef.current = performance.now();

    try {
      const { stream } = await cameraSessionRef.current.start();

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        machineRef.current.onCameraReady();

        frameSamplerRef.current = new FrameSampler(videoRef.current, (frame) => {
          // Feed samples into shared DSP engine only during MEASURING
          const currentState = machineRef.current.getState();
          if (currentState === STATES.MEASURING && frame.hasFinger) {
            sharedDspEngine.addSample(frame.t, frame.g, true);

            // Start in-memory clip recorder if not yet active
            if (!sharedClipRecorder.isRecording && cameraSessionRef.current.getStream()) {
              sharedClipRecorder.start(cameraSessionRef.current.getStream());
            }
          }

          // Advance measurement state machine
          machineRef.current.update(frame.hasFinger, () => {
            // Callback when 12 s active measurement finishes
            finishMeasurement();
          });

          // Calculate fps periodically
          frameCountRef.current++;
          const now = performance.now();
          if (now - lastFpsTimeRef.current >= 1000) {
            const elapsed = (now - lastFpsTimeRef.current) / 1000.0;
            setFps(Number((frameCountRef.current / elapsed).toFixed(1)));
            frameCountRef.current = 0;
            lastFpsTimeRef.current = now;
          }
        });

        frameSamplerRef.current.start();
      }
    } catch (err) {
      console.error('Camera start error:', err);
      machineRef.current.onError(err.message || 'Failed to start camera.');
      handleStopCamera();
    }
  };

  const finishMeasurement = async () => {
    // 1. Stop recording and preserve the 12s in-memory clip for the Admin Panel
    if (sharedClipRecorder.isRecording) {
      await sharedClipRecorder.stop();
    }

    // 2. Run final pipeline over the full 12s window to extract high-accuracy results
    sharedDspEngine.runPipeline();
    const finalMetrics = sharedDspEngine.getMetrics();
    setMetrics(finalMetrics);

    // 3. Shut down camera and torch automatically per user preference
    handleStopCamera(false);
  };

  const handleStopCamera = (resetMachine = true) => {
    if (sharedClipRecorder.isRecording) {
      sharedClipRecorder.stop();
    }
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
    if (resetMachine && machineRef.current) {
      machineRef.current.reset();
    }
  };

  const state = sessionState.state;
  const isRunning = state !== STATES.IDLE && state !== STATES.RESULT && state !== STATES.ERROR;

  return (
    <div className="main-content">
      {/* Educational disclaimer */}
      <div className="disclaimer-banner">
        Educational DSP Demonstration • Not a Medical Device
      </div>

      {/* Desktop warning if non-touch */}
      {!isMobile && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <h2 className="card-title">Desktop / Laptop Notice</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Live heart-rate measurement works best on phones with a rear camera and flash. Open this URL on your phone for real PPG capture, or test on desktop using video upload in the Admin Panel.
          </p>
        </div>
      )}

      {/* Error Card */}
      {sessionState.errorMessage && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-pulse)' }}>
          <h3 className="card-title" style={{ color: 'var(--accent-pulse)' }}>Camera Error</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{sessionState.errorMessage}</p>
        </div>
      )}

      {/* Main ESTIMATED PULSE RATE Card (Ditto attached layout) */}
      <div className="card" style={{ textAlign: 'center', padding: '1.75rem 1.25rem' }}>
        <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          ESTIMATED PULSE RATE
        </div>

        {/* Dynamic Center Display based on State Machine */}
        {state === STATES.IDLE && (
          <div style={{ margin: '1rem 0' }}>
            <div style={{ fontSize: '3.75rem', fontWeight: 800, color: 'var(--text-muted)', lineHeight: 1 }}>
              --
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-pulse)', marginTop: '0.25rem' }}>
              BPM
            </div>
            <div style={{ marginTop: '1rem' }}>
              <span className="badge badge-yellow">PRESS START CAMERA</span>
            </div>
          </div>
        )}

        {state === STATES.REQUESTING_CAMERA && (
          <div style={{ margin: '1.5rem 0' }}>
            <span className="badge badge-yellow">Requesting camera access...</span>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Please allow camera permissions in your browser.
            </p>
          </div>
        )}

        {state === STATES.WAITING_FOR_FINGER && (
          <div style={{ margin: '1.25rem 0' }}>
            <span className="badge badge-red">WAITING FOR FINGER</span>
            <p style={{ fontSize: '0.925rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.75rem' }}>
              Place your fingertip over the camera lens & flash
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Cover both completely and press gently.
            </p>
          </div>
        )}

        {state === STATES.SETTLING && (
          <div style={{ margin: '0.5rem 0' }}>
            <ProgressRing
              progress={sessionState.progress}
              secondsRemaining={sessionState.secondsRemaining}
              color="var(--accent-yellow)"
              label="Calibrating sensor & filter..."
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Discarding filter startup noise. Hold completely still.
            </p>
          </div>
        )}

        {state === STATES.MEASURING && (
          <div style={{ margin: '0.5rem 0' }}>
            <ProgressRing
              progress={sessionState.progress}
              secondsRemaining={sessionState.secondsRemaining}
              color="var(--accent-pulse)"
              label="Recording pulse wave..."
            />
            <HeartbeatLoader message="Measuring your BPM... keep your finger still" />
          </div>
        )}

        {state === STATES.PAUSED_LOST && (
          <div style={{ margin: '1.25rem 0' }}>
            <span className="badge badge-red">⚠️ FINGER LOST (PAUSED)</span>
            <p style={{ fontSize: '0.925rem', color: 'var(--accent-yellow)', fontWeight: 600, marginTop: '0.75rem' }}>
              Place your fingertip back on the lens
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Measurement paused. Timer resumes when finger is detected.
            </p>
          </div>
        )}

        {state === STATES.RESULT && metrics && (
          <div style={{ margin: '0.75rem 0' }}>
            <div style={{ fontSize: '4.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {metrics.headlineBpm ?? '--'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-pulse)', marginTop: '0.25rem' }}>
              BPM
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <span className={`badge ${metrics.agrees ? 'badge-green' : 'badge-yellow'}`}>
                {metrics.agrees ? '✓ Methods Agree' : `Δ ${metrics.diffBpm} BPM Diff`}
              </span>
              <span className={`badge ${metrics.qualityLabel === 'Good' ? 'badge-green' : 'badge-yellow'}`}>
                Quality: {metrics.qualityLabel} (SNR {metrics.snr})
              </span>
            </div>
          </div>
        )}

        {/* Dual Method Breakdown Side-by-Side (Matches screenshot) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          paddingTop: '1.25rem',
          marginTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'left'
        }}>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time Domain (Peaks)</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent-green)', marginTop: '0.25rem' }}>
              {state === STATES.RESULT && metrics?.bpmPeak ? `${metrics.bpmPeak}` : '--'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              60 / median(IBI)
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Frequency Domain (FFT)</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>
              {state === STATES.RESULT && metrics?.bpmFFT ? `${metrics.bpmFFT}` : '--'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              60 × f_peak
            </div>
          </div>
        </div>
      </div>

      {/* Camera & Sensor Status Card (Matches screenshot) */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Camera & Sensor Status</h3>
          <span className={`badge ${isRunning ? 'badge-green' : 'badge-red'}`}>
            {state === STATES.IDLE ? 'STOPPED' : state}
          </span>
        </div>

        {/* Video feed element (muted, playsInline) */}
        <div style={{ display: isRunning ? 'flex' : 'none', justifyContent: 'center', marginBottom: '1rem' }}>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{
              width: '120px',
              height: '90px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              objectFit: 'cover',
              backgroundColor: '#000'
            }}
          />
        </div>

        {/* Action Button */}
        {!isRunning ? (
          <button className="button-primary" onClick={handleStartMeasurement}>
            {state === STATES.RESULT ? 'Measure Again' : 'Start Camera Measurement'}
          </button>
        ) : (
          <button
            className="button-primary"
            style={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}
            onClick={() => handleStopCamera(true)}
          >
            Cancel Measurement
          </button>
        )}

        {isRunning && (
          <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Camera active at ~{fps} Hz
          </div>
        )}
      </div>
    </div>
  );
}

export default Measure;
