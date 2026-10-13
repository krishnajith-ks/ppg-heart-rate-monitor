// src/components/SpectrumGraph.jsx
// Frequency-domain FFT magnitude spectrum canvas graph.
//
// Key features per GUIDE.md Section 7.1 & Section 11:
// 1. Frequency axis spans 0 to 5.0 Hz.
// 2. The physiological passband (0.5 to 4.0 Hz = 30 to 240 BPM) is visually shaded.
// 3. Dominant spectral peak is highlighted with frequency (Hz) and BPM (f * 60).
// 4. Physical units labeled on both axes (Hz and Magnitude).

import React, { useRef, useEffect } from 'react';

export function SpectrumGraph({
  frequencies,     // Float64Array of frequency bins (Hz)
  magnitudes,      // Float64Array of FFT magnitudes
  peakFreq = 0,    // Dominant detected peak frequency (Hz)
  height = 140
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 320;
    const h = height;

    canvas.width = width * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Dark background
    ctx.fillStyle = '#0e1626';
    ctx.fillRect(0, 0, width, h);

    const padLeft = 45;
    const padRight = 15;
    const padTop = 15;
    const padBottom = 25;
    const plotW = width - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    const maxDisplayFreq = 5.0; // 0 to 5 Hz window

    // Helper functions
    const toScreenX = (f) => padLeft + (f / maxDisplayFreq) * plotW;

    // 1. Shade the 0.5 to 4.0 Hz physiological passband
    const xBandStart = Math.max(padLeft, toScreenX(0.5));
    const xBandEnd = Math.min(padLeft + plotW, toScreenX(4.0));
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)'; // Subtle cyan shade
    ctx.fillRect(xBandStart, padTop, xBandEnd - xBandStart, plotH);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(55, 65, 81, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let f = 1; f <= 5; f++) {
      const x = toScreenX(f);
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
    }
    for (let i = 0; i <= 3; i++) {
      const y = padTop + (plotH / 3) * i;
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
    }
    ctx.stroke();

    if (!frequencies || !magnitudes || frequencies.length < 2) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Awaiting FFT spectrum...', padLeft + plotW / 2, padTop + plotH / 2);
      return;
    }

    // Find maximum magnitude within 0 to 5 Hz
    let maxMag = 0;
    for (let i = 0; i < frequencies.length; i++) {
      if (frequencies[i] <= maxDisplayFreq && magnitudes[i] > maxMag) {
        maxMag = magnitudes[i];
      }
    }

    const yMax = maxMag > 0 ? maxMag * 1.15 : 1.0;
    const toScreenY = (mag) => padTop + plotH - (mag / yMax) * plotH;

    // 2. Draw FFT spectrum curve
    ctx.beginPath();
    ctx.strokeStyle = '#06b6d4'; // Cyan
    ctx.lineWidth = 1.75;

    let started = false;
    for (let i = 0; i < frequencies.length; i++) {
      const f = frequencies[i];
      if (f > maxDisplayFreq) break;

      const px = toScreenX(f);
      const py = toScreenY(magnitudes[i]);

      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(toScreenX(Math.min(maxDisplayFreq, frequencies[frequencies.length - 1])), padTop + plotH);
    ctx.lineTo(padLeft, padTop + plotH);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.fill();

    // 3. Highlight dominant peak in 0.5–4.0 Hz
    if (peakFreq >= 0.5 && peakFreq <= 4.0) {
      const peakBpm = Math.round(peakFreq * 60);
      const px = toScreenX(peakFreq);

      // Find magnitude closest to peakFreq
      let peakMag = 0;
      let minDiff = Infinity;
      for (let i = 0; i < frequencies.length; i++) {
        const diff = Math.abs(frequencies[i] - peakFreq);
        if (diff < minDiff) {
          minDiff = diff;
          peakMag = magnitudes[i];
        }
      }
      const py = toScreenY(peakMag);

      // Vertical line to peak
      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
      ctx.moveTo(px, padTop + plotH);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Peak circle
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();

      // Peak label tag
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = px > padLeft + plotW - 60 ? 'right' : 'left';
      ctx.fillText(`${peakFreq.toFixed(2)} Hz (${peakBpm} BPM)`, px > padLeft + plotW - 60 ? px - 6 : px + 6, py - 4);
    }

    // 4. Draw Axes & Labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    // X-axis frequency markers (Hz)
    for (let f = 0; f <= 5; f++) {
      const px = toScreenX(f);
      ctx.fillText(`${f}`, px, padTop + plotH + 16);
    }

    ctx.fillStyle = '#6b7280';
    ctx.font = '9px sans-serif';
    ctx.fillText('Frequency (Hz) →', padLeft + plotW / 2, padTop + plotH + 16);

    // Y-axis label
    ctx.save();
    ctx.translate(12, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Magnitude', 0, 0);
    ctx.restore();

  }, [frequencies, magnitudes, peakFreq, height]);

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
        <span>FFT Magnitude Spectrum (0–5 Hz)</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
          Shaded: 0.5–4.0 Hz passband
        </span>
      </div>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: `${height}px`,
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          display: 'block'
        }}
      />
    </div>
  );
}
