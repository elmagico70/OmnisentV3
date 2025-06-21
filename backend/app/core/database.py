from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from .config import settings

# Motor de base de datos
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verifica conexiones antes de usarlas
    pool_recycle=300,    # Recicla conexiones cada 5 minutos
    echo=settings.DEBUG  # Log SQL queries en desarrollo
)

# Sesión de base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """
    Dependencia para obtener sesión de base de datos
    Se usa como dependency injection en FastAPI
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Crea todas las tablas en la base de datos"""
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """Elimina todas las tablas (solo para desarrollo/testing)"""
    Base.metadata.drop_all(bind=engine)