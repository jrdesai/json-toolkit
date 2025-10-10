import json
from typing import Any

def format_json(json_data: Any) -> str:
    """Format JSON with proper indentation"""
    try:
        if isinstance(json_data, str):
            parsed = json.loads(json_data)
        else:
            parsed = json_data
        return json.dumps(parsed, indent=4)
    except (json.JSONDecodeError, TypeError):
        return "Invalid JSON"
