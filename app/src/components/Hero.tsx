import React, { useRef } from 'react';
import { PulseBadge } from './PulseBadge';
import type { ConsensusResult } from '../dsp/agreement';

interface HeroProps {
  currentBpm: number;
  isCapturing: boolean;
  consensus: ConsensusResult | null;
  torchSupported: boolean;
  torchActive: boolean;
  onStartCamera: () => void;
  onStopCapture: () => void;
  onToggleTorch: () => void;
  onUploadFile: (file: File) => void;
  onStartSimulation: (bpm?: number) => void;
}

export const Hero: React.FC<HeroProps> = ({
  currentBpm,
  isCapturing,
  consensus,
  torchSupported,
  torchActive,
  onStartCamera,
  onStopCapture,
  onToggleTorch,
  onUploadFile,
  onStartSimulation
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <section
      id="hero"
      style={{
        display: 'grid',
        gridTemplateColumns: '1.618fr 1fr',
        gap: '3.5rem',
        alignItems: 'center',
        padding: '3rem 0 4rem 0',
        borderBottom: '1px solid var(--border-hairline)'
      }}
    >
      <div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            fontWeight: 800,
            textTransform: 'uppercase',
            color: 'var(--accent-arterial)',
            marginBottom: '0.8rem'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent-arterial)'
            }}
          />
          CLIENT-SIDE BIOPHOTONICS
        </div>

        <h1
          style={{
            fontSize: '3.2rem',
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.035em',
            marginBottom: '1.2rem',
            color: 'var(--ink-primary)'
          }}
        >
          Pulse from pixels.<br />Toss the sensor.
        </h1>

        <p
          style={{
            fontSize: '1.05rem',
            color: 'var(--ink-secondary)',
            lineHeight: 1.55,
            maxWidth: '540px',
            marginBottom: '2.2rem'
          }}
        >
          Cardiovascular frequency estimation directly from smartphone video frames. Powered by spatial pixel averaging, 4th-order causal Butterworth filtering, and dual-engine FFT peak localization.
        </p>

        {/* Action Button Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
          {!isCapturing ? (
            <button
              onClick={onStartCamera}
              style={{
                background: 'var(--ink-primary)',
                color: '#ffffff',
                padding: '0.85rem 1.8rem',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: '1px solid var(--ink-primary)',
                cursor: 'pointer',
                transition: 'opacity 0.15s'
              }}
            >
              Start Camera &rarr;
            </button>
          ) : (
            <button
              onClick={onStopCapture}
              style={{
                background: 'var(--accent-arterial)',
                color: '#ffffff',
                padding: '0.85rem 1.8rem',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '0.88rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Stop Monitoring &#9632;
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onUploadFile(e.target.files[0]);
              }
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'transparent',
              color: 'var(--ink-primary)',
              border: '1px solid var(--ink-primary)',
              padding: '0.85rem 1.6rem',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Upload Video
          </button>

          <button
            onClick={() => onStartSimulation(75)}
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--ink-secondary)',
              border: '1px solid var(--border-hairline)',
              padding: '0.85rem 1.4rem',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Demo Simulation
          </button>

          {torchSupported && isCapturing && (
            <button
              onClick={onToggleTorch}
              style={{
                background: torchActive ? 'var(--accent-arterial)' : 'var(--bg-surface)',
                color: torchActive ? '#ffffff' : 'var(--ink-primary)',
                border: '1px solid var(--border-hairline)',
                padding: '0.85rem 1.2rem',
                borderRadius: '4px',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Torch {torchActive ? 'ON' : 'OFF'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <PulseBadge
          bpm={currentBpm}
          isCapturing={isCapturing}
          consensus={consensus}
        />
      </div>
    </section>
  );
};
