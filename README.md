# GCP Script Builder

A powerful web-based tool for building robust JavaScript scripts specifically designed for automotive dealership websites. This tool helps developers create production-ready scripts that follow best practices for browser console execution, SPA compatibility, and error handling.

## 🚀 Features

### Core Capabilities
- **Interactive Script Generation**: Visual interface for building JavaScript scripts
- **SPA Friendly**: Built-in support for Single Page Applications
- **Error Handling**: Comprehensive try-catch blocks and graceful error recovery
- **DOM Ready Handling**: Proper DOM loading state management
- **Duplicate Prevention**: Prevents multiple script executions

### Advanced Features
- **Debouncing**: Performance optimization for frequent operations
- **Element Caching**: Efficient DOM query caching
- **Resource Cleanup**: Memory leak prevention and event listener cleanup
- **Mutation Observer**: Dynamic content monitoring
- **URL Change Monitoring**: SPA navigation detection

### Widget Integration
- **Widget Loader**: Support for external widgets (AccuTrade, Elfsight, etc.)
- **Async Loading**: Asynchronous content loading handling
- **Fallback Mechanisms**: Graceful degradation when services fail

### Page Detection
- **VDP Detection**: Vehicle Detail Page identification
- **SRP Detection**: Search Results Page identification
- **Custom Page Detection**: URL pattern matching for specific pages

## 🛠️ Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Basic understanding of JavaScript and CSS selectors

### Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/gcp-script-builder.git
   ```

2. Navigate to the project directory:
   ```bash
   cd gcp-script-builder
   ```

3. Open `index.html` in your web browser or serve it using a local web server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   ```

4. Access the application at `http://localhost:8000`

## 📖 Usage

### Basic Workflow

1. **Configure Target Selector**
   - Choose between CSS Selector, XPath, or Advanced Builder
   - Enter your target element selector
   - Add fallback selectors for robustness

2. **Select Script Features**
   - Enable core features (SPA Friendly, DOM Ready, Error Handling)
   - Choose performance optimizations (Debouncing, Caching, Cleanup)
   - Add monitoring capabilities (Mutation Observer, URL Monitoring)
   - Enable development features (Debug Mode, Console Logging)

3. **Define Script Actions**
   - Select action type (Modify, Add, Remove, Style, Event, Widget, Form, Custom)
   - Configure action-specific parameters
   - Add custom JavaScript if needed

4. **Generate and Test**
   - Click "Generate Script" to create your code
   - Copy the generated script or download it
   - Test the script using the built-in validation tools

### Example Use Cases

#### Adding a Widget to VDP Pages
```javascript
// Generated script example for adding AccuTrade widget
// The tool generates production-ready code with error handling
```

#### Modifying Hero Section Text
```javascript
// Generated script example for text modifications
// Includes fallback selectors and SPA compatibility
```

#### Custom Form Handling
```javascript
// Generated script example for form submissions
// Includes validation and error recovery
```

## 🏗️ Project Structure

```
gcp-script-builder/
├── index.html          # Main application interface
├── styles.css          # Application styling
├── script.js           # Core functionality and script generation
├── README.md           # This file
└── examples/           # Example generated scripts (optional)
```

## 🎯 Target Audience

This tool is specifically designed for:
- **Automotive Dealership Websites**: Scripts optimized for car dealer sites
- **Browser Console Execution**: Scripts that work when pasted into browser console
- **Production Environments**: Robust, error-handled code ready for live sites
- **SPA Compatibility**: Modern websites with dynamic navigation

## 🔧 Script Standards

All generated scripts follow strict standards:

### Required Patterns
- Comprehensive header documentation
- JSDoc-style function comments
- DOM element validation before manipulation
- Event listener cleanup mechanisms
- Navigation detection for SPAs
- Debouncing for performance optimization

### Forbidden Patterns
- Direct DOM manipulation without validation
- Infinite loops without escape conditions
- Global variables without namespace
- Missing error handling for async operations
- Hard-coded delays without justification

## 🚦 Browser Compatibility

- ✅ Chrome 70+
- ✅ Firefox 65+
- ✅ Safari 12+
- ✅ Edge 79+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add comments for complex functionality
- Test in multiple browsers
- Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/yourusername/gcp-script-builder/issues) page
2. Create a new issue with detailed description
3. Include browser version and steps to reproduce

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added advanced selector builder
- **v1.2.0** - Enhanced widget integration features

## 🙏 Acknowledgments

- Built for automotive dealership website optimization
- Inspired by the need for robust browser console scripts
- Designed with production environment requirements in mind

---

**Note**: This tool generates JavaScript code for browser console execution. Always test generated scripts in a development environment before deploying to production websites.
