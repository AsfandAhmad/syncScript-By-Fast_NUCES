'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fileService } from '@/lib/services/file.service';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'text/plain',
];

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 50 MB.`;
  }
  if (ALLOWED_TYPES.length > 0 && !ALLOWED_TYPES.includes(file.type)) {
    return `File type "${file.type || 'unknown'}" is not allowed. Accepted: PDF, DOCX, CSV, XLSX, PNG, JPG, TXT.`;
  }
  return null;
}

interface FileUploaderProps {
  vaultId: string;
  onUploadComplete?: (filename: string) => void;
}

export default function FileUploader({ vaultId, onUploadComplete }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const selectFile = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSelectedFile(file);
    setError('');
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
    if (file) selectFile(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError('');
    setProgress(0);

    try {
      // Simulate progress while calculating checksum
      setProgress(10);

      // Calculate SHA-256 checksum using Web Crypto API
      const buffer = await selectedFile.arrayBuffer();
      setProgress(30);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      setProgress(50);
      const result = await fileService.uploadFile(vaultId, selectedFile, hashHex);
      setProgress(90);

      if (result.status === 'success') {
        setProgress(100);
        onUploadComplete?.(selectedFile.name);
        setSelectedFile(null);
      } else {
        setError(result.error || 'Failed to upload file');
      }
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
      setProgress(0);
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
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <Upload className="mb-3 h-8 w-8 text-muted-foreground/60" />
        <p className="text-sm font-medium text-foreground">
          Drop files here or{' '}
          <label className="cursor-pointer text-primary hover:underline">
            browse
            <input
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.docx,.csv,.xlsx,.png,.jpg,.jpeg,.txt"
              disabled={uploading}
            />
          </label>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, CSV, images up to 50 MB</p>
      </div>

      {selectedFile && (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
            <span className="truncate text-sm text-foreground">{selectedFile.name}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                disabled={uploading}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          {uploading && progress > 0 && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
