import React, { useRef, useEffect } from 'react';

interface WaveformStackProps {
  rawSignal: number[];
  filteredSignal: number[];
  fftSpectrum: { freqs: number[]; magnitudes: number[]; peakFreq: number; bpm: number } | null;
  peakIndices: number[];
}

export const WaveformStack: React.FC<WaveformStackProps> = ({
  rawSignal,
  filteredSignal,
  fftSpectrum,
  peakIndices
}) => {
  const canvasRawRef = useRef<HTMLCanvasElement | null>(null);
  const canvasBiquadRef = useRef<HTMLCanvasElement | null>(null);
  const canvasFftRef = useRef<HTMLCanvasElement | null>(null);

  // Helper to draw time signal
  const drawSignal = (
    canvas: HTMLCanvasElement | null,
    signal: number[],
    peaks?: number[]
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (signal.length < 2) {
      ctx.fillStyle = '#888888';
      ctx.font = '11px sans-serif';
      ctx.fillText('Accumulating optical samples...', 16, rect.height / 2 + 4);
      return;
    }

    // Determine scale min and max
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < signal.length; i++) {
      if (signal[i] < min) min = signal[i];
      if (signal[i] > max) max = signal[i];
    }
    const range = (max - min) || 1e-4;

    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1.3;
    ctx.beginPath();

    for (let i = 0; i < signal.length; i++) {
      const x = (i / (signal.length - 1)) * rect.width;
      const normalized = (signal[i] - min) / range;
      const y = rect.height - 8 - normalized * (rect.height - 16);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Mark peaks with arterial red markers
    if (peaks && peaks.length > 0) {
      ctx.fillStyle = '#ff3b19';
      for (const pIdx of peaks) {
        if (pIdx >= 0 && pIdx < signal.length) {
          const px = (pIdx / (signal.length - 1)) * rect.width;
          const normalized = (signal[pIdx] - min) / range;
          const py = rect.height - 8 - normalized * (rect.height - 16);

          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };

  // Helper to draw FFT spectrum
  const drawFft = (
    canvas: HTMLCanvasElement | null,
    fft: { freqs: number[]; magnitudes: number[]; peakFreq: number } | null
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (!fft || fft.magnitudes.length === 0) {
      ctx.fillStyle = '#888888';
      ctx.font = '11px sans-serif';
      ctx.fillText('Awaiting FFT window buffer...', 16, rect.height / 2 + 4);
      return;
    }

    // Limit view to 0 - 5.0 Hz
    const maxFreqDisplay = 5.0;
    const visiblePoints: { f: number; mag: number }[] = [];
    let maxMag = 1e-5;

    for (let i = 0; i < fft.freqs.length; i++) {
      const f = fft.freqs[i];
      if (f > maxFreqDisplay) break;
      const mag = fft.magnitudes[i];
      if (f >= 0.3 && mag > maxMag) maxMag = mag;
      visiblePoints.push({ f, mag });
    }

    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1.3;
    ctx.beginPath();

    let peakX = -1;
    let peakY = -1;

    for (let i = 0; i < visiblePoints.length; i++) {
      const { f, mag } = visiblePoints[i];
      const x = (f / maxFreqDisplay) * rect.width;
      const y = rect.height - 6 - (mag / maxMag) * (rect.height - 14);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      if (Math.abs(f - fft.peakFreq) < 0.05 && (peakX === -1 || (mag / maxMag) > 0.7)) {
        peakX = x;
        peakY = y;
      }
    }
    ctx.stroke();

    // Mark spectral peak
    if (peakX >= 0) {
      ctx.fillStyle = '#ff3b19';
      ctx.beginPath();
      ctx.arc(peakX, peakY, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  useEffect(() => {
    drawSignal(canvasRawRef.current, rawSignal);
    drawSignal(canvasBiquadRef.current, filteredSignal, peakIndices);
    drawFft(canvasFftRef.current, fftSpectrum);
  }, [rawSignal, filteredSignal, fftSpectrum, peakIndices]);

  return (
    <section style={{ padding: '3.5rem 0', borderBottom: '1px solid var(--border-hairline)' }}>
      <div style={{ marginBottom: '1.6rem' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.18em', color: 'var(--ink-tertiary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          STAGE 02 / MATHEMATICAL ENGINE
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Live DSP Signal Canvases
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {/* Waveform 1: Raw */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '1rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.6rem' }}>
            <span>1. Raw PPG Signal (Detrended Spatial Mean)</span>
            <span style={{ color: 'var(--ink-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
              Fs = 30 Hz | Linear Timestamp Resampling
            </span>
          </div>
          <canvas ref={canvasRawRef} style={{ width: '100%', height: '54px', display: 'block' }} />
        </div>

        {/* Waveform 2: Biquad Bandpass */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '1rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.6rem' }}>
            <span>2. 4th-Order Butterworth Band-Pass Filter (0.5 – 4.0 Hz)</span>
            <span style={{ color: 'var(--ink-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
              Cascaded Biquad SOS (Direct Form II Transposed)
            </span>
          </div>
          <canvas ref={canvasBiquadRef} style={{ width: '100%', height: '54px', display: 'block' }} />
        </div>

        {/* Waveform 3: FFT Spectrum */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '1rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.6rem' }}>
            <span>3. Spectral Power Density (Hann Windowed 4,096-Pt FFT)</span>
            <span style={{ color: 'var(--accent-arterial)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700 }}>
              {fftSpectrum && fftSpectrum.peakFreq > 0
                ? `f_peak = ${fftSpectrum.peakFreq.toFixed(2)} Hz → ${Math.round(fftSpectrum.bpm)} BPM`
                : 'Awaiting spectral convergence'}
            </span>
          </div>
          <canvas ref={canvasFftRef} style={{ width: '100%', height: '54px', display: 'block' }} />
        </div>
      </div>
    </section>
  );
};
