"use client";

import { useRef, useState } from "react";

type Citation = {
  page: number;
  paragraphIndex: number;
  snippet: string;
};

type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
};

export default function Home() {
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadClick = () => {
    setUploadStatus(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadStatus("Please choose a PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadStatus("Reading PDF…");
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = (data as { error?: string }).error;
        setUploadStatus(message || "Unable to read PDF.");
        return;
      }

      const data = (await res.json()) as {
        documentId: string;
        pages: { pageNumber: number; text: string }[];
      };

      setActiveDocumentId(data.documentId);
      setUploadStatus(
        `Indexed ${data.pages.length} page${
          data.pages.length === 1 ? "" : "s"
        } · ready for questions.`,
      );
    } catch (err) {
      console.error(err);
      setUploadStatus("Something went wrong while uploading.");
    } finally {
      // Clear the input so selecting the same file again still triggers change
      event.target.value = "";
    }
  };

  const handleAsk = async () => {
    if (!input.trim()) return;
    const question = input.trim();
    setInput("");

    const userTurn: ChatTurn = {
      id: crypto.randomUUID(),
      role: "user",
      text: question,
    };
    setChat((prev) => [...prev, userTurn]);

    if (!activeDocumentId) {
      const assistantTurn: ChatTurn = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Upload a PDF first so I have something gentle to read from.",
      };
      setChat((prev) => [...prev, assistantTurn]);
      return;
    }

    setIsThinking(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          documentId: activeDocumentId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = (data as { error?: string }).error;
        const assistantTurn: ChatTurn = {
          id: crypto.randomUUID(),
          role: "assistant",
          text:
            message ??
            "I couldn't reach the answering service right now. Please check your API keys and try again.",
        };
        setChat((prev) => [...prev, assistantTurn]);
        return;
      }

      const data = (await res.json()) as {
        answer: string;
        citations: Citation[];
      };

      const assistantTurn: ChatTurn = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: data.answer,
        citations: data.citations,
      };
      setChat((prev) => [...prev, assistantTurn]);
    } catch (err) {
      console.error(err);
      const assistantTurn: ChatTurn = {
        id: crypto.randomUUID(),
        role: "assistant",
        text:
          "Something went wrong while answering. Once the backend keys are set, I’ll be able to reply from your PDF.",
      };
      setChat((prev) => [...prev, assistantTurn]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleJumpToSource = (citation: Citation) => {
    // Placeholder scroll logic – wired once PDF viewer is implemented
    alert(
      `Jumping to page ${citation.page}, paragraph ${citation.paragraphIndex + 1}`,
    );
  };

  return (
    <div className="klair-shell">
      <main className="klair-surface">
        {/* Left rail - date / battery / vibe */}
        <aside className="flex flex-col gap-6 rounded-3xl bg-gradient-to-b from-[#e8f9ff] via-[#f6fff7] to-[#fff2cf] p-4 shadow-[0_16px_40px_rgba(148,163,184,0.25)]">
          <div className="space-y-4">
            <div className="klair-pill">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Flow mode · On</span>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-500">
                Today
              </p>
              <p className="text-4xl font-semibold text-slate-800">08 : 08</p>
              <p className="text-xs text-slate-500">
                {activeDocumentId ? "PDF indexed · Studio" : "Saturday · Document Studio"}
              </p>
            </div>
          </div>

          <div className="klair-card flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Active PDF
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {activeDocumentId ? "PDF ready for questions" : "Drop a file to begin"}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Klair will read, index and sketch the concepts for you.
                </p>
                {uploadStatus && (
                  <p className="mt-2 text-[10px] text-emerald-700">{uploadStatus}</p>
                )}
              </div>
              <button className="klair-button klair-button-primary text-xs">
                <span onClick={handleUploadClick}>Upload PDF</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileSelected}
            />
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">
              Views
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="klair-tag">Reading</button>
              <button className="klair-tag">Chat</button>
              <button className="klair-tag">Concept graph</button>
            </div>
          </div>
        </aside>

        {/* Center - document canvas (placeholder for PDF + concept map) */}
        <section className="flex flex-col gap-4">
          <div className="klair-card h-64 bg-[radial-gradient(circle_at_10%_10%,#fff9d9,transparent_55%),radial-gradient(circle_at_80%_0,#d9ffe8,transparent_60%),linear-gradient(135deg,#e3f9ff,#fffce6)]">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                  Document sketch
                </p>
                <p className="text-sm text-slate-600">
                  Once a PDF is indexed, Klair draws a soft concept map of the
                  structure here.
                </p>
              </div>
              <div className="flex gap-2">
                <button className="klair-button klair-button-ghost text-xs">
                  Timeline
                </button>
                <button className="klair-button klair-button-primary text-xs">
                  GraphClick
                </button>
              </div>
            </div>
            <div className="mt-6 grid h-32 grid-cols-3 gap-3">
              <div className="rounded-3xl bg-gradient-to-br from-[#e0ffe9] via-[#f1fff5] to-[#fff6df]" />
              <div className="rounded-3xl bg-gradient-to-br from-[#fef4d9] via-[#fffaf0] to-[#e7f7ff]" />
              <div className="rounded-3xl bg-gradient-to-br from-[#e5f3ff] via-[#f7fbff] to-[#fdf0ff]" />
            </div>
          </div>

          <div className="klair-card h-40">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Source pane
            </p>
            <p className="mt-2 text-sm text-slate-600">
              When you click{" "}
              <span className="font-medium text-emerald-600">Jump to source</span>{" "}
              on any answer, Klair will smoothly scroll this pane to the exact
              page and paragraph the AI relied on.
            </p>
          </div>
        </section>

        {/* Right - chat */}
        <section className="flex flex-col gap-3 rounded-3xl bg-white/90 p-4 shadow-[0_18px_50px_rgba(148,163,184,0.35)]">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Klair
              </p>
              <p className="text-sm text-slate-600">
                Gentle AI for technical PDFs
              </p>
            </div>
            <div className="klair-pill text-[11px]">
              <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-[#c0f5a8] to-[#8fe4bd]" />
              <span>Vector indexed</span>
            </div>
          </header>

          <div className="klair-card klair-scroll flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-[#f6fff5] via-[#fffdf7] to-[#fff6e5]">
            {chat.length === 0 && (
              <p className="text-xs text-slate-500">
                Ask about algorithms, proofs, or reports you have open. Klair
                will answer with citations you can jump to.
              </p>
            )}

            {chat.map((turn) => (
              <div key={turn.id} className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {turn.role === "user" ? "You" : "Klair"}
                </p>
                <div
                  className={`rounded-2xl px-3 py-2 text-sm ${
                    turn.role === "user"
                      ? "bg-white/80 text-slate-700"
                      : "bg-[radial-gradient(circle_at_0_0,#e5ffe8,transparent_55%),radial-gradient(circle_at_100%_0,#fff5d5,transparent_55%),#f9fff8] text-slate-700"
                  }`}
                >
                  <p>{turn.text}</p>
                  {turn.citations && turn.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {turn.citations.map((c, idx) => (
                        <button
                          key={`${turn.id}-c-${idx}`}
                          className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-medium text-emerald-700 shadow-sm hover:bg-white"
                          onClick={() => handleJumpToSource(c)}
                        >
                          Jump to page {c.page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <p className="text-[11px] text-slate-400">
                Klair is sketching an answer…
              </p>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-full bg-[#f5fbff] px-3 py-1 text-[10px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Answers are grounded in your PDF via vector search.</span>
            </div>
            <div className="flex gap-2">
              <input
                className="h-10 flex-1 rounded-full border border-slate-200 bg-white/80 px-3 text-sm outline-none ring-0 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                placeholder="Ask Klair something gentle about your document…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAsk();
                }}
              />
              <button
                onClick={handleAsk}
                className="klair-button klair-button-primary h-10 rounded-full px-4 text-xs"
              >
                Ask
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
