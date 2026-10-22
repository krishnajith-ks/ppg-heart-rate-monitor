import React from 'react';

interface RestingTableProps {
  currentBpm: number;
}

export const RestingTable: React.FC<RestingTableProps> = ({ currentBpm }) => {
  const isAthletic = currentBpm >= 40 && currentBpm < 60;
  const isNormal = currentBpm >= 60 && currentBpm <= 100;
  const isElevated = currentBpm > 100;

  return (
    <section style={{ padding: '3.5rem 0', borderBottom: '1px solid var(--border-hairline)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.6rem' }}>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.18em', color: 'var(--ink-tertiary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            PHYSIOLOGICAL BASELINE
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Resting Heart Rate Categories
          </h2>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>
          AHA Reference Standard
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        {/* Cat 1 */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: isAthletic ? '2px solid var(--ink-primary)' : '1px solid var(--border-subtle)',
            borderRadius: '4px',
            padding: '1.8rem',
            position: 'relative'
          }}
        >
          {isAthletic && (
            <span
              style={{
                position: 'absolute',
                top: '1.2rem',
                right: '1.2rem',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent-arterial)'
              }}
            />
          )}
          <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--ink-tertiary)' }}>
            CATEGORY 01
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.6rem 0', letterSpacing: '-0.03em' }}>
            40–60 BPM
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
            Athletic conditioning / High vagal tone
          </div>
        </div>

        {/* Cat 2 */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: isNormal ? '2px solid var(--ink-primary)' : '1px solid var(--border-subtle)',
            borderRadius: '4px',
            padding: '1.8rem',
            position: 'relative'
          }}
        >
          {isNormal && (
            <span
              style={{
                position: 'absolute',
                top: '1.2rem',
                right: '1.2rem',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent-arterial)'
              }}
            />
          )}
          <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', color: isNormal ? 'var(--accent-arterial)' : 'var(--ink-tertiary)' }}>
            CATEGORY 02 (NORMAL RESTING)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.6rem 0', letterSpacing: '-0.03em' }}>
            60–100 BPM
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
            Standard adult resting physiological range
          </div>
        </div>

        {/* Cat 3 */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: isElevated ? '2px solid var(--ink-primary)' : '1px solid var(--border-subtle)',
            borderRadius: '4px',
            padding: '1.8rem',
            position: 'relative'
          }}
        >
          {isElevated && (
            <span
              style={{
                position: 'absolute',
                top: '1.2rem',
                right: '1.2rem',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent-arterial)'
              }}
            />
          )}
          <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--ink-tertiary)' }}>
            CATEGORY 03
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0.6rem 0', letterSpacing: '-0.03em' }}>
            &gt; 100 BPM
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
            Elevated resting rate / Post-exertion or tachycardia
          </div>
        </div>
      </div>
    </section>
  );
};
