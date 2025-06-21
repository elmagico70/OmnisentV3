# app/models/__init__.py
"""
Modelos de la aplicación Omnisent

Este archivo debe importar todos los modelos para que Alembic
pueda detectarlos automáticamente para las migraciones.
"""

from app.models.user import User, UserRole
from app.models.base import LogEntry, TimestampMixin

# Exportar todos los modelos
__all__ = [
    # Modelos de usuario
    "User",
    "UserRole",
    
    # Modelos base
    "LogEntry", 
    "TimestampMixin",
    
    # Modelos de archivos
    "File",
    "FilePermission",
    "FileShare", 
    "FileVersion",
    "FileActivity",
    
    # Enums
    "FileType",
    "FileVisibility",
]