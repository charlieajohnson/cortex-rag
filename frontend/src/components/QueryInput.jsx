import { useRef } from "react";
import { IconSend } from "./Icons.jsx";

export default function QueryInput({
  query,
  setQuery,
  onSend,
  disabled,
  documentCount,
}) {
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleInput = (e) => {
    setQuery(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  return (
    <div className="input-area">
      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          className="input-field"
          placeholder="Ask a question about your documents..."
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="send-button"
          onClick={onSend}
          disabled={!query.trim() || disabled}
        >
          <IconSend />
        </button>
      </div>
      <div className="input-hint">
        Retrieval-augmented generation &middot; {documentCount} documents indexed
      </div>
    </div>
  );
}
