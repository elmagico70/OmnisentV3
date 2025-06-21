# app/main.py - Actualizado con sistema de archivos
from fastapi import FastAPI, Request, HTTPException, status, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import uuid
import psutil
import random
from datetime import datetime, timedelta
from pathlib import Path

# Imports locales
from app.core.config import settings
from app.core.database import create_tables, get_db
from app.routes.auth import router as auth_router
from app.routers.files import router as files_router  # NUEVO
from app.utils.dependencies import get_current_active_user, require_admin

# Configurar logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Maneja el ciclo de vida de la aplicación"""
    # Startup
    logger.info(f"🚀 Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"🌍 Entorno: {settings.ENVIRONMENT}")
    
    # Crear directorios necesarios
    upload_dir = Path(getattr(settings, 'UPLOAD_DIR', './uploads'))
    thumbnail_dir = Path(getattr(settings, 'THUMBNAIL_DIR', './thumbnails'))
    upload_dir.mkdir(exist_ok=True)
    thumbnail_dir.mkdir(exist_ok=True)
    logger.info(f"📁 Directorios creados: {upload_dir}, {thumbnail_dir}")
    
    # Crear tablas si no existen (en producción usar Alembic)
    if settings.DEBUG:
        logger.info("📊 Creando tablas de base de datos...")
        create_tables()
    
    yield
    
    # Shutdown
    logger.info("🛑 Cerrando aplicación...")

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Sistema de inteligencia avanzado con gestión de archivos",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir archivos estáticos para thumbnails y downloads
if hasattr(settings, 'THUMBNAIL_DIR'):
    app.mount("/thumbnails", StaticFiles(directory=settings.THUMBNAIL_DIR), name="thumbnails")

# Middleware para logging de requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware para loggear todas las requests"""
    start_time = request.state.start_time = logger.info(f"📨 {request.method} {request.url}")
    
    response = await call_next(request)
    
    logger.info(f"📤 {request.method} {request.url} - {response.status_code}")
    return response

# Manejador global de excepciones
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Maneja excepciones no capturadas"""
    logger.error(f"❌ Error no manejado: {exc}", exc_info=True)
    
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Error interno del servidor",
                "detail": str(exc),
                "type": type(exc).__name__
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"error": "Error interno del servidor"}
        )

# Incluir routers
app.include_router(auth_router)
app.include_router(files_router)  # NUEVO - Sistema de archivos

# ====== MODELOS PYDANTIC (EXISTENTES) ======

class Note(BaseModel):
    id: str
    title: str
    content: str

class AIRequest(BaseModel):
    prompt: str

class DashboardResponse(BaseModel):
    cpu: str
    memory: str
    disk: str
    users: int

class LogEntry(BaseModel):
    id: str
    timestamp: str
    level: str
    module: str
    message: str
    details: Optional[str] = None
    stack: Optional[str] = None
    user: Optional[str] = None
    ip: Optional[str] = None
    env: Optional[str] = None

class User(BaseModel):
    id: str
    username: str
    email: str
    role: str
    status: str
    lastLogin: str
    loginCount: int
    ipAddress: str

class SystemMetric(BaseModel):
    name: str
    value: float
    unit: str
    change: float
    status: str

class SearchResult(BaseModel):
    id: str
    type: str
    content: str
    source: str
    date: str
    risk: str

class SecurityStatus(BaseModel):
    firewall: str
    ssl: str
    twoFA: str
    lastScan: str

class ThreatAlert(BaseModel):
    id: str
    type: str
    severity: str
    message: str
    timestamp: str
    ip: Optional[str] = None

# ====== DATOS EN MEMORIA (MOCK) ======

# Notas
notes_db = [
    Note(id=str(uuid.uuid4()), title="Nota de ejemplo", content="Esta es una nota cargada desde el backend.")
]

# Generar datos mock (funciones existentes)
def generate_mock_logs():
    levels = ["info", "warning", "error", "success", "debug"]
    modules = ["Auth", "API", "Database", "Security", "System", "Network", "Files"]  # Agregado Files
    messages = {
        "info": ["User logged in", "API request processed", "Cache cleared", "Backup started", "File uploaded"],
        "warning": ["High memory usage", "Slow query detected", "Rate limit approaching", "Disk space low", "Large file upload"],
        "error": ["Authentication failed", "Database connection lost", "API timeout", "Service unavailable", "File upload failed"],
        "success": ["Backup completed", "User verified", "System updated", "Security scan passed", "File processed"],
        "debug": ["Variable state changed", "Function called", "Memory allocated", "Process started", "File indexed"]
    }
    
    logs = []
    for i in range(100):
        level = random.choice(levels)
        module = random.choice(modules)
        message = random.choice(messages[level])
        
        log = LogEntry(
            id=f"log-{i}",
            timestamp=(datetime.now() - timedelta(minutes=random.randint(0, 1440))).isoformat(),
            level=level,
            module=module,
            message=message,
            details=f"Additional details for {message}" if random.random() > 0.5 else None,
            user=f"user{random.randint(1, 100)}" if random.random() > 0.3 else None,
            ip=f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
            env="production" if random.random() > 0.7 else "development"
        )
        logs.append(log)
    
    return logs

# NOTA: Se han removido generate_mock_files() porque ahora usamos la base de datos real

def generate_mock_users():
    users = []
    for i in range(20):
        user = User(
            id=f"user-{i}",
            username=f"user{i}" if i > 0 else "admin",
            email=f"user{i}@example.com" if i > 0 else "admin@omnisent.com",
            role="admin" if i == 0 else ("guest" if random.random() > 0.8 else "user"),
            status="banned" if random.random() > 0.95 else ("inactive" if random.random() > 0.85 else "active"),
            lastLogin=(datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
            loginCount=random.randint(1, 1000),
            ipAddress=f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}"
        )
        users.append(user)
    return users

def generate_search_results(query: str):
    if not query:
        return []
    
    results = [
        SearchResult(id="1", type="email", content=f"{query}@example.com", source="Database Leak 2024", date="2024-01-15", risk="high"),
        SearchResult(id="2", type="password", content=f"P@ssw0rd_{query}!", source="Breach Compilation", date="2024-01-10", risk="high"),
        SearchResult(id="3", type="url", content=f"https://{query}.example.com/login", source="Phishing Database", date="2024-01-08", risk="medium"),
        SearchResult(id="4", type="username", content=f"{query}_user", source="Forum Leak", date="2024-01-12", risk="low"),
        SearchResult(id="5", type="ip", content=f"192.168.1.{random.randint(1, 255)}", source="Network Scan", date="2024-01-14", risk="medium"),
    ]
    
    # Filtrar resultados relevantes
    filtered_results = []
    for result in results:
        if query.lower() in result.content.lower():
            filtered_results.append(result)
    
    return filtered_results

# Almacenar datos en memoria
logs_db = generate_mock_logs()
users_db = generate_mock_users()

# ====== RUTAS PRINCIPALES ======

@app.get("/")
async def root():
    """Endpoint raíz con información del sistema"""
    return {
        "message": f"{settings.APP_NAME} Backend Online",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "healthy",
        "features": ["auth", "dashboard", "files", "search", "admin"]  # Agregado files
    }

@app.get("/health")
async def health_check():
    """Health check para monitoreo"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "services": {
            "database": "ok",
            "file_storage": "ok",
            "auth": "ok"
        }
    }

