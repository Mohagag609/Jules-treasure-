#!/usr/bin/env bash

# Initialize database if needed
python -c "from database import init_db; init_db()"

# Start the application
exec gunicorn app:app --bind 0.0.0.0:${PORT:-5000} --workers 1 --threads 2 --timeout 120