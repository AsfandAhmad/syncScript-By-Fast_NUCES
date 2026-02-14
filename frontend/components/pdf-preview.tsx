import { FileText } from "lucide-react"

interface PdfPreviewProps {
  fileName: string | null
}

export function PdfPreview({ fileName }: PdfPreviewProps) {
  if (!fileName) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
        <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="font-medium text-muted-foreground">No file selected</p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Select a PDF from the file list to preview it here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <FileText className="h-4 w-4 text-primary" />
        <span className="truncate text-sm font-medium text-foreground">
          {fileName}
        </span>
      </div>

      {/* Simulated PDF content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-lg">
          <div className="mb-6 text-center">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Attention Is All You Need: A Comprehensive Survey of Transformer Architectures
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Jane Smith, Alan Turing, Maria Lopez
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Department of Computer Science, University Research Lab
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Abstract</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              We present a systematic review of transformer-based architectures
              and their applications in natural language processing. Our survey
              covers the evolution from the original transformer model to modern
              variants including BERT, GPT, and their derivatives.
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              1. Introduction
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              The transformer architecture, introduced by Vaswani et al. (2017),
              has fundamentally changed the landscape of natural language
              processing. Unlike previous sequence-to-sequence models based on
              recurrent neural networks, transformers rely entirely on
              self-attention mechanisms.
            </p>
          </div>

          {/* Highlighted region */}
          <div className="mb-4 rounded border-l-2 border-primary bg-primary/5 px-3 py-2">
            <p className="text-sm leading-relaxed text-foreground">
              Multi-head attention allows the model to jointly attend to
              information from different representation subspaces at different
              positions. This mechanism is central to the transformer's ability
              to capture long-range dependencies.
            </p>
            <p className="mt-1 text-xs text-primary">
              2 annotations on this passage
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              2. Background
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Prior work on neural machine translation relied heavily on
              encoder-decoder architectures with recurrent units. While
              effective, these models suffered from limitations in parallelization
              and had difficulty modeling very long sequences. The attention
              mechanism was introduced as a way to allow the decoder to focus on
              relevant parts of the input.
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              3. Methodology
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              We conducted a systematic literature search across major databases
              including IEEE Xplore, ACM Digital Library, and arXiv. Our search
              criteria included papers published between 2017 and 2024 that
              propose or significantly analyze transformer-based architectures
              for NLP tasks.
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground/50">
            Page 4 of 22
          </p>
        </div>
      </div>
    </div>
  )
}
