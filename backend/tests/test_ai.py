import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def demo_auth_headers(client: TestClient):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "alex.rivera@example.com", "password": "ZentroDemo2026!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# 1. Semantic Search Tests
# ==============================================================================

def test_semantic_search_with_budget(client: TestClient):
    payload = {
        "query": "I need wireless headphones under $150 for working out",
        "limit": 5,
    }
    response = client.post("/api/v1/ai/search", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert len(data["products"]) > 0
    # Every returned product must satisfy the budget constraint
    for p in data["products"]:
        assert p["price"] <= 150.0

    # Verify match reasons exist
    assert len(data["match_reasons"]) > 0
    for p in data["products"]:
        assert str(p["id"]) in data["match_reasons"]


def test_semantic_search_workspace(client: TestClient):
    payload = {
        "query": "minimalist wooden desk for home office ergonomics",
        "limit": 4,
    }
    response = client.post("/api/v1/ai/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["products"]) > 0
    # Check that office or ergonomic products are prioritized
    names = [p["name"].lower() for p in data["products"]]
    assert any("desk" in n or "chair" in n or "stand" in n for n in names)


def test_semantic_search_empty_when_no_match(client: TestClient):
    # Impossible budget constraint
    payload = {
        "query": "titanium backpacking tent under $15",
        "limit": 5,
    }
    response = client.post("/api/v1/ai/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["products"]) == 0
    assert "no products" in data["explanation"].lower()


# ==============================================================================
# 2. AI Shopping Assistant Tests
# ==============================================================================

def test_shopping_assistant_grounded_response(client: TestClient):
    payload = {
        "query": "I want gym workout headphones but don't want to spend more than $150",
        "history": [],
    }
    response = client.post("/api/v1/ai/assistant", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "message" in data
    assert len(data["message"]) > 20
    assert len(data["products"]) > 0
    # All recommended products are grounded database items under $150
    for p in data["products"]:
        assert p["price"] <= 150.0

    assert len(data["match_reasons"]) > 0
    assert len(data["suggested_followups"]) > 0


# ==============================================================================
# 3. Recommendations Tests
# ==============================================================================

def test_guest_recommendations(client: TestClient):
    response = client.get("/api/v1/recommendations?limit=6")
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 6
    for itm in data["items"]:
        assert "product" in itm
        assert "reason" in itm
        assert len(itm["reason"]) > 5


def test_personalized_recommendations_with_user_signals(client: TestClient, demo_auth_headers):
    response = client.get("/api/v1/recommendations?limit=6", headers=demo_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) > 0
    assert data["strategy"] in ["personalized_signals", "curated_trending"]
    for itm in data["items"]:
        assert "product" in itm
        assert "reason" in itm
