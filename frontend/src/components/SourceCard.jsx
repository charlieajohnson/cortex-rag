import { IconCornerDownRight } from "./Icons.jsx";

export default function SourceCard({ source, index }) {
  return (
    <div
      className="source-card"
      style={{ animationDelay: `${0.3 + index * 0.1}s` }}
    >
      <div className="source-header">
        <IconCornerDownRight />
        <span>{source.filename}</span>
        <span style={{ color: "var(--text-muted)" }}>
          chunk {source.chunk_index}
        </span>
        <span className="source-score">{source.score.toFixed(2)}</span>
      </div>
      <div className="source-preview">{source.text}</div>
    </div>
  );
}
