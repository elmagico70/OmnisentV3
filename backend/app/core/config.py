# app/core/config.py - Actualizado con configuración de archivos
import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Omnisent"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "sqlite:///./omnisent.db"
    DATABASE_URL_TEST: Optional[str] = "postgresql://postgres:237130dmd@localhost:5432/omnisent_test"
    
    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-this-in-production-please"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    
    # Security
    BCRYPT_ROUNDS: int = 12
    
    # ============================================
    # CONFIGURACIÓN DE ARCHIVOS (NUEVO)
    # ============================================
    
    # Directorios de almacenamiento
    UPLOAD_DIR: str = "./uploads"
    THUMBNAIL_DIR: str = "./thumbnails"
    TEMP_DIR: str = "./temp"
    
    # Límites de archivos
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB en bytes
    MAX_FILES_PER_UPLOAD: int = 20
    MAX_TOTAL_STORAGE_PER_USER: int = 1024 * 1024 * 1024  # 1GB por usuario
    
    # Tipos de archivo permitidos (por rol)
    ALLOWED_EXTENSIONS_ADMIN: List[str] = ["*"]  # Admin puede subir cualquier cosa
    ALLOWED_EXTENSIONS_USER: List[str] = [
        # Imágenes
        "jpg", "jpeg", "png", "gif", "svg", "webp", "bmp",
        # Documentos
        "pdf", "doc", "docx", "txt", "rtf", "odt", "xls", "xlsx", "ppt", "pptx",
        # Código
        "js", "ts", "jsx", "tsx", "html", "css", "json", "xml", "py", "java", "cpp",
        # Archivos comprimidos
        "zip", "rar", "7z", "tar", "gz",
        # Media
        "mp3", "wav", "mp4", "avi", "mov", "webm"
    ]
    ALLOWED_EXTENSIONS_GUEST: List[str] = [
        "jpg", "jpeg", "png", "gif", "pdf", "txt"
    ]
    
    # Tipos de archivo bloqueados (siempre)
    BLOCKED_EXTENSIONS: List[str] = [
        "exe", "bat", "cmd", "scr", "pif", "com", "msi", "vbs", "ps1"
    ]
    
    # Configuración de thumbnails
    ENABLE_THUMBNAILS: bool = True
    THUMBNAIL_SIZES: List[int] = [150, 300, 600]  # Tamaños en píxeles
    THUMBNAIL_QUALITY: int = 85  # Calidad JPEG (1-100)
    
    # Configuración de versiones
    ENABLE_VERSIONING: bool = True
    MAX_VERSIONS_PER_FILE: int = 10
    AUTO_DELETE_OLD_VERSIONS: bool = True
    
    # Configuración de compartición
    ENABLE_FILE_SHARING: bool = True
    MAX_SHARE_LINKS_PER_FILE: int = 5
    DEFAULT_SHARE_EXPIRY_DAYS: int = 7
    MAX_SHARE_DOWNLOADS: int = 1000
    
    # Configuración de seguridad para archivos
    SCAN_UPLOADED_FILES: bool = True  # Escanear virus (requiere ClamAV)
    QUARANTINE_SUSPICIOUS_FILES: bool = True
    LOG_FILE_ACTIVITIES: bool = True
    
    # Configuración de rendimiento
    ENABLE_COMPRESSION: bool = True  # Comprimir archivos grandes
    COMPRESSION_THRESHOLD: int = 10 * 1024 * 1024  # 10MB
    ENABLE_DEDUPLICATION: bool = True  # Evitar archivos duplicados
    
    # Configuración de búsqueda
    ENABLE_FULLTEXT_SEARCH: bool = True
    INDEX_FILE_CONTENTS: bool = False  # Indexar contenido de archivos de texto
    MAX_SEARCH_RESULTS: int = 100
    
    # Configuración de limpieza automática
    AUTO_CLEANUP_TEMP_FILES: bool = True
    TEMP_FILE_RETENTION_HOURS: int = 24
    AUTO_CLEANUP_DELETED_FILES: bool = True
    DELETED_FILE_RETENTION_DAYS: int = 30
    
    # Configuración de notificaciones
    NOTIFY_ON_LARGE_UPLOADS: bool = True
    LARGE_FILE_THRESHOLD: int = 50 * 1024 * 1024  # 50MB
    NOTIFY_ON_SUSPICIOUS_ACTIVITY: bool = True
    
    # URLs externas (para QR codes, etc.)
    EXTERNAL_URL: str = "http://localhost:8000"  # URL pública del servidor
    
    # Configuración de backup
    ENABLE_AUTO_BACKUP: bool = False
    BACKUP_SCHEDULE: str = "0 2 * * *"  # Cron expression: 2 AM daily
    BACKUP_RETENTION_DAYS: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        
        # Prefijos para variables de entorno
        env_prefix = ""
        
        # Mapeo de variables de entorno
        fields = {
            'MAX_FILE_SIZE': {'env': 'MAX_FILE_SIZE_MB'},
            'MAX_TOTAL_STORAGE_PER_USER': {'env': 'MAX_STORAGE_PER_USER_GB'}
        }

    # ============================================
    # MÉTODOS DE CONFIGURACIÓN DINÁMICOS
    # ============================================
    
    def get_allowed_extensions_for_role(self, role: str) -> List[str]:
        """Obtiene extensiones permitidas según el rol del usuario"""
        role_lower = role.lower()
        if role_lower == "admin":
            return self.ALLOWED_EXTENSIONS_ADMIN
        elif role_lower == "user":
            return self.ALLOWED_EXTENSIONS_USER
        elif role_lower == "guest":
            return self.ALLOWED_EXTENSIONS_GUEST
        else:
            return []
    
    def get_max_file_size_for_role(self, role: str) -> int:
        """Obtiene tamaño máximo de archivo según el rol"""
        role_lower = role.lower()
        if role_lower == "admin":
            return self.MAX_FILE_SIZE * 10  # Admin 10x más
        elif role_lower == "user":
            return self.MAX_FILE_SIZE
        elif role_lower == "guest":
            return self.MAX_FILE_SIZE // 10  # Guest 10x menos
        else:
            return 0
    
    def get_storage_quota_for_role(self, role: str) -> int:
        """Obtiene cuota de almacenamiento según el rol"""
        role_lower = role.lower()
        if role_lower == "admin":
            return self.MAX_TOTAL_STORAGE_PER_USER * 100  # Sin límite práctico
        elif role_lower == "user":
            return self.MAX_TOTAL_STORAGE_PER_USER
        elif role_lower == "guest":
            return self.MAX_TOTAL_STORAGE_PER_USER // 100  # 10MB para guests
        else:
            return 0
    
    def is_extension_allowed(self, extension: str, role: str) -> bool:
        """Verifica si una extensión está permitida para un rol"""
        extension_lower = extension.lower().lstrip('.')
        
        # Verificar extensiones bloqueadas (siempre bloqueadas)
        if extension_lower in [ext.lower() for ext in self.BLOCKED_EXTENSIONS]:
            return False
        
        # Verificar extensiones permitidas por rol
        allowed = self.get_allowed_extensions_for_role(role)
        
        # Si permite todo (*), verificar solo que no esté bloqueado
        if "*" in allowed:
            return True
        
        # Verificar en lista de permitidos
        return extension_lower in [ext.lower() for ext in allowed]
    
    def get_upload_path(self, user_id: str) -> str:
        """Genera ruta de almacenamiento para un usuario"""
        from pathlib import Path
        base_path = Path(self.UPLOAD_DIR)
        user_path = base_path / str(user_id)[:8]  # Usar solo los primeros 8 chars del UUID
        return str(user_path)
    
    def get_thumbnail_path(self, file_id: str, size: int = 300) -> str:
        """Genera ruta para thumbnail"""
        from pathlib import Path
        base_path = Path(self.THUMBNAIL_DIR)
        return str(base_path / f"{file_id}_{size}.jpg")
    
    def should_generate_thumbnail(self, extension: str) -> bool:
        """Determina si se debe generar thumbnail para un tipo de archivo"""
        if not self.ENABLE_THUMBNAILS:
            return False
        
        image_extensions = ["jpg", "jpeg", "png", "gif", "webp", "bmp"]
        return extension.lower() in image_extensions
    
    def format_file_size(self, size_bytes: int) -> str:
        """Formatea el tamaño de archivo para mostrar"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} PB"
    
    # ============================================
    # VALIDACIONES
    # ============================================
    
    def __post_init__(self):
        """Validaciones después de la inicialización"""
        # Crear directorios si no existen
        import os
        from pathlib import Path
        
        for directory in [self.UPLOAD_DIR, self.THUMBNAIL_DIR, self.TEMP_DIR]:
            Path(directory).mkdir(parents=True, exist_ok=True)
        
        # Validar configuraciones
        if self.MAX_FILE_SIZE <= 0:
            raise ValueError("MAX_FILE_SIZE debe ser mayor a 0")
        
        if self.MAX_FILES_PER_UPLOAD <= 0:
            raise ValueError("MAX_FILES_PER_UPLOAD debe ser mayor a 0")
        
        if not self.THUMBNAIL_SIZES:
            self.THUMBNAIL_SIZES = [150, 300, 600]
        
        # Asegurar que las extensiones estén en minúsculas
        self.BLOCKED_EXTENSIONS = [ext.lower() for ext in self.BLOCKED_EXTENSIONS]
        self.ALLOWED_EXTENSIONS_USER = [ext.lower() for ext in self.ALLOWED_EXTENSIONS_USER]
        self.ALLOWED_EXTENSIONS_GUEST = [ext.lower() for ext in self.ALLOWED_EXTENSIONS_GUEST]

# Instancia global de configuración
settings = Settings()

# Llamar post_init manualmente ya que Pydantic v2 no lo hace automáticamente
try:
    settings.__post_init__()
except Exception as e:
    print(f"Warning: Error en configuración post-init: {e}")

# ============================================
# CONFIGURACIONES ADICIONALES
# ============================================

# Mapeo de MIME types comunes
MIME_TYPE_MAPPING = {
    # Imágenes
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg", 
    "png": "image/png",
    "gif": "image/gif",
    "svg": "image/svg+xml",
    "webp": "image/webp",
    "bmp": "image/bmp",
    
    # Documentos
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "xls": "application/vnd.ms-excel",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "ppt": "application/vnd.ms-powerpoint",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "txt": "text/plain",
    "rtf": "application/rtf",
    
    # Código
    "html": "text/html",
    "css": "text/css",
    "js": "application/javascript",
    "json": "application/json",
    "xml": "application/xml",
    "py": "text/x-python",
    "java": "text/x-java-source",
    "cpp": "text/x-c++src",
    "c": "text/x-csrc",
    
    # Archivos comprimidos
    "zip": "application/zip",
    "rar": "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    "tar": "application/x-tar",
    "gz": "application/gzip",
    
    # Media
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "ogg": "audio/ogg",
    "mp4": "video/mp4",
    "avi": "video/x-msvideo",
    "mov": "video/quicktime",
    "webm": "video/webm",
}

# Categorías de archivos para filtros
FILE_CATEGORIES = {
    "images": ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"],
    "documents": ["pdf", "doc", "docx", "txt", "rtf", "odt", "xls", "xlsx", "ppt", "pptx"],
    "videos": ["mp4", "avi", "mov", "webm", "mkv", "flv", "wmv"],
    "music": ["mp3", "wav", "ogg", "flac", "aac", "m4a"],
    "archives": ["zip", "rar", "7z", "tar", "gz", "bz2"],
    "code": ["js", "ts", "jsx", "tsx", "html", "css", "json", "xml", "py", "java", "cpp", "c", "php", "rb", "go", "rs"]
}

# Configuración para desarrollo/testing
if settings.ENVIRONMENT == "development":
    # En desarrollo, ser más permisivo
    settings.MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB
    settings.SCAN_UPLOADED_FILES = False  # No escanear en desarrollo
    
elif settings.ENVIRONMENT == "production":
    # En producción, ser más estricto
    settings.SCAN_UPLOADED_FILES = True
    settings.QUARANTINE_SUSPICIOUS_FILES = True
    settings.LOG_FILE_ACTIVITIES = True