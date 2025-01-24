import React, { useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  progress?: number;
  file?: File | null;
  id: string;
}

export default function FileUpload({ 
  onFileSelect, 
  progress, 
  id, 
  file
}: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null as any);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: undefined // Allow all file types
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300
        backdrop-blur-sm
        ${isDragActive ? 'border-blue-500 bg-blue-900/50 scale-[1.02]' : file ? 'border-green-500/30 bg-gray-900/50' : 'border-gray-400 hover:border-blue-400 bg-gray-900/30'}
        cursor-pointer`}
    >
      <input {...getInputProps()} id={id} />
      <div className="flex flex-col items-center justify-center space-y-2">
        {file ? (
          <>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-green-500/70" />
                <div>
                  <p className="text-sm font-medium text-gray-200">{file.name}</p>
                  <p className="text-xs text-gray-300">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={handleRemove}
                className="p-1 hover:bg-red-50 rounded-full transition-colors duration-200"
              >
                <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 text-blue-500/70 transform group-hover:scale-110 transition-transform duration-300" />
            <p className="text-sm text-gray-200">
              {isDragActive ? (
                "Drop your file here"
              ) : (
                "Drag & drop your file here, or click to select"
              )}
            </p>
          </>
        )}
      </div>
      {progress !== undefined && progress > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}