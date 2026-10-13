// src/pages/Admin.jsx - Hidden diagnostics and viva demonstration panel
import React, { useState } from 'react';

export default function Admin() {
  const [demoToolsOpen, setDemoToolsOpen] = useState(false);

  return (
    <div className="main-content">
      <div className="card" style={{ borderColor: 'var(--accent-yellow)' }}>
        <h2 className="card-title" style={{ color: 'var(--accent-yellow)' }}>
          <span>Admin Diagnostic Panel</span>
          <span className="badge badge-yellow">Hidden Route</span>
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          This page exposes every intermediate DSP parameter, mathematical formula substitution, and diagnostic tool for viva presentation.
        </p>
      </div>

      <div className="card">
        <h3 className="card-title">Live Calculations & DSP Parameters</h3>
        <ul style={{ listStyle: 'none', color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <li>• Measured Sampling Rate: <code>fs = -- Hz (Nyquist: -- Hz)</code></li>
          <li>• FFT Spectral Resolution: <code>Δf = fs / N = -- Hz (~ -- BPM)</code></li>
          <li>• Biquad Cascade: <code>HP 0.5 Hz + LP 4.0 Hz (Butterworth Q=0.7071)</code></li>
          <li>• Time-Domain Peak Median: <code>BPM_peak = 60 / interval = -- BPM</code></li>
          <li>• Frequency-Domain Peak: <code>BPM_fft = 60 × f_peak = -- BPM</code></li>
        </ul>
      </div>

      <div className="card">
        <h3 className="card-title">Camera Feed & In-Memory Replay</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Live camera preview with Green Channel isolation toggle and synced waveform replay scrubbing will activate in Milestones 3 & 6.
        </p>
      </div>

      <div className="card">
        <div 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setDemoToolsOpen(!demoToolsOpen)}
        >
          <h3 className="card-title" style={{ margin: 0 }}>
            Demo Tools (Collapsed)
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
            {demoToolsOpen ? '▲ Hide' : '▼ Expand'}
          </span>
        </div>

        {demoToolsOpen && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Upload pre-recorded fingertip video to demonstrate the DSP pipeline without a live phone camera (activates in Milestone 6b).
            </p>
            <input type="file" accept="video/*" disabled style={{ opacity: 0.6 }} />
          </div>
        )}
      </div>
    </div>
  );
}
