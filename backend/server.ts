// server.ts
import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import pdfParse from "pdf-parse";
import OpenAI from "openai";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in .env");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads folder if missing
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});
const upload = multer({ storage });

// In-memory document store
const DOC_STORE: Record<
  string,
  { filename: string; originalName: string; pages: { page: number; text: string; snippet: string; embedding: number[] }[]; numPages: number }
> = {};

// Helpers
function snippetFor(text: string, n = 400) {
  return text.length > n ? text.slice(0, n).trim() + "..." : text;
}

function cosineSim(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] ** 2;
    nb += b[i] ** 2;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Routes
app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const savedPath = req.file.path;
    const pdfId = path.basename(req.file.filename, path.extname(req.file.filename));

    // Extract text from PDF
    const dataBuffer = fs.readFileSync(savedPath);
    const pdfData = await pdfParse(dataBuffer);
    const pages = pdfData.text.split("\f").map((t, i) => ({ pageNumber: i + 1, text: t.trim() }));

    if (!pages.length) return res.status(400).json({ error: "No extractable text found" });

    // Compute embeddings in batches
    const BATCH = 16;
    const embeddings: number[][] = [];
    const texts = pages.map(p => p.text);

    for (let i = 0; i < texts.length; i += BATCH) {
      const batch = texts.slice(i, i + BATCH).filter(Boolean);
      if (!batch.length) continue;
      const resp = await openai.embeddings.create({ model: "text-embedding-3-small", input: batch });
      for (const item of resp.data) embeddings.push(item.embedding);
    }

    // Store in memory
    DOC_STORE[pdfId] = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      numPages: pages.length,
      pages: pages.map((p, idx) => ({
        page: p.pageNumber,
        text: p.text,
        snippet: snippetFor(p.text),
        embedding: embeddings[idx] || []
      }))
    };

    res.json({ pdfUrl: `/uploads/${req.file.filename}`, pdfId, numPages: pages.length });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to process PDF" });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { pdfId, question, top_k = 3 } = req.body;
    if (!pdfId || !question) return res.status(400).json({ error: "pdfId and question required" });

    const doc = DOC_STORE[pdfId];
    if (!doc) return res.status(404).json({ error: "PDF not found" });

    // Question embedding
    const qResp = await openai.embeddings.create({ model: "text-embedding-3-small", input: question });
    const qEmb = qResp.data[0].embedding;

    // Similarity
    const scores = doc.pages.map(pg => ({
      page: pg.page,
      score: cosineSim(qEmb, pg.embedding),
      snippet: pg.snippet,
      text: pg.text
    }));
    scores.sort((a, b) => b.score - a.score);
    const top = scores.slice(0, top_k);

    const context = top.map(t => `[page ${t.page}]\n${t.text}`).join("\n\n---\n\n");

    const systemPrompt = "Answer concisely using only the context. Cite pages like [page N].";
    const chatResp = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Question: ${question}\n\nContext:\n${context}` }
      ],
      max_tokens: 600,
      temperature: 0.0
    });

    const answer = chatResp.choices?.[0]?.message?.content || "";
    const citations = top.map(t => ({ page: t.page, score: t.score, snippet: t.snippet }));

    res.json({ answer, citations });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
