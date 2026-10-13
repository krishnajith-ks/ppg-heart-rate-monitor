---
name: milestone-runner
description: Step through project implementation milestones strictly one at a time following GUIDE.md Section 14 with acceptance criteria and mobile testing checklists. Use when advancing or verifying project milestones.
---

# Milestone Runner

## Goal
Execute the 8 implementation milestones defined in GUIDE.md Section 14 systematically, strictly verifying acceptance criteria before advancing. **Never begin the next milestone without explicit user approval.**

## Workflow Steps

1. **State Current Milestone**: Identify current milestone (1 through 8) and list its specific scope and goals.
2. **Execute Milestone Implementation**:
   - Write clean, commented code adhering to Section 13 rules.
   - Do not touch features or files belonging to future milestones.
3. **Verify Acceptance Criteria**:
   - Verify specific acceptance conditions listed in Section 14 for that milestone.
   - For Milestone 2, run `node .agents/skills/dsp-verify/scripts/run_dsp_tests.mjs`.
4. **Produce Milestone Summary & Phone Checklist**:
   - **What was built**: Concise summary of new code and components.
   - **How to run**: Exact command (e.g. `npm run dev`).
   - **Phone Checklist**: What to test on a physical smartphone (e.g. HTTPS prompt, camera permission, canvas render).
5. **HALT FOR APPROVAL**: Stop immediately. Ask the user for confirmation to proceed. **Do not begin the next milestone until the user explicitly says OK.**

## Milestone Quick Reference
- **M1**: Project setup (Vite + React + Router, 3 routes, hidden footer link)
- **M2**: DSP engine without camera (zero-dependency math, run tests)
- **M3**: Camera capture & 64x64 sampling (live stream, timestamps, fs)
- **M4**: Canvas live graphs (raw, filtered+peaks, FFT, BPM trend)
- **M5**: Measurement flow state machine (IDLE -> WAITING -> SETTLING -> MEASURING -> RESULT)
- **M6**: Admin Panel (diagnostics, calculations, replay clip)
- **M6b**: Video upload demo mode (hidden under Admin Demo tools)
- **M7**: About page & educational content
- **M8**: Performance audit & static HTTPS deployment

## Constraints
- Never advance milestones without explicit user permission.
- Keep all DSP and architectural decisions bound to GUIDE.md constraints.
