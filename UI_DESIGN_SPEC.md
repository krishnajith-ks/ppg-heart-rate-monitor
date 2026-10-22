# Camera-Based PPG Heart Rate Monitor — UI & Design System Specification

**Location:** `/home/jojo/Projects/ppg-heart-rate-monitor/UI_DESIGN_SPEC.md`  
**Aesthetic Anchor:** Vladimir Gruev's *Crumple — document workflow management* (`/home/jojo/Projects/ppg-heart-rate-monitor/Crumple_ document workflow management by Vladimir Gruev for heartbeat on Dribbble.jpeg`)  
**Design Philosophy:** Swiss Editorial Minimalism + Biophotonic Precision  
**Version:** 1.0 (Locked Design Specification)  
**Date:** 22 Oct 2026  

---

## 1. Reference Image Analysis & Visual DNA

### 1.1 Aesthetic Extraction from *Crumple*
Vladimir Gruev's *Crumple* design represents the pinnacle of modern editorial product design:
1. **Warm Canvas vs. Sharp Ink:** An organic, tactile paper ecru background contrasted against dense, crisp black typography.
2. **The High-Impact Circular Focal Point:** A single, intense geometric circle in vivid orange-red (`#ff3b19`) breaks through the monochrome layout. In our PPG monitor, this geometric element is given biological purpose: it represents the arterial pulse volume wave.
3. **Hairline Structural Rules:** Thin, precise $1\text{px}$ lines separating navigational zones and card surfaces without heavy shadows or artificial glassmorphism.
4. **Deliberate Elimination of Palette Noise:** All multi-color distraction (greens, blues, secondary oranges) is strictly prohibited. The interface is strictly **monochromatic (ecru, white, black)** with a **single arterial orange-red accent**.

---

## 2. Color System & Design Tokens

```css
:root {
  /* Surface & Background */
  --bg-canvas: #f5f3ef;          /* Warm ecru / editorial paper */
  --bg-surface: #ffffff;         /* Pure white for elevated modules & cards */
  --bg-muted: #ece8e1;           /* Subtle recessed backgrounds */
  
  /* Typography & Ink */
  --ink-primary: #111111;        /* Deep carbon black for headings & primary buttons */
  --ink-secondary: #555555;      /* Editorial body text */
  --ink-tertiary: #888888;       /* Eyebrow labels, timestamps, metadata */
  
  /* Hairline Borders */
  --border-hairline: #dcd7cc;    /* Primary structural hairline */
  --border-subtle: #e8e4dc;      /* Card internal dividers */
  
  /* Single High-Contrast Accent */
  --accent-arterial: #ff3b19;    /* Vivid arterial orange-red (Crumple circle) */
  --accent-arterial-deep: #e6391a;
  --accent-arterial-glow: rgba(255, 59, 25, 0.28);
}
```

---

## 3. Compositional Geometry: Golden Ratio & Rule of Thirds

```
┌───────────────────────────────────────────────┐
│ HEADER: 01 / PPG VITAL MONITOR   [NAV LINKS]  │
├───────────────────────────────┬───────────────┤
│                               │               │
│  MAJOR UNIT (1.618x)          │  MINOR UNIT   │
│  "Pulse from pixels.          │  (1.0x)       │
│   Toss the sensor."           │               │
│                               │   (● 72 BPM)  │  <-- RULE OF THIRDS
│  [ Start Camera ] [ Upload ]  │   Pulse Disc  │      FOCAL POINT
│                               │               │
├───────────────────────────────┴───────────────┤
│ RESTING HEART RATE CATEGORIES TABLE           │
├───────────────────────────────────────────────┤
│ OPTICAL VIEWPORT & CHANNEL SWITCHING PILLS    │
├───────────────────────────────────────────────┤
│ LIVE DSP WAVEFORMS (3 MONOCHROME STACKS)      │
├───────────────────────────────────────────────┤
│ ECE CURRICULUM THEORY CARDS (4 COLUMNS)       │
├───────────────────────────────────────────────┤
│ FOOTER: Developed by Krishnajith KS (6-Click) │
└───────────────────────────────────────────────┘
```

### 3.1 Golden Ratio ($1 : 1.618$) Hero Grid
- The hero section uses CSS Grid with `grid-template-columns: 1.618fr 1fr`.
- The left major column ($1.618\times$) houses the editorial headline, subtitle, and primary call-to-action buttons.
- The right minor column ($1.0\times$) isolates the pulsing arterial circle badge with generous surrounding whitespace.

### 3.2 Rule of Thirds Placement
- When the screen is divided into a $3 \times 3$ grid, the arterial pulse circle aligns precisely with the upper-right power point ($x = 66.6\%, y = 33.3\%$). This immediately directs the user’s gaze to the live physiological reading upon page load.

---

## 4. Typography Hierarchy

