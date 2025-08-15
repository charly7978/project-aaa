import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface HistorySession {
  id: string;
  date: Date;
  duration: number;
  avgBpm: number;
  avgSpo2: number;
  dataPoints: number;
  arrhythmiaEvents: number;
}

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = () => {
    // In a real app, this would load from AsyncStorage or a database
    const mockSessions: HistorySession[] = [
      {
        id: 'session_1',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        duration: 120000, // 2 minutes
        avgBpm: 72,
        avgSpo2: 98,
        dataPoints: 1200,
        arrhythmiaEvents: 0,
      },
      {
        id: 'session_2',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        duration: 180000, // 3 minutes
        avgBpm: 85,
        avgSpo2: 97,
        dataPoints: 1800,
        arrhythmiaEvents: 2,
      },
      {
        id: 'session_3',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        duration: 90000, // 1.5 minutes
        avgBpm: 68,
        avgSpo2: 99,
        dataPoints: 900,
        arrhythmiaEvents: 0,
      },
    ];
    
    setSessions(mockSessions);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistoryData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleSessionPress = (session: HistorySession) => {
    Alert.alert(
      'Detalles de Sesión',
      `Fecha: ${session.date.toLocaleString('es-ES')}\n` +
      `Duración: ${formatDuration(session.duration)}\n` +
      `BPM Promedio: ${session.avgBpm}\n` +
      `SpO₂ Promedio: ${session.avgSpo2}%\n` +
      `Puntos de Datos: ${session.dataPoints}\n` +
      `Eventos de Arritmia: ${session.arrhythmiaEvents}`,
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Exportar', onPress: () => handleExportSession(session) },
      ]
    );
  };

  const handleExportSession = (session: HistorySession) => {
    Alert.alert('Exportar Sesión', 'Función de exportación en desarrollo');
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Limpiar Historial',
      '¿Está seguro de que desea eliminar todo el historial de sesiones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setSessions([]);
            Alert.alert('Historial Limpio', 'Se ha eliminado todo el historial');
          },
        },
      ]
    );
  };

  const renderSessionCard = (session: HistorySession) => (
    <TouchableOpacity
      key={session.id}
      style={styles.sessionCard}
      onPress={() => handleSessionPress(session)}
    >
      <LinearGradient
        colors={['rgba(55, 65, 81, 0.8)', 'rgba(31, 41, 55, 0.8)']}
        style={styles.cardGradient}
      />
      
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
          <Text style={styles.sessionDuration}>
            {formatDuration(session.duration)}
          </Text>
        </View>
        <View style={styles.statusIndicator}>
          {session.arrhythmiaEvents > 0 ? (
            <Ionicons name="warning" size={20} color="#F59E0B" />
          ) : (
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          )}
        </View>
      </View>

      <View style={styles.vitalSignsRow}>
        <View style={styles.vitalSign}>
          <Ionicons name="pulse" size={16} color="#3B82F6" />
          <Text style={styles.vitalSignLabel}>BPM</Text>
          <Text style={styles.vitalSignValue}>{session.avgBpm}</Text>
        </View>
        
        <View style={styles.vitalSign}>
          <Ionicons name="water" size={16} color="#06B6D4" />
          <Text style={styles.vitalSignLabel}>SpO₂</Text>
          <Text style={styles.vitalSignValue}>{session.avgSpo2}%</Text>
        </View>
        
        <View style={styles.vitalSign}>
          <Ionicons name="bar-chart" size={16} color="#8B5CF6" />
          <Text style={styles.vitalSignLabel}>Datos</Text>
          <Text style={styles.vitalSignValue}>{session.dataPoints}</Text>
        </View>
      </View>

      {session.arrhythmiaEvents > 0 && (
        <View style={styles.arrhythmiaWarning}>
          <Ionicons name="warning" size={16} color="#F59E0B" />
          <Text style={styles.arrhythmiaText}>
            {session.arrhythmiaEvents} evento{session.arrhythmiaEvents !== 1 ? 's' : ''} de arritmia
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#111827', '#1F2937', '#111827']}
        style={styles.gradient}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Ionicons name="document-text" size={32} color="#3B82F6" />
          <Text style={styles.title}>Historial de Sesiones</Text>
          <Text style={styles.subtitle}>
            Revisar mediciones anteriores y exportar datos
          </Text>
        </View>

        {/* Statistics Summary */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.1)', 'rgba(6, 182, 212, 0.1)']}
            style={styles.summaryGradient}
          />
          <Text style={styles.summaryTitle}>Resumen</Text>
          <View style={styles.summaryStats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{sessions.length}</Text>
              <Text style={styles.statLabel}>Sesiones</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {sessions.length > 0
                  ? Math.round(sessions.reduce((sum, s) => sum + s.avgBpm, 0) / sessions.length)
                  : '--'}
              </Text>
              <Text style={styles.statLabel}>BPM Prom.</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {sessions.reduce((sum, s) => sum + s.arrhythmiaEvents, 0)}
              </Text>
              <Text style={styles.statLabel}>Arritmias</Text>
            </View>
          </View>
        </View>

        {/* Session List */}
        <View style={styles.sessionsList}>
          <Text style={styles.sectionTitle}>Sesiones Recientes</Text>
          
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#6B7280" />
              <Text style={styles.emptyTitle}>Sin Sesiones</Text>
              <Text style={styles.emptyText}>
                Las sesiones de medición aparecerán aquí una vez que realice mediciones
              </Text>
            </View>
          ) : (
            <>
              {sessions.map(renderSessionCard)}
              
              {/* Clear History Button */}
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearHistory}
              >
                <Ionicons name="trash" size={20} color="#EF4444" />
                <Text style={styles.clearButtonText}>Limpiar Historial</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F9FAFB',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  summaryGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  sessionsList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  sessionCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.5)',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 2,
  },
  sessionDuration: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statusIndicator: {
    marginLeft: 16,
  },
  vitalSignsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  vitalSign: {
    alignItems: 'center',
    flex: 1,
  },
  vitalSignLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 2,
  },
  vitalSignValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  arrhythmiaWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
  },
  arrhythmiaText: {
    fontSize: 12,
    color: '#F59E0B',
    marginLeft: 8,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 240,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 16,
  },
  clearButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});