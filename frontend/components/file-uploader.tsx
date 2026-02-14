'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fileService } from '@/lib/services/file.service';

interface FileUploaderProps {
  vaultId: string;
  onUploadComplete?: (filename: string) => void;
}

export default function FileUploader({ vaultId, onUploadComplete }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

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
      setSelectedFile(file);
      setError('');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError('');

    try {
      // Calculate SHA-256 checksum using Web Crypto API
      const buffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      const result = await fileService.uploadFile(vaultId, selectedFile, hashHex);

      if (result.status === 'success') {
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
        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <span className="truncate text-sm text-foreground">{selectedFile.name}</span>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
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
      )}
    </div>
  );
}
