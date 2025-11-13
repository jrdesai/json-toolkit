import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';
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
  message 
} from 'antd';
import { 
  CopyOutlined, 
  ClearOutlined, 
  FormatPainterOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Content } = Layout;

const JsonFormatter = () => {
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

  // Click outside to close error panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (errorVisible && !event.target.closest('.floating-error-panel')) {
        clearErrors();
      }
    };

    if (errorVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [errorVisible]);

  // Helper function to get Monaco language based on format
  const getLanguageForFormat = (format) => {
    switch (format) {
      case 'json': return 'json';
      case 'xml': return 'xml';
      case 'yaml': return 'yaml';
      case 'csv': return 'csv';
      default: return 'json';
    }
  };

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

  const handleAction = async () => {
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
        message.success(`Query completed! Found ${response.data.count} match${response.data.count !== 1 ? 'es' : ''}`);
      } else {
        // Send to convert endpoint with format parameter
        const response = await axios.post(`http://localhost:8000/convert?format=${outputFormat}`, jsonData);
        setConvertedOutput(response.data.converted_data);
        setQueryResultCount(0);
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
  };

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
  const handleInputChange = (value) => {
    setInputJson(value);
    
    // Clear errors when user starts typing
    if (error && errorType === 'validation') {
      clearErrors();
    }
  };

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

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <Title level={1} style={{ color: '#1890ff', marginBottom: '8px' }}>
                    JSON Toolkit
                  </Title>
                  <Text type="secondary" style={{ fontSize: '16px' }}>
                    Professional JSON editing, formatting, and conversion tools
                  </Text>
          </div>

          {/* Main Content */}
          <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
            {/* Input Section */}
            <Col xs={24} lg={12}>
              <Card 
                title="Input JSON" 
                extra={
                  <Space>
                    <Select 
                      value={actionType}
                      onChange={setActionType}
                      style={{ width: 120 }}
                      options={[
                        { value: 'format', label: 'Format' },
                        { value: 'convert', label: 'Convert' },
                        { value: 'query', label: 'Query' }
                      ]}
                    />
                    {actionType === 'convert' && (
                      <Select 
                        value={outputFormat}
                        onChange={setOutputFormat}
                        style={{ width: 100 }}
                        options={[
                          { value: 'xml', label: 'XML' },
                          { value: 'csv', label: 'CSV' },
                          { value: 'yaml', label: 'YAML' }
                        ]}
                      />
                    )}
                    {actionType === 'query' && (
                      <Input
                        id="jsonpath-input"
                        name="jsonpath"
                        placeholder="JSONPath (e.g., $.users[*].name)"
                        value={jsonPath}
                        onChange={(e) => setJsonPath(e.target.value)}
                        style={{ width: 200 }}
                        onPressEnter={handleAction}
                        autoComplete="off"
                      />
                    )}
                    <Button 
                      type="primary" 
                      icon={<FormatPainterOutlined />}
                      onClick={handleAction}
                      loading={loading}
                    >
                      {actionType === 'format' ? 'Format' : actionType === 'query' ? 'Query' : 'Convert'}
                    </Button>
                    <Button 
                      icon={<ClearOutlined />}
                      onClick={handleClear}
                    >
                      Clear
                    </Button>
                  </Space>
                }
                style={{ height: '100%' }}
              >
                <div style={{ position: 'relative', height: '500px' }}>
                  <Editor
                    height="500px"
                    language="json"
                    value={inputJson}
                    onChange={handleInputChange}
                    theme="vs-dark"
                    options={{
                      lineNumbers: 'on',
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      automaticLayout: true,
                      wordWrap: 'on',
                      placeholder: 'Paste your JSON here...',
                    }}
                  />
                  
                </div>
              </Card>
            </Col>

            {/* Output Section */}
            <Col xs={24} lg={12}>
              <Card 
                title={
                  actionType === 'query' 
                    ? `Query Results${queryResultCount > 0 ? ` (${queryResultCount} match${queryResultCount !== 1 ? 'es' : ''})` : ''}`
                    : `Output (${actionType === 'format' ? 'JSON' : outputFormat.toUpperCase()})`
                }
                extra={
                  convertedOutput && (
                    <Button 
                      type="default"
                      icon={<CopyOutlined />}
                      onClick={handleCopy}
                    >
                      Copy
                    </Button>
                  )
                }
                style={{ height: '100%' }}
              >
                <Editor
                  height="500px"
                  language={getLanguageForFormat(actionType === 'format' || actionType === 'query' ? 'json' : outputFormat)}
                  value={convertedOutput}
                  theme="vs-dark"
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
              </Card>
            </Col>
        </Row>

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
              backgroundColor: 'white',
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
                  e.target.style.backgroundColor = '#f5f5f5';
                  e.target.style.color = '#ff4d4f';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#999';
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
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
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
                      color: '#666',
                      marginBottom: '8px',
                      padding: '8px',
                      backgroundColor: '#e7f3ff',
                      borderRadius: '4px',
                      border: '1px solid #b3d9ff',
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
                      color: '#666',
                      marginBottom: '8px',
                      padding: '8px',
                      backgroundColor: '#fff3cd',
                      borderRadius: '4px',
                      border: '1px solid #ffeaa7',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
                      <strong>🔍 JSONPath:</strong>{' '}
                      <code style={{ 
                        backgroundColor: '#f0f0f0', 
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
                  color: '#666', 
                  fontStyle: 'italic',
                  padding: '8px 12px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  💡 <strong>Tip:</strong> Check for missing commas, brackets, or quotes in your JSON
                </div>
              )}
              {errorType === 'network' && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  fontStyle: 'italic',
                  padding: '8px 12px',
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  💡 <strong>Tip:</strong> Make sure the backend server is running on port 8000
                </div>
              )}
              {errorType === 'validation' && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  fontStyle: 'italic',
                  padding: '8px 12px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  💡 <strong>Tip:</strong> Ensure your JSON data is compatible with the selected format
                </div>
              )}
            </div>
          </div>
        )}

        {/* Example Section */}
        <Card title="Example JSON">
                <Editor
                  height="200px"
                  language="json"
                  value={exampleJson}
                  theme="vs-dark"
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
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default JsonFormatter;