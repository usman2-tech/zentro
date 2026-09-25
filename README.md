# Zentro — AI-Enhanced B2C Marketplace

[![Tests](https://img.shields.io/badge/backend%20tests-48%2F48%20passed-emerald?style=for-the-badge&logo=pytest)](https://github.com/usman2-tech/zentro)
[![Docker](https://img.shields.io/badge/docker-PostgreSQL%20%2B%20pgvector-2496ED?style=for-the-badge&logo=docker)](https://github.com/usman2-tech/zentro)
[![Next.js](https://img.shields.io/badge/frontend-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://github.com/usman2-tech/zentro)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI%200.115-009688?style=for-the-badge&logo=fastapi)](https://github.com/usman2-tech/zentro)
[![TypeScript](https://img.shields.io/badge/types-TypeScript%205.6-blue?style=for-the-badge&logo=typescript)](https://github.com/usman2-tech/zentro)
[![Vector Search](https://img.shields.io/badge/vector%20engine-pgvector%20%2B%20NumPy-indigo?style=for-the-badge)](https://github.com/usman2-tech/zentro)

> **Recruiter & Technical Assessment Project**: Zentro is a modern, production-grade B2C digital marketplace connecting discerning buyers with verified independent merchants. It pairs a modular monolith backend (FastAPI, SQLAlchemy 2.0 Async, Alembic) with a Next.js 14 App Router frontend (TypeScript, Tailwind CSS, TanStack Query, Zustand) and integrates a **grounded semantic search and AI shopping assistant** that operates exclusively against actual catalog inventory without hallucinations.

---

## Table of Contents

1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Key Features](#2-key-features)
3. [Grounded AI Architecture](#3-grounded-ai-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Database Architecture & Dual-Engine Strategy](#5-database-architecture--dual-engine-strategy)
6. [System Architecture & Layering](#6-system-architecture--layering)
7. [Repository Structure](#7-repository-structure)
8. [Docker & Containerized Quickstart (PostgreSQL + pgvector)](#8-docker--containerized-quickstart-postgresql--pgvector)
9. [Local Prerequisites & Native Host Setup (SQLite Fallback)](#9-local-prerequisites--native-host-setup-sqlite-fallback)
10. [Environment Variables](#10-environment-variables)
11. [Database Migrations & Seed Data](#11-database-migrations--seed-data)
12. [Running the Application Locally](#12-running-the-application-locally)
13. [Interactive API Documentation (Swagger/OpenAPI)](#13-interactive-api-documentation-swaggeropenapi)
14. [Demo Credentials](#14-demo-credentials)
15. [Automated Testing & Verification Results](#15-automated-testing--verification-results)
16. [Security & Authorization Isolation](#16-security--authorization-isolation)
17. [Known Limitations](#17-known-limitations)
18. [Production Deployment Architecture](#18-production-deployment-architecture)
19. [Future Roadmap](#19-future-roadmap)

---

## 1. Executive Summary & Problem Statement

Conventional e-commerce platforms struggle with two opposing failure modes:
1. **Keyword Over-Filtering**: Strict string searches miss relevant products due to vocabulary mismatch (e.g., searching *"comfortable running headphones under $100"* fails on keywords like *"earbuds"* or fails to parse budget intent).
2. **Generative Hallucination**: Ungrounded LLM chatbots frequently invent non-existent products, misquote live pricing, or recommend out-of-stock items.

**Zentro solves this by coupling dense semantic vector retrieval with strict catalog grounding:**
* Queries are mapped into a 1536-dimensional embedding space.
* Natural-language budget constraints (e.g., `under $150`) are deterministically parsed and enforced.
* The LLM assistant is injected with an exact snapshot of retrieved database products and constrained by strict system instructions to never fabricate items, prices, or technical specifications.
* If external LLM APIs are offline or unconfigured, an internal zero-latency deterministic mock engine takes over seamlessly, ensuring zero service degradation.

---

## 2. Key Features

### 🛒 Marketplace Discovery & Catalog
* **Dynamic Category Hierarchy**: 8 curated departments (Audio & Wearables, Workspace & Tech, Specialty Coffee & Culinary, Fitness & Activewear, Commute & Travel Bags, Smart Living, Expedition Gear, Artisanal Wellness) with real-time product counts.
* **Multi-Attribute Filtering & Sorting**: Filter by category, merchant storefront, price range, minimum rating, and stock status; sort by relevance, price (asc/desc), rating, or newest release.
* **Independent Storefronts**: Dedicated profiles for 10 verified boutique brands, displaying merchant bios, location, ratings, full product collections, and announcement feeds.
* **Merchant Newsfeed**: Social merchant feed broadcasting product launches, seasonal promotions, brand announcements, and craft articles.
* **Unified Keyword Search**: Instant search matching across product titles, descriptions, and merchant studio names.

### 💳 Commerce & Checkout Lifecycle
* **Persistent Authenticated Cart**: Automatically initialized upon account registration. Features item quantity modifiers, subtotal computation, and live stock availability validation.
* **Wishlist Management**: One-click product bookmarking with optimistic UI updates and instant migration into the active shopping cart.
* **Simulated Checkout & Payment**: Address collection, simulated instant payment sandbox, and atomic database transactions.
* **Price Snapshot Immutability**: `OrderItem` captures snapshots of product name, image URL, and unit price at time of purchase, insulating historical order records against future catalog price updates.
* **Inventory Stock Decrementing**: Inventory automatically decrements upon checkout; stock status shifts to `low_stock` ($\le 5$) or `out_of_stock` ($0$) atomically.
* **Order History & Tracking**: Instant order confirmation with dedicated order detail page (`/orders/[orderNumber]`) and complete customer order histories.

---

## 3. Grounded AI Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │          Customer Natural Language Query      │
                    │   "sweatproof gym earbuds under $100"        │
                    └──────────────────────┬───────────────────────┘
                                           │
                     ┌─────────────────────┴─────────────────────┐
                     ▼                                           ▼
      ┌──────────────────────────────┐            ┌──────────────────────────────┐
      │  Regex Constraint Extractor  │            │     Embedding Generator      │
      │  effective_max_price = 100.0 │            │   1536-dim Query Vector      │
      └──────────────┬───────────────┘            └──────────────┬───────────────┘
                     │                                           │
                     └─────────────────────┬─────────────────────┘
                                           │
                                           ▼
                     ┌───────────────────────────────────────────┐
                     │          Vector Similarity Search         │
                     │   PostgreSQL (pgvector <=> distance)      │
                     │    OR Local SQLite + NumPy Cosine Sim     │
                     └─────────────────────┬─────────────────────┘
                                           │ Filter: price <= $100 & stock != 0
                                           │ Filter: cosine_similarity >= 0.25
                                           ▼
                     ┌───────────────────────────────────────────┐
                     │          Retrieved Database Products      │
                     │  - Aura Pulse Pro Sport Earbuds ($89.00)  │
                     │  - Apex Speed Jump Rope ($24.00)          │
                     └─────────────────────┬─────────────────────┘
                                           │
                                           ▼
                     ┌───────────────────────────────────────────┐
                     │     Strict Grounding Context Prompt       │
                     │  "Only recommend products in Context.     │
                     │   Never hallucinate external products."   │
                     └─────────────────────┬─────────────────────┘
                                           │
                                           ▼
                     ┌───────────────────────────────────────────┐
                     │          Zentro AI Concierge Chat         │
                     │  - Explanatory message grounded in specs  │
                     │  - Interactive, clickable Product Cards   │
                     │  - Transparent match reasons & followups  │
                     └───────────────────────────────────────────┘
```

### Key AI Tenets:
1. **Zero Hallucination Guarantee**: The LLM prompt explicitly receives a JSON-like schema of candidate products retrieved from PostgreSQL/SQLite. The model is forbidden from suggesting items outside the context.
2. **Explainable Match Reasons**: Every returned item includes a badge (e.g., *"Fits budget ($89.00) • Top-rated (4.8★) • Crafted by Aura Acoustics"*).
3. **Deterministic Fallback (`MockAIProvider`)**: If no OpenAI API key is supplied, Zentro activates an offline mock provider that generates cluster-based 1536-dimensional vectors and structured conversational advice.

---

## 4. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | 14.2.15 | React server & client components, static/dynamic rendering |
| **Language** | TypeScript | 5.6.3 | End-to-end type safety |
| **Styling** | Tailwind CSS | 3.4.14 | Responsive, custom marketplace design system |
| **Icons** | Lucide React | 0.453.0 | Modern, clean UI iconography |
| **Client State & Cache** | TanStack React Query | 5.59.0 | Server-state caching, background revalidation |
| **Global Client Store** | Zustand | 4.5.5 | Auth session, cart drawer, AI modal state |
| **Backend Framework** | FastAPI | 0.115.0 | Async high-performance REST API |
| **ORM & Database** | SQLAlchemy | 2.0.35 | Async ORM, identity-map management, relation loading |
| **Schema Migrations** | Alembic | 1.13.3 | Version-controlled async database migrations |
| **Data Validation** | Pydantic v2 | 2.9.2 | Fast schema validation, serialization |
| **Security & Crypto** | Passlib & Python-Jose | 1.7.4 / 3.3.0 | Bcrypt hashing (cost 12), JWT encoding/decoding |
| **Vector Engine** | pgvector / NumPy | 0.3.6 / 1.26.4 | 1536-dim cosine similarity vector operations |
| **Web Server** | Uvicorn | 0.31.0 | Lightning-fast ASGI web server |

---

## 5. Database Architecture & Dual-Engine Strategy

Zentro implements a **transparent dual-database abstraction**:
* **Production Database**: PostgreSQL with the native `pgvector` extension (`Vector(1536)`). Uses HNSW / IVFFlat indexes for scalable vector nearest-neighbor queries.
* **Development / Local Fallback**: SQLite via `aiosqlite` with vector embeddings stored as JSON float arrays, queried with accelerated NumPy cosine similarity.

```python
# app/db/base.py — Custom Dual-Dialect Vector TypeDecorator
class VectorType(TypeDecorator):
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from pgvector.sqlalchemy import Vector
            return dialect.type_descriptor(Vector(self.dim))
        return dialect.type_descriptor(JSON())
```

### Relational Schema (10 Tables)
* `users` — UUID PK, email, bcrypt password hash, active status.
* `businesses` — Merchant profiles, brand slug, logos, banners, category, ratings, location.
* `categories` — Marketplace taxonomy, slugs, icon names, images.
* `products` — Prices, descriptions, stock quantities, status, 1536-dim embedding vector.
* `carts` & `cart_items` — Active shopping carts with unique constraints on `(cart_id, product_id)`.
* `orders` & `order_items` — Completed purchases with price/image snapshot immutability.
* `feed_posts` — Merchant announcements, product launches, promotions, and articles.
* `wishlists` — Saved customer bookmarks with composite PK `(user_id, product_id)`.
* `user_events` — Telemetry signal events for recommendation tuning.

---

## 6. System Architecture & Layering

The backend enforces a clean **Router $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Database** separation of concerns:

```
FastAPI Routers (HTTP, Query Params, Status Codes)
       │
       ▼
Service Layer (Business Logic, Stock Checks, Grounding Prompts, Security Rules)
       │
       ▼
Repository Layer (SQLAlchemy 2.0 Selects, Eager selectinload, Pagination)
       │
       ▼
Database Engine (PostgreSQL + pgvector / SQLite + NumPy)
```

---

## 7. Repository Structure

```text
zentro/
├── .dockerignore                # Root docker ignore rules
├── .env.example                 # Root Docker & environment configuration template
├── .gitignore                   # Safe exclusions (.env, node_modules, *.db, *.tsbuildinfo)
├── docker-compose.yml           # Root Docker Compose (frontend, backend, PostgreSQL + pgvector)
├── README.md                    # Project documentation
│
├── docker/                      # Container initialization scripts
│   └── postgres/
│       └── init-pgvector.sql    # Automatically creates 'vector' extension on first boot
│
├── backend/                     # FastAPI Backend Application
│   ├── .dockerignore            # Backend-specific container ignore
│   ├── .env.example             # Safe placeholder environment template
│   ├── Dockerfile               # Production Python 3.11-slim container with healthchecks
│   ├── docker-entrypoint.sh     # TCP database readiness wait, Alembic migrations & auto-seed
│   ├── alembic.ini              # Database migration configuration
│   ├── requirements.txt         # Pinned Python dependencies
│   ├── alembic/                 # Async Alembic migrations
│   │   ├── env.py               # Async migration runner (enables pgvector)
│   │   └── versions/            # Versioned migration scripts
│   ├── app/
│   │   ├── main.py              # Application entrypoint, CORS, lifespan, exception handlers
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic v2 BaseSettings
│   │   │   ├── security.py      # Bcrypt & JWT encoding/decoding
│   │   │   ├── deps.py          # FastAPI Depends() providers
│   │   │   └── exceptions.py    # Custom domain exceptions & handlers
│   │   ├── db/
│   │   │   ├── base.py          # Declarative Base & VectorType TypeDecorator
│   │   │   ├── session.py       # Async engine & sessionmaker
│   │   │   └── seed/            # Seed data & deterministic vector generator
│   │   ├── models/              # 10 SQLAlchemy 2.0 ORM models
│   │   ├── schemas/             # Pydantic request/response DTOs
│   │   ├── repositories/        # Data access layer (User, Product, Cart, Order, etc.)
│   │   ├── services/            # Domain logic (Auth, Catalog, Cart, Checkout, AI)
│   │   ├── ai/                  # BaseAIProvider, OpenAIProvider, MockAIProvider, factory
│   │   └── routers/             # API v1 route handlers
│   └── tests/                   # Pytest test suite (48 passing tests)
│       ├── conftest.py          # FastAPI TestClient fixtures
│       ├── test_health.py       # Health & root endpoint tests
│       ├── test_auth.py         # Registration, login, profile, security tests
│       ├── test_catalog.py      # Categories, products, merchants, feed, search tests
│       ├── test_commerce.py     # Cart, wishlist, checkout, orders, isolation tests
│       ├── test_ai.py           # Vector search, assistant, recommendations tests
│       ├── test_e2e_journey.py  # Full customer lifecycle audit test
│       └── verify_db.py         # Standalone database integrity verifier
│
└── frontend/                    # Next.js 14 Frontend Application
    ├── .dockerignore            # Frontend-specific container ignore
    ├── .env.example             # Frontend environment template
    ├── Dockerfile               # Multi-stage standalone Node 20-alpine container
    ├── package.json             # NPM dependencies & scripts
    ├── tsconfig.json            # Strict TypeScript configuration
    ├── tailwind.config.ts       # Custom Tailwind theme & colors
    ├── next.config.mjs          # Standalone output & Unsplash image domains
    └── src/
        ├── types/               # TypeScript interfaces
        ├── lib/                 # Typed API client & formatting utilities
        ├── store/               # Zustand global store
        ├── components/
        │   ├── layout/          # Navbar, Footer
        │   ├── product/         # ProductCard with optimistic wishlist & add-to-cart
        │   ├── cart/            # CartDrawer with quantity steppers & subtotal
        │   ├── ai/              # AISearchModal (⌘K) & AIAssistantDrawer (Concierge)
        │   └── providers.tsx    # TanStack Query & Auth providers
        └── app/                 # Next.js App Router pages (13 routes)
            ├── layout.tsx       # Root layout with drawers & navigation
            ├── page.tsx         # Homepage (Hero, Categories, AI Discovery, Merchants, Feed)
            ├── products/        # Product catalog & [slug] detail pages
            ├── businesses/      # Merchant directory & [slug] storefront pages
            ├── feed/            # Merchant updates & releases
            ├── cart/            # Full shopping cart
            ├── checkout/        # Simulated payment & shipping form
            ├── orders/          # Order history & [orderNumber] confirmation
            ├── wishlist/        # Saved products page
            ├── login/           # Login portal with "Autofill Demo" button
            └── register/        # Customer registration
```

## 8. Docker & Containerized Quickstart (PostgreSQL + pgvector)

The entire Zentro marketplace stack is fully containerized for local development, technical evaluation, and production-grade reproducibility.

### Stack Architecture

```
                  ┌───────────────────────────────────────────────┐
                  │                Host Browser                   │
                  │            http://localhost:3000              │
                  └───────────────┬───────────────────────────────┘
                                  │
                 HTTP :3000       │       HTTP :8000
        ┌─────────────────────────┴───────────────────────────────┐
        │                                                         │
        ▼                                                         ▼
┌───────────────────────────────┐       ┌────────────────────────────────────────────────┐
│   zentro-frontend             │       │   zentro-backend                               │
│   (Next.js 14 Standalone)     │──────▶│   (FastAPI + Python 3.11-slim)                 │
│   Port: 3000                  │  API  │   Port: 8000                                   │
└───────────────────────────────┘       └───────────────────────┬────────────────────────┘
                                                                │
                                              TCP :5432         │  postgresql+asyncpg
                                        (zentro-network bridge) │
                                                                ▼
                                        ┌────────────────────────────────────────────────┐
                                        │   zentro-db                                    │
                                        │   (PostgreSQL 16 + pgvector)                   │
                                        │   Port: 5432 (mapped to host)                  │
                                        │   Volume: postgres_data                        │
                                        └────────────────────────────────────────────────┘
```

### Docker Prerequisites
* **Docker Desktop** or **Docker Engine**: version 24.0+
* **Docker Compose**: version 2.20+ (included with Docker Desktop)

### Quick Start (One Command)

```bash
# 1. Clone the repository and enter the directory
git clone https://github.com/usman2-tech/zentro.git
cd zentro

# 2. Copy the root environment file
cp .env.example .env

# 3. Build images and start the full stack
docker compose up --build -d
```

Once launched:
* **Marketplace Web App**: [`http://localhost:3000`](http://localhost:3000)
* **Backend API & Health**: [`http://localhost:8000/health`](http://localhost:8000/health)
* **Interactive Swagger UI**: [`http://localhost:8000/docs`](http://localhost:8000/docs)
* **PostgreSQL + pgvector**: `localhost:5432` (`postgres` / `postgres`, database: `zentro`)

> [!NOTE]
> On initial container startup, `backend/docker-entrypoint.sh` automatically polls the PostgreSQL TCP socket until ready, applies `alembic upgrade head`, and seeds the complete marketplace catalog (56 products, 8 categories, 10 businesses, 16 feed posts, and demo accounts).

### Docker Management Commands

| Action | Command |
| :--- | :--- |
| **View Service Status & Health** | `docker compose ps` |
| **Follow Live Container Logs** | `docker compose logs -f` |
| **Follow Backend Logs Only** | `docker compose logs -f backend` |
| **Run Migrations Manually** | `docker compose exec backend alembic upgrade head` |
| **Re-seed Marketplace Data** | `docker compose exec backend python app/db/seed/run_seed.py` |
| **Verify pgvector in PostgreSQL** | `docker compose exec db psql -U postgres -d zentro -c "\dx vector"` |
| **Run Backend Tests in Docker** | `docker compose exec backend pytest -v` |
| **Stop All Containers** | `docker compose down` |
| **Reset Database & Volumes** | `docker compose down -v` |
| **Rebuild After Code Changes** | `docker compose up --build -d` |

---

## 9. Local Prerequisites & Native Host Setup (SQLite Fallback)

If you prefer developing without Docker, Zentro supports direct execution on your host machine with an automatic SQLite + NumPy vector similarity fallback.

### Host Prerequisites
* **Python**: 3.10 or higher
* **Node.js**: v18.18.0 or higher (v20+ recommended; verified on `v20.18.0`)
* **Package Managers**: `pip` (Python) and `npm` (Node.js)
* **Operating System**: macOS, Linux, or Windows (verified on Windows 11)

### Step 1: Clone the Repository
```bash
git clone https://github.com/usman2-tech/zentro.git
cd zentro
```

### Step 2: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
source venv/bin/activate

# Install pinned dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
```

### Step 3: Frontend Setup
```bash
# Navigate to frontend directory (from project root)
cd ../frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

---

## 10. Environment Variables

### Backend Configuration (`backend/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PROJECT_NAME` | `"Zentro API"` | Application display name |
| `ENVIRONMENT` | `"development"` | Environment (`development` / `production`) |
| `API_V1_STR` | `"/api/v1"` | API v1 route prefix |
| `CORS_ORIGINS` | `"http://localhost:3000,http://127.0.0.1:3000"` | Allowed CORS frontend origins |
| `SECRET_KEY` | *(Safe dev placeholder)* | Minimum 32-character secret for signing JWTs |
| `ALGORITHM` | `"HS256"` | JWT cryptographic algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token expiration duration (24 hours) |
| `DATABASE_URL` | `"sqlite+aiosqlite:///./zentro.db"` | Async database connection string |
| `AI_PROVIDER` | `"mock"` | AI engine: `"mock"` (offline) or `"openai"` |
| `OPENAI_API_KEY` | `""` | Optional: OpenAI or compatible API key |
| `AI_CHAT_MODEL` | `"gpt-4o-mini"` | LLM model for shopping assistant |
| `AI_EMBEDDING_MODEL` | `"text-embedding-3-small"` | Vector embedding model (1536 dim) |

### Frontend Configuration (`frontend/.env.local`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `"http://localhost:8000/api/v1"` | URL of the FastAPI backend API |

---

## 11. Database Migrations & Seed Data

The database schema is managed through async Alembic migrations.

```bash
# Run from backend directory with venv activated
cd backend

# 1. Apply all database migrations
alembic upgrade head

# 2. Run the realistic database seeder
# Seeds: 8 categories, 10 businesses, 56 products with 1536-dim embeddings,
# 16 feed posts, demo user, orders, and wishlists
python -m app.db.seed.run_seed

# 3. Verify database integrity
python tests/verify_db.py
```

---

## 12. Running the Application

### 1. Launch FastAPI Backend
```bash
# Terminal 1
cd backend
.\venv\Scripts\Activate.ps1   # (Windows) or 'source venv/bin/activate' (Unix)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Backend API will be available at: **`http://127.0.0.1:8000`**
* Health Check: **`http://127.0.0.1:8000/health`**

### 2. Launch Next.js Frontend
```bash
# Terminal 2
cd frontend
npm run dev
```
* Frontend Application will be available at: **`http://localhost:3000`**

---

## 13. Interactive API Documentation (Swagger/OpenAPI)

FastAPI automatically serves interactive, searchable API documentation:

* **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc Interface**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
* **Raw OpenAPI JSON**: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

---

## 14. Demo Credentials

For immediate recruiter and reviewer testing, a pre-seeded customer account is available:

| Role | Email | Password | Pre-loaded Account Data |
| :--- | :--- | :--- | :--- |
| **Demo Customer** | `alex.rivera@example.com` | `ZentroDemo2026!` | Active cart items, 3 delivered orders, 4 saved wishlist products, active recommendation profile. |

> 💡 **Fast-Track Testing**: On the frontend login page (`/login`), click the **"Autofill Demo Credentials"** button to automatically populate and sign in with one click.

---

## 15. Automated Testing & Verification Results

### Backend Test Suite (Pytest)
Execute all 48 automated tests:
```bash
cd backend
pytest tests -v
```

#### Verified Results (48 / 48 Passed in 5.56s):
```text
backend/tests/test_ai.py::test_semantic_search_with_budget PASSED        [  2%]
backend/tests/test_ai.py::test_semantic_search_workspace PASSED          [  4%]
backend/tests/test_ai.py::test_semantic_search_empty_when_no_match PASSED [  6%]
backend/tests/test_ai.py::test_shopping_assistant_grounded_response PASSED [  8%]
backend/tests/test_ai.py::test_guest_recommendations PASSED              [ 10%]
backend/tests/test_ai.py::test_personalized_recommendations_with_user_signals PASSED [ 12%]
backend/tests/test_auth.py::test_register_success PASSED                 [ 14%]
backend/tests/test_auth.py::test_register_duplicate_email PASSED         [ 16%]
backend/tests/test_auth.py::test_register_invalid_email PASSED           [ 18%]
backend/tests/test_auth.py::test_register_short_password PASSED          [ 20%]
backend/tests/test_auth.py::test_login_demo_user PASSED                  [ 22%]
backend/tests/test_auth.py::test_login_case_insensitive_email PASSED     [ 25%]
backend/tests/test_auth.py::test_login_wrong_password PASSED             [ 27%]
backend/tests/test_auth.py::test_login_nonexistent_user PASSED           [ 29%]
backend/tests/test_auth.py::test_get_profile_success PASSED              [ 31%]
backend/tests/test_auth.py::test_get_profile_missing_token PASSED        [ 33%]
backend/tests/test_auth.py::test_get_profile_invalid_token PASSED        [ 35%]
backend/tests/test_auth.py::test_get_profile_expired_token PASSED        [ 37%]
backend/tests/test_auth.py::test_root_path_aliases PASSED                [ 39%]
backend/tests/test_auth.py::test_registration_creates_user_cart PASSED   [ 41%]
backend/tests/test_catalog.py::test_get_categories PASSED                [ 43%]
backend/tests/test_catalog.py::test_get_products_pagination PASSED       [ 45%]
backend/tests/test_catalog.py::test_filter_products_by_category PASSED   [ 47%]
backend/tests/test_catalog.py::test_filter_products_by_business PASSED   [ 50%]
backend/tests/test_catalog.py::test_filter_products_by_price_range PASSED [ 52%]
backend/tests/test_catalog.py::test_sort_products_price_asc PASSED       [ 54%]
backend/tests/test_catalog.py::test_sort_products_price_desc PASSED      [ 56%]
backend/tests/test_catalog.py::test_get_product_detail_by_slug PASSED    [ 58%]
backend/tests/test_catalog.py::test_get_product_detail_not_found PASSED  [ 60%]
backend/tests/test_catalog.py::test_list_businesses PASSED               [ 62%]
backend/tests/test_catalog.py::test_get_business_detail PASSED           [ 64%]
backend/tests/test_catalog.py::test_get_business_not_found PASSED        [ 66%]
backend/tests/test_catalog.py::test_get_feed_posts PASSED                [ 68%]
backend/tests/test_catalog.py::test_get_feed_filter_type PASSED          [ 70%]
backend/tests/test_catalog.py::test_unified_search PASSED                [ 72%]
backend/tests/test_commerce.py::test_get_cart_authenticated PASSED       [ 75%]
backend/tests/test_commerce.py::test_add_and_update_cart_item PASSED     [ 77%]
backend/tests/test_commerce.py::test_cannot_modify_other_user_cart PASSED [ 79%]
backend/tests/test_commerce.py::test_wishlist_lifecycle PASSED           [ 81%]
backend/tests/test_commerce.py::test_checkout_empty_cart_fails PASSED    [ 83%]
backend/tests/test_commerce.py::test_successful_checkout_flow PASSED     [ 85%]
backend/tests/test_commerce.py::test_order_authorization_isolation PASSED [ 87%]
backend/tests/test_e2e_journey.py::test_complete_end_to_end_customer_journey PASSED [ 89%]
backend/tests/test_health.py::test_root_endpoint PASSED                  [ 91%]
backend/tests/test_health.py::test_health_endpoint PASSED                [ 93%]
backend/tests/test_health.py::test_api_v1_health_endpoint PASSED         [ 95%]
backend/tests/test_health.py::test_openapi_docs PASSED                   [ 97%]
backend/tests/test_health.py::test_swagger_ui_html PASSED                [100%]

============================= 48 passed in 5.56s ==============================
```

### Frontend Type-Checking & Production Build
```bash
cd frontend

# TypeScript Validation (0 errors)
npm run typecheck

# Production Next.js Build (13/13 routes compiled)
npm run build
```

---

## 16. Security & Authorization Isolation

* **JWT Authenticated Sessions**: Encoded with HS256, issued with unique subject claims, and verified via `FastAPI` dependencies.
* **Strict Resource Isolation**:
  * Users can only modify items in their own `Cart`.
  * Users can only view or fetch receipts for their own `Orders`. Attempted cross-tenant access returns `403 Forbidden`.
* **Zero Secret Leakage**:
  * Passwords are salted and hashed using `bcrypt` (12 rounds).
  * Raw hashes and passwords are excluded from all Pydantic serialization schemas (`UserResponse`).
  * `.gitignore` prevents `.env`, local SQLite `.db` databases, and build artifacts from entering version control.

---

## 17. Known Limitations

* **Simulated Payments**: Payment authorization is currently executed via a sandbox payment simulation rather than live card charges.
* **Dialect Parity**: Local development uses SQLite + NumPy cosine similarity for zero-dependency execution. In production, PostgreSQL + pgvector is utilized for scale.

---

## 18. Production Deployment Architecture

```
                       ┌───────────────────────────────┐
                       │   Vercel / Cloudflare Pages   │
                       │     Next.js 14 App Router     │
                       └──────────────┬────────────────┘
                                      │ HTTPS / REST
                                      ▼
                       ┌───────────────────────────────┐
                       │  AWS ECS / Render / Cloud Run │
                       │    FastAPI (Uvicorn ASGI)     │
                       └──────────────┬────────────────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
     ┌───────────────────────────┐         ┌───────────────────────────┐
     │   Managed PostgreSQL 16   │         │    External OpenAI API    │
     │      (AWS RDS / Neon)     │         │   (Embeddings & GPT-4o)   │
     │   pgvector (1536-dim HNSW)│         └───────────────────────────┘
     └───────────────────────────┘
```

---

## 19. Future Roadmap

1. **Stripe & Webhook Integration**: Transition the simulated checkout to live Stripe Elements and asynchronous payment webhook listeners.
2. **Merchant Portal**: Dedicated dashboard enabling independent store owners to upload products, manage stock quantities, and post newsfeed updates.
3. **Multimodal Visual Search**: Allow customers to upload product photos to find visually similar catalog items using CLIP embeddings.
4. **Multi-Currency Localization**: Live currency conversion based on browser geolocation.

---

## License

This project was built for technical assessment and recruitment evaluation purposes. Distributed under the MIT License.
