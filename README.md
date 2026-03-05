https://cortex-rag-ui.onrender.com

# Cortex — Document Q&A with Retrieval-Augmented Generation

A full-stack RAG system that lets you upload documents (PDF, TXT, Markdown), chunks and embeds them, and answers natural-language questions grounded in the source material — with citations.

Built with FastAPI, ChromaDB, Anthropic Claude, SQLite, and React.

<!-- ![Cortex screenshot](docs/screenshot.png) -->

---

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────────┐
│  React SPA  │────▶│  FastAPI Backend                             │
│  (Cortex)   │◀────│                                              │
│             │     │  POST /documents      → ingest pipeline      │
│  Upload     │     │  GET  /documents      → list documents       │
│  Ask        │     │  POST /query          → retrieve + generate  │
│  Chat       │     │  DEL  /documents/:id  → remove doc + vectors │
│             │     │                                              │
│             │     │  ┌────────────┐  ┌────────────┐              │
│             │     │  │  ChromaDB  │  │  SQLite    │              │
│             │     │  │ (vectors)  │  │ (metadata) │              │
│             │     │  └────────────┘  └────────────┘              │
└─────────────┘     └──────────────────────────────────────────────┘
```

### How it works

1. **Upload** — Drop a PDF, TXT, or MD file. The backend extracts text, splits it into ~500-token chunks with overlap, and embeds each chunk into ChromaDB.
2. **Ask** — Type a question. The backend embeds your query, retrieves the most relevant chunks via vector similarity search, and sends them as context to Claude.
3. **Answer** — Claude responds using only the retrieved context, citing which sources it drew from. The UI displays the answer alongside source cards with similarity scores.

---

## Tech Stack

| Layer        | Technology                          |
|-------------|-------------------------------------|
| LLM          | Anthropic Claude (via SDK)         |
| Embeddings   | ChromaDB default (all-MiniLM-L6-v2) |
| Vector store | ChromaDB                           |
| Metadata DB  | SQLite (via SQLAlchemy)            |
| Backend      | FastAPI, Uvicorn                   |
| Text extraction | PyPDF2, raw read for TXT/MD     |
| Chunking     | Recursive character splitter       |
| Frontend     | React, Vite                        |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Backend

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/cortex-rag.git
cd cortex-rag

# Create environment file
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Set up Python environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Run the server
uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the frontend proxies API requests to `localhost:8000`.

### Tests

```bash
pip install -e ".[dev]"
python -m pytest tests/ -v
```

---

## API

| Method   | Endpoint              | Description                      |
|---------|-----------------------|----------------------------------|
| `POST`   | `/documents`         | Upload a document (multipart)    |
| `GET`    | `/documents`         | List all documents               |
| `DELETE` | `/documents/{id}`    | Remove document and its vectors  |
| `POST`   | `/query`             | Ask a question against the corpus|

### Query example

```json
POST /query
{
  "question": "What is the system's caching strategy?",
  "document_ids": ["abc-123"],
  "top_k": 5
}
```

Response includes the answer, source chunks with similarity scores, model name, and latency.

---

## Project Structure

```
cortex-rag/
├── backend/
│   ├── main.py              # FastAPI app, CORS, lifespan
│   ├── config.py            # Settings (pydantic-settings)
│   ├── database.py          # SQLAlchemy engine + session
│   ├── models.py            # ORM models (Document, Chunk, Query)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── vector_store.py      # ChromaDB wrapper
│   ├── routers/
│   │   ├── documents.py     # /documents endpoints
│   │   └── query.py         # /query endpoint
│   └── services/
│       ├── ingestion.py     # Extract → chunk → embed → store
│       ├── retrieval.py     # Vector search + context building
│       └── generation.py    # Claude API call + prompt construction
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       └── components/      # Sidebar, ChatArea, AnswerCard, SourceCard, etc.
├── tests/
├── .env.example
├── pyproject.toml
└── README.md
```

---

## Design

The frontend ("Cortex") uses a dark editorial aesthetic — Instrument Serif headings, DM Sans body text, JetBrains Mono for metadata, and a warm amber accent (`#C4956A`). See `cortex-project-spec.md` and `cortex-project-ui.jsx` for the full design reference.

---

## Key Design Decisions

- **No LangChain** — direct Anthropic SDK usage for full control over prompt construction and retrieval logic.
- **Dual storage** — SQLite for relational metadata (document status, chunk ordering, query logs) alongside ChromaDB for vector search. IDs are shared across both stores.
- **Async ingestion** — document processing runs in the background after the upload response, with status tracking (`processing` → `ready` → `error`).
- **Source attribution** — every answer includes the specific chunks used, with similarity scores and text previews.

---

## License

MIT
