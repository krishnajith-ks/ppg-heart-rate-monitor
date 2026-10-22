# Camera-Based PPG Vital Signs Monitor — Complete Project Overview & Technical Report

**File Path:** `/home/jojo/Projects/ppg-heart-rate-monitor/PROJECT_OVERVIEW.md`  
**Author:** Jojo (Krishnajith KS), 3rd-Year ECE  
**Document Version:** 1.0  
**Date:** 22 Oct 2026  

---

## 1. Project Summary & Academic Pitch

Turn any standard smartphone into a pulse plethysmograph using only its camera and flashlight LED, executing a full Digital Signal Processing (DSP) chain entirely in the browser, while exposing the internal mathematical pipeline through a secret presenter workbench for academic defense.

### One-Line Scientific Proposition:
> "Measure pulsatile arterial blood volume changes from camera frame spatial means, filter with causal Butterworth biquad sections, and cross-verify heart rate via dual time-domain IBI and frequency-domain FFT estimators."

---

## 2. How to Run the Application & Prototype

### Method 1: React 19 + TypeScript Production App (Recommended)
```bash
cd /home/jojo/Projects/ppg-heart-rate-monitor/app
npm install
npm run dev
# Open in browser: http://localhost:5173
```

To run DSP unit tests:
```bash
cd /home/jojo/Projects/ppg-heart-rate-monitor/app
npm test
```

To test on your mobile phone with HTTPS camera access:
```bash
# In terminal 1:
cd /home/jojo/Projects/ppg-heart-rate-monitor/app && npm run dev
# In terminal 2:
npx localtunnel --port 5173
# Open the generated https://...loca.lt URL on your phone
```

### Method 2: Self-Contained HTML Prototype (Dependency-Free)
A fully self-contained, dependency-free interactive HTML prototype is available at:
```bash
/home/jojo/Projects/ppg-heart-rate-monitor/prototype_preview.html
```
Run with:
```bash
xdg-open /home/jojo/Projects/ppg-heart-rate-monitor/prototype_preview.html
```

### Method 4: Visual Companion Live Server (Superpowers Tooling)
```bash
bash /home/jojo/.gemini/config/plugins/superpowers/skills/brainstorming/scripts/start-server.sh --project-dir /home/jojo/Projects/ppg-heart-rate-monitor --open
```

---

## 3. End-to-End System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             BROWSER RUNTIME                              │
│                                                                          │
│  [Live Camera (Flash ON)]  OR  [Uploaded MP4 Fingertip Video]            │
│                            │                                             │
│                            ▼                                             │
│                 Offscreen 64×64 Canvas                                   │
│              Frame discarded immediately (O(1) memory)                   │
│                            │                                             │
│                            ▼                                             │
│        Sample Extraction: (timestamp_k, G_mean[k])                       │
│                            │                                             │
│                            ▼                                             │
│         Timestamp Resampling onto Uniform 30 Hz Grid                     │
│                            │                                             │
│                            ▼                                             │
│       ┌───────────────── Web Worker (DSP Engine) ──────────────────┐     │
│       │ 1. DC Baseline Wander Detrending (Moving Average)          │     │
│       │ 2. 4th-Order Butterworth Band-Pass Filter (0.5–4.0 Hz SOS) │     │
│       │ 3. Signal Z-Score Normalization                            │     │
│       │ 4. Method A: Peak Detection & Adaptive Thresholds          │     │
│       │    → Inter-Beat Intervals (IBI) → BPM_time                 │     │
│       │ 5. Method B: Hann Windowing + 16,384 Zero-Pad FFT          │     │
│       │    → Spectral Peak Refinement → BPM_freq                   │     │
│       │ 6. Consensus Engine: |BPM_time - BPM_freq| ≤ 3.0 BPM       │     │
│       └─────────────────────────────┬──────────────────────────────┘     │
│                                     ▼                                    │
│      ┌──────────────────────────────┴──────────────────────────────┐     │
│      │                                                             │     │
│      ▼                                                             ▼     │
│  [Public Hero UI]                                          [Secret Lab]  │
│  - Golden Ratio layout                                     - Optical     │
│  - Arterial Red Pulse Badge                                  plane pills │
│  - Resting Categories Table                                - 3 waveforms │
│  - Silent 6-click trigger                                  - ECE Theory  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Signal Processing Pipeline & Mathematical Principles

