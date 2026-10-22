import React from 'react';

export const TheoryDeck: React.FC = () => {
  const cards = [
    {
      step: '01 / OPTICS',
      title: 'Beer-Lambert Law',
      desc: 'Pulsatile arterial volume modulates optical transmission path length. Oxygenated hemoglobin (HbO₂) absorbs green light strongly (~540nm), yielding optimal SNR.'
    },
    {
      step: '02 / RESAMPLING',
      title: '30 Hz Uniform Grid',
      desc: 'Mobile camera frame delivery jitter is eliminated via linear interpolation onto an invariant 30 Hz time grid, preserving digital filter transfer poles and zeros.'
    },
    {
      step: '03 / FILTERING',
      title: 'Biquad SOS Cascade',
      desc: 'Two Direct Form II Transposed biquad sections isolate the 0.5–4.0 Hz physiological bandpass (30–240 BPM) with flat O(1) state memory registers.'
    },
    {
      step: '04 / ESTIMATION',
      title: 'Dual Cross-Check',
      desc: 'Time-domain systolic peak IBI intervals are cross-verified against Hann-windowed FFT spectral peak. Readings agree within strict 3.0 BPM tolerance.'
    }
  ];

  return (
    <section style={{ padding: '3.5rem 0', borderBottom: '1px solid var(--border-hairline)' }}>
      <div style={{ marginBottom: '1.6rem' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.18em', color: 'var(--ink-tertiary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          STAGE 03 / ECE CURRICULUM DEFENSE
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Signal Engine Scientific Principles
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {cards.map((c) => (
          <div
            key={c.step}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '1.8rem'
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--ink-tertiary)' }}>
              {c.step}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.6rem 0', letterSpacing: '-0.01em' }}>
              {c.title}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', lineHeight: 1.55 }}>
              {c.desc}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
