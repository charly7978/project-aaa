import { useCallback } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export function useAudioFeedback() {
  const playHeartbeat = useCallback(async () => {
    if (Platform.OS === 'web') {
      // Web implementation using Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Generate a short beep sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        console.warn('Web audio not available:', error);
      }
    } else {
      // Mobile implementation would use Expo Audio
      try {
        // For production, you would load and play an actual sound file
        // const { sound } = await Audio.Sound.createAsync(require('@/assets/sounds/heartbeat.wav'));
        // await sound.playAsync();
      } catch (error) {
        console.warn('Mobile audio not available:', error);
      }
    }
  }, []);

  return { playHeartbeat };
}