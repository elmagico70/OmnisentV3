from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.core.database import Base

class TimestampMixin:
    """Mixin para agregar timestamps a modelos"""
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class LogEntry(Base, TimestampMixin):
    """Modelo para logs del sistema"""
    __tablename__ = "logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    level = Column(String(20), nullable=False, index=True)  # info, warning, error, success, debug
    module = Column(String(50), nullable=False, index=True)  # auth, api, system, etc.
    message = Column(Text, nullable=False)
    details = Column(Text, nullable=True)
    stack = Column(Text, nullable=True)
    user_id = Column(String(100), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    environment = Column(String(20), default="development", nullable=False)
    
    def __repr__(self):
        return f"<LogEntry(level='{self.level}', module='{self.module}', message='{self.message[:50]}...')>"
    
    def to_dict(self):
        """Convierte el modelo a diccionario"""
        return {
            "id": str(self.id),
            "timestamp": self.timestamp.isoformat(),
            "level": self.level,
            "module": self.module,
            "message": self.message,
            "details": self.details,
            "stack": self.stack,
            "user": self.user_id,
            "ip": self.ip_address,
            "env": self.environment
        }

class FileItem(Base, TimestampMixin):
    """Modelo para archivos del sistema"""
    __tablename__ = "files"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(20), nullable=False)  # file, folder
    extension = Column(String(10), nullable=True)
    size = Column(String(20), default="0", nullable=False)
    path = Column(Text, nullable=False, index=True)
    starred = Column(String(10), default="false", nullable=False)
    protected = Column(String(10), default="false", nullable=False)
    
    def __repr__(self):
        return f"<FileItem(name='{self.name}', type='{self.type}', path='{self.path}')>"
    
    def to_dict(self):
        """Convierte el modelo a diccionario"""
        return {
            "id": str(self.id),
            "name": self.name,
            "type": self.type,
            "extension": self.extension,
            "size": int(self.size) if self.size.isdigit() else 0,
            "modified": self.updated_at.isoformat(),
            "path": self.path,
            "starred": self.starred.lower() == "true",
            "protected": self.protected.lower() == "true"
        }