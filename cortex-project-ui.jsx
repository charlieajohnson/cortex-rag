import { useState, useRef, useEffect } from "react";

const MOCK_DOCUMENTS = [
  { id: "1", filename: "system-design-primer.pdf", status: "ready", chunk_count: 47, size_bytes: 2400000, created_at: "2025-03-01T10:30:00Z" },
  { id: "2", filename: "anthropic-research-paper.pdf", status: "ready", chunk_count: 31, size_bytes: 890000, created_at: "2025-03-02T14:15:00Z" },
  { id: "3", filename: "meeting-notes-q1.md", status: "processing", chunk_count: 0, size_bytes: 12400, created_at: "2025-03-04T09:00:00Z" },
];

const MOCK_ANSWER = {
  answer: "The system uses a write-through caching strategy at the API gateway level. When a document is ingested, its metadata is cached with a TTL of 300 seconds, while the vector embeddings are stored persistently in ChromaDB. Cache invalidation happens on document deletion via a pub/sub event that propagates to all gateway instances.\n\nThe retrieval layer does not cache query results by default, since the same query can yield different results as the corpus grows. However, there is an optional query cache with a 60-second TTL for repeated identical queries during a single user session.",
  sources: [
    { chunk_id: "c1", document_id: "1", filename: "system-design-primer.pdf", chunk_index: 12, text: "Write-through caching ensures consistency between the cache and the persistent store. The API gateway maintains a local cache with configurable TTL...", score: 0.92 },
    { chunk_id: "c2", document_id: "1", filename: "system-design-primer.pdf", chunk_index: 23, text: "Cache invalidation is handled through an event-driven architecture. When a mutation occurs, a pub/sub message propagates the change...", score: 0.87 },
    { chunk_id: "c3", document_id: "2", filename: "anthropic-research-paper.pdf", chunk_index: 8, text: "Query-level caching in retrieval systems presents a tradeoff: while it reduces latency for repeated queries, it can serve stale results as the underlying corpus evolves...", score: 0.79 },
  ],
  model: "claude-sonnet-4-5-20250514",
  latency_ms: 1230,
};

// --- Icons ---
const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const IconFile = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconSend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconLoader = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const IconCornerDownRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 10 20 15 15 20" /><path d="M4 4v7a4 4 0 0 0 4 4h12" />
  </svg>
);
const IconBook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

