# app/services/file_service.py
import os
import shutil
import hashlib
import secrets
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from fastapi import HTTPException, UploadFile, status
from PIL import Image
import magic

from app.models.file import File, FilePermission, FileShare, FileVersion, FileActivity, FileType
from app.models.user import User, UserRole
from app.schemas.file_schemas import (
    FileCreate, FileUpdate, FileSearchQuery, FileShareCreate,
    FilePermissionCreate, StorageStats
)
from app.core.config import settings

class FileService:
    """Servicio principal para gestión de archivos"""
    
    def __init__(self, db: Session):
        self.db = db
        self.storage_path = Path(getattr(settings, 'UPLOAD_DIR', './uploads'))
        self.thumbnail_path = Path(getattr(settings, 'THUMBNAIL_DIR', './thumbnails'))
        self.storage_path.mkdir(exist_ok=True)
        self.thumbnail_path.mkdir(exist_ok=True)
        
        # Configuraciones
        self.max_file_size = getattr(settings, 'MAX_FILE_SIZE', 100 * 1024 * 1024)  # 100MB
        self.allowed_extensions = getattr(settings, 'ALLOWED_EXTENSIONS', [
            'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip'
        ])
        self.blocked_extensions = getattr(settings, 'BLOCKED_EXTENSIONS', [
            'exe', 'bat', 'cmd', 'scr', 'pif', 'com'
        ])
    
    # ============================================
    # MÉTODOS DE CONSULTA
    # ============================================
    
    def get_files(
        self, 
        user_id: UUID, 
        user_role: str,
        path: str = "/", 
        filter_type: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "name",
        sort_order: str = "asc",
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """Obtiene lista de archivos con filtros y permisos"""
        
        query = self.db.query(File)
        
        # Filtrar por permisos según rol
        if user_role != UserRole.ADMIN.value:
            # Los usuarios solo ven sus archivos o archivos compartidos con ellos
            query = query.filter(
                or_(
                    File.owner_id == user_id,
                    File.visibility == "public",
                    self.db.query(FilePermission).filter(
                        and_(
                            FilePermission.file_id == File.id,
                            FilePermission.user_id == user_id,
                            FilePermission.can_read == True
                        )
                    ).exists()
                )
            )
        
        # Filtrar por ruta
        if path != "/":
            query = query.filter(File.path.startswith(path))
        
        # Aplicar filtros específicos
        if filter_type:
            if filter_type == "starred":
                query = query.filter(File.starred == True)
            elif filter_type == "protected":
                query = query.filter(File.protected == True)
            elif filter_type == "shared":
                query = query.filter(
                    self.db.query(FileShare).filter(
                        FileShare.file_id == File.id
                    ).exists()
                )
            elif filter_type in ["images", "documents", "videos", "music", "archives", "code"]:
                extensions = self._get_extensions_by_category(filter_type)
                query = query.filter(File.extension.in_(extensions))
        
        # Búsqueda por texto
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    File.name.ilike(search_term),
                    File.description.ilike(search_term),
                    File.tags.ilike(search_term)
                )
            )
        
        # Ordenamiento
        sort_column = getattr(File, sort_by, File.name)
        if sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Carpetas primero, luego archivos
        query = query.order_by(File.type.desc(), sort_column)
        
        # Paginación
        total = query.count()
        files = query.offset((page - 1) * page_size).limit(page_size).all()
        
        # Convertir a diccionarios con permisos calculados
        file_list = []
        for file in files:
            file_dict = file.to_dict()
            file_dict["permissions"] = self._calculate_permissions(file, user_id, user_role)
            file_dict["url"] = self._generate_file_url(file.id)
            if self._is_image(file.extension):
                file_dict["thumbnail_url"] = self._generate_thumbnail_url(file.id)
            file_list.append(file_dict)
        
        return {
            "files": file_list,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": total > page * page_size
        }
    
    def get_file_by_id(self, file_id: UUID, user_id: UUID, user_role: str) -> Optional[File]:
        """Obtiene un archivo específico por ID"""
        file = self.db.query(File).filter(File.id == file_id).first()
        
        if not file:
            return None
        
        # Verificar permisos
        if not self._can_access_file(file, user_id, user_role, "read"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para acceder a este archivo"
            )
        
        return file
    
    def search_files(self, query: FileSearchQuery, user_id: UUID, user_role: str) -> Dict[str, Any]:
        """Búsqueda avanzada de archivos"""
        
        db_query = self.db.query(File)
        
        # Aplicar permisos
        if user_role != UserRole.ADMIN.value:
            db_query = db_query.filter(
                or_(
                    File.owner_id == user_id,
                    File.visibility == "public"
                )
            )
        
        # Filtros de búsqueda
        if query.q:
            search_term = f"%{query.q}%"
            db_query = db_query.filter(
                or_(
                    File.name.ilike(search_term),
                    File.description.ilike(search_term),
                    File.tags.ilike(search_term)
                )
            )
        
        if query.path:
            db_query = db_query.filter(File.path.startswith(query.path))
        
        if query.file_type:
            db_query = db_query.filter(File.type == query.file_type)
        
        if query.extension:
            db_query = db_query.filter(File.extension == query.extension)
        
        if query.starred is not None:
            db_query = db_query.filter(File.starred == query.starred)
        
        if query.protected is not None:
            db_query = db_query.filter(File.protected == query.protected)
        
        if query.date_from:
            db_query = db_query.filter(File.created_at >= query.date_from)
        
        if query.date_to:
            db_query = db_query.filter(File.created_at <= query.date_to)
        
        if query.size_min:
            db_query = db_query.filter(File.size >= query.size_min)
        
        if query.size_max:
            db_query = db_query.filter(File.size <= query.size_max)
        
        # Ejecutar consulta
        files = db_query.all()
        
        return {
            "query": query.q,
            "total": len(files),
            "results": [file.to_dict() for file in files],
            "facets": self._generate_search_facets(files),
            "suggestions": self._generate_search_suggestions(query.q)
        }
    
    # ============================================
    # MÉTODOS DE CREACIÓN Y MODIFICACIÓN
    # ============================================
    
    def create_folder(self, folder_data: FileCreate, user_id: UUID) -> File:
        """Crea una nueva carpeta"""
        
        # Verificar permisos en carpeta padre
        parent_path = folder_data.parent_id
        if parent_path:
            parent = self.get_file_by_id(parent_path, user_id, UserRole.USER.value)
            if not parent or not parent.is_folder:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Carpeta padre no válida"
                )
        
        # Generar ruta completa
        if parent_path:
            parent = self.db.query(File).filter(File.id == parent_path).first()
            full_path = f"{parent.path.rstrip('/')}/{folder_data.name}"
        else:
            full_path = f"/{folder_data.name}"
        
        # Verificar que no exista
        existing = self.db.query(File).filter(
            and_(
                File.name == folder_data.name,
                File.parent_id == folder_data.parent_id,
                File.owner_id == user_id
            )
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una carpeta con ese nombre"
            )
        
        # Crear carpeta
        folder = File(
            name=folder_data.name,
            type=FileType.FOLDER.value,
            path=full_path,
            parent_id=folder_data.parent_id,
            owner_id=user_id,
            description=folder_data.description,
            tags=",".join(folder_data.tags) if folder_data.tags else None,
            starred=folder_data.starred or False,
            protected=folder_data.protected or False
        )
        
        self.db.add(folder)
        self.db.commit()
        self.db.refresh(folder)
        
        # Registrar actividad
        self._log_activity(folder.id, user_id, "folder_created", f"Carpeta '{folder.name}' creada")
        
        return folder
    
    def upload_file(self, upload_file: UploadFile, user_id: UUID, **kwargs) -> File:
        """Sube un archivo al sistema"""
        
        # Validaciones
        self._validate_file_upload(upload_file)
        
        # Generar información del archivo
        file_extension = self._get_file_extension(upload_file.filename)
        file_name = upload_file.filename
        file_size = 0
        
        # Leer contenido y calcular tamaño
        content = upload_file.file.read()
        file_size = len(content)
        upload_file.file.seek(0)  # Reset para reutilizar
        
        # Validar tamaño
        if file_size > self.max_file_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Archivo muy grande. Máximo: {self.max_file_size / 1024 / 1024:.1f}MB"
            )
        
        # Generar paths
        parent_id = kwargs.get('parent_id')
        if parent_id:
            parent = self.db.query(File).filter(File.id == parent_id).first()
            full_path = f"{parent.path.rstrip('/')}/{file_name}"
        else:
            full_path = f"/{file_name}"
        
        # Generar ruta de almacenamiento
        storage_subdir = self._generate_storage_path(user_id)
        storage_file_path = storage_subdir / f"{secrets.token_hex(16)}_{file_name}"
        
        # Crear directorio si no existe
        storage_file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Guardar archivo físico
        with open(storage_file_path, "wb") as f:
            f.write(content)
        
        # Calcular checksum
        checksum = hashlib.md5(content).hexdigest()
        
        # Detectar MIME type
        mime_type = magic.from_buffer(content, mime=True)
        
        # Crear registro en BD
        file_record = File(
            name=file_name,
            type=FileType.FILE.value,
            extension=file_extension,
            size=file_size,
            path=full_path,
            storage_path=str(storage_file_path),
            parent_id=parent_id,
            owner_id=user_id,
            mime_type=mime_type,
            checksum=checksum,
            description=kwargs.get('description'),
            tags=",".join(kwargs.get('tags', [])) if kwargs.get('tags') else None
        )
        
        self.db.add(file_record)
        self.db.commit()
        self.db.refresh(file_record)
        
        # Generar thumbnail si es imagen
        if self._is_image(file_extension):
            self._generate_thumbnail(file_record, content)
        
        # Registrar actividad
        self._log_activity(file_record.id, user_id, "file_uploaded", f"Archivo '{file_name}' subido")
        
        return file_record
    
    def update_file(self, file_id: UUID, update_data: FileUpdate, user_id: UUID, user_role: str) -> File:
        """Actualiza metadatos de un archivo"""
        
        file = self.get_file_by_id(file_id, user_id, user_role)
        
        if not self._can_access_file(file, user_id, user_role, "write"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para editar este archivo"
            )
        
        # Actualizar campos
        if update_data.name is not None:
            file.name = update_data.name
        if update_data.description is not None:
            file.description = update_data.description
        if update_data.tags is not None:
            file.tags = ",".join(update_data.tags) if update_data.tags else None
        if update_data.starred is not None:
            file.starred = update_data.starred
        if update_data.protected is not None:
            file.protected = update_data.protected
        
        file.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(file)
        
        # Registrar actividad
        self._log_activity(file_id, user_id, "file_updated", f"Archivo '{file.name}' actualizado")
        
        return file
    
    def delete_file(self, file_id: UUID, user_id: UUID, user_role: str) -> bool:
        """Elimina un archivo o carpeta"""
        
        file = self.get_file_by_id(file_id, user_id, user_role)
        
        if not self._can_access_file(file, user_id, user_role, "delete"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para eliminar este archivo"
            )
        
        # Si es carpeta, eliminar contenido recursivamente
        if file.is_folder:
            children = self.db.query(File).filter(File.parent_id == file_id).all()
            for child in children:
                self.delete_file(child.id, user_id, user_role)
        
        # Eliminar archivo físico
        if file.storage_path and os.path.exists(file.storage_path):
            os.remove(file.storage_path)
        
        # Eliminar thumbnail
        thumbnail_path = self.thumbnail_path / f"{file_id}.jpg"
        if thumbnail_path.exists():
            thumbnail_path.unlink()
        
        # Registrar actividad antes de eliminar
        self._log_activity(file_id, user_id, "file_deleted", f"Archivo '{file.name}' eliminado")
        
        # Eliminar de BD
        self.db.delete(file)
        self.db.commit()
        
        return True
    
    def move_files(self, file_ids: List[UUID], target_path: str, user_id: UUID, user_role: str) -> Dict[str, Any]:
        """Mueve archivos a una nueva ubicación"""
        
        results = []
        success_count = 0
        error_count = 0
        
        for file_id in file_ids:
            try:
                file = self.get_file_by_id(file_id, user_id, user_role)
                
                if not self._can_access_file(file, user_id, user_role, "write"):
                    results.append({
                        "file_id": str(file_id),
                        "success": False,
                        "error": "Sin permisos para mover el archivo"
                    })
                    error_count += 1
                    continue
                
                # Actualizar ruta
                old_path = file.path
                file.path = f"{target_path.rstrip('/')}/{file.name}"
                file.updated_at = datetime.utcnow()
                
                self.db.commit()
                
                # Registrar actividad
                self._log_activity(file_id, user_id, "file_moved", f"Archivo movido de '{old_path}' a '{file.path}'")
                
                results.append({
                    "file_id": str(file_id),
                    "success": True,
                    "new_path": file.path
                })
                success_count += 1
                
            except Exception as e:
                results.append({
                    "file_id": str(file_id),
                    "success": False,
                    "error": str(e)
                })
                error_count += 1
        
        return {
            "total": len(file_ids),
            "success_count": success_count,
            "error_count": error_count,
            "results": results
        }
    
    def toggle_star(self, file_id: UUID, user_id: UUID, user_role: str) -> File:
        """Cambia el estado de favorito de un archivo"""
        
        file = self.get_file_by_id(file_id, user_id, user_role)
        
        if not self._can_access_file(file, user_id, user_role, "write"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para marcar este archivo"
            )
        
        file.starred = not file.starred
        file.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(file)
        
        # Registrar actividad
        action = "starred" if file.starred else "unstarred"
        self._log_activity(file_id, user_id, f"file_{action}", f"Archivo '{file.name}' {action}")
        
        return file
    
    def toggle_protected(self, file_id: UUID, user_id: UUID, user_role: str) -> File:
        """Cambia el estado de protección de un archivo"""
        
        file = self.get_file_by_id(file_id, user_id, user_role)
        
        # Solo el propietario o admin puede cambiar protección
        if file.owner_id != user_id and user_role != UserRole.ADMIN.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo el propietario puede cambiar la protección del archivo"
            )
        
        file.protected = not file.protected
        file.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(file)
        
        # Registrar actividad
        action = "protected" if file.protected else "unprotected"
        self._log_activity(file_id, user_id, f"file_{action}", f"Archivo '{file.name}' {action}")
        
        return file
    
    # ============================================
    # MÉTODOS DE COMPARTICIÓN
    # ============================================
    
    def create_share_link(self, file_id: UUID, share_data: FileShareCreate, user_id: UUID, user_role: str) -> FileShare:
        """Crea un link de compartición para un archivo"""
        
        file = self.get_file_by_id(file_id, user_id, user_role)
        
        if not self._can_access_file(file, user_id, user_role, "share"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para compartir este archivo"
            )
        
        # Generar token único
        token = self._generate_share_token()
        
        # Hashear contraseña si existe
        password_hash = None
        if share_data.password:
            password_hash = hashlib.sha256(share_data.password.encode()).hexdigest()
        
        # Crear share
        share = FileShare(
            file_id=file_id,
            token=token,
            password=password_hash,
            max_downloads=share_data.max_downloads,
            expires_at=share_data.expires_at,
            allow_upload=share_data.allow_upload or False,
            created_by=user_id
        )
        
        self.db.add(share)
        self.db.commit()
        self.db.refresh(share)
        
        # Registrar actividad
        self._log_activity(file_id, user_id, "file_shared", f"Archivo '{file.name}' compartido")
        
        return share
    
    def get_storage_stats(self, user_id: Optional[UUID] = None) -> StorageStats:
        """Obtiene estadísticas de almacenamiento"""
        
        query = self.db.query(File)
        if user_id:
            query = query.filter(File.owner_id == user_id)
        
        files = query.all()
        
        total_files = len([f for f in files if f.is_file])
        total_folders = len([f for f in files if f.is_folder])
        total_size = sum(f.size for f in files if f.is_file)
        
        # Contar por tipos de archivo
        file_types = {}
        for file in files:
            if file.is_file and file.extension:
                ext = file.extension.lower()
                file_types[ext] = file_types.get(ext, 0) + 1
        
        return StorageStats(
            total_files=total_files,
            total_folders=total_folders,
            total_size=total_size,
            used_space=total_size,
            available_space=self.max_file_size * 1000,  # Simulado
            file_types=file_types,
            recent_activity=[]  # TODO: Implementar
        )
    
    # ============================================
    # MÉTODOS PRIVADOS Y UTILIDADES
    # ============================================
    
    def _calculate_permissions(self, file: File, user_id: UUID, user_role: str) -> Dict[str, bool]:
        """Calcula permisos efectivos de un usuario sobre un archivo"""
        
        # Admin tiene todos los permisos
        if user_role == UserRole.ADMIN.value:
            return {
                "read": True,
                "write": True,
                "delete": True,
                "share": True,
                "manage": True
            }
        
        # Propietario tiene todos los permisos
        if file.owner_id == user_id:
            return {
                "read": True,
                "write": True,
                "delete": True,
                "share": True,
                "manage": True
            }
        
        # Verificar permisos específicos
        permission = self.db.query(FilePermission).filter(
            and_(
                FilePermission.file_id == file.id,
                FilePermission.user_id == user_id
            )
        ).first()
        
        if permission:
            return {
                "read": permission.can_read,
                "write": permission.can_write,
                "delete": permission.can_delete,
                "share": permission.can_share,
                "manage": permission.can_manage
            }
        
        # Archivo público
        if file.visibility == "public":
            return {
                "read": True,
                "write": False,
                "delete": False,
                "share": False,
                "manage": False
            }
        
        # Sin permisos por defecto
        return {
            "read": False,
            "write": False,
            "delete": False,
            "share": False,
            "manage": False
        }
    
    def _can_access_file(self, file: File, user_id: UUID, user_role: str, permission: str) -> bool:
        """Verifica si un usuario puede realizar una acción específica"""
        permissions = self._calculate_permissions(file, user_id, user_role)
        return permissions.get(permission, False)
    
    def _validate_file_upload(self, upload_file: UploadFile):
        """Valida un archivo antes de subirlo"""
        
        if not upload_file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nombre de archivo requerido"
            )
        
        extension = self._get_file_extension(upload_file.filename)
        
        # Verificar extensiones bloqueadas
        if extension in self.blocked_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de archivo no permitido: .{extension}"
            )
        
        # Verificar extensiones permitidas (si está configurado)
        if self.allowed_extensions and extension not in self.allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tipo de archivo no permitido. Permitidos: {', '.join(self.allowed_extensions)}"
            )
    
    def _get_file_extension(self, filename: str) -> str:
        """Extrae la extensión de un archivo"""
        return Path(filename).suffix.lstrip('.').lower()
    
    def _is_image(self, extension: Optional[str]) -> bool:
        """Verifica si una extensión corresponde a una imagen"""
        if not extension:
            return False
        return extension.lower() in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
    
    def _generate_storage_path(self, user_id: UUID) -> Path:
        """Genera ruta de almacenamiento para un usuario"""
        return self.storage_path / str(user_id)[:8]
    
    def _generate_file_url(self, file_id: UUID) -> str:
        """Genera URL de acceso al archivo"""
        return f"/api/files/{file_id}/download"
    
    def _generate_thumbnail_url(self, file_id: UUID) -> str:
        """Genera URL del thumbnail"""
        return f"/api/files/{file_id}/thumbnail"
    
    def _generate_share_token(self) -> str:
        """Genera token único para compartir"""
        return secrets.token_urlsafe(32)
    
    def _generate_thumbnail(self, file: File, content: bytes):
        """Genera thumbnail para imágenes"""
        try:
            image = Image.open(io.BytesIO(content))
            image.thumbnail((300, 300), Image.LANCZOS)
            
            thumbnail_path = self.thumbnail_path / f"{file.id}.jpg"
            image.save(thumbnail_path, "JPEG", quality=85)
            
        except Exception as e:
            print(f"Error generating thumbnail for {file.id}: {e}")
    
    def _get_extensions_by_category(self, category: str) -> List[str]:
        """Obtiene extensiones por categoría"""
        categories = {
            "images": ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"],
            "documents": ["pdf", "doc", "docx", "txt", "rtf", "odt", "xls", "xlsx", "ppt", "pptx"],
            "videos": ["mp4", "avi", "mov", "webm", "mkv", "flv", "wmv"],
            "music": ["mp3", "wav", "ogg", "flac", "aac", "m4a"],
            "archives": ["zip", "rar", "7z", "tar", "gz", "bz2"],
            "code": ["js", "ts", "jsx", "tsx", "html", "css", "json", "xml", "py", "java", "cpp"]
        }
        return categories.get(category, [])
    
    def _log_activity(self, file_id: UUID, user_id: UUID, activity_type: str, description: str):
        """Registra actividad en el archivo"""
        activity = FileActivity(
            file_id=file_id,
            user_id=user_id,
            activity_type=activity_type,
            description=description
        )
        self.db.add(activity)
        # No hacer commit aquí, se hace en la transacción principal
    
    def _generate_search_facets(self, files: List[File]) -> Dict[str, Any]:
        """Genera facetas para búsqueda"""
        extensions = {}
        sizes = {"small": 0, "medium": 0, "large": 0}
        
        for file in files:
            if file.extension:
                extensions[file.extension] = extensions.get(file.extension, 0) + 1
            
            if file.size < 1024 * 1024:  # < 1MB
                sizes["small"] += 1
            elif file.size < 10 * 1024 * 1024:  # < 10MB
                sizes["medium"] += 1
            else:
                sizes["large"] += 1
        
        return {
            "extensions": extensions,
            "sizes": sizes
        }
    
    def _generate_search_suggestions(self, query: str) -> List[str]:
        """Genera sugerencias de búsqueda"""
        # Implementación básica - en producción usar índice de búsqueda
        suggestions = []
        if query and len(query) > 2:
            common_terms = ["document", "image", "video", "backup", "project", "report"]
            suggestions = [term for term in common_terms if query.lower() in term]
        return suggestions[:5]