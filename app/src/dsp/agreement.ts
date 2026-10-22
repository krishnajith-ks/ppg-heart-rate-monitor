/**
 * Dual-Engine Agreement & Consensus Logic
 */

export interface ConsensusResult {
  agreed: boolean;
  consensusBpm: number;
  bpmTime: number;
  bpmFreq: number;
  difference: number;
  status: string;
}

export function crossCheckBpm(
  bpmTime: number,
  bpmFreq: number,
  tolerance = 3.0
): ConsensusResult {
  const diff = Math.abs(bpmTime - bpmFreq);
  const agreed = diff <= tolerance && bpmTime > 0 && bpmFreq > 0;

  let consensusBpm = 0;
  let status = '';

  if (agreed) {
    consensusBpm = Number(((bpmTime + bpmFreq) / 2).toFixed(1));
    status = 'Methods Agree — Clean Signal';
  } else if (bpmFreq > 0) {
    consensusBpm = Number(bpmFreq.toFixed(1));
    status = 'Disagreement — Signal Noisy (Spectral Estimate Retained)';
  } else if (bpmTime > 0) {
    consensusBpm = Number(bpmTime.toFixed(1));
    status = 'Disagreement — Using Time-Domain IBI Estimate';
  } else {
    status = 'Insufficient Signal Data';
  }

  return {
    agreed,
    consensusBpm,
    bpmTime: Number(bpmTime.toFixed(1)),
    bpmFreq: Number(bpmFreq.toFixed(1)),
    difference: Number(diff.toFixed(2)),
    status
  };
}
