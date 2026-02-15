'use client';

import { useState, useEffect } from 'react';
import { Download, Loader2, FileText, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fileService } from '@/lib/services/file.service';
import type { FileRecord } from '@/lib/database.types';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || ''))
    return <ImageIcon className="h-5 w-5 text-blue-500" />;
  if (['csv', 'xlsx', 'xls'].includes(ext || ''))
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  return <FileText className="h-5 w-5 text-primary" />;
}

function isImageFile(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
}

function isPdfFile(name: string) {
  return name.toLowerCase().endsWith('.pdf');
}

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileRecord | null;
}

export function FilePreviewDialog({ open, onOpenChange, file }: FilePreviewDialogProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  useEffect(() => {
    if (!open || !file) {
      setSignedUrl(null);
      return;
    }

    const fetchUrl = async () => {
      setLoadingUrl(true);
      try {
        const result = await fileService.getSignedUrl(file.file_url);
        setSignedUrl(result.url);
      } finally {
        setLoadingUrl(false);
      }
    };
    fetchUrl();
  }, [open, file]);

  if (!file) return null;

  const canPreview = isImageFile(file.file_name) || isPdfFile(file.file_name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon(file.file_name)}
            <span className="truncate">{file.file_name}</span>
          </DialogTitle>
          <DialogDescription>
            {formatFileSize(file.file_size)} · Uploaded{' '}
            {new Date(file.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="min-h-[200px] rounded-lg border bg-muted/30">
          {loadingUrl ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !signedUrl ? (
            <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
              <FileText className="mb-2 h-10 w-10" />
              <p className="text-sm">Unable to load preview</p>
            </div>
          ) : isImageFile(file.file_name) ? (
            <div className="flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt={file.file_name}
                className="max-h-[400px] rounded-md object-contain"
              />
            </div>
          ) : isPdfFile(file.file_name) ? (
            <iframe
              src={signedUrl}
              className="h-[500px] w-full rounded-md"
              title={file.file_name}
            />
          ) : (
            <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
              {getFileIcon(file.file_name)}
              <p className="mt-2 text-sm">Preview not available for this file type.</p>
            </div>
          )}
        </div>

        {/* Download */}
        {signedUrl && (
          <div className="flex justify-end">
            <Button asChild>
              <a href={signedUrl} target="_blank" rel="noopener noreferrer" download>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
