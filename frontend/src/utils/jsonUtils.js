/**
 * Utility functions for JSON conversion and validation
 */

/**
 * Safely parse JSON string to object
 * @param {string} jsonString - JSON string to parse
 * @returns {Object|Array|null} Parsed JSON object or null if invalid
 */
export const parseJsonSafely = (jsonString) => {
  if (!jsonString || !jsonString.trim()) {
    return null;
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return null;
  }
};

/**
 * Check if a value is valid JSON
 * @param {string} jsonString - JSON string to validate
 * @returns {boolean} True if valid JSON
 */
export const isValidJson = (jsonString) => {
  if (!jsonString || !jsonString.trim()) {
    return false;
  }
  
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Convert JSON object to formatted string
 * @param {Object|Array} jsonObject - JSON object to stringify
 * @param {number} indent - Indentation spaces (default: 2)
 * @returns {string} Formatted JSON string
 */
export const stringifyJson = (jsonObject, indent = 2) => {
  try {
    return JSON.stringify(jsonObject, null, indent);
  } catch (error) {
    return '';
  }
};

/**
 * Get the type of a JSON value
 * @param {*} value - Value to check
 * @returns {string} Type of the value
 */
export const getJsonValueType = (value) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value;
};

