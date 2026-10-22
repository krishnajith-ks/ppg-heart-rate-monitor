import React, { useRef } from 'react';
import type { ConsensusResult } from '../dsp/agreement';

interface LandingPageProps {
  currentBpm: number;
  isCapturing: boolean;
  consensus: ConsensusResult | null;
  onStartCamera: () => void;
  onUploadVideo: (file: File) => void;
  onSecretTriggerClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  currentBpm,
  isCapturing,
  consensus,
  onStartCamera,
  onUploadVideo,
  onSecretTriggerClick
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const displayBpm = isCapturing && currentBpm > 0 ? Math.round(currentBpm) : 72;
  const isNormal = displayBpm >= 60 && displayBpm <= 100;
  const isAthletic = displayBpm >= 40 && displayBpm < 60;
  const isElevated = displayBpm > 100;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Clean Public Header matching prototype_preview.html */}
      <header
        style={{
          background: 'rgba(245, 243, 239, 0.95)',
          borderBottom: '1px solid var(--border-hairline)',
          padding: '1.1rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--ink-primary)'
          }}
        >
          01 / PULSE MONITOR
        </div>
        <div
          style={{
            fontSize: '0.72rem',
            color: 'var(--ink-tertiary)',
            letterSpacing: '0.05em',
            fontFamily: 'var(--font-mono)'
          }}
        >
          CLIENT-SIDE BIOPHOTONICS
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          maxWidth: '1080px',
          margin: '0 auto',
          padding: '3.5rem 2rem 5rem 2rem',
          flex: 1,
          width: '100%'
        }}
      >
        {/* Section 1: Hero Grid (Golden Ratio 1.618 : 1) */}
        <section
          id="hero"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.618fr 1fr',
            gap: '3.5rem',
            alignItems: 'center',
            paddingBottom: '4rem',
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
                marginBottom: '1rem'
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
              OPTICAL VITALS
            </div>

            <h1
              style={{
                fontSize: '3.4rem',
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
                maxWidth: '520px',
                marginBottom: '2.2rem'
              }}
            >
              Accurate heart rate measurement directly through your smartphone camera. Zero hardware peripherals, zero cloud transmission, 100% private in-browser biophotonic sensing.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={onStartCamera}
                style={{
                  background: 'var(--ink-primary)',
                  color: '#ffffff',
                  padding: '0.85rem 1.8rem',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: '1px solid var(--ink-primary)',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s'
                }}
              >
                Start Camera &rarr;
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onUploadVideo(e.target.files[0]);
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
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
              >
                Upload Video
              </button>
            </div>
          </div>

          {/* Pulse Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div
              className={`pulse-disc ${isCapturing ? 'pulse-active' : ''}`}
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, var(--accent-arterial) 0%, var(--accent-arterial-deep) 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 16px 45px var(--accent-arterial-glow)',
                userSelect: 'none',
                animation: 'systolic-beat 1.25s cubic-bezier(0.21, 0.61, 0.35, 1) infinite'
              }}
            >
              <div
                style={{
                  fontSize: '3.6rem',
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: '-0.04em'
                }}
              >
                {displayBpm}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  opacity: 0.92,
                  marginTop: '6px'
                }}
              >
                BPM
              </div>
            </div>

            <div style={{ marginTop: '1.2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
                {isCapturing && consensus?.agreed
                  ? 'Dual Engines Synchronized'
                  : isCapturing
                  ? 'Refining Optical Signal...'
                  : 'Resting Pulse Detected'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                {isCapturing && consensus
                  ? `Time: ${consensus.bpmTime} BPM | FFT: ${consensus.bpmFreq} BPM`
                  : 'Normal Resting Rhythm (60–100 BPM)'}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Resting Heart Rate Categories */}
        <section style={{ padding: '3.5rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.8rem' }}>
            <div>
              <div
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-tertiary)'
                }}
              >
                PHYSIOLOGICAL BASELINE
              </div>
              <h2
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: 'var(--ink-primary)',
                  marginTop: '4px'
                }}
              >
                Resting Heart Rate Categories
              </h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>
              AHA Standard
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
            {/* Category 01 */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: isAthletic ? '2px solid var(--ink-primary)' : '1px solid var(--border-hairline)',
                borderRadius: '4px',
                padding: '1.4rem',
                position: 'relative'
              }}
            >
              {isAthletic && (
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--accent-arterial)'
                  }}
                />
              )}
              <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--ink-tertiary)', textTransform: 'uppercase' }}>
                CATEGORY 01
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, margin: '6px 0' }}>
                40–60 BPM
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
                Athletic conditioning / High vagal tone
              </div>
            </div>

            {/* Category 02 */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: isNormal ? '2px solid var(--ink-primary)' : '1px solid var(--border-hairline)',
                borderRadius: '4px',
                padding: '1.4rem',
                position: 'relative'
              }}
            >
              {isNormal && (
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--accent-arterial)'
                  }}
                />
              )}
              <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: isNormal ? 'var(--accent-arterial)' : 'var(--ink-tertiary)', textTransform: 'uppercase' }}>
                CATEGORY 02 (NORMAL)
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, margin: '6px 0' }}>
                60–100 BPM
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
                Standard adult resting physiological range
              </div>
            </div>

            {/* Category 03 */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: isElevated ? '2px solid var(--ink-primary)' : '1px solid var(--border-hairline)',
                borderRadius: '4px',
                padding: '1.4rem',
                position: 'relative'
              }}
            >
              {isElevated && (
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--accent-arterial)'
                  }}
                />
              )}
              <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--ink-tertiary)', textTransform: 'uppercase' }}>
                CATEGORY 03
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, margin: '6px 0' }}>
                &gt; 100 BPM
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
                Elevated resting rate / Post-exertion
              </div>
            </div>
          </div>
        </section>

        {/* Clean Footer with Secret Trigger */}
        <footer
          style={{
            textAlign: 'center',
            padding: '4rem 0 2rem 0',
            borderTop: '1px solid var(--border-hairline)',
            fontSize: '0.78rem',
            color: 'var(--ink-tertiary)'
          }}
        >
          <div>Camera-Based Photoplethysmography &bull; Client-Side System</div>
          <div style={{ marginTop: '8px' }}>
            <span
              onClick={onSecretTriggerClick}
              style={{
                cursor: 'pointer',
                color: 'var(--ink-secondary)',
                userSelect: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem'
              }}
            >
              Developed by Krishnajith KS
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
};
