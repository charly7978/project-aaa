import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePPGProcessor } from '@/hooks/usePPGProcessor';
import { PPGMonitor } from '@/components/PPGMonitor';
import { VitalSignsOverlay } from '@/components/VitalSignsOverlay';
import { SignalQualityIndicator } from '@/components/SignalQualityIndicator';
import { useAudioFeedback } from '@/hooks/useAudioFeedback';
import { exportSession } from '@/utils/dataExporter';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VitalSigns {
  bpm: number;
  spo2: number;
  signalQuality: number;
  lastRR: number;
  isArrhythmic: boolean;
}

export default function VitalSignsMonitor() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fingerDetected, setFingerDetected] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const animationFrameRef = useRef<number>();
  
  const {
    vitalSigns,
    ppgWaveform,
    processPPGFrame,
    resetProcessor,
    startSession,
    stopSession,
    getCurrentSession
  } = usePPGProcessor();
  
  const { playHeartbeat } = useAudioFeedback();

  // Request camera permissions
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Handle heartbeat feedback
  useEffect(() => {
    if (vitalSigns.bpm > 0 && soundEnabled && fingerDetected) {
      playHeartbeat();
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [vitalSigns.bpm, soundEnabled, fingerDetected]);

  // Función para procesar frames de video continuamente
  const processVideoFrame = useCallback(async (frame: any) => {
    if (!isMonitoring || !frame) return;

    try {
      // En expo-camera, el frame de video no tiene un método directo para convertir a base64
      // Usamos una técnica alternativa para capturar el frame actual
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.1,
          base64: true,
          skipProcessing: true,
          isImageMirror: false,
        });

        if (photo && photo.base64) {
          const processed = await processPPGFrame(photo.base64);
          if (processed) {
            setFingerDetected(processed.fingerDetected);
          }
        }
      }
    } catch (error) {
      console.error('Frame processing error:', error);
    }
  }, [isMonitoring, processPPGFrame]);

  const handleStartMonitoring = useCallback(() => {
    if (!disclaimerAccepted) {
      Alert.alert(
        'Descargo de Responsabilidad',
        'Esta aplicación es solo para uso referencial y no sustituye el diagnóstico médico profesional. Los valores mostrados son estimaciones experimentales.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Acepto', 
            onPress: () => {
              setDisclaimerAccepted(true);
              startMonitoringProcess();
            }
          }
        ]
      );
    } else {
      startMonitoringProcess();
    }
  }, [disclaimerAccepted]);

  const startMonitoringProcess = useCallback(() => {
    resetProcessor();
    startSession();
    setIsMonitoring(true);
    // Iniciar captura continua de frames
    const captureLoop = async () => {
      if (isMonitoring && cameraRef.current) {
        await processVideoFrame({});
        // Programar siguiente captura (30 FPS)
        setTimeout(captureLoop, 33);
      }
    };
    captureLoop();
  }, [resetProcessor, startSession, isMonitoring, processVideoFrame]);

  const handleStopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    stopSession();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [stopSession]);

  const handleExportSession = useCallback(async () => {
    const session = getCurrentSession();
    if (session && session.data.length > 0) {
      try {
        await exportSession(session);
        Alert.alert('Éxito', 'Sesión exportada correctamente');
      } catch (error) {
        Alert.alert('Error', 'No se pudo exportar la sesión');
      }
    } else {
      Alert.alert('Sin datos', 'No hay datos para exportar');
    }
  }, [getCurrentSession]);

  const toggleFlash = useCallback(() => {
    setFlashEnabled((prev: boolean) => !prev);
  }, []);

  // Función auxiliar para convertir frame de video a base64
  const frameToBase64 = async (frame: any): Promise<string | null> => {
    try {
      // En una implementación real, necesitarías procesar el frame
      // Por ahora, usaremos takePictureAsync como fallback
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.1,
          base64: true,
          skipProcessing: true,
          isImageMirror: false,
        });
        return photo?.base64 || null;
      }
      return null;
    } catch (error) {
      console.error('Frame to base64 conversion error:', error);
      return null;
    }
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Cargando permisos...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera" size={64} color="#9CA3AF" />
        <Text style={styles.permissionTitle}>Permisos de Cámara Requeridos</Text>
        <Text style={styles.permissionText}>
          Esta aplicación necesita acceso a la cámara trasera para medir signos vitales
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Camera View - Background */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flashEnabled ? "on" : "off"}
        enableTorch={flashEnabled}
        mode="video" // Importante: establecer modo video para captura continua
        onFrameProcessed={isMonitoring ? async (frame: any) => {
          try {
            // Procesar frames del video de manera continua
            await processVideoFrame(frame);
          } catch (error) {
            console.error('Frame processing error:', error);
          }
        } : undefined}
      >
        {/* PPG Monitor - Full Screen Background */}
        <PPGMonitor
          waveformData={ppgWaveform}
          isArrhythmic={vitalSigns.isArrhythmic}
          style={styles.monitor}
        />

        {/* Top Overlays */}
        <View style={styles.topOverlays}>
          {/* Status Indicator */}
          <View style={styles.statusContainer}>
            <SignalQualityIndicator
              quality={vitalSigns.signalQuality}
              fingerDetected={fingerDetected}
              isMonitoring={isMonitoring}
            />
          </View>

          {/* Flash Control */}
          <TouchableOpacity
            style={[styles.controlButton, flashEnabled && styles.controlButtonActive]}
            onPress={toggleFlash}
          >
            <Ionicons
              name={flashEnabled ? "flash" : "flash-off"}
              size={24}
              color={flashEnabled ? "#FCD34D" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>

        {/* Vital Signs Overlay - Bottom Center */}
        <VitalSignsOverlay
          bpm={vitalSigns.bpm}
          spo2={vitalSigns.spo2}
          signalQuality={vitalSigns.signalQuality}
          lastRR={vitalSigns.lastRR}
          isArrhythmic={vitalSigns.isArrhythmic}
        />

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Start/Stop Button */}
          <TouchableOpacity
            style={[styles.mainButton, isMonitoring && styles.stopButton]}
            onPress={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
          >
            <Ionicons
              name={isMonitoring ? "stop" : "play"}
              size={32}
              color="white"
            />
            <Text style={styles.mainButtonText}>
              {isMonitoring ? "Parar" : "Iniciar"}
            </Text>
          </TouchableOpacity>

          {/* Export Button */}
          <TouchableOpacity style={styles.actionButton} onPress={handleExportSession}>
            <Ionicons name="download" size={20} color="#3B82F6" />
          </TouchableOpacity>

          {/* Sound Toggle */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setSoundEnabled((prev: boolean) => !prev)}
          >
            <Ionicons
              name={soundEnabled ? "volume-high" : "volume-mute"}
              size={20}
              color={soundEnabled ? "#10B981" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  monitor: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  topOverlays: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  controlButtonActive: {
    borderColor: '#FCD34D',
    backgroundColor: 'rgba(252, 211, 77, 0.2)',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  stopButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  mainButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
});
