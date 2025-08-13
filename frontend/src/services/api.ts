const API_BASE = "http://localhost:5000/api"; // Your Node backend

export const uploadPdf = async (file: File) => {
  const formData = new FormData();
  formData.append("pdf", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData
  });

  return res.json();
};

export const askQuestion = async (question: string,pdfId:string) => {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question,pdfId })
  });

  return res.json();
};
