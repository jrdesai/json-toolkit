import csv
import io
import yaml
from dicttoxml import dicttoxml
from typing import Any, Dict, List

def convert_to_xml(json_data: Any) -> str:
    """Convert JSON to XML format"""
    try:
        if isinstance(json_data, str):
            import json
            parsed = json.loads(json_data)
        else:
            parsed = json_data
        
        # Convert to XML
        xml_bytes = dicttoxml(parsed, custom_root='root', attr_type=False)
        xml_str = xml_bytes.decode('utf-8')
        
        # Format XML with proper indentation
        import xml.dom.minidom
        dom = xml.dom.minidom.parseString(xml_str)
        formatted_xml = dom.toprettyxml(indent="  ")
        
        # Remove empty lines
        lines = [line for line in formatted_xml.split('\n') if line.strip()]
        return '\n'.join(lines)
    except Exception as e:
        return f"Error converting to XML: {str(e)}"

def convert_to_csv(json_data: Any) -> str:
    """Convert JSON to CSV format with flattened nested objects"""
    try:
        if isinstance(json_data, str):
            import json
            parsed = json.loads(json_data)
        else:
            parsed = json_data
        
        # Handle different input types
        if isinstance(parsed, list):
            # Array of objects
            if not parsed:
                return "No data to convert"
            
            # Flatten all objects
            flattened_data = []
            for item in parsed:
                if isinstance(item, dict):
                    flattened_data.append(flatten_dict(item))
                else:
                    flattened_data.append({"value": str(item)})
            
            # Get all unique keys
            all_keys = set()
            for item in flattened_data:
                all_keys.update(item.keys())
            
            # Create CSV
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=sorted(all_keys))
            writer.writeheader()
            writer.writerows(flattened_data)
            return output.getvalue()
            
        elif isinstance(parsed, dict):
            # Single object
            flattened = flatten_dict(parsed)
            
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=sorted(flattened.keys()))
            writer.writeheader()
            writer.writerow(flattened)
            return output.getvalue()
            
        else:
            # Primitive value
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["value"])
            writer.writerow([str(parsed)])
            return output.getvalue()
            
    except Exception as e:
        return f"Error converting to CSV: {str(e)}"

def convert_to_yaml(json_data: Any) -> str:
    """Convert JSON to YAML format"""
    try:
        if isinstance(json_data, str):
            import json
            parsed = json.loads(json_data)
        else:
            parsed = json_data
        
        # Convert to YAML with proper formatting
        yaml_str = yaml.dump(parsed, default_flow_style=False, sort_keys=False, indent=2)
        return yaml_str
    except Exception as e:
        return f"Error converting to YAML: {str(e)}"

def flatten_dict(d: Dict, parent_key: str = '', sep: str = '.') -> Dict:
    """Helper function to flatten nested dictionaries"""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        elif isinstance(v, list):
            # Handle lists by converting to string or flattening if they contain dicts
            if v and isinstance(v[0], dict):
                # If list contains dicts, create indexed keys
                for i, item in enumerate(v):
                    if isinstance(item, dict):
                        items.extend(flatten_dict(item, f"{new_key}[{i}]", sep=sep).items())
                    else:
                        items.append((f"{new_key}[{i}]", str(item)))
            else:
                items.append((new_key, str(v)))
        else:
            items.append((new_key, v))
    return dict(items)
