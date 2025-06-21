# app/routers/files.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File as FastAPIFile, Form, Query, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
import os
import io
from pathlib import Path

from app.core.database import get_db
from app.utils.dependencies import get_current_active_user, require_admin
from app.services.file_service import FileService
from app.schemas.file_schemas import (
    FileResponse, FileCreate, FileUpdate, FileListResponse,
    FileSearchQuery, FileSearchResponse, FileShareCreate, FileShareResponse,
    FilePermissionCreate, FilePermissionResponse, StorageStats,
    BulkUploadResponse, FileOperationResult, BulkOperationResult,
    FileMove, FileCopy, FileTreeNode
)

router = APIRouter(prefix="/api/files", tags=["files"])

# ============================================
# DEPENDENCIAS
# ============================================

def get_file_service(db: Session = Depends(get_db)) -> FileService:
    """Dependencia para obtener el servicio de archivos"""
    return FileService(db)

# ============================================
# ENDPOINTS DE CONSULTA
# ============================================

@router.get("/", response_model=FileListResponse)
async def get_files(
    path: str = Query("/", description="Ruta a explorar"),
    filter_type: Optional[str] = Query(None, description="Filtro: starred, protected, shared, images, etc."),
    search: Optional[str] = Query(None, description="Búsqueda por texto"),
    sort_by: str = Query("name", description="Campo de ordenamiento"),
    sort_order: str = Query("asc", description="Orden: asc o desc"),
    page: int = Query(1, ge=1, description="Página"),
    page_size: int = Query(50, ge=1, le=200, description="Elementos por página"),
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Obtiene lista de archivos y carpetas con filtros"""
    
    try:
        result = file_service.get_files(
            user_id=UUID(current_user["id"]),
            user_role=current_user["role"],
            path=path,
            filter_type=filter_type,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            page_size=page_size
        )
        
        return FileListResponse(**result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo archivos: {str(e)}"
        )

@router.get("/search", response_model=FileSearchResponse)
async def search_files(
    q: str = Query(..., min_length=1, description="Término de búsqueda"),
    path: Optional[str] = Query(None, description="Buscar en ruta específica"),
    file_type: Optional[str] = Query(None, description="Filtrar por tipo"),
    extension: Optional[str] = Query(None, description="Filtrar por extensión"),
    starred: Optional[bool] = Query(None, description="Solo favoritos"),
    protected: Optional[bool] = Query(None, description="Solo protegidos"),
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Búsqueda avanzada de archivos"""
    
    search_query = FileSearchQuery(
        q=q,
        path=path,
        file_type=file_type,
        extension=extension,
        starred=starred,
        protected=protected
    )
    
    try:
        result = file_service.search_files(
            search_query,
            user_id=UUID(current_user["id"]),
            user_role=current_user["role"]
        )
        
        return FileSearchResponse(**result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en búsqueda: {str(e)}"
        )

@router.get("/{file_id}", response_model=FileResponse)
async def get_file(
    file_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Obtiene información detallada de un archivo"""
    
    try:
        file = file_service.get_file_by_id(
            file_id,
            user_id=UUID(current_user["id"]),
            user_role=current_user["role"]
        )
        
        if not file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Archivo no encontrado"
            )
        
        file_dict = file.to_dict()
        file_dict["permissions"] = file_service._calculate_permissions(
            file, UUID(current_user["id"]), current_user["role"]
        )
        
        return FileResponse(**file_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo archivo: {str(e)}"
        )

@router.get("/starred", response_model=FileListResponse)
async def get_starred_files(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Obtiene archivos marcados como favoritos"""
    
    try:
        result = file_service.get_files(
            user_id=UUID(current_user["id"]),
            user_role=current_user["role"],
            filter_type="starred",
            page=page,
            page_size=page_size
        )
        
        return FileListResponse(**result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo favoritos: {str(e)}"
        )

@router.get("/recent", response_model=FileListResponse)
async def get_recent_files(
    limit: int = Query(20, ge=1, le=100, description="Número de archivos recientes"),
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Obtiene archivos recientes del usuario"""
    
    try:
        result = file_service.get_files(
            user_id=UUID(current_user["id"]),
            user_role=current_user["role"],
            sort_by="accessed_at",
            sort_order="desc",
            page_size=limit
        )
        
        return FileListResponse(**result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo archivos recientes: {str(e)}"
        )

# ============================================
# ENDPOINTS DE CREACIÓN
# ============================================

@router.post("/folders", response_model=FileResponse)
async def create_folder(
    folder_data: FileCreate,
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Crea una nueva carpeta"""
    
    try:
        folder_data.type = "folder"
        folder = file_service.create_folder(
            folder_data,
            user_id=UUID(current_user["id"])
        )
        
        return FileResponse(**folder.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creando carpeta: {str(e)}"
        )

@router.post("/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    parent_id: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Sube un archivo individual"""
    
    try:
        # Procesar tags
        tag_list = []
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        kwargs = {
            "description": description,
            "tags": tag_list
        }
        
        if parent_id:
            kwargs["parent_id"] = UUID(parent_id)
        
        uploaded_file = file_service.upload_file(
            file,
            user_id=UUID(current_user["id"]),
            **kwargs
        )
        
        file_dict = uploaded_file.to_dict()
        file_dict["url"] = file_service._generate_file_url(uploaded_file.id)
        if file_service._is_image(uploaded_file.extension):
            file_dict["thumbnail_url"] = file_service._generate_thumbnail_url(uploaded_file.id)
        
        return FileResponse(**file_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error subiendo archivo: {str(e)}"
        )

@router.post("/upload/batch", response_model=BulkUploadResponse)
async def upload_multiple_files(
    files: List[UploadFile] = FastAPIFile(...),
    parent_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Sube múltiples archivos"""
    
    uploaded = []
    failed = []
    
    for file in files:
        try:
            kwargs = {}
            if parent_id:
                kwargs["parent_id"] = UUID(parent_id)
            
            uploaded_file = file_service.upload_file(
                file,
                user_id=UUID(current_user["id"]),
                **kwargs
            )
            
            uploaded.append({
                "id": uploaded_file.id,
                "name": uploaded_file.name,
                "size": uploaded_file.size,
                "type": uploaded_file.type,
                "path": uploaded_file.path,
                "url": file_service._generate_file_url(uploaded_file.id),
                "thumbnail_url": file_service._generate_thumbnail_url(uploaded_file.id) 
                                if file_service._is_image(uploaded_file.extension) else None
            })
            
        except Exception as e:
            failed.append({
                "filename": file.filename or "unknown",
                "error": str(e)
            })
    
    return BulkUploadResponse(
        uploaded=uploaded,
        failed=failed,
        total=len(files),
        success_count=len(uploaded),
        error_count=len(failed)
    )

# ============================================
# ENDPOINTS DE ACTUALIZACIÓN
# ============================================

@router.patch("/{file_id}", response_model=FileResponse)
async def update_file(
    file_id: UUID,
    update_data: FileUpdate,
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Actualiza metadatos de un archivo"""
    
    try:
        updated_file = file_service.update_file(
            file_id,
            update_data,
            user_id=UUID(current_user["id"]),
            user_role=current_user["role"]
        )
        
        return FileResponse(**updated_file.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error actualizando archivo: {str(e)}"
        )

@router.post("/{file_id}/star")
async def toggle_star(
    file_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Marca/desmarca un archivo como favorito"""
    
    try:
        updated_file = file_service.toggle_star(
            file_id,
            user_id=UUID(current_user["id"]),
            user_role=current_user["role"]
        )
        
        return {
            "success": True,
            "starred": updated_file.starred,
            "message": f"Archivo {'marcado' if updated_file.starred else 'desmarcado'} como favorito"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cambiando favorito: {str(e)}"
        )

@router.post("/{file_id}/protect")
async def toggle_protected(
    file_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Marca/desmarca un archivo como protegido"""
    
    try:
        updated_file = file_service.toggle_protected(
            file_id,
            user_id=UUID(current_user["id"]),
            user_role=current_user["role"]
        )
        
        return {
            "success": True,
            "protected": updated_file.protected,
            "message": f"Archivo {'protegido' if updated_file.protected else 'desprotegido'}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cambiando protección: {str(e)}"
        )

@router.post("/move", response_model=BulkOperationResult)
async def move_files(
    move_data: FileMove,
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Mueve archivos a una nueva ubicación"""
    
    try:
        result = file_service.move_files(
            move_data.file_ids,
            move_data.target_path,
            user_id=UUID(current_user["id"]),
            user_role=current_user["role"]
        )
        
        return BulkOperationResult(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error moviendo archivos: {str(e)}"
        )

# ============================================
# ENDPOINTS DE ELIMINACIÓN
# ============================================

@router.delete("/{file_id}")
async def delete_file(
    file_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Elimina un archivo o carpeta"""
    
    try:
        success = file_service.delete_file(
            file_id,
            user_id=UUID(current_user["id"]),
            user_role=current_user["role"]
        )
        
        if success:
            return {"success": True, "message": "Archivo eliminado correctamente"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo eliminar el archivo"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error eliminando archivo: {str(e)}"
        )

@router.post("/delete/batch", response_model=BulkOperationResult)
async def delete_multiple_files(
    file_ids: List[UUID],
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Elimina múltiples archivos"""
    
    results = []
    success_count = 0
    error_count = 0
    
    for file_id in file_ids:
        try:
            success = file_service.delete_file(
                file_id,
                user_id=UUID(current_user["id"]),
                user_role=current_user["role"]
            )
            
            if success:
                results.append(FileOperationResult(
                    success=True,
                    message="Archivo eliminado",
                    file_id=file_id
                ))
                success_count += 1
            else:
                results.append(FileOperationResult(
                    success=False,
                    message="Error eliminando archivo",
                    file_id=file_id,
                    errors=["No se pudo eliminar"]
                ))
                error_count += 1
                
        except Exception as e:
            results.append(FileOperationResult(
                success=False,
                message=str(e),
                file_id=file_id,
                errors=[str(e)]
            ))
            error_count += 1
    
    return BulkOperationResult(
        total=len(file_ids),
        success_count=success_count,
        error_count=error_count,
        results=results
    )

# ============================================
# ENDPOINTS DE DESCARGA
# ============================================

@router.get("/{file_id}/download")
async def download_file(
    file_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Descarga un archivo"""
    
    try:
        file = file_service.get_file_by_id(
            file_id,
            user_id=UUID(current_user["id"]),
            user_role=current_user["role"]
        )
        
        if not file or not file.storage_path:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Archivo no encontrado"
            )
        
        if not os.path.exists(file.storage_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Archivo físico no encontrado"
            )
        
        # Actualizar último acceso
        file.accessed_at = datetime.utcnow()
        file_service.db.commit()
        
        return FileResponse(
            path=file.storage_path,
            filename=file.name,
            media_type=file.mime_type or 'application/octet-stream'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error descargando archivo: {str(e)}"
        )

@router.get("/{file_id}/thumbnail")
async def get_thumbnail(
    file_id: UUID,
    size: int = Query(300, ge=50, le=1000, description="Tamaño del thumbnail"),
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Obtiene thumbnail de una imagen"""
    
    try:
        file = file_service.get_file_by_id(
            file_id,
            user_id=UUID(current_user["id"]),
            user_role=current_user["role"]
        )
        
        if not file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Archivo no encontrado"
            )
        
        thumbnail_path = file_service.thumbnail_path / f"{file_id}.jpg"
        
        if not thumbnail_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Thumbnail no disponible"
            )
        
        return FileResponse(
            path=str(thumbnail_path),
            media_type="image/jpeg"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo thumbnail: {str(e)}"
        )

# ============================================
# ENDPOINTS DE COMPARTICIÓN
# ============================================

@router.post("/{file_id}/share", response_model=FileShareResponse)
async def create_share_link(
    file_id: UUID,
    share_data: FileShareCreate,
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Crea un link de compartición para un archivo"""
    
    try:
        share = file_service.create_share_link(
            file_id,
            share_data,
            user_id=UUID(current_user["id"]),
            user_role=current_user["role"]
        )
        
        share_dict = share.to_dict()
        # TODO: Generar QR code
        share_dict["qr_code"] = f"/api/qr/{share.token}"
        
        return FileShareResponse(**share_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creando link de compartición: {str(e)}"
        )

@router.get("/{file_id}/share", response_model=List[FileShareResponse])
async def get_file_shares(
    file_id: UUID,
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Obtiene links de compartición de un archivo"""
    
    try:
        file = file_service.get_file_by_id(
            file_id,
            user_id=UUID(current_user["id"]),
            user_role=current_user["role"]
        )
        
        if not file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Archivo no encontrado"
            )
        
        shares = []
        for share in file.shares:
            share_dict = share.to_dict()
            share_dict["qr_code"] = f"/api/qr/{share.token}"
            shares.append(FileShareResponse(**share_dict))
        
        return shares
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo comparticiones: {str(e)}"
        )

# ============================================
# ENDPOINTS DE ESTADÍSTICAS
# ============================================

@router.get("/storage/stats", response_model=StorageStats)
async def get_storage_stats(
    current_user: dict = Depends(get_current_active_user),
    file_service: FileService = Depends(get_file_service)
):
    """Obtiene estadísticas de almacenamiento del usuario"""
    
    try:
        stats = file_service.get_storage_stats(
            user_id=UUID(current_user["id"])
        )
        
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo estadísticas: {str(e)}"
        )

@router.get("/storage/admin", response_model=StorageStats)
async def get_admin_storage_stats(
    current_user: dict = Depends(require_admin),
    file_service: FileService = Depends(get_file_service)
):
    """Obtiene estadísticas globales de almacenamiento (solo admin)"""
    
    try:
        stats = file_service.get_storage_stats()  # Sin user_id = stats globales
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo estadísticas globales: {str(e)}"
        )