from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from passlib.context import CryptContext
from app.database import get_db
from app.models.usuarios import Usuario
from app.schemas.usuario_schema import UsuarioCreate, UsuarioUpdate, UsuarioResponse

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/", response_model=List[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()

@router.post("/", response_model=UsuarioResponse, status_code=201)
def criar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    existing = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    hashed = pwd_context.hash(usuario.password)
    data = usuario.model_dump(exclude={"password"})
    db_usuario = Usuario(**data, senha_hash=hashed)
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

@router.put("/{usuario_id}", response_model=UsuarioResponse)
def atualizar_usuario(usuario_id: int, usuario: UsuarioUpdate, db: Session = Depends(get_db)):
    db_usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    update_data = usuario.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_usuario, field, value)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario
