import React, { useMemo, useState, useCallback, memo, useRef } from 'react';
import { Tree, message, Button, Space } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { parseJsonSafely, getJsonValueType } from '../utils/jsonUtils';
import { useTheme } from '../contexts/ThemeContext';

const JsonTreeView = memo(({ jsonString, onChange, readOnly = false }) => {
  const { isDark } = useTheme();
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);

  const jsonData = useMemo(() => {
    if (!jsonString || !jsonString.trim()) {
      return null;
    }
    
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      return null;
    }
  }, [jsonString]);

  const convertToTreeData = (data, parentKey = 'root', level = 0) => {
    const nodes = [];
    const valueType = getJsonValueType(data);

    if (valueType === 'object' && data !== null) {
      Object.keys(data).forEach((key, index) => {
        const nodeKey = parentKey === 'root' ? key : `${parentKey}.${key}`;
        const value = data[key];
        const childType = getJsonValueType(value);
        
        let title = (
          <Space>
            <span style={{ color: '#1890ff', fontWeight: 500 }}>{key}:</span>
            {childType === 'object' ? (
              <span style={{ color: '#52c41a' }}>
                {'{'} {Object.keys(value).length} {Object.keys(value).length === 1 ? 'property' : 'properties'} {'}'}
              </span>
            ) : childType === 'array' ? (
              <span style={{ color: '#fa8c16' }}>
                [{Array.isArray(value) ? value.length : 0} {Array.isArray(value) && value.length === 1 ? 'item' : 'items'}]
              </span>
            ) : (
              <span style={{ 
                color: childType === 'string' ? '#eb2f96' : 
                       childType === 'number' ? '#722ed1' : 
                       childType === 'boolean' ? '#13c2c2' : '#8c8c8c'
              }}>
                {String(value)}
              </span>
            )}
          </Space>
        );

        if (childType === 'object' || childType === 'array') {
          const children = convertToTreeData(value, nodeKey, level + 1);
          // Always make objects and arrays collapsible, even if empty
          const nodeChildren = children.length > 0 ? children : [{
            title: <span style={{ color: '#8c8c8c', fontStyle: 'italic' }}>Empty {childType === 'array' ? 'array' : 'object'}</span>,
            key: `${nodeKey}-empty`,
            isLeaf: true
          }];
          
          nodes.push({
            title,
            key: nodeKey,
            children: nodeChildren,
            isLeaf: false
          });
        } else {
          nodes.push({
            title,
            key: nodeKey,
            isLeaf: true
          });
        }
      });
    } else if (valueType === 'array') {
      data.forEach((item, index) => {
        const nodeKey = `${parentKey}[${index}]`;
        const childType = getJsonValueType(item);
        
        let title = (
          <Space>
            <span style={{ color: '#fa8c16', fontWeight: 500 }}>[{index}]:</span>
            {childType === 'object' ? (
              <span style={{ color: '#52c41a' }}>
                {'{'} {Object.keys(item).length} {Object.keys(item).length === 1 ? 'property' : 'properties'} {'}'}
              </span>
            ) : childType === 'array' ? (
              <span style={{ color: '#fa8c16' }}>
                [{Array.isArray(item) ? item.length : 0} {Array.isArray(item) && item.length === 1 ? 'item' : 'items'}]
              </span>
            ) : (
              <span style={{ 
                color: childType === 'string' ? '#eb2f96' : 
                       childType === 'number' ? '#722ed1' : 
                       childType === 'boolean' ? '#13c2c2' : '#8c8c8c'
              }}>
                {String(item)}
              </span>
            )}
          </Space>
        );

        if (childType === 'object' || childType === 'array') {
          const children = convertToTreeData(item, nodeKey, level + 1);
          // Always make objects and arrays collapsible, even if empty
          const nodeChildren = children.length > 0 ? children : [{
            title: <span style={{ color: '#8c8c8c', fontStyle: 'italic' }}>Empty {childType === 'array' ? 'array' : 'object'}</span>,
            key: `${nodeKey}-empty`,
            isLeaf: true
          }];
          
          nodes.push({
            title,
            key: nodeKey,
            children: nodeChildren,
            isLeaf: false
          });
        } else {
          nodes.push({
            title,
            key: nodeKey,
            isLeaf: true
          });
        }
      });
    }

    return nodes;
  };

  const treeData = useMemo(() => {
    if (jsonData === null) return [];
    
    const valueType = getJsonValueType(jsonData);
    if (valueType === 'object' || valueType === 'array') {
      return convertToTreeData(jsonData);
    }
    
    // Primitive root value
    return [{
      title: <span style={{ color: '#8c8c8c' }}>{String(jsonData)}</span>,
      key: 'root',
      isLeaf: true
    }];
  }, [jsonData]);

  // Auto-expand first 2 levels initially, but allow manual collapse/expand
  React.useEffect(() => {
    if (treeData.length > 0) {
      const keys = [];
      const collectKeys = (nodes, level = 0) => {
        nodes.forEach(node => {
          if (level < 2 && !node.isLeaf && node.children && node.children.length > 0) {
            keys.push(node.key);
            if (node.children) {
              collectKeys(node.children, level + 1);
            }
          }
        });
      };
      collectKeys(treeData);
      // Only set if we have keys to expand and current expandedKeys is empty or different
      if (keys.length > 0) {
        setExpandedKeys(prev => {
          // Only update if this is the initial load (prev is empty)
          if (prev.length === 0) {
            return keys;
          }
          return prev;
        });
      }
    }
  }, [treeData]);

  if (jsonData === null) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#999',
        height: 'calc(100vh - 280px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {jsonString && jsonString.trim() 
          ? 'Invalid JSON - Cannot display in tree view'
          : 'Enter JSON data to view in tree format'
        }
      </div>
    );
  }

  const getValueByPath = (path, data) => {
    if (!path || path === 'root') return data;
    
    const parts = path.split('.');
    let value = data;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.includes('[') && part.includes(']')) {
        const arrayKey = part.substring(0, part.indexOf('['));
        const index = parseInt(part.substring(part.indexOf('[') + 1, part.indexOf(']')));
        if (arrayKey) {
          value = value[arrayKey];
        }
        if (value && Array.isArray(value)) {
          value = value[index];
        }
      } else if (part) {
        value = value[part];
      }
      if (value === undefined || value === null) break;
    }
    
    return value;
  };

  const handleSelect = useCallback((keys, info) => {
    setSelectedKeys(keys);
    if (keys.length > 0 && info.node) {
      try {
        const value = getValueByPath(keys[0], jsonData);
        if (value !== undefined && value !== null) {
          const valueToCopy = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
          navigator.clipboard.writeText(valueToCopy);
          message.success('Value copied to clipboard!');
        }
      } catch (error) {
        console.error('Error copying value:', error);
      }
    }
  }, [jsonData]);

  const bgColor = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#fff' : '#000';

  return (
    <div style={{ 
      height: 'calc(100vh - 280px)', 
      overflow: 'auto',
      padding: '16px',
      backgroundColor: bgColor,
      color: textColor,
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
      <style>{`
        /* Tree container styles */
        .ant-tree {
          color: ${textColor} !important;
          background: transparent !important;
        }
        
        /* Switcher (expand/collapse icon container) */
        .ant-tree-switcher {
          color: ${textColor} !important;
          background: transparent !important;
          width: 24px !important;
          height: 24px !important;
          line-height: 24px !important;
        }
        
        /* Switcher icons */
        .ant-tree-switcher-icon,
        .ant-tree-switcher-icon svg,
        .ant-tree-switcher .anticon,
        .ant-tree-switcher .anticon svg {
          color: ${textColor} !important;
          fill: ${textColor} !important;
          font-size: 12px !important;
          opacity: 1 !important;
        }
        
        /* Open/Close states */
        .ant-tree-switcher_open .anticon,
        .ant-tree-switcher_close .anticon,
        .ant-tree-switcher_open .anticon svg,
        .ant-tree-switcher_close .anticon svg {
          color: ${textColor} !important;
          fill: ${textColor} !important;
          opacity: 1 !important;
        }
        
        /* Hide noop switcher (for leaf nodes) */
        .ant-tree-switcher-noop {
          display: none !important;
        }
        
        /* Node content */
        .ant-tree-node-content-wrapper {
          color: ${textColor} !important;
        }
        .ant-tree-node-content-wrapper:hover {
          background-color: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'} !important;
        }
        
        /* Tree node */
        .ant-tree-treenode {
          color: ${textColor} !important;
        }
        
        /* Icon element */
        .ant-tree-iconEle {
          color: ${textColor} !important;
        }
        .ant-tree-iconEle svg {
          fill: ${textColor} !important;
          color: ${textColor} !important;
        }
        
        /* Ensure all Ant Design icons in tree are visible */
        .ant-tree .anticon {
          color: ${textColor} !important;
        }
        .ant-tree .anticon svg {
          fill: ${textColor} !important;
          color: ${textColor} !important;
        }
        
        /* Line connector */
        .ant-tree-child-tree {
          color: ${textColor} !important;
        }
      `}</style>
      <Tree
        treeData={treeData}
        expandedKeys={expandedKeys}
        selectedKeys={selectedKeys}
        onExpand={(keys) => {
          setExpandedKeys(keys);
        }}
        onSelect={handleSelect}
        showLine={{ showLeafIcon: false }}
        defaultExpandAll={false}
        blockNode={false}
        switcherIcon={(props) => {
          // Custom switcher icon to ensure visibility
          const { expanded } = props;
          return (
            <span style={{ 
              color: textColor, 
              fontSize: '12px',
              display: 'inline-block',
              width: '16px',
              height: '16px',
              lineHeight: '16px',
              textAlign: 'center'
            }}>
              {expanded ? '▼' : '▶'}
            </span>
          );
        }}
        style={{
          backgroundColor: 'transparent',
          color: textColor
        }}
      />
    </div>
  );
});

JsonTreeView.displayName = 'JsonTreeView';

export default JsonTreeView;

