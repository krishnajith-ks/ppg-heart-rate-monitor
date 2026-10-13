// src/components/BpmCard.jsx
// Main heart rate display card showing headline BPM, dual-method comparison, and agreement confidence.
//
// Key rules per GUIDE.md Section 6.9 & Section 13:
// 1. Never display a BPM when no finger is detected.
// 2. Show peak-detection BPM and FFT BPM side-by-side.
// 3. Agreement indicator (|BPM_peak - BPM_fft| <= 5 BPM -> High Confidence).
// 4. No silent clamping or doctoring of results.

import React from 'react';

export function BpmCard({
  hasFinger = false,
  metrics = null,
  isCapturing = false
}) {
  const showBpm = isCapturing && hasFinger && metrics && metrics.headlineBpm !== null;

  return (
    <div className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
        Estimated Pulse Rate
      </div>

      {/* Large Headline BPM Display */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
        <span style={{ fontSize: '3.75rem', fontWeight: 800, color: showBpm ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight: 1 }}>
          {showBpm ? metrics.headlineBpm : '--'}
        </span>
        <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-pulse)' }}>
          BPM
        </span>
      </div>

      {/* Agreement & Quality Badges */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {!isCapturing && (
          <span className="badge badge-yellow">Press Start Camera</span>
        )}

        {isCapturing && !hasFinger && (
          <span className="badge badge-red">No Finger Detected</span>
        )}

        {isCapturing && hasFinger && metrics && (
          <>
            <span className={`badge ${metrics.agrees ? 'badge-green' : 'badge-yellow'}`}>
              {metrics.agrees ? '✓ Methods Agree' : `Δ ${metrics.diffBpm} BPM Difference`}
            </span>

            <span className={`badge ${metrics.qualityLabel === 'Good' ? 'badge-green' : 'badge-yellow'}`}>
              SNR: {metrics.qualityLabel} ({metrics.snr})
            </span>

            <span className={`badge ${metrics.confidence === 'High' ? 'badge-green' : 'badge-yellow'}`}>
              Confidence: {metrics.confidence}
            </span>
          </>
        )}
      </div>

      {/* Dual Method Breakdown Side-by-Side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border-subtle)',
        textAlign: 'left'
      }}>
        <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time Domain (Peaks)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-green)' }}>
            {showBpm && metrics.bpmPeak ? `${metrics.bpmPeak} BPM` : '--'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            60 / median(IBI)
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Frequency Domain (FFT)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {showBpm && metrics.bpmFFT ? `${metrics.bpmFFT} BPM` : '--'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            60 × {showBpm && metrics.peakFreq ? `${metrics.peakFreq} Hz` : 'f_peak'}
          </div>
        </div>
      </div>

      {/* Explanatory status text */}
      {showBpm && metrics.statusText && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {metrics.statusText}
        </div>
      )}
    </div>
  );
}
