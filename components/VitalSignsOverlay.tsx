import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VitalSignsOverlayProps {
  bpm: number;
  spo2: number;
  signalQuality: number;
  lastRR: number;
  isArrhythmic: boolean;
}

export function VitalSignsOverlay({
  bpm,
  spo2,
  signalQuality,
  lastRR,
  isArrhythmic
}: VitalSignsOverlayProps) {
  const formatRR = (rr: number): string => {
    if (rr === 0) return '--';
    return (rr / 1000).toFixed(1) + 's';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.6)', 'rgba(0, 0, 0, 0.8)']}
        style={styles.background}
      />
      
      <View style={styles.mainReading}>
        <Text style={styles.bpmLabel}>BPM</Text>
        <Text style={[styles.bpmValue, isArrhythmic && styles.arrhythmicValue]}>
          {bpm > 0 ? bpm : '--'}
        </Text>
        {isArrhythmic && (
          <Text style={styles.arrhythmiaLabel}>ARRITMIA</Text>
        )}
      </View>
      
      <View style={styles.secondaryReadings}>
        <View style={styles.readingGroup}>
          <Text style={styles.label}>SpO₂</Text>
          <Text style={styles.value}>{spo2 > 0 ? `${spo2}%` : '--%'}</Text>
          <Text style={styles.subtitle}>Experimental</Text>
        </View>
        
        <View style={styles.readingGroup}>
          <Text style={styles.label}>Calidad</Text>
          <Text style={[styles.value, { color: signalQuality > 70 ? '#10B981' : signalQuality > 40 ? '#F59E0B' : '#EF4444' }]}>
            {signalQuality}%
          </Text>
          <Text style={styles.subtitle}>Señal</Text>
        </View>
        
        <View style={styles.readingGroup}>
          <Text style={styles.label}>RR</Text>
          <Text style={styles.value}>{formatRR(lastRR)}</Text>
          <Text style={styles.subtitle}>Último</Text>
        </View>
      </View>
      
      {/* Signal Quality Bar */}
      <View style={styles.qualityBar}>
        <View style={styles.qualityBarBackground}>
          <LinearGradient
            colors={['#EF4444', '#F59E0B', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.qualityBarFill, { width: `${Math.min(100, signalQuality)}%` }]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  mainReading: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  bpmLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
    letterSpacing: 2,
  },
  bpmValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#3B82F6',
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 4,
  },
  arrhythmicValue: {
    color: '#EF4444',
    textShadowColor: 'rgba(239, 68, 68, 0.5)',
  },
  arrhythmiaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 1,
  },
  secondaryReadings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  readingGroup: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
    letterSpacing: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  qualityBar: {
    width: '100%',
    marginBottom: 20,
  },
  qualityBarBackground: {
    height: 4,
    backgroundColor: 'rgba(156, 163, 175, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  qualityBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});