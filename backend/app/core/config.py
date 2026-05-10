import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Ticket Workspace"
    PROJECT_VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"postgresql://{os.getenv('POSTGRES_USER', 'postgres')}:{os.getenv('POSTGRES_PASSWORD', 'postgres')}@db:5432/{os.getenv('POSTGRES_DB', 'ticket_db')}"
    )
    
    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mantis_ai_super_secret_key_12345")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 horas
    
    UPLOAD_DIR: str = "static/uploads"

settings = Settings()
