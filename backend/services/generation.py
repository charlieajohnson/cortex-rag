import anthropic

from backend.config import settings

PROMPTS = {
    "answer": """You are a helpful document assistant. Answer the user's \
question based ONLY on the provided context. If the context doesn't contain \
enough information to answer, say so — do not make things up.

When answering, cite which source(s) you drew from using [Source N] notation.

Respond in plain text only. Do not use markdown formatting such as headers, \
bold, bullet points, or code blocks.""",

    "brief": """You are a research analyst. Based ONLY on the provided context, \
produce a structured research brief. Do not make things up.

Use this exact structure:

TITLE: A clear, specific title for this brief

TLDR:
- First key takeaway
- Second key takeaway
- Third key takeaway

KEY CLAIMS:
For each major claim, state the claim and cite the source using [Source N].

EVIDENCE:
For each claim above, provide the most relevant short excerpt from the sources.

OPEN QUESTIONS:
List 2-3 questions the sources don't fully answer or where evidence is thin.

SUGGESTED FOLLOW-UPS:
List 2-3 specific next steps or additional documents that would strengthen the analysis.

Respond in plain text only. Do not use markdown formatting.""",

    "memo": """You are a concise analyst. Based ONLY on the provided context, \
produce a bullet memo. Do not make things up.

Use this structure:

SUBJECT: One-line topic summary
DATE: Today's date

KEY POINTS:
- Point 1 [Source N]
- Point 2 [Source N]
- Point 3 [Source N]
(continue as needed, aim for 5-8 points)

BOTTOM LINE:
One sentence synthesis of what this all means.

Respond in plain text only. Do not use markdown formatting.""",

    "claims": """You are a critical analyst. Based ONLY on the provided context, \
extract and evaluate the key claims. Do not make things up.

Use this structure:

CLAIMS AND EVIDENCE:
For each claim found in the sources:
- CLAIM: State the claim clearly
- EVIDENCE: What supports it [Source N]
- STRENGTH: Strong / Moderate / Weak (based on how well the evidence supports it)

CONTRADICTIONS:
Note any claims that conflict with each other across sources.

GAPS:
What important questions are NOT addressed by these sources?

Respond in plain text only. Do not use markdown formatting.""",
}

_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)


def build_prompt(question: str, chunks: list[dict]) -> list[dict]:
    context = "\n\n".join(
        f"[Source {i + 1}] (from {c['metadata']['filename']}, chunk {c['metadata']['chunk_index']}):\n{c['text']}"
        for i, c in enumerate(chunks)
    )
    return [
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
    ]


def generate_answer(question: str, chunks: list[dict], mode: str = "answer") -> str:
    system_prompt = PROMPTS.get(mode, PROMPTS["answer"])
    messages = build_prompt(question, chunks)
    response = _client.messages.create(
        model=settings.anthropic_model,
        max_tokens=2048,
        system=system_prompt,
        messages=messages,
    )
    return response.content[0].text
