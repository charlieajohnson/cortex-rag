from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-5-20250514"

    database_url: str = f"sqlite:///{BASE_DIR / 'data' / 'cortex.db'}"
    chromadb_dir: str = str(BASE_DIR / "data" / "chromadb")
    chromadb_collection: str = "document_chunks"

    chunk_size: int = 500
    chunk_overlap: int = 50
    default_top_k: int = 5

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
