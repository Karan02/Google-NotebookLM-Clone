import React, { useRef, useState } from "react";
import "./styles.css";
import PdfUpload from "./components/PdfUpload";
import PdfViewer, { PdfViewerHandle } from "./components/PdfViewer";
import Chat from "./components/Chat";
import type { UploadResponse } from "./types";

export default function App() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [numPages, setNumPagesInfo] = useState<number | null>(null);
  const viewerRef = useRef<PdfViewerHandle>(null);

  const onUploaded = (res: UploadResponse) => {
    // Use proxy for /uploads so we can pass the returned path directly
    setPdfUrl(res.pdfUrl);
    setPdfId(res.pdfId);
  };

  const jumpTo = (page: number) => {
    viewerRef.current?.scrollToPage(page);
  };

  return (
    <div className="app">
      <div className="header">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#6ea8ff"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.5V8h4.5"></path></svg>
        <h1>NotebookLM-style PDF Chat</h1>
        <button onClick={() => window.location.reload()}>Reload Page</button>
        {pdfId && <span className="small">• PDF ID: {pdfId}</span>}
      </div>

      {!pdfUrl && <PdfUpload onUploaded={onUploaded} />}

      {pdfUrl && pdfId && (
        <div className="layout">
          <PdfViewer ref={viewerRef} fileUrl={pdfUrl} />
          <Chat pdfId={pdfId} onJumpToPage={jumpTo} />
        </div>
      )}
    </div>
  );
}
