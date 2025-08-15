import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SignalQualityIndicatorProps {
  quality: number;
  fingerDetected: boolean;
  isMonitoring: boolean;
}

export function SignalQualityIndicator({ 
  quality, 
  fingerDetected, 
  isMonitoring 
}: SignalQualityIndicatorProps) {
  const getStatus = () => {
    if (!isMonitoring) {
      return {
        text: 'Detenido',
        color: '#9CA3AF',
        icon: 'pause-circle' as const,
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
      };
    }
    
    if (!fingerDetected) {
      return {
        text: 'Detectando dedo',
        color: '#F59E0B',
        icon: 'finger-print' as const,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
      };
    }
    
    if (quality < 30) {
      return {
        text: 'Mejorar contacto',
        color: '#EF4444',
        icon: 'warning' as const,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
      };
    }
    
    if (quality < 60) {
      return {
        text: 'Señal moderada',
        color: '#F59E0B',
        icon: 'radio' as const,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
      };
    }
    
    return {
      text: 'Señal excelente',
      color: '#10B981',
      icon: 'checkmark-circle' as const,
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
    };
  };

  const status = getStatus();

  return (
    <View style={[styles.container, { backgroundColor: status.backgroundColor }]}>
      <Ionicons name={status.icon} size={20} color={status.color} />
      <Text style={[styles.text, { color: status.color }]}>
        {status.text}
      </Text>
      {fingerDetected && isMonitoring && (
        <Text style={styles.qualityText}>
          {quality}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    marginLeft: 8,
    minWidth: 30,
    textAlign: 'right',
  },
});