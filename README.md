# JSON Toolkit

A professional JSON editing, formatting, and conversion tool built with React and FastAPI. Transform your JSON data into multiple formats with an intuitive, modern interface powered by Monaco Editor.

![JSON Toolkit](https://img.shields.io/badge/JSON-Toolkit-blue?style=for-the-badge&logo=json)
![React](https://img.shields.io/badge/React-19.1.1-61dafb?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.118.2-009688?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.13-3776ab?style=for-the-badge&logo=python)

## ✨ Features

### 🔧 **Core Functionality**
- **JSON Formatting**: Beautify and format JSON with proper indentation
- **Multi-Format Conversion**: Convert JSON to XML, CSV, and YAML
- **Real-time Validation**: Instant JSON syntax validation with error highlighting
- **Enhanced Error Handling**: Categorized error messages with helpful tips

### 🎨 **User Experience**
- **Monaco Editor Integration**: Professional code editor with syntax highlighting
- **Line Numbers**: Easy navigation with line numbering
- **Click-Outside-to-Close**: Intuitive error panel dismissal
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Theme**: Modern dark theme for comfortable editing

### 🚀 **Advanced Features**
- **Nested Object Flattening**: CSV conversion with dot notation (e.g., `address.street`)
- **Array Support**: Handle JSON arrays for CSV conversion
- **Copy to Clipboard**: One-click copying of formatted/converted data
- **Example JSON**: Built-in examples to get started quickly

## 🛠️ Technology Stack

### **Frontend**
- **React 19.1.1** - Modern React with latest features
- **Vite 7.1.7** - Lightning-fast build tool and dev server
- **Monaco Editor 4.7.0** - VS Code's editor for syntax highlighting and line numbers
- **Ant Design 5.27.4** - Professional UI component library
- **Axios 1.12.2** - HTTP client for API communication

### **Backend**
- **FastAPI 0.118.2** - Modern, fast web framework for building APIs
- **Pydantic 2.12.0** - Data validation using Python type annotations
- **Uvicorn** - ASGI server for FastAPI
- **Python 3.13** - Latest Python version

### **Conversion Libraries**
- **PyYAML** - YAML parsing and generation
- **dicttoxml** - Dictionary to XML conversion
- **Pandas** - Data manipulation for CSV conversion

## 📦 Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/json-toolkit.git
   cd json-toolkit
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the backend server**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:5173
   ```

## 🚀 Quick Start

1. **Start both servers** (backend on port 8000, frontend on port 5173)
2. **Open the application** in your browser
3. **Paste your JSON** into the input editor
4. **Select output format** (JSON, XML, CSV, or YAML)
5. **Click Convert** to transform your data
6. **Copy the result** using the copy button

## 📖 Usage Examples

### JSON Formatting
```json
{"name":"John","age":30,"city":"New York"}
```
**Output:**
```json
{
  "name": "John",
  "age": 30,
  "city": "New York"
}
```

### XML Conversion
```json
{"user":{"name":"John","age":30}}
```
**Output:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<root>
  <user>
    <name>John</name>
    <age>30</age>
  </user>
</root>
```

### CSV Conversion
```json
[
  {"name":"John","address":{"street":"123 Main St","city":"NYC"}},
  {"name":"Jane","address":{"street":"456 Oak Ave","city":"LA"}}
]
```
**Output:**
```csv
name,address.street,address.city
John,123 Main St,NYC
Jane,456 Oak Ave,LA
```

### YAML Conversion
```json
{"database":{"host":"localhost","port":5432,"name":"mydb"}}
```
**Output:**
```yaml
database:
  host: localhost
  port: 5432
  name: mydb
```

## 🔧 API Endpoints

### Format JSON
```http
POST /format
Content-Type: application/json

{
  "name": "John",
  "age": 30
}
```

### Convert to Different Formats
```http
POST /convert?format=xml
Content-Type: application/json

{
  "name": "John",
  "age": 30
}
```

**Supported formats:**
- `json` - Formatted JSON
- `xml` - XML format
- `csv` - CSV format
- `yaml` - YAML format

## 🎯 Error Handling

The application provides comprehensive error handling with:

- **Syntax Errors**: Real-time JSON validation with Monaco Editor
- **Network Errors**: Connection troubleshooting tips
- **Validation Errors**: Format compatibility guidance
- **API Errors**: Server error information

Error messages include:
- Visual icons and color coding
- Detailed error descriptions
- Helpful tips for resolution
- Click-outside-to-close functionality

## 🏗️ Project Structure

```
json-toolkit/
├── app/                          # FastAPI backend
│   ├── __init__.py
│   ├── main.py                   # Main FastAPI application
│   ├── models.py                 # Pydantic models
│   ├── format_routes.py          # JSON formatting endpoints
│   ├── convert_routes.py         # Conversion endpoints
│   ├── format_utils.py           # JSON formatting utilities
│   └── convert_utils.py          # Conversion utilities
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── JsonFormatter.jsx # Main component
│   │   ├── App.jsx               # App component
│   │   ├── App.css               # Styling and animations
│   │   └── main.jsx              # Entry point
│   ├── package.json              # Node.js dependencies
│   └── vite.config.js            # Vite configuration
├── requirements.txt              # Python dependencies
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

## 🎨 UI Components

### **Monaco Editor Features**
- Syntax highlighting for JSON, XML, CSV, and YAML
- Line numbers for easy navigation
- Error detection and highlighting
- Dark theme for comfortable editing
- Word wrap and automatic layout

### **Ant Design Components**
- **Layout**: Responsive grid system
- **Card**: Clean card-based design
- **Button**: Professional button styling
- **Select**: Dropdown for format selection
- **Alert**: Error message display
- **Typography**: Consistent text styling

### **Custom Features**
- Floating error panel with instant appearance
- Click-outside-to-close functionality
- Color-coded error types
- Smooth animations and transitions
- Responsive design for all screen sizes

## 🔄 Development

### **Backend Development**
```bash
# Start with auto-reload
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# API documentation available at:
# http://localhost:8000/docs
```

### **Frontend Development**
```bash
cd frontend
npm run dev

# Hot reload enabled
# Available at: http://localhost:5173
```

### **Building for Production**
```bash
# Frontend build
cd frontend
npm run build

# Backend deployment
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Monaco Editor** - Microsoft's powerful code editor
- **Ant Design** - Professional UI component library
- **FastAPI** - Modern Python web framework
- **React** - JavaScript library for building user interfaces
- **Vite** - Next generation frontend tooling

## 📞 Support

If you encounter any issues or have questions:

1. **Check the error panel** for helpful tips
2. **Review the API documentation** at `/docs`
3. **Open an issue** on GitHub
4. **Check the console** for detailed error messages

---

**Made with ❤️ using React, FastAPI, and Monaco Editor**
