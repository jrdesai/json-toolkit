import React from 'react';
import { Layout, Row, Col, Typography, Space, Divider } from 'antd';
import { GithubOutlined, BookOutlined, ApiOutlined, SafetyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';

const { Footer: AntFooter } = Layout;
const { Text, Link } = Typography;

const Footer = () => {
  const { isDark } = useTheme();
  const currentYear = new Date().getFullYear();

  const footerBg = isDark ? '#141414' : '#001529';
  const textColor = isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.65)';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.45)';

  return (
    <AntFooter style={{ 
      backgroundColor: footerBg,
      color: '#fff',
      padding: '40px 24px',
      marginTop: 'auto',
      transition: 'background-color 0.3s ease'
    }}>
      <div style={{ maxWidth: '1800px', margin: '0 auto' }}>
        <Row gutter={[32, 32]}>
          {/* Privacy & Security Section */}
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <SafetyOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block' }}>
                Privacy First
              </Text>
              <Text type="secondary" style={{ color: textColor, fontSize: '13px' }}>
                All processing is done client-side. Files are never stored, cached, or sent to servers.
              </Text>
              <Text type="secondary" style={{ color: textColor, fontSize: '13px' }}>
                Your data stays in your browser.
              </Text>
            </Space>
          </Col>

          {/* Quick Links Section */}
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <BookOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block' }}>
                Quick Links
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                       <Link 
                         href="https://github.com/jrdesai/json-toolkit#readme" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         style={{ color: textColor }}
                       >
                         Documentation
                       </Link>
                       <Link 
                         href="#"
                         onClick={(e) => {
                           e.preventDefault();
                           // Determine API URL - check if we're in development or production
                           const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                           const apiUrl = isDevelopment 
                             ? 'http://localhost:8000' 
                             : window.location.origin; // In production, assume same origin or configure via env
                           window.open(`${apiUrl}/docs`, '_blank');
                         }}
                         style={{ color: textColor, cursor: 'pointer' }}
                       >
                         API Documentation
                       </Link>
                       <Link 
                         href="https://github.com/jrdesai/json-toolkit#jsonpath-query" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         style={{ color: textColor }}
                       >
                         JSONPath Guide
                       </Link>
                       <Link 
                         href="https://github.com/jrdesai/json-toolkit/issues" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         style={{ color: textColor }}
                       >
                         Report Issue
                       </Link>
              </div>
            </Space>
          </Col>

          {/* Resources Section */}
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <ThunderboltOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block' }}>
                Resources
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <Text type="secondary" style={{ color: textColor, fontSize: '13px' }}>
                       <strong>Formats:</strong> JSON, XML, CSV, YAML
                     </Text>
                     <Text type="secondary" style={{ color: textColor, fontSize: '13px' }}>
                       <strong>Max File Size:</strong> 10MB
                     </Text>
                     <Text type="secondary" style={{ color: textColor, fontSize: '13px' }}>
                       <strong>JSONPath:</strong> Full support
                     </Text>
                     <Text type="secondary" style={{ color: textColor, fontSize: '13px' }}>
                       <strong>Views:</strong> Editor, Tree, Form
                     </Text>
              </div>
            </Space>
          </Col>

          {/* About Section */}
          <Col xs={24} sm={12} md={6}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <ApiOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <Text strong style={{ color: '#fff', fontSize: '16px', display: 'block' }}>
                About
              </Text>
                     <Text type="secondary" style={{ color: textColor, fontSize: '13px' }}>
                       Professional JSON editing, formatting, and conversion tools.
                     </Text>
                     <Space size="middle" style={{ marginTop: '8px' }}>
                       <Link 
                         href="https://github.com/jrdesai/json-toolkit" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         style={{ color: textColor }}
                       >
                         <GithubOutlined style={{ fontSize: '20px' }} />
                       </Link>
                       <Text type="secondary" style={{ color: textColor, fontSize: '12px' }}>
                         Version 1.0.0
                       </Text>
                     </Space>
                     <Text type="secondary" style={{ color: textColor, fontSize: '12px', marginTop: '8px' }}>
                       License: MIT
                     </Text>
            </Space>
          </Col>
        </Row>

        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.2)', margin: '32px 0 24px 0' }} />

        {/* Bottom Section */}
               <Row justify="space-between" align="middle">
                 <Col xs={24} sm={24} md={12}>
                   <Text type="secondary" style={{ color: textColor, fontSize: '13px' }}>
                     Made with ❤️ using React, FastAPI, and Monaco Editor
                   </Text>
                 </Col>
                 <Col xs={24} sm={24} md={12} style={{ textAlign: 'right' }}>
                   <Text type="secondary" style={{ color: textColor, fontSize: '13px' }}>
                     © {currentYear} JSON Toolkit. All rights reserved.
                   </Text>
                 </Col>
               </Row>

               {/* Technology Credits */}
               <Row style={{ marginTop: '16px' }}>
                 <Col span={24}>
                   <Text type="secondary" style={{ color: textSecondary, fontSize: '11px' }}>
                     Powered by: Monaco Editor • Ant Design • FastAPI • React • jsonpath-ng • PyYAML
                   </Text>
                 </Col>
               </Row>
      </div>
    </AntFooter>
  );
};

export default Footer;

