import { ConfigProvider, theme } from 'antd';
import JsonFormatter from './components/JsonFormatter'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import './App.css'

// Component to apply Ant Design theme
const ThemedApp = () => {
  const { isDark } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <div className="App">
        <JsonFormatter />
      </div>
    </ConfigProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  )
}

export default App