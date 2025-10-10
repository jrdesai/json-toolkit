from fastapi import APIRouter
from app.models import JsonRequest 
from app.format_utils import format_json

router = APIRouter()

@router.post("/format")
def format_json_endpoint(request: JsonRequest):
    """Format JSON with proper indentation"""
    formatted_json = format_json(request.root)
    return {"formatted_json": formatted_json}
