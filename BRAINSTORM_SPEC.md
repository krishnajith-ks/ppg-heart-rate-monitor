# Camera-Based PPG Vital Signs Monitor — Master Brainstorming & Architecture Specification

**Location:** `/home/jojo/Projects/ppg-heart-rate-monitor/BRAINSTORM_SPEC.md`  
**Project:** Camera-Based PPG Heart Rate Monitor & DSP Presentation Workbench  
**Author:** Jojo (Krishnajith KS), 3rd-year ECE  
**Document Version:** 2.0 (Post-Brainstorming Locked Specification)  
**Date:** 22 Oct 2026  

---

## 1. Executive Summary & Problem Formulation

### 1.1 The Core Scientific Principle
Every heartbeat propels a pulse wave of oxygenated blood through the arterial network. In peripheral capillary beds (such as the fingertip), this pulsatile blood volume causes a periodic fluctuation in optical absorption. When illuminated by the smartphone's flash LED, the light backscattered into the camera CMOS sensor varies synchronously with the cardiac cycle. 

Averaging the pixel intensities across the region of interest (ROI) frame-by-frame extracts a one-dimensional time-series signal known as the **photoplethysmogram (PPG)**. By digitizing, detrending, digitally filtering, and spectrally analyzing this signal, the heart rate (in Beats Per Minute, BPM) is determined entirely inside the web browser.

### 1.2 Academic Defense Objective
This is an academic Digital Signal Processing (DSP) project, not a commercial toy app. When evaluating the project on a laptop, laptop webcams lack the macro flash illumination and steady contact geometry of a phone lens. To eliminate presentation risk while preserving scientific rigor, the system provides a dual-input architecture:
1. **Live Camera Capture:** For smartphone browsers with LED flash control.
2. **Video Upload Stream:** Allows loading a pre-recorded clean fingertip `.mp4` on a laptop to demonstrate the exact same client-side DSP pipeline without live acquisition noise.

---

## 2. Mathematical DSP Engine: Working Principles & Equations

### 2.1 Stage 1: Spatial Averaging & Color Plane Extraction
For frame $k$ with resolution $W \times H$ downsampled to a $64 \times 64$ ROI:
$$G[k] = \frac{1}{N} \sum_{(x, y) \in \text{ROI}} I_G(x, y, k)$$
- **Why Green?** Oxygenated hemoglobin ($\text{HbO}_2$) exhibits an optical absorption peak in the green spectrum ($\sim 540\text{ nm}$). Green light provides the highest pulsatile AC-to-DC contrast ratio. Red light penetrates deeply and suffers high scattering, while blue light has negligible tissue penetration depth.
- The user interface provides real-time plane switching (`RGB Normal`, `Green Channel`, `Red Channel`, `Blue Channel`) to visually prove this biophotonic principle to the evaluator.

### 2.2 Stage 2: Timestamp Resampling & DC Detrending
Consumer smartphone cameras deliver jittered, non-uniform frame intervals ($\Delta t \neq \text{const}$). Because digital IIR filters assume an invariant sampling interval $T = 1/f_s$, the raw sample stream $(t_k, G[k])$ is linearly resampled onto a uniform $f_s = 30\text{ Hz}$ time grid ($\Delta t = 33.33\text{ ms}$).

Low-frequency baseline wander (caused by respiration, subtle fingertip pressure shifts, and thermal drift) is eliminated by subtracting a moving average baseline or high-pass filtering ($f_c \approx 0.5\text{ Hz}$):
$$y_{\text{detrend}}[n] = x[n] - \frac{1}{2M+1}\sum_{m=-M}^{M} x[n+m]$$

### 2.3 Stage 3: 4th-Order Butterworth Bandpass Filter
Human resting heart rates reside strictly within $30\text{ to }240\text{ BPM}$, corresponding to the physiological passband:
$$f_{\text{low}} = 0.5\text{ Hz} \quad \longleftrightarrow \quad f_{\text{high}} = 4.0\text{ Hz}$$
- **Filter Topology:** Butterworth maximally flat passband prototype, implemented as a cascade of two **Second-Order Sections (SOS / Biquads)** in Direct Form II Transposed structure:
  $$H(z) = \prod_{k=1}^{2} \frac{b_{0k} + b_{1k}z^{-1} + b_{2k}z^{-2}}{1 + a_{1k}z^{-1} + a_{2k}z^{-2}}$$
- **SOS Coefficients ($f_s = 30\text{ Hz}$, $[0.5, 4.0]\text{ Hz}$):**
  - Section 1: $b = [0.087179, 0.174358, 0.087179]$, $a = [1.0, -1.013118, 0.410620]$
  - Section 2: $b = [1.0, -2.0, 1.0]$, $a = [1.0, -1.858589, 0.870970]$
- **Numerical Stability:** Cascaded biquads avoid the catastrophic coefficient quantization errors of direct higher-order transfer functions and require only two memory state variables per section ($z_1, z_2$), maintaining flat $O(1)$ memory. The initial 3.0 seconds ($90$ samples) are discarded to eliminate filter startup transients.

