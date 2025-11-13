from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import ValidationError
import json
from app.models import JsonRequest
from app.convert_utils import convert_to_xml, convert_to_csv, convert_to_yaml
from app.format_utils import format_json
from app.error_utils import parse_json_error_details, format_json_error_message
from app.logging_config import logger
from app.logging_utils import log_request_payload, log_response_payload

router = APIRouter()

@router.post("/convert")
async def convert_json_endpoint(
    request: Request,
    format: str = Query("json", description="Output format: json, xml, csv, yaml")
):
    """Convert JSON to specified format"""
    # Validate format parameter
    valid_formats = ["json", "xml", "csv", "yaml"]
    if format not in valid_formats:
        logger.error("Invalid format requested", format=format, valid_formats=valid_formats)
        raise HTTPException(
            status_code=400, 
            detail={
                "error": "Invalid format",
                "message": f"Invalid format. Must be one of: {', '.join(valid_formats)}",
                "type": "validation"
            }
        )
    
    try:
        # Get raw body to parse JSON manually for better error messages
        body = await request.body()
        json_string = body.decode('utf-8')
        
        logger.info("Convert request started", format=format, data_size=len(json_string))
        
        try:
            # Parse JSON to get detailed error if it fails
            parsed_json = json.loads(json_string)
            log_request_payload(parsed_json, f"convert_request_{format}")
        except json.JSONDecodeError as json_error:
            # Extract detailed error information
            error_details = parse_json_error_details(json_error, json_string)
            logger.error("JSON parsing error in convert", 
                        format=format,
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
            # Call appropriate conversion function based on format
            if format == "json":
                converted_data = format_json(parsed_json)
            elif format == "xml":
                converted_data = convert_to_xml(parsed_json)
            elif format == "csv":
                converted_data = convert_to_csv(parsed_json)
            elif format == "yaml":
                converted_data = convert_to_yaml(parsed_json)
            
            response_data = {
                "converted_data": converted_data,
                "format": format
            }
            
            # Log response payload (sanitized and conditional)
            log_response_payload(response_data, f"convert_response_{format}")
            
            logger.info("Convert request completed", format=format, success=True)
            return response_data
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unexpected error in convert", format=format, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Unexpected error",
                "message": str(e),
                "type": "server"
            }
        )
