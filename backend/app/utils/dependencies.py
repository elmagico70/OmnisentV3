from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User, UserRole

# Configuración del esquema Bearer token
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> dict:
    """
    Obtiene el usuario actual basándose en el JWT token
    """
    token = credentials.credentials
    token_data = verify_token(token)
    
    # TODO: Reemplazar con consulta real a base de datos cuando esté lista
    # user = db.query(User).filter(User.id == token_data["user_id"]).first()
    # if not user or not user.is_active:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Usuario no encontrado o inactivo"
    #     )
    # return user
    
    # Por ahora, devolver datos mock basados en el token
    if token_data["user_id"] == "1":
        return {
            "id": "1",
            "username": "admin",
            "email": "admin@omnisent.com",
            "role": "admin",
            "is_active": True
        }
    elif token_data["user_id"] == "2":
        return {
            "id": "2",
            "username": "user", 
            "email": "user@omnisent.com",
            "role": "user",
            "is_active": True
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )

async def get_current_active_user(
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Verifica que el usuario actual esté activo
    """
    if not current_user.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    return current_user

def create_role_checker(required_role: str):
    """
    Factory para crear dependencias que requieren roles específicos
    """
    async def role_checker(current_user: dict = Depends(get_current_active_user)) -> dict:
        user_role = current_user.get("role")
        
        # Admin tiene acceso a todo
        if user_role == "admin":
            return current_user
            
        # Verificar rol específico
        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Se requiere rol: {required_role}"
            )
        return current_user
    
    return role_checker

# Dependencias específicas para roles comunes
require_admin = create_role_checker("admin")
require_user = create_role_checker("user")

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[dict]:
    """
    Obtiene el usuario actual si hay token, sino devuelve None
    Útil para endpoints que pueden funcionar con o sin autenticación
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None