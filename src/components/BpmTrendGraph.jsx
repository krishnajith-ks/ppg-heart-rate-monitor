// src/components/BpmTrendGraph.jsx
// Session BPM trend over time rendered on HTML5 Canvas.
//
// Key features per GUIDE.md Section 7.1:
// 1. Shows progression of estimated heart rate over the session.
// 2. Y-axis labeled with BPM (40 to 180 BPM range).
// 3. X-axis labeled with elapsed time in seconds.

import React, { useRef, useEffect } from 'react';

export function BpmTrendGraph({
  history = [], // Array of { t: seconds, bpm: number }
  height = 120
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

    // Y-axis spans 40 to 180 BPM
    const yMin = 40;
    const yMax = 180;
    const toScreenY = (bpm) => padTop + plotH - ((bpm - yMin) / (yMax - yMin)) * plotH;

    // Grid lines for Y (60, 90, 120, 150 BPM)
    ctx.strokeStyle = 'rgba(55, 65, 81, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const yTicks = [60, 90, 120, 150];
    for (const tick of yTicks) {
      const y = toScreenY(tick);
      ctx.moveTo(padLeft, y);
      ctx.lineTo(padLeft + plotW, y);
    }
    ctx.stroke();

    // Y tick labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    for (const tick of yTicks) {
      ctx.fillText(`${tick}`, padLeft - 6, toScreenY(tick) + 3);
    }

    // Y axis unit
    ctx.save();
    ctx.translate(12, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('BPM', 0, 0);
    ctx.restore();

    if (!history || history.length < 2) {
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Recording BPM trend...', padLeft + plotW / 2, padTop + plotH / 2);
      return;
    }

    const tStart = history[0].t;
    const tEnd = history[history.length - 1].t;
    const tRange = Math.max(1, tEnd - tStart);
    const toScreenX = (t) => padLeft + ((t - tStart) / tRange) * plotW;

    // Draw Trend Line
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444'; // Red pulse trend
    ctx.lineWidth = 2;
    for (let i = 0; i < history.length; i++) {
      const px = toScreenX(history[i].t);
      const py = toScreenY(history[i].bpm);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Data points
    for (let i = 0; i < history.length; i++) {
      const px = toScreenX(history[i].t);
      const py = toScreenY(history[i].bpm);
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }

    // X Axis ticks
    ctx.fillStyle = '#9ca3af';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${tStart.toFixed(0)}s`, padLeft, padTop + plotH + 16);
    ctx.fillText(`${tEnd.toFixed(0)}s`, padLeft + plotW, padTop + plotH + 16);
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Session Time (s) →', padLeft + plotW / 2, padTop + plotH + 16);

  }, [history, height]);

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
        Heart Rate Trend (BPM vs Time)
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
