'use client';

import { FileText, FileSpreadsheet, FileIcon, Image, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { File as DBFile, FileWithUploader } from '@/lib/database.types';
import { formatDistanceToNow } from 'date-fns';

function getFileIcon(fileName: string): { icon: React.ElementType; color: string } {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return { icon: FileText, color: 'text-red-500' };
    case 'doc': case 'docx': return { icon: FileIcon, color: 'text-blue-600' };
    case 'csv': case 'xlsx': case 'xls': return { icon: FileSpreadsheet, color: 'text-emerald-600' };
    case 'png': case 'jpg': case 'jpeg': case 'gif': return { icon: Image, color: 'text-amber-500' };
    default: return { icon: FileIcon, color: 'text-muted-foreground' };
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileListPanelProps {
  files: FileWithUploader[];
  userRole?: 'owner' | 'contributor' | 'viewer';
  currentUserId?: string;
  onDelete?: (fileId: string, fileName: string) => void;
  onPreview?: (fileId: string) => void;
  onDownload?: (fileId: string, fileName: string) => void;
}

export function FileListPanel({ files, userRole, currentUserId, onDelete, onPreview, onDownload }: FileListPanelProps) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {files.map((file) => {
        const { icon: Icon, color } = getFileIcon(file.file_name);
        const canDelete = userRole === 'owner' || currentUserId === file.uploaded_by;
        const timeAgo = file.created_at
          ? formatDistanceToNow(new Date(file.created_at), { addSuffix: true })
          : '';

        return (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted cursor-pointer"
            onClick={() => onPreview?.(file.id)}
          >
            <Icon className={cn('h-4 w-4 shrink-0', color)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.file_size)}
                {file.uploader_email && ` · ${file.uploader_email}`}
                {' · '}{timeAgo}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(file.id, file.file_name);
                  }}
                >
                  <Download className="h-3 w-3" />
                </Button>
              )}
              {canDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(file.id, file.file_name);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
