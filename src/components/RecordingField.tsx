import React from 'react';
import { X, Link, Upload } from 'lucide-react';
import FileUpload from './FileUpload';
import FormField from './FormField';
import { Recording, FormType } from '../types';

interface RecordingFieldProps {
  recording: Recording;
  onUpdate: (recording: Recording) => void;
  onRemove: () => void;
  progress?: number;
  showRemove?: boolean;
  activeTab: FormType;
}

export default function RecordingField({
  recording,
  onUpdate,
  onRemove,
  progress,
  showRemove = true,
  activeTab
}: RecordingFieldProps) {
  const placeholder = activeTab === 'sales' 
    ? "https://example.com/recording.mp3" 
    : "https://example.com/presentation.pdf";

  return (
    <div className="space-y-3 p-4 bg-gray-900/50 backdrop-blur-lg rounded-lg relative
      border border-white/20 shadow-[0_4px_16px_0_rgba(31,38,135,0.05)]
      hover:shadow-[0_4px_16px_0_rgba(31,38,135,0.1)] hover:bg-gray-900/60 
      transition-all duration-300">
      {showRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 
            rounded-full hover:bg-red-50 transition-all duration-200 
            transform hover:scale-110 active:scale-95"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      
      <div className="space-y-3">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => onUpdate({ ...recording, inputType: 'file', inputUrl: '' })}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
              ${recording.inputType === 'file' 
                ? 'bg-blue-100/50 text-blue-200' 
                : 'text-gray-300 hover:bg-gray-100/50'}`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => onUpdate({ ...recording, inputType: 'url', file: null })}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
              ${recording.inputType === 'url' 
                ? 'bg-blue-100/50 text-blue-200' 
                : 'text-gray-300 hover:bg-gray-100/50'}`}
          >
            <Link className="w-4 h-4 mr-2" />
            Add URL
          </button>
        </div>

        <FormField label="Recording" required>
          {recording.inputType === 'file' ? (
            <FileUpload
              id={recording.id}
              file={recording.file}
              onFileSelect={(file) => onUpdate({ ...recording, file })}
              progress={progress}
            />
          ) : (
            <input
              type="url"
              value={recording.inputUrl || ''}
              onChange={(e) => onUpdate({ ...recording, inputUrl: e.target.value })}
              placeholder={placeholder}
              className="form-input"
            />
          )}
        </FormField>
      </div>

      <FormField label={recording.inputType === 'file' && activeTab === 'sales' ? 'Timestamp Notes' : 'Notes about the document / file / asset'}>
        <textarea
          value={recording.timestamp_notes}
          onChange={(e) => onUpdate({ ...recording, timestamp_notes: e.target.value })}
          className="form-textarea"
          placeholder={recording.inputType === 'file' && activeTab === 'sales' 
            ? "e.g., 2:30 - Discussion about property value"
            : "Add any relevant notes, sections to review, or specific feedback needed"}
          rows={3}
        />
      </FormField>
    </div>
  );
}