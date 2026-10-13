---
name: perf-audit
description: Audit performance and memory against GUIDE.md Section 11 using chrome-devtools MCP traces and mobile emulation. Use when profiling memory leaks, checking frame rates, or running milestone 8 audits.
---

# Performance and Memory Audit Checklist

## Goal
Verify that the application conforms to GUIDE.md Section 11 performance and memory mandates using Chrome DevTools MCP tools for desktop/emulation checks, while acknowledging real camera validation occurs on a physical phone.

## Real Device Testing Notice
> **Important**: Chrome DevTools mobile emulation simulates viewports and CPU throttling, but **actual camera streaming, torch hardware, and frame acquisition must be tested directly on your physical smartphone**.

## Audit Steps (Using chrome-devtools MCP)

1. **Emulation Setup**:
   - Use `emulate` to simulate mobile viewport (e.g. 390x844) and 4x CPU slowdown.
   - Navigate to test page using `navigate_page`.

2. **Memory Leaks & Heap Check**:
   - Use `take_heapsnapshot` or heap profiling before and after a 15-second measurement simulation.
   - Confirm heap size stays flat. Ensure no unbounded arrays or uncleaned closures exist.
   - Verify ring buffers use fixed-size `Float32Array` (~300-400 elements).

3. **Performance Tracing**:
   - Call `performance_start_trace` during active rendering.
   - Let it run for 5-10 seconds, then call `performance_stop_trace`.
   - Verify frame render times remain under 33 ms (target 30+ fps).

4. **Section 11 Architecture Verification**:
   - **React State Isolation**: High-frequency frame signals must live in mutable `ref`s, never React state. React state updates should occur only ~1x/second (BPM, status).
   - **Canvas Reuse**: Exactly one 64x64 offscreen canvas allocated for pixel averaging.
   - **Cleanup**: Verify `track.stop()`, `cancelAnimationFrame`, and `URL.revokeObjectURL` execute on unmount.
   - **Visibility**: Confirm processing pauses when `document.hidden` is true.

## Constraints
- Never import external charting (Chart.js, Recharts) or DSP libraries.
- Report observed frame duration and memory stability clearly to the user.
