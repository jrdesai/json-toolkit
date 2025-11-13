from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from jsonpath_ng.exceptions import JSONPathError
from app.models import JsonPathRequest
from app.query_utils import query_json_path
from app.error_utils import parse_json_error_details, format_json_error_message
from app.logging_config import logger
from app.logging_utils import log_request_payload, log_response_payload
import json

router = APIRouter()

@router.post("/query")
def query_json_path_endpoint(request: JsonPathRequest):
    """Query JSON data using JSONPath expression"""
    logger.info("Query request started", 
                path=request.path, 
                data_size=len(str(request.root)))
    
    # Log request payload (sanitized and conditional)
    log_request_payload({"root": request.root, "path": request.path}, "query_request")
    
    try:
        # Execute JSONPath query
        results = query_json_path(request.root, request.path)
        
        # Format results as JSON string for display
        formatted_results = json.dumps(results, indent=2)
        
        response_data = {
            "results": results,
            "formatted_results": formatted_results,
            "count": len(results),
            "path": request.path
        }
        
        # Log response payload (sanitized and conditional)
        log_response_payload(response_data, "query_response")
        
        logger.info("Query request completed", 
                   path=request.path, 
                   matches=len(results), 
                   success=True)
        return response_data
        
    except JSONPathError as e:
        # Extract detailed JSONPath error information
        error_message = str(e)
        # Try to extract position information if available
        position_info = ""
        if hasattr(e, 'pos'):
            position_info = f" at position {e.pos}"
        elif ":" in error_message:
            # jsonpath-ng errors often include position like "Parse error at 1:8"
            position_info = error_message.split(":")[0] if ":" in error_message else ""
        
        logger.error("Invalid JSONPath expression", path=request.path, error=error_message, exc_info=True)
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Invalid JSONPath expression",
                "message": error_message,
                "path": request.path,
                "formatted_message": f"JSONPath Error: {error_message}\nPath: {request.path}",
                "type": "validation"
            }
        )
    except ValueError as e:
        error_str = str(e)
        # Check if it's a JSON parsing error
        if "Invalid JSON syntax" in error_str or "JSONDecodeError" in error_str:
            # Try to extract JSON error details if we have the original string
            # For now, just pass through the error message
            logger.error("JSON parsing error in query", path=request.path, error=error_str, exc_info=True)
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "Invalid JSON",
                    "message": error_str,
                    "type": "validation"
                }
            )
        else:
            logger.error("Validation error", path=request.path, error=error_str, exc_info=True)
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "Invalid input",
                    "message": error_str,
                    "type": "validation"
                }
            )
    except ValidationError as e:
        logger.error("Validation error", path=request.path, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Invalid JSON",
                "message": str(e),
                "type": "validation"
            }
        )
    except Exception as e:
        logger.error("Query request failed", path=request.path, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Processing error",
                "message": str(e),
                "type": "server"
            }
        )

