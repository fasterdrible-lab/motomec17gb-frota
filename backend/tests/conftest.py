"""pytest configuration — sets a SQLite test database before any app modules load."""
import os

# Must be set before app.config is imported
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
