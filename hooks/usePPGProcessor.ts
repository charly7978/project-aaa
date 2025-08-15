import { useState, useCallback, useRef } from 'react';
import { PPGProcessor } from '@/utils/ppgProcessor';
import { ButterworthFilter } from '@/utils/butterworthFilter';
import { ArrhythmiaDetector } from '@/utils/arrhythmiaDetector';

interface VitalSigns {
  bpm: number;
  spo2: number;
  signalQuality: number;
  lastRR: number;
  isArrhythmic: boolean;
}

interface PPGWaveformPoint {
  timestamp: number;
  value: number;
  isArrhythmic: boolean;
  isPeak: boolean;
}

interface SessionData {
  timestamp: number;
  rawValue: number;
  filteredValue: number;
  peakFlag: boolean;
  bpmInstant: number;
  spo2Estimate: number;
  signalQuality: number;
}

interface Session {
  id: string;
  startTime: number;
  endTime?: number;
  data: SessionData[];
}

export function usePPGProcessor() {
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    bpm: 0,
    spo2: 0,
    signalQuality: 0,
    lastRR: 0,
    isArrhythmic: false,
  });
  
  const [ppgWaveform, setPpgWaveform] = useState<PPGWaveformPoint[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  
  const processorRef = useRef<PPGProcessor>(new PPGProcessor());
  const bandpassFilterRef = useRef<ButterworthFilter>(new ButterworthFilter(0.5, 8.0, 100));
  const narrowFilterRef = useRef<ButterworthFilter>(new ButterworthFilter(0.7, 4.0, 100));
  const arrhythmiaDetectorRef = useRef<ArrhythmiaDetector>(new ArrhythmiaDetector());
  
  const waveformBufferRef = useRef<PPGWaveformPoint[]>([]);
  const lastPeakTimeRef = useRef<number>(0);
  const refractoryPeriod = 250; // ms

  const processPPGFrame = useCallback(async (base64Image: string): Promise<{ fingerDetected: boolean } | null> => {
    try {
      const processor = processorRef.current;
      const bandpassFilter = bandpassFilterRef.current;
      const narrowFilter = narrowFilterRef.current;
      const arrhythmiaDetector = arrhythmiaDetectorRef.current;
      
      // Extract PPG signal from image
      const extracted = await processor.extractPPGFromImage(base64Image);
      if (!extracted) return null;
      
      const { redValue, greenValue, timestamp, fingerDetected } = extracted;
      
      if (!fingerDetected) {
        return { fingerDetected: false };
      }
      
      // Use green channel as primary PPG signal
      const rawPPG = greenValue;
      
      // Apply preprocessing
      const detrended = processor.detrend(rawPPG, timestamp);
      const normalized = processor.normalize(detrended);
      
      // Apply filters
      const bandpassFiltered = bandpassFilter.process(normalized);
      const narrowFiltered = narrowFilter.process(normalized);
      
      // Detect peaks using narrow filtered signal
      const isPeak = processor.detectPeak(narrowFiltered, timestamp, lastPeakTimeRef.current, refractoryPeriod);
      if (isPeak) {
        lastPeakTimeRef.current = timestamp;
      }
      
      // Calculate vital signs
      const bpm = processor.calculateBPM();
      const spo2 = processor.estimateSpO2(redValue, greenValue);
      const signalQuality = processor.calculateSignalQuality(bandpassFiltered);
      const lastRR = processor.getLastRRInterval();
      
      // Detect arrhythmia
      const isArrhythmic = arrhythmiaDetector.detectArrhythmia(timestamp, bpm, lastRR);
      
      // Update vital signs
      setVitalSigns({
        bpm,
        spo2,
        signalQuality,
        lastRR,
        isArrhythmic,
      });
      
      // Update waveform data
      const waveformPoint: PPGWaveformPoint = {
        timestamp,
        value: bandpassFiltered,
        isArrhythmic,
        isPeak,
      };
      
      waveformBufferRef.current.push(waveformPoint);
      
      // Keep only last 20 seconds of data (2000 points at 100Hz)
      const maxPoints = 2000;
      if (waveformBufferRef.current.length > maxPoints) {
        waveformBufferRef.current = waveformBufferRef.current.slice(-maxPoints);
      }
      
      setPpgWaveform([...waveformBufferRef.current]);
      
      // Add data to current session
      if (currentSession) {
        const sessionData: SessionData = {
          timestamp,
          rawValue: rawPPG,
          filteredValue: bandpassFiltered,
          peakFlag: isPeak,
          bpmInstant: bpm,
          spo2Estimate: spo2,
          signalQuality,
        };
        
        setCurrentSession(prev => prev ? {
          ...prev,
          data: [...prev.data, sessionData],
        } : null);
      }
      
      return { fingerDetected: true };
      
    } catch (error) {
      console.error('PPG processing error:', error);
      return null;
    }
  }, [currentSession]);

  const resetProcessor = useCallback(() => {
    processorRef.current.reset();
    bandpassFilterRef.current.reset();
    narrowFilterRef.current.reset();
    arrhythmiaDetectorRef.current.reset();
    waveformBufferRef.current = [];
    lastPeakTimeRef.current = 0;
    
    setVitalSigns({
      bpm: 0,
      spo2: 0,
      signalQuality: 0,
      lastRR: 0,
      isArrhythmic: false,
    });
    setPpgWaveform([]);
  }, []);

  const startSession = useCallback(() => {
    const session: Session = {
      id: `session_${Date.now()}`,
      startTime: Date.now(),
      data: [],
    };
    setCurrentSession(session);
  }, []);

  const stopSession = useCallback(() => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        endTime: Date.now(),
      } : null);
    }
  }, [currentSession]);

  const getCurrentSession = useCallback(() => {
    return currentSession;
  }, [currentSession]);

  return {
    vitalSigns,
    ppgWaveform,
    processPPGFrame,
    resetProcessor,
    startSession,
    stopSession,
    getCurrentSession,
  };
}