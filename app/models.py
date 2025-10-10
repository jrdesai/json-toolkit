from typing import Dict, Any, Union, List
from pydantic import RootModel

class JsonRequest(RootModel[Union[Dict[str, Any], List[Any], str, int, float, bool]]):
    model_config = {
        "json_schema_extra": {
            "description": "Any valid JSON data to format or convert"
        }
    }
