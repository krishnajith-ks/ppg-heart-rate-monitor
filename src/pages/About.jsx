// src/pages/About.jsx - Project theory, pipeline explanation, and viva reference
import React from 'react';

export default function About() {
  return (
    <div className="main-content">
      <div className="card">
        <h2 className="card-title" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
          About the Project
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
          This project was developed for an academic Digital Signal Processing (DSP) curriculum by Krishnajith KS (3rd-year ECE student). It demonstrates real-time discrete-time signal processing running entirely in the client-side browser without external DSP or charting packages.
        </p>
      </div>

      <div className="card">
        <h3 className="card-title">How Photoplethysmography (PPG) Works</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          With each cardiac cycle, the heart pumps blood into peripheral capillaries (systole), causing tissue volume and optical absorption to increase slightly. Between beats (diastole), absorption decreases.
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          The phone's camera illuminates the fingertip with the rear flash and measures these subtle intensity fluctuations over time.
        </p>
      </div>

      <div className="card">
        <h3 className="card-title">Core DSP Pipeline</h3>
        <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li><strong>Frame Sampling:</strong> 64x64 offscreen canvas averages green channel intensity per frame at ~30 fps ($x[n]$).</li>
          <li><strong>Uniform Resampling:</strong> Linear interpolation aligns jittered frame timestamps onto an exact 30 Hz grid.</li>
          <li><strong>Detrending:</strong> Moving-average subtraction removes baseline DC offset and respiratory respiration drift.</li>
          <li><strong>Butterworth Band-pass:</strong> Cascaded 2nd-order high-pass (0.5 Hz) and 2nd-order low-pass (4.0 Hz) biquads isolate human pulse (30–240 BPM).</li>
          <li><strong>Dual Estimation:</strong> Time-domain peak detection and 2048-point Radix-2 FFT spectrum are compared for confidence.</li>
        </ol>
      </div>

      <div className="disclaimer-banner">
        Disclaimer: This application provides an educational estimation and is not a medical device.
      </div>
    </div>
  );
}
