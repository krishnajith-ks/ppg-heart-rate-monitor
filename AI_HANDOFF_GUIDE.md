# Master AI Handoff & Continuity Guide

**File Path:** `/home/jojo/Projects/ppg-heart-rate-monitor/AI_HANDOFF_GUIDE.md`  
**Target Repository:** `github.com/krishnajith-ks/ppg-heart-rate-monitor`  
**Author:** Jojo (Krishnajith KS), 3rd-Year ECE  
**Document Purpose:** Complete executive instructions for any subsequent AI assistant or build session.  
**Date:** 22 Oct 2026  

---

## 1. Locked Decisions (Do Not Alter)

1. **Visual Theme & Palette (Firm Rule):**
   - Strictly modeled after Vladimir Gruev's *Crumple* design (`Crumple_ document workflow management by Vladimir Gruev for heartbeat on Dribbble.jpeg`).
   - Allowed colors: Warm ecru (`#f5f3ef`), stark white (`#ffffff`), carbon black (`#111111`), hairline border (`#dcd7cc`), and arterial orange-red (`#ff3b19`).
   - **STRICT PROHIBITION:** Do NOT introduce greens, blues, or random secondary oranges to buttons, text, badges, or backgrounds. Keep it strictly monochromatic with the single `#ff3b19` arterial pulse accent.
2. **Composition & Grid:**
   - Golden Ratio ($1.618 : 1$) hero grid (`grid-template-columns: 1.618fr 1fr`).
   - Rule of Thirds upper-right placement for the pulsating circular BPM badge.
   - Flowing, scrollable vertical editorial layout (not a cramped single-screen box).
3. **Primary vs. Secondary Action:**
   - `Start Camera →` is the high-contrast primary button (solid `#111111`).
   - `Upload Video` is the subtle secondary action.
4. **Silent Presenter Easter Egg:**
   - Footer contains: `Developed by Krishnajith KS`.
   - **NO HINT TEXT** or tooltip.
   - Clicking this text **6 consecutive times** opens the secret DSP Presentation Lab.
5. **Technical Stack:**
   - Frontend: React 19 with Vite + TypeScript.
   - Signal Processing: Web Worker running cascaded Butterworth biquad SOS, 30 Hz uniform resampling, and 16,384-point FFT with Hann window.
   - Memory Rule: Discard video frames immediately after ROI extraction. Memory must stay strictly flat ($O(1)$).

---

## 2. Directory Manifest & Artifacts

All specification files are present and verified in `/home/jojo/Projects/ppg-heart-rate-monitor/`:
- `prototype_preview.html`: Self-contained interactive single-file HTML preview with working live canvas waveforms, channel switching, and the 6-click easter egg. Run with `xdg-open prototype_preview.html`.
- `PROJECT_OVERVIEW.md`: Full scientific explanation, mathematical equations, and terminal commands to run the preview.
- `BRAINSTORM_SPEC.md`: Locked DSP mathematical specification, filter coefficients, and system architecture.
- `UI_DESIGN_SPEC.md`: Detailed Crumple design system tokens, typography scales, and CSS animations.
- `BUILD_GUIDELINES_AND_REPORT.md`: 7-step roadmap with assigned Antigravity & Superpowers skills.
- `AI_HANDOFF_GUIDE.md`: This continuity file.

---

## 3. Implementation Skills Matrix (From Antigravity Skills Guide)

When executing implementation, the next agent must refer to `/home/jojo/Projects/system/ANTIGRAVITY_SKILLS_AND_QUOTA_GUIDE.md` and invoke the following skills:

| Step | Milestone | Mandatory Skill(s) |
|---|---|---|
| **Step 1** | Vite + React 19 Scaffold & Tokens | `react-best-practices`, `design-taste-frontend`, `theme-factory` |
| **Step 2** | DSP Engine (Biquad, Resampling, FFT) | `test-driven-development`, `writing-plans`, `verification-before-completion` |
| **Step 3** | Video & Camera Sampler Pipeline | `lean-build`, `investigate-first` |
| **Step 4** | UI Build & Minimal Waveform Canvases | `frontend-design`, `web-artifacts-builder` |
| **Step 5** | Secret Dashboard & Defense Theory Deck | `safe-refactor`, `surgical-patch` |
| **Step 6** | Memory Audit & Code Review | `caveman-review`, `requesting-code-review`, `systematic-debugging` |
| **Step 7** | Production Build & Vercel HTTPS Deploy | `deploy-to-vercel`, `verify-and-stop` |

---

## 4. Token & Session Management Protocol

- Run `/caveman-stats` regularly to monitor token usage and cache hits.
- If context consumption exceeds 70%, run `/compact` to condense history and reclaim 50,000+ context tokens.
- Maintain terse, high-density communication without conversational filler.
- Explicit approval granted by Krishnajith KS on 22 Oct 2026.
- Production code implemented in `/home/jojo/Projects/ppg-heart-rate-monitor/app`.
- Vitest unit tests (6/6 passing) verified; production build compiles cleanly.
- Git repository initialized and linked to `https://github.com/krishnajith-ks/ppg-heart-rate-monitor`.
