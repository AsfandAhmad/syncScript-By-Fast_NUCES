'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';

interface PdfPreviewProps {
  url: string;
  title?: string;
}

export function PdfPreview({ url, title }: PdfPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Determine if it's a PDF URL
  const isPdf = url.toLowerCase().endsWith('.pdf') || url.includes('/pdf');
  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;

  if (!isPdf) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 p-8 text-center">
        <FileText className="mb-3 h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm font-medium">{title || 'Source Preview'}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Preview is only available for PDF files.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-xs text-primary underline-offset-4 hover:underline"
        >
          Open in new tab →
        </a>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {error ? (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          <FileText className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Unable to load preview.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-xs text-primary underline-offset-4 hover:underline"
          >
            Download PDF →
          </a>
        </div>
      ) : (
        <iframe
          src={googleViewerUrl}
          className="h-full w-full"
          title={title || 'PDF Preview'}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      )}
    </div>
  );
}
