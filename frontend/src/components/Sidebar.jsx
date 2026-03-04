import DocumentItem from "./DocumentItem.jsx";
import UploadZone from "./UploadZone.jsx";

export default function Sidebar({ documents, onDelete, onUpload }) {
  return (
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
          <DocumentItem
            key={doc.id}
            doc={doc}
            index={i}
            onDelete={onDelete}
          />
        ))}
      </div>

      <UploadZone onUpload={onUpload} />
    </div>
  );
}
