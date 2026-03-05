import SourceCard from "./SourceCard.jsx";

export default function AnswerCard({ message }) {
  return (
    <div className="message message-answer" style={{ animationDelay: "0.1s" }}>
      <div className="answer-avatar">
        <div className="answer-avatar-inner" />
      </div>
      <div className="answer-content">
        <div className="answer-text">
          {message.answer.split("\n\n").map((p, j) => (
            <p key={j}>{p}</p>
          ))}
        </div>
        <div className="answer-meta">
          <span>{message.model}</span>
          <span>&middot;</span>
          <span>{message.latency_ms}ms</span>
          <span>&middot;</span>
          <span>{message.sources.length} sources</span>
          {message.mode && message.mode !== "answer" && (
            <span className="mode-badge">{message.mode}</span>
          )}
        </div>
        {message.sources.length > 0 && (
          <div className="sources-section">
            <div className="sources-label">Sources</div>
            {message.sources.map((src, k) => (
              <SourceCard key={src.chunk_id} source={src} index={k} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