# ====== ENDPOINTS DASHBOARD ======

@app.get("/api/dashboard", response_model=DashboardResponse)
async def get_dashboard_data():
    """Endpoint que devuelve datos reales del sistema para el dashboard"""
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        cpu_usage = f"{cpu_percent:.1f}%"
        memory_used = f"{memory.used / (1024**3):.1f}GB"
        disk_usage = f"{(disk.used / disk.total) * 100:.1f}%"
        active_users = random.randint(3, 12)
        
        return DashboardResponse(
            cpu=cpu_usage,
            memory=memory_used,
            disk=disk_usage,
            users=active_users
        )
    except Exception as e:
        logger.error(f"Error obteniendo datos del dashboard: {e}")
        return DashboardResponse(
            cpu=f"{random.randint(10, 80):.1f}%",
            memory=f"{random.uniform(4.0, 15.0):.1f}GB",
            disk=f"{random.randint(30, 90)}%",
            users=random.randint(1, 10)
        )

# ====== ENDPOINTS LOGS ======

@app.get("/api/logs", response_model=List[LogEntry])
async def get_logs(
    level: Optional[str] = None, 
    limit: int = Query(50, le=1000),
    current_user: dict = Depends(require_admin)
):
    """Obtener logs del sistema con filtros - Solo administradores"""
    filtered_logs = logs_db
    
    if level and level != "all":
        filtered_logs = [log for log in logs_db if log.level == level]
    
    # Ordenar por timestamp descendente y limitar
    sorted_logs = sorted(filtered_logs, key=lambda x: x.timestamp, reverse=True)
    return sorted_logs[:limit]

