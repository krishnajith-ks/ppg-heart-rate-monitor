import { DspPipeline, type OpticalChannel } from './dspPipeline';

const pipeline = new DspPipeline(30, 30);
let frameCounter = 0;

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'RESET') {
    pipeline.reset();
    frameCounter = 0;
    self.postMessage({ type: 'RESET_DONE' });
  } else if (type === 'SAMPLE') {
    const { timestamp, r, g, b, channel } = payload as {
      timestamp: number;
      r: number;
      g: number;
      b: number;
      channel: OpticalChannel;
    };

    const stream = pipeline.addSample(timestamp, r, g, b, channel);
    frameCounter++;

    // Run full analysis every 5 frames (~160ms) to conserve CPU
    if (frameCounter % 5 === 0) {
      const analysis = pipeline.computeFullAnalysis();
      self.postMessage({
        type: 'ANALYSIS',
        payload: {
          ...analysis,
          latestRaw: stream.rawVal,
          latestFiltered: stream.filteredVal
        }
      });
    } else {
      self.postMessage({
        type: 'STREAM_UPDATE',
        payload: {
          latestRaw: stream.rawVal,
          latestFiltered: stream.filteredVal
        }
      });
    }
  }
};
