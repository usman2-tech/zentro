import pytest
import uuid
from datetime import timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.core.security import create_access_token


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


# ==============================================================================
# 1. Registration Tests
# ==============================================================================

def test_register_success(client: TestClient):
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "name": "Jordan Lee",
        "email": unique_email,
        "password": "SecurePassword123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    user = data["user"]
    assert user["name"] == "Jordan Lee"
    assert user["email"] == unique_email.lower()
    assert user["is_active"] is True
    assert "id" in user
    assert "password" not in user
    assert "password_hash" not in user


def test_register_duplicate_email(client: TestClient):
    email = f"duplicate_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "name": "First User",
        "email": email,
        "password": "SecurePassword123!",
    }
    # First registration
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Second registration with same email
    res2 = client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409
    data = res2.json()
    assert data["error"]["code"] == "CONFLICT"
    assert "already exists" in data["error"]["message"].lower()


def test_register_invalid_email(client: TestClient):
    payload = {
        "name": "Invalid Email User",
        "email": "not-an-email",
        "password": "SecurePassword123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_register_short_password(client: TestClient):
    payload = {
        "name": "Short Pass User",
        "email": f"short_{uuid.uuid4().hex[:8]}@example.com",
        "password": "short",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


# ==============================================================================
# 2. Login Tests
# ==============================================================================

def test_login_demo_user(client: TestClient):
    payload = {
        "email": "alex.rivera@example.com",
        "password": "ZentroDemo2026!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alex.rivera@example.com"
    assert data["user"]["name"] == "Alex Rivera"


def test_login_case_insensitive_email(client: TestClient):
    payload = {
        "email": "ALEX.RIVERA@EXAMPLE.COM",
        "password": "ZentroDemo2026!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "alex.rivera@example.com"


def test_login_wrong_password(client: TestClient):
    payload = {
        "email": "alex.rivera@example.com",
        "password": "WrongPassword123!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    assert "incorrect email or password" in data["error"]["message"].lower()


def test_login_nonexistent_user(client: TestClient):
    payload = {
        "email": "nonexistent_person_99@example.com",
        "password": "SomePassword123!",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"
    # Same message prevents user enumeration
    assert "incorrect email or password" in data["error"]["message"].lower()


# ==============================================================================
# 3. Authenticated User Profile Tests (/users/me)
# ==============================================================================

def test_get_profile_success(client: TestClient):
    # Log in first
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "alex.rivera@example.com", "password": "ZentroDemo2026!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Request profile with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "alex.rivera@example.com"
    assert data["name"] == "Alex Rivera"
    assert data["is_active"] is True
    assert "id" in data


def test_get_profile_missing_token(client: TestClient):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_get_profile_invalid_token(client: TestClient):
    headers = {"Authorization": "Bearer invalid.token.value"}
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"


def test_get_profile_expired_token(client: TestClient):
    # Create an intentionally expired token (-10 minutes)
    expired_token = create_access_token(
        subject="a1000000-0000-0000-0000-000000000001",
        expires_delta=timedelta(minutes=-10),
    )
    headers = {"Authorization": f"Bearer {expired_token}"}
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 401
    data = response.json()
    assert data["error"]["code"] == "UNAUTHORIZED"


# ==============================================================================
# 4. Root Path Aliases & Cart Integration Tests
# ==============================================================================

def test_root_path_aliases(client: TestClient):
    # Test root /auth/login alias
    login_res = client.post(
        "/auth/login",
        json={"email": "alex.rivera@example.com", "password": "ZentroDemo2026!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Test root /users/me alias
    me_res = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "alex.rivera@example.com"


def test_registration_creates_user_cart(client: TestClient):
    unique_email = f"cart_test_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "name": "Cart Owner",
        "email": unique_email,
        "password": "SecurePassword123!",
    }
    reg_res = client.post("/api/v1/auth/register", json=payload)
    assert reg_res.status_code == 201
    user_id = reg_res.json()["user"]["id"]

    # Verify cart was initialized for this user directly in DB
    import asyncio
    from app.db.session import async_session_factory
    from sqlalchemy import select
    from app.models.cart import Cart

    async def check_cart():
        async with async_session_factory() as session:
            stmt = select(Cart).where(Cart.user_id == uuid.UUID(user_id))
            result = await session.execute(stmt)
            return result.scalar_one_or_none()

    cart = asyncio.run(check_cart())
    assert cart is not None
    assert str(cart.user_id) == user_id

