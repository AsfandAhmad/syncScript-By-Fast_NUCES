"use client"

import { Copy, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Source } from "@/lib/types"

interface SourceItemProps {
  source: Source
}

export function SourceItem({ source }: SourceItemProps) {
  function formatCitation() {
    return `${source.authors} (${source.year}). ${source.title}. ${source.journal}. https://doi.org/${source.doi}`
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-snug text-foreground">
          {source.title}
        </h4>
        <Badge variant="outline" className="shrink-0 text-[10px] text-muted-foreground">
          {source.format}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{source.authors}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {source.journal}, {source.year}
      </p>

      {/* Citation preview */}
      <div className="mt-3 rounded-md bg-muted/50 px-3 py-2">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {formatCitation()}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => {
            navigator.clipboard.writeText(formatCitation())
            toast.success("Citation copied to clipboard.")
          }}
        >
          <Copy className="h-3 w-3" />
          Copy
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          asChild
        >
          <a
            href={`https://doi.org/${source.doi}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-3 w-3" />
            DOI
          </a>
        </Button>
      </div>
    </div>
  )
}
