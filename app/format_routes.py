from fastapi import APIRouter, HTTPException, Request
from pydantic import ValidationError
import json
from app.models import JsonRequest 
from app.format_utils import format_json
from app.error_utils import parse_json_error_details, format_json_error_message
from app.logging_config import logger
from app.logging_utils import log_request_payload, log_response_payload

router = APIRouter()

@router.post("/format")
async def format_json_endpoint(request: Request):
    """Format JSON with proper indentation"""
    try:
        # Get raw body to parse JSON manually for better error messages
        body = await request.body()
        json_string = body.decode('utf-8')
        
        logger.info("Format request started", data_size=len(json_string))
        
        try:
            # Parse JSON to get detailed error if it fails
            parsed_json = json.loads(json_string)
            log_request_payload(parsed_json, "format_request")
        except json.JSONDecodeError as json_error:
            # Extract detailed error information
            error_details = parse_json_error_details(json_error, json_string)
            logger.error("JSON parsing error", 
                        line=error_details["line"], 
                        column=error_details["column"],
                        message=error_details["message"])
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "Invalid JSON",
                    "message": error_details["message"],
                    "line": error_details["line"],
                    "column": error_details["column"],
                    "position": error_details["position"],
                    "snippet": error_details["snippet"],
                    "formatted_message": format_json_error_message(error_details),
                    "type": "validation"
                }
            )
        
        try:
            formatted_json = format_json(parsed_json)
            
            # Log response payload (sanitized and conditional)
            log_response_payload({"formatted_json": formatted_json}, "format_response")
            
            logger.info("Format request completed", success=True)
            return {"formatted_json": formatted_json}
            
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unexpected error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Unexpected error",
                "message": str(e),
                "type": "server"
            }
        )
