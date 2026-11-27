import React, { useEffect, useRef, useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, Loader2, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfPreviewModalProps {
  bytes: Uint8Array | null;
  fileName: string;
  onClose: () => void;
  onDownload: () => void;
}

const ZOOM_STEPS = [0.75, 1, 1.25, 1.5, 1.75];

/**
 * Direct inline PDF viewer built on pdfjs-dist canvas rendering.
 * Works reliably on Android Chrome, iOS Safari, standalone PWAs, and embedded iframes — 100% offline.
 */
export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  bytes,
  fileName,
  onClose,
  onDownload,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const pagesHostRef = useRef<HTMLDivElement | null>(null);
  const [zoomIndex, setZoomIndex] = useState(1); // Default 100% (fit-to-width baseline)
  const [pageCount, setPageCount] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const zoom = ZOOM_STEPS[zoomIndex];

  useEffect(() => {
    if (!bytes) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [bytes, onClose]);

  useEffect(() => {
    if (!bytes) {
      setPageCount(0);
      setRenderError(null);
      return;
    }

    let cancelled = false;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;
    let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;

    const renderPdf = async () => {
      setIsRendering(true);
      setRenderError(null);

      try {
        // Clone Uint8Array so PDF.js worker transfer never detaches the caller's download buffer
        loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
        pdfDoc = await loadingTask.promise;
        if (cancelled) return;

        setPageCount(pdfDoc.numPages);

        const host = pagesHostRef.current;
        if (!host) return;
        host.innerHTML = '';

        const containerWidth = Math.max(
          280,
          (scrollContainerRef.current?.clientWidth ?? 760) - 32
        );
        const maxDisplayWidth = Math.min(containerWidth, 840);
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          if (cancelled) return;
          const page = await pdfDoc.getPage(pageNum);
          if (cancelled) return;

          const baseViewport = page.getViewport({ scale: 1 });
          const fitScale = maxDisplayWidth / baseViewport.width;
          const displayScale = fitScale * zoom;
          const displayViewport = page.getViewport({ scale: displayScale });
          const renderViewport = page.getViewport({ scale: displayScale * dpr });

          const pageWrapper = document.createElement('div');
          pageWrapper.className = 'flex flex-col items-center gap-2';

          const pageBadge = document.createElement('div');
          pageBadge.className = 'font-mono text-[11px] font-medium text-slate-600 tabular-nums';
          pageBadge.textContent = `Page ${pageNum} of ${pdfDoc.numPages}`;
          pageWrapper.appendChild(pageBadge);

          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(renderViewport.width);
          canvas.height = Math.ceil(renderViewport.height);
          canvas.style.width = `${Math.round(displayViewport.width)}px`;
          canvas.style.height = `${Math.round(displayViewport.height)}px`;
          canvas.className =
            'rounded border border-slate-300 bg-white shadow-md max-w-none block';

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          pageWrapper.appendChild(canvas);
          host.appendChild(pageWrapper);

          const renderTask = page.render({
            canvasContext: ctx,
            viewport: renderViewport,
            canvas,
          });
          await renderTask.promise;
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Unable to render PDF preview.';
          setRenderError(msg);
        }
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    };

    void renderPdf();

    return () => {
      cancelled = true;
      if (pdfDoc) {
        void pdfDoc.cleanup();
      }
      if (loadingTask) {
        void loadingTask.destroy();
      }
    };
  }, [bytes, zoom]);

  if (!bytes) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Compiled PDF Preview"
      onClick={onClose}
    >
      <div
        className="flex h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-slate-900">{fileName}</h3>
            <p className="text-xs text-slate-500 tabular-nums">
              {pageCount > 0 ? `${pageCount} ${pageCount === 1 ? 'Page' : 'Pages'} · ` : ''}
              Direct Offline Preview · Verify boxes, checkmarks &amp; photo before download
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                disabled={zoomIndex === 0 || isRendering}
                onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
                aria-label="Zoom out"
                className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-700 hover:bg-white disabled:opacity-40"
              >
                <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="min-w-[44px] text-center font-mono text-[11px] font-medium text-slate-700 tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                disabled={zoomIndex === ZOOM_STEPS.length - 1 || isRendering}
                onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
                aria-label="Zoom in"
                className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-700 hover:bg-white disabled:opacity-40"
              >
                <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <button
              type="button"
              onClick={onDownload}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md bg-[#1E3A5F] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#162d4b] whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Scrollable Direct Canvas Document Surface */}
        <div
          ref={scrollContainerRef}
          className="relative flex-1 overflow-auto bg-slate-200/80 p-4 sm:p-6"
        >
          {isRendering ? (
            <div className="mb-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-700">
              <Loader2 className="h-4 w-4 animate-spin text-[#1E3A5F]" aria-hidden="true" />
              <span>Rendering PDF pages...</span>
            </div>
          ) : null}

          {renderError ? (
            <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
              <AlertCircle className="mx-auto h-7 w-7 text-red-600" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Preview could not be rendered
              </p>
              <p className="mt-1 text-xs text-slate-600">{renderError}</p>
              <button
                type="button"
                onClick={onDownload}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#1E3A5F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#162d4b]"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Download PDF Directly
              </button>
            </div>
          ) : (
            <div ref={pagesHostRef} className="flex flex-col items-center gap-6 pb-4" />
          )}
        </div>
      </div>
    </div>
  );
};
