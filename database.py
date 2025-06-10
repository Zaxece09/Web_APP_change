from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
from config import config
import logging

logger = logging.getLogger(__name__)

db_url = f"postgresql+psycopg2://{config.db.user}:{config.db.password}@{config.db.host}:{config.db.port}/{config.db.database}"
logger.info(f"Database URL: {db_url}")

engine = create_engine(db_url, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_tables():
    """Создание всех таблиц в базе данных"""
    Base.metadata.create_all(bind=engine)

def recreate_tables():
    """Пересоздание всех таблиц (удаляет существующие!)"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def get_db():
    """Получение сессии базы данных"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 