import React from 'react';
import type { OpticalChannel } from '../dsp/dspPipeline';

interface OpticalViewportProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  currentChannel: OpticalChannel;
  onSelectChannel: (channel: OpticalChannel) => void;
  isCapturing: boolean;
}

export const OpticalViewport: React.FC<OpticalViewportProps> = ({
  canvasRef,
  currentChannel,
  onSelectChannel,
  isCapturing
}) => {
  return (
    <section style={{ padding: '3.5rem 0', borderBottom: '1px solid var(--border-hairline)' }}>
      <div style={{ marginBottom: '1.6rem' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.18em', color: 'var(--ink-tertiary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          STAGE 01 / OPTICS
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Multi-Channel Optical Viewport
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.2fr) 1fr', gap: '2rem', alignItems: 'center' }}>
        {/* Viewport Canvas Frame */}
        <div
          style={{
            background: '#0e0e0e',
            border: '1px solid var(--border-hairline)',
            borderRadius: '4px',
            position: 'relative',
            overflow: 'hidden',
            aspectRatio: '16 / 10',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <canvas
            ref={canvasRef}
            width={360}
            height={225}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'rgba(17, 17, 17, 0.88)',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: '3px',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-mono)'
            }}
          >
            CHANNEL: {currentChannel.toUpperCase()} {currentChannel === 'green' ? '(PEAK CONTRAST)' : ''}
          </div>
          {!isCapturing && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(17, 17, 17, 0.75)',
                color: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>Camera / Stream Inactive</div>
              <div style={{ fontSize: '0.72rem', color: '#aaaaaa' }}>Start Camera, upload video, or launch simulation</div>
            </div>
          )}
        </div>

        {/* Optical Channel Selection Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {[
            { id: 'green', label: '● Green Channel', sub: 'Oxygenated HbO₂ Peak (~540nm) — Max SNR' },
            { id: 'rgb', label: 'RGB Normal', sub: 'Full Color Stream (Spatial Arithmetic Mean)' },
            { id: 'red', label: 'Red Channel', sub: 'Tissue Scattering & High DC Baseline Drift' },
            { id: 'blue', label: 'Blue Channel', sub: 'Superficial Epidermal Penetration (Lowest SNR)' }
          ].map((item) => {
            const active = currentChannel === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectChannel(item.id as OpticalChannel)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '1rem 1.4rem',
                  borderRadius: '4px',
                  background: active ? 'var(--ink-primary)' : 'var(--bg-surface)',
                  color: active ? '#ffffff' : 'var(--ink-primary)',
                  border: active ? '1px solid var(--ink-primary)' : '1px solid var(--border-hairline)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>{item.label}</span>
                <span style={{ fontSize: '0.72rem', color: active ? 'rgba(255, 255, 255, 0.7)' : 'var(--ink-secondary)', marginTop: '2px' }}>
                  {item.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
