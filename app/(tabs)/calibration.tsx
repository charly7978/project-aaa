import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function CalibrationScreen() {
  const [spo2Offset, setSpo2Offset] = useState('0');
  const [bpmOffset, setBpmOffset] = useState('0');
  const [signalSensitivity, setSignalSensitivity] = useState('1.0');
  const [autoFlash, setAutoFlash] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState(true);

  const handleSaveCalibration = () => {
    // Here you would save the calibration settings
    // to AsyncStorage or a similar persistent storage
    Alert.alert(
      'Calibración Guardada',
      'La configuración de calibración ha sido guardada exitosamente.',
      [{ text: 'OK' }]
    );
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Restaurar Valores por Defecto',
      '¿Está seguro de que desea restaurar todos los valores de calibración a sus configuraciones predeterminadas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: () => {
            setSpo2Offset('0');
            setBpmOffset('0');
            setSignalSensitivity('1.0');
            setAutoFlash(true);
            setHapticFeedback(true);
            setAudioFeedback(true);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <LinearGradient
        colors={['#111827', '#1F2937', '#111827']}
        style={styles.gradient}
      />
      
      <View style={styles.header}>
        <Ionicons name="settings" size={32} color="#3B82F6" />
        <Text style={styles.title}>Calibración y Configuración</Text>
        <Text style={styles.subtitle}>
          Ajuste los parámetros de medición para optimizar la precisión
        </Text>
      </View>

      {/* Signal Processing Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Procesamiento de Señal</Text>
        
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Sensibilidad de Señal</Text>
          <Text style={styles.settingDescription}>
            Ajusta la sensibilidad del detector de picos (0.5 - 2.0)
          </Text>
          <TextInput
            style={styles.input}
            value={signalSensitivity}
            onChangeText={setSignalSensitivity}
            keyboardType="numeric"
            placeholder="1.0"
            placeholderTextColor="#6B7280"
          />
        </View>
      </View>

      {/* Vital Signs Calibration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calibración de Signos Vitales</Text>
        
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Ajuste BPM</Text>
          <Text style={styles.settingDescription}>
            Corrección en latidos por minuto (-20 a +20)
          </Text>
          <TextInput
            style={styles.input}
            value={bpmOffset}
            onChangeText={setBpmOffset}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#6B7280"
          />
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Ajuste SpO₂</Text>
          <Text style={styles.settingDescription}>
            Corrección de saturación de oxígeno (-10 a +10)
          </Text>
          <TextInput
            style={styles.input}
            value={spo2Offset}
            onChangeText={setSpo2Offset}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#6B7280"
          />
        </View>
      </View>

      {/* Interface Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración de Interfaz</Text>
        
        <View style={styles.switchSetting}>
          <View style={styles.switchInfo}>
            <Text style={styles.settingLabel}>Flash Automático</Text>
            <Text style={styles.settingDescription}>
              Encender automáticamente la linterna al iniciar
            </Text>
          </View>
          <Switch
            value={autoFlash}
            onValueChange={setAutoFlash}
            trackColor={{ false: '#374151', true: '#3B82F6' }}
            thumbColor={autoFlash ? '#60A5FA' : '#9CA3AF'}
          />
        </View>

        <View style={styles.switchSetting}>
          <View style={styles.switchInfo}>
            <Text style={styles.settingLabel}>Retroalimentación Háptica</Text>
            <Text style={styles.settingDescription}>
              Vibración con cada latido detectado
            </Text>
          </View>
          <Switch
            value={hapticFeedback}
            onValueChange={setHapticFeedback}
            trackColor={{ false: '#374151', true: '#3B82F6' }}
            thumbColor={hapticFeedback ? '#60A5FA' : '#9CA3AF'}
          />
        </View>

        <View style={styles.switchSetting}>
          <View style={styles.switchInfo}>
            <Text style={styles.settingLabel}>Retroalimentación de Audio</Text>
            <Text style={styles.settingDescription}>
              Sonido de beep con cada latido
            </Text>
          </View>
          <Switch
            value={audioFeedback}
            onValueChange={setAudioFeedback}
            trackColor={{ false: '#374151', true: '#3B82F6' }}
            thumbColor={audioFeedback ? '#60A5FA' : '#9CA3AF'}
          />
        </View>
      </View>

      {/* Calibration Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instrucciones de Calibración</Text>
        
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>Calibración de SpO₂</Text>
            <Text style={styles.instructionText}>
              Para calibrar el SpO₂, compare las lecturas con un oxímetro certificado y ajuste el valor de corrección.
            </Text>
          </View>
        </View>

        <View style={styles.instructionCard}>
          <Ionicons name="pulse" size={24} color="#10B981" />
          <View style={styles.instructionContent}>
            <Text style={styles.instructionTitle}>Calibración de BPM</Text>
            <Text style={styles.instructionText}>
              Compare con un monitor cardíaco certificado y ajuste el offset según la diferencia promedio.
            </Text>
          </View>
        </View>

        <View style={styles.warningCard}>
          <Ionicons name="warning" size={24} color="#F59E0B" />
          <View style={styles.instructionContent}>
            <Text style={styles.warningTitle}>Importante</Text>
            <Text style={styles.warningText}>
              Esta aplicación es solo para uso referencial. Los valores calibrados no deben utilizarse para diagnóstico médico.
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetDefaults}
        >
          <Ionicons name="refresh" size={20} color="#EF4444" />
          <Text style={styles.resetButtonText}>Restaurar Defecto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveCalibration}
        >
          <Ionicons name="save" size={20} color="white" />
          <Text style={styles.saveButtonText}>Guardar Calibración</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  setting: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    lineHeight: 20,
  },
  input: {
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#F9FAFB',
  },
  switchSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 12,
    padding: 16,
  },
  instructionContent: {
    flex: 1,
    marginLeft: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    marginRight: 8,
  },
  resetButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    marginLeft: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});