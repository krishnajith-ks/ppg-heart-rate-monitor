# PPG Heart Rate Monitoring Using a Smartphone Camera

**Project Proposal, Technical Specification, and Build Guide for the AI Coding Agent**

| | |
|---|---|
| **Project type** | Academic Digital Signal Processing (DSP) project, built as a complete public website |
| **Owner** | Jojo (Krishnajith KS), 3rd-year ECE student, beginner in JavaScript |
| **Builder** | An AI coding agent (for example Google Antigravity) that writes all the code |
| **Status** | Brainstorming finished. This file is the final brief. |

> **To the AI coding agent: read this entire file before writing any code.**
> The owner is not a JavaScript developer. You write the code, and the owner reviews, tests, and has to *explain it in a viva*. So: keep the code simple, readable, and commented. Section 13 is your rulebook. Section 14 is your build order. When this file and your instincts disagree, follow this file. If something is unclear, make the simplest reasonable choice, state it in one line, and continue.

---

## Table of contents

1. Introduction
2. Objectives
3. Scope and non-goals
4. Background theory (simple version)
5. System overview
6. The DSP pipeline in detail
7. Website structure and pages
8. Measurement state machine
9. Software architecture and file layout
10. Camera, privacy, and the temporary replay clip
11. Performance and memory rules
12. Browser and device support
13. Rules for the AI coding agent
14. Build order with acceptance criteria
15. Testing and validation plan
16. Limitations and future work
17. Draft abstract and title options
18. Glossary
19. Final checklist

---

## 1. Introduction

Heart rate is one of the most basic vital signs. It is usually measured with a pulse oximeter, a chest strap, or a smartwatch. These need dedicated hardware. Almost everyone, however, carries a smartphone with a camera and a flashlight.

This project builds a **website** that measures heart rate using only a phone's camera. The user places a fingertip over the rear camera while the flash is on. With every heartbeat, the amount of blood in the fingertip changes slightly. That changes how much light passes through the finger, and the camera sees a tiny brightness change. The website converts this change into a signal and uses **Digital Signal Processing (DSP)** to extract the heart rate.

The technique is called **photoplethysmography (PPG)**. The project's value is in the DSP: sampling, filtering, time-domain analysis, and frequency-domain analysis, all running live in the browser and all made visible through graphs.

The project is also built as a real website, not just a lab demo. It runs on a phone with no app install and no login, and it never uploads video or data anywhere.

## 2. Objectives

1. Capture a PPG signal from a fingertip using a phone camera in a web browser.
2. Process the signal with a proper DSP chain: resampling, detrending, band-pass filtering, peak detection, and FFT analysis.
3. Estimate heart rate (BPM) by **two independent methods** (time domain and frequency domain) and compare them.
4. Show the processing visually with live graphs, so the DSP can be explained step by step.
5. Provide a hidden **Admin Panel** that exposes the camera view, every processing stage, and the main calculations, for demonstration and the viva.
6. Keep the app fast and light on memory, and keep all data on the user's device.
7. Be honest about accuracy: validate against a reference device and report the error.

## 3. Scope and non-goals

### In scope

- Heart rate (BPM) from fingertip PPG.
- Live graphs of raw signal, filtered signal, FFT spectrum, and BPM trend.
- Measure page, About page, hidden Admin Panel.
- A temporary in-memory replay clip of the last measurement (Admin Panel only).
- A hidden **video upload demo mode** inside the Admin Panel, for presentations and for testing without a live camera (works on laptop and phone).
- Live camera measurement is **phone-exclusive**. On a laptop the Measure page shows a notice instead of asking for the camera.

### Locked decisions

- **No backend, no database, no login, no stored history.** It is a static website.
- **Camera is used only inside the web page.** Nothing is saved to the phone gallery.
- **All DSP runs in the browser on the live camera stream.**

### Out of scope (do not build)

- Blood pressure. This is only a talking point for future work. Never implement it or display it as a measurement.
- SpO2 (blood oxygen). Optional experiment only, and only after everything else is done and the owner asks for it.
- User accounts, cloud storage, analytics, ads, or any network upload of video or readings.
- Any medical claims.

## 4. Background theory (simple version)

**What the camera sees.** With the flash on and a finger pressed over the lens, light passes through the fingertip tissue. Blood absorbs light. When the heart pushes blood into the finger (systole), more light is absorbed and the image gets very slightly darker. Between beats, it gets very slightly brighter. This tiny, repeating brightness change is the PPG signal.

**Why the green channel.** Hemoglobin in blood absorbs green light strongly, so the pulse-related change is largest in the green channel. The project uses the average green value of each frame as its signal.

