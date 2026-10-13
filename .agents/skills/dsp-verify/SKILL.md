---
name: dsp-verify
description: Verify DSP implementation, biquad filter coefficients, and synthetic test vectors (72, 48, 120 BPM and flat signal). Use when testing DSP algorithms, checking biquad math, or validating Milestone 2.
---

# DSP Verification Runner

## Goal
Verify digital signal processing mathematics and algorithms against GUIDE.md specifications by executing the test script. Do not judge or evaluate DSP results by eye.

## Execution
Run the verification test script directly using Node.js:

```bash
node .agents/skills/dsp-verify/scripts/run_dsp_tests.mjs
```

## Checks Performed
1. **Biquad Coefficients**: Checks 0.5 Hz high-pass and 4.0 Hz low-pass 2nd-order Butterworth filters at fs = 30 Hz against GUIDE.md Section 6.6 reference table to 6 decimal places.
2. **Synthetic 72 BPM**: 1.2 Hz sine test signal with linear drift. Verifies both FFT peak and peak detection yield 72 BPM within ±1.5 BPM.
3. **Synthetic 48 BPM**: 0.8 Hz sine test signal. Verifies FFT peak and peak detection yield 48 BPM within ±1.5 BPM.
4. **Synthetic 120 BPM**: 2.0 Hz sine test signal. Verifies FFT peak and peak detection yield 120 BPM within ±1.5 BPM.
5. **Flat Signal**: Constant DC signal. Verifies pipeline reports no valid data / no false peaks.

## Constraints
- Run the script and rely on exit code (0 = PASS, 1 = FAIL). Never guess or approve by visual inspection alone.
- Keep implementation zero-dependency and aligned with GUIDE.md formulas.
