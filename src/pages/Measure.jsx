// src/pages/Measure.jsx - Milestone 4: Live Canvas Graphs and Dual-Method BPM Display
import React, { useState, useEffect, useRef } from 'react';
import { CameraSession } from '../camera/cameraSession.js';
import { FrameSampler } from '../camera/frameSampler.js';
import { sharedDspEngine } from '../state/dspEngine.js';
import { SignalGraph } from '../components/SignalGraph.jsx';
import { SpectrumGraph } from '../components/SpectrumGraph.jsx';
import { BpmTrendGraph } from '../components/BpmTrendGraph.jsx';
import { BpmCard } from '../components/BpmCard.jsx';

export function Measure() {
  const [isMobile, setIsMobile] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [torchActive, setTorchActive] = useState(false);

  // Low-frequency UI state (updated ~1 Hz from dspEngine listener)
  const [metrics, setMetrics] = useState(null);
  const [hasFinger, setHasFinger] = useState(false);
  const [fps, setFps] = useState(0);

  // Signal data state for graph rendering (updated ~1 Hz, plain arrays passed to canvas)
  const [graphSignals, setGraphSignals] = useState({
    tUniform: null,
    raw: null,
    filtered: null,
    peakIndices: [],
    fftFrequencies: null,
    fftMagnitudes: null,
    peakFreq: 0
  });
  const [bpmHistory, setBpmHistory] = useState([]);

  const videoRef = useRef(null);
  const cameraSessionRef = useRef(null);
  const frameSamplerRef = useRef(null);
  const lastFpsUpdateTimeRef = useRef(0);
  const frameCountRef = useRef(0);

  useEffect(() => {
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasTouch = navigator.maxTouchPoints > 0;
    setIsMobile(hasCoarsePointer || hasTouch);

    cameraSessionRef.current = new CameraSession();

    // Subscribe to dspEngine 1 Hz calculation updates
    const unsubscribe = sharedDspEngine.subscribe((result) => {
      if (result && result.success) {
        setMetrics(result.metrics);
        setGraphSignals({
          tUniform: result.signals.tUniform,
          raw: result.signals.raw,
          filtered: result.signals.filtered,
          peakIndices: result.signals.peakIndices,
          fftFrequencies: result.signals.fftFrequencies,
          fftMagnitudes: result.signals.fftMagnitudes,
          peakFreq: result.metrics.peakFreq
        });
        setBpmHistory([...sharedDspEngine.getBpmHistory()]);
      }
    });

    return () => {
      unsubscribe();
      if (frameSamplerRef.current) frameSamplerRef.current.stop();
      if (cameraSessionRef.current) cameraSessionRef.current.stop();
      sharedDspEngine.reset();
    };
  }, []);

  const handleStartCamera = async () => {
    setErrorMessage(null);
    sharedDspEngine.reset();
    frameCountRef.current = 0;
    lastFpsUpdateTimeRef.current = performance.now();

    try {
      const { stream, hasTorch } = await cameraSessionRef.current.start();
      setTorchActive(hasTorch);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        frameSamplerRef.current = new FrameSampler(videoRef.current, (frame) => {
          // Feed frame into sharedDspEngine
          sharedDspEngine.addSample(frame.t, frame.g, frame.hasFinger);

          // Track finger status (update state only on change)
          setHasFinger((prev) => (prev !== frame.hasFinger ? frame.hasFinger : prev));

          // Calculate measured fps once per second
          frameCountRef.current++;
          const now = performance.now();
          if (now - lastFpsUpdateTimeRef.current >= 1000) {
            const elapsed = (now - lastFpsUpdateTimeRef.current) / 1000.0;
            setFps(Number((frameCountRef.current / elapsed).toFixed(1)));
            frameCountRef.current = 0;
            lastFpsUpdateTimeRef.current = now;
          }
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
    sharedDspEngine.reset();
    setIsCapturing(false);
    setTorchActive(false);
    setMetrics(null);
    setHasFinger(false);
  };

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
            Live heart-rate measurement works best on phones with a rear camera and flash.
            Open this URL on your phone for real PPG capture, or test on desktop using video upload in Admin Panel.
          </p>
        </div>
      )}

      {/* Error notification */}
      {errorMessage && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-pulse)' }}>
          <h3 className="card-title" style={{ color: 'var(--accent-pulse)' }}>Camera Error</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{errorMessage}</p>
        </div>
      )}

      {/* Headline Heart Rate Card */}
      <BpmCard
        hasFinger={hasFinger}
        metrics={metrics}
        isCapturing={isCapturing}
      />

      {/* Camera Preview and Controls */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Camera & Sensor Status</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {isCapturing && (
              <span className="badge badge-green">{fps} Hz</span>
            )}
            <span className={`badge ${isCapturing ? (hasFinger ? 'badge-green' : 'badge-yellow') : 'badge-red'}`}>
              {!isCapturing ? 'Stopped' : (hasFinger ? 'Finger On' : 'No Finger')}
            </span>
          </div>
        </div>

        {/* Video feed element (muted, playsInline) */}
        <div style={{ display: isCapturing ? 'flex' : 'none', justifyContent: 'center', marginBottom: '0.75rem' }}>
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

        {!isCapturing ? (
          <button className="button-primary" onClick={handleStartCamera}>
            Start Camera Measurement
          </button>
        ) : (
          <button
            className="button-primary"
            style={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}
            onClick={handleStopCamera}
          >
            Stop Measurement
          </button>
        )}
      </div>

      {/* Live Waveform Graphs Section */}
      <div className="card">
        <h3 className="card-title">Live DSP Waveforms</h3>

        {/* 1. Filtered signal with detected systolic peaks */}
        <SignalGraph
          title="1. Band-pass Filtered Waveform (0.5–4.0 Hz Butterworth)"
          timeData={graphSignals.tUniform}
          signalData={graphSignals.filtered}
          peakIndices={graphSignals.peakIndices}
          color="#10b981"
          unitY="AC Amp"
          height={140}
        />

        {/* 2. Raw green channel intensity */}
        <SignalGraph
          title="2. Raw Green Channel Signal (scrolling uniform window)"
          timeData={graphSignals.tUniform}
          signalData={graphSignals.raw}
          color="#9ca3af"
          unitY="Intensity"
          height={110}
        />

        {/* 3. Frequency-domain FFT spectrum */}
        <SpectrumGraph
          frequencies={graphSignals.fftFrequencies}
          magnitudes={graphSignals.fftMagnitudes}
          peakFreq={graphSignals.peakFreq}
          height={140}
        />

        {/* 4. Session BPM trend */}
        <BpmTrendGraph
          history={bpmHistory}
          height={110}
        />
      </div>
    </div>
  );
}

export default Measure;
