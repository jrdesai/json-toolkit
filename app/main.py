from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.format_routes import router as format_router
from app.convert_routes import router as convert_router

app = FastAPI(title="JSON Toolkit", description="Professional JSON editing, formatting, and conversion tools")

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
    return {"message": "JSON Toolkit - Professional JSON editing, formatting, and conversion tools"}