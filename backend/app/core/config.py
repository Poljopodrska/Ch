"""
Application configuration using Pydantic settings.
"""

from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """

    # Application
    APP_NAME: str = "AI Forecasting Platform"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")

    # Database
    DB_HOST: Optional[str] = Field(default=None, env="DB_HOST")
    DB_PORT: Optional[int] = Field(default=5432, env="DB_PORT")
    DB_USER: Optional[str] = Field(default=None, env="DB_USER")
    DB_PASSWORD: Optional[str] = Field(default=None, env="DB_PASSWORD")
    DB_NAME: str = Field(env="DB_NAME")

    @property
    def DATABASE_URL(self) -> str:
        # Support SQLite for local development
        if self.DB_NAME.startswith('sqlite'):
            return self.DB_NAME
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    @property
    def ASYNC_DATABASE_URL(self) -> str:
        if self.DB_NAME.startswith('sqlite'):
            return self.DB_NAME.replace('sqlite://', 'sqlite+aiosqlite://')
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # Redis
    REDIS_HOST: str = Field(default="localhost", env="REDIS_HOST")
    REDIS_PORT: int = Field(default=6379, env="REDIS_PORT")
    REDIS_PASSWORD: Optional[str] = Field(default=None, env="REDIS_PASSWORD")
    REDIS_DB: int = Field(default=0, env="REDIS_DB")

    @property
    def REDIS_URL(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # Security
    SECRET_KEY: str = Field(env="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    # AWS
    AWS_REGION: str = Field(default="eu-central-1", env="AWS_REGION")
    AWS_S3_BUCKET: Optional[str] = Field(default=None, env="AWS_S3_BUCKET")
    AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None, env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(default=None, env="AWS_SECRET_ACCESS_KEY")

    # S3 Paths
    S3_ML_MODELS_PREFIX: str = "ml-models/"
    S3_UPLOADED_DATA_PREFIX: str = "uploaded-data/"
    S3_EXPORTS_PREFIX: str = "exports/"

    # Monitoring
    SENTRY_DSN: Optional[str] = Field(default=None, env="SENTRY_DSN")

    # API
    API_V1_PREFIX: str = Field(default="/api/v1", env="API_V1_PREFIX")
    CORS_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:8000",
            "https://ch-production-source-1753092181.s3.eu-central-1.amazonaws.com",
        ],
        env="CORS_ORIGINS",
    )
    MAX_UPLOAD_SIZE_MB: int = Field(default=100, env="MAX_UPLOAD_SIZE_MB")

    # ML Configuration
    MODEL_TRAINING_TIMEOUT_SECONDS: int = Field(default=300, env="MODEL_TRAINING_TIMEOUT_SECONDS")
    MODEL_CACHE_TTL_SECONDS: int = Field(default=3600, env="MODEL_CACHE_TTL_SECONDS")
    PREDICTION_BATCH_SIZE: int = Field(default=1000, env="PREDICTION_BATCH_SIZE")

    # Feature Engineering
    MIN_CUSTOMER_HISTORY_DAYS: int = Field(default=90, env="MIN_CUSTOMER_HISTORY_DAYS")
    MIN_PAYMENT_SAMPLES: int = Field(default=5, env="MIN_PAYMENT_SAMPLES")

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