**Why it counts as DSP.** Each video frame is reduced to **one number** (the average green value). Frame after frame, these numbers form a 1-D discrete-time signal x[n]. From that point on, the work is pure DSP, not image processing.

**Heart rate range.** A human heart rate of 30 to 240 BPM equals 0.5 to 4 Hz. Anything outside that frequency range is noise, drift, or interference.

**Sampling.** The camera runs at about 30 frames per second, so fs is about 30 Hz and the Nyquist frequency is 15 Hz. The heart signal (at most 4 Hz) is far below Nyquist, so the sampling is adequate with no aliasing of the pulse.

## 5. System overview

```
 Fingertip over camera + flash
            |
            v
   getUserMedia video stream (about 30 fps, 640x480)
            |
            v
   Per frame: draw to 64x64 canvas -> mean of green channel -> 1 number
            |
            v
   Ring buffer of (timestamp, value) samples
            |
            v
   Resample to uniform fs -> remove DC/trend -> band-pass filter (0.5-4 Hz)
            |
      +-----+-----------------+
      v                       v
 Peak detection           Windowed FFT
 BPM_peak = 60/interval   BPM_fft = 60 x f_peak
      +-----------+-----------+
                  v
     Agreement check + quality score
                  v
        Result and live graphs
```

Everything above runs on the phone. The only server involved is a static host that delivers the page.

## 6. The DSP pipeline in detail

All numeric constants below are **starting values**. Put them in one config file (`src/config.js`) so they can be tuned without touching the logic.

### 6.1 Frame to sample

- Request the rear camera: `facingMode: "environment"`, ideal 640x480, ideal frame rate 30.
- Try to turn the torch on with `track.applyConstraints({ advanced: [{ torch: true }] })`. If unsupported, continue and show a hint to use a bright room.
- For each video frame, draw the video to a **64x64 offscreen canvas** created with `getContext("2d", { willReadFrequently: true })`.
- Read the pixels once with `getImageData`, and compute the **mean R, mean G, and mean B** across the canvas.
- Store `{ t, g }` where `t` is the frame timestamp in seconds and `g` is the mean green value.
- Also keep the mean red value for finger detection.
- Use `video.requestVideoFrameCallback` when available, because it gives real frame timestamps. Fall back to `requestAnimationFrame` with `performance.now()`.

### 6.2 Measure the real sampling rate

Browsers do not guarantee 30 fps. Compute `fs_measured = (number of samples - 1) / (t_last - t_first)` over the current window and display it. If it is below 20 Hz, show a warning that the reading may be unreliable.

### 6.3 Resample to a uniform grid

Frame timestamps are slightly irregular, but filters and the FFT assume uniform sampling. Before filtering, **linearly interpolate** the samples onto a uniform time grid at `fs = 30 Hz` (or at the measured rate, rounded). This step is part of the DSP story and should be shown in the Admin Panel calculations.

### 6.4 Finger detection

A finger is present when **all** of these hold (starting thresholds, to be tuned on a real phone):

- Mean red value is above about 120 (on a 0-255 scale), and red is clearly greater than green.
- The signal variance over the last 2 seconds is above a small epsilon (not a flat, dead signal).
- The mean values are not saturated at 255 for every frame.

If any fails, show "No finger detected" and **do not compute or display BPM**.

### 6.5 Detrend

Remove slow drift with a simple method: subtract the **moving average** over about 1.5 seconds, or subtract a linear fit over the window. Then subtract the mean (DC). Keep it simple.

### 6.6 Band-pass filter (Butterworth, 0.5 to 4 Hz)

Implement the filter **by hand** as a cascade of two biquad (second-order IIR) sections, **recomputed from the measured sampling rate**:

1. A 2nd-order Butterworth **high-pass** at 0.5 Hz (removes drift).
2. A 2nd-order Butterworth **low-pass** at 4 Hz (removes high-frequency noise).

Together this is a 4th-order Butterworth-style band-pass. Use the standard biquad design formulas with `Q = 1/sqrt(2)` (about 0.7071):

```
w0    = 2 * pi * fc / fs
alpha = sin(w0) / (2 * Q)

Low-pass:                         High-pass:
 b0 = (1 - cos(w0)) / 2            b0 =  (1 + cos(w0)) / 2
 b1 =  1 - cos(w0)                 b1 = -(1 + cos(w0))
 b2 = (1 - cos(w0)) / 2            b2 =  (1 + cos(w0)) / 2

Both:  a0 = 1 + alpha,  a1 = -2 * cos(w0),  a2 = 1 - alpha
Normalize every coefficient by dividing by a0.
```

