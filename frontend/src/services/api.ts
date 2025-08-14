export const API_BASE = "https://google-notebooklm-clone.onrender.com/"; // "http://localhost:5000";   // Your Node backend

export const uploadPdf = async (file: File) => {
  const formData = new FormData();
  formData.append("pdf", file);

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: formData
  });

  return res.json();
};

export const askQuestion = async (question: string,pdfId:string) => {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question,pdfId })
  });

  return res.json();
};
