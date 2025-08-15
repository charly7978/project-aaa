import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PPGWaveformPoint {
  timestamp: number;
  value: number;
  isArrhythmic: boolean;
  isPeak: boolean;
}

interface PPGMonitorProps {
  waveformData: PPGWaveformPoint[];
  isArrhythmic: boolean;
  style?: any;
}

export function PPGMonitor({ waveformData, isArrhythmic, style }: PPGMonitorProps) {
  const animationRef = useRef<number>();
  const timeOffsetRef = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      timeOffsetRef.current += 16; // ~60fps
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const renderWaveform = (): string => {
    if (waveformData.length < 2) return '';

    const width = SCREEN_WIDTH;
    const height = SCREEN_HEIGHT;
    const centerY = height / 2;
    
    // Calculate scale based on data range
    const values = waveformData.map(point => point.value);
    const minValue = Math.min(...values, -1);
    const maxValue = Math.max(...values, 1);
    const range = Math.max(maxValue - minValue, 2);
    const scale = (height * 0.3) / range; // Use 30% of screen height for waveform
    
    // Time window: show last 10 seconds
    const timeWindow = 10000; // 10 seconds
    const currentTime = Date.now();
    const windowStart = currentTime - timeWindow;
    
    // Filter points within time window
    const windowData = waveformData.filter(point => point.timestamp >= windowStart);
    
    if (windowData.length < 2) return '';
    
    // Generate path
    let path = '';
    
    windowData.forEach((point, index) => {
      const timeRatio = (point.timestamp - windowStart) / timeWindow;
      const x = timeRatio * width;
      const y = centerY - (point.value - (minValue + maxValue) / 2) * scale;
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  };

  const renderGridLines = () => {
    const lines = [];
    const gridSpacing = 40;
    
    // Horizontal lines
    for (let y = 0; y < SCREEN_HEIGHT; y += gridSpacing) {
      lines.push(
        <Line
          key={`h-${y}`}
          x1="0"
          y1={y}
          x2={SCREEN_WIDTH}
          y2={y}
          stroke="rgba(59, 130, 246, 0.1)"
          strokeWidth="1"
        />
      );
    }
    
    // Vertical lines
    for (let x = 0; x < SCREEN_WIDTH; x += gridSpacing) {
      lines.push(
        <Line
          key={`v-${x}`}
          x1={x}
          y1="0"
          x2={x}
          y2={SCREEN_HEIGHT}
          stroke="rgba(59, 130, 246, 0.1)"
          strokeWidth="1"
        />
      );
    }
    
    return lines;
  };

  const renderPeaks = () => {
    if (waveformData.length === 0) return null;
    
    const timeWindow = 10000;
    const currentTime = Date.now();
    const windowStart = currentTime - timeWindow;
    
    const windowData = waveformData.filter(point => point.timestamp >= windowStart);
    const peaks = windowData.filter(point => point.isPeak);
    
    const values = windowData.map(point => point.value);
    const minValue = Math.min(...values, -1);
    const maxValue = Math.max(...values, 1);
    const range = Math.max(maxValue - minValue, 2);
    const scale = (SCREEN_HEIGHT * 0.3) / range;
    const centerY = SCREEN_HEIGHT / 2;
    
    return peaks.map((peak, index) => {
      const timeRatio = (peak.timestamp - windowStart) / timeWindow;
      const x = timeRatio * SCREEN_WIDTH;
      const y = centerY - (peak.value - (minValue + maxValue) / 2) * scale;
      
      return (
        <Circle
          key={`peak-${peak.timestamp}-${index}`}
          cx={x}
          cy={y}
          r="4"
          fill={peak.isArrhythmic ? "#EF4444" : "#10B981"}
          opacity="0.8"
        />
      );
    });
  };

  return (
    <View style={[styles.container, style]}>
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={styles.svg}>
        <Defs>
          <LinearGradient id="normalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#06B6D4" stopOpacity="0.8" />
          </LinearGradient>
          <LinearGradient id="arrhythmicGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8" />
          </LinearGradient>
        </Defs>
        
        {/* Grid */}
        {renderGridLines()}
        
        {/* Baseline */}
        <Line
          x1="0"
          y1={SCREEN_HEIGHT / 2}
          x2={SCREEN_WIDTH}
          y2={SCREEN_HEIGHT / 2}
          stroke="rgba(156, 163, 175, 0.3)"
          strokeWidth="1"
          strokeDasharray="5,5"
        />
        
        {/* Waveform */}
        <Path
          d={renderWaveform()}
          stroke={isArrhythmic ? "url(#arrhythmicGradient)" : "url(#normalGradient)"}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Peaks */}
        {renderPeaks()}
      </Svg>
      
      {/* Glow effect overlay */}
      <View style={styles.glowOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.02)',
    pointerEvents: 'none',
  },
});