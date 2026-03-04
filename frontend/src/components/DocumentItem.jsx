import { IconFile, IconTrash } from "./Icons.jsx";

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export default function DocumentItem({ doc, index, onDelete }) {
  return (
    <div
      className="doc-item"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="doc-icon">
        <IconFile />
      </div>
      <div className="doc-info">
        <div className="doc-name">{doc.filename}</div>
        <div className="doc-meta">
          <span className={`status-dot ${doc.status}`} />
          {doc.status === "ready" ? (
            <>{doc.chunk_count} chunks</>
          ) : doc.status === "error" ? (
            "Error"
          ) : (
            "Processing\u2026"
          )}
        </div>
      </div>
      <button
        className="doc-delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(doc.id);
        }}
      >
        <IconTrash />
      </button>
    </div>
  );
}
