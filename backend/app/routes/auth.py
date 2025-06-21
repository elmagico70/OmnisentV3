from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import timedelta
from app.core.database import get_db
from app.core.security import authenticate_user, create_access_token
from app.core.config import settings
from app.utils.dependencies import get_current_active_user, security

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Modelos Pydantic para requests/responses
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    status: str
    access_token: str
    token_type: str
    expires_in: int
    user: dict

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Endpoint de autenticación que devuelve JWT token
    """
    # Autenticar usuario
    user = authenticate_user(login_data.username, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear token de acceso
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"], "role": user["role"], "username": user["username"]},
        expires_delta=access_token_expires
    )
    
    # TODO: Actualizar last_login en base de datos
    # user_record = db.query(User).filter(User.id == user["id"]).first()
    # if user_record:
    #     user_record.last_login = datetime.utcnow()
    #     user_record.login_count = str(int(user_record.login_count) + 1)
    #     db.commit()
    
    return LoginResponse(
        status="success",
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # En segundos
        user={
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"]
        }
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Endpoint para renovar token de acceso
    """
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user["id"], "role": current_user["role"], "username": current_user["username"]},
        expires_delta=access_token_expires
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.get("/me")
async def get_current_user_info(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Obtiene información del usuario actual
    """
    return {
        "user": {
            "id": current_user["id"],
            "username": current_user["username"],
            "email": current_user["email"],
            "role": current_user["role"],
            "is_active": current_user["is_active"]
        }
    }

@router.post("/logout")
async def logout(
    current_user: dict = Depends(get_current_active_user)
):
    """
    Endpoint de logout (en JWT stateless, el logout se maneja en el frontend)
    """
    # En un sistema JWT stateless, el logout se maneja eliminando el token del cliente
    # Opcionalmente, se puede implementar una blacklist de tokens
    return {"message": "Logout exitoso", "status": "success"}