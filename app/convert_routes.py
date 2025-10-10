from fastapi import APIRouter, HTTPException, Query
from app.models import JsonRequest
from app.convert_utils import convert_to_xml, convert_to_csv, convert_to_yaml
from app.format_utils import format_json

router = APIRouter()

@router.post("/convert")
def convert_json_endpoint(
    request: JsonRequest, 
    format: str = Query("json", description="Output format: json, xml, csv, yaml")
):
    """Convert JSON to specified format"""
    # Validate format parameter
    valid_formats = ["json", "xml", "csv", "yaml"]
    if format not in valid_formats:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid format. Must be one of: {', '.join(valid_formats)}"
        )
    
    try:
        # Call appropriate conversion function based on format
        if format == "json":
            converted_data = format_json(request.root)
        elif format == "xml":
            converted_data = convert_to_xml(request.root)
        elif format == "csv":
            converted_data = convert_to_csv(request.root)
        elif format == "yaml":
            converted_data = convert_to_yaml(request.root)
        
        return {
            "converted_data": converted_data,
            "format": format
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error converting to {format}: {str(e)}"
        )
