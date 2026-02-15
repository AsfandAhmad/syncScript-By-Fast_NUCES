'use client';

import { useState } from 'react';
import { File as FileIcon, Trash2, Download, Loader2, FileText, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fileService } from '@/lib/services/file.service';
import { FilePreviewDialog } from '@/components/file-preview-dialog';
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
    return <ImageIcon className="h-4 w-4 text-blue-500" />;
  if (['csv', 'xlsx', 'xls'].includes(ext || ''))
    return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  if (ext === 'pdf')
    return <FileText className="h-4 w-4 text-red-500" />;
  return <FileIcon className="h-4 w-4 text-primary" />;
}

interface FileListPanelProps {
  files: FileRecord[];
  vaultId: string;
  onFileDeleted?: () => void;
  /** When false the delete button is hidden (viewer role). Defaults to true. */
  canDelete?: boolean;
}

export function FileListPanel({ files, vaultId, onFileDeleted, canDelete = true }: FileListPanelProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  const handleDownload = async (file: FileRecord) => {
    setDownloading(file.id);
    try {
      const result = await fileService.getSignedUrl(file.file_url);
      if (result.url) {
        window.open(result.url, '_blank');
      }
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (file: FileRecord) => {
    setDeleting(file.id);
    try {
      const result = await fileService.deleteFile(file.id, vaultId, file.file_url);
      if (result.status === 'success') {
        onFileDeleted?.();
      }
    } finally {
      setDeleting(null);
    }
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <FileIcon className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y rounded-lg border">
        {files.map((file) => (
          <div
            key={file.id}
            className="group flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
            onClick={() => setPreviewFile(file)}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10">
              {getFileIcon(file.file_name)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">{file.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.file_size)} ·{' '}
                {new Date(file.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={downloading === file.id}
                onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
              >
                {downloading === file.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </Button>
              {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                disabled={deleting === file.id}
                onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
              >
                {deleting === file.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <FilePreviewDialog
        open={!!previewFile}
        onOpenChange={(open) => { if (!open) setPreviewFile(null); }}
        file={previewFile}
      />
    </>
  );
}
