# Digital Signal Processing (PPG) Project Rules
# Condensed from GUIDE.md Section 13

These rules are ALWAYS ACTIVE and override any general skill or framework suggestions.

## DO

1. **Follow GUIDE.md strictly**: Section 13 overrides any skill or general advice. State assumptions in one line and continue.
2. **Comment heavily in plain language**: The owner is a student who must explain every function in a viva. Explain what each step does and why.
3. **Hand-crafted DSP only**: Implement the Butterworth biquad cascade, peak detection, radix-2 FFT, and resampling by hand without any DSP libraries.
4. **Centralize tunables**: Keep all tunable thresholds and constants exclusively in `src/config.js`.
5. **Expose viva metrics in Admin**: Show all intermediate mathematical parameters in the Admin Panel calculations view.
6. **Milestone gating**: After completing each milestone, output a concise summary, running instructions, and a phone testing checklist. Halt for user OK before beginning the next.
7. **Graceful error states**: Provide friendly, plain-language error handling for camera permissions, non-HTTPS contexts, missing rear camera, and lost finger.
8. **Plain Canvas graphs**: Render all graphs on plain HTML5 `<canvas>` elements with labeled axes and physical units (s, Hz, BPM).
9. **Mobile-first design**: Build clean, responsive, high-contrast layouts optimized for phone touchscreens.

## DO NOT

1. **NO backend / NO telemetry**: Do not add a backend, database, authentication, user accounts, analytics, or network uploads of video or metrics.
2. **NO unauthorized features**: Never implement blood pressure (BP is strictly out of scope). Do not implement SpO2 unless explicitly requested.
3. **NO medical claims**: Never use words like "accurate", "clinical", "diagnose", or "medical-grade". Always label as an "educational estimate" with the not-a-medical-device disclaimer.
4. **NO fabricated BPM**: Never display a BPM without a detected finger or fabricate placeholder readings.
5. **NO external chart or DSP libraries**: Do NOT install Chart.js, Recharts, D3, or npm DSP packages.
6. **NO persistent replay clip storage**: Keep replay clips strictly in transient browser memory (Blob/object URL). Do not save to localStorage, IndexedDB, or provide a download button.
7. **NO DSP on compressed clips**: DSP runs strictly on the live camera stream (or uploaded demo video stream at 1x), never post-processed on compressed recording clips.
8. **NO high-frequency React state**: Never push per-frame video or signal samples into React state. Use mutable `ref`s and fixed-size `Float32Array` ring buffers.
9. **NO extraneous dependencies**: Never add dependencies without explicit owner approval.
10. **NO silent clamping**: Never artificially clamp or doctor noisy or failing DSP outputs. Report signal quality transparently.
11. **NO public upload buttons**: Video upload demo mode must remain strictly inside the collapsed "Demo tools" accordion in the Admin Panel, and results must be clearly labeled "(demo)".
12. **NO server-side features**: Keep the site 100% static client-side (Vite + React SPA).
