import json
from typing import Dict, Any, Optional

def parse_json_error_details(error: json.JSONDecodeError, json_string: str) -> Dict[str, Any]:
    """
    Extract detailed error information from JSONDecodeError
    
    Args:
        error: The JSONDecodeError exception
        json_string: The original JSON string that caused the error
    
    Returns:
        Dictionary with detailed error information
    """
    error_info = {
        "message": error.msg,
        "position": error.pos,
        "line": 1,
        "column": 1,
        "snippet": "",
        "error_type": "json_syntax"
    }
    
    # Calculate line and column numbers
    if error.pos is not None:
        lines = json_string[:error.pos].split('\n')
        error_info["line"] = len(lines)
        error_info["column"] = len(lines[-1]) + 1 if lines else 1
        
        # Get context snippet (3 lines before and after)
        all_lines = json_string.split('\n')
        start_line = max(0, error_info["line"] - 4)
        end_line = min(len(all_lines), error_info["line"] + 3)
        
        snippet_lines = []
        for i in range(start_line, end_line):
            line_num = i + 1
            line_content = all_lines[i]
            prefix = ">>> " if line_num == error_info["line"] else "    "
            snippet_lines.append(f"{prefix}Line {line_num}: {line_content}")
            if line_num == error_info["line"]:
                # Add pointer to error position
                pointer = " " * (len(prefix) + 7 + error_info["column"] - 1) + "^"
                snippet_lines.append(pointer)
        
        error_info["snippet"] = "\n".join(snippet_lines)
    
    return error_info

def format_json_error_message(error_info: Dict[str, Any]) -> str:
    """
    Format error information into a user-friendly message
    
    Args:
        error_info: Dictionary with error details
        
    Returns:
        Formatted error message string
    """
    parts = [
        f"JSON Error: {error_info['message']}",
        f"Location: Line {error_info['line']}, Column {error_info['column']} (Position {error_info['position']})"
    ]
    
    if error_info.get('snippet'):
        parts.append("\nContext:")
        parts.append(error_info['snippet'])
    
    return "\n".join(parts)

