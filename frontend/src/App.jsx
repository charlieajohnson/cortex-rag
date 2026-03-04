import { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar.jsx";
import ChatArea from "./components/ChatArea.jsx";
import QueryInput from "./components/QueryInput.jsx";
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  queryDocuments,
} from "./api.js";

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const refreshDocuments = useCallback(async () => {
    try {
      const data = await listDocuments();
      setDocuments(data.documents);
    } catch {
      /* silent on initial load */
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const handleUpload = async (file) => {
    try {
      const doc = await uploadDocument(file);
      setDocuments((prev) => [doc, ...prev]);

      // Poll for processing completion
      const poll = setInterval(async () => {
        const data = await listDocuments();
        setDocuments(data.documents);
        const updated = data.documents.find((d) => d.id === doc.id);
        if (updated && updated.status !== "processing") {
          clearInterval(poll);
        }
      }, 2000);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleSend = async (text) => {
    const q = text || query.trim();
    if (!q || isThinking) return;

    setMessages((prev) => [...prev, { type: "question", text: q }]);
    setQuery("");
    setIsThinking(true);

    try {
      const result = await queryDocuments(q);
      setMessages((prev) => [...prev, { type: "answer", ...result }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          type: "answer",
          answer: "Sorry, something went wrong. Please try again.",
          sources: [],
          model: "error",
          latency_ms: 0,
        },
      ]);
      console.error("Query failed:", err);
    } finally {
      setIsThinking(false);
    }
  };

  const readyCount = documents.filter((d) => d.status === "ready").length;
  const hasMessages = messages.length > 0;

  return (
    <div className="app">
      <Sidebar
        documents={documents}
        onDelete={handleDelete}
        onUpload={handleUpload}
      />

      <div className="main">
        <div className="main-header">
          <div className="main-title">
            {hasMessages ? "Conversation" : "Ask your documents"}
          </div>
          <div className="model-badge">claude-sonnet-4.5</div>
        </div>

        <ChatArea
          messages={messages}
          isThinking={isThinking}
          onSuggestionClick={handleSend}
        />

        <QueryInput
          query={query}
          setQuery={setQuery}
          onSend={() => handleSend()}
          disabled={isThinking}
          documentCount={readyCount}
        />
      </div>
    </div>
  );
}
