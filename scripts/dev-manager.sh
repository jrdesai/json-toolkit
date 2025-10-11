#!/bin/bash

# JSON Toolkit - Development Environment Manager
# This script provides a menu-driven interface for managing servers

show_menu() {
    echo "🔧 JSON Toolkit - Development Manager"
    echo "=================================="
    echo "1) Start Backend Only"
    echo "2) Start Frontend Only" 
    echo "3) Start Both Servers"
    echo "4) Stop All Servers"
    echo "5) Check Server Status"
    echo "6) Restart All Servers"
    echo "7) Exit"
    echo "=================================="
}

check_status() {
    echo "📊 Server Status:"
    echo "================"
    
    # Check backend
    if pgrep -f "uvicorn.*app.main:app" > /dev/null; then
        echo "✅ Backend: Running on port 8000"
    else
        echo "❌ Backend: Not running"
    fi
    
    # Check frontend
    if pgrep -f "vite" > /dev/null; then
        echo "✅ Frontend: Running (check terminal for port)"
    else
        echo "❌ Frontend: Not running"
    fi
    
    echo "================"
}

start_both() {
    echo "🚀 Starting both servers..."
    
    # Start backend in background
    ./scripts/start-backend.sh &
    BACKEND_PID=$!
    
    # Wait a moment
    sleep 3
    
    # Start frontend in background
    ./scripts/start-frontend.sh &
    FRONTEND_PID=$!
    
    echo "✅ Both servers started!"
    echo "   Backend PID: $BACKEND_PID"
    echo "   Frontend PID: $FRONTEND_PID"
    echo "   Use './scripts/dev-manager.sh' and select option 4 to stop"
}

restart_all() {
    echo "🔄 Restarting all servers..."
    ./scripts/stop-servers.sh
    sleep 2
    start_both
}

# Main menu loop
while true; do
    show_menu
    read -p "Select an option (1-7): " choice
    
    case $choice in
        1)
            ./scripts/start-backend.sh
            ;;
        2)
            ./scripts/start-frontend.sh
            ;;
        3)
            start_both
            ;;
        4)
            ./scripts/stop-servers.sh
            ;;
        5)
            check_status
            ;;
        6)
            restart_all
            ;;
        7)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid option. Please select 1-7."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    clear
done