Difference equation per section (Direct Form I):

```
y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
```

**Reference coefficients at fs = 30 Hz** (use these to verify the implementation, they come from the same formulas):

| Section | b0 | b1 | b2 | a1 | a2 |
|---|---|---|---|---|---|
| High-pass 0.5 Hz | 0.92862378 | -1.85724756 | 0.92862378 | -1.85214649 | 0.86234863 |
| Low-pass 4 Hz | 0.10844744 | 0.21689488 | 0.10844744 | -0.87727063 | 0.31106039 |

The filter has a start-up transient, which is one reason for the settling phase (section 8).

### 6.7 Time-domain BPM (peak detection)

On the filtered signal:

1. Find local maxima (a sample larger than both neighbors).
2. Keep only peaks above a threshold of about **0.3 x the standard deviation** of the filtered window.
3. Enforce a **minimum distance between peaks of about 0.33 s** (so at most about 180 BPM). Keep the taller peak when two are too close.
4. Compute inter-peak intervals. Discard intervals shorter than 0.3 s or longer than 2.0 s.
5. Need at least **5 valid peaks**, otherwise report "not enough data".
6. `BPM_peak = 60 / median(interval)`. The median is used so that a single missed or extra beat does not wreck the result.

Mark the detected peaks on the filtered graph.

### 6.8 Frequency-domain BPM (FFT)

1. Take the filtered, uniformly sampled window of `N` samples (about 10 to 12 s, so N is roughly 300 to 360).
2. Multiply by a **Hann window** to reduce spectral leakage.
3. **Zero-pad** to `2048` points, then run a **radix-2 FFT implemented by hand**.
4. Compute the magnitude spectrum. Search for the largest peak only inside **0.5 to 4 Hz**.
5. `BPM_fft = 60 x f_peak`.
6. Optional: refine the peak with parabolic interpolation.

Important teaching point: zero-padding **interpolates** the spectrum (smoother, finer frequency grid), but the true resolution stays `delta_f = fs / N`. With a 10 s window, that is 0.1 Hz, which is 6 BPM. The About page and Admin Panel should show this.

### 6.9 Agreement and quality

- **Agreement:** `diff = |BPM_peak - BPM_fft|`. If `diff <= 5`, agreement is good. Otherwise, mark confidence low.
- **Quality score (SNR):** power in a narrow band (about plus or minus 0.2 Hz) around the FFT peak, divided by the power in the rest of the 0.5-4 Hz band. Map it to **Good / Weak** with tunable thresholds.
- **Final displayed BPM:** show the FFT BPM and the peak BPM side by side. If they agree, show their average as the headline number. If they disagree, show both with a "low confidence" label instead of picking one silently.

### 6.10 Reference test vector (the AI must make this pass)

Create a synthetic signal and check the pipeline gives about 72 BPM:

```
fs = 30 Hz, duration = 12 s, t = 0, 1/30, ...
x[n] = 100 + 0.5*sin(2*pi*1.2*t) + 0.05*t + noise(std 0.1)
```

Expected: the FFT peak is near 1.2 Hz and `BPM_fft` is about 72 (within about plus or minus 1.5 BPM). Peak detection should also give about 72. Provide this as a simple test (a `/test` route or a console self-test) so the owner can show it works without a camera.

## 7. Website structure and pages

The site is a small single-page app with three routes. Visual styling (colors, fonts, spacing) is **left to the AI and the design tools**, with these constraints only: mobile-first, clean and readable, high-contrast graphs, consistent style across all pages, large readable BPM number, and a heartbeat-style loading animation. Do not ask the owner for a color theme. Pick a coherent one and move on.

| Page | Route | Purpose |
|---|---|---|
| Measure | `/` | The main page: take a measurement with live graphs |
| About | `/about` | Explain the project and the DSP in plain language |
| Admin Panel | `/admin` | Hidden diagnostics view. No login. |

The Admin Panel is reachable **only through a hidden link on the footer copyright text**. It is not in the navigation. It needs no login because it stores nothing and shows only the user's own camera feed and the DSP numbers.

### 7.1 Measure page

Top to bottom on a phone, a two-column grid on a wide screen:

