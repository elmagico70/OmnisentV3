# app/models/file.py
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey, Index, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.core.database import Base
from app.models.user import User

class FileType(str, enum.Enum):
    FILE = "file"
    FOLDER = "folder"

class FileVisibility(str, enum.Enum):
    PRIVATE = "private"
    SHARED = "shared"
    PUBLIC = "public"

class File(Base):
    __tablename__ = "files"
    
    # ⚠️ SOLO UNA DEFINICIÓN DE __table_args__ - CORREGIDO
    __table_args__ = (
        Index('idx_files_owner_path', 'owner_id', 'path'),
        Index('idx_files_parent_name', 'parent_id', 'name'),
        Index('idx_files_type_visibility', 'type', 'visibility'),
        Index('idx_files_starred_owner', 'starred', 'owner_id'),
        Index('idx_files_created_owner', 'created_at', 'owner_id'),
        {"extend_existing": True}  # Mantener extend_existing
    )
    
    # Campos principales
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String(255), nullable=False, index=True)
    type = Column(String(20), nullable=False, default=FileType.FILE.value)  # file, folder
    extension = Column(String(10), nullable=True)
    size = Column(Integer, default=0, nullable=False)  # Tamaño en bytes
    
    # Rutas y ubicación
    path = Column(Text, nullable=False, index=True)  # Ruta completa del archivo
    storage_path = Column(Text, nullable=True)  # Ruta física en el servidor
    parent_id = Column(UUID(as_uuid=True), ForeignKey('files.id'), nullable=True, index=True)
    
    # Metadatos
    mime_type = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)  # JSON string de tags
    
    # Estados y propiedades
    starred = Column(Boolean, default=False, nullable=False, index=True)
    protected = Column(Boolean, default=False, nullable=False, index=True)
    visibility = Column(String(20), default=FileVisibility.PRIVATE.value, nullable=False, index=True)
    
    # Propietario y permisos
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    accessed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Versioning
    version = Column(Integer, default=1, nullable=False)
    checksum = Column(String(64), nullable=True)  # MD5 o SHA256 hash
    
    # Relaciones
    owner = relationship("User", back_populates="files")
    parent = relationship("File", remote_side=[id], backref="children")
    permissions = relationship("FilePermission", back_populates="file", cascade="all, delete-orphan")
    shares = relationship("FileShare", back_populates="file", cascade="all, delete-orphan")
    versions = relationship("FileVersion", back_populates="file", cascade="all, delete-orphan")
    
    # ❌ ELIMINADA: Segunda definición de __table_args__ que estaba causando el error
    
    def __repr__(self):
        return f"<File(name='{self.name}', type='{self.type}', owner='{self.owner_id}')>"
    
    def to_dict(self):
        """Convierte el modelo a diccionario para JSON responses"""
        return {
            "id": str(self.id),
            "name": self.name,
            "type": self.type,
            "extension": self.extension,
            "size": self.size,
            "path": self.path,
            "parent_id": str(self.parent_id) if self.parent_id else None,
            "mime_type": self.mime_type,
            "description": self.description,
            "tags": self.tags.split(',') if self.tags else [],
            "starred": self.starred,
            "protected": self.protected,
            "visibility": self.visibility,
            "owner_id": str(self.owner_id),
            "owner": self.owner.username if self.owner else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "accessed_at": self.accessed_at.isoformat(),
            "version": self.version,
            "checksum": self.checksum,
            "shared": len(self.shares) > 0 if self.shares else False,
            "permissions": {
                "read": True,  # Se calcula dinámicamente en el servicio
                "write": True,
                "delete": True,
                "share": True
            }
        }
    
    @property
    def is_folder(self) -> bool:
        return self.type == FileType.FOLDER.value
    
    @property
    def is_file(self) -> bool:
        return self.type == FileType.FILE.value
    
    @property
    def is_shared(self) -> bool:
        return len(self.shares) > 0 if self.shares else False
    
    def get_full_path(self) -> str:
        """Retorna la ruta completa del archivo"""
        return self.path

