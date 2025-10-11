#!/bin/bash

# JSON Toolkit - Stop All Servers Script
# This script safely stops all running servers

echo "🛑 Stopping all JSON Toolkit servers..."

# Stop backend servers
echo "📡 Stopping backend servers..."
pkill -f "uvicorn.*app.main:app" 2>/dev/null || echo "   No backend servers found"

# Stop frontend servers
echo "🎨 Stopping frontend servers..."
pkill -f "vite" 2>/dev/null || echo "   No frontend servers found"

# Stop any remaining Node.js processes related to our project
echo "🔧 Cleaning up Node.js processes..."
pkill -f "node.*vite" 2>/dev/null || echo "   No Node.js processes found"

# Wait a moment for processes to stop
sleep 2

# Verify ports are free
echo "🔍 Checking ports..."
if ! lsof -i :8000 > /dev/null 2>&1; then
    echo "   ✅ Port 8000 (backend) is free"
else
    echo "   ⚠️  Port 8000 still in use"
fi

if ! lsof -i :5173 > /dev/null 2>&1; then
    echo "   ✅ Port 5173 (frontend) is free"
else
    echo "   ⚠️  Port 5173 still in use"
fi

echo "🎉 All servers stopped!"
