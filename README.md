# Camera-Based Photoplethysmography (PPG) Vital Signs Monitor

> **"Measure pulsatile arterial blood volume changes from camera frame spatial means, filter with causal Butterworth biquad sections, and cross-verify heart rate via dual time-domain IBI and frequency-domain FFT estimators."**

Developed by **Krishnajith KS (Jojo)**, 3rd-Year ECE  
Repository: `https://github.com/krishnajith-ks/ppg-heart-rate-monitor`  
Aesthetic Anchor: Vladimir Gruev's *Crumple* Editorial Identity

---

## 1. Quick Start

### Run the Web Application
```bash
# Navigate to the React 19 + TypeScript app directory
cd app

# Install dependencies (React 19, Vite, Vitest, TypeScript)
npm install

# Start local development server
npm run dev
# Open http://localhost:5173
```

### Run Mathematical DSP Unit Tests
```bash
cd app
npm test
```

### Production Build & Preview
```bash
cd app
npm run build
npm run preview
```

---

## 2. How to Test on Your Mobile Phone

> [!IMPORTANT]
> Modern mobile browsers (iOS Safari, Android Chrome) strictly enforce that camera and torch access (`navigator.mediaDevices.getUserMedia`) is **only allowed on secure HTTPS origins** or `localhost`. Accessing the local IP (e.g. `http://192.168.x.x:5173`) over plain HTTP will block the camera permission prompt.

Choose any of the following verified methods:

### Method A: Free Instant HTTPS Tunnel (Recommended)
Expose your local development server through a temporary secure HTTPS tunnel:
```bash
# 1. Start the dev server in one terminal:
cd app && npm run dev

# 2. In a second terminal, launch a secure HTTPS tunnel:
npx localtunnel --port 5173
```
- Localtunnel will generate a public URL like `https://funny-tiger-12.loca.lt`.
- Open this HTTPS URL in your smartphone browser.
- Tap **Start Camera →**, grant camera permission, and gently rest your index finger over the rear camera lens (and flashlight).

### Method B: Chrome USB Port Forwarding (Zero Latency, Secure `localhost`)
If your Android phone is connected to your PC via USB cable:
1. Enable **USB Debugging** in your phone's Developer Options.
2. In Chrome on your PC, navigate to `chrome://inspect/#devices`.
3. Click **Port forwarding...** and add rule:
   - Port: `5173`
   - IP address and port: `localhost:5173`
4. On your mobile phone Chrome browser, navigate directly to:
   ```
   http://localhost:5173
   ```
   *Because mobile Chrome treats `localhost` as an intrinsically secure origin, camera and torch access work without HTTPS certificate warnings!*

### Method C: Pre-Recorded Video & Synthetic Simulation (No Phone Needed)
For laptop demonstrations or teacher evaluations without live camera hardware:
- **Demo Simulation Button:** Generates a realistic synthetic pulsatile photoplethysmogram signal (54, 72, or 108 BPM) with optical hemoglobin absorption directly in the browser.
- **Upload Video:** Load any 30-second fingertip `.mp4` or `.webm` video recording.

---

## 3. End-to-End System Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│                            BROWSER RUNTIME                             │
│                                                                        │
│  [Mobile Rear Camera + Torch]  OR  [Fingertip MP4 Video]               │
│                            │                                           │
│                            ▼                                           │
│                 Offscreen 64×64 Canvas                                 │
│              Frame discarded immediately (O(1) Memory)                 │
│                            │                                           │
│                            ▼                                           │
│        Sample Extraction: (timestamp_k, G_mean[k])                     │
│                            │                                           │
│                            ▼                                           │
│         Timestamp Resampling onto Uniform 30 Hz Grid                   │
│                            │                                           │
│                            ▼                                           │
│       ┌───────────────── DSP Mathematical Engine ──────────────────┐   │
│       │ 1. DC Baseline Wander Detrending (Moving Average)          │   │
│       │ 2. 4th-Order Butterworth Bandpass (0.5–4.0 Hz SOS Biquads) │   │
│       │ 3. Signal Z-Score Normalization                            │   │
│       │ 4. Method A: Peak Detection + 0.30s Lockout → IBI BPM      │   │
│       │ 5. Method B: Hann Window + 4,096 FFT + Parabolic Peak BPM  │   │
│       │ 6. Consensus Engine: |BPM_time - BPM_freq| ≤ 3.0 BPM       │   │
│       └─────────────────────────────┬──────────────────────────────┘   │
│                                     ▼                                  │
│      ┌──────────────────────────────┴──────────────────────────────┐   │
│      │                                                             │   │
│      ▼                                                             ▼   │
│  [Public Hero UI]                                          [Teacher Lab]│
│  - Golden Ratio layout (1.618 : 1)                         - Secret 6x │
│  - 180px Arterial Red Pulse Badge                           trigger     │
│  - AHA Resting Categories Table                            - Diagnostics│
│  - 3 Live Canvas Waveforms                                 - Benchmarks │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Signal Processing Principles & Mathematical Formulations