# ====== ENDPOINTS ADMIN ======

@app.get("/api/admin/users", response_model=List[User])
async def get_users(current_user: dict = Depends(require_admin)):
    """Obtener usuarios para el panel de admin"""
    return users_db

@app.get("/api/admin/metrics", response_model=List[SystemMetric])
async def get_system_metrics(current_user: dict = Depends(require_admin)):
    """Obtener métricas del sistema"""
    try:
        cpu_percent = psutil.cpu_percent()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Agregar métricas de archivos
        upload_dir = Path(getattr(settings, 'UPLOAD_DIR', './uploads'))
        total_files = len(list(upload_dir.rglob('*'))) if upload_dir.exists() else 0
        
        metrics = [
            SystemMetric(name="CPU Usage", value=cpu_percent, unit="%", change=random.uniform(-10, 10), 
                        status="good" if cpu_percent < 70 else "warning" if cpu_percent < 90 else "critical"),
            SystemMetric(name="Memory", value=memory.percent, unit="%", change=random.uniform(-5, 15), 
                        status="good" if memory.percent < 70 else "warning" if memory.percent < 90 else "critical"),
            SystemMetric(name="Storage", value=(disk.used / disk.total) * 100, unit="%", change=random.uniform(0, 5), 
                        status="good" if (disk.used / disk.total) < 0.7 else "warning" if (disk.used / disk.total) < 0.9 else "critical"),
            SystemMetric(name="Active Users", value=len([u for u in users_db if u.status == "active"]), unit="", change=random.uniform(-20, 30), status="good"),
            SystemMetric(name="Total Files", value=total_files, unit="", change=random.uniform(-10, 20), status="good"),  # NUEVO
            SystemMetric(name="API Calls", value=random.randint(800, 1500), unit="/min", change=random.uniform(-30, 50), status="warning"),
            SystemMetric(name="Error Rate", value=random.uniform(0.1, 5.0), unit="%", change=random.uniform(-2, 2), status="good"),
        ]
        return metrics
    except:
        # Fallback con datos simulados
        return [
            SystemMetric(name="CPU Usage", value=42, unit="%", change=-5, status="good"),
            SystemMetric(name="Memory", value=68, unit="%", change=12, status="warning"),
            SystemMetric(name="Storage", value=85, unit="%", change=8, status="critical"),
            SystemMetric(name="Active Users", value=156, unit="", change=23, status="good"),
            SystemMetric(name="Total Files", value=1247, unit="", change=15, status="good"),  # NUEVO
            SystemMetric(name="API Calls", value=1250, unit="/min", change=45, status="warning"),
            SystemMetric(name="Error Rate", value=2.1, unit="%", change=-1.2, status="good"),
        ]

@app.get("/api/admin/security")
async def get_security_status(current_user: dict = Depends(require_admin)):
    """Obtener estado de seguridad"""
    return {
        "status": SecurityStatus(
            firewall="active",
            ssl="valid",
            twoFA="partial",
            lastScan="2 hours ago"
        ),
        "threats": [
            ThreatAlert(
                id="1",
                type="Brute Force Attempt",
                severity="high",
                message="5 failed login attempts detected",
                timestamp=(datetime.now() - timedelta(minutes=15)).isoformat(),
                ip="192.168.1.100"
            ),
            ThreatAlert(
                id="2",
                type="Suspicious File Upload",  # NUEVO
                severity="medium",
                message="Unusual file type uploaded: .exe",
                timestamp=(datetime.now() - timedelta(minutes=45)).isoformat()
            ),
            ThreatAlert(
                id="3",
                type="Port Scan",
                severity="low",
                message="Port scanning activity from external IP",
                timestamp=(datetime.now() - timedelta(hours=3)).isoformat(),
                ip="203.0.113.45"
            )
        ]
    }

