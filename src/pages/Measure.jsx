// src/pages/Measure.jsx - Main heart rate measurement page (Milestone 1 baseline)
import React, { useState, useEffect } from 'react';

export default function Measure() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    // Detect mobile or touch device per GUIDE.md section 12
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasTouch = navigator.maxTouchPoints > 0;
    setIsMobile(hasCoarsePointer || hasTouch);
  }, []);

  return (
    <div className="main-content">
      <div className="disclaimer-banner">
        Educational DSP Demonstration • Not a Medical Device
      </div>

      {!isMobile && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <h2 className="card-title">Desktop / Laptop Detected</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Live fingertip camera measurement runs on phones. Open this site on your mobile phone with a rear camera and flashlight to measure your pulse.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Tip: You can also use the video upload demo mode in the Admin Panel to test on a laptop.
          </p>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">
          <span>Heart Rate Measurement</span>
          <span className="badge badge-yellow">Milestone 1 Ready</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '1rem' }}>
          Place your fingertip over the phone's rear camera and flashlight to capture PPG pulse waveforms.
        </p>

        <button className="button-primary" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
          Start Measurement (Ready for M2/M3)
        </button>
      </div>

      <div className="card">
        <h3 className="card-title">Live Waveform Display (Canvas)</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Real-time raw PPG signal, 0.5–4.0 Hz Butterworth filtered waveform, and Radix-2 FFT spectrum will render here.
        </p>
      </div>
    </div>
  );
}