| Level | Size | Weight | Line Height | Tracking | Case | Purpose |
|---|---|---|---|---|---|---|
| **Eyebrow** | `0.70rem` | 800 | 1.0 | `+0.18em` | UPPERCASE | Section labels (`01 / PPG VITAL MONITOR`, `OPTICS`) |
| **Hero Title** | `3.00rem` | 900 | 1.05 | `-0.03em` | Sentence | High-impact hook (`Pulse from pixels. Toss the sensor.`) |
| **Section H2**| `1.50rem` | 800 | 1.20 | `-0.02em` | Sentence | Major component headers (`Live Mathematical Waveforms`) |
| **Card H3** | `0.95rem` | 800 | 1.30 | `0.00em` | Sentence | Theory card titles (`Beer-Lambert & Hemoglobin`) |
| **Body** | `0.85rem` | 400 | 1.50 | `0.00em` | Mixed | Descriptive paragraphs and scientific rationale |
| **Monospace**| `0.72rem` | 600 | 1.20 | `+0.05em` | Mixed | Signal parameters (`Fs = 30 Hz`, `f_peak = 1.20 Hz`) |

---

## 5. Component Specifications

### 5.1 The Arterial Pulse Hero Disc
- **Dimensions:** $170\text{px} \times 170\text{px}$ circular disc.
- **Background:** Solid `--accent-arterial` (`#ff3b19`) with a subtle radial gradient to `--accent-arterial-deep` (`#e6391a`).
- **Shadow:** `0 16px 40px rgba(255, 59, 25, 0.28)`.
- **Systolic Pulse Micro-Animation:** On each detected heartbeat (or simulated pulse during playback), the disc expands with a biological curve:
  ```css
  @keyframes systolic-beat {
    0% { transform: scale(1); }
    15% { transform: scale(1.06); }
    30% { transform: scale(0.98); }
    45% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }
  ```
- **Readout:** Large $3.2\text{rem}$ bold BPM numeral centered with a spaced small-caps `BPM` label.

### 5.2 Primary Action Buttons
- **`Start Camera →`:** Solid pitch black background (`#111111`), pure white text (`#ffffff`), $4\text{px}$ crisp border radius, $1\text{px}$ hairline hover shift.
- **`Upload Video`:** Transparent background, $1\text{px}$ solid `#111111` border, `#111111` text. Hover fills to `#111111` with white text.

### 5.3 Resting Heart Rate Categories Table
- Three equal columns: Athletic ($40\text{--}60\text{ BPM}$), Normal Resting ($60\text{--}100\text{ BPM}$), Elevated ($>100\text{ BPM}$).
- Clean white background cards with $1\text{px}$ hairline borders (`#e2ddd3`).
- When the measured BPM falls into a category, that card's border darkens to $2\text{px}$ `#111111` with a discreet $6\text{px}$ `--accent-arterial` dot in the top corner.

### 5.4 Optical Channel Selector Pills
- Four pill buttons: `RGB Normal` | `● Green Channel (Best)` | `Red Channel` | `Blue Channel`.
- Inactive pills: Pure white background, $1\text{px}$ hairline border (`#dcd7cc`), `#555555` text.
- Active pill: Solid `#111111` background, `#ffffff` text, indicating the selected optical filter plane.

### 5.5 Minimalist Waveform Canvases
- Three stacked waveform viewports ($40\text{px}$ height each):
  1. Raw detrended 30 Hz signal.
  2. 4th-order Butterworth bandpass filtered signal.
  3. Spectral power density (FFT magnitude).
- **Styling:** Rendered on crisp white cards with $1\text{px}$ hairline borders. Waveform line is a $1.2\text{px}$ solid `#111111` curve.
- **Peak Highlights:** Detected systolic peaks on the time waveform and the dominant frequency peak on the FFT spectrum are marked with small, crisp `--accent-arterial` (`#ff3b19`) triangular markers. Zero distracting color noise.

### 5.6 Theory Cards (Curriculum Defense Deck)
- Four editorial cards arranged in a 4-column responsive grid:
  1. *01 / OPTICS:* Beer-Lambert law & hemoglobin absorption.
  2. *02 / RESAMPLING:* Uniform 30 Hz grid interpolation.
  3. *03 / FILTERING:* Butterworth IIR biquad SOS cascade.
  4. *04 / ESTIMATION:* Time-domain IBI vs. FFT spectral peak.
- Monochromatic styling with clean uppercase tags and crisp typography.

### 5.7 The Silent Presenter Easter Egg
- Located in the footer: `<span class="presenter-trigger">Developed by Krishnajith KS</span>`.
- Absolutely **no hint text**, tooltips, or clues.
- An invisible counter tracks clicks within a $3\text{-second}$ window:
  - If clicks reach **6**, the full DSP Presentation Dashboard smoothly slides into view with video upload controls and expanded math statistics.
  - An inconspicuous `← Exit to Public UI` button allows returning at any time.

---

## 6. Mobile & Laptop Responsive Breakpoints

- **Laptop / Desktop ($> 992\text{px}$):**
  - Hero layout spans 2 columns ($1.618 : 1.0$).
  - Theory cards lay out in 4 columns.
  - Waveforms display full 30-second time horizon.
- **Mobile Phones ($< 768\text{px}$):**
  - Hero collapses to a vertical stack; pulse circle remains centered.
  - Theory cards scroll horizontally or stack vertically.
  - Video viewport maintains full touch-friendly finger placement guidance.
