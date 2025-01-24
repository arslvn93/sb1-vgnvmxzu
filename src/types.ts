export type FormType = 'sales' | 'marketing';

export interface Recording {
  id: string;
  file: File | null;
  inputType: 'file' | 'url';
  inputUrl?: string;
  url?: string;
  timestamp_notes: string;
  clientName: string;
  interactionDate: string;
  strengths: string;
  improvements: string;
}

export interface FormData {
  fullName: string;
  email: string;
  recordings: Recording[];
  formType?: FormType;
}

export interface UploadProgress {
  [key: string]: number;
}