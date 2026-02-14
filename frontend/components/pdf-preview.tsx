'use client';

import { FileText, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface PdfPreviewProps {
  fileName: string | null;
  fileUrl?: string | null;
}

export function PdfPreview({ fileName, fileUrl }: PdfPreviewProps) {
  const [loadError, setLoadError] = useState(false);

  if (!fileName) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="font-medium text-muted-foreground">No file selected</p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Select a file from the list to preview it here.
        </p>
      </div>
    );
  }

  const isPdf = fileName.toLowerCase().endsWith('.pdf');
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(fileName);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-sm font-medium text-foreground">
            {fileName}
          </span>
        </div>
        {fileUrl && (
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
              <a href={fileUrl} download={fileName}>
                <Download className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-auto">
        {fileUrl && isPdf && !loadError ? (
          <iframe
            src={fileUrl}
            className="h-full w-full"
            title={`Preview: ${fileName}`}
            onError={() => setLoadError(true)}
          />
        ) : fileUrl && isImage && !loadError ? (
          <div className="flex h-full items-center justify-center p-4">
            <img
              src={fileUrl}
              alt={fileName}
              className="max-h-full max-w-full object-contain rounded"
              onError={() => setLoadError(true)}
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <FileText className="mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">
              {loadError
                ? 'Failed to load preview'
                : 'Preview not available'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              {fileUrl
                ? 'Open the file externally to view it.'
                : 'No download URL available for this file.'}
            </p>
            {fileUrl && (
              <Button variant="outline" size="sm" className="mt-3 gap-1.5" asChild>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in new tab
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
