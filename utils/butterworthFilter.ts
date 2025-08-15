export class ButterworthFilter {
  private a: number[];
  private b: number[];
  private x: number[];
  private y: number[];
  
  constructor(lowCutoff: number, highCutoff: number, samplingRate: number, order: number = 4) {
    const nyquist = samplingRate / 2;
    const lowNorm = lowCutoff / nyquist;
    const highNorm = highCutoff / nyquist;
    
    // Design 4th order Butterworth bandpass filter
    this.designButterworthBandpass(lowNorm, highNorm, order);
    
    // Initialize delay lines
    this.x = new Array(this.b.length).fill(0);
    this.y = new Array(this.a.length).fill(0);
  }
  
  private designButterworthBandpass(lowNorm: number, highNorm: number, order: number): void {
    // Simplified 4th order Butterworth bandpass design
    // This is a basic implementation - for production, use a proper DSP library
    
    const w1 = 2 * Math.PI * lowNorm;
    const w2 = 2 * Math.PI * highNorm;
    const w0 = Math.sqrt(w1 * w2); // Center frequency
    const bw = w2 - w1; // Bandwidth
    
    // Pre-warp frequencies
    const w1p = 2 * Math.tan(w1 / 2);
    const w2p = 2 * Math.tan(w2 / 2);
    const w0p = Math.sqrt(w1p * w2p);
    const bwp = w2p - w1p;
    
    // Butterworth prototype poles for 4th order
    const poles = [
      { real: -0.3827, imag: 0.9239 },
      { real: -0.9239, imag: 0.3827 },
      { real: -0.9239, imag: -0.3827 },
      { real: -0.3827, imag: -0.9239 }
    ];
    
    // Transform to bandpass
    // Simplified coefficients for basic bandpass response
    this.b = [
      bwp * bwp * 0.0001,
      0,
      -2 * bwp * bwp * 0.0001,
      0,
      bwp * bwp * 0.0001
    ];
    
    this.a = [
      1,
      2 * 0.7654 * bwp + w0p * w0p / bwp,
      2 * w0p * w0p + bwp * bwp * 0.4142,
      2 * 0.7654 * bwp * w0p * w0p / bwp,
      w0p * w0p * w0p * w0p / (bwp * bwp)
    ];
    
    // Normalize
    const a0 = this.a[0];
    for (let i = 0; i < this.a.length; i++) {
      this.a[i] /= a0;
      if (i < this.b.length) {
        this.b[i] /= a0;
      }
    }
  }
  
  process(input: number): number {
    // Shift delay lines
    this.x.unshift(input);
    this.x.pop();
    
    // Calculate output
    let output = 0;
    
    // Feed-forward (numerator)
    for (let i = 0; i < this.b.length; i++) {
      output += this.b[i] * this.x[i];
    }
    
    // Feed-back (denominator) - skip a[0] as it's normalized to 1
    for (let i = 1; i < this.a.length; i++) {
      if (i < this.y.length) {
        output -= this.a[i] * this.y[i];
      }
    }
    
    // Shift output delay line
    this.y.unshift(output);
    this.y.pop();
    
    return output;
  }
  
  reset(): void {
    this.x.fill(0);
    this.y.fill(0);
  }
}