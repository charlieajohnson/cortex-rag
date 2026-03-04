import { useRef, useState } from "react";
import { IconUpload } from "./Icons.jsx";

export default function UploadZone({ onUpload }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    for (const file of files) {
      onUpload(file);
    }
  };

  return (
    <div
      className={`upload-zone ${dragOver ? "drag-over" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="upload-icon">
        <IconUpload />
      </div>
      Drop files or click to upload
      <br />
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
        PDF, TXT, MD
      </span>
    </div>
  );
}