### 2.4 Stage 4: Dual-Engine Heart Rate Estimation

#### Method A: Time-Domain Systolic Peak Detection
1. Calculate running standard deviation $\sigma_x$ on the normalized signal $x_{\text{norm}}[n] = \frac{x[n] - \mu}{\sigma}$.
2. Detect local maxima satisfying $x[n] > \alpha \cdot \sigma_x$ with a refractory lockout period $\Delta t_{\text{min}} = 0.3\text{ s}$ (capping heart rate at $200\text{ BPM}$ to reject dicrotic notches).
3. Compute Inter-Beat Intervals (IBI): $\text{IBI}_i = t_{\text{peak}}[i+1] - t_{\text{peak}}[i]$.
4. Remove outlier intervals exceeding median tolerance and compute:
   $$\text{BPM}_{\text{time}} = \frac{60}{\text{mean}(\text{IBI})}$$

#### Method B: Frequency-Domain Spectral Peak Localization (FFT)
1. Window the 27-second clean segment with a **Hann window** $w[n] = 0.5 - 0.5\cos(2\pi n / N)$ to attenuate spectral leakage from non-integer cycle truncation.
2. Zero-pad the sequence to $N_{\text{FFT}} = 16,384$ points to interpolate the discrete Fourier bins.
3. Compute $|X(f)|$ via FFT and search for the maximum power density within the valid cardiac band $[0.5, 4.0]\text{ Hz}$.
4. Refine the peak frequency $f_{\text{peak}}$ using three-point parabolic interpolation:
   $$\delta = \frac{|X(k+1)| - |X(k-1)|}{2 \cdot (2|X(k)| - |X(k-1)| - |X(k+1)|)}, \quad f_{\text{peak}} = \frac{(k + \delta) \cdot f_s}{N_{\text{FFT}}}$$
   $$\text{BPM}_{\text{freq}} = f_{\text{peak}} \times 60$$

#### Consensus & Agreement Logic
- If $|\text{BPM}_{\text{time}} - \text{BPM}_{\text{freq}}| \le 3.0\text{ BPM}$, report the average as validated: `"Methods Agree"`.
- If difference exceeds $3.0\text{ BPM}$, report $\text{BPM}_{\text{freq}}$ with status: `"Methods Disagree — Signal Noisy"`.

---

## 3. UI/UX Architecture: Clean Crumple Editorial Identity

### 3.1 Color Palette (Strictly Purged of Random Colors)
No generic greens, blues, or random secondary oranges. All elements adhere strictly to the editorial identity of Vladimir Gruev's *Crumple* design:
- **Canvas / Background:** `#f5f3ef` (Warm ecru / editorial paper).
- **Surface Cards:** `#ffffff` (Clean white for high-contrast cards).
- **Primary Ink / Typography:** `#111111` (Deep pitch black).
- **Secondary Ink / Metadata:** `#555555` to `#777777`.
- **Hairline Rules & Dividers:** `#dcd7cc` / `#e2ddd3`.
- **Single Accent Color:** Arterial Orange-Red (`#ff3b19` / `#e6391a`) used exclusively for:
  - The signature circular pulse hero badge.
  - Active status indicators.
  - Waveform peak markers.

### 3.2 Compositional Rules
- **Golden Ratio ($1 : 1.618$):** The hero layout allocates $1.618$ proportional width to headline typography and primary interaction controls, balanced by $1.0$ proportional width for the arterial pulse circle.
- **Rule of Thirds:** The pulsating red badge sits on the upper-right third intersection, acting as an instant focal hook.
- **Scrollable Vertical Flow:** Rather than a cramped fixed box, the application unfolds vertically into distinct editorial chapters:
  1. *Chapter 1: The Hook & Real-Time Monitor* (Arterial circle, `Start Camera`, `Upload Video`, Resting BPM table).
  2. *Chapter 2: Optical Sensor Viewport* (Video player + channel selector pills).
  3. *Chapter 3: Signal Verification Lab* (Three sleek monochrome hairline waveforms with `#ff3b19` markers).
  4. *Chapter 4: ECE Curriculum Defense* (Four academic cards for oral presentation).
  5. *Footer:* Silent trigger reading `Developed by Krishnajith KS`.

### 3.3 Silent Presenter Easter Egg
The footer text `Developed by Krishnajith KS` has **zero hint text**. Clicking it **6 consecutive times** quietly unlocks the full DSP Presentation Dashboard with video file upload and expanded parameter inspection.

---

## 4. Technology Stack & Client-Side Runtime

- **Framework:** React 19 with Vite.
- **Language:** TypeScript / JavaScript (ESNext).
- **Styling:** Modular CSS / Tailwind utility tokens mapped to the Crumple palette variables.
- **DSP Worker:** Offscreen Web Worker executing the Biquad cascade, FFT, and peak detection, ensuring 60fps UI frame rates during intensive processing.
- **Canvas Rendering:** Minimal HTML5 `<canvas>` line plotter with high-DPI scaling and zero external charting bloat.
- **No Backend:** 100% client-side execution; zero privacy leakage; works offline once loaded.
