// src/pages/Admin.jsx - Hidden viva diagnostics lab hosting all 6 graphs and intermediate calculations
import React, { useState, useEffect, useRef } from 'react';
import { sharedDspEngine } from '../state/dspEngine.js';
import { SignalGraph } from '../components/SignalGraph.jsx';
import { SpectrumGraph } from '../components/SpectrumGraph.jsx';
import { BpmTrendGraph } from '../components/BpmTrendGraph.jsx';

export function Admin() {
  const [demoToolsOpen, setDemoToolsOpen] = useState(false);
  const [greenChannelOnly, setGreenChannelOnly] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [calcs, setCalcs] = useState(null);
  const [signals, setSignals] = useState(null);
  const [bpmHistory, setBpmHistory] = useState([]);

  const greenCanvasRef = useRef(null);

  useEffect(() => {
    // Initial load from shared engine
    setMetrics(sharedDspEngine.getMetrics());
    setCalcs(sharedDspEngine.getCalculations());
    setSignals(sharedDspEngine.getSignals());
    setBpmHistory(sharedDspEngine.getBpmHistory());

    // Subscribe to ongoing dspEngine updates
    const unsubscribe = sharedDspEngine.subscribe((result) => {
      if (result && result.success) {
        setMetrics(result.metrics);
        setCalcs(result.calculations);
        setSignals(result.signals);
        setBpmHistory([...sharedDspEngine.getBpmHistory()]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="main-content">
      {/* Diagnostics Header Banner */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent-yellow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title" style={{ color: 'var(--accent-yellow)', margin: 0 }}>
              Admin Diagnostics Lab & Viva Panel
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Hidden route for viva defense: exposes all 6 processing waveforms and exact mathematical parameter substitutions.
            </p>
          </div>
          <span className="badge badge-yellow">Hidden Route</span>
        </div>
      </div>

      {/* Live Waveform Suite - All 6 Processing Stages */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            Live Processing Waveforms (All 6 Stages)
          </h3>
          <span className="badge badge-green">Real-Time Canvas</span>
        </div>

        {/* 1. Filtered signal with detected peaks */}
        <SignalGraph
          title="Stage 1: Band-Pass Filtered Signal (0.5–4.0 Hz Butterworth)"
          timeData={signals?.tUniform}
          signalData={signals?.filtered}
          peakIndices={signals?.peakIndices}
          color="#10b981"
          unitY="AC Amp"
          height={140}
        />

        {/* 2. Raw green channel signal */}
        <SignalGraph
          title="Stage 2: Raw Green Channel Signal (10 s window)"
          timeData={signals?.tUniform}
          signalData={signals?.raw}
          color="#9ca3af"
          unitY="Intensity"
          height={110}
        />

        {/* 3. Detrended signal */}
        <SignalGraph
          title="Stage 3: Detrended Signal (Moving-average baseline removed)"
          timeData={signals?.tUniform}
          signalData={signals?.detrended}
          color="#38bdf8"
          unitY="Zero-Mean"
          height={110}
        />

        {/* 4. FFT magnitude spectrum */}
        <SpectrumGraph
          frequencies={signals?.fftFrequencies}
          magnitudes={signals?.fftMagnitudes}
          peakFreq={metrics?.peakFreq ?? 0}
          height={140}
        />

        {/* 5. Filter frequency response magnitude */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            Stage 5: Filter Theoretical Frequency Response |H(f)| (0–6 Hz)
          </div>
          <SignalGraph
            title=""
            timeData={signals?.filterFreqs}
            signalData={signals?.filterMags}
            color="#f59e0b"
            unitY="|H(f)|"
            height={110}
          />
        </div>

        {/* 6. Session BPM trend */}
        <BpmTrendGraph
          history={bpmHistory}
          height={110}
        />
      </div>

      {/* Live Calculations Panel - Every viva examiner parameter */}
      <div className="card">
        <h3 className="card-title">Live Calculations & Formula Substitutions</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          {/* Sampling & Resolution */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              1. SAMPLING & RESOLUTION
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div>• Measured Sampling Rate: <strong>{calcs?.sampling?.fsMeasured ?? '--'} Hz</strong></div>
              <div>• Nyquist Frequency (fs/2): <strong>{calcs?.sampling?.nyquistFreq ?? '--'} Hz</strong></div>
              <div>• Uniform Window Samples N: <strong>{calcs?.sampling?.uniformSampleCount ?? '--'}</strong></div>
              <div>• Window Duration: <strong>{calcs?.sampling?.durationSec ?? '--'} s</strong></div>
              <div>• Spectral Resolution Δf (fs/N): <strong>{calcs?.sampling?.deltaFHz ?? '--'} Hz (~{calcs?.sampling?.deltaFBpm ?? '--'} BPM)</strong></div>
              <div>• Zero-Padded FFT Size: <strong>{calcs?.sampling?.fftSize ?? 2048} points</strong></div>
            </div>
          </div>

          {/* Time-Domain Analysis */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-green)', marginBottom: '0.5rem' }}>
              2. TIME DOMAIN (PEAKS)
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div>• Detected Peaks: <strong>{calcs?.timeDomain?.peakCount ?? '--'}</strong></div>
              <div>• Peak Threshold (0.3σ): <strong>{calcs?.timeDomain?.threshold ?? '--'}</strong></div>
              <div>• Median Interval: <strong>{calcs?.timeDomain?.medianIntervalSec ?? '--'} s</strong></div>
              <div style={{ marginTop: '0.35rem', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '0.35rem', borderRadius: '4px' }}>
                {calcs?.timeDomain?.formulaStr ?? 'Awaiting peaks...'}
              </div>
            </div>
          </div>

          {/* Frequency-Domain Analysis */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
              3. FREQUENCY DOMAIN (FFT)
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div>• Windowing: <strong>Hann Window (tapered edges)</strong></div>
              <div>• Passband Search: <strong>0.5 – 4.0 Hz (30 – 240 BPM)</strong></div>
              <div>• Peak Frequency f_peak: <strong>{calcs?.frequencyDomain?.peakFreqHz ?? '--'} Hz</strong></div>
              <div style={{ marginTop: '0.35rem', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '0.35rem', borderRadius: '4px' }}>
                {calcs?.frequencyDomain?.formulaStr ?? 'Awaiting FFT peak...'}
              </div>
            </div>
          </div>

          {/* Agreement & SNR Quality */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-yellow)', marginBottom: '0.5rem' }}>
              4. AGREEMENT & SNR QUALITY
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div>• |BPM_peak - BPM_fft| Diff: <strong>{metrics?.diffBpm ?? '--'} BPM</strong></div>
              <div>• Agreement Status: <strong>{metrics?.agrees ? 'High Confidence (<= 5 BPM)' : 'Disagreement'}</strong></div>
              <div>• Spectral SNR: <strong>{calcs?.quality?.snrValue ?? '--'} ({calcs?.quality?.qualityLabel ?? '--'})</strong></div>
              <div>• Signal Power: <strong>{calcs?.quality?.signalPower ?? '--'}</strong></div>
              <div>• In-Band Noise Power: <strong>{calcs?.quality?.noisePower ?? '--'}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Biquad Coefficients Table */}
      <div className="card">
        <h3 className="card-title">Butterworth Biquad Coefficients (fs = {calcs?.sampling?.targetFs ?? 30} Hz)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '0.8rem', textAlign: 'left', borderCollapse: 'collapse', color: 'var(--text-secondary)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                <th style={{ padding: '0.5rem' }}>Section</th>
                <th style={{ padding: '0.5rem' }}>b0</th>
                <th style={{ padding: '0.5rem' }}>b1</th>
                <th style={{ padding: '0.5rem' }}>b2</th>
                <th style={{ padding: '0.5rem' }}>a1</th>
                <th style={{ padding: '0.5rem' }}>a2</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.5rem', fontWeight: 600 }}>High-pass (0.5 Hz)</td>
                <td style={{ padding: '0.5rem' }}>{calcs?.filterCoeffs?.hp?.b0?.toFixed(6) ?? '0.928624'}</td>
                <td style={{ padding: '0.5rem' }}>{calcs?.filterCoeffs?.hp?.b1?.toFixed(6) ?? '-1.857248'}</td>
                <td style={{ padding: '0.5rem' }}>{calcs?.filterCoeffs?.hp?.b2?.toFixed(6) ?? '0.928624'}</td>
                <td style={{ padding: '0.5rem' }}>{calcs?.filterCoeffs?.hp?.a1?.toFixed(6) ?? '-1.852146'}</td>
                <td style={{ padding: '0.5rem' }}>{calcs?.filterCoeffs?.hp?.a2?.toFixed(6) ?? '0.862349'}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.5rem', fontWeight: 600 }}>Low-pass (4.0 Hz)</td>
                <td style={{ padding: '0.5rem' }}>{calcs?.filterCoeffs?.lp?.b0?.toFixed(6) ?? '0.108447'}</td>
                <td style={{ padding: '0.5rem' }}>{calcs?.filterCoeffs?.lp?.b1?.toFixed(6) ?? '0.216895'}</td>
                <td style={{ padding: '0.5rem' }}>{calcs?.filterCoeffs?.lp?.b2?.toFixed(6) ?? '0.108447'}</td>
                <td style={{ padding: '0.5rem' }}>{calcs?.filterCoeffs?.lp?.a1?.toFixed(6) ?? '-0.877271'}</td>
                <td style={{ padding: '0.5rem' }}>{calcs?.filterCoeffs?.lp?.a2?.toFixed(6) ?? '0.311060'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Collapsed Demo Tools Section (Video Upload) */}
      <div className="card">
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setDemoToolsOpen(!demoToolsOpen)}
        >
          <h3 className="card-title" style={{ margin: 0 }}>
            Demo Tools (Collapsed by default)
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
            {demoToolsOpen ? '▲ Hide' : '▼ Expand'}
          </span>
        </div>

        {demoToolsOpen && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Upload pre-recorded fingertip video to demonstrate the DSP pipeline without a live phone camera (activates in Milestone 6b).
            </p>
            <input type="file" accept="video/*" disabled style={{ opacity: 0.6 }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
