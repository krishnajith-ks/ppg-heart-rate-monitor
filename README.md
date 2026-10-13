# PPG Heart Rate Monitoring Using a Smartphone Camera

An academic Digital Signal Processing (DSP) project that measures human heart rate (BPM) in real time using a smartphone camera and pure client-side discrete-time signal processing.

## Project Overview

- **Owner**: Krishnajith KS (3rd-year ECE student)
- **Technique**: Photoplethysmography (PPG) via rear camera + flash
- **Stack**: Vite + React + Vanilla CSS (Static client-side SPA)
- **Core DSP**:
  - Uniform linear resampling
  - Moving-average DC detrending
  - Hand-crafted 4th-order cascaded Butterworth band-pass filter (0.5 – 4.0 Hz)
  - Time-domain peak detection with refractory distance enforcement
  - Frequency-domain radix-2 Cooley-Tukey FFT (Hann window + 2048 zero-padding)
  - Signal-to-noise ratio (SNR) and dual-method agreement check
  - Zero external DSP or charting libraries (custom HTML5 `<canvas>` renderers)

## Educational & Diagnostic Features

- **Measure View (`/`)**: Real-time signal graphing (raw, filtered with marked peaks, spectrum, BPM trend) with mobile state-machine flow.
- **Admin Panel (`/admin`)**: Hidden diagnostics view with camera channel analysis, mathematical formulas with parameter substitutions, filter frequency response, and transient replay inspection.
- **Demo Mode**: In-browser video upload for testing and presentations without a live camera feed.

## Disclaimer

This project is an educational engineering estimate for academic demonstration and viva presentation. **It is not a medical device.**
