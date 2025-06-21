# app/schemas/file_schemas.py
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

# ============================================
# SCHEMAS BASE
# ============================================

class FileBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Nombre del archivo")
    description: Optional[str] = Field(None, max_length=1000, description="Descripción del archivo")
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags del archivo")
    starred: Optional[bool] = Field(False, description="Archivo marcado como favorito")
    protected: Optional[bool] = Field(False, description="Archivo protegido")

class FileCreate(FileBase):
    parent_id: Optional[UUID] = Field(None, description="ID del directorio padre")
    type: str = Field("file", description="Tipo: file o folder")
    
class FileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    tags: Optional[List[str]] = None
    starred: Optional[bool] = None
    protected: Optional[bool] = None
    parent_id: Optional[UUID] = None

class FileMove(BaseModel):
    file_ids: List[UUID] = Field(..., description="IDs de archivos a mover")
    target_path: str = Field(..., description="Ruta de destino")

class FileCopy(BaseModel):
    file_ids: List[UUID] = Field(..., description="IDs de archivos a copiar")
    target_path: str = Field(..., description="Ruta de destino")

# ============================================
# SCHEMAS DE RESPONSE
# ============================================

class FilePermissions(BaseModel):
    read: bool = True
    write: bool = False
    delete: bool = False
    share: bool = False
    
