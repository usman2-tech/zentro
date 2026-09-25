import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


# ==============================================================================
# 1. Categories Tests
# ==============================================================================

def test_get_categories(client: TestClient):
    response = client.get("/api/v1/categories")
    assert response.status_code == 200
    categories = response.json()
    assert len(categories) == 8

    # Verify first category structure
    cat = categories[0]
    assert "id" in cat
    assert "name" in cat
    assert "slug" in cat
    assert "image_url" in cat
    assert "icon_name" in cat
    assert "product_count" in cat
    assert cat["product_count"] > 0


# ==============================================================================
# 2. Product Listing, Filtering & Sorting Tests
# ==============================================================================

def test_get_products_pagination(client: TestClient):
    response = client.get("/api/v1/products?page=1&limit=12")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["limit"] == 12
    assert data["total"] == 56
    assert data["total_pages"] == 5
    assert len(data["items"]) == 12


def test_filter_products_by_category(client: TestClient):
    response = client.get("/api/v1/products?category=audio-wearables")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    for p in data["items"]:
        assert p["category"]["slug"] == "audio-wearables"


def test_filter_products_by_business(client: TestClient):
    response = client.get("/api/v1/products?business=nordic-ergonomics")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    for p in data["items"]:
        assert p["business"]["slug"] == "nordic-ergonomics"


def test_filter_products_by_price_range(client: TestClient):
    response = client.get("/api/v1/products?min_price=50&max_price=150")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    for p in data["items"]:
        assert 50 <= p["price"] <= 150


def test_sort_products_price_asc(client: TestClient):
    response = client.get("/api/v1/products?sort_by=price_asc&limit=20")
    assert response.status_code == 200
    items = response.json()["items"]
    prices = [p["price"] for p in items]
    assert prices == sorted(prices)


def test_sort_products_price_desc(client: TestClient):
    response = client.get("/api/v1/products?sort_by=price_desc&limit=20")
    assert response.status_code == 200
    items = response.json()["items"]
    prices = [p["price"] for p in items]
    assert prices == sorted(prices, reverse=True)


# ==============================================================================
# 3. Product Details Tests
# ==============================================================================

def test_get_product_detail_by_slug(client: TestClient):
    response = client.get("/api/v1/products/aura-flow-anc-wireless-headphones")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Aura Flow ANC Wireless Headphones"
    assert data["price"] == 149.0
    assert data["business"]["slug"] == "aura-acoustics"
    assert data["category"]["slug"] == "audio-wearables"
    assert "related_products" in data
    assert len(data["related_products"]) > 0


def test_get_product_detail_not_found(client: TestClient):
    response = client.get("/api/v1/products/non-existent-product-xyz")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "NOT_FOUND"


# ==============================================================================
# 4. Businesses Tests
# ==============================================================================

def test_list_businesses(client: TestClient):
    response = client.get("/api/v1/businesses")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 10
    assert len(data["items"]) == 10
    for b in data["items"]:
        assert b["product_count"] > 0


def test_get_business_detail(client: TestClient):
    response = client.get("/api/v1/businesses/aura-acoustics")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Aura Acoustics"
    assert len(data["products"]) > 0
    assert len(data["posts"]) > 0


def test_get_business_not_found(client: TestClient):
    response = client.get("/api/v1/businesses/non-existent-merchant")
    assert response.status_code == 404


# ==============================================================================
# 5. Newsfeed Tests
# ==============================================================================

def test_get_feed_posts(client: TestClient):
    response = client.get("/api/v1/feed")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 16
    assert len(data["items"]) == 16


def test_get_feed_filter_type(client: TestClient):
    response = client.get("/api/v1/feed?type=product_launch")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    for p in data["items"]:
        assert p["type"] == "product_launch"


# ==============================================================================
# 6. Unified Search Tests
# ==============================================================================

def test_unified_search(client: TestClient):
    response = client.get("/api/v1/search?q=headphones")
    assert response.status_code == 200
    data = response.json()
    assert len(data["products"]) > 0
    assert any("headphone" in p["name"].lower() for p in data["products"])
