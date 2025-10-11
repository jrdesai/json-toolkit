import json
from typing import Any
from app.logging_config import logger

def format_json(json_data: Any) -> str:
    """Format JSON with proper indentation"""
    logger.debug("Formatting JSON", data_type=type(json_data).__name__)
    
    try:
        if isinstance(json_data, str):
            parsed = json.loads(json_data)
        else:
            parsed = json_data
        result = json.dumps(parsed, indent=4)
        logger.debug("JSON formatted successfully", output_size=len(result))
        return result
    except (json.JSONDecodeError, TypeError) as e:
        logger.error("JSON formatting failed", error=str(e))
        return "Invalid JSON"
