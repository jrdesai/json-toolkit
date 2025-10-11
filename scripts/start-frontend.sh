#!/bin/bash

# JSON Toolkit - Frontend Startup Script
# This script ensures only one frontend server runs at a time

echo "🚀 Starting JSON Toolkit Frontend..."

# Check if frontend is already running
if pgrep -f "vite" > /dev/null; then
    echo "⚠️  Frontend server is already running!"
    echo "   Use './scripts/stop-servers.sh' to stop it first"
    exit 1
fi

# Check if port 5173 is in use
if lsof -i :5173 > /dev/null 2>&1; then
    echo "⚠️  Port 5173 is already in use!"
    echo "   Use './scripts/stop-servers.sh' to free the port"
    exit 1
fi

# Start frontend server
cd "$(dirname "$0")/../frontend"
echo "✅ Starting frontend on http://localhost:5173"
npm run dev
