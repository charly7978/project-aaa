export class ArrhythmiaDetector {
  private rrHistory: number[] = [];
  private lastBeatTime: number = 0;
  
  detectArrhythmia(timestamp: number, bpm: number, rrInterval: number): boolean {
    if (rrInterval <= 0) return false;
    
    this.rrHistory.push(rrInterval);
    
    // Keep last 10 RR intervals
    if (this.rrHistory.length > 10) {
      this.rrHistory.shift();
    }
    
    if (this.rrHistory.length < 3) return false;
    
    // Calculate statistics
    const mean = this.rrHistory.reduce((sum, rr) => sum + rr, 0) / this.rrHistory.length;
    const variance = this.calculateVariance(this.rrHistory, mean);
    const stdDev = Math.sqrt(variance);
    
    const currentRR = rrInterval;
    const lastRR = this.rrHistory[this.rrHistory.length - 2] || currentRR;
    
    // Arrhythmia detection criteria
    const criteria = {
      // Premature beat: RR interval < 60% of mean
      prematureBeat: currentRR < 0.6 * mean,
      
      // Pause: RR interval > 150% of mean
      pause: currentRR > 1.5 * mean,
      
      // Sudden change: >20% variation from previous RR
      suddenChange: Math.abs(currentRR - lastRR) / lastRR > 0.2,
      
      // Abnormal heart rate
      tachycardia: bpm > 100,
      bradycardia: bpm < 60,
      
      // Extreme RR intervals
      tooFast: currentRR < 300, // > 200 BPM
      tooSlow: currentRR > 2000, // < 30 BPM
      
      // High variability
      highVariability: stdDev > 0.3 * mean,
    };
    
    // Return true if any arrhythmia criteria is met
    return criteria.prematureBeat || 
           criteria.pause || 
           criteria.suddenChange ||
           criteria.tooFast || 
           criteria.tooSlow ||
           (criteria.highVariability && this.rrHistory.length >= 5);
  }
  
  private calculateVariance(values: number[], mean: number): number {
    if (values.length < 2) return 0;
    
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  getArrhythmiaType(timestamp: number, bpm: number, rrInterval: number): string {
    if (rrInterval <= 0) return 'normal';
    
    const mean = this.rrHistory.length > 0 
      ? this.rrHistory.reduce((sum, rr) => sum + rr, 0) / this.rrHistory.length 
      : rrInterval;
    
    if (rrInterval < 300) return 'taquicardia extrema';
    if (rrInterval > 2000) return 'bradicardia extrema';
    if (rrInterval < 0.6 * mean) return 'latido prematuro';
    if (rrInterval > 1.5 * mean) return 'pausa';
    if (bpm > 100) return 'taquicardia';
    if (bpm < 60) return 'bradicardia';
    
    return 'normal';
  }
  
  reset(): void {
    this.rrHistory = [];
    this.lastBeatTime = 0;
  }
}