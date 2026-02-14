'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Loader2, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { fileService } from '@/lib/services/file.service';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/gif',
];

interface FileUploaderProps {
  vaultId: string;
  onUploadComplete?: (filename: string) => void;
}

export default function FileUploader({ vaultId, onUploadComplete }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState('');

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 50 MB.`;
    }
    // Allow if type matches or if extension is known
    const ext = file.name.split('.').pop()?.toLowerCase();
    const knownExts = ['pdf', 'docx', 'csv', 'xlsx', 'png', 'jpg', 'jpeg', 'gif'];
    if (!ALLOWED_TYPES.includes(file.type) && (!ext || !knownExts.includes(ext))) {
      return 'File type not supported. Please upload PDF, DOCX, CSV, XLSX, or image files.';
    }
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      setError('');
      setUploadSuccess(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      setError('');
      setUploadSuccess(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');
    setUploadProgress(10);

    try {
      // Calculate checksum
      const buffer = await selectedFile.arrayBuffer();
      setUploadProgress(30);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setUploadProgress(50);

      // Upload file with checksum
      const result = await fileService.uploadFile(vaultId, selectedFile, hashHex);
      setUploadProgress(90);

      if (result.status === 'success') {
        setUploadProgress(100);
        setUploadSuccess(true);
        if (onUploadComplete) {
          onUploadComplete(selectedFile.name);
        }
        // Reset after a brief delay so user sees success
        setTimeout(() => {
          setSelectedFile(null);
          setUploadProgress(0);
          setUploadSuccess(false);
        }, 1500);
      } else {
        setError(result.error || 'Failed to upload file');
        setUploadProgress(0);
      }
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      setUploadProgress(0);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <Upload className="mb-3 h-8 w-8 text-gray-400" />
        <p className="text-sm font-medium text-gray-900">
          Drag and drop files here, or{' '}
          <label className="cursor-pointer text-blue-600 hover:underline">
            browse
            <input
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.docx,.csv,.xlsx,.png,.jpg,.jpeg,.gif"
              disabled={uploading}
            />
          </label>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF, DOCX, CSV, XLSX, images &middot; Max 50 MB
        </p>
      </div>

      {selectedFile && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-blue-600" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {uploadSuccess ? (
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Done
                </span>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload'
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setError('');
                    }}
                    disabled={uploading}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove file</span>
                  </button>
                </>
              )}
            </div>
          </div>
          {uploading && (
            <Progress value={uploadProgress} className="mt-2 h-1.5" />
          )}
        </div>
      )}
    </div>
  );
}
