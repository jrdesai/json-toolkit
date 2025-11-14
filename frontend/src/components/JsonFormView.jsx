import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Form, Input, InputNumber, Switch, Button, Space, Collapse, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { parseJsonSafely, stringifyJson, getJsonValueType } from '../utils/jsonUtils';

const { Panel } = Collapse;
const { Text } = Typography;

const JsonFormView = memo(({ jsonString, onChange, readOnly = false }) => {
  const [form] = Form.useForm();

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

  useEffect(() => {
    if (jsonData !== null) {
      form.setFieldsValue({ root: jsonData });
    } else {
      form.resetFields();
    }
  }, [jsonData, form]);

  const handleValuesChange = useCallback((changedValues, allValues) => {
    if (onChange && !readOnly && allValues.root) {
      try {
        const updatedJsonString = stringifyJson(allValues.root);
        onChange(updatedJsonString);
      } catch (error) {
        console.error('Failed to update JSON:', error);
      }
    }
  }, [onChange, readOnly]);

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
          ? 'Invalid JSON - Cannot display in form view'
          : 'Enter JSON data to view in form format'
        }
      </div>
    );
  }

  const renderField = (name, value, path = []) => {
    const valueType = getJsonValueType(value);
    const fieldPath = path.length > 0 ? [...path, name] : [name];

    if (valueType === 'object' && value !== null && !Array.isArray(value)) {
      const fields = Object.keys(value).map(key => renderField(key, value[key], fieldPath));
      const objectKeys = Object.keys(value);
      const objectCount = objectKeys.length;
      return (
        <Collapse key={name} style={{ marginBottom: '16px' }}>
          <Panel 
            header={
              <Text strong>
                {name} <Text type="secondary" style={{ fontSize: '12px' }}>(Object - {objectCount} {objectCount === 1 ? 'property' : 'properties'})</Text>
              </Text>
            } 
            key={name}
          >
            <Form.Item name={fieldPath} noStyle>
              <div>{fields}</div>
            </Form.Item>
          </Panel>
        </Collapse>
      );
    }

    if (valueType === 'array') {
      return (
        <Collapse key={name} style={{ marginBottom: '16px' }}>
          <Panel 
            header={
              <Text strong>
                {name} <Text type="secondary" style={{ fontSize: '12px' }}>(Array - {Array.isArray(value) ? value.length : 0} items)</Text>
              </Text>
            } 
            key={name}
          >
            <Form.List name={fieldPath}>
              {(fields, { add, remove }) => (
                <div>
                  {fields.map(({ key: fieldKey, name: fieldName, ...restField }) => {
                    const item = value[fieldName];
                    const itemType = getJsonValueType(item);
                    
                    // If array item is an object or array, wrap it in a collapsible panel
                    if (itemType === 'object' && item !== null) {
                      return (
                        <Collapse key={fieldKey} style={{ marginBottom: '8px' }}>
                          <Panel 
                            header={
                              <Space align="baseline">
                                <Text type="secondary">[{fieldName}]</Text>
                                {!readOnly && (
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      remove(fieldName);
                                    }}
                                  />
                                )}
                              </Space>
                            } 
                            key={`${name}-${fieldName}`}
                          >
                            <div style={{ marginLeft: '16px' }}>
                              {Object.keys(item).map(subKey => renderField(subKey, item[subKey], [...fieldPath, fieldName]))}
                            </div>
                          </Panel>
                        </Collapse>
                      );
                    } else if (itemType === 'array') {
                      return (
                        <Collapse key={fieldKey} style={{ marginBottom: '8px' }}>
                          <Panel 
                            header={
                              <Space align="baseline">
                                <Text type="secondary">[{fieldName}]</Text>
                                {!readOnly && (
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      remove(fieldName);
                                    }}
                                  />
                                )}
                              </Space>
                            } 
                            key={`${name}-${fieldName}`}
                          >
                            <div style={{ marginLeft: '16px' }}>
                              {renderField(fieldName, item, fieldPath)}
                            </div>
                          </Panel>
                        </Collapse>
                      );
                    }
                    
                    // Primitive array items
                    return (
                      <div key={fieldKey} style={{ marginBottom: '8px', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                        <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Text type="secondary">[{fieldName}]</Text>
                          {!readOnly && (
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => remove(fieldName)}
                            />
                          )}
                        </Space>
                        <Form.Item
                          {...restField}
                          name={[fieldName]}
                          rules={[{ required: true }]}
                        >
                          {itemType === 'number' ? (
                            <InputNumber style={{ width: '100%' }} disabled={readOnly} />
                          ) : itemType === 'boolean' ? (
                            <Switch disabled={readOnly} />
                          ) : (
                            <Input disabled={readOnly} />
                          )}
                        </Form.Item>
                      </div>
                    );
                  })}
                  {!readOnly && (
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                      style={{ width: '100%' }}
                    >
                      Add Item
                    </Button>
                  )}
                </div>
              )}
            </Form.List>
          </Panel>
        </Collapse>
      );
    }

    // Primitive value
    return (
      <Form.Item
        key={name}
        label={name}
        name={fieldPath}
        rules={valueType === 'number' ? [{ type: 'number' }] : []}
      >
        {valueType === 'number' ? (
          <InputNumber style={{ width: '100%' }} disabled={readOnly} />
        ) : valueType === 'boolean' ? (
          <Switch disabled={readOnly} />
        ) : (
          <Input disabled={readOnly} />
        )}
      </Form.Item>
    );
  };

  const renderFormContent = () => {
    if (Array.isArray(jsonData)) {
      return (
        <Collapse style={{ marginBottom: '16px' }}>
          <Panel 
            header={
              <Text strong>
                Root Array <Text type="secondary" style={{ fontSize: '12px' }}>({jsonData.length} {jsonData.length === 1 ? 'item' : 'items'})</Text>
              </Text>
            } 
            key="root-array"
          >
            <Form.List name={['root']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => {
                    const item = jsonData[name];
                    const itemType = getJsonValueType(item);
                    
                    // If array item is an object or array, wrap it in a collapsible panel
                    if (itemType === 'object' && item !== null) {
                      return (
                        <Collapse key={key} style={{ marginBottom: '8px' }}>
                          <Panel 
                            header={
                              <Space align="baseline">
                                <Text strong>Item {name}</Text>
                                {!readOnly && (
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      remove(name);
                                    }}
                                  />
                                )}
                              </Space>
                            } 
                            key={`root-${name}`}
                          >
                            <div style={{ marginLeft: '16px' }}>
                              {Object.keys(item).map(subKey => renderField(subKey, item[subKey], ['root', name]))}
                            </div>
                          </Panel>
                        </Collapse>
                      );
                    } else if (itemType === 'array') {
                      return (
                        <Collapse key={key} style={{ marginBottom: '8px' }}>
                          <Panel 
                            header={
                              <Space align="baseline">
                                <Text strong>Item {name}</Text>
                                {!readOnly && (
                                  <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      remove(name);
                                    }}
                                  />
                                )}
                              </Space>
                            } 
                            key={`root-${name}`}
                          >
                            <div style={{ marginLeft: '16px' }}>
                              {renderField(name, item, ['root'])}
                            </div>
                          </Panel>
                        </Collapse>
                      );
                    }
                    
                    // Primitive array items
                    return (
                      <div key={key} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                        <Space style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Text strong>Item {name}:</Text>
                          {!readOnly && (
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                            />
                          )}
                        </Space>
                        <Form.Item
                          {...restField}
                          name={[name]}
                          rules={[{ required: true }]}
                        >
                          <Input disabled={readOnly} />
                        </Form.Item>
                      </div>
                    );
                  })}
                  {!readOnly && (
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      icon={<PlusOutlined />}
                      style={{ width: '100%' }}
                    >
                      Add Item
                    </Button>
                  )}
                </>
              )}
            </Form.List>
          </Panel>
        </Collapse>
      );
    }

    if (typeof jsonData === 'object' && jsonData !== null) {
      return Object.keys(jsonData).map(key => renderField(key, jsonData[key], ['root']));
    }

    return (
      <Form.Item name={['root']}>
        <Input disabled={readOnly} />
      </Form.Item>
    );
  };

  return (
    <div style={{ 
      height: 'calc(100vh - 280px)', 
      overflow: 'auto',
      padding: '16px'
    }}>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={{ root: jsonData }}
      >
        {renderFormContent()}
      </Form>
    </div>
  );
});

JsonFormView.displayName = 'JsonFormView';

export default JsonFormView;
