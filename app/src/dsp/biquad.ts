/**
 * 4th-Order Butterworth Band-Pass Filter (0.5 - 4.0 Hz at Fs = 30 Hz)
 * Implemented as two cascaded Second-Order Sections (SOS) in Direct Form II Transposed structure.
 */

export class BiquadSection {
  private b0: number;
  private b1: number;
  private b2: number;
  private a1: number;
  private a2: number;

  private z1 = 0;
  private z2 = 0;

  constructor(b: [number, number, number], a: [number, number, number]) {
    this.b0 = b[0];
    this.b1 = b[1];
    this.b2 = b[2];
    this.a1 = a[1];
    this.a2 = a[2];
  }

  process(x: number): number {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
    return y;
  }

  reset(): void {
    this.z1 = 0;
    this.z2 = 0;
  }
}

export class BiquadCascade {
  private sec1: BiquadSection;
  private sec2: BiquadSection;

  constructor() {
    // Section 1: Low-pass component
    const b1: [number, number, number] = [0.087179, 0.174358, 0.087179];
    const a1: [number, number, number] = [1.0, -1.013118, 0.410620];

    // Section 2: High-pass component
    const b2: [number, number, number] = [1.0, -2.0, 1.0];
    const a2: [number, number, number] = [1.0, -1.858589, 0.870970];

    this.sec1 = new BiquadSection(b1, a1);
    this.sec2 = new BiquadSection(b2, a2);
  }

  process(x: number): number {
    const y1 = this.sec1.process(x);
    return this.sec2.process(y1);
  }

  processArray(signal: number[]): number[] {
    this.reset();
    return signal.map((x) => this.process(x));
  }

  reset(): void {
    this.sec1.reset();
    this.sec2.reset();
  }
}
