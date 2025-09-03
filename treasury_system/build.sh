#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Initialize the database (create tables)
python -c "from database import init_db; init_db()"

echo "Build completed successfully!"