import { useState, useRef, useEffect, useCallback } from 'react';
import { type OpticalChannel, DspPipeline } from '../dsp/dspPipeline';
import type { ConsensusResult } from '../dsp/agreement';

export interface SamplerState {
  isCapturing: boolean;
  sourceType: 'none' | 'camera' | 'video' | 'synthetic';
  torchSupported: boolean;
  torchActive: boolean;
  channel: OpticalChannel;
  currentBpm: number;
  consensus: ConsensusResult | null;
  rawBuffer: number[];
  filteredBuffer: number[];
  fftSpectrum: { freqs: number[]; magnitudes: number[]; peakFreq: number; bpm: number } | null;
  peakIndices: number[];
  statusMessage: string;
}

export function usePpgSampler() {
  const [state, setState] = useState<SamplerState>({
    isCapturing: false,
    sourceType: 'none',
    torchSupported: false,
    torchActive: false,
    channel: 'green',
    currentBpm: 72,
    consensus: null,
    rawBuffer: [],
    filteredBuffer: [],
    fftSpectrum: null,
    peakIndices: [],
    statusMessage: 'Ready. Choose Camera, Upload Video, or Run Simulation.'
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const pipelineRef = useRef<DspPipeline>(new DspPipeline(30, 30));
  const channelRef = useRef<OpticalChannel>('green');

  // Maintain reference to current channel
  useEffect(() => {
    channelRef.current = state.channel;
  }, [state.channel]);

  // 64x64 offscreen sampler canvas
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    offscreenCanvasRef.current = c;
    offscreenCtxRef.current = c.getContext('2d', { willReadFrequently: true });
  }, []);

  const stopCapture = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
    }
    pipelineRef.current.reset();
    setState((prev) => ({
      ...prev,
      isCapturing: false,
      sourceType: 'none',
      torchActive: false,
      statusMessage: 'Stopped.'
    }));
  }, []);

  // Frame processing loop
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const offCtx = offscreenCtxRef.current;
    const offCanvas = offscreenCanvasRef.current;

    if (!video || !offCtx || !offCanvas || video.paused || video.ended) {
      return;
    }

    // Draw current video frame scaled to 64x64
    offCtx.drawImage(video, 0, 0, 64, 64);
    const imgData = offCtx.getImageData(0, 0, 64, 64).data;

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    const totalPixels = 64 * 64;

    for (let i = 0; i < imgData.length; i += 4) {
      rSum += imgData[i];
      gSum += imgData[i + 1];
      bSum += imgData[i + 2];
    }

    const rMean = rSum / totalPixels;
    const gMean = gSum / totalPixels;
    const bMean = bSum / totalPixels;
    const now = performance.now() / 1000;

    // Render preview to attached canvas
    if (canvasRef.current) {
      const pCtx = canvasRef.current.getContext('2d');
      if (pCtx) {
        pCtx.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    // Pass to DSP Pipeline
    pipelineRef.current.addSample(now, rMean, gMean, bMean, channelRef.current);

    // Compute periodic DSP analysis
    const analysis = pipelineRef.current.computeFullAnalysis();
    if (analysis.filteredSignal.length > 0) {
      setState((prev) => ({
        ...prev,
        currentBpm: analysis.consensus.consensusBpm || prev.currentBpm,
        consensus: analysis.consensus,
        rawBuffer: analysis.rawDetrended,
        filteredBuffer: analysis.filteredSignal,
        fftSpectrum: analysis.fft,
        peakIndices: analysis.peakIndices,
        statusMessage: analysis.consensus.status
      }));
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, []);

  // Synthetic simulation generator
  const startSyntheticSimulation = useCallback((targetBpm = 75) => {
    stopCapture();
    pipelineRef.current.reset();

    let simTime = 0;
    const freq = targetBpm / 60; // e.g. 1.25 Hz
    let frame = 0;

    const simLoop = () => {
      frame++;
      simTime += 1 / 30;

      // Realistic pulsatile waveform with dicrotic notch + drift
      const cardiac = Math.sin(2 * Math.PI * freq * simTime) + 0.3 * Math.sin(4 * Math.PI * freq * simTime + 0.5);
      const respiratoryDrift = 0.4 * Math.sin(2 * Math.PI * 0.2 * simTime);
      const noise = (Math.random() - 0.5) * 0.08;

      // Green channel absorbs more during systole (inverse pulsatile)
      const g = 140 - (cardiac * 18 + respiratoryDrift * 10 + noise * 5);
      const r = 210 + (cardiac * 4 + respiratoryDrift * 15);
      const b = 60 + noise * 10;

      pipelineRef.current.addSample(simTime, r, g, b, channelRef.current);

      // Render synthetic fingertip on canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const w = canvasRef.current.width;
          const h = canvasRef.current.height;
          ctx.fillStyle = '#110505';
          ctx.fillRect(0, 0, w, h);

          const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 90);
          const beatScale = 1 + 0.05 * Math.max(0, Math.sin(2 * Math.PI * freq * simTime));
          if (channelRef.current === 'green') {
            grad.addColorStop(0, '#28a745');
            grad.addColorStop(1, '#05290f');
          } else if (channelRef.current === 'red') {
            grad.addColorStop(0, '#e63946');
            grad.addColorStop(1, '#3b0606');
          } else if (channelRef.current === 'blue') {
            grad.addColorStop(0, '#1d3557');
            grad.addColorStop(1, '#051026');
          } else {
            grad.addColorStop(0, '#f4a261');
            grad.addColorStop(1, '#472207');
          }
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, 70 * beatScale, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (frame % 4 === 0) {
        const analysis = pipelineRef.current.computeFullAnalysis();
        if (analysis.filteredSignal.length > 0) {
          setState((prev) => ({
            ...prev,
            currentBpm: analysis.consensus.consensusBpm || prev.currentBpm,
            consensus: analysis.consensus,
            rawBuffer: analysis.rawDetrended,
            filteredBuffer: analysis.filteredSignal,
            fftSpectrum: analysis.fft,
            peakIndices: analysis.peakIndices,
            statusMessage: 'Synthetic Simulation Running (' + targetBpm + ' BPM benchmark)'
          }));
        }
      }

      animFrameRef.current = requestAnimationFrame(simLoop);
    };

    setState((prev) => ({
      ...prev,
      isCapturing: true,
      sourceType: 'synthetic',
      statusMessage: 'Generating synthetic pulsatile fingertip signal...'
    }));

    animFrameRef.current = requestAnimationFrame(simLoop);
  }, [stopCapture]);

  // Start Camera
  const startCamera = useCallback(async () => {
    stopCapture();
    try {
      setState((prev) => ({ ...prev, statusMessage: 'Requesting rear camera access...' }));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check torch support
      const track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as { torch?: boolean };
      const hasTorch = Boolean(capabilities.torch);

      setState((prev) => ({
        ...prev,
        isCapturing: true,
        sourceType: 'camera',
        torchSupported: hasTorch,
        statusMessage: 'Camera active. Place fingertip gently over lens.'
      }));

      animFrameRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      console.error(err);
      setState((prev) => ({
        ...prev,
        statusMessage: 'Camera permission denied or camera unavailable. Fall back to upload or simulation.'
      }));
    }
  }, [stopCapture, processFrame]);

  // Toggle Torch
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const nextState = !state.torchActive;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }]
      });
      setState((prev) => ({ ...prev, torchActive: nextState }));
    } catch (e) {
      console.warn('Torch toggle not supported:', e);
    }
  }, [state.torchActive]);

  // Load Video File
  const loadVideoFile = useCallback((file: File) => {
    stopCapture();
    const url = URL.createObjectURL(file);
    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.loop = true;
      videoRef.current.play().then(() => {
        setState((prev) => ({
          ...prev,
          isCapturing: true,
          sourceType: 'video',
          statusMessage: `Processing video: ${file.name}`
        }));
        animFrameRef.current = requestAnimationFrame(processFrame);
      }).catch((err) => {
        console.error(err);
        setState((prev) => ({ ...prev, statusMessage: 'Failed to play uploaded video.' }));
      });
    }
  }, [stopCapture, processFrame]);

  // Set Optical Channel
  const setChannel = useCallback((channel: OpticalChannel) => {
    setState((prev) => ({ ...prev, channel }));
  }, []);

  return {
    state,
    videoRef,
    canvasRef,
    startCamera,
    stopCapture,
    toggleTorch,
    loadVideoFile,
    startSyntheticSimulation,
    setChannel
  };
}
