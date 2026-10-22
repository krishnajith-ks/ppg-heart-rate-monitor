import React, { useRef } from 'react';
import { OpticalViewport } from './OpticalViewport';
import { WaveformStack } from './WaveformStack';
import { TheoryDeck } from './TheoryDeck';
import type { OpticalChannel } from '../dsp/dspPipeline';
import type { ConsensusResult } from '../dsp/agreement';

interface DashboardViewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  currentChannel: OpticalChannel;
  onSelectChannel: (channel: OpticalChannel) => void;
  isCapturing: boolean;
  sourceType: 'none' | 'camera' | 'video' | 'synthetic';
  torchSupported: boolean;
  torchActive: boolean;
  statusMessage: string;
  consensus: ConsensusResult | null;
  rawBuffer: number[];
  filteredBuffer: number[];
  fftSpectrum: { freqs: number[]; magnitudes: number[]; peakFreq: number; bpm: number } | null;
  peakIndices: number[];
  onStartCamera: () => void;
  onStopCapture: () => void;
  onToggleTorch: () => void;
  onUploadFile: (file: File) => void;
  onStartSimulation: (bpm: number) => void;
  onBackToLanding: () => void;
  onSecretTriggerClick: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  canvasRef,
  currentChannel,
  onSelectChannel,
  isCapturing,
  sourceType,
  torchSupported,
  torchActive,
  statusMessage,
  consensus,
  rawBuffer,
  filteredBuffer,
  fftSpectrum,
  peakIndices,
  onStartCamera,
  onStopCapture,
  onToggleTorch,
  onUploadFile,
  onStartSimulation,
  onBackToLanding,
  onSecretTriggerClick
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header with Back Button */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(245, 243, 239, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border-hairline)',
          padding: '0.9rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 50
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent-arterial)',
              boxShadow: '0 0 8px var(--accent-arterial-glow)'
            }}
          />
          <div style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            01 / TEACHER EVALUATION WORKBENCH
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.6rem' }}>
          <a href="#viewport" style={{ color: 'var(--ink-secondary)', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600 }}>
            Optical Sensor
          </a>
          <a href="#dsp" style={{ color: 'var(--ink-secondary)', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600 }}>
            DSP Signals
          </a>
          <a href="#theory" style={{ color: 'var(--ink-secondary)', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600 }}>
            Curriculum Defense
          </a>
          <a href="#diagnostics" style={{ color: 'var(--ink-secondary)', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600 }}>
            Viva Diagnostics
          </a>
          <button
            onClick={onBackToLanding}
            style={{
              background: 'var(--ink-primary)',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 1rem',
              borderRadius: '4px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: '0.5rem'
            }}
          >
            &larr; Back to Landing Page
          </button>
        </nav>
      </header>

      {/* Main Workbench Body */}
      <main style={{ maxWidth: 'var(--container-max-width)', margin: '0 auto', padding: '2.5rem 2rem 5rem 2rem', flex: 1, width: '100%' }}>
        {/* Controls and Status Toolbar */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '6px',
            padding: '1.4rem 1.8rem',
            marginBottom: '3rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.2rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '4px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isCapturing ? 'var(--accent-arterial)' : 'var(--ink-tertiary)'
                }}
              />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-secondary)' }}>
                {sourceType === 'camera'
                  ? 'LIVE CAMERA STREAM ACTIVE'
                  : sourceType === 'video'
                  ? 'VIDEO FILE STREAM ACTIVE'
                  : sourceType === 'synthetic'
                  ? 'SYNTHETIC BENCHMARK ACTIVE'
                  : 'SENSOR PIPELINE READY'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-primary)', fontFamily: 'var(--font-mono)' }}>
              {statusMessage}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
            {!isCapturing ? (
              <button
                onClick={onStartCamera}
                style={{
                  background: 'var(--ink-primary)',
                  color: '#ffffff',
                  padding: '0.65rem 1.3rem',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  border: '1px solid var(--ink-primary)',
                  cursor: 'pointer'
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
                  padding: '0.65rem 1.3rem',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
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
                background: 'var(--bg-canvas)',
                color: 'var(--ink-primary)',
                border: '1px solid var(--border-hairline)',
                padding: '0.65rem 1.2rem',
                borderRadius: '4px',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              Upload Video
            </button>

            {torchSupported && isCapturing && (
              <button
                onClick={onToggleTorch}
                style={{
                  background: torchActive ? 'var(--accent-arterial)' : 'var(--bg-canvas)',
                  color: torchActive ? '#ffffff' : 'var(--ink-primary)',
                  border: '1px solid var(--border-hairline)',
                  padding: '0.65rem 1rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Torch {torchActive ? 'ON' : 'OFF'}
              </button>
            )}

            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                onClick={() => onStartSimulation(54)}
                title="Athletic 54 BPM"
                style={{
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-hairline)',
                  padding: '0.55rem 0.8rem',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                54 BPM
              </button>
              <button
                onClick={() => onStartSimulation(72)}
                title="Normal 72 BPM"
                style={{
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-hairline)',
                  padding: '0.55rem 0.8rem',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                72 BPM
              </button>
              <button
                onClick={() => onStartSimulation(108)}
                title="Elevated 108 BPM"
                style={{
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-hairline)',
                  padding: '0.55rem 0.8rem',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                108 BPM
              </button>
            </div>
          </div>
        </div>

        {/* Stage 01: Optical Viewport */}
        <div id="viewport">
          <OpticalViewport
            canvasRef={canvasRef}
            currentChannel={currentChannel}
            onSelectChannel={onSelectChannel}
            isCapturing={isCapturing}
          />
        </div>

        {/* Stage 02: DSP Waveforms */}
        <div id="dsp">
          <WaveformStack
            rawSignal={rawBuffer}
            filteredSignal={filteredBuffer}
            fftSpectrum={fftSpectrum}
            peakIndices={peakIndices}
          />
        </div>

        {/* Stage 03: Theory Defense Deck */}
        <div id="theory">
          <TheoryDeck />
        </div>

        {/* Stage 04: Diagnostic Signal Metrics & Synthetic Benchmarks */}
        <section id="diagnostics" style={{ padding: '3.5rem 0' }}>
          <div style={{ marginBottom: '1.6rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.18em', color: 'var(--accent-arterial)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              STAGE 04 / VIVA DEFENSE LAB
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Digital Signal Processing Inspector &amp; Diagnostics
            </h2>
          </div>

          {/* Diagnostic Parameter Grid */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '4px',
              padding: '1.6rem',
              marginBottom: '1.8rem'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '0.05em' }}>
              ENGINE STATE METRICS
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.2rem',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
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
                <strong>Agreement Rule:</strong> &Delta; &le; 3.0 BPM<br />
                <strong>Engine Status:</strong>{' '}
                <span style={{ color: consensus?.agreed ? 'var(--accent-arterial)' : 'var(--ink-secondary)', fontWeight: 'bold' }}>
                  {consensus?.agreed ? 'Verified Clean (Agreed)' : 'Refining Signal'}
                </span>
                <br />
                <strong>Biquad Structure:</strong> Direct Form II SOS
              </div>
            </div>
          </div>

          {/* Video Stream Uploader Box */}
          <div
            style={{
              border: '1px dashed var(--border-hairline)',
              borderRadius: '4px',
              padding: '1.6rem',
              background: 'var(--bg-surface)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.8rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>Pre-Recorded Fingertip Video Stream</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', marginTop: '2px' }}>
                Downsamples resolution to 64&times;64 ROI and resamples timestamps onto uniform 30 Hz grid.
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'var(--ink-primary)',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.3rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Select Video File (.mp4 / .webm)
            </button>
          </div>

          {/* Quick Benchmark Cards */}
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.8rem', color: 'var(--ink-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Synthetic ECE Benchmark Generators
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Athletic Benchmark', bpm: 54, sub: 'Low cardiac frequency test (0.90 Hz)' },
                { label: 'Normal Resting', bpm: 72, sub: 'Standard baseline test (1.20 Hz)' },
                { label: 'Elevated Post-Exertion', bpm: 108, sub: 'High cardiac frequency test (1.80 Hz)' }
              ].map((bench) => (
                <div
                  key={bench.bpm}
                  onClick={() => onStartSimulation(bench.bpm)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-hairline)',
                    borderRadius: '4px',
                    padding: '1.2rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{bench.label}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent-arterial)', margin: '4px 0' }}>
                    {bench.bpm} BPM
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-secondary)' }}>{bench.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer with 6-click trigger */}
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
              onClick={onSecretTriggerClick}
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
    </div>
  );
};
