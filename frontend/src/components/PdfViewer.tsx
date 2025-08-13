import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { API_BASE } from "../services/api";
// Wire worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export type PdfViewerHandle = {
  scrollToPage: (page: number) => void;
  getNumPages: () => number | null;
};

type Props = {
  fileUrl: string; // this can be /uploads/<file>.pdf thanks to Vite proxy
};

const PdfViewer = forwardRef<PdfViewerHandle, Props>(({ fileUrl }, ref) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileUrlComplete = `${API_BASE}${fileUrl}`;
  useImperativeHandle(ref, () => ({
    scrollToPage: (page) => {
      const el = containerRef.current?.querySelector<HTMLDivElement>(`#pdf-page-${page}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    getNumPages: () => numPages
  }), [numPages]);

  return (
    <div className="card viewer" ref={containerRef}>
      <Document
        file={fileUrlComplete}
        onLoadSuccess={(info) => setNumPages(info.numPages)}
        loading={<div className="small" style={{ padding: 12 }}>Loading PDF…</div>}
        error={<div style={{ padding: 12, color: "#ff9a9a" }}>Failed to load PDF.</div>}
      >
        {Array.from(new Array(numPages || 0), (_, idx) => (
          <div className="page-frame" id={`pdf-page-${idx + 1}`} key={idx}>
            <Page pageNumber={idx + 1} width={820} renderAnnotationLayer={false} renderTextLayer={false} />
          </div>
        ))}
      </Document>
    </div>
  );
});

export default PdfViewer;
