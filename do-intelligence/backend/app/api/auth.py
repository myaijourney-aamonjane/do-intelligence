from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from ..core.db import get_db
from ..core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
)
from ..models.User import User, Role

router = APIRouter(prefix="/v1/auth", tags=["authentication"])


# Schemas
class UserRegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="E-mail corporativo do utilizador")
    password: str = Field(..., min_length=6, description="Senha de acesso")
    full_name: Optional[str] = Field(None, description="Nome completo")


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="E-mail cadastrado")
    password: str = Field(..., description="Senha de acesso")


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: Optional[str] = None
    roles: List[str] = []


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    is_active: bool
    is_superuser: bool
    roles: List[str] = []
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/register", response_model=UserResponse, status_code=210)
@router.post("/signup", response_model=UserResponse, status_code=201)
async def register_user(
    data: UserRegisterRequest,
    db: Session = Depends(get_db),
):
    """Regista um novo utilizador no sistema."""
    existing_user = db.query(User).filter(User.email == data.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está registado na plataforma.",
        )

    # Obter perfil padrão 'user' ou 'underwriter' se existir
    user_role = db.query(Role).filter(Role.name == "underwriter").first()
    if not user_role:
        user_role = db.query(Role).filter(Role.name == "user").first()

    user = User(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        is_active=True,
        is_superuser=False,
        roles=[user_role] if user_role else [],
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        roles=[r.name for r in user.roles],
        created_at=user.created_at,
        last_login=user.last_login,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    data: Optional[UserLoginRequest] = None,
    form_data: Optional[OAuth2PasswordRequestForm] = Depends(OAuth2PasswordRequestForm),
    db: Session = Depends(get_db),
):
    """
    Autentica um utilizador via JSON ou formulário OAuth2 e devolve os tokens JWT.
    """
    email = None
    password = None

    if data:
        email = data.email
        password = data.password
    elif form_data:
        email = form_data.username
        password = form_data.password

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail e senha são obrigatórios.",
        )

    user = db.query(User).filter(User.email == email.lower()).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais incorretas (e-mail ou senha inválidos).",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta de utilizador desativada.",
        )

    # Atualizar last_login
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    roles_list = [r.name for r in user.roles]
    token_data = {"sub": str(user.id), "email": user.email, "roles": roles_list}

    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        roles=roles_list,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Retorna o perfil e os papéis (roles) do utilizador autenticado."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_superuser=current_user.is_superuser,
        roles=[r.name for r in current_user.roles],
        created_at=current_user.created_at,
        last_login=current_user.last_login,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
    data: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    """Renova o token de acesso utilizando um refresh token válido."""
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido ou expirado.",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilizador não encontrado ou inativo.",
        )

    roles_list = [r.name for r in user.roles]
    token_data = {"sub": str(user.id), "email": user.email, "roles": roles_list}

    new_access_token = create_access_token(data=token_data)
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        roles=roles_list,
    )
