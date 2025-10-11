from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from app.models import JsonRequest 
from app.format_utils import format_json
from app.logging_config import logger
from app.logging_utils import log_request_payload, log_response_payload

router = APIRouter()

@router.post("/format")
def format_json_endpoint(request: JsonRequest):
    """Format JSON with proper indentation"""
    logger.info("Format request started", data_size=len(str(request.root)))
    
    # Log request payload (sanitized and conditional)
    log_request_payload(request.root, "format_request")
    
    try:
        formatted_json = format_json(request.root)
        
        # Log response payload (sanitized and conditional)
        log_response_payload({"formatted_json": formatted_json}, "format_response")
        
        logger.info("Format request completed", success=True)
        return {"formatted_json": formatted_json}
        
    except ValidationError as e:
        logger.error("Validation error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Invalid JSON",
                "message": str(e),
                "type": "validation"
            }
        )
    except Exception as e:
        logger.error("Format request failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Processing error",
                "message": str(e),
                "type": "server"
            }
        )
