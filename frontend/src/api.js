const API = import.meta.env.VITE_API_URL || "";

export async function uploadDocument(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/documents`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listDocuments() {
  const res = await fetch(`${API}/documents`);
  return res.json();
}

export async function deleteDocument(id) {
  await fetch(`${API}/documents/${id}`, { method: "DELETE" });
}

export async function queryDocuments(question, documentIds = null, topK = 5, mode = "answer") {
  const res = await fetch(`${API}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, document_ids: documentIds, top_k: topK, mode }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
