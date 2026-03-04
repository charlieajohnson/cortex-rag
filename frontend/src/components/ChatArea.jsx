import { useEffect, useRef } from "react";
import QuestionBubble from "./QuestionBubble.jsx";
import AnswerCard from "./AnswerCard.jsx";
import ThinkingIndicator from "./ThinkingIndicator.jsx";
import { IconBook } from "./Icons.jsx";

export default function ChatArea({
  messages,
  isThinking,
  onSuggestionClick,
}) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const hasMessages = messages.length > 0;

  const suggestions = [
    "What's the caching strategy?",
    "Summarize the key findings",
    "How does authentication work?",
  ];

  return (
    <div className="chat-area">
      {!hasMessages && (
        <div className="empty-state">
          <div className="empty-glyph">
            <IconBook />
          </div>
          <div className="empty-title">What would you like to know?</div>
          <div className="empty-subtitle">
            Ask questions about your uploaded documents. Answers are grounded in
            the source material with citations.
          </div>
          <div className="suggestions">
            {suggestions.map((s) => (
              <button
                key={s}
                className="suggestion-chip"
                onClick={() => onSuggestionClick(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, i) =>
        msg.type === "question" ? (
          <QuestionBubble key={i} text={msg.text} />
        ) : (
          <AnswerCard key={i} message={msg} />
        )
      )}

      {isThinking && <ThinkingIndicator />}

      <div ref={chatEndRef} />
    </div>
  );
}