### 4.1 Principle 1: Optical Hemoglobin Absorption (Beer-Lambert Law)
Light transmission through vascularized fingertip tissue follows:
$$I = I_0 \cdot e^{-\epsilon(\lambda) \cdot c \cdot d(t)}$$
Where arterial pulsatile expansion dynamically modulates optical path length $d(t)$. Oxygenated hemoglobin ($\text{HbO}_2$) exhibits high optical absorption at $\sim 540\text{ nm}$ (green), producing optimal pulsatile AC-to-DC signal contrast.

### 4.2 Principle 2: Uniform 30 Hz Time Grid Resampling
Mobile camera frame arrival intervals exhibit non-uniform delivery jitter ($\Delta t \neq \text{const}$). Discrete digital IIR filters require an invariant sampling interval $T = 1/f_s$. The raw sample stream $(t_k, G[k])$ is linearly resampled onto an invariant $f_s = 30\text{ Hz}$ time grid ($\Delta t = 33.33\text{ ms}$).

### 4.3 Principle 3: Butterworth Direct Form II SOS Cascade
Human cardiac frequencies reside strictly in the $0.5\text{ to }4.0\text{ Hz}$ passband ($30\text{ to }240\text{ BPM}$). The filter is implemented as two cascaded Second-Order Sections (SOS) in Direct Form II Transposed structure:
$$H(z) = \frac{b_{01} + b_{11}z^{-1} + b_{21}z^{-2}}{1 + a_{11}z^{-1} + a_{21}z^{-2}} \cdot \frac{b_{02} + b_{12}z^{-1} + b_{22}z^{-2}}{1 + a_{12}z^{-1} + a_{22}z^{-2}}$$
Maintaining strict $O(1)$ memory with only 4 float state registers.

### 4.4 Principle 4: Dual-Engine Consensus Validation
- **Time-Domain IBI Estimator:** Adaptive local maxima detection with $0.30\text{ s}$ refractory lockout (rejecting dicrotic notches); computes $\text{BPM}_{\text{time}} = 60 / \text{mean}(\text{IBI})$.
- **Frequency-Domain FFT Estimator:** Hann-windowed zero-padded FFT with 3-point parabolic peak interpolation; computes $\text{BPM}_{\text{freq}} = f_{\text{peak}} \times 60$.
- **Consensus Rule:** Output is certified as `"Methods Agree"` when $|\text{BPM}_{\text{time}} - \text{BPM}_{\text{freq}}| \le 3.0\text{ BPM}$.

---

## 5. UI Architecture: Vladimir Gruev *Crumple* Aesthetic

- **Strict Monochromatic Base:** Warm ecru canvas (`#f5f3ef`), stark white cards (`#ffffff`), carbon black ink (`#111111`), hairline borders (`#dcd7cc`).
- **Single Arterial Accent:** Vivid arterial orange-red (`#ff3b19`) reserved strictly for the pulsating circular hero badge and spectral peak indicators. Zero multi-color clutter.
- **Golden Ratio Hero ($1.618 : 1$):** Editorial headline and interaction group balance the $180\text{px}$ arterial pulse circle.
- **Silent Presenter Easter Egg:** Clicking `Developed by Krishnajith KS` in the footer **6 consecutive times within 3 seconds** unlocks the secret Teacher Evaluation Workbench modal with internal filter metrics and direct benchmark injectors. Zero hint text.

---

## 6. Project Directory Structure

```
.
├── README.md                          # Master documentation & phone test guide
├── PROJECT_OVERVIEW.md                # Scientific proposition & architecture
├── BRAINSTORM_SPEC.md                 # Mathematical DSP filter equations
├── UI_DESIGN_SPEC.md                  # Crumple design tokens & layout rules
├── BUILD_GUIDELINES_AND_REPORT.md     # 7-step execution report & skills mapping
├── AI_HANDOFF_GUIDE.md                # AI session continuity instructions
├── prototype_preview.html             # Standalone dependency-free preview
└── app/                               # Full React 19 + TypeScript production app
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── styles/tokens.css
        ├── hooks/usePpgSampler.ts
        ├── components/
        │   ├── Hero.tsx
        │   ├── PulseBadge.tsx
        │   ├── RestingTable.tsx
        │   ├── OpticalViewport.tsx
        │   ├── WaveformStack.tsx
        │   ├── TheoryDeck.tsx
        │   └── SecretDashboard.tsx
        └── dsp/
            ├── resampling.ts
            ├── biquad.ts
            ├── peakDetection.ts
            ├── fft.ts
            ├── agreement.ts
            ├── dspPipeline.ts
            ├── dspWorker.ts
            └── __tests__/dsp.test.ts
```

---
*Camera-Based PPG Vital Signs Monitor • ECE Curriculum Digital Signal Processing Project*
