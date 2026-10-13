// src/components/SignalGraph.jsx
// High-contrast, mobile-optimized HTML5 Canvas graph for time-domain signals.
//
// Key features per GUIDE.md Section 7.1 & Section 11:
// 1. Plain <canvas> element (strictly zero external charting libraries).
// 2. Axes labeled with physical units (seconds on X-axis, amplitude on Y-axis).
// 3. Crisp HiDPI/Retina rendering using devicePixelRatio.
// 4. Peak marker overlays (red circles with beat highlights).

import React, { useRef, useEffect } from 'react';

export function SignalGraph({
  title,
  timeData,         // Float64Array or Array of timestamps (s)
  signalData,       // Float64Array or Array of signal amplitudes
  peakIndices = [], // Array of indices where systolic peaks were detected
  color = '#10b981',
  unitY = 'amp',
  height = 140
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI (Retina) scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 320;
    const h = height;

    canvas.width = width * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Dark canvas background
    ctx.fillStyle = '#0e1626';
    ctx.fillRect(0, 0, width, h);

    const padLeft = 45;
    const padRight = 15;
    const padTop = 15;
    const padBottom = 25;
    const plotW = width - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    // Draw background grid lines
    ctx.strokeStyle = 'rgba(55, 65, 81, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = padTop + (plotH / 4) * i;
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
    }
    for (let i = 0; i <= 4; i++) {
      const x = padLeft + (plotW / 4) * i;
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, padTop + plotH);
    }
    ctx.stroke();

    if (!signalData || signalData.length < 2) {
      // Empty state placeholder
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Awaiting signal data...', padLeft + plotW / 2, padTop + plotH / 2);
      return;
    }

    const n = signalData.length;

    // Determine signal bounds
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let i = 0; i < n; i++) {
      const v = signalData[i];
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }

    if (maxVal - minVal < 1e-4) {
      minVal -= 1;
      maxVal += 1;
    }

    // Add 10% vertical padding
    const valRange = maxVal - minVal;
    const yMin = minVal - valRange * 0.1;
    const yMax = maxVal + valRange * 0.1;
    const totalRange = yMax - yMin;

    const tStart = timeData && timeData.length > 0 ? timeData[0] : 0;
    const tEnd = timeData && timeData.length > 0 ? timeData[n - 1] : n;
    const tDuration = tEnd - tStart || 1;

    // Helper functions for mapping coordinates
    const toScreenX = (t) => padLeft + ((t - tStart) / tDuration) * plotW;
    const toScreenY = (v) => padTop + plotH - ((v - yMin) / totalRange) * plotH;

    // Draw waveform path
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.75;
    ctx.lineJoin = 'round';

    for (let i = 0; i < n; i++) {
      const t = timeData && timeData.length > i ? timeData[i] : i;
      const v = signalData[i];
      const px = toScreenX(t);
      const py = toScreenY(v);

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Mark detected peaks with prominent red dots
    if (peakIndices && peakIndices.length > 0) {
      for (const idx of peakIndices) {
        if (idx >= 0 && idx < n) {
          const t = timeData && timeData.length > idx ? timeData[idx] : idx;
          const v = signalData[idx];
          const px = toScreenX(t);
          const py = toScreenY(v);

          // Outer halo
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.fill();

          // Inner solid marker
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
        }
      }
    }

    // Draw Axes & Labels with physical units
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';

    // Y-axis ticks
    ctx.fillText(maxVal.toFixed(1), padLeft - 6, padTop + 10);
    ctx.fillText(minVal.toFixed(1), padLeft - 6, padTop + plotH);

    // X-axis ticks (seconds)
    ctx.textAlign = 'center';
    ctx.fillText(`${tStart.toFixed(1)}s`, padLeft, padTop + plotH + 16);
    ctx.fillText(`${tEnd.toFixed(1)}s`, padLeft + plotW, padTop + plotH + 16);

    // Axis units label
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Time (s) →`, padLeft + plotW / 2 - 20, padTop + plotH + 16);

    ctx.save();
    ctx.translate(12, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(unitY, 0, 0);
    ctx.restore();

  }, [timeData, signalData, peakIndices, color, unitY, height]);

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
        <span>{title}</span>
        {peakIndices.length > 0 && (
          <span style={{ color: 'var(--accent-pulse)', fontSize: '0.775rem' }}>
            ● {peakIndices.length} peaks detected
          </span>
        )}
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