// --- Styles ---
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  @keyframes expandDot {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.3); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --bg: #0C0C0C;
    --bg-elevated: #141414;
    --bg-surface: #1A1A1A;
    --bg-hover: #222222;
    --border: #2A2A2A;
    --border-subtle: #1F1F1F;
    --text-primary: #E8E4DF;
    --text-secondary: #8A8580;
    --text-muted: #5A5550;
    --accent: #C4956A;
    --accent-dim: #9A7555;
    --accent-glow: rgba(196, 149, 106, 0.08);
    --green: #6B9E78;
    --green-dim: rgba(107, 158, 120, 0.15);
    --red: #C47070;
    --red-dim: rgba(196, 112, 112, 0.1);
    --blue: #7090C4;
    --radius: 8px;
    --radius-lg: 12px;
    --font-serif: 'Instrument Serif', Georgia, serif;
    --font-sans: 'DM Sans', -apple-system, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }

  body {
    background: var(--bg);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  .app {
    display: grid;
    grid-template-columns: 300px 1fr;
    height: 100vh;
    overflow: hidden;
  }

  /* --- Sidebar --- */
  .sidebar {
    background: var(--bg);
    border-right: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .sidebar-header {
    padding: 28px 24px 20px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .logo {
    font-family: var(--font-serif);
    font-size: 22px;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    animation: expandDot 0.6s ease-out 0.3s both;
  }

  .sidebar-section-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    padding: 20px 24px 8px;
  }

  .doc-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 12px;
  }

  .doc-list::-webkit-scrollbar { width: 4px; }
  .doc-list::-webkit-scrollbar-track { background: transparent; }
  .doc-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .doc-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius);
    cursor: pointer;
    transition: background 0.15s;
    animation: slideIn 0.3s ease-out both;
  }
  .doc-item:hover { background: var(--bg-hover); }

  .doc-icon {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .doc-info { flex: 1; min-width: 0; }
  .doc-name {
    font-size: 13px;
    font-weight: 400;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .doc-meta {
    font-size: 11px;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 1px;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .status-dot.ready { background: var(--green); }
  .status-dot.processing { background: var(--accent); animation: pulse 1.5s ease-in-out infinite; }

  .doc-delete {
    opacity: 0;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.15s;
    display: flex;
    align-items: center;
  }
  .doc-item:hover .doc-delete { opacity: 1; }
  .doc-delete:hover { color: var(--red); background: var(--red-dim); }

  .upload-zone {
    margin: 12px;
    padding: 20px;
    border: 1px dashed var(--border);
    border-radius: var(--radius);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-muted);
    font-size: 12px;
  }
  .upload-zone:hover {
    border-color: var(--accent-dim);
    background: var(--accent-glow);
    color: var(--text-secondary);
  }
  .upload-zone.drag-over {
    border-color: var(--accent);
    background: var(--accent-glow);
    color: var(--accent);
  }
  .upload-icon {
    margin-bottom: 6px;
    display: flex;
    justify-content: center;
    color: var(--text-muted);
  }
  .upload-zone:hover .upload-icon { color: var(--accent-dim); }

  /* --- Main content --- */
  .main {
    display: flex;
    flex-direction: column;
    background: var(--bg-elevated);
    overflow: hidden;
  }

  .main-header {
    padding: 20px 32px;
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .main-title {
    font-family: var(--font-serif);
    font-size: 16px;
    color: var(--text-secondary);
    font-weight: 400;
  }

  .model-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    padding: 4px 10px;
    border-radius: 20px;
    letter-spacing: 0.02em;
  }

  .chat-area {
    flex: 1;
    overflow-y: auto;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .chat-area::-webkit-scrollbar { width: 4px; }
  .chat-area::-webkit-scrollbar-track { background: transparent; }
  .chat-area::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  /* Empty state */
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    animation: fadeIn 0.8s ease-out;
  }

  .empty-glyph {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
  }

  .empty-title {
    font-family: var(--font-serif);
    font-size: 20px;
    color: var(--text-secondary);
  }

  .empty-subtitle {
    font-size: 13px;
    color: var(--text-muted);
    max-width: 320px;
    text-align: center;
    line-height: 1.5;
  }

  .suggestions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .suggestion-chip {
    font-size: 12px;
    color: var(--text-secondary);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    padding: 6px 14px;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: var(--font-sans);
  }
  .suggestion-chip:hover {
    border-color: var(--accent-dim);
    color: var(--accent);
    background: var(--accent-glow);
  }

  /* Messages */
  .message {
    animation: fadeUp 0.35s ease-out both;
  }

  .message-question {
    display: flex;
    justify-content: flex-end;
  }

  .question-bubble {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    padding: 12px 18px;
    border-radius: 16px 16px 4px 16px;
    max-width: 560px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--text-primary);
  }

  .message-answer {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .answer-avatar {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--accent-dim), var(--accent));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .answer-avatar-inner {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,0.9);
  }

  .answer-content {
    flex: 1;
    min-width: 0;
  }

  .answer-text {
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-primary);
    max-width: 640px;
  }

  .answer-text p { margin-bottom: 12px; }
  .answer-text p:last-child { margin-bottom: 0; }

  .answer-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .sources-section {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid var(--border-subtle);
  }

  .sources-label {
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .source-card {
    padding: 10px 12px;
    background: var(--bg);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    margin-bottom: 6px;
    cursor: pointer;
    transition: all 0.15s;
    animation: fadeUp 0.3s ease-out both;
  }
  .source-card:hover {
    border-color: var(--border);
    background: var(--bg-surface);
  }

  .source-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-secondary);
  }

  .source-score {
    margin-left: auto;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--accent);
    background: var(--accent-glow);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .source-preview {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 6px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Loading indicator */
  .thinking {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    animation: fadeUp 0.3s ease-out;
  }

  .thinking-dots {
    display: flex;
    gap: 4px;
    padding: 14px 0;
  }

  .thinking-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--text-muted);
    animation: pulse 1.2s ease-in-out infinite;
  }
  .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
  .thinking-dot:nth-child(3) { animation-delay: 0.4s; }

  /* Input area */
  .input-area {
    padding: 16px 32px 24px;
    border-top: 1px solid var(--border-subtle);
  }

  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 6px 6px 6px 18px;
    transition: border-color 0.2s;
  }
  .input-wrapper:focus-within {
    border-color: var(--accent-dim);
  }

  .input-field {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 14px;
    padding: 10px 0;
    resize: none;
    line-height: 1.5;
    max-height: 120px;
  }
  .input-field::placeholder { color: var(--text-muted); }

  .send-button {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: var(--accent);
    color: var(--bg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
  }
  .send-button:hover { background: var(--accent-dim); transform: scale(1.04); }
  .send-button:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

  .input-hint {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 8px;
    text-align: center;
  }
`;

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function App() {
  const [documents, setDocuments] = useState(MOCK_DOCUMENTS);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = (text) => {
    const q = text || query.trim();
    if (!q || isThinking) return;

    setMessages((prev) => [...prev, { type: "question", text: q }]);
    setQuery("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsThinking(true);

    // Simulate API call
    setTimeout(() => {
      setMessages((prev) => [...prev, { type: "answer", ...MOCK_ANSWER }]);
      setIsThinking(false);
    }, 1800);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e) => {
    setQuery(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleUpload = () => {
    const newDoc = {
      id: String(Date.now()),
      filename: "uploaded-doc.pdf",
      status: "processing",
      chunk_count: 0,
      size_bytes: 340000,
      created_at: new Date().toISOString(),
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === newDoc.id ? { ...d, status: "ready", chunk_count: 18 } : d
        )
      );
    }, 3000);
  };

  const handleDelete = (id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const suggestions = [
    "What's the caching strategy?",
    "Summarize the key findings",
    "How does authentication work?",
  ];

  const hasMessages = messages.length > 0;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <div className="logo-dot" />
              Cortex
            </div>
          </div>

          <div className="sidebar-section-label">Documents</div>

          <div className="doc-list">
            {documents.map((doc, i) => (
              <div
                className="doc-item"
                key={doc.id}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="doc-icon">
                  <IconFile />
                </div>
                <div className="doc-info">
                  <div className="doc-name">{doc.filename}</div>
                  <div className="doc-meta">
                    <span
                      className={`status-dot ${doc.status}`}
                    />
                    {doc.status === "ready" ? (
                      <>
                        {doc.chunk_count} chunks · {formatBytes(doc.size_bytes)}
                      </>
                    ) : (
                      "Processing…"
                    )}
                  </div>
                </div>
                <button
                  className="doc-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(doc.id);
                  }}
                >
                  <IconTrash />
                </button>
              </div>
            ))}
          </div>

          <div
            className={`upload-zone ${dragOver ? "drag-over" : ""}`}
            onClick={() => {
              handleUpload();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleUpload();
            }}
          >
            <div className="upload-icon">
              <IconUpload />
            </div>
            Drop files or click to upload
            <br />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              PDF, TXT, MD
            </span>
          </div>
        </div>

        {/* Main */}
        <div className="main">
          <div className="main-header">
            <div className="main-title">
              {hasMessages ? "Conversation" : "Ask your documents"}
            </div>
            <div className="model-badge">claude-sonnet-4.5</div>
          </div>

          <div className="chat-area">
            {!hasMessages && (
              <div className="empty-state">
                <div className="empty-glyph">
                  <IconBook />
                </div>
                <div className="empty-title">What would you like to know?</div>
                <div className="empty-subtitle">
                  Ask questions about your uploaded documents. Answers are
                  grounded in the source material with citations.
                </div>
                <div className="suggestions">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      className="suggestion-chip"
                      onClick={() => handleSend(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) =>
              msg.type === "question" ? (
                <div
                  key={i}
                  className="message message-question"
                  style={{ animationDelay: "0.05s" }}
                >
                  <div className="question-bubble">{msg.text}</div>
                </div>
              ) : (
                <div
                  key={i}
                  className="message message-answer"
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="answer-avatar">
                    <div className="answer-avatar-inner" />
                  </div>
                  <div className="answer-content">
                    <div className="answer-text">
                      {msg.answer.split("\n\n").map((p, j) => (
                        <p key={j}>{p}</p>
                      ))}
                    </div>
                    <div className="answer-meta">
                      <span>{msg.model}</span>
                      <span>·</span>
                      <span>{msg.latency_ms}ms</span>
                      <span>·</span>
                      <span>{msg.sources.length} sources</span>
                    </div>
                    <div className="sources-section">
                      <div className="sources-label">Sources</div>
                      {msg.sources.map((src, k) => (
                        <div
                          className="source-card"
                          key={src.chunk_id}
                          style={{ animationDelay: `${0.3 + k * 0.1}s` }}
                        >
                          <div className="source-header">
                            <IconCornerDownRight />
                            <span>{src.filename}</span>
                            <span style={{ color: "var(--text-muted)" }}>
                              chunk {src.chunk_index}
                            </span>
                            <span className="source-score">
                              {src.score.toFixed(2)}
                            </span>
                          </div>
                          <div className="source-preview">{src.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}

            {isThinking && (
              <div className="thinking">
                <div className="answer-avatar">
                  <div className="answer-avatar-inner" />
                </div>
                <div className="thinking-dots">
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                  <div className="thinking-dot" />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="input-area">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                className="input-field"
                placeholder="Ask a question about your documents…"
                value={query}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="send-button"
                onClick={() => handleSend()}
                disabled={!query.trim() || isThinking}
              >
                <IconSend />
              </button>
            </div>
            <div className="input-hint">
              Retrieval-augmented generation · {documents.filter((d) => d.status === "ready").length} documents indexed
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
