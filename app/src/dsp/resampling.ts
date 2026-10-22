/**
 * Linear interpolation onto uniform sampling grid
 */
export function resampleUniform(
  rawTimes: number[],
  rawValues: number[],
  fs = 30
): { times: number[]; values: number[] } {
  if (rawTimes.length < 2) {
    return { times: [...rawTimes], values: [...rawValues] };
  }

  const dt = 1 / fs;
  const startTime = rawTimes[0];
  const endTime = rawTimes[rawTimes.length - 1];
  const totalSamples = Math.floor((endTime - startTime) / dt);

  const times = new Array<number>(totalSamples);
  const values = new Array<number>(totalSamples);

  let rawIdx = 0;
  for (let i = 0; i < totalSamples; i++) {
    const t = startTime + i * dt;
    times[i] = t;

    // Advance rawIdx until rawTimes[rawIdx + 1] >= t
    while (rawIdx < rawTimes.length - 2 && rawTimes[rawIdx + 1] < t) {
      rawIdx++;
    }

    const t0 = rawTimes[rawIdx];
    const t1 = rawTimes[rawIdx + 1];
    const y0 = rawValues[rawIdx];
    const y1 = rawValues[rawIdx + 1];

    if (t1 === t0) {
      values[i] = y0;
    } else {
      const alpha = (t - t0) / (t1 - t0);
      values[i] = y0 + alpha * (y1 - y0);
    }
  }

  return { times, values };
}
