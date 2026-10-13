// src/pages/Admin.jsx - Hidden viva diagnostics lab hosting all 6 graphs, calculations, synced replay, and demo video upload
import React, { useState, useEffect, useRef } from 'react';
import { sharedDspEngine } from '../state/dspEngine.js';
import { sharedClipRecorder } from '../camera/clipRecorder.js';
import { VideoFileSource } from '../camera/videoFileSource.js';
import { FrameSampler } from '../camera/frameSampler.js';
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

  // Synced video replay state (camera recording)
  const [replayUrl, setReplayUrl] = useState(sharedClipRecorder.getBlobUrl());
  const [cursorTime, setCursorTime] = useState(null);

  // Demo upload state
  const [demoFileLoaded, setDemoFileLoaded] = useState(false);
  const [demoDuration, setDemoDuration] = useState(0);
  const [demoIsPlaying, setDemoIsPlaying] = useState(false);
  const [demoError, setDemoError] = useState(null);
  const [demoMetrics, setDemoMetrics] = useState(null);

  const videoReplayRef = useRef(null);
  const demoVideoRef = useRef(null);
  const greenCanvasRef = useRef(null);
  const videoFileSourceRef = useRef(null);
  const demoSamplerRef = useRef(null);

  useEffect(() => {
    // Initial load from shared engine
    setMetrics(sharedDspEngine.getMetrics());
    setCalcs(sharedDspEngine.getCalculations());
    setSignals(sharedDspEngine.getSignals());
    setBpmHistory(sharedDspEngine.getBpmHistory());
    setReplayUrl(sharedClipRecorder.getBlobUrl());

    // Subscribe to ongoing dspEngine updates
    const unsubscribe = sharedDspEngine.subscribe((result) => {
      if (result && result.success) {
        setMetrics(result.metrics);
        setCalcs(result.calculations);
        setSignals(result.signals);
        setBpmHistory([...sharedDspEngine.getBpmHistory()]);
      }
      setReplayUrl(sharedClipRecorder.getBlobUrl());
    });

    return () => {
      unsubscribe();
      if (videoFileSourceRef.current) {
        videoFileSourceRef.current.clear();
      }
    };
  }, []);

  // Update synchronized cursor when replay video plays or scrubs
  const handleTimeUpdate = () => {
    const video = videoReplayRef.current || demoVideoRef.current;
    if (video && signals?.tUniform && signals.tUniform.length > 0) {
      const vidTime = video.currentTime;
      const tStart = signals.tUniform[0];
      setCursorTime(tStart + vidTime);

      if (greenChannelOnly && greenCanvasRef.current) {
        renderGreenChannelFrame(video);
      }
    }
  };

  const renderGreenChannelFrame = (video) => {
    const canvas = greenCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.drawImage(video, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Isolate green channel by zeroing red and blue channels per Section 7.3 item 1
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0;     // Red = 0
      // data[i+1] stays green
      data[i + 2] = 0; // Blue = 0
    }
    ctx.putImageData(imgData, 0, 0);

    // Overlay 64x64 sampling region box
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    const boxSize = 32;
    const cx = (w - boxSize) / 2;
    const cy = (h - boxSize) / 2;
    ctx.strokeRect(cx, cy, boxSize, boxSize);
  };

  const handleDiscardClip = () => {
    sharedClipRecorder.discard();
    setReplayUrl(null);
    setCursorTime(null);
  };

  // Video Upload Demo Mode Handlers
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDemoError(null);
    sharedDspEngine.reset();

    if (!demoVideoRef.current) return;

    videoFileSourceRef.current = new VideoFileSource(demoVideoRef.current, () => {});

    try {
      const info = await videoFileSourceRef.current.loadFile(file);
      setDemoDuration(info.duration);
      setDemoFileLoaded(true);

      // Attach frame sampler to demo video element
      demoSamplerRef.current = new FrameSampler(demoVideoRef.current, (frame) => {
        // Feed into the SAME dspEngine as live camera!
        sharedDspEngine.addSample(frame.t, frame.g, frame.hasFinger);
      });
    } catch (err) {
      console.error('Demo video load error:', err);
      setDemoError(err.message || 'Failed to load video file.');
      setDemoFileLoaded(false);
    }
  };

  const handlePlayDemo = async () => {
    if (!videoFileSourceRef.current || !demoSamplerRef.current) return;
    setDemoIsPlaying(true);
    setDemoMetrics(null);
    sharedDspEngine.reset();

    demoSamplerRef.current.start();
    await videoFileSourceRef.current.play();

    demoVideoRef.current.onended = () => {
      setDemoIsPlaying(false);
      demoSamplerRef.current.stop();
      sharedDspEngine.runPipeline();
      setDemoMetrics(sharedDspEngine.getMetrics());
    };
  };

  const handleClearDemo = () => {
    if (demoSamplerRef.current) {
      demoSamplerRef.current.stop();
    }
    if (videoFileSourceRef.current) {
      videoFileSourceRef.current.clear();
    }
    setDemoFileLoaded(false);
    setDemoIsPlaying(false);
    setDemoMetrics(null);
    setDemoError(null);
    setCursorTime(null);
  };

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
              Hidden route for viva defense: exposes all 6 processing waveforms, parameter substitutions, and synced video replay.
            </p>
          </div>
          <span className="badge badge-yellow">Hidden Route</span>
        </div>
      </div>

      {/* Last Capture Replay Section with Synced Cursor (GUIDE.md Section 7.3 item 2) */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            Last Capture Replay (Explanation Mode)
          </h3>
          {replayUrl && (
            <button
              onClick={handleDiscardClip}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--accent-pulse)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Discard Clip
            </button>
          )}
        </div>

        {replayUrl ? (
          <div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
              {/* Standard video element */}
              <div style={{ display: greenChannelOnly ? 'none' : 'block' }}>
                <video
                  ref={videoReplayRef}
                  src={replayUrl}
                  controls
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  style={{
                    width: '160px',
                    height: '120px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: '#000',
                    objectFit: 'cover'
                  }}
                />
              </div>

              {/* Green Channel Isolation Canvas */}
              <div style={{ display: greenChannelOnly ? 'block' : 'none' }}>
                <canvas
                  ref={greenCanvasRef}
                  width="160"
                  height="120"
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--accent-green)',
                    backgroundColor: '#000',
                    display: 'block'
                  }}
                />
              </div>

              <div>
                <button
                  onClick={() => setGreenChannelOnly(!greenChannelOnly)}
                  style={{
                    background: greenChannelOnly ? 'var(--accent-green)' : 'var(--bg-surface-elevated)',
                    color: greenChannelOnly ? '#000' : 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'block',
                    marginBottom: '0.5rem'
                  }}
                >
                  {greenChannelOnly ? '✓ Green Channel Isolated' : 'Toggle Green Channel View'}
                </button>

                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Scrub video to move the synchronized cursor across graphs.
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Note: Clip is compressed in transient RAM for viva explanation only.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)' }}>
            No capture yet. Run a measurement from the main page to populate this replay view.
          </div>
        )}
      </div>

      {/* Live Waveform Suite - All 6 Processing Stages */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            Processing Waveforms (All 6 Stages)
          </h3>
          <span className="badge badge-green">Real-Time Canvas</span>
        </div>

        {/* 1. Filtered signal with detected peaks & synced cursor */}
        <SignalGraph
          title="Stage 1: Band-Pass Filtered Signal (0.5–4.0 Hz Butterworth)"
          timeData={signals?.tUniform}
          signalData={signals?.filtered}
          peakIndices={signals?.peakIndices}
          cursorTime={cursorTime}
          color="#10b981"
          unitY="AC Amp"
          height={140}
        />

        {/* 2. Raw green channel signal */}
        <SignalGraph
          title="Stage 2: Raw Green Channel Signal (10 s window)"
          timeData={signals?.tUniform}
          signalData={signals?.raw}
          cursorTime={cursorTime}
          color="#9ca3af"
          unitY="Intensity"
          height={110}
        />

        {/* 3. Detrended signal */}
        <SignalGraph
          title="Stage 3: Detrended Signal (Moving-average baseline removed)"
          timeData={signals?.tUniform}
          signalData={signals?.detrended}
          cursorTime={cursorTime}
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

      {/* Video Upload Demo Mode - Collapsed "Demo tools" Section */}
      <div className="card">
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setDemoToolsOpen(!demoToolsOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 className="card-title" style={{ margin: 0 }}>
              Demo Tools (Video Upload Mode)
            </h3>
            <span className="badge badge-yellow">Laptop Presentation</span>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
            {demoToolsOpen ? '▲ Close' : '▼ Expand'}
          </span>
        </div>

        {demoToolsOpen && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Upload a pre-recorded fingertip video (MP4, WebM, MOV) to test and demonstrate the DSP pipeline without a live phone camera.
            </p>

            {demoError && (
              <div style={{ color: 'var(--accent-pulse)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                ⚠️ {demoError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}
              />

              {demoFileLoaded && (
                <>
                  <button
                    onClick={handlePlayDemo}
                    disabled={demoIsPlaying}
                    className="button-primary"
                    style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                  >
                    {demoIsPlaying ? '▶ Playing & Processing at 1x...' : '▶ Run Demo Processing'}
                  </button>

                  <button
                    onClick={handleClearDemo}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      padding: '0.4rem 0.8rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Clear File
                  </button>
                </>
              )}
            </div>

            {/* Hidden/Visible Video Preview for Demo File */}
            <div style={{ display: demoFileLoaded ? 'flex' : 'none', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <video
                ref={demoVideoRef}
                playsInline
                muted
                controls={!demoIsPlaying}
                onTimeUpdate={handleTimeUpdate}
                style={{
                  width: '200px',
                  height: '150px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: '#000',
                  objectFit: 'cover'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Demo Footage: {demoDuration.toFixed(1)}s duration
              </span>
            </div>

            {/* Labeled Demo Results */}
            {demoMetrics && (
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--accent-cyan)', marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  Result from uploaded video (demo)
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {demoMetrics.headlineBpm ?? '--'} BPM
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Peak BPM: {demoMetrics.bpmPeak} | FFT BPM: {demoMetrics.bpmFFT} (Confidence: {demoMetrics.confidence})
                </div>
              </div>
            )}

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              Privacy note: File is loaded locally into browser RAM and never uploaded to any server. Results from phone videos may exhibit minor exposure changes compared to live hardware streams.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
