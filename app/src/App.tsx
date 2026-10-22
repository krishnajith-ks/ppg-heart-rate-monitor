import { useState, useRef } from 'react';
import { usePpgSampler } from './hooks/usePpgSampler';
import { Hero } from './components/Hero';
import { RestingTable } from './components/RestingTable';
import { OpticalViewport } from './components/OpticalViewport';
import { WaveformStack } from './components/WaveformStack';
import { TheoryDeck } from './components/TheoryDeck';
import { SecretDashboard } from './components/SecretDashboard';

export function App() {
  const {
    state,
    videoRef,
    canvasRef,
    startCamera,
    stopCapture,
    toggleTorch,
    loadVideoFile,
    startSyntheticSimulation,
    setChannel
  } = usePpgSampler();

  const [isSecretOpen, setIsSecretOpen] = useState(false);
  const clickCountRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  const handleFooterClick = () => {
    clickCountRef.current++;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      clickCountRef.current = 0;
    }, 3000);

    if (clickCountRef.current >= 6) {
      setIsSecretOpen(true);
      clickCountRef.current = 0;
    }
  };

  return (
    <div>
      {/* Hidden processing video */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ display: 'none' }}
      />

      {/* Sticky Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(245, 243, 239, 0.94)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--border-hairline)',
          padding: '0.9rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 50
        }}
      >
        <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          01 / PPG VITAL MONITOR
        </div>
        <nav style={{ display: 'flex', gap: '1.8rem' }}>
          <a href="#hero" style={{ color: 'var(--ink-secondary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
            Monitor
          </a>
          <a href="#viewport" style={{ color: 'var(--ink-secondary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
            Optical Sensor
          </a>
          <a href="#dsp" style={{ color: 'var(--ink-secondary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
            DSP Signals
          </a>
          <a href="#theory" style={{ color: 'var(--ink-secondary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
            Curriculum Defense
          </a>
        </nav>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 'var(--container-max-width)', margin: '0 auto', padding: '0 2rem 5rem 2rem' }}>
        <Hero
          currentBpm={state.currentBpm}
          isCapturing={state.isCapturing}
          consensus={state.consensus}
          torchSupported={state.torchSupported}
          torchActive={state.torchActive}
          onStartCamera={startCamera}
          onStopCapture={stopCapture}
          onToggleTorch={toggleTorch}
          onUploadFile={loadVideoFile}
          onStartSimulation={startSyntheticSimulation}
        />

        <RestingTable currentBpm={state.currentBpm} />

        <div id="viewport">
          <OpticalViewport
            canvasRef={canvasRef}
            currentChannel={state.channel}
            onSelectChannel={setChannel}
            isCapturing={state.isCapturing}
          />
        </div>

        <div id="dsp">
          <WaveformStack
            rawSignal={state.rawBuffer}
            filteredSignal={state.filteredBuffer}
            fftSpectrum={state.fftSpectrum}
            peakIndices={state.peakIndices}
          />
        </div>

        <div id="theory">
          <TheoryDeck />
        </div>

        {/* Footer with Silent 6-Click Trigger */}
        <footer
          style={{
            marginTop: '4rem',
            paddingTop: '2.5rem',
            borderTop: '1px solid var(--border-hairline)',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: 'var(--ink-secondary)'
          }}
        >
          <div>Camera-Based Photoplethysmography Vital Signs Monitor &bull; Academic DSP Project</div>
          <div style={{ marginTop: '8px' }}>
            <span
              onClick={handleFooterClick}
              style={{
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--ink-tertiary)',
                userSelect: 'none'
              }}
            >
              Developed by Krishnajith KS
            </span>
          </div>
        </footer>
      </main>

      {/* Secret Presentation Workbench Modal */}
      <SecretDashboard
        isOpen={isSecretOpen}
        onClose={() => setIsSecretOpen(false)}
        consensus={state.consensus}
        onUploadFile={loadVideoFile}
        onRunBenchmark={(bpm) => startSyntheticSimulation(bpm)}
      />
    </div>
  );
}
export default App;
