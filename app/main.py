from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
import os
from app.format_routes import router as format_router
from app.convert_routes import router as convert_router
from app.query_routes import router as query_router
from app.logging_config import logger

app = FastAPI(title="JSON Toolkit", description="Professional JSON editing, formatting, and conversion tools")

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    logger.info("Request started", 
                method=request.method,
                url=str(request.url),
                client_ip=request.client.host)
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info("Request completed",
                method=request.method,
                url=str(request.url),
                status_code=response.status_code,
                process_time=process_time)
    
    return response

# Get allowed origins from environment or use defaults
def get_allowed_origins():
    """Get CORS allowed origins from environment variable or use defaults"""
    cors_origins_env = os.getenv('CORS_ORIGINS', '')
    
    # Default development origins
    default_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]
    
    if cors_origins_env:
        # Split by comma and strip whitespace
        env_origins = [origin.strip() for origin in cors_origins_env.split(',') if origin.strip()]
        # Combine with defaults, removing duplicates
        all_origins = list(set(default_origins + env_origins))
        return all_origins
    
    return default_origins

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(format_router)
app.include_router(convert_router)
app.include_router(query_router)

@app.get("/")
def read_root():
    logger.info("Root endpoint accessed")
    return {"message": "JSON Toolkit - Professional JSON editing, formatting, and conversion tools"}