from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "Zentro API"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = "http://localhost:3000,http://127.0.0.1:3000"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    # Security
    SECRET_KEY: str = "zentro-insecure-dev-secret-key-change-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./zentro.db"

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def assemble_database_url(cls, v: str) -> str:
        # Normalize PostgreSQL URL scheme for asyncpg
        if v.startswith("postgres://"):
            v = "postgresql+asyncpg://" + v[len("postgres://"):]
        elif v.startswith("postgresql://") and not v.startswith("postgresql+"):
            v = "postgresql+asyncpg://" + v[len("postgresql://"):]

        # Normalize Neon / libpq query parameters for asyncpg compatibility
        if "postgresql+asyncpg://" in v and "?" in v:
            from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
            parsed = urlparse(v)
            if parsed.query:
                params = parse_qs(parsed.query)
                clean_params = {}
                for k, vals in params.items():
                    if k in ("sslmode", "ssl"):
                        clean_params["ssl"] = "require"
                    elif k in ("channel_binding", "gssencmode", "target_session_attrs"):
                        continue
                    else:
                        clean_params[k] = vals[-1]
                new_query = urlencode(clean_params)
                v = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))

        if v.startswith("sqlite") and "///." in v:
            # Anchored to backend root directory
            rel_part = v.split("///.")[1].lstrip("/\\")
            abs_path = (BACKEND_DIR / rel_part).resolve().as_posix()
            prefix = v.split(":///.")[0]
            return f"{prefix}:///{abs_path}"
        return v

    # AI Configuration
    AI_PROVIDER: str = "mock"  # 'openai', 'gemini', 'groq', 'mock'
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    AI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    AI_CHAT_MODEL: str = "gpt-4o-mini"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
