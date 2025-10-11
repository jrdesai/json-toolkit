import os
import json
from typing import Any, Dict, List
from app.logging_config import logger

def sanitize_json_data(data: Any) -> Any:
    """Remove sensitive data from JSON payloads"""
    sensitive_keys = [
        'password', 'token', 'secret', 'key', 'ssn', 'credit_card', 
        'api_key', 'auth', 'authorization', 'bearer', 'session',
        'cookie', 'jwt', 'refresh_token', 'access_token', 'private_key',
        'client_secret', 'api_secret', 'passphrase', 'pin', 'ssn',
        'social_security', 'drivers_license', 'license_number'
    ]
    
    if isinstance(data, dict):
        sanitized = {}
        for key, value in data.items():
            # Check if key contains sensitive information
            if any(sensitive in key.lower() for sensitive in sensitive_keys):
                sanitized[key] = "***REDACTED***"
            elif isinstance(value, dict):
                sanitized[key] = sanitize_json_data(value)
            elif isinstance(value, list):
                sanitized[key] = [sanitize_json_data(item) for item in value]
            else:
                sanitized[key] = value
        return sanitized
    elif isinstance(data, list):
        return [sanitize_json_data(item) for item in data]
    else:
        return data

def truncate_payload(payload: str, max_size: int = None) -> str:
    """Truncate payload to specified size"""
    if max_size is None:
        max_size = int(os.getenv('LOG_PAYLOAD_MAX_SIZE', '1000'))
    
    if len(payload) > max_size:
        return payload[:max_size] + "...[TRUNCATED]"
    return payload

def should_log_payloads() -> bool:
    """Determine if payloads should be logged based on environment"""
    return (
        os.getenv('LOG_PAYLOADS', 'false').lower() == 'true' and
        os.getenv('ENVIRONMENT', 'development') == 'development'
    )

def log_request_payload(payload: Any, operation: str = "request") -> None:
    """Log request payload with sanitization and truncation"""
    if not should_log_payloads():
        return
    
    try:
        # Convert to string for processing
        if isinstance(payload, (dict, list)):
            payload_str = json.dumps(payload, indent=2)
        else:
            payload_str = str(payload)
        
        # Sanitize sensitive data
        sanitized_payload = sanitize_json_data(payload)
        sanitized_str = json.dumps(sanitized_payload, indent=2) if isinstance(sanitized_payload, (dict, list)) else str(sanitized_payload)
        
        # Truncate if too large
        truncated_payload = truncate_payload(sanitized_str)
        
        logger.debug(f"{operation.capitalize()} payload", 
                    payload=truncated_payload,
                    original_size=len(payload_str),
                    sanitized_size=len(sanitized_str))
        
    except Exception as e:
        logger.warning(f"Failed to log {operation} payload", error=str(e))

def log_response_payload(payload: Any, operation: str = "response") -> None:
    """Log response payload with sanitization and truncation"""
    if not should_log_payloads():
        return
    
    try:
        # Convert to string for processing
        if isinstance(payload, (dict, list)):
            payload_str = json.dumps(payload, indent=2)
        else:
            payload_str = str(payload)
        
        # Sanitize sensitive data
        sanitized_payload = sanitize_json_data(payload)
        sanitized_str = json.dumps(sanitized_payload, indent=2) if isinstance(sanitized_payload, (dict, list)) else str(sanitized_payload)
        
        # Truncate if too large
        truncated_payload = truncate_payload(sanitized_str)
        
        logger.debug(f"{operation.capitalize()} payload", 
                    payload=truncated_payload,
                    original_size=len(payload_str),
                    sanitized_size=len(sanitized_str))
        
    except Exception as e:
        logger.warning(f"Failed to log {operation} payload", error=str(e))
