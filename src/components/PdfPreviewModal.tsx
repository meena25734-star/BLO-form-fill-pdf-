import React from 'react';
import { X, Download } from 'lucide-react';

interface PdfPreviewModalProps {
  blobUrl: string | null;
  fileName: string;
  onClose: () => void;
  onDownload: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  blobUrl,
  fileName,
  onClose,
  onDownload,
}) => {
  if (!blobUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Compiled PDF Preview"
    >
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3.5">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900">{fileName}</h3>
            <p className="text-xs text-slate-500">
              Compiled locally in browser memory — verify coordinates, checkmarks, and Devanagari rendering before printing.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A5F] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#162d4b] whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-slate-100">
          <iframe
            src={blobUrl}
            title={fileName}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