### 4.1 Principle 1: Optical Hemoglobin Absorption (Beer-Lambert)
Light transmission through vascularized tissue follows the Beer-Lambert law:
$$I = I_0 \cdot e^{-\epsilon(\lambda) \cdot c \cdot d(t)}$$
Where arterial pulsation modulates physical path length $d(t)$. Oxygenated hemoglobin ($\text{HbO}_2$) absorbs light at $\sim 540\text{ nm}$ (green) significantly more strongly than surrounding tissue. Red light has high penetration with severe Rayleigh/Mie scattering; blue light attenuates in superficial epidermal layers. Hence, green channel spatial mean yields the highest signal-to-noise ratio (SNR).

### 4.2 Principle 2: Uniform 30 Hz Grid Resampling
Variable camera frame delivery times $\Delta t_k$ degrade discrete digital filter frequency response. Linear interpolation onto an invariant time interval $\Delta t = 1/30\text{ s}$ preserves designed transfer function poles and zeros.

### 4.3 Principle 3: Butterworth Second-Order Sections (SOS)
- **Passband:** $0.5\text{--}4.0\text{ Hz}$ ($30\text{--}240\text{ BPM}$).
- **Structure:** Two cascaded Direct Form II Transposed biquad filters:
  $$H(z) = \frac{b_{01} + b_{11}z^{-1} + b_{21}z^{-2}}{1 + a_{11}z^{-1} + a_{21}z^{-2}} \cdot \frac{b_{02} + b_{12}z^{-1} + b_{22}z^{-2}}{1 + a_{12}z^{-1} + a_{22}z^{-2}}$$
- Cascaded biquads avoid high-order numerical instability and require only 4 memory registers in total.

### 4.4 Principle 4: Dual Estimation & Agreement Logic
- **Time-Domain Method:** Local maxima detection with $0.3\text{ s}$ refractory lockout; computes $\text{BPM} = 60 / \text{mean}(\text{IBI})$.
- **Frequency-Domain Method:** Hann-tapered 16,384-point FFT with parabolic interpolation to find peak frequency $f_{\text{peak}}$; computes $\text{BPM} = f_{\text{peak}} \times 60$.
- **Consensus:** Output is validated when $|\text{BPM}_{\text{time}} - \text{BPM}_{\text{freq}}| \le 3.0\text{ BPM}$.

---

## 5. UI/UX Rules: Vladimir Gruev *Crumple* Style

- **Strict Monochromatic Base:** Warm ecru canvas (`#f5f3ef`), stark white cards (`#ffffff`), pitch black text (`#111111`), and fine $1\text{px}$ hairline rules (`#dcd7cc`).
- **Single Arterial Accent:** Vivid orange-red (`#ff3b19`) reserved strictly for the pulsating circular hero badge and spectral peak indicators. Zero distracting green, blue, or random orange.
- **Golden Ratio ($1.618 : 1$) & Rule of Thirds:** Major headline block width $1.618\times$ vs. $1.0\times$ pulse disc column. Disc sits on the upper-right focal intersection.
- **Silent Easter Egg:** Footer text `Developed by Krishnajith KS` opens the full DSP Presentation Lab when clicked **6 consecutive times**.

---

## 6. Directory File Audit & Verification

All files inside `/home/jojo/Projects/ppg-heart-rate-monitor/` verified intact:
1. `prototype_preview.html`: Self-contained interactive prototype with live canvas waveforms, channel switching, and 6-click easter egg.
2. `BRAINSTORM_SPEC.md`: Locked master architecture and mathematical DSP specification.
3. `UI_DESIGN_SPEC.md`: Strict *Crumple* design system guidelines, color tokens, and Golden Ratio layout rules.
4. `BUILD_GUIDELINES_AND_REPORT.md`: 7-stage roadmap mapped directly to Antigravity and Superpowers engineering skills.
5. `PROJECT_OVERVIEW.md`: Full project technical summary and manual run guide.
6. `AI_HANDOFF_GUIDE.md`: Executive handoff instructions for subsequent AI sessions.
