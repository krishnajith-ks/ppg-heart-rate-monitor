---
name: phone-camera-debug
description: Debug phone camera issues including HTTPS requirements, permission denials, torch constraints on iPhone Safari, low framerate, and finger-detection thresholds. Use when camera fails or finger detection is inaccurate.
---

# Phone Camera Debugging Checklist

## Goal
Troubleshoot smartphone camera capture, permission issues, platform discrepancies, and finger detection using GUIDE.md principles.

## Diagnostic Steps

1. **HTTPS Enforcement**:
   - `getUserMedia` requires a secure context (HTTPS or localhost).
   - Plain local IPs (`http://192.168.x.x`) fail silently or throw security errors.
   - Use an HTTPS tunnel (e.g. ngrok, localtunnel) or deployed preview URL for mobile testing.

2. **Permission Denied**:
   - Check if camera permissions were denied in browser site settings.
   - Ensure UI catches `NotAllowedError` and renders a clear instruction prompt instead of a blank screen.

3. **Torch Unsupported (iPhone Safari)**:
   - iOS WebKit does NOT support the flashlight/torch constraint via `applyConstraints()`.
   - Never treat torch failure as fatal. Catch the exception and proceed.
   - Display a one-line hint on iOS recommending measuring under bright ambient light.

4. **Low Frame Rate (< 24 fps)**:
   - Verify camera resolution request is low (ideally 640x480 or 320x240, 30 fps).
   - Ensure sampling canvas is strictly 64x64 and reused across frames.
   - Confirm no heavy operations run inside `requestAnimationFrame` or `requestVideoFrameCallback`.

5. **Finger-Detection Thresholds**:
   - Finger coverage requires high red channel mean and low variance.
   - If finger detection fails or falsely triggers, adjust thresholds **only in `src/config.js`**:
     - `MIN_RED_MEAN` (typically ~100-150 depending on torch/exposure)
     - `MAX_GREEN_MEAN` / red-to-green ratio check
     - `MAX_VARIANCE` to reject non-uniform scenes

## Constraints
- Tune thresholds **only in `src/config.js`**, never hardcode magic values across components.
- Do not use `<input type="file" capture>` as it invokes the native camera app and saves to gallery.
