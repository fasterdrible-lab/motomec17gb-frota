from app.database import engine, Base, get_db
from app.models.usuarios import Usuario
from passlib.context import CryptContext
Base.metadata.create_all(bind=engine())
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
password_hash = pwd_context.hash("admin123")
db = next(get_db())
try:
    usuario = Usuario(nome="Admin", email="admin@bombeiros.gov.br", senha_hash=password_hash, cargo="Administrador", unidade="Central", ativo=True)
    db.add(usuario)
    db.commit()
    print("Usuario admin criado com sucesso!")
except Exception as e:
    db.rollback()
    print(f"Erro: {e}")
finally:
    db.close()