@app.post("/api/admin/users/{user_id}/toggle")
async def toggle_user_status(
    user_id: str,
    current_user: dict = Depends(require_admin)
):
    """Cambiar estado de usuario"""
    user = next((u for u in users_db if u.id == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cambiar estado
    if user.status == "active":
        user.status = "inactive"
    elif user.status == "inactive":
        user.status = "active"
    else:  # banned
        user.status = "active"
    
    return {"status": "success", "message": f"User {user.username} status changed to {user.status}"}

@app.delete("/api/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_admin)
):
    """Eliminar usuario"""
    global users_db
    initial_count = len(users_db)
    users_db = [u for u in users_db if u.id != user_id]
    
    if len(users_db) < initial_count:
        return {"status": "success", "message": "User deleted"}
    else:
        raise HTTPException(status_code=404, detail="User not found")

# ====== ENDPOINTS SEARCH ======

@app.get("/api/search")
async def search_data(
    q: str = Query(..., min_length=1), 
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Búsqueda avanzada"""
    results = generate_search_results(q)
    
    if type and type != "all":
        results = [r for r in results if r.type == type]
    
    return {
        "query": q,
        "total": len(results),
        "results": results,
        "stats": {
            "totalRecords": 12500000,
            "uniqueEmails": 342000,
            "passwords": 89000,
            "newToday": 1200
        }
    }

# ====== ENDPOINTS SETTINGS ======

@app.get("/api/settings")
async def get_settings(current_user: dict = Depends(get_current_active_user)):
    """Obtener configuración"""
    return {
        "theme": "dark",
        "notifications": True,
        "shortcuts": {
            "toggle-theme": "Ctrl+T",
            "open-search": "Ctrl+K"
        },
        "system": {
            "autoBackup": True,
            "logLevel": "info",
            "maxLogSize": "100MB"
        },
        "files": {  # NUEVO - Configuración de archivos
            "maxFileSize": f"{getattr(settings, 'MAX_FILE_SIZE', 100)}MB",
            "allowedExtensions": getattr(settings, 'ALLOWED_EXTENSIONS', []),
            "autoThumbnails": True,
            "enableVersioning": True
        }
    }

@app.put("/api/settings")
async def update_settings(
    settings_data: Dict[str, Any],
    current_user: dict = Depends(get_current_active_user)
):
    """Actualizar configuración"""
    return {"status": "success", "message": "Settings updated", "settings": settings_data}

# ====== ENDPOINTS TEMPORALES ======

@app.get("/api/notes", response_model=List[Note])
async def get_notes():
    return notes_db

@app.post("/api/notes", response_model=Note)
async def create_note(note: Note):
    notes_db.append(note)
    return note

@app.post("/api/ai/ask")
async def ask_ai(req: AIRequest):
    return {
        "response": f"Respuesta simulada para: '{req.prompt}'"
    }

# ====== INFORMACIÓN ADICIONAL ======

@app.get("/api/system/info")
async def get_system_info(current_user: dict = Depends(get_current_active_user)):
    """Información del sistema"""
    upload_dir = Path(getattr(settings, 'UPLOAD_DIR', './uploads'))
    thumbnail_dir = Path(getattr(settings, 'THUMBNAIL_DIR', './thumbnails'))
    
    return {
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "features": {
            "authentication": True,
            "file_management": True,
            "search": True,
            "admin_panel": True,
            "dashboard": True
        },
        "storage": {
            "upload_dir": str(upload_dir.absolute()),
            "thumbnail_dir": str(thumbnail_dir.absolute()),
            "max_file_size": getattr(settings, 'MAX_FILE_SIZE', 100),
            "allowed_extensions": getattr(settings, 'ALLOWED_EXTENSIONS', [])
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning"
    )