class FilePermission(Base):
    """Permisos específicos por usuario para archivos"""
    __tablename__ = "file_permissions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_id = Column(UUID(as_uuid=True), ForeignKey('files.id'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)
    
    # Permisos específicos
    can_read = Column(Boolean, default=True, nullable=False)
    can_write = Column(Boolean, default=False, nullable=False)
    can_delete = Column(Boolean, default=False, nullable=False)
    can_share = Column(Boolean, default=False, nullable=False)
    can_manage = Column(Boolean, default=False, nullable=False)  # Cambiar permisos
    
    # Metadatos
    granted_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    granted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)  # Permisos temporales
    
    # Relaciones
    file = relationship("File", back_populates="permissions")
    user = relationship("User", foreign_keys=[user_id])
    granter = relationship("User", foreign_keys=[granted_by])
    
    # Índices
    __table_args__ = (
        Index('idx_file_permissions_file_user', 'file_id', 'user_id', unique=True),
        Index('idx_file_permissions_user', 'user_id'),
    )
    
    def __repr__(self):
        return f"<FilePermission(file='{self.file_id}', user='{self.user_id}')>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "file_id": str(self.file_id),
            "user_id": str(self.user_id),
            "can_read": self.can_read,
            "can_write": self.can_write,
            "can_delete": self.can_delete,
            "can_share": self.can_share,
            "can_manage": self.can_manage,
            "granted_by": str(self.granted_by),
            "granted_at": self.granted_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }

class FileShare(Base):
    """Links de compartición para archivos"""
    __tablename__ = "file_shares"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    file_id = Column(UUID(as_uuid=True), ForeignKey('files.id'), nullable=False, index=True)
    
    # Token de acceso
    token = Column(String(64), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=True)  # Opcional, hasheado
    
    # Configuración del link
    max_downloads = Column(Integer, nullable=True)  # Límite de descargas
    download_count = Column(Integer, default=0, nullable=False)
    expires_at = Column(DateTime, nullable=True)  # Fecha de expiración
    
    # Metadatos
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_accessed = Column(DateTime, nullable=True)
    
    # Estados
    is_active = Column(Boolean, default=True, nullable=False)
    allow_upload = Column(Boolean, default=False, nullable=False)  # Permitir subir archivos
    
    # Relaciones
    file = relationship("File", back_populates="shares")
    creator = relationship("User")
    
    def __repr__(self):
        return f"<FileShare(token='{self.token[:8]}...', file='{self.file_id}')>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "file_id": str(self.file_id),
            "token": self.token,
            "max_downloads": self.max_downloads,
            "download_count": self.download_count,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_by": str(self.created_by),
            "created_at": self.created_at.isoformat(),
            "last_accessed": self.last_accessed.isoformat() if self.last_accessed else None,
            "is_active": self.is_active,
            "allow_upload": self.allow_upload,
            "has_password": self.password is not None,
        }
    
    @property
    def is_expired(self) -> bool:
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_max_downloads_reached(self) -> bool:
        if not self.max_downloads:
            return False
        return self.download_count >= self.max_downloads
    
    @property
    def is_valid(self) -> bool:
        return (self.is_active and 
                not self.is_expired and 
                not self.is_max_downloads_reached)

class FileVersion(Base):
    """Historial de versiones de archivos"""
    __tablename__ = "file_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    file_id = Column(UUID(as_uuid=True), ForeignKey('files.id'), nullable=False, index=True)
    
    # Información de la versión
    version_number = Column(Integer, nullable=False)
    size = Column(Integer, nullable=False)
    checksum = Column(String(64), nullable=False)
    storage_path = Column(Text, nullable=False)
    
    # Metadatos
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    comment = Column(Text, nullable=True)  # Comentario del cambio
    
    # Relaciones
    file = relationship("File", back_populates="versions")
    creator = relationship("User")
    
    # Índices
    __table_args__ = (
        Index('idx_file_versions_file_version', 'file_id', 'version_number', unique=True),
    )
    
    def __repr__(self):
        return f"<FileVersion(file='{self.file_id}', version={self.version_number})>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "file_id": str(self.file_id),
            "version_number": self.version_number,
            "size": self.size,
            "checksum": self.checksum,
            "created_by": str(self.created_by),
            "created_at": self.created_at.isoformat(),
            "comment": self.comment,
        }

class FileActivity(Base):
    """Log de actividad de archivos"""
    __tablename__ = "file_activities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    file_id = Column(UUID(as_uuid=True), ForeignKey('files.id'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True, index=True)
    
    # Tipo de actividad
    activity_type = Column(String(50), nullable=False, index=True)  # created, updated, deleted, shared, etc.
    description = Column(Text, nullable=False)
    
    # Metadatos
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relaciones
    file = relationship("File")
    user = relationship("User")
    
    def __repr__(self):
        return f"<FileActivity(file='{self.file_id}', type='{self.activity_type}')>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "file_id": str(self.file_id),
            "user_id": str(self.user_id) if self.user_id else None,
            "activity_type": self.activity_type,
            "description": self.description,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat(),
        }