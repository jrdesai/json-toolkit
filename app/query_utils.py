import json
from typing import Any, List
from jsonpath_ng import parse
from jsonpath_ng.exceptions import JSONPathError
from app.logging_config import logger

def query_json_path(json_data: Any, path_expression: str) -> List[Any]:
    """
    Query JSON data using JSONPath expression
    
    Args:
        json_data: JSON data to query (dict, list, or primitive)
        path_expression: JSONPath expression (e.g., '$.users[*].name', '$..address')
    
    Returns:
        List of matched values
    
    Raises:
        JSONPathError: If the path expression is invalid
        ValueError: If JSON data cannot be processed
    """
    logger.debug("Querying JSON with path", path=path_expression, data_type=type(json_data).__name__)
    
    try:
        # Parse JSON if it's a string
        if isinstance(json_data, str):
            parsed = json.loads(json_data)
        else:
            parsed = json_data
        
        # Parse JSONPath expression
        try:
            jsonpath_expr = parse(path_expression)
        except (JSONPathError, Exception) as e:
            logger.error("Invalid JSONPath expression", path=path_expression, error=str(e))
            if isinstance(e, JSONPathError):
                raise
            raise JSONPathError(f"Invalid JSONPath expression: {str(e)}")
        
        # Find all matches
        matches = jsonpath_expr.find(parsed)
        
        # Extract values from matches
        results = [match.value for match in matches]
        
        logger.debug("JSONPath query completed", 
                    path=path_expression, 
                    matches=len(results),
                    result_types=[type(r).__name__ for r in results[:5]])  # Log first 5 types
        
        return results
        
    except json.JSONDecodeError as e:
        logger.error("Invalid JSON data", error=str(e))
        # Preserve the original error for detailed parsing
        from app.error_utils import parse_json_error_details
        if isinstance(json_data, str):
            error_details = parse_json_error_details(e, json_data)
            raise ValueError(
                f"Invalid JSON syntax: {error_details['message']} "
                f"at line {error_details['line']}, column {error_details['column']} "
                f"(position {error_details['position']})"
            )
        else:
            raise ValueError(f"Invalid JSON syntax: {e.msg} at position {e.pos}")
    except JSONPathError:
        # Re-raise JSONPath errors as-is
        raise
    except Exception as e:
        logger.error("JSONPath query failed", path=path_expression, error=str(e), exc_info=True)
        raise ValueError(f"Error executing JSONPath query: {str(e)}")

