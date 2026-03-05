import anthropic

from backend.config import settings

SYSTEM_PROMPT = """You are a helpful document assistant. Answer the user's \
question based ONLY on the provided context. If the context doesn't contain \
enough information to answer, say so — do not make things up.

When answering, cite which source(s) you drew from using [Source N] notation.

Respond in plain text only. Do not use markdown formatting such as headers, \
bold, bullet points, or code blocks."""

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)


def build_prompt(question: str, chunks: list[dict]) -> list[dict]:
    context = "\n\n".join(
        f"[Source {i + 1}] (from {c['metadata']['filename']}, chunk {c['metadata']['chunk_index']}):\n{c['text']}"
        for i, c in enumerate(chunks)
    )
    return [
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
    ]


def generate_answer(question: str, chunks: list[dict]) -> str:
    messages = build_prompt(question, chunks)
    response = _client.messages.create(
        model=settings.anthropic_model,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    return response.content[0].text
