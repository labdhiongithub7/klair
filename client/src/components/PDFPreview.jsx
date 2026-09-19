import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Loader, AlertCircle, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

// pdf.js needs its worker registered once. Vite resolves the `?url` import to a
// hashed asset URL, so this works in dev and in production builds.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Renders the first pages of a PDF to a canvas using pdf.js.
 *
 * Replaces the previous Google Docs `gview` iframe, which silently failed for
 * Cloudinary "raw" URLs (that viewer is undocumented/deprecated and needs the
 * file served with a PDF content-type it can fetch itself).
 */
const PDFPreview = ({ url, title, height = 400 }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  // Keeps the loaded document across re-renders without triggering effects.
  const pdfRef = useRef(null);
  // Guards against overlapping render calls, which pdf.js does not allow.
  const renderTaskRef = useRef(null);

  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState(0);

  // Load the document whenever the URL changes.
  useEffect(() => {
    if (!url) return;

    let cancelled = false;
    const loadingTask = pdfjsLib.getDocument({ url, withCredentials: false });

    setStatus('loading');
    setPageNumber(1);
    setNumPages(0);

    loadingTask.promise
      .then((pdf) => {
        if (cancelled) {
          pdf.destroy();
          return;
        }
        pdfRef.current = pdf;
        setNumPages(pdf.numPages);
        setStatus('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        // Log for developers; the user sees a friendly message instead.
        console.error('Failed to load PDF preview:', error?.message || error);
        setStatus('error');
      });

    return () => {
      cancelled = true;
      loadingTask.destroy?.();
      pdfRef.current = null;
    };
  }, [url]);

  // Draw the current page, scaled to the container width.
  const renderPage = useCallback(async () => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;

    // Cancel any in-flight render before starting a new one.
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    try {
      const page = await pdf.getPage(pageNumber);
      const containerWidth = containerRef.current?.clientWidth || 600;
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });

      // Match the device pixel ratio so text stays sharp on HiDPI screens.
      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const context = canvas.getContext('2d');
      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

      renderTaskRef.current = page.render({ canvasContext: context, viewport, transform });
      await renderTaskRef.current.promise;
      renderTaskRef.current = null;
    } catch (error) {
      // A cancelled render is expected when paging quickly; ignore it.
      if (error?.name === 'RenderingCancelledException') return;
      console.error('Failed to render PDF page:', error?.message || error);
      setStatus('error');
    }
  }, [pageNumber]);

  useEffect(() => {
    if (status === 'ready') renderPage();
  }, [status, renderPage]);

  // Re-render on resize so the preview stays fitted to its container.
  useEffect(() => {
    if (status !== 'ready') return;
    let frame;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(renderPage);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
    };
  }, [status, renderPage]);

  if (status === 'error') {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-6 text-center"
        style={{ minHeight: height }}
      >
        <AlertCircle className="text-amber-500" size={28} />
        <div>
          <p className="font-medium text-gray-700">Preview unavailable</p>
          <p className="mt-1 text-sm text-gray-500">
            We couldn&apos;t display this PDF here, but it uploaded fine and you can still ask
            questions about it.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <ExternalLink size={15} />
          Open in a new tab
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      {status === 'loading' && (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50"
          style={{ minHeight: height }}
        >
          <Loader className="animate-spin text-blue-500" size={26} />
          <p className="text-sm text-gray-500">Loading preview...</p>
        </div>
      )}

      <div
        className={`overflow-auto rounded-lg border border-gray-200 bg-white ${
          status === 'ready' ? '' : 'hidden'
        }`}
        style={{ maxHeight: height }}
      >
        <canvas ref={canvasRef} className="mx-auto block" aria-label={title || 'PDF preview'} />
      </div>

      {status === 'ready' && numPages > 1 && (
        <div className="mt-2 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            aria-label="Previous page"
            className="rounded-md border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500" aria-live="polite">
            Page {pageNumber} of {numPages}
          </span>
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
            disabled={pageNumber >= numPages}
            aria-label="Next page"
            className="rounded-md border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFPreview;
