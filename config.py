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
    bot_token: str = os.getenv("BOT_TOKEN")
    webapp_url: str = os.getenv("WEBAPP_URL")
    bot_username: str = os.getenv("BOT_USERNAME", "@Ajnsfgsinjh1243_bot")

config = Config()

DATABASE_URL = f"postgresql://{config.db.user}:{config.db.password}@{config.db.host}:{config.db.port}/{config.db.database}" 