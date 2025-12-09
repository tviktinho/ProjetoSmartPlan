#!/bin/bash
cd /home/runner/`ls -t /home/runner | head -1` 2>/dev/null || cd .
export DATABASE_URL=${DATABASE_URL:-"postgresql://localhost/ufu_agenda"}
python -m pip install -q fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv pydantic authlib requests 2>/dev/null
exec python -u backend/app.py
