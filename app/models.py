from typing import Dict, Any, Union, List
from pydantic import RootModel, ValidationError
import json

class JsonRequest(RootModel[Union[Dict[str, Any], List[Any], str, int, float, bool]]):
    """Enhanced JSON request model with detailed validation"""
    
    model_config = {
        "json_schema_extra": {
            "description": "Any valid JSON data to format or convert"
        }
    }
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate_json
    
    @classmethod
    def validate_json(cls, v):
        """Validate JSON input with detailed error messages"""
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON syntax: {e.msg} at position {e.pos}")
        return v
