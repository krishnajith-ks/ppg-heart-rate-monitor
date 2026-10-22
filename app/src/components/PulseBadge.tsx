import React from 'react';
import type { ConsensusResult } from '../dsp/agreement';

interface PulseBadgeProps {
  bpm: number;
  isCapturing: boolean;
  consensus: ConsensusResult | null;
}

export const PulseBadge: React.FC<PulseBadgeProps> = ({ bpm, isCapturing, consensus }) => {
  return (
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
          cursor: 'default',
          userSelect: 'none',
          transition: 'transform 0.2s cubic-bezier(0.21, 0.61, 0.35, 1)'
        }}
      >
        <div style={{ fontSize: '3.6rem', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-0.04em' }}>
          {bpm > 0 ? Math.round(bpm) : '--'}
        </div>
        <div style={{ fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800, opacity: 0.92, marginTop: '6px' }}>
          BPM
        </div>
      </div>

      <div style={{ marginTop: '1.4rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink-primary)' }}>
          {consensus?.agreed ? 'Dual Engines Synchronized' : isCapturing ? 'Refining Signal...' : 'Ready to Monitor'}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
          {consensus
            ? `Time: ${consensus.bpmTime} BPM | FFT: ${consensus.bpmFreq} BPM (Δ ${consensus.difference})`
            : 'Awaiting Optical Data'}
        </div>
      </div>
    </div>
  );
};
