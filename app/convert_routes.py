from fastapi import APIRouter, HTTPException, Query
from pydantic import ValidationError
from app.models import JsonRequest
from app.convert_utils import convert_to_xml, convert_to_csv, convert_to_yaml
from app.format_utils import format_json
from app.logging_config import logger
from app.logging_utils import log_request_payload, log_response_payload

router = APIRouter()

@router.post("/convert")
def convert_json_endpoint(
    request: JsonRequest, 
    format: str = Query("json", description="Output format: json, xml, csv, yaml")
):
    """Convert JSON to specified format"""
    logger.info("Convert request started", format=format, data_size=len(str(request.root)))
    
    # Log request payload (sanitized and conditional)
    log_request_payload(request.root, f"convert_request_{format}")
    
    # Validate format parameter
    valid_formats = ["json", "xml", "csv", "yaml"]
    if format not in valid_formats:
        logger.error("Invalid format requested", format=format, valid_formats=valid_formats)
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
        
        response_data = {
            "converted_data": converted_data,
            "format": format
        }
        
        # Log response payload (sanitized and conditional)
        log_response_payload(response_data, f"convert_response_{format}")
        
        logger.info("Convert request completed", format=format, success=True)
        return response_data
    except ValidationError as e:
        logger.error("Validation error", format=format, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Invalid JSON",
                "message": str(e),
                "type": "validation"
            }
        )
    except Exception as e:
        logger.error("Convert request failed", format=format, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Processing error",
                "message": f"Error converting to {format}: {str(e)}",
                "type": "server"
            }
        )
