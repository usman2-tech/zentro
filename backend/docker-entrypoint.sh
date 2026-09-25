#!/bin/sh
set -e

echo "⏳ [Zentro Docker Entrypoint] Waiting for PostgreSQL database to be reachable..."
python - << 'EOF'
import os
import sys
import time
from urllib.parse import urlparse
import socket

database_url = os.environ.get("DATABASE_URL", "")
if database_url.startswith("sqlite"):
    print("ℹ️  Using SQLite database, skipping TCP connection wait.")
    sys.exit(0)

# Extract host and port from database URL
clean_url = database_url.replace("postgresql+asyncpg://", "http://").replace("postgresql://", "http://")
parsed = urlparse(clean_url)
host = parsed.hostname or "db"
port = parsed.port or 5432

max_retries = 30
for attempt in range(1, max_retries + 1):
    try:
        with socket.create_connection((host, port), timeout=2):
            print(f"✅ [Zentro Docker Entrypoint] Database connection verified at {host}:{port}!")
            sys.exit(0)
    except (socket.error, OSError):
        print(f"   Waiting for database at {host}:{port}... ({attempt}/{max_retries})")
        time.sleep(1)

print("❌ [Zentro Docker Entrypoint] Could not establish connection to PostgreSQL.")
sys.exit(1)
EOF

echo "🚀 [Zentro Docker Entrypoint] Applying Alembic database migrations..."
alembic upgrade head

if [ "$AUTO_SEED" = "true" ] || [ "$RUN_SEED" = "true" ]; then
    echo "🌱 [Zentro Docker Entrypoint] Running initial marketplace seeder..."
    python app/db/seed/run_seed.py || echo "⚠️ [Zentro Docker Entrypoint] Seeder finished with notice."
fi

echo "✨ [Zentro Docker Entrypoint] Starting application server..."
exec "$@"
