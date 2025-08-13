import React, { useState } from "react";
import { askQuestion } from "../services/api.js";
import type { Citation } from "../types.ts";

type Msg = { role: "user" | "bot"; text: string; citations?: Citation[] };

type Props = {
  pdfId: string;
  onJumpToPage: (page: number) => void;
};

const Chat: React.FC<Props> = ({ pdfId, onJumpToPage }) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!input.trim() || busy) return;
    const question = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setBusy(true);
    try {
      const res = await askQuestion(question,pdfId);
      setMessages((m) => [...m, { role: "bot", text: res.answer, citations: res.citations }]);
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "bot", text: "Sorry, I couldn't answer that." }]);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") send();
  };

  return (
    <div className="card sidebar">
      <div className="chat">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i}>
              <div className={`msg ${m.role}`}>{m.text}</div>
              {m.citations && m.citations.length > 0 && (
                <div className="citations">
                  {m.citations.map((c, idx) => (
                    <button key={idx} className="cite-btn" onClick={() => onJumpToPage(c.page)}>
                      Page {c.page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            placeholder="Ask a question about the PDF…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
          />
          <button onClick={send} disabled={busy}>{busy ? "…" : "Send"}</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