1. **Status bar:** camera state, measured fps, signal quality (Good / Weak / No finger).
2. **Instruction and progress area:** changes with the state machine (section 8). During measurement it shows a progress ring or bar and the text **"Measuring your BPM... keep your finger still"** with a heartbeat-line animation.
3. **BPM card:** large BPM number, with peak-detection BPM and FFT BPM shown side by side, plus the agreement indicator.
4. **Raw signal graph:** scrolling 10 s window.
5. **Filtered signal graph:** same window after filtering, with detected peaks marked.
6. **FFT spectrum graph:** 0 to 5 Hz, the 0.5-4 Hz band shaded, the dominant peak labeled.
7. **BPM trend graph:** BPM per second during the session.
8. **Buttons:** Start / Measure again. A short "not a medical device" notice sits near the result.

**Graph rules:** every axis has a label with units (s, Hz, BPM). Use plain `<canvas>`, no chart libraries.

### 7.2 About page

Plain language, short sections, a simple diagram:

- What the project does and why.
- How PPG works (the finger and the camera).
- The processing pipeline as numbered steps (reuse section 5's diagram as an image or drawn element).
- Why green, why 0.5-4 Hz, why two methods.
- Honest limitations (section 16) and the **"This is an educational tool, not a medical device"** notice.
- A short "how to measure well" tips list (cover the lens and flash fully with a fingertip, press gently, stay still, keep the room lit, rest your hand on a table).
- A privacy note: video is processed on your device and never uploaded.

### 7.3 Admin Panel (`/admin`)

A diagnostics page for demonstrating the system. Sections:

1. **Camera view**
   - Live preview of the camera stream (`<video>`, muted, `playsInline`).
   - A **Normal / Green channel** toggle button. Green-channel view draws each frame to a canvas keeping only green values (zero the red and blue channels, or show green as grayscale). Render at low resolution (about 160x120) and only while the toggle is on.
   - An overlay box showing the 64x64 sampling region.
2. **Last capture replay** (explanation mode)
   - After each measurement, the recorded clip appears in a video player with play, pause, and scrub.
   - A **cursor on the graphs stays synced to the video's `currentTime`**, so the audience sees the brightness change in the clip line up with the signal. Use the stored sample array and timestamps for the graphs. Do not re-analyze the clip.
   - The Normal / Green channel toggle also works on the replayed clip.
   - Show clip duration and size, plus a **Discard clip** button. Only one clip is kept. A new measurement replaces it.
   - If there is no clip yet, show "No capture yet. Run a measurement first."
   - State on screen that the clip is compressed and for explanation only.
3. **Graph section** (all stages, labeled in processing order)
   1. Raw green-channel signal
   2. Detrended signal
   3. Filtered signal (final), with peaks marked
   4. FFT spectrum with the band shaded and the dominant peak labeled
   5. Filter frequency response (magnitude vs frequency, computed from the biquad coefficients)
   6. BPM trend over the session
4. **Calculations panel** (live values with formulas showing substituted numbers)
   - Sampling: measured fs (Hz), sample count N, window duration (s), Nyquist (fs/2), frequency resolution `delta_f = fs/N`, zero-padded FFT size
   - Signal: DC mean, standard deviation, mean red value (finger detection)
   - Filter: type, passband (0.5-4 Hz), biquad coefficients (b0, b1, b2, a1, a2 for each section)
   - Time domain: number of peaks, median inter-peak interval (s), `BPM_peak = 60 / interval`
   - Frequency domain: dominant frequency `f_peak` (Hz), `BPM_fft = 60 x f_peak`
   - Comparison: `|BPM_peak - BPM_fft|`, agreement flag
   - Quality: SNR value and label

Example line: `BPM_peak = 60 / 0.82 s = 73.2 BPM`

5. **Video upload (demo mode), hidden by default**
   - Inside the Admin Panel, put a **collapsed "Demo tools" section** (closed on load). Inside it is an **Upload video** button. There is **no upload control anywhere else** on the site, so a normal visitor never sees it.
   - Use `<input type="file" accept="video/*">`. Never use the `capture` attribute. Accept mp4, webm, and mov.
   - Processing: load the file into a hidden `<video>` through an object URL (muted, `playsInline`), play it at **normal speed (1x)**, and read frames with `requestVideoFrameCallback`, using its `mediaTime` as the timestamp. Fall back to `requestAnimationFrame` plus `video.currentTime` if unsupported. Feed the frames into the **same frame sampler and the same `dspEngine`** as the live camera. Do not write a second DSP path.
   - Use the same state machine as a live measurement (finger detection, then the 3 s settling period which is discarded, then measuring, then result). The footage needs at least about 10 s of fingertip video. If it is shorter, say so in plain language.
   - While it plays, the video, the graphs, and the calculations all update in real time, so a presentation looks live. After it finishes, the video can be replayed with the graph cursor synced to `currentTime`, exactly like the recorded replay clip. The Normal / Green channel toggle works on it too.
   - Label every result from a file clearly: **"Result from uploaded video (demo)"**. It must never be confused with a live measurement.
   - The file is never uploaded anywhere. Revoke the object URL on Clear, on replacing the file, and on leaving the page. Only one file at a time, plus a **Clear** button.
   - Works on laptop and phone.
   - Note on screen that videos from a phone's camera app are compressed and may have auto-exposure changes, so results can differ slightly from a live measurement.

Admin-only extras (green view, extra graphs, recording replay, video upload) run **only while the Admin Panel is open**.

## 8. Measurement state machine

Implement the measurement as an explicit state machine, so the UI is always in exactly one known state:

| State | What the user sees | Moves to next when |
|---|---|---|
| `IDLE` | "Tap Start" | User taps Start |
| `REQUESTING_CAMERA` | "Allow camera access" | Permission granted (or `ERROR_PERMISSION` if denied) |
| `WAITING_FOR_FINGER` | "Cover the camera and flash with your fingertip" | Finger detected for about 1 s |
| `SETTLING` (about 3 s) | "Hold still, getting ready" with progress | 3 s elapsed. These samples are **discarded**. |
| `MEASURING` (about 12 s) | "Measuring your BPM... keep your finger still" with progress ring and live graphs | 12 s of valid data collected |
| `RESULT` | BPM, agreement, quality, graphs frozen | User taps Measure again (returns to `WAITING_FOR_FINGER`) |

Rules:

- If the finger lifts during `SETTLING` or `MEASURING`, **pause the timer**, show "Finger lost, put it back", and resume when detected. If it is lost for more than about 5 s, go back to `WAITING_FOR_FINGER`.
- Live BPM may be shown once at least 6 s of data exists. The **final result** uses the whole measuring window.
- Error states to handle with plain-language messages: camera permission denied, no camera found, insecure context (not HTTPS), tab hidden (pause), very low frame rate, no valid peaks.
- When the measurement ends, **stop the camera** (`track.stop()` on every track) unless the Admin Panel is open and needs the live view.

## 9. Software architecture and file layout

Stack: **Vite + React + React Router**, plain CSS or Tailwind, no other runtime dependencies unless the owner approves.

Suggested layout (adapt names if needed, but keep DSP separate from UI):

```
src/
  config.js                 all tunable constants (thresholds, window sizes)
  dsp/
    ringBuffer.js           fixed-size circular buffer (Float32Array)
    resample.js             linear interpolation to a uniform grid
    detrend.js              moving-average / linear detrend
    biquad.js               biquad design + filtering (high-pass, low-pass)
    peaks.js                peak detection and interval/BPM calculation
    fft.js                  hand-written radix-2 FFT + Hann window
    quality.js              SNR and agreement logic
    pipeline.js             runs all steps, returns a result object
    pipeline.test.js        the synthetic 72 BPM test vector
  camera/
    cameraSession.js        getUserMedia, torch, start/stop, cleanup
    frameSampler.js         64x64 canvas, mean R/G/B, timestamps
    clipRecorder.js         MediaRecorder for the temporary replay clip
    videoFileSource.js      plays an uploaded video file and feeds frames to the same sampler
  state/
    measurementMachine.js   the state machine from section 8
    dspEngine.js            the ONE shared engine used by Measure and Admin
  components/
    SignalGraph.jsx         canvas line graph (labels, units, peak markers)
    SpectrumGraph.jsx       canvas FFT graph
    ProgressRing.jsx
    HeartbeatLoader.jsx
    BpmCard.jsx
    StatusBar.jsx
  pages/
    Measure.jsx
    About.jsx
    Admin.jsx
  App.jsx                   routes and footer with the hidden admin link
```

**Key rule:** the Measure page and the Admin Panel both read from the **same** `dspEngine`. Never duplicate DSP code.

**Data flow:**

```
frame -> frameSampler -> ringBuffer (refs, not React state)
      -> every 1 s: pipeline.js -> result object -> React state (small values only)
      -> every animation frame: canvas graphs read the buffers directly
```

## 10. Camera, privacy, and the temporary replay clip

- Use the camera **only** through `getUserMedia` inside the page. Never use `<input type="file" capture>`, because that opens the phone's camera app and saves to the gallery.
- **No video or data is ever uploaded.** There is no server.
- The replay clip: use `MediaRecorder` on the same stream during the `MEASURING` state only, capped at **20 s**, at low bitrate (about 1 Mbps).
  - Choose a supported type with `MediaRecorder.isTypeSupported` (WebM on Chrome and Android, MP4 on iOS Safari). If recording is unsupported, hide the replay section and keep the live view.
  - Keep the clip in memory as one `Blob` (roughly 2 MB) and play it through an object URL.
  - On **Discard**, on a new measurement, or on page leave, call `URL.revokeObjectURL` and drop the reference.
  - **Do not** put the clip in `localStorage`, `IndexedDB`, or any other storage.
  - **Do not** add any download or share button for the clip.
  - The clip is lossy-compressed. **DSP always runs on the live stream, never on the clip.** The clip is for explanation only.
  - If recording causes dropped frames on a phone, lower the bitrate, or record only when the Admin Panel is open.
- **Uploaded video files** (Admin Panel demo mode) follow the same privacy rules: they stay in the browser, are played from an object URL, and are never uploaded, stored, or offered as a download.
- **Privacy note on the About page:** processing happens on-device, nothing is uploaded, and the replay clip lives only in memory until discarded or the page is reloaded.

## 11. Performance and memory rules

These are strict. The owner specifically cares about browser memory use and lag.

1. Keep samples in a **fixed-size ring buffer** (`Float32Array`, about 300 to 400 samples). **Never grow an array without a limit.**
2. Keep signal data in **refs, not React state**. Only BPM values, quality, and status go in state, and they update about once per second.
3. Run the filter, peak detection, and FFT **once per second**. Draw graphs **every animation frame** on `<canvas>`.
4. Reuse **one** offscreen canvas for frame sampling. Do not create canvases or arrays inside the per-frame loop.
5. Request low resolution (about 640x480 at 30 fps), and sample on a 64x64 canvas.
6. Cancel all animation and frame callbacks, stop camera tracks, and revoke object URLs when leaving a page or finishing.
7. Pause measuring when the tab is hidden.
8. No chart libraries and no DSP libraries. Hand-written code stays small and explainable.
9. Check on a real Android phone with Chrome DevTools: frame time should stay under about 33 ms and memory should stay flat during a 15 s run. Report what was observed.

## 12. Browser and device support

- **HTTPS is required** for camera access (localhost is exempt). Test on a phone using the deployed preview URL or an HTTPS tunnel. A plain `http://192.168.x.x` address will be blocked.
- **Android + Chrome:** best case. The torch is usually supported.
- **iPhone + Safari:** the camera works, but the **torch is not available from a website**, so readings need a bright room and may be weaker. Show a one-line hint for this case.
- **Laptops and desktops:** the whole site must load and work, but **live camera measurement is phone-only**.
  - Detect a phone-like device with `matchMedia("(pointer: coarse)")` or `navigator.maxTouchPoints > 0`. Tablets count as phones.
  - On a laptop, the Measure page does **not** request the camera. It shows: "Live heart-rate measurement works on phones. Open this site on your phone to measure." The About page works normally.
  - On a laptop, the Admin Panel hides the live camera view and shows the same note. The **video upload demo mode still works**, and is the way to present the system from a laptop.
  - If a phone has no rear camera or the user denies permission, show a clear message instead of a blank screen.
- Browsers cannot fully lock auto-exposure, which is part of why the settling phase exists.
- Deploy to a free static host with HTTPS (Firebase Hosting, Vercel, or Netlify).

## 13. Rules for the AI coding agent

**Do:**

1. Follow this file. State any assumption in one line and keep going.
2. Keep code **simple and heavily commented in plain language**: what each step does and why it exists. The owner must be able to explain it.
3. Implement the **filter, peak detection, FFT, and resampling by hand** (no DSP libraries), using the formulas in section 6.
4. Put all tunable constants in `src/config.js`.
5. Show every number the owner might be asked about in the Admin Panel calculations.
6. After each milestone, give a **short summary**: what was built, how to run it, what to check on a phone.
7. Handle every failure state in section 8 with a clear, friendly message.
8. Make graphs readable on a small phone screen, with labeled axes and units.
9. Keep the visual design clean, mobile-first, and consistent. Choose the style yourself.

**Do not:**

1. Do not add a backend, database, login, analytics, or any network request that sends video or readings anywhere.
2. Do not implement blood pressure or SpO2 unless the owner explicitly asks.
3. Do not claim medical accuracy anywhere. Never write "accurate", "clinical", "diagnose", or "medical-grade" in the UI. Use "estimate", and keep the not-a-medical-device notice.
4. Do not show a BPM when no finger is detected. Never show a made-up or placeholder BPM as if it were a measurement.
5. Do not add chart libraries or DSP libraries.
6. Do not store the replay clip anywhere except in memory, and do not add a download button.
7. Do not run DSP on the recorded clip. DSP uses the live stream only.
8. Do not put per-frame signal data in React state.
9. Do not create files, folders, or dependencies beyond what is needed. Ask before adding any dependency.
10. Do not silently "fix" a DSP result to look better (for example by clamping BPM). If the data is bad, say so.
11. Do not show the video upload control outside the collapsed "Demo tools" section of the Admin Panel, and never mix uploaded-video results with live results without the "(demo)" label.
12. Do not enable any backend, database, authentication, or server-side feature that a project template may offer. This is a static, front-end-only site.

**When something fails:** explain the cause in simple terms, propose the smallest fix, and apply it. Do not rewrite large parts of the project to fix a small bug.

## 14. Build order with acceptance criteria

Build in this order. Do not start a milestone until the previous one meets its acceptance criteria.

**Milestone 1: Project setup**
- Vite + React + Router project runs. Three routes exist. Footer has the hidden admin link.
- *Accept:* `npm run dev` works, all three routes load.

**Milestone 2: DSP engine without a camera**
- Implement `ringBuffer`, `resample`, `detrend`, `biquad`, `peaks`, `fft`, `quality`, `pipeline`.
- Pass the **synthetic 72 BPM test** (section 6.10) and verify the biquad coefficients against the reference table (section 6.6).
- *Accept:* test prints about 72 BPM for both methods, and coefficients match to about 6 decimals at fs = 30.

**Milestone 3: Camera capture and sampling**
- Camera session, torch attempt, 64x64 sampling, timestamps, measured fs shown.
- *Accept:* on a real phone over HTTPS, the raw green value changes when a finger covers the lens, and fs is shown.

**Milestone 4: Live graphs on the Measure page**
- Canvas graphs for raw, filtered with peaks, FFT, and BPM trend, fed from the shared `dspEngine`.
- *Accept:* graphs scroll smoothly, a real fingertip shows a clear periodic waveform, the FFT shows a clear peak.

**Milestone 5: Measurement flow**
- The full state machine, finger detection, settling, progress ring, "Measuring your BPM" message, result view, error messages.
- *Accept:* a complete measurement works start to finish, lifting the finger pauses the timer, and no BPM appears without a finger.

**Milestone 6: Admin Panel**
- Camera view with the green-channel toggle, all six graphs, the calculations panel, and the replay clip with synced graph cursor and Discard button.
- *Accept:* every value listed in section 7.3 appears and updates, the replay stays in sync, and the clip is gone after Discard or reload.

**Milestone 6b: Video upload demo mode (Admin Panel)**
- Collapsed "Demo tools" section, file picker, playback through the shared sampler and engine, labeled demo results, synced replay, Clear button.
- *Accept:* a pre-recorded fingertip video uploaded on a laptop produces graphs, BPM, and calculations. The upload control is not visible until "Demo tools" is opened inside the Admin Panel. Clear removes the file and revokes the URL.

**Milestone 7: About page and polish**
- About content, privacy and safety notices, tips, responsive layout, loading animation.
- *Accept:* reads clearly on a small phone, all notices present.

**Milestone 8: Performance pass and deployment**
- Check frame time and memory (section 11). Fix leaks. Deploy to static hosting over HTTPS.
- *Accept:* a 15 s measurement runs without dropped frames or growing memory on a real Android phone, and the deployed URL works on a phone.

## 15. Testing and validation plan

**Automated or self-tests**
- The synthetic 72 BPM vector (section 6.10).
- Biquad coefficients versus the reference table.
- Extra synthetic cases: 48 BPM (0.8 Hz), 120 BPM (2.0 Hz), and a flat signal (expect "no valid data").

**Real-world validation (needed for the report and the viva)**
- Compare against a smartwatch or pulse oximeter, at rest, for at least **5 to 10 readings**.
- Record: reference BPM, `BPM_peak`, `BPM_fft`, and the quality label for each.
- Report the **mean absolute error** in BPM for each method and for the combined value.
- Note the conditions: phone model, lighting, torch on or off.
- State limitations observed (motion, finger pressure, cold fingers, ambient light).

**Manual checklist on a phone**
- Camera permission denied: message is clear.
- Finger removed mid-measurement: timer pauses and resumes.
- Tab switched away: measurement pauses.
- Page reload: replay clip is gone.
- Nothing appears in the phone gallery after measuring.

## 16. Limitations and future work

**Honest limitations (also shown on the About page)**
- This is an educational estimate, **not a medical device**.
- Motion, finger pressure, cold fingers, and ambient light all affect the signal.
- Frame rate is limited to about 30 fps and varies between phones.
- Spectral resolution is limited by the window length (about 6 BPM for 10 s, before interpolation).
- iPhone Safari cannot turn on the torch from a website.
- Browsers cannot fully lock exposure, so brightness can drift.

**Future work (talking points only)**
- Heart rate variability (HRV) from peak intervals.
- SpO2 estimation using red and green or red and blue channel ratios.
- Blood pressure estimation from PPG waveform features, which would need calibration data and proper clinical validation.
- A signal quality index that rejects bad windows automatically.
- Optional stored history and accounts, if ever needed.

## 17. Draft abstract and title options

**Title options**
1. PPG Heart Rate Monitoring Using a Smartphone Camera *(recommended)*
2. Camera-Based PPG Heart Rate Monitor
3. Heart Rate Monitoring Using Smartphone PPG

**Draft abstract (edit freely)**

Heart rate is a fundamental vital sign, yet its measurement usually requires dedicated hardware. This project presents a browser-based system that estimates heart rate from fingertip video captured by a smartphone camera, using photoplethysmography (PPG) and digital signal processing. The mean green-channel intensity of each video frame forms a discrete-time signal, which is resampled to a uniform rate, detrended, and filtered with a 0.5 to 4 Hz Butterworth band-pass built from cascaded biquad sections. Heart rate is then estimated by two independent methods: peak detection in the time domain and a windowed, zero-padded FFT in the frequency domain, with their agreement used as a confidence check. The processing runs entirely on the user's device and is visualised live through raw, filtered, and spectral plots, along with a diagnostic panel that exposes each calculation. The system is validated against a reference device, and its limitations are discussed. The result is a low-cost, hardware-free, and transparent demonstration of core DSP concepts, including sampling, filtering, and spectral analysis, in a practical health-monitoring application.

## 18. Glossary

- **PPG (photoplethysmography):** measuring blood volume changes using light.
- **DSP:** digital signal processing, which means processing signals as sequences of numbers.
- **Sampling rate (fs):** how many samples per second. Here, about 30 Hz.
- **Nyquist frequency:** fs/2, the highest frequency that can be represented without aliasing.
- **Detrending:** removing slow drift and the DC offset.
- **Butterworth filter:** a filter with a maximally flat passband (no ripple).
- **Biquad:** a second-order IIR filter section. Cascaded biquads build higher-order filters stably.
- **IIR:** infinite impulse response, a filter that uses past outputs as well as past inputs.
- **FFT:** fast Fourier transform, which turns a signal into its frequency content.
- **Window function (Hann):** tapering applied before the FFT to reduce spectral leakage.
- **Zero-padding:** adding zeros before the FFT to get a smoother (interpolated) spectrum.
- **Spectral resolution:** the smallest frequency difference the FFT can truly distinguish, equal to fs/N.
- **SNR:** signal-to-noise ratio.
- **BPM:** beats per minute, equal to 60 times the frequency in Hz.
- **Ring buffer:** a fixed-size circular array that overwrites its oldest data.
- **Torch:** the phone's flashlight, used here as a steady light source.

## 19. Final checklist

**Before declaring the project done, confirm every item:**

- [ ] Static site, no backend, no login, no history, no uploads
- [ ] Camera only through `getUserMedia`, nothing saved to the gallery
- [ ] Green-channel mean sampled from a 64x64 canvas
- [ ] Resampling, detrending, and the 0.5-4 Hz Butterworth biquad cascade implemented by hand
- [ ] Peak detection and FFT both implemented by hand, both BPMs shown with an agreement check
- [ ] Synthetic 72 BPM test passes and biquad coefficients match the reference table
- [ ] Measurement flow: finger detection, settling, "Measuring your BPM" progress, result
- [ ] No BPM shown without a finger
- [ ] Live graphs: raw, filtered with peaks, FFT, BPM trend, all axes labeled with units
- [ ] Admin Panel: camera view with green toggle, all graphs, calculations, synced replay clip with Discard
- [ ] Replay clip held only in memory, no download button, cleared on reload
- [ ] Video upload exists only inside the collapsed "Demo tools" in the Admin Panel, results labeled "(demo)", file never uploaded
- [ ] Live camera measurement is phone-only, and laptops see a clear notice while About, Admin, and video upload still work
- [ ] About page with privacy note, limitations, and the not-a-medical-device notice
- [ ] Memory flat and no dropped frames over a 15 s run on a real Android phone
- [ ] Deployed over HTTPS and tested on a real phone
- [ ] Validation table against a reference device completed
