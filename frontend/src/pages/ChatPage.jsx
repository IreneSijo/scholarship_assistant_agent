import { useState } from "react";
import { api } from "../api/client.js";
import { Card, PageHeader, Button } from "../components/ui.jsx";

const SUGGESTIONS = [
  "What scholarships am I eligible for?",
  "Why am I not eligible for some scholarships?",
  "Which documents are missing?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  async function send(text) {
    const question = text ?? input;
    if (!question.trim()) return;
    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", text: question }]);
    setSending(true);
    try {
      const { reply } = await api.chat(question);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Ask the assistant"
        title="Talk to your scholarship agent"
        description="Grounded in your live profile, documents, and the scholarship dataset - the same data the LangGraph agent uses to make decisions."
      />

      <Card className="flex flex-col h-[28rem]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-ink-100 text-ink-500 hover:bg-ink-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                  m.role === "user" ? "bg-ink-800 text-paper" : "bg-ink-50 text-ink-700"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {sending && <p className="text-xs text-ink-300 font-mono">agent is thinking…</p>}
          {error && <p className="text-sm text-rust">{error}</p>}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about eligibility, documents, or applications…"
            className="flex-1 rounded-lg border border-ink-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-seal/40"
          />
          <Button type="submit" variant="seal" disabled={sending}>
            Send
          </Button>
        </form>
      </Card>
    </>
  );
}
