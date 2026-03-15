import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models.usuario import Usuario
from passlib.context import CryptContext

print("Criando tabelas no banco de dados...")
Base.metadata.create_all(bind=engine)
print("Tabelas criadas!")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
password_hash = pwd_context.hash("admin123")

db = SessionLocal()

existing = db.query(Usuario).filter(Usuario.email == "admin@bombeiros.gov.br").first()
if existing:
    print("Usuario admin ja existe!")
else:
    usuario = Usuario(
        nome="Admin",
        email="admin@bombeiros.gov.br",
        password_hash=password_hash,
        cargo="Administrador",
        role="admin",
        ativo=True
    )
    db.add(usuario)
    db.commit()
    print("=" * 50)
    print("Usuario admin criado com sucesso!")
    print("Email: admin@bombeiros.gov.br")
    print("Senha: admin123")
    print("=" * 50)

db.close()