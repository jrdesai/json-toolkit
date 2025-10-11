from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
from app.format_routes import router as format_router
from app.convert_routes import router as convert_router
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

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178"],  # React dev server ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(format_router)
app.include_router(convert_router)

@app.get("/")
def read_root():
    logger.info("Root endpoint accessed")
    return {"message": "JSON Toolkit - Professional JSON editing, formatting, and conversion tools"}