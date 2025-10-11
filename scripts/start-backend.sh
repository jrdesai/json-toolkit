#!/bin/bash

# JSON Toolkit - Backend Startup Script
# This script ensures only one backend server runs at a time

echo "🚀 Starting JSON Toolkit Backend..."

# Check if backend is already running
if pgrep -f "uvicorn.*app.main:app" > /dev/null; then
    echo "⚠️  Backend server is already running!"
    echo "   Use './scripts/stop-servers.sh' to stop it first"
    exit 1
fi

# Check if port 8000 is in use
if lsof -i :8000 > /dev/null 2>&1; then
    echo "⚠️  Port 8000 is already in use!"
    echo "   Use './scripts/stop-servers.sh' to free the port"
    exit 1
fi

# Activate virtual environment and start server
cd "$(dirname "$0")/.."
source venv/bin/activate
echo "✅ Starting backend on http://localhost:8000"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
