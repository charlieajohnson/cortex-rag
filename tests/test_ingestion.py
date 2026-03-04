import tempfile
from pathlib import Path

from backend.services.ingestion import chunk_text, count_tokens, extract_text


def test_extract_text_plain():
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        f.write("Hello world")
        path = Path(f.name)
    text = extract_text(path, "text/plain")
    assert text == "Hello world"
    path.unlink()


def test_extract_text_markdown():
    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
        f.write("# Title\n\nSome content")
        path = Path(f.name)
    text = extract_text(path, "text/markdown")
    assert "# Title" in text
    path.unlink()


def test_count_tokens():
    count = count_tokens("Hello world")
    assert count > 0
    assert isinstance(count, int)


def test_chunk_text_short():
    """Short text should produce a single chunk."""
    text = "This is a short document."
    chunks = chunk_text(text)
    assert len(chunks) == 1
    assert chunks[0]["chunk_index"] == 0
    assert chunks[0]["text"] == text
    assert chunks[0]["token_count"] > 0


def test_chunk_text_long():
    """Long text should produce multiple overlapping chunks."""
    text = "The quick brown fox jumps over the lazy dog. " * 200
    chunks = chunk_text(text)
    assert len(chunks) > 1

    # Verify ordering
    for i, c in enumerate(chunks):
        assert c["chunk_index"] == i

    # Verify overlap: chunk 1 start_char < chunk 0 end_char
    if len(chunks) >= 2:
        assert chunks[1]["start_char"] < chunks[0]["end_char"]


def test_chunk_text_ids_unique():
    text = "Word " * 2000
    chunks = chunk_text(text)
    ids = [c["id"] for c in chunks]
    assert len(ids) == len(set(ids))
