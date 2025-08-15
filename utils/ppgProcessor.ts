export class PPGProcessor {
  private peakTimes: number[] = [];
  private rrIntervals: number[] = [];
  private signalHistory: number[] = [];
  private dcComponents: { red: number; green: number } = { red: 0, green: 0 };
  private acComponents: { red: number; green: number } = { red: 0, green: 0 };
  private lastDetrend: number = 0;
  private trendBuffer: Array<{ timestamp: number; value: number }> = [];

  async extractPPGFromImage(base64Image: string): Promise<{
    redValue: number;
    greenValue: number;
    timestamp: number;
    fingerDetected: boolean;
  } | null> {
    try {
      // Create image from base64
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return null;
      
      return new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Define ROI (Region of Interest) - circular area in center
          const centerX = img.width / 2;
          const centerY = img.height / 2;
          const radius = Math.min(img.width, img.height) / 4;
          
          let redSum = 0;
          let greenSum = 0;
          let pixelCount = 0;
          let totalIntensity = 0;
          
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const data = imageData.data;
          
          // Extract ROI pixels
          for (let y = centerY - radius; y < centerY + radius; y++) {
            for (let x = centerX - radius; x < centerX + radius; x++) {
              const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
              
              if (distance <= radius && x >= 0 && x < img.width && y >= 0 && y < img.height) {
                const index = (y * img.width + x) * 4;
                const red = data[index];
                const green = data[index + 1];
                const blue = data[index + 2];
                
                // Check for saturation/clipping
                if (red < 250 && green < 250 && blue < 250) {
                  redSum += red;
                  greenSum += green;
                  totalIntensity += red + green + blue;
                  pixelCount++;
                }
              }
            }
          }
          
          if (pixelCount === 0) {
            resolve(null);
            return;
          }
          
          const redValue = redSum / pixelCount;
          const greenValue = greenSum / pixelCount;
          const avgIntensity = totalIntensity / (pixelCount * 3);
          
          // Finger detection based on intensity and color characteristics
          const fingerDetected = this.detectFinger(redValue, greenValue, avgIntensity);
          
          resolve({
            redValue,
            greenValue,
            timestamp: Date.now(),
            fingerDetected,
          });
        };
        
        img.src = `data:image/jpeg;base64,${base64Image}`;
      });
    } catch (error) {
      console.error('Image processing error:', error);
      return null;
    }
  }

  private detectFinger(red: number, green: number, avgIntensity: number): boolean {
    // Finger detection criteria
    const intensityThreshold = 60; // Minimum intensity
    const maxIntensity = 200; // Maximum intensity (not oversaturated)
    const redGreenRatio = red / (green + 1); // Avoid division by zero
    
    // Finger typically has red/green ratio between 1.2 and 2.5
    const validRatio = redGreenRatio > 1.2 && redGreenRatio < 2.5;
    const validIntensity = avgIntensity > intensityThreshold && avgIntensity < maxIntensity;
    
    // Add variance check
    this.signalHistory.push(green);
    if (this.signalHistory.length > 30) {
      this.signalHistory.shift();
    }
    
    const variance = this.calculateVariance(this.signalHistory);
    const validVariance = variance > 10; // Minimum signal variation
    
    return validRatio && validIntensity && validVariance;
  }

  detrend(value: number, timestamp: number): number {
    this.trendBuffer.push({ timestamp, value });
    
    // Keep last 5 seconds of data for trend calculation
    const windowMs = 5000;
    this.trendBuffer = this.trendBuffer.filter(
      item => timestamp - item.timestamp <= windowMs
    );
    
    if (this.trendBuffer.length < 10) {
      return value - this.lastDetrend;
    }
    
    // Linear regression for trend estimation
    const n = this.trendBuffer.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    this.trendBuffer.forEach((point, index) => {
      sumX += index;
      sumY += point.value;
      sumXY += index * point.value;
      sumXX += index * index;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const trend = slope * (n - 1) + intercept;
    this.lastDetrend = trend;
    
    return value - trend;
  }

  normalize(value: number): number {
    this.signalHistory.push(value);
    
    // Keep sliding window for normalization
    const windowSize = 100;
    if (this.signalHistory.length > windowSize) {
      this.signalHistory.shift();
    }
    
    if (this.signalHistory.length < 10) {
      return value;
    }
    
    const mean = this.signalHistory.reduce((sum, val) => sum + val, 0) / this.signalHistory.length;
    const variance = this.calculateVariance(this.signalHistory);
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    return (value - mean) / stdDev;
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  detectPeak(value: number, timestamp: number, lastPeakTime: number, refractoryPeriod: number): boolean {
    const timeSinceLastPeak = timestamp - lastPeakTime;
    
    if (timeSinceLastPeak < refractoryPeriod) {
      return false;
    }
    
    // Simple adaptive threshold peak detection
    const recentHistory = this.signalHistory.slice(-50);
    if (recentHistory.length < 10) return false;
    
    const mean = recentHistory.reduce((sum, val) => sum + val, 0) / recentHistory.length;
    const stdDev = Math.sqrt(this.calculateVariance(recentHistory));
    
    const threshold = mean + 1.5 * stdDev;
    const isPeak = value > threshold && value > 0;
    
    if (isPeak) {
      this.peakTimes.push(timestamp);
      this.updateRRIntervals();
    }
    
    return isPeak;
  }

  private updateRRIntervals(): void {
    if (this.peakTimes.length < 2) return;
    
    // Calculate RR intervals from recent peaks
    const recentPeaks = this.peakTimes.slice(-10);
    this.rrIntervals = [];
    
    for (let i = 1; i < recentPeaks.length; i++) {
      const rrInterval = recentPeaks[i] - recentPeaks[i - 1];
      this.rrIntervals.push(rrInterval);
    }
  }

  calculateBPM(): number {
    if (this.rrIntervals.length === 0) return 0;
    
    // Use median RR interval for BPM calculation
    const sortedRR = [...this.rrIntervals].sort((a, b) => a - b);
    const medianRR = sortedRR[Math.floor(sortedRR.length / 2)];
    
    if (medianRR <= 0) return 0;
    
    const bpm = Math.round(60000 / medianRR); // Convert ms to BPM
    
    // Clamp to reasonable range
    return Math.max(30, Math.min(200, bpm));
  }

  estimateSpO2(redValue: number, greenValue: number): number {
    // Update DC and AC components
    this.dcComponents.red = this.dcComponents.red * 0.99 + redValue * 0.01;
    this.dcComponents.green = this.dcComponents.green * 0.99 + greenValue * 0.01;
    
    const redAC = Math.abs(redValue - this.dcComponents.red);
    const greenAC = Math.abs(greenValue - this.dcComponents.green);
    
    this.acComponents.red = this.acComponents.red * 0.9 + redAC * 0.1;
    this.acComponents.green = this.acComponents.green * 0.9 + greenAC * 0.1;
    
    // Calculate R ratio
    if (this.dcComponents.red === 0 || this.dcComponents.green === 0 ||
        this.acComponents.red === 0 || this.acComponents.green === 0) {
      return 0;
    }
    
    const redRatio = this.acComponents.red / this.dcComponents.red;
    const greenRatio = this.acComponents.green / this.dcComponents.green;
    
    if (greenRatio === 0) return 0;
    
    const R = redRatio / greenRatio;
    
    // Experimental calibration curve (needs device-specific calibration)
    let spo2 = 110 - 25 * R;
    
    // Clamp to reasonable range
    spo2 = Math.max(70, Math.min(100, Math.round(spo2)));
    
    return spo2;
  }

  calculateSignalQuality(filteredValue: number): number {
    const recentHistory = this.signalHistory.slice(-100);
    
    if (recentHistory.length < 50) return 0;
    
    // Signal quality based on variance and signal-to-noise ratio
    const variance = this.calculateVariance(recentHistory);
    const mean = Math.abs(recentHistory.reduce((sum, val) => sum + val, 0) / recentHistory.length);
    
    const snr = variance > 0 ? mean / Math.sqrt(variance) : 0;
    
    // Normalize to 0-100%
    let quality = Math.min(100, snr * 10);
    quality = Math.max(0, quality);
    
    return Math.round(quality);
  }

  getLastRRInterval(): number {
    return this.rrIntervals.length > 0 ? this.rrIntervals[this.rrIntervals.length - 1] : 0;
  }

  reset(): void {
    this.peakTimes = [];
    this.rrIntervals = [];
    this.signalHistory = [];
    this.dcComponents = { red: 0, green: 0 };
    this.acComponents = { red: 0, green: 0 };
    this.lastDetrend = 0;
    this.trendBuffer = [];
  }
}