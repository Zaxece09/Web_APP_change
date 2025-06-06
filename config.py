import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()

@dataclass
class DatabaseConfig:
    host: str = "localhost"
    port: int = 5432
    database: str = "exchanger_bd"
    user: str = "postgres"
    password: str = "amnyam"

@dataclass
class Config:
    db: DatabaseConfig = field(default_factory=DatabaseConfig)
    bot_token: str = os.getenv("BOT_TOKEN", "7681370763:AAGqFjsScdZTujFba_LR45bDLe24JLOJsPQ")
    webapp_url: str = os.getenv("WEBAPP_URL", "https://1b67-92-46-82-198.ngrok-free.app")

config = Config() 