import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import axios from 'axios';
// Lazy load Monaco Editor for better initial load
const Editor = React.lazy(() => import('@monaco-editor/react'));
import { 
  Layout, 
  Card, 
  Button, 
  Alert, 
  Typography, 
  Row, 
  Col, 
  Space,
  Select,
  Input,
  Collapse,
  message 
} from 'antd';
import { 
  CopyOutlined, 
  ClearOutlined, 
  FormatPainterOutlined,
  UploadOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons';
// Lazy load view components for code splitting
const JsonTreeView = React.lazy(() => import('./JsonTreeView'));
const JsonFormView = React.lazy(() => import('./JsonFormView'));
import Footer from './Footer';
import { isValidJson } from '../utils/jsonUtils';
import { useTheme } from '../contexts/ThemeContext';
import { calculateTextStats } from '../utils/textStats';

const { Title, Text } = Typography;
const { Content } = Layout;

const JsonFormatter = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [inputJson, setInputJson] = useState('');
  const [convertedOutput, setConvertedOutput] = useState('');
  const [actionType, setActionType] = useState('format'); // 'format', 'convert', or 'query'
  const [outputFormat, setOutputFormat] = useState('xml'); // Default to xml for convert
  const [jsonPath, setJsonPath] = useState(''); // JSONPath expression for query
  const [queryResultCount, setQueryResultCount] = useState(0); // Number of query results
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(''); // 'syntax', 'api', 'network', 'validation'
  const [errorDetails, setErrorDetails] = useState(null); // Detailed error info (line, column, snippet, etc.)
  const [loading, setLoading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 992);
  const [viewMode, setViewMode] = useState('editor'); // 'editor', 'tree', or 'form'
  const [outputViewMode, setOutputViewMode] = useState('editor'); // View mode for output
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef(null);

  // Click outside to close error panel
  useEffect(() => {
    if (!errorVisible) return;

    const handleClickOutside = (event) => {
      if (!event.target.closest('.floating-error-panel')) {
        clearErrors();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [errorVisible]);

  // Handle window resize for responsive controls - throttled for performance
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 992);
    };

    // Throttle resize events for better performance
    let timeoutId;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', throttledResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener('resize', throttledResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Helper function to get Monaco language based on format - memoized
  const getLanguageForFormat = useCallback((format) => {
    switch (format) {
      case 'json': return 'json';
      case 'xml': return 'xml';
      case 'yaml': return 'yaml';
      case 'csv': return 'csv';
      default: return 'json';
    }
  }, []);

  // Removed frontend validation - backend handles all validation

  // Helper function to set error with type
  const setErrorWithType = (message, type = 'api', details = null) => {
    setError(message);
    setErrorType(type);
    setErrorDetails(details);
    setErrorVisible(true);
  };

  // Helper function to clear errors
  const clearErrors = () => {
    setErrorVisible(false);
    setError('');
    setErrorType('');
    setErrorDetails(null);
  };

  const handleAction = useCallback(async () => {
    // Clear previous errors
    clearErrors();
    
    if (!inputJson.trim()) {
      setErrorWithType('Please enter JSON data to process', 'validation');
      return;
    }

    // Validate JSONPath for query action
    if (actionType === 'query' && !jsonPath.trim()) {
      setErrorWithType('Please enter a JSONPath expression', 'validation');
      return;
    }

    setLoading(true);

    try {
      // Send raw JSON string to backend - let backend handle validation
      const jsonData = inputJson.trim();
      
      if (actionType === 'format') {
        // Send to format endpoint
        const response = await axios.post('http://localhost:8000/format', jsonData);
        setConvertedOutput(response.data.formatted_json);
        setQueryResultCount(0);
        setOutputViewMode('editor'); // Reset to editor view for formatted output
        message.success('JSON formatted successfully!');
      } else if (actionType === 'query') {
        // Parse JSON data for query endpoint
        let parsedJson;
        try {
          parsedJson = JSON.parse(jsonData);
        } catch (parseError) {
          setErrorWithType('Invalid JSON: ' + parseError.message, 'validation');
          setLoading(false);
          return;
        }
        
        // Send to query endpoint with JSONPath expression
        const response = await axios.post('http://localhost:8000/query', {
          root: parsedJson,
          path: jsonPath.trim()
        });
        setConvertedOutput(response.data.formatted_results);
        setQueryResultCount(response.data.count);
        setOutputViewMode('editor'); // Reset to editor view for query results
        message.success(`Query completed! Found ${response.data.count} match${response.data.count !== 1 ? 'es' : ''}`);
      } else {
        // Send to convert endpoint with format parameter
        const response = await axios.post(`http://localhost:8000/convert?format=${outputFormat}`, jsonData);
        setConvertedOutput(response.data.converted_data);
        setQueryResultCount(0);
        setOutputViewMode('editor'); // Always use editor for non-JSON formats
        message.success(`${outputFormat.toUpperCase()} conversion successful!`);
      }
    } catch (err) {
      // Log error for debugging
      console.error('API Error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        actionType
      });
      
      let errorMessage = '';
      let errorType = 'api';
      
      if (err.response?.status === 422) {
        // Validation error from backend
        const errorDetail = err.response.data?.detail;
        if (typeof errorDetail === 'object') {
          // Use formatted message if available, otherwise construct one
          if (errorDetail.formatted_message) {
            errorMessage = errorDetail.formatted_message;
          } else if (errorDetail.message) {
            // Build detailed message with line/column info if available
            let msg = errorDetail.message;
            if (errorDetail.line !== undefined) {
              msg += `\n\nLocation: Line ${errorDetail.line}`;
              if (errorDetail.column !== undefined) {
                msg += `, Column ${errorDetail.column}`;
              }
            }
            errorMessage = msg;
          } else if (errorDetail.error) {
            errorMessage = `${errorDetail.error}: ${errorDetail.message || 'Invalid input'}`;
          } else {
            errorMessage = JSON.stringify(errorDetail);
          }
          
          // Store detailed error information
          const details = {
            line: errorDetail.line,
            column: errorDetail.column,
            position: errorDetail.position,
            snippet: errorDetail.snippet,
            path: errorDetail.path,
            formatted_message: errorDetail.formatted_message
          };
          setErrorWithType(errorMessage, 'validation', details);
          return; // Early return since we set the error above
        } else if (errorDetail) {
          errorMessage = String(errorDetail);
        } else {
          errorMessage = 'Validation error: Invalid input';
        }
        errorType = 'validation';
      } else if (err.response?.status === 500) {
        // Server error
        const errorDetail = err.response.data?.detail;
        if (typeof errorDetail === 'object') {
          errorMessage = errorDetail.message || errorDetail.error || 'Internal server error';
        } else {
          errorMessage = errorDetail || 'Internal server error';
        }
        errorType = 'api';
      } else if (err.response?.data?.detail) {
        // Other API errors
        const errorDetail = err.response.data.detail;
        if (typeof errorDetail === 'object') {
          errorMessage = errorDetail.message || errorDetail.error || 'API Error';
        } else {
          errorMessage = String(errorDetail);
        }
        errorType = 'api';
      } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        // Network error
        errorMessage = 'Network error: Unable to connect to the server. Please check your connection.';
        errorType = 'network';
      } else {
        // Generic error
        const actionVerb = actionType === 'format' ? 'formatting' : actionType === 'query' ? 'querying' : 'converting';
        errorMessage = `An unexpected error occurred while ${actionVerb} JSON.`;
        errorType = 'api';
      }
      
      setErrorWithType(errorMessage, errorType);
      
      // Show toast notification for non-validation errors
      if (errorType !== 'validation') {
        message.error({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {getErrorDisplayProps(errorType).icon} {getErrorDisplayProps(errorType).title}
              </div>
              <div style={{ fontSize: '12px' }}>{errorMessage}</div>
            </div>
          ),
          duration: 6,
          style: { marginTop: '20px' }
        });
      }
    } finally {
      setLoading(false);
    }
  }, [actionType, inputJson, jsonPath, outputFormat]);

  const handleClear = () => {
    setInputJson('');
    setConvertedOutput('');
    setJsonPath('');
    setQueryResultCount(0);
    clearErrors();
    message.info('Cleared all content');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(convertedOutput);
    message.success('Copied to clipboard!');
  };

  const handleCopyExample = () => {
    navigator.clipboard.writeText(exampleJson);
    message.success('Example JSON copied to clipboard!');
  };

  // Helper function to get error icon and color based on error type
  const getErrorDisplayProps = (errorType) => {
    switch (errorType) {
      case 'syntax':
        return {
          type: 'error',
          icon: '⚠️',
          color: '#ff4d4f',
          title: 'JSON Syntax Error'
        };
      case 'validation':
        return {
          type: 'warning',
          icon: '⚠️',
          color: '#faad14',
          title: 'Validation Error'
        };
      case 'network':
        return {
          type: 'error',
          icon: '🌐',
          color: '#ff4d4f',
          title: 'Network Error'
        };
      case 'api':
        return {
          type: 'error',
          icon: '🔧',
          color: '#ff4d4f',
          title: 'Server Error'
        };
      default:
        return {
          type: 'error',
          icon: '❌',
          color: '#ff4d4f',
          title: 'Error'
        };
    }
  };

  // Simplified input change handler - no frontend validation
  const handleInputChange = useCallback((value) => {
    setInputJson(value);
    
    // Clear errors when user starts typing
    if (error && errorType === 'validation') {
      clearErrors();
    }
  }, [error, errorType]);

  // Handle view mode change - validate JSON if switching to tree/form view
  const handleViewModeChange = useCallback((mode) => {
    if (mode === 'tree' || mode === 'form') {
      if (!isValidJson(inputJson)) {
        message.warning('Invalid JSON - Cannot switch to tree/form view');
        return;
      }
    }
    setViewMode(mode);
  }, [inputJson]);

  // Handle output view mode change
  const handleOutputViewModeChange = useCallback((mode) => {
    if (mode === 'tree' || mode === 'form') {
      if (!isValidJson(convertedOutput)) {
        message.warning('Invalid JSON - Cannot switch to tree/form view');
        return;
      }
    }
    setOutputViewMode(mode);
  }, [convertedOutput]);

  // Handle form/tree view changes - sync back to editor
  const handleInputViewChange = useCallback((newJsonString) => {
    setInputJson(newJsonString);
  }, []);

  // Reset view modes when clearing
  const handleClearWithViews = () => {
    handleClear();
    setViewMode('editor');
    setOutputViewMode('editor');
  };

  // Read file content as text - memoized
  const readFileContent = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.onerror = (e) => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  }, []);

  // Handle file upload - memoized to prevent recreation
  const handleFileUpload = useCallback(async (file) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      message.error('Please upload a JSON file (.json)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      message.error('File size exceeds 10MB limit');
      return;
    }

    try {
      const fileContent = await readFileContent(file);
      
      // Validate JSON
      try {
        JSON.parse(fileContent);
      } catch (parseError) {
        message.error('Invalid JSON file. Please check the file content.');
        return;
      }

      setInputJson(fileContent);
      message.success(`File "${file.name}" loaded successfully`);
      
      // Clear the file input to ensure privacy - file is not stored
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      message.error('Failed to read file: ' + error.message);
    }
  }, [readFileContent]);

  // Handle file input change - memoized
  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  // Drag and drop handlers - memoized for performance
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const jsonFile = files.find(file => file.name.toLowerCase().endsWith('.json'));
    
    if (jsonFile) {
      handleFileUpload(jsonFile);
    } else {
      message.error('Please drop a JSON file (.json)');
    }
  }, [handleFileUpload]);

  const exampleJson = `{
  "name": "John Doe",
  "age": 30,
  "city": "New York",
  "hobbies": ["reading", "coding", "traveling"],
  "address": {
    "street": "123 Main St",
    "zipcode": "10001"
  }
}`;

  // Get Monaco editor theme based on app theme
  const monacoTheme = isDark ? 'vs-dark' : 'vs';

  // Theme-aware background colors
  const backgroundColor = isDark ? '#141414' : '#f5f5f5';
  const cardBackground = isDark ? '#1f1f1f' : '#ffffff';
  const textColor = isDark ? '#ffffff' : undefined;

  // Calculate statistics for input and output
  const inputStats = useMemo(() => calculateTextStats(inputJson), [inputJson]);
  const outputStats = useMemo(() => calculateTextStats(convertedOutput), [convertedOutput]);

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1800px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
            <Button
              type="text"
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                fontSize: '18px',
                color: isDark ? '#fff' : '#000',
              }}
              title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            />
            <Title level={1} style={{ color: '#1890ff', marginBottom: '8px' }}>
              JSON Toolkit
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Professional JSON editing, formatting, and conversion tools
            </Text>
          </div>

          {/* Main Content */}
          <Row gutter={[16, 24]} align="stretch">
            {/* Input Section */}
            <Col xs={24} lg={10}>
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span>Input JSON</span>
                    <Space size="small" split={<span style={{ color: isDark ? '#666' : '#d9d9d9' }}>|</span>}>
                      {inputJson && (
                        <>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {inputStats.characters.toLocaleString()} chars
                          </Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {inputStats.lines} {inputStats.lines === 1 ? 'line' : 'lines'}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {inputStats.size}
                          </Text>
                        </>
                      )}
                      <Button
                        icon={<UploadOutlined />}
                        onClick={() => fileInputRef.current?.click()}
                        size="small"
                      >
                        Upload File
                      </Button>
                    </Space>
                  </div>
                }
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    position: 'relative',
                    flex: 1,
                    minHeight: 'calc(100vh - 280px)',
                    border: isDragging ? '2px dashed #1890ff' : '2px dashed transparent',
                    borderRadius: '4px',
                    transition: 'border-color 0.3s',
                    backgroundColor: isDragging ? 'rgba(24, 144, 255, 0.05)' : 'transparent'
                  }}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {isDragging && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(24, 144, 255, 0.1)',
                      zIndex: 10,
                      borderRadius: '4px'
                    }}>
                      <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                        Drop JSON file here
                      </Text>
                    </div>
                  )}
                  <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center', color: '#999', height: 'calc(100vh - 280px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading editor...</div>}>
                    <Editor
                      height="calc(100vh - 280px)"
                      language="json"
                      value={inputJson}
                      onChange={handleInputChange}
                      theme={monacoTheme}
                      options={{
                        lineNumbers: 'on',
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        automaticLayout: true,
                        wordWrap: 'on',
                        placeholder: 'Paste your JSON here or drag & drop a JSON file...',
                      }}
                    />
                  </Suspense>
                </div>
              </Card>
            </Col>

            {/* Controls Section - Between Input and Output (Desktop) */}
            {isDesktop && (
            <Col xs={0} lg={4}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'center',
                height: '100%',
                padding: '16px 8px 0 8px'
              }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ fontSize: '13px', marginBottom: '4px', display: 'block', color: '#1890ff' }}>Action</Text>
                    <Select 
                      value={actionType}
                      onChange={setActionType}
                      style={{ width: '100%', fontWeight: 'bold' }}
                      options={[
                        { value: 'format', label: <span style={{ fontWeight: 'bold' }}>Format</span> },
                        { value: 'convert', label: <span style={{ fontWeight: 'bold' }}>Convert</span> },
                        { value: 'query', label: <span style={{ fontWeight: 'bold' }}>Query</span> }
                      ]}
                    />
                  </div>
                  {actionType === 'convert' && (
                    <div>
                      <Text strong style={{ fontSize: '13px', marginBottom: '4px', display: 'block', color: '#1890ff' }}>Output Format</Text>
                      <Select 
                        value={outputFormat}
                        onChange={setOutputFormat}
                        style={{ width: '100%', fontWeight: 'bold' }}
                        options={[
                          { value: 'xml', label: <span style={{ fontWeight: 'bold' }}>XML</span> },
                          { value: 'csv', label: <span style={{ fontWeight: 'bold' }}>CSV</span> },
                          { value: 'yaml', label: <span style={{ fontWeight: 'bold' }}>YAML</span> }
                        ]}
                      />
                    </div>
                  )}
                  {actionType === 'query' && (
                    <div>
                      <Text strong style={{ fontSize: '13px', marginBottom: '4px', display: 'block', color: '#1890ff' }}>JSONPath</Text>
                      <Input
                        id="jsonpath-input"
                        name="jsonpath"
                        placeholder="JSONPath"
                        value={jsonPath}
                        onChange={(e) => setJsonPath(e.target.value)}
                        style={{ width: '100%', fontWeight: 'bold' }}
                        onPressEnter={handleAction}
                        autoComplete="off"
                      />
                    </div>
                  )}
                  <Button 
                    type="primary" 
                    icon={<FormatPainterOutlined />}
                    onClick={handleAction}
                    loading={loading}
                    block
                    size="large"
                    style={{ fontWeight: 'bold', fontSize: '15px', height: '40px' }}
                  >
                    {actionType === 'format' ? 'Format' : actionType === 'query' ? 'Query' : 'Convert'}
                  </Button>
                  <Button 
                    icon={<ClearOutlined />}
                    onClick={handleClearWithViews}
                    block
                    size="large"
                    style={{ fontWeight: 'bold', fontSize: '15px', height: '40px' }}
                  >
                    Clear
                  </Button>
                </Space>
              </div>
            </Col>
            )}

            {/* Output Section */}
            <Col xs={24} lg={isDesktop ? 10 : 12}>
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                    <span>
                      {actionType === 'query' 
                        ? `Query Results${queryResultCount > 0 ? ` (${queryResultCount} match${queryResultCount !== 1 ? 'es' : ''})` : ''}`
                        : `Output (${actionType === 'format' ? 'JSON' : outputFormat.toUpperCase()})`
                      }
                    </span>
                    <Space size="small" split={<span style={{ color: isDark ? '#666' : '#d9d9d9' }}>|</span>}>
                      {convertedOutput && (
                        <>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {outputStats.characters.toLocaleString()} chars
                          </Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {outputStats.lines} {outputStats.lines === 1 ? 'line' : 'lines'}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {outputStats.size}
                          </Text>
                        </>
                      )}
                      {(actionType === 'format' || actionType === 'query') && (
                        <Select
                          value={outputViewMode}
                          onChange={handleOutputViewModeChange}
                          size="middle"
                          style={{ width: 140, fontWeight: 'bold' }}
                          options={[
                            { value: 'editor', label: <span style={{ fontWeight: 'bold' }}>Editor</span> },
                            { value: 'tree', label: <span style={{ fontWeight: 'bold' }}>Tree View</span> },
                            { value: 'form', label: <span style={{ fontWeight: 'bold' }}>Form View</span> }
                          ]}
                        />
                      )}
                      {convertedOutput && (
                        <Button 
                          type="default"
                          icon={<CopyOutlined />}
                          onClick={handleCopy}
                          size="small"
                        >
                          Copy
                        </Button>
                      )}
                    </Space>
                  </div>
                }
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}
              >
                <div style={{ position: 'relative', flex: 1, minHeight: 'calc(100vh - 280px)' }}>
                  {(actionType === 'format' || actionType === 'query') ? (
                    <>
                      {outputViewMode === 'editor' && (
                        <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center', color: '#999', height: 'calc(100vh - 280px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading editor...</div>}>
                          <Editor
                            height="calc(100vh - 280px)"
                            language="json"
                            value={convertedOutput}
                            theme={monacoTheme}
                            options={{
                              readOnly: true,
                              lineNumbers: 'on',
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              fontSize: 14,
                              automaticLayout: true,
                              wordWrap: 'on',
                            }}
                          />
                        </Suspense>
                      )}
                      {outputViewMode === 'tree' && (
                        <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Loading tree view...</div>}>
                          <JsonTreeView
                            jsonString={convertedOutput}
                            readOnly={true}
                          />
                        </Suspense>
                      )}
                      {outputViewMode === 'form' && (
                        <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Loading form view...</div>}>
                          <JsonFormView
                            jsonString={convertedOutput}
                            readOnly={true}
                          />
                        </Suspense>
                      )}
                    </>
                  ) : (
                    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center', color: '#999', height: 'calc(100vh - 280px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading editor...</div>}>
                      <Editor
                        height="calc(100vh - 280px)"
                        language={getLanguageForFormat(outputFormat)}
                        value={convertedOutput}
                        theme={monacoTheme}
                        options={{
                          readOnly: true,
                          lineNumbers: 'on',
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          fontSize: 14,
                          automaticLayout: true,
                          wordWrap: 'on',
                        }}
                      />
                    </Suspense>
                  )}
                </div>
              </Card>
            </Col>
          </Row>

            {/* Controls Section - Mobile (below input) */}
            {!isDesktop && (
            <Row style={{ marginTop: '16px' }}>
              <Col span={24}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  padding: '16px 0'
                }}>
                  <Space size="middle" wrap direction="vertical" style={{ width: '100%' }}>
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block', color: '#1890ff' }}>Action Type</Text>
                      <Select 
                        value={actionType}
                        onChange={setActionType}
                        style={{ width: '100%', maxWidth: '200px', fontWeight: 'bold' }}
                        size="large"
                        options={[
                          { value: 'format', label: <span style={{ fontWeight: 'bold' }}>Format</span> },
                          { value: 'convert', label: <span style={{ fontWeight: 'bold' }}>Convert</span> },
                          { value: 'query', label: <span style={{ fontWeight: 'bold' }}>Query</span> }
                        ]}
                      />
                    </div>
                    {actionType === 'convert' && (
                      <div style={{ width: '100%', textAlign: 'center' }}>
                        <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block', color: '#1890ff' }}>Output Format</Text>
                        <Select 
                          value={outputFormat}
                          onChange={setOutputFormat}
                          style={{ width: '100%', maxWidth: '200px', fontWeight: 'bold' }}
                          size="large"
                          options={[
                            { value: 'xml', label: <span style={{ fontWeight: 'bold' }}>XML</span> },
                            { value: 'csv', label: <span style={{ fontWeight: 'bold' }}>CSV</span> },
                            { value: 'yaml', label: <span style={{ fontWeight: 'bold' }}>YAML</span> }
                          ]}
                        />
                      </div>
                    )}
                    {actionType === 'query' && (
                      <div style={{ width: '100%', textAlign: 'center' }}>
                        <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block', color: '#1890ff' }}>JSONPath</Text>
                        <Input
                          id="jsonpath-input-mobile"
                          name="jsonpath"
                          placeholder="JSONPath (e.g., $.users[*].name)"
                          value={jsonPath}
                          onChange={(e) => setJsonPath(e.target.value)}
                          style={{ width: '100%', maxWidth: '300px', fontWeight: 'bold' }}
                          size="large"
                          onPressEnter={handleAction}
                          autoComplete="off"
                        />
                      </div>
                    )}
                    <Button 
                      type="primary" 
                      icon={<FormatPainterOutlined />}
                      onClick={handleAction}
                      loading={loading}
                      size="large"
                      style={{ fontWeight: 'bold', fontSize: '16px', height: '45px', minWidth: '150px' }}
                    >
                      {actionType === 'format' ? 'Format' : actionType === 'query' ? 'Query' : 'Convert'}
                    </Button>
                    <Button 
                      icon={<ClearOutlined />}
                      onClick={handleClearWithViews}
                      size="large"
                      style={{ fontWeight: 'bold', fontSize: '16px', height: '45px', minWidth: '150px' }}
                    >
                      Clear
                    </Button>
                  </Space>
                </div>
              </Col>
            </Row>
            )}

        {/* Floating Error Panel */}
        {error && errorVisible && (
          <div 
            className="floating-error-panel" 
            style={{
              position: 'fixed',
              top: '50%',
              left: '20px',
              transform: 'translateY(-50%)',
              width: '450px',
              maxHeight: '80vh',
              backgroundColor: isDark ? '#1f1f1f' : 'white',
              border: `2px solid ${getErrorDisplayProps(errorType).color}`,
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: `1px solid ${getErrorDisplayProps(errorType).color}`,
              backgroundColor: `${getErrorDisplayProps(errorType).color}10`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>
                  {getErrorDisplayProps(errorType).icon}
                </span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: getErrorDisplayProps(errorType).color,
                  fontSize: '16px'
                }}>
                  {getErrorDisplayProps(errorType).title}
                </span>
              </div>
              <button
                onClick={clearErrors}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '4px',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = isDark ? '#2d2d2d' : '#f5f5f5';
                  e.target.style.color = '#ff4d4f';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = isDark ? '#999' : '#999';
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ 
              padding: '20px', 
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              minHeight: 0
            }}>
              {/* Error Message */}
              <div style={{ 
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                fontSize: '13px',
                backgroundColor: isDark ? '#2d2d2d' : '#f8f9fa',
                color: isDark ? '#fff' : '#000',
                padding: '12px',
                borderRadius: '6px',
                border: `1px solid ${isDark ? '#444' : '#e9ecef'}`,
                marginBottom: '12px',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap',
                maxWidth: '100%',
                overflow: 'hidden'
              }}>
                {error}
              </div>

              {/* Detailed Error Information */}
              {errorDetails && (
                <div style={{ marginBottom: '12px' }}>
                  {/* Line and Column Info */}
                  {(errorDetails.line !== undefined || errorDetails.column !== undefined) && (
                    <div style={{
                      fontSize: '12px',
                      color: isDark ? '#ccc' : '#666',
                      marginBottom: '8px',
                      padding: '8px',
                      backgroundColor: isDark ? '#1a3a5c' : '#e7f3ff',
                      borderRadius: '4px',
                      border: `1px solid ${isDark ? '#2d4a6b' : '#b3d9ff'}`,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
                      <strong>📍 Location:</strong>{' '}
                      {errorDetails.line !== undefined && `Line ${errorDetails.line}`}
                      {errorDetails.line !== undefined && errorDetails.column !== undefined && ', '}
                      {errorDetails.column !== undefined && `Column ${errorDetails.column}`}
                      {errorDetails.position !== undefined && ` (Position ${errorDetails.position})`}
                    </div>
                  )}

                  {/* Code Snippet */}
                  {errorDetails.snippet && (
                    <div style={{
                      fontSize: '11px',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      backgroundColor: '#2d2d2d',
                      color: '#f8f8f2',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #444',
                      marginBottom: '8px',
                      overflowX: 'auto',
                      overflowY: 'auto',
                      maxHeight: '200px',
                      whiteSpace: 'pre',
                      lineHeight: '1.5',
                      wordBreak: 'break-all',
                      maxWidth: '100%'
                    }}>
                      {errorDetails.snippet.split('\n').map((line, idx) => (
                        <div key={idx} style={{
                          color: line.startsWith('>>>') ? '#ff6b6b' : '#f8f8f2',
                          marginBottom: line.startsWith('^') ? '4px' : '0',
                          minWidth: 'max-content'
                        }}>
                          {line}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* JSONPath Info */}
                  {errorDetails.path && (
                    <div style={{
                      fontSize: '12px',
                      color: isDark ? '#ccc' : '#666',
                      marginBottom: '8px',
                      padding: '8px',
                      backgroundColor: isDark ? '#4a3a1a' : '#fff3cd',
                      borderRadius: '4px',
                      border: `1px solid ${isDark ? '#6b5a2d' : '#ffeaa7'}`,
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
                      <strong>🔍 JSONPath:</strong>{' '}
                      <code style={{ 
                        backgroundColor: isDark ? '#2d2d2d' : '#f0f0f0',
                        color: isDark ? '#fff' : '#000',
                        padding: '2px 4px', 
                        borderRadius: '3px',
                        wordBreak: 'break-all',
                        overflowWrap: 'break-word',
                        display: 'inline-block',
                        maxWidth: '100%'
                      }}>
                        {errorDetails.path}
                      </code>
                    </div>
                  )}
                </div>
              )}
              
              {errorType === 'syntax' && (
                <div style={{ 
                  fontSize: '12px', 
                  color: isDark ? '#ccc' : '#666', 
                  fontStyle: 'italic',
                  padding: '8px 12px',
                  backgroundColor: isDark ? '#4a3a1a' : '#fff3cd',
                  border: `1px solid ${isDark ? '#6b5a2d' : '#ffeaa7'}`,
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  💡 <strong>Tip:</strong> Check for missing commas, brackets, or quotes in your JSON
                </div>
              )}
              {errorType === 'network' && (
                <div style={{ 
                  fontSize: '12px', 
                  color: isDark ? '#ccc' : '#666', 
                  fontStyle: 'italic',
                  padding: '8px 12px',
                  backgroundColor: isDark ? '#4a1a1a' : '#f8d7da',
                  border: `1px solid ${isDark ? '#6b2d2d' : '#f5c6cb'}`,
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  💡 <strong>Tip:</strong> Make sure the backend server is running on port 8000
                </div>
              )}
              {errorType === 'validation' && (
                <div style={{ 
                  fontSize: '12px', 
                  color: isDark ? '#ccc' : '#666', 
                  fontStyle: 'italic',
                  padding: '8px 12px',
                  backgroundColor: isDark ? '#4a3a1a' : '#fff3cd',
                  border: `1px solid ${isDark ? '#6b5a2d' : '#ffeaa7'}`,
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  💡 <strong>Tip:</strong> Ensure your JSON data is compatible with the selected format
                </div>
              )}
            </div>
          </div>
        )}

        {/* Example Section - Collapsible */}
        <Collapse
          items={[
            {
              key: '1',
              label: <span style={{ fontSize: '16px', fontWeight: 500 }}>Example JSON</span>,
              children: (
                <div>
                  <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="default"
                      icon={<CopyOutlined />}
                      onClick={handleCopyExample}
                      size="small"
                    >
                      Copy Example
                    </Button>
                  </div>
                  <Editor
                    height="200px"
                    language="json"
                    value={exampleJson}
                    theme={monacoTheme}
                    options={{
                      readOnly: true,
                      lineNumbers: 'on',
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      automaticLayout: true,
                      wordWrap: 'on',
                    }}
                  />
                </div>
              ),
            },
          ]}
          defaultActiveKey={[]}
          style={{ marginTop: '24px' }}
        />
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default JsonFormatter;