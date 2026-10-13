---
name: viva-explainer
description: Explain any project file, DSP concept, or function in plain non-expert language and provide 5 likely viva examiner questions with concise answers. Use when preparing for viva presentations or reviewing codebase concepts.
---

# Viva Explainer & Examiner Q&A

## Goal
Help the student thoroughly understand and verbally explain any file, function, mathematical derivation, or DSP architectural decision in simple, intuitive terms, followed by 5 realistic viva exam questions with concise answers.

## Explanation Structure

When explaining any file or component:
1. **Plain Language Overview**: What does this file do and why does it exist? (Avoid academic jargon; explain like you're talking to a friend).
2. **Key Operations**: Walk through the core functions step-by-step.
3. **Hardware & Physics Context**: How this relates to the camera sensor, light absorption, or PPG principles.

## 5 Likely Examiner Questions & Short Answers Format

Always end with 5 realistic questions an engineering examiner would ask:
- **Q1 (DSP Theory)**: Why this mathematical formula/method? (e.g. Why cascaded biquads vs Direct Form II? Why Hann window before FFT?)
- **Q2 (Implementation Trade-off)**: Why write it by hand rather than using a library? Why 64x64 canvas?
- **Q3 (Sampling & Frequency)**: How does Nyquist theorem apply here? What determines frequency resolution?
- **Q4 (Failure Modes & Limitations)**: What happens if the subject moves or ambient light changes? Why two BPM methods?
- **Q5 (Performance/Browser)**: Why are signals stored in mutable refs instead of React state?

Provide a direct 1-3 sentence answer for each question that the student can easily memorize and articulate.

## Constraints
- Keep explanations grounded in GUIDE.md principles (no medical claims, pure discrete-time signal processing).
- Keep total response clear and concise.
