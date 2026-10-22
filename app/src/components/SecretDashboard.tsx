import React, { useRef } from 'react';
import type { ConsensusResult } from '../dsp/agreement';

interface SecretDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  consensus: ConsensusResult | null;
  onUploadFile: (file: File) => void;
  onRunBenchmark: (bpm: number) => void;
}

export const SecretDashboard: React.FC<SecretDashboardProps> = ({
  isOpen,
  onClose,
  consensus,
  onUploadFile,
  onRunBenchmark
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(17, 17, 17, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-hairline)',
          borderRadius: '6px',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '2rem',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-arterial)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              ● TEACHER EVALUATION WORKBENCH
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px' }}>
              Digital Signal Processing Inspector
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--ink-primary)',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 0.95rem',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Inspector &times;
          </button>
        </div>

        {/* Diagnostic Parameter Grid */}
        <div
          style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '4px',
            padding: '1.2rem',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.8rem' }}>
            Diagnostic Signal Metrics
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
            <div>
              <strong>Uniform Sampling:</strong> 30.00 Hz<br />
              <strong>Memory Footprint:</strong> 4 floats (Flat O(1))<br />
              <strong>Transient Discard:</strong> 60 samples (2.0s)
            </div>
            <div>
              <strong>Time-Domain (IBI):</strong> {consensus ? `${consensus.bpmTime} BPM` : '0.0 BPM'}<br />
              <strong>Spectral FFT Peak:</strong> {consensus ? `${consensus.bpmFreq} BPM` : '0.0 BPM'}<br />
              <strong>Delta (|Time - FFT|):</strong> {consensus ? `${consensus.difference} BPM` : '0.0 BPM'}
            </div>
            <div>
              <strong>Agreement Rule:</strong> Δ &le; 3.0 BPM<br />
              <strong>Engine Status:</strong> {consensus?.agreed ? 'Verified Clean' : 'Noisy / Refining'}<br />
              <strong>Biquad Structure:</strong> Direct Form II SOS
            </div>
          </div>
        </div>

        {/* Pre-recorded Fingertip Video Uploader */}
        <div
          style={{
            border: '1.5px dashed var(--border-hairline)',
            borderRadius: '4px',
            padding: '1.8rem',
            textAlign: 'center',
            background: 'var(--bg-subtle)',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            Pre-Recorded Fingertip Video Stream
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', marginBottom: '1.2rem', maxWidth: '480px', margin: '0 auto 1.2rem auto' }}>
            Upload an MP4 or WebM video of a steady fingertip illuminated with flashlight to execute the full client-side DSP pipeline without webcam noise.
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onUploadFile(e.target.files[0]);
                onClose();
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'var(--ink-primary)',
              color: '#ffffff',
              border: 'none',
              padding: '0.7rem 1.4rem',
              borderRadius: '4px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Select Video File (.mp4 / .webm)
          </button>
        </div>

        {/* Rapid Benchmark Tests */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.2rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.6rem' }}>
            Synthetic ECE Benchmark Generators
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Athletic Benchmark (54 BPM)', bpm: 54 },
              { label: 'Normal Resting (72 BPM)', bpm: 72 },
              { label: 'Elevated Test (108 BPM)', bpm: 108 }
            ].map((bench) => (
              <button
                key={bench.bpm}
                onClick={() => {
                  onRunBenchmark(bench.bpm);
                  onClose();
                }}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-hairline)',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '4px',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {bench.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
