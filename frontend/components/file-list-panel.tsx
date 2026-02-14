"use client"

import { FileText, FileSpreadsheet, FileIcon, Image } from "lucide-react"
import { cn } from "@/lib/utils"
import type { VaultFile } from "@/lib/types"

const fileTypeIcons: Record<VaultFile["type"], React.ElementType> = {
  pdf: FileText,
  docx: FileIcon,
  csv: FileSpreadsheet,
  image: Image,
  other: FileIcon,
}

const fileTypeColors: Record<VaultFile["type"], string> = {
  pdf: "text-red-500",
  docx: "text-primary",
  csv: "text-emerald-600",
  image: "text-amber-500",
  other: "text-muted-foreground",
}

interface FileListPanelProps {
  files: VaultFile[]
  selectedId: string | null
  onSelect: (file: VaultFile) => void
}

export function FileListPanel({ files, selectedId, onSelect }: FileListPanelProps) {
  return (
    <div className="flex flex-col gap-1">
      {files.map((file) => {
        const Icon = fileTypeIcons[file.type]
        const color = fileTypeColors[file.type]
        const isSelected = file.id === selectedId

        return (
          <button
            key={file.id}
            type="button"
            onClick={() => onSelect(file)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
              isSelected
                ? "bg-primary/10 text-foreground"
                : "hover:bg-muted text-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", color)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {file.size} &middot; {file.uploadedBy}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
