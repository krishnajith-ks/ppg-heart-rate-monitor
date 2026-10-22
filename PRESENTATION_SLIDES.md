# Camera-Based PPG Heart Rate Monitor
## Simple Presentation & Viva Slide Deck

**Author:** Krishnajith KS  
**Project:** Client-Side Photoplethysmography (PPG) Vital Signs Monitor  

---

## Slide 1: Title & The Big Idea
### "Pulse from Pixels — Toss the Sensor"

- **Goal:** Measure human heart rate accurately using **only a smartphone camera and flashlight**.
- **No external hardware:** No smartwatches, pulse oximeters, or chest straps needed.
- **Zero cloud upload:** 100% private. All video stays inside the browser memory and is discarded immediately.
- **Runs anywhere:** Modern web app built with React 19, TypeScript, and pure mathematics.

---

## Slide 2: The Core Science (PPG in Simple Words)
### How Can a Camera See Your Heartbeat?

1. **Every heartbeat:** The heart contracts (systole) and pushes fresh blood into your fingertips.
2. **Light Absorption:** Blood contains hemoglobin. Hemoglobin absorbs **green light (~540 nm)** strongly.
3. **Brightness Changes:**
   - More blood in fingertip $\rightarrow$ absorbs more light $\rightarrow$ camera sees slightly darker image.
   - Less blood between beats $\rightarrow$ absorbs less light $\rightarrow$ camera sees slightly brighter image.
4. **Beer-Lambert Law:** Light absorption changes proportionally with arterial blood volume. The camera captures these microscopic fluctuations 30 times a second.

---

## Slide 3: Step-by-Step Processing Pipeline
### From Video Frames to Clean Signal

```
[Phone Camera / Flashlight]
            │
            ▼
[64 x 64 Pixel Region of Interest]  --> Saves battery & O(1) memory
            │
            ▼
[Linear Resampling (30.0 Hz)]       --> Fixes phone frame-rate jitter
            │
            ▼
[4th-Order Butterworth Filter]      --> Removes hand wobble & noise
            │
            ▼
[Dual Consensus Engine]             --> Compares Time Peak vs FFT
            │
            ▼
[Verified BPM Readout (e.g., 72)]
```

---

## Slide 4: Noise Removal (Filtering)
### Why We Need the Filter

- **The Problem:**
  - Breathing causes slow signal drift (0.2 Hz).
  - Hand shaking and phone sensor noise cause high-frequency spikes (10+ Hz).
- **The Solution:**
  - **4th-Order Butterworth Band-Pass Filter (0.5 Hz – 4.0 Hz)**.
  - 0.5 Hz = 30 BPM (lowest human pulse).
  - 4.0 Hz = 240 BPM (highest human pulse).
  - Smooth frequency response without ripple in passband.

---

## Slide 5: Finding the Heart Rate (Dual Cross-Check)
### Two Independent Mathematical Engines

To guarantee trustworthy readings, the system calculates heart rate in two completely different ways:

1. **Method A — Time Domain (IBI - Inter-Beat Interval):**
   - Finds the peaks of the filtered heartbeat wave.
   - Measures seconds between systolic peaks: $\text{BPM} = 60 / \Delta t$.
2. **Method B — Frequency Domain (FFT - Fast Fourier Transform):**
   - Takes 4,096 points with a Hann window.
   - Translates wave into frequency spectrum.
   - Highest spectral power peak = heart rate frequency $f_{\text{peak}}$.
3. **Consensus Rule:**
   - If $|\text{BPM}_{\text{Time}} - \text{BPM}_{\text{Freq}}| \le 3.0\text{ BPM} \rightarrow$ **Confirmed Valid**.
   - If difference $> 3.0\text{ BPM} \rightarrow$ Flags noisy signal and refines.

---

## Slide 6: System Architecture & Privacy
### Client-Side Only — No Server Needed

- **Flat $O(1)$ Memory:** Frames are processed on a tiny 64×64 offscreen canvas and thrown away instantly. Memory never leaks.
- **100% Client-Side:** No Node/Python backend server needed. Runs on phone browser via Vite static build.
- **Zero Privacy Leak:** No medical video or camera data is ever sent across the network.

---

## Slide 7: Presentation Features & Secret Workbench
### Built-in Teacher Evaluation Mode

- **Public Landing Page:**
  - Clean, minimal design modeled after Vladimir Gruev's award-winning *Crumple* design system.
  - Big arterial red heartbeat disc.
  - American Heart Association (AHA) resting category cards (Athletic, Normal, Elevated).
- **Secret Presenter Easter Egg:**
  - Clicking `Developed by Krishnajith KS` **6 consecutive times** unlocks the full **Teacher Evaluation Workbench**.
  - Shows live multi-channel sensor viewport (Green vs RGB vs Red vs Blue).
  - Live real-time DSP canvas plots (Raw, Filtered, FFT).
  - Interactive synthetic benchmark tests (54, 72, 108 BPM).

---

## Slide 8: Quick Viva Q&A Cheat Sheet
### Common Examiner Questions & Short Answers

- **Q: Why choose the green channel over red or blue?**  
  *A:* Oxygenated hemoglobin has its highest optical absorption peak at ~540 nm (green), giving 2.5× better Signal-to-Noise Ratio (SNR) than red.
- **Q: What happens if the phone frame rate drops from 30 fps to 24 fps?**  
  *A:* Our linear timestamp resampler interpolates raw timestamps onto an exact 30.0 Hz grid before filtering, so filter cutoff frequencies never drift.
- **Q: Why use a 4th-order filter instead of 2nd-order?**  
  *A:* Two cascaded 2nd-order Direct Form II sections give a steep 24 dB/octave rolloff, sharply attenuating DC drift without numerical instability.
- **Q: Can this replace a hospital ECG?**  
  *A:* No. This is an educational optical plethysmograph measuring peripheral blood volume pulse, not electrical cardiac conduction.
