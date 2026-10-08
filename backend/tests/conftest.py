import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import engine
from app.models.user import User
from app.core.security import create_access_token

@pytest.fixture(scope="session")
def client():
    return TestClient(app)

@pytest.fixture(scope="session")
def admin_user():
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    user = session.query(User).filter(User.email == "admin@demo.org").first()
    if not user:
        user = session.query(User).filter(User.role == "Admin").first()
    session.close()
    return user

@pytest.fixture(scope="session")
def citizen_user():
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    user = session.query(User).filter(User.email == "citizen@demo.org").first()
    if not user:
        user = session.query(User).filter(User.role == "Citizen").first()
    session.close()
    return user

@pytest.fixture(scope="session")
def worker_user():
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    user = session.query(User).filter(User.email == "worker@demo.org").first()
    if not user:
        user = session.query(User).filter(User.role == "Worker").first()
    session.close()
    return user

@pytest.fixture(scope="session")
def admin_headers(admin_user):
    token = create_access_token(subject=admin_user.id)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="session")
def citizen_headers(citizen_user):
    token = create_access_token(subject=citizen_user.id)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="session")
def worker_headers(worker_user):
    token = create_access_token(subject=worker_user.id)
    return {"Authorization": f"Bearer {token}"}
