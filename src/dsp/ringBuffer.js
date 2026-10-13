// src/dsp/ringBuffer.js
// Fixed-size circular ring buffer using Float32Array.
//
// Why this exists:
// In a real-time DSP application running at 30 fps, dynamically expanding arrays
// (e.g., Array.push) causes constant memory allocations and triggers garbage collection,
// leading to dropped frames and UI stutter.
// A circular buffer allocates a single fixed-size array in memory upfront and wraps
// around using modulo arithmetic (pointer = (pointer + 1) % capacity).

export class RingBuffer {
  /**
   * @param {number} capacity - Maximum number of samples to store (e.g. 450 for 15 s at 30 Hz)
   */
  constructor(capacity) {
    this.capacity = capacity;
    // We store timestamps (t in seconds) and green signal amplitudes (g) in separate typed arrays
    this.timestamps = new Float32Array(capacity);
    this.values = new Float32Array(capacity);
    this.writeIndex = 0;
    this.count = 0;
  }

  /**
   * Push a new (timestamp, sample) pair into the circular buffer.
   * If the buffer is full, it overwrites the oldest sample.
   * @param {number} t - Timestamp in seconds
   * @param {number} val - Signal value (e.g. mean green channel brightness)
   */
  push(t, val) {
    this.timestamps[this.writeIndex] = t;
    this.values[this.writeIndex] = val;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  /**
   * Extract all stored samples in chronological order (oldest to newest).
   * @returns {{ t: Float32Array, v: Float32Array }}
   */
  toArray() {
    const tOut = new Float32Array(this.count);
    const vOut = new Float32Array(this.count);
    
    // If not wrapped yet, samples start at 0
    // If full, the oldest sample is at writeIndex
    const startIndex = this.count < this.capacity ? 0 : this.writeIndex;

    for (let i = 0; i < this.count; i++) {
      const idx = (startIndex + i) % this.capacity;
      tOut[i] = this.timestamps[idx];
      vOut[i] = this.values[idx];
    }

    return { t: tOut, v: vOut };
  }

  /**
   * Clear all stored samples without reallocating memory.
   */
  clear() {
    this.writeIndex = 0;
    this.count = 0;
  }

  /**
   * Returns current number of valid stored samples.
   */
  size() {
    return this.count;
  }
}
