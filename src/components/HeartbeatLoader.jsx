// src/components/HeartbeatLoader.jsx
// Animated ECG heartbeat line and instruction prompt during active measurement.
import React from 'react';

export function HeartbeatLoader({ message = 'Measuring your pulse... keep your finger still' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.75rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
        <span className="pulse-icon" style={{ fontSize: '1.25rem' }}>♥</span>
        <span style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {message}
        </span>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Do not press too hard; rest your hand against a steady surface.
      </div>
    </div>
  );
}
