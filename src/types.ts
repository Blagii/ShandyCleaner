export type ProcessMode = 'file' | 'zip';
export type Status = 'idle' | 'processing' | 'success' | 'error' | 'stopped';

export interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: string;
}

export interface ProcessedFile {
  name: string;
  status: 'success' | 'error' | 'skipped';
  originalSize: number;
  newSize: number;
  content?: string; // Storing cleaned content for preview
  errorMsg?: string;
}
