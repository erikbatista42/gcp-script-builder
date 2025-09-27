# GCP Script Builder

## Quick Start

1. Open `index.html` in your browser
2. Configure your script settings:
   - Set target selector
   - Choose features to enable
   - Select action type
3. Click "Generate Script" to create your custom JavaScript
4. Copy or download the generated script

## Features

### Target Selector System
- **Basic CSS Selector**: Simple CSS selectors
- **Advanced Builder**: Visual condition builder for complex targeting
- **Fallback Selectors**: Multiple backup selectors for reliability

### Script Features
- **SPA Friendly**: Handles single-page application navigation
- **DOM Ready**: Waits for DOM to be fully loaded
- **Error Handling**: Comprehensive error recovery
- **Performance**: Debouncing, caching, cleanup
- **Monitoring**: DOM mutations, intervals, URL changes
- **Development**: Debug mode, logging, element highlighting
- **Widgets**: Integration with AccuTrade, Elfsight, etc.
- **Page Detection**: VDP, SRP, and custom page detection

### Script Actions
- Modify elements (text, HTML, attributes)
- Add new elements with positioning
- Remove elements or content
- Apply CSS styles
- Add event listeners
- Insert widgets
- Handle forms
- Custom JavaScript code

## Troubleshooting

If you see browser console errors:
1. **Extension errors** (sw.js, mobx-state-tree): These are from browser extensions and don't affect the script builder
2. **Prism.js errors**: Should be fixed with the updated CDN links
3. **Tooltips not working**: Check browser console for initialization messages

## Testing

- Use the "Validate Selector" button to test CSS selectors
- Hover over info icons (ⓘ) to see feature descriptions
- Check browser console for debugging information

## Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge
- Mobile responsive design