/**
 * Calculate text statistics
 * @param {string} text - The text to analyze
 * @returns {Object} Statistics object
 */
export const calculateTextStats = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      characters: 0,
      charactersNoSpaces: 0,
      lines: 0,
      words: 0,
      size: '0 B'
    };
  }

  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const lines = text.split('\n').length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  
  // Calculate size in bytes (UTF-8 encoding)
  const sizeInBytes = new Blob([text]).size;
  const size = formatFileSize(sizeInBytes);

  return {
    characters,
    charactersNoSpaces,
    lines,
    words,
    size,
    sizeInBytes
  };
};

/**
 * Format file size in human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

