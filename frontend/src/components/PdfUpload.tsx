import React, { useState } from "react";
import { uploadPdf } from "../services/api.js";
import type { UploadResponse } from "../types.ts";

type Props = {
  onUploaded: (res: UploadResponse) => void;
};

const PdfUpload: React.FC<Props> = ({ onUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Choose a PDF first.");
    try {
      setBusy(true);
      const res = await uploadPdf(file);
      onUploaded(res);
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card upload-card">
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button className="btn" disabled={busy} onClick={handleUpload}>
        {busy ? "Uploading…" : "Upload"}
      </button>
    </div>
  );
};

export default PdfUpload;
