export type UploadResponse = {
  pdfUrl: string;    // e.g. /uploads/<filename>.pdf
  pdfId: string;
  numPages: number;
};

export type Citation = {
  page: number;
  score: number;
  snippet: string;
};

export type ChatResponse = {
  answer: string;
  citations: Citation[];
};
