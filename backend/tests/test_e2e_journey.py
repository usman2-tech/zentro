import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_complete_end_to_end_customer_journey(client: TestClient):
    """
    Complete end-to-end customer lifecycle audit:
    Register -> Login -> Browse Categories -> Search Products -> AI Semantic Search ->
    AI Assistant -> Add to Wishlist -> Add to Cart -> Simulated Checkout ->
    Order Confirmation -> Cart Cleared -> Order History & Detail Verification
    """
    unique_id = uuid.uuid4().hex[:8]
    user_email = f"journey_tester_{unique_id}@example.com"
    user_password = "SecurePassword2026!"
    user_name = "Elena Rostova"

    # 1. Customer Registration
    reg_res = client.post(
        "/api/v1/auth/register",
        json={"name": user_name, "email": user_email, "password": user_password},
    )
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    token = reg_data["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 2. Login Verification
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": user_email, "password": user_password},
    )
    assert login_res.status_code == 200
    assert login_res.json()["user"]["email"] == user_email.lower()

    # 3. Profile Fetch
    me_res = client.get("/api/v1/users/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["name"] == user_name

    # 4. Browse Categories
    cats_res = client.get("/api/v1/categories")
    assert cats_res.status_code == 200
    categories = cats_res.json()
    assert len(categories) >= 8
    target_category = next(c for c in categories if c["slug"] == "audio-wearables")
    assert target_category["product_count"] > 0

    # 5. Product Discovery with Filtering & Sorting
    prods_res = client.get(
        f"/api/v1/products?category={target_category['slug']}&sort_by=price_asc&limit=6"
    )
    assert prods_res.status_code == 200
    catalog = prods_res.json()
    assert catalog["total"] > 0
    chosen_product = catalog["items"][0]
    product_id = chosen_product["id"]
    product_slug = chosen_product["slug"]

    # 6. View Product Details
    detail_res = client.get(f"/api/v1/products/{product_slug}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["name"] == chosen_product["name"]
    assert "related_products" in detail

    # 7. AI Semantic Vector Search
    ai_search_res = client.post(
        "/api/v1/ai/search",
        json={"query": "noise canceling headphones under $200", "limit": 4},
    )
    assert ai_search_res.status_code == 200
    ai_search_data = ai_search_res.json()
    assert len(ai_search_data["products"]) > 0
    for p in ai_search_data["products"]:
        assert p["price"] <= 200.0

    # 8. AI Shopping Assistant Guidance
    ai_chat_res = client.post(
        "/api/v1/ai/assistant",
        json={
            "query": "Recommend comfortable audio gear for daily workouts under $150",
            "history": [],
        },
    )
    assert ai_chat_res.status_code == 200
    chat_data = ai_chat_res.json()
    assert len(chat_data["products"]) > 0
    assert len(chat_data["message"]) > 20

    # 9. Add Product to Wishlist
    wish_res = client.post(f"/api/v1/wishlist/{product_id}", headers=auth_headers)
    assert wish_res.status_code == 201

    wishlist_list_res = client.get("/api/v1/wishlist", headers=auth_headers)
    assert wishlist_list_res.status_code == 200
    assert any(item["product_id"] == product_id for item in wishlist_list_res.json())

    # 10. Personalized Recommendations Check
    rec_res = client.get("/api/v1/recommendations?limit=6", headers=auth_headers)
    assert rec_res.status_code == 200
    assert len(rec_res.json()["items"]) > 0

    # 11. Add to Shopping Cart
    add_cart_res = client.post(
        "/api/v1/cart/items",
        headers=auth_headers,
        json={"product_id": product_id, "quantity": 2},
    )
    assert add_cart_res.status_code == 201
    cart = add_cart_res.json()
    assert cart["item_count"] == 2
    assert cart["subtotal"] == round(chosen_product["price"] * 2, 2)

    # 12. Complete Simulated Checkout
    checkout_payload = {
        "shipping_name": user_name,
        "shipping_address": "456 Market St, Suite 200",
        "shipping_city": "San Francisco",
        "shipping_country": "United States",
        "shipping_postal_code": "94105",
        "payment_method": "simulated_card",
    }
    order_res = client.post("/api/v1/checkout", headers=auth_headers, json=checkout_payload)
    assert order_res.status_code == 201
    order = order_res.json()
    order_number = order["order_number"]

    assert order_number.startswith("ZN-2026-")
    assert order["status"] == "confirmed"
    assert order["subtotal"] == round(chosen_product["price"] * 2, 2)
    assert len(order["items"]) == 1
    assert order["items"][0]["quantity"] == 2

    # 13. Verify Cart is Empty
    cart_after = client.get("/api/v1/cart", headers=auth_headers).json()
    assert cart_after["item_count"] == 0
    assert len(cart_after["items"]) == 0

    # 14. Verify Order in Order History
    history_res = client.get("/api/v1/orders", headers=auth_headers)
    assert history_res.status_code == 200
    orders_list = history_res.json()
    assert any(o["order_number"] == order_number for o in orders_list)

    # 15. Verify Order Detail Retrieval & Strict Isolation
    detail_res = client.get(f"/api/v1/orders/{order_number}", headers=auth_headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["shipping_city"] == "San Francisco"

    # Isolation check: unauthorized guest cannot view this order
    anon_res = client.get(f"/api/v1/orders/{order_number}")
    assert anon_res.status_code == 401