class FileResponse(BaseModel):
    id: UUID
    name: str
    type: str
    extension: Optional[str]
    size: int
    path: str
    parent_id: Optional[UUID]
    mime_type: Optional[str]
    description: Optional[str]
    tags: List[str]
    starred: bool
    protected: bool
    shared: bool
    visibility: str
    owner_id: UUID
    owner: str
    created: str
    modified: str
    accessed: str
    version: int
    permissions: FilePermissions
    
    class Config:
        from_attributes = True
        
    @validator('created', 'modified', 'accessed', pre=True)
    def format_datetime(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v

class FileListResponse(BaseModel):
    files: List[FileResponse]
    total: int
    page: int = 1
    page_size: int = 50
    has_more: bool = False

# ============================================
# SCHEMAS DE PERMISOS
# ============================================

class FilePermissionBase(BaseModel):
    can_read: bool = True
    can_write: bool = False
    can_delete: bool = False
    can_share: bool = False
    can_manage: bool = False

class FilePermissionCreate(FilePermissionBase):
    user_id: UUID
    expires_at: Optional[datetime] = None

class FilePermissionUpdate(FilePermissionBase):
    expires_at: Optional[datetime] = None

class FilePermissionResponse(FilePermissionBase):
    id: UUID
    file_id: UUID
    user_id: UUID
    granted_by: UUID
    granted_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True

# ============================================
# SCHEMAS DE COMPARTICIÓN
# ============================================

class FileShareBase(BaseModel):
    password: Optional[str] = Field(None, min_length=4, max_length=50, description="Contraseña opcional")
    max_downloads: Optional[int] = Field(None, ge=1, le=10000, description="Máximo número de descargas")
    expires_at: Optional[datetime] = Field(None, description="Fecha de expiración")
    allow_upload: Optional[bool] = Field(False, description="Permitir subir archivos")

class FileShareCreate(FileShareBase):
    pass

class FileShareUpdate(BaseModel):
    password: Optional[str] = Field(None, min_length=4, max_length=50)
    max_downloads: Optional[int] = Field(None, ge=1, le=10000)
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None
    allow_upload: Optional[bool] = None

class FileShareResponse(BaseModel):
    id: UUID
    token: str
    file_id: UUID
    max_downloads: Optional[int]
    download_count: int
    expires_at: Optional[datetime]
    created_at: datetime
    last_accessed: Optional[datetime]
    is_active: bool
    allow_upload: bool
    has_password: bool
    qr_code: Optional[str] = None  # URL del código QR
    
    class Config:
        from_attributes = True

class FileSharePublic(BaseModel):
    """Schema para acceso público a archivos compartidos"""
    file: FileResponse
    share_info: Dict[str, Any]
    download_url: str

# ============================================
# SCHEMAS DE VERSIONES
# ============================================

class FileVersionResponse(BaseModel):
    id: UUID
    version_number: int
    size: int
    created_at: datetime
    created_by: UUID
    comment: Optional[str]
    
    class Config:
        from_attributes = True

# ============================================
# SCHEMAS DE BÚSQUEDA
# ============================================

class FileSearchQuery(BaseModel):
    q: str = Field(..., min_length=1, description="Texto a buscar")
    path: Optional[str] = Field(None, description="Buscar en ruta específica")
    file_type: Optional[str] = Field(None, description="Filtrar por tipo de archivo")
    extension: Optional[str] = Field(None, description="Filtrar por extensión")
    owner: Optional[str] = Field(None, description="Filtrar por propietario")
    starred: Optional[bool] = Field(None, description="Solo archivos favoritos")
    protected: Optional[bool] = Field(None, description="Solo archivos protegidos")
    date_from: Optional[datetime] = Field(None, description="Fecha desde")
    date_to: Optional[datetime] = Field(None, description="Fecha hasta")
    size_min: Optional[int] = Field(None, description="Tamaño mínimo en bytes")
    size_max: Optional[int] = Field(None, description="Tamaño máximo en bytes")

class FileSearchResponse(BaseModel):
    query: str
    total: int
    results: List[FileResponse]
    facets: Dict[str, Any]  # Agregaciones para filtros
    suggestions: List[str]  # Sugerencias de búsqueda

# ============================================
# SCHEMAS DE UPLOAD
# ============================================

class FileUploadResponse(BaseModel):
    id: UUID
    name: str
    size: int
    type: str
    path: str
    url: str
    thumbnail_url: Optional[str]
    
class BulkUploadResponse(BaseModel):
    uploaded: List[FileUploadResponse]
    failed: List[Dict[str, str]]  # {"filename": "error_message"}
    total: int
    success_count: int
    error_count: int

# ============================================
# SCHEMAS DE ESTADÍSTICAS
# ============================================

class StorageStats(BaseModel):
    total_files: int
    total_folders: int
    total_size: int
    used_space: int
    available_space: int
    file_types: Dict[str, int]  # {"pdf": 45, "jpg": 123}
    recent_activity: List[Dict[str, Any]]

class UserStorageStats(BaseModel):
    user_id: UUID
    username: str
    total_files: int
    total_size: int
    quota_used: float  # Porcentaje
    quota_limit: int  # En bytes
    largest_files: List[FileResponse]

# ============================================
# SCHEMAS DE ACTIVIDAD
# ============================================

class FileActivityCreate(BaseModel):
    file_id: UUID
    activity_type: str
    description: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class FileActivityResponse(BaseModel):
    id: UUID
    file_id: UUID
    user_id: Optional[UUID]
    activity_type: str
    description: str
    ip_address: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================
# SCHEMAS DE CONFIGURACIÓN
# ============================================

class FileSystemConfig(BaseModel):
    """Configuración del sistema de archivos"""
    max_file_size: int = Field(100 * 1024 * 1024, description="Tamaño máximo de archivo en bytes")
    allowed_extensions: List[str] = Field(default_factory=list, description="Extensiones permitidas")
    blocked_extensions: List[str] = Field(default_factory=list, description="Extensiones bloqueadas")
    enable_versioning: bool = Field(True, description="Habilitar versionado")
    max_versions: int = Field(10, description="Máximo número de versiones")
    enable_thumbnails: bool = Field(True, description="Generar miniaturas")
    thumbnail_sizes: List[int] = Field([150, 300, 600], description="Tamaños de miniaturas")

# ============================================
# SCHEMAS ADICIONALES
# ============================================

class FileOperationResult(BaseModel):
    success: bool
    message: str
    file_id: Optional[UUID] = None
    errors: List[str] = Field(default_factory=list)

class BulkOperationResult(BaseModel):
    total: int
    success_count: int
    error_count: int
    results: List[FileOperationResult]
    
class FileTreeNode(BaseModel):
    """Para representar estructura de árbol de carpetas"""
    id: UUID
    name: str
    type: str
    path: str
    children: List['FileTreeNode'] = Field(default_factory=list)
    
# Permitir referencias circulares
FileTreeNode.model_rebuild()