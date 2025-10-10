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
  const [actionType, setActionType] = useState('format'); // 'format' or 'convert'
  const [outputFormat, setOutputFormat] = useState('xml'); // Default to xml for convert
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(''); // 'syntax', 'api', 'network', 'validation'
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

  // Helper function to validate JSON syntax
  const validateJsonSyntax = (jsonString) => {
    try {
      JSON.parse(jsonString);
      return { isValid: true, error: null };
    } catch (error) {
      return { 
        isValid: false, 
        error: {
          message: error.message,
          line: error.message.match(/position (\d+)/)?.[1] || 'unknown',
          type: 'syntax'
        }
      };
    }
  };

  // Helper function to set error with type
  const setErrorWithType = (message, type = 'api') => {
    setError(message);
    setErrorType(type);
    setErrorVisible(true);
  };

  // Helper function to clear errors
  const clearErrors = () => {
    setErrorVisible(false);
    setError('');
    setErrorType('');
  };

  const handleAction = async () => {
    // Clear previous errors
    clearErrors();
    
    if (!inputJson.trim()) {
      setErrorWithType('Please enter JSON data to process', 'validation');
      return;
    }

    // Validate JSON syntax first
    const validation = validateJsonSyntax(inputJson);
    if (!validation.isValid) {
      setErrorWithType(
        `Invalid JSON syntax: ${validation.error.message}`,
        'syntax'
      );
      return;
    }

    setLoading(true);

    try {
      // Parse the input to validate it's valid JSON
      const parsedJson = JSON.parse(inputJson);
      
      if (actionType === 'format') {
        // Send to format endpoint
        const response = await axios.post('http://localhost:8000/format', parsedJson);
        setConvertedOutput(response.data.formatted_json);
        message.success('JSON formatted successfully!');
      } else {
        // Send to convert endpoint with format parameter
        const response = await axios.post(`http://localhost:8000/convert?format=${outputFormat}`, parsedJson);
        setConvertedOutput(response.data.converted_data);
        message.success(`${outputFormat.toUpperCase()} conversion successful!`);
      }
    } catch (err) {
      let errorMessage = '';
      let errorType = 'api';
      
      if (err.response?.status === 422) {
        // Validation error from backend
        errorMessage = `Invalid data format: ${err.response.data.detail}`;
        errorType = 'validation';
      } else if (err.response?.status === 500) {
        // Server error
        errorMessage = `Server error: ${err.response.data.detail || 'Internal server error'}`;
        errorType = 'api';
      } else if (err.response?.data?.detail) {
        // Other API errors
        errorMessage = `API Error: ${err.response.data.detail}`;
        errorType = 'api';
      } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        // Network error
        errorMessage = 'Network error: Unable to connect to the server. Please check your connection.';
        errorType = 'network';
      } else if (err instanceof SyntaxError) {
        // JSON parsing error (shouldn't happen due to pre-validation)
        errorMessage = 'Invalid JSON format. Please check your input.';
        errorType = 'syntax';
      } else {
        // Generic error
        errorMessage = `An unexpected error occurred while ${actionType === 'format' ? 'formatting' : 'converting'} JSON.`;
        errorType = 'api';
      }
      
      setErrorWithType(errorMessage, errorType);
      
      // Show toast notification for non-syntax errors
      if (errorType !== 'syntax') {
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

  // Real-time JSON validation
  const handleInputChange = (value) => {
    setInputJson(value);
    
    // Clear errors when user starts typing
    if (error && errorType === 'syntax') {
      clearErrors();
    }
    
    // Real-time validation for non-empty input
    if (value.trim() && value.trim().length > 10) {
      const validation = validateJsonSyntax(value);
      if (!validation.isValid) {
        setErrorWithType(
          `Invalid JSON syntax: ${validation.error.message}`,
          'syntax'
        );
      }
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
                        { value: 'convert', label: 'Convert' }
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
                    <Button 
                      type="primary" 
                      icon={<FormatPainterOutlined />}
                      onClick={handleAction}
                      loading={loading}
                    >
                      {actionType === 'format' ? 'Format' : 'Convert'}
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
                title={`Output (${actionType === 'format' ? 'JSON' : outputFormat.toUpperCase()})`}
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
                  language={getLanguageForFormat(actionType === 'format' ? 'json' : outputFormat)}
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
              width: '350px',
              maxHeight: '400px',
              backgroundColor: 'white',
              border: `2px solid ${getErrorDisplayProps(errorType).color}`,
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              zIndex: 1000
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
            <div style={{ padding: '20px', maxHeight: '300px', overflow: 'auto' }}>
              <div style={{ 
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                fontSize: '13px',
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                marginBottom: '12px',
                wordBreak: 'break-word',
                lineHeight: '1.4'
              }}>
                {error}
              </div>
              
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