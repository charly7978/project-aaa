import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

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

export async function exportSession(session: Session): Promise<void> {
  if (!session || session.data.length === 0) {
    throw new Error('No data to export');
  }

  const csvContent = generateCSV(session);
  const jsonContent = generateJSON(session);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFilename = `vital_signs_session_${timestamp}`;
  
  if (Platform.OS === 'web') {
    // Web export - download files
    downloadFile(`${baseFilename}.csv`, csvContent, 'text/csv');
    downloadFile(`${baseFilename}.json`, jsonContent, 'application/json');
  } else {
    // Mobile export - save to documents
    const documentsDirectory = FileSystem.documentDirectory;
    if (!documentsDirectory) {
      throw new Error('Documents directory not available');
    }
    
    const csvPath = `${documentsDirectory}${baseFilename}.csv`;
    const jsonPath = `${documentsDirectory}${baseFilename}.json`;
    
    await FileSystem.writeAsStringAsync(csvPath, csvContent);
    await FileSystem.writeAsStringAsync(jsonPath, jsonContent);
    
    console.log(`Files saved to: ${csvPath}, ${jsonPath}`);
  }
}

function generateCSV(session: Session): string {
  const headers = [
    'timestamp',
    'datetime',
    'raw_value',
    'filtered_value',
    'peak_flag',
    'bpm_instant',
    'spo2_estimate',
    'signal_quality'
  ];
  
  let csvContent = headers.join(',') + '\n';
  
  session.data.forEach(row => {
    const datetime = new Date(row.timestamp).toISOString();
    const csvRow = [
      row.timestamp,
      datetime,
      row.rawValue.toFixed(6),
      row.filteredValue.toFixed(6),
      row.peakFlag ? '1' : '0',
      row.bpmInstant,
      row.spo2Estimate,
      row.signalQuality
    ];
    csvContent += csvRow.join(',') + '\n';
  });
  
  return csvContent;
}

function generateJSON(session: Session): string {
  const exportData = {
    session: {
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime || Date.now(),
      duration: (session.endTime || Date.now()) - session.startTime,
      dataPoints: session.data.length
    },
    metadata: {
      exportTime: new Date().toISOString(),
      version: '1.0.0',
      format: 'PPG Vital Signs Data',
      disclaimer: 'This data is for reference only and should not be used for medical diagnosis.'
    },
    data: session.data.map(row => ({
      timestamp: row.timestamp,
      datetime: new Date(row.timestamp).toISOString(),
      measurements: {
        rawPPG: row.rawValue,
        filteredPPG: row.filteredValue,
        isPeak: row.peakFlag,
        heartRate: row.bpmInstant,
        spo2: row.spo2Estimate,
        signalQuality: row.signalQuality
      }
    }))
  };
  
  return JSON.stringify(exportData, null, 2);
}

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}