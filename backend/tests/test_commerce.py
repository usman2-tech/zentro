import pytest
import uuid
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


@pytest.fixture(scope="module")
def second_user_headers(client: TestClient):
    unique_email = f"second_user_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = client.post(
        "/api/v1/auth/register",
        json={"name": "Second User", "email": unique_email, "password": "Password123!"},
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# 1. Cart Tests
# ==============================================================================

def test_get_cart_authenticated(client: TestClient, demo_auth_headers):
    response = client.get("/api/v1/cart", headers=demo_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "subtotal" in data
    assert "item_count" in data


def test_add_and_update_cart_item(client: TestClient, second_user_headers):
    # Get a valid product ID
    prods_res = client.get("/api/v1/products?limit=1")
    product = prods_res.json()["items"][0]
    product_id = product["id"]

    # 1. Add item to cart
    add_res = client.post(
        "/api/v1/cart/items",
        headers=second_user_headers,
        json={"product_id": product_id, "quantity": 2},
    )
    assert add_res.status_code == 201
    cart = add_res.json()
    assert cart["item_count"] == 2
    assert len(cart["items"]) == 1
    item_id = cart["items"][0]["id"]

    # 2. Update quantity
    update_res = client.patch(
        f"/api/v1/cart/items/{item_id}",
        headers=second_user_headers,
        json={"quantity": 3},
    )
    assert update_res.status_code == 200
    assert update_res.json()["item_count"] == 3

    # 3. Remove item
    del_res = client.delete(f"/api/v1/cart/items/{item_id}", headers=second_user_headers)
    assert del_res.status_code == 200
    assert del_res.json()["item_count"] == 0


def test_cannot_modify_other_user_cart(client: TestClient, demo_auth_headers, second_user_headers):
    # Second user adds an item
    prods = client.get("/api/v1/products?limit=1").json()["items"]
    add_res = client.post(
        "/api/v1/cart/items",
        headers=second_user_headers,
        json={"product_id": prods[0]["id"], "quantity": 1},
    )
    item_id = add_res.json()["items"][0]["id"]

    # Demo user attempts to delete second user's cart item -> 403 Forbidden
    hack_res = client.delete(f"/api/v1/cart/items/{item_id}", headers=demo_auth_headers)
    assert hack_res.status_code == 403


# ==============================================================================
# 2. Wishlist Tests
# ==============================================================================

def test_wishlist_lifecycle(client: TestClient, second_user_headers):
    prods = client.get("/api/v1/products?limit=2").json()["items"]
    p1_id = prods[0]["id"]

    # Add to wishlist
    add_res = client.post(f"/api/v1/wishlist/{p1_id}", headers=second_user_headers)
    assert add_res.status_code == 201
    assert add_res.json()["product_id"] == p1_id

    # View wishlist
    list_res = client.get("/api/v1/wishlist", headers=second_user_headers)
    assert list_res.status_code == 200
    wishlist = list_res.json()
    assert any(w["product_id"] == p1_id for w in wishlist)

    # Remove from wishlist
    del_res = client.delete(f"/api/v1/wishlist/{p1_id}", headers=second_user_headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True


# ==============================================================================
# 3. Checkout and Orders Tests
# ==============================================================================

def test_checkout_empty_cart_fails(client: TestClient):
    unique_email = f"empty_cart_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = client.post(
        "/api/v1/auth/register",
        json={"name": "Empty Cart User", "email": unique_email, "password": "Password123!"},
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "shipping_name": "Test User",
        "shipping_address": "123 Test St",
        "shipping_city": "Austin",
        "shipping_country": "United States",
        "shipping_postal_code": "78701",
    }
    response = client.post("/api/v1/checkout", headers=headers, json=payload)
    assert response.status_code == 400
    assert "cart is empty" in response.json()["error"]["message"].lower()


def test_successful_checkout_flow(client: TestClient):
    unique_email = f"buyer_{uuid.uuid4().hex[:8]}@example.com"
    reg_res = client.post(
        "/api/v1/auth/register",
        json={"name": "Buyer User", "email": unique_email, "password": "Password123!"},
    )
    token = reg_res.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {token}"}

    prods = client.get("/api/v1/products?limit=2").json()["items"]
    p1 = prods[0]

    # Add product to cart
    add_res = client.post(
        "/api/v1/cart/items",
        headers=buyer_headers,
        json={"product_id": p1["id"], "quantity": 1},
    )
    assert add_res.status_code == 201

    # Perform checkout
    checkout_payload = {
        "shipping_name": "Buyer User",
        "shipping_address": "789 Redwood Blvd",
        "shipping_city": "Seattle",
        "shipping_country": "United States",
        "shipping_postal_code": "98101",
        "payment_method": "simulated_card",
    }
    order_res = client.post("/api/v1/checkout", headers=buyer_headers, json=checkout_payload)
    assert order_res.status_code == 201
    order = order_res.json()

    assert order["order_number"].startswith("ZN-2026-")
    assert order["status"] == "confirmed"
    assert order["subtotal"] == p1["price"]
    assert len(order["items"]) == 1
    assert order["items"][0]["product_name_snapshot"] == p1["name"]

    # Verify cart is now empty
    cart_after = client.get("/api/v1/cart", headers=buyer_headers).json()
    assert cart_after["item_count"] == 0

    # Verify order appears in order history
    history_res = client.get("/api/v1/orders", headers=buyer_headers)
    assert history_res.status_code == 200
    history = history_res.json()
    assert any(o["order_number"] == order["order_number"] for o in history)

    # Verify order detail
    detail_res = client.get(f"/api/v1/orders/{order['order_number']}", headers=buyer_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["order_number"] == order["order_number"]


def test_order_authorization_isolation(client: TestClient, demo_auth_headers, second_user_headers):
    # Fetch demo user's order number
    demo_orders = client.get("/api/v1/orders", headers=demo_auth_headers).json()
    assert len(demo_orders) > 0
    demo_order_num = demo_orders[0]["order_number"]

    # Second user attempts to access demo user's order -> 403 Forbidden
    hack_res = client.get(f"/api/v1/orders/{demo_order_num}", headers=second_user_headers)
    assert hack_res.status_code == 403
