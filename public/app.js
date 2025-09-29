/**
 * Main Application Module
 * 
 * Initializes the Script Builder application and handles user interactions.
 * Coordinates between the UI, script generation, and history management.
 */

(function() {
    'use strict';

    // ===== Application State =====
    const app = {
        currentConfig: {},
        isGenerating: false,
        lastGeneratedCode: null,
        isEditing: false
    };

    // ===== Initialize Application =====
    function initApp() {
        console.log('Initializing Script Builder Application...');
        
        // Register service worker
        registerServiceWorker();
        
        // Initialize components
        initEventListeners();
        initActionTypeHandlers();
        initHistoryHandlers();
        initModalHandlers();
        initializeTooltips();
        
        // Load initial data
        loadSavedConfiguration();
        updateHistoryCount();
        
        console.log('Application initialized successfully');
    }

    // ===== Service Worker Registration =====
    async function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered successfully:', registration);
                
                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute
                
                // Handle service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            showToast('New version available! Refresh to update.', 'info');
                        }
                    });
                });
                
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // ===== Event Listeners =====
    function initEventListeners() {
        // Generate button
        document.getElementById('generateBtn').addEventListener('click', generateScript);
        
        // Testing tools
        document.getElementById('validateSelectorBtn').addEventListener('click', validateCurrentSelector);
        document.getElementById('testScriptBtn').addEventListener('click', testCurrentScript);
        
        // Output action buttons
        document.getElementById('editBtn').addEventListener('click', toggleCodeEditor);
        document.getElementById('copyBtn').addEventListener('click', copyGeneratedScript);
        document.getElementById('downloadBtn').addEventListener('click', downloadGeneratedScript);
        document.getElementById('saveToHistoryBtn').addEventListener('click', saveCurrentScript);
        
        // Selector tabs
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => switchSelectorTab(e.target.dataset.tab));
        });
        
        // Advanced builder
        document.getElementById('addCondition').addEventListener('click', addConditionRow);
        
        // Initialize scroll behavior if advanced tab exists
        setTimeout(() => {
            const advancedTab = document.getElementById('advanced-tab');
            if (advancedTab && advancedTab.style.display !== 'none') {
                initScrollBehavior();
            }
        }, 100);
        
        
        // Auto-save configuration on change
        const configInputs = document.querySelectorAll('.config-panel input, .config-panel textarea, .config-panel select');
        configInputs.forEach(input => {
            input.addEventListener('change', debounce(saveConfiguration, 500));
        });
        
        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            showToast('Settings coming soon!', 'info');
        });
        
        // Templates button
        document.getElementById('templatesBtn').addEventListener('click', () => {
            showToast('Templates library coming soon!', 'info');
        });
        
        // Remove condition buttons (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-condition') || e.target.closest('.remove-condition')) {
                const conditionRow = e.target.closest('.condition-row');
                if (conditionRow) {
                    conditionRow.remove();
                    updateSelectorPreview(); // Update preview after removal
                }
            }
        });
    }

    // ===== Action Type Handlers =====
    function initActionTypeHandlers() {
        const actionTypeSelect = document.getElementById('actionType');
        actionTypeSelect.addEventListener('change', updateActionOptions);
    }

    function updateActionOptions() {
        const actionType = document.getElementById('actionType').value;
        const optionsContainer = document.getElementById('actionOptions');
        
        if (!actionType) {
            optionsContainer.innerHTML = '';
            return;
        }
        
        // Generate options based on action type
        const optionsHTML = getActionOptionsHTML(actionType);
        optionsContainer.innerHTML = optionsHTML;
        
        // Re-initialize tooltips for new elements
        initializeTooltips();
    }

    // ===== Selector Tab Management =====
    function switchSelectorTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        
        const activeTab = document.getElementById(`${tabName}-tab`);
        if (activeTab) {
            activeTab.style.display = 'block';
        }
        
        // If switching to advanced tab and no conditions exist, add one
        if (tabName === 'advanced') {
            const conditionsContainer = document.getElementById('conditionsContainer');
            if (conditionsContainer && conditionsContainer.children.length === 0) {
                addConditionRow();
            }
            // Initialize scroll behavior
            initScrollBehavior();
        }
    }
    
    // ===== Advanced Selector Builder =====
    function addConditionRow() {
        const conditionsContainer = document.getElementById('conditionsContainer');
        const newRow = document.createElement('div');
        newRow.className = 'condition-row';
        newRow.innerHTML = `
            <select class="condition-attribute">
                <option value="class">Class</option>
                <option value="id">ID</option>
                <option value="data">Data Attribute</option>
                <option value="text">Text Content</option>
                <option value="tag">Tag Name</option>
                <option value="attribute">Attribute</option>
            </select>
            <select class="condition-type">
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
                <option value="starts-with">Starts With</option>
                <option value="ends-with">Ends With</option>
                <option value="exists">Exists</option>
                <option value="not-exists">Does Not Exist</option>
            </select>
            <input type="text" class="condition-value" placeholder="Value">
            <button class="remove-condition" title="Remove condition">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        conditionsContainer.appendChild(newRow);
        
        // Add event listeners for real-time preview
        const attributeSelect = newRow.querySelector('.condition-attribute');
        const typeSelect = newRow.querySelector('.condition-type');
        const valueInput = newRow.querySelector('.condition-value');
        
        attributeSelect.addEventListener('change', updateSelectorPreview);
        typeSelect.addEventListener('change', updateSelectorPreview);
        valueInput.addEventListener('input', debounce(updateSelectorPreview, 300));
        
        // Update preview immediately
        updateSelectorPreview();
    }
    
    function updateSelectorPreview() {
        const rows = document.querySelectorAll('#conditionsContainer .condition-row');
        let selector = '';
        
        rows.forEach((row, index) => {
            const attribute = row.querySelector('.condition-attribute').value;
            const condition = row.querySelector('.condition-type').value;
            const value = row.querySelector('.condition-value').value;
            
            if (!value && condition !== 'exists' && condition !== 'not-exists') return;
            
            let selectorPart = '';
            
            switch (attribute) {
                case 'class':
                    switch (condition) {
                        case 'contains':
                            selectorPart = `[class*="${value}"]`;
                            break;
                        case 'equals':
                            selectorPart = `[class="${value}"]`;
                            break;
                        case 'starts-with':
                            selectorPart = `[class^="${value}"]`;
                            break;
                        case 'ends-with':
                            selectorPart = `[class$="${value}"]`;
                            break;
                        case 'exists':
                            selectorPart = `[class]`;
                            break;
                        case 'not-exists':
                            selectorPart = `:not([class])`;
                            break;
                    }
                    break;
                    
                case 'id':
                    switch (condition) {
                        case 'contains':
                            selectorPart = `[id*="${value}"]`;
                            break;
                        case 'equals':
                            selectorPart = `#${value}`;
                            break;
                        case 'starts-with':
                            selectorPart = `[id^="${value}"]`;
                            break;
                        case 'ends-with':
                            selectorPart = `[id$="${value}"]`;
                            break;
                        case 'exists':
                            selectorPart = `[id]`;
                            break;
                        case 'not-exists':
                            selectorPart = `:not([id])`;
                            break;
                    }
                    break;
                    
                case 'data':
                    // Handle data attributes - extract attribute name and value
                    const parts = value.split('=');
                    const attrName = parts[0].startsWith('data-') ? parts[0] : `data-${parts[0]}`;
                    const attrValue = parts[1] || '';
                    
                    switch (condition) {
                        case 'contains':
                            selectorPart = attrValue ? `[${attrName}*="${attrValue}"]` : `[${attrName}]`;
                            break;
                        case 'equals':
                            selectorPart = attrValue ? `[${attrName}="${attrValue}"]` : `[${attrName}]`;
                            break;
                        case 'starts-with':
                            selectorPart = attrValue ? `[${attrName}^="${attrValue}"]` : `[${attrName}]`;
                            break;
                        case 'ends-with':
                            selectorPart = attrValue ? `[${attrName}$="${attrValue}"]` : `[${attrName}]`;
                            break;
                        case 'exists':
                            selectorPart = `[${attrName}]`;
                            break;
                        case 'not-exists':
                            selectorPart = `:not([${attrName}])`;
                            break;
                    }
                    break;
                    
                case 'text':
                    switch (condition) {
                        case 'contains':
                            selectorPart = `:contains("${value}")`;
                            break;
                        case 'equals':
                            selectorPart = `:contains("${value}")`;
                            break;
                        case 'starts-with':
                            selectorPart = `:contains("${value}")`;
                            break;
                        case 'ends-with':
                            selectorPart = `:contains("${value}")`;
                            break;
                    }
                    break;
                    
                case 'tag':
                    if (condition === 'equals') {
                        selectorPart = value.toLowerCase();
                    }
                    break;
                    
                case 'attribute':
                    // Handle custom attributes - extract attribute name and value
                    const attrParts = value.split('=');
                    const customAttrName = attrParts[0];
                    const customAttrValue = attrParts[1] || '';
                    
                    switch (condition) {
                        case 'contains':
                            selectorPart = customAttrValue ? `[${customAttrName}*="${customAttrValue}"]` : `[${customAttrName}]`;
                            break;
                        case 'equals':
                            selectorPart = customAttrValue ? `[${customAttrName}="${customAttrValue}"]` : `[${customAttrName}]`;
                            break;
                        case 'starts-with':
                            selectorPart = customAttrValue ? `[${customAttrName}^="${customAttrValue}"]` : `[${customAttrName}]`;
                            break;
                        case 'ends-with':
                            selectorPart = customAttrValue ? `[${customAttrName}$="${customAttrValue}"]` : `[${customAttrName}]`;
                            break;
                        case 'exists':
                            selectorPart = `[${customAttrName}]`;
                            break;
                        case 'not-exists':
                            selectorPart = `:not([${customAttrName}])`;
                            break;
                    }
                    break;
            }
            
            if (selectorPart) {
                selector += selectorPart;
            }
        });
        
        // Update the preview
        const generatedElement = document.getElementById('generatedSelector');
        if (selector) {
            generatedElement.textContent = selector;
            generatedElement.classList.remove('selector-placeholder');
            // Also update the main CSS selector input
            document.getElementById('targetSelector').value = selector;
        } else {
            generatedElement.textContent = 'Add conditions to generate selector';
            generatedElement.classList.add('selector-placeholder');
        }
    }
    
    function buildAdvancedSelector() {
        // This function is now handled by real-time preview
        updateSelectorPreview();
        showToast('Selector updated successfully', 'success');
    }
    
    // ===== Scroll Behavior for Advanced Builder =====
    function initScrollBehavior() {
        const conditionsContainer = document.getElementById('conditionsContainer');
        if (!conditionsContainer) return;
        
        let scrollTimeout;
        
        conditionsContainer.addEventListener('scroll', () => {
            // Add scrolling class when scrolling
            conditionsContainer.classList.add('scrolling');
            
            // Clear existing timeout
            clearTimeout(scrollTimeout);
            
            // Remove scrolling class after scrolling stops
            scrollTimeout = setTimeout(() => {
                conditionsContainer.classList.remove('scrolling');
            }, 1000); // Hide scrollbar 1 second after scrolling stops
        });
        
        // Also show scrollbar when container gains focus
        conditionsContainer.addEventListener('focusin', () => {
            conditionsContainer.classList.add('scrolling');
        });
        
        conditionsContainer.addEventListener('focusout', () => {
            setTimeout(() => {
                if (!conditionsContainer.matches(':focus-within')) {
                    conditionsContainer.classList.remove('scrolling');
                }
            }, 500);
        });
    }
    
    // ===== Test Script Function =====
    function testCurrentScript() {
        const testUrl = getInputValue('testUrl');
        
        if (!testUrl) {
            showToast('Please enter a test URL', 'warning');
            return;
        }
        
        // Validate URL format
        try {
            new URL(testUrl);
        } catch (error) {
            showToast('Please enter a valid URL (e.g., https://example.com)', 'error');
            return;
        }
        
        // Open URL in new tab
        window.open(testUrl, '_blank');
        showToast('Opening test URL in new tab', 'info');
    }
    
    // ===== Testing Tools =====
    function testCurrentSelector() {
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        let selector = '';
        let elements = [];
        
        try {
            switch (activeTab) {
                case 'css':
                    selector = document.getElementById('targetSelector').value;
                    if (selector) {
                        elements = document.querySelectorAll(selector);
                    }
                    break;
                case 'xpath':
                    const xpath = document.getElementById('xpathSelector').value;
                    if (xpath) {
                        const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        for (let i = 0; i < result.snapshotLength; i++) {
                            elements.push(result.snapshotItem(i));
                        }
                    }
                    break;
                case 'advanced':
                    const generatedSelector = document.getElementById('generatedSelector').textContent;
                    if (generatedSelector && generatedSelector !== 'No conditions added') {
                        elements = document.querySelectorAll(generatedSelector);
                    }
                    break;
            }
            
            // Show results
            const resultsDiv = document.getElementById('testResults');
            resultsDiv.className = 'test-results show';
            
            if (elements.length > 0) {
                resultsDiv.classList.add('success');
                resultsDiv.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    Found ${elements.length} element(s)<br>
                    <small>First element: ${elements[0].tagName.toLowerCase()}${elements[0].className ? '.' + elements[0].className.split(' ').join('.') : ''}</small>
                `;
            } else {
                resultsDiv.classList.add('warning');
                resultsDiv.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    No elements found
                `;
            }
        } catch (error) {
            const resultsDiv = document.getElementById('testResults');
            resultsDiv.className = 'test-results show error';
            resultsDiv.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                Error: ${error.message}
            `;
        }
    }
    
    function highlightMatchingElements() {
        // Remove previous highlights
        document.querySelectorAll('.element-highlight').forEach(el => {
            el.classList.remove('element-highlight');
        });
        
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        let elements = [];
        
        try {
            switch (activeTab) {
                case 'css':
                    const selector = document.getElementById('targetSelector').value;
                    if (selector) {
                        elements = document.querySelectorAll(selector);
                    }
                    break;
                case 'xpath':
                    const xpath = document.getElementById('xpathSelector').value;
                    if (xpath) {
                        const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                        for (let i = 0; i < result.snapshotLength; i++) {
                            elements.push(result.snapshotItem(i));
                        }
                    }
                    break;
                case 'advanced':
                    const generatedSelector = document.getElementById('generatedSelector').textContent;
                    if (generatedSelector && generatedSelector !== 'No conditions added') {
                        elements = document.querySelectorAll(generatedSelector);
                    }
                    break;
            }
            
            // Highlight elements
            elements.forEach(el => {
                el.classList.add('element-highlight');
            });
            
            if (elements.length > 0) {
                showToast(`Highlighting ${elements.length} element(s)`, 'info');
                
                // Scroll to first element
                elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Remove highlights after 5 seconds
                setTimeout(() => {
                    document.querySelectorAll('.element-highlight').forEach(el => {
                        el.classList.remove('element-highlight');
                    });
                }, 5000);
            } else {
                showToast('No elements to highlight', 'warning');
            }
        } catch (error) {
            showToast('Error highlighting elements', 'error');
        }
    }
    
    function getActionOptionsHTML(actionType) {
        const options = {
            'modify-text': `
                <div class="form-group">
                    <label for="newText">New Text Content <span class="required">*</span></label>
                    <input type="text" id="newText" placeholder="Enter new text content">
                </div>`,
            
            'modify-html': `
                <div class="form-group">
                    <label for="newHTML">New HTML Content <span class="required">*</span></label>
                    <textarea id="newHTML" rows="4" placeholder="Enter new HTML content"></textarea>
                </div>`,
            
            'add-element': `
                <div class="form-group">
                    <label for="elementCreationMode">Creation Mode <span class="required">*</span></label>
                    <select id="elementCreationMode">
                        <option value="standard">Standard Element</option>
                        <option value="custom-html">Custom HTML</option>
                    </select>
                    <small class="help-text">Choose how to create the new element</small>
                </div>
                
                <!-- Standard Element Mode -->
                <div id="standardElementOptions">
                    <div class="form-group">
                        <label for="elementType">Element Type <span class="required">*</span></label>
                        <select id="elementType">
                            <option value="div">Div Container</option>
                            <option value="span">Span (Inline)</option>
                            <option value="button">Button</option>
                            <option value="a">Link (Anchor)</option>
                            <option value="img">Image</option>
                            <option value="p">Paragraph</option>
                            <option value="h1">Heading 1</option>
                            <option value="h2">Heading 2</option>
                            <option value="h3">Heading 3</option>
                            <option value="h4">Heading 4</option>
                            <option value="h5">Heading 5</option>
                            <option value="h6">Heading 6</option>
                            <option value="ul">Unordered List</option>
                            <option value="ol">Ordered List</option>
                            <option value="li">List Item</option>
                            <option value="input">Input Field</option>
                            <option value="textarea">Text Area</option>
                            <option value="select">Select Dropdown</option>
                            <option value="form">Form</option>
                            <option value="section">Section</option>
                            <option value="article">Article</option>
                            <option value="header">Header</option>
                            <option value="footer">Footer</option>
                            <option value="nav">Navigation</option>
                            <option value="aside">Aside</option>
                            <option value="main">Main</option>
                            <option value="iframe">iFrame</option>
                            <option value="video">Video</option>
                            <option value="audio">Audio</option>
                            <option value="canvas">Canvas</option>
                            <option value="svg">SVG</option>
                            <option value="custom">Custom Tag</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="customTagGroup" style="display: none;">
                        <label for="customTagName">Custom Tag Name <span class="required">*</span></label>
                        <input type="text" id="customTagName" placeholder="e.g., my-custom-element">
                        <small class="help-text">Enter the custom HTML tag name</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="position">Insert Position</label>
                        <select id="position">
                            <option value="afterend">After Element</option>
                            <option value="beforebegin">Before Element</option>
                            <option value="afterbegin">Inside Start</option>
                            <option value="beforeend">Inside End</option>
                            <option value="replace">Replace Element</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="elementText">Text Content</label>
                        <input type="text" id="elementText" placeholder="Text content for the element">
                    </div>
                    
                    <div class="form-group">
                        <label for="className">CSS Class</label>
                        <input type="text" id="className" placeholder="e.g., custom-element btn-primary">
                        <small class="help-text">Space-separated class names</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="elementId">Element ID</label>
                        <input type="text" id="elementId" placeholder="e.g., my-element">
                    </div>
                    
                    <div class="form-group">
                        <label for="elementAttributes">Additional Attributes</label>
                        <textarea id="elementAttributes" rows="2" placeholder="data-id=&quot;123&quot; href=&quot;#&quot; target=&quot;_blank&quot;"></textarea>
                        <small class="help-text">One attribute per line in format: attribute="value"</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="innerHTML">Inner HTML</label>
                        <textarea id="innerHTML" rows="3" placeholder="HTML content for the element"></textarea>
                        <small class="help-text">Will override text content if provided</small>
                    </div>
                </div>
                
                <!-- Custom HTML Mode -->
                <div id="customHtmlOptions" style="display: none;">
                    <div class="form-group">
                        <label for="customHtmlPosition">Insert Position</label>
                        <select id="customHtmlPosition">
                            <option value="afterend">After Element</option>
                            <option value="beforebegin">Before Element</option>
                            <option value="afterbegin">Inside Start</option>
                            <option value="beforeend">Inside End</option>
                            <option value="replace">Replace Element</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="customHtmlContent">Custom HTML Content <span class="required">*</span></label>
                        <textarea id="customHtmlContent" rows="6" placeholder="<div class=&quot;my-custom-element&quot;>&#10;    <h3>Custom Element</h3>&#10;    <p>This is completely custom HTML</p>&#10;    <button onclick=&quot;alert('Hello!')&quot;>Click me</button>&#10;</div>"></textarea>
                        <small class="help-text">Enter complete HTML that will be inserted directly</small>
                    </div>
                </div>`,
            
            'remove-element': `
                <div class="form-group">
                    <small class="help-text">The selected element(s) will be removed from the DOM</small>
                </div>`,
            
            'add-class': `
                <div class="form-group">
                    <label for="className">CSS Class to Add <span class="required">*</span></label>
                    <input type="text" id="className" placeholder="e.g., highlighted">
                </div>`,
            
            'remove-class': `
                <div class="form-group">
                    <label for="className">CSS Class to Remove <span class="required">*</span></label>
                    <input type="text" id="className" placeholder="e.g., hidden">
                </div>`,
            
            'set-attribute': `
                <div class="form-group">
                    <label for="attrName">Attribute Name <span class="required">*</span></label>
                    <input type="text" id="attrName" placeholder="e.g., data-id, href">
                </div>
                <div class="form-group">
                    <label for="attrValue">Attribute Value</label>
                    <input type="text" id="attrValue" placeholder="Attribute value">
                </div>`,
            
            'apply-styles': `
                <div class="form-group">
                    <label for="styles">CSS Styles <span class="required">*</span></label>
                    <textarea id="styles" rows="4" placeholder="background-color: blue;&#10;color: white;&#10;padding: 10px;"></textarea>
                    <small class="help-text">Enter CSS properties separated by semicolons</small>
                </div>`,
            
            'add-listener': `
                <div class="form-group">
                    <label for="eventType">Event Type <span class="required">*</span></label>
                    <select id="eventType">
                        <option value="click">Click</option>
                        <option value="mouseover">Mouse Over</option>
                        <option value="mouseout">Mouse Out</option>
                        <option value="focus">Focus</option>
                        <option value="blur">Blur</option>
                        <option value="change">Change</option>
                        <option value="submit">Submit</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="eventCode">Event Handler Code</label>
                    <textarea id="eventCode" rows="4" placeholder="console.log('Event triggered');&#10;// Your code here"></textarea>
                </div>`,
            
            'insert-widget': `
                <div class="form-group">
                    <label for="widgetId">Widget ID</label>
                    <input type="text" id="widgetId" placeholder="e.g., accutrade-widget">
                </div>
                <div class="form-group">
                    <label for="widgetHTML">Widget HTML</label>
                    <textarea id="widgetHTML" rows="4" placeholder="Widget HTML content"></textarea>
                </div>
                <div class="form-group">
                    <label for="widgetScript">Widget Script URL</label>
                    <input type="text" id="widgetScript" placeholder="https://example.com/widget.js">
                </div>`,
            
            'toggle-visibility': `
                <div class="form-group">
                    <label for="visibilityAction">Visibility Action</label>
                    <select id="visibilityAction">
                        <option value="toggle">Toggle</option>
                        <option value="show">Show</option>
                        <option value="hide">Hide</option>
                    </select>
                </div>`,
            
            'scroll-to': `
                <div class="form-group">
                    <label for="scrollBehavior">Scroll Behavior</label>
                    <select id="scrollBehavior">
                        <option value="smooth">Smooth</option>
                        <option value="instant">Instant</option>
                        <option value="auto">Auto</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="scrollBlock">Scroll Position</label>
                    <select id="scrollBlock">
                        <option value="center">Center</option>
                        <option value="start">Top</option>
                        <option value="end">Bottom</option>
                        <option value="nearest">Nearest</option>
                    </select>
                </div>`,
            
            'clone-element': `
                <div class="form-group">
                    <label for="cloneDeep">Deep Clone</label>
                    <select id="cloneDeep">
                        <option value="true">Yes (include children)</option>
                        <option value="false">No (element only)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="clonePosition">Insert Position</label>
                    <select id="clonePosition">
                        <option value="after">After Original</option>
                        <option value="before">Before Original</option>
                        <option value="append">Append to Parent</option>
                    </select>
                </div>`,
            
            'wrap-element': `
                <div class="form-group">
                    <label for="wrapperTag">Wrapper Tag <span class="required">*</span></label>
                    <input type="text" id="wrapperTag" value="div" placeholder="e.g., div, section">
                </div>
                <div class="form-group">
                    <label for="wrapperClass">Wrapper Class</label>
                    <input type="text" id="wrapperClass" placeholder="e.g., wrapper-class">
                </div>`,
            
            'unwrap-element': `
                <div class="form-group">
                    <small class="help-text">Removes the parent wrapper and preserves the element</small>
                </div>`,
            
            'form-manipulation': `
                <div class="form-group">
                    <label for="formAction">Form Action</label>
                    <select id="formAction">
                        <option value="disable">Disable Field</option>
                        <option value="enable">Enable Field</option>
                        <option value="readonly">Make Read-only</option>
                        <option value="required">Make Required</option>
                        <option value="setValue">Set Value</option>
                        <option value="clear">Clear Value</option>
                    </select>
                </div>
                <div class="form-group" id="formValueGroup" style="display: none;">
                    <label for="formValue">Field Value</label>
                    <input type="text" id="formValue" placeholder="Value to set">
                </div>`,
            
            'ajax-request': `
                <div class="form-group">
                    <label for="ajaxUrl">URL <span class="required">*</span></label>
                    <input type="text" id="ajaxUrl" placeholder="https://api.example.com/endpoint">
                </div>
                <div class="form-group">
                    <label for="ajaxMethod">Method</label>
                    <select id="ajaxMethod">
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="ajaxData">Request Data (JSON)</label>
                    <textarea id="ajaxData" rows="3" placeholder='{"key": "value"}'></textarea>
                </div>`,
            
            'cookie-management': `
                <div class="form-group">
                    <label for="cookieAction">Cookie Action</label>
                    <select id="cookieAction">
                        <option value="set">Set Cookie</option>
                        <option value="get">Get Cookie</option>
                        <option value="delete">Delete Cookie</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="cookieName">Cookie Name <span class="required">*</span></label>
                    <input type="text" id="cookieName" placeholder="cookie_name">
                </div>
                <div class="form-group" id="cookieValueGroup">
                    <label for="cookieValue">Cookie Value</label>
                    <input type="text" id="cookieValue" placeholder="cookie_value">
                </div>
                <div class="form-group" id="cookieExpiryGroup">
                    <label for="cookieExpiry">Expiry (days)</label>
                    <input type="number" id="cookieExpiry" value="30" min="0">
                </div>`,
            
            'local-storage': `
                <div class="form-group">
                    <label for="storageAction">Storage Action</label>
                    <select id="storageAction">
                        <option value="set">Set Item</option>
                        <option value="get">Get Item</option>
                        <option value="remove">Remove Item</option>
                        <option value="clear">Clear All</option>
                    </select>
                </div>
                <div class="form-group" id="storageKeyGroup">
                    <label for="storageKey">Storage Key <span class="required">*</span></label>
                    <input type="text" id="storageKey" placeholder="storage_key">
                </div>
                <div class="form-group" id="storageValueGroup">
                    <label for="storageValue">Storage Value</label>
                    <textarea id="storageValue" rows="2" placeholder="Value to store (can be JSON)"></textarea>
                </div>`,
            
            'custom': `
                <div class="form-group">
                    <label for="customCode">Custom JavaScript Code <span class="required">*</span></label>
                    <textarea id="customCode" rows="6" placeholder="// Your custom JavaScript code here&#10;// Access the element with 'element' variable"></textarea>
                </div>`
        };
        
        // Add dynamic show/hide for conditional fields
        if (actionType === 'form-manipulation') {
            setTimeout(() => {
                const formActionSelect = document.getElementById('formAction');
                if (formActionSelect) {
                    formActionSelect.addEventListener('change', (e) => {
                        const valueGroup = document.getElementById('formValueGroup');
                        valueGroup.style.display = e.target.value === 'setValue' ? 'block' : 'none';
                    });
                }
            }, 100);
        }
        
        if (actionType === 'cookie-management') {
            setTimeout(() => {
                const cookieActionSelect = document.getElementById('cookieAction');
                if (cookieActionSelect) {
                    cookieActionSelect.addEventListener('change', (e) => {
                        const valueGroup = document.getElementById('cookieValueGroup');
                        const expiryGroup = document.getElementById('cookieExpiryGroup');
                        valueGroup.style.display = e.target.value === 'set' ? 'block' : 'none';
                        expiryGroup.style.display = e.target.value === 'set' ? 'block' : 'none';
                    });
                }
            }, 100);
        }
        
        if (actionType === 'local-storage') {
            setTimeout(() => {
                const storageActionSelect = document.getElementById('storageAction');
                if (storageActionSelect) {
                    storageActionSelect.addEventListener('change', (e) => {
                        const keyGroup = document.getElementById('storageKeyGroup');
                        const valueGroup = document.getElementById('storageValueGroup');
                        keyGroup.style.display = e.target.value === 'clear' ? 'none' : 'block';
                        valueGroup.style.display = e.target.value === 'set' ? 'block' : 'none';
                    });
                }
            }, 100);
        }
        
        if (actionType === 'add-element') {
            setTimeout(() => {
                // Handle creation mode switching
                const creationModeSelect = document.getElementById('elementCreationMode');
                const standardOptions = document.getElementById('standardElementOptions');
                const customHtmlOptions = document.getElementById('customHtmlOptions');
                
                if (creationModeSelect && standardOptions && customHtmlOptions) {
                    const toggleCreationMode = () => {
                        const mode = creationModeSelect.value;
                        if (mode === 'custom-html') {
                            standardOptions.style.display = 'none';
                            customHtmlOptions.style.display = 'block';
                        } else {
                            standardOptions.style.display = 'block';
                            customHtmlOptions.style.display = 'none';
                        }
                    };
                    
                    creationModeSelect.addEventListener('change', toggleCreationMode);
                    toggleCreationMode(); // Initialize
                }
                
                // Handle element type switching (show/hide custom tag input)
                const elementTypeSelect = document.getElementById('elementType');
                const customTagGroup = document.getElementById('customTagGroup');
                
                if (elementTypeSelect && customTagGroup) {
                    const toggleCustomTag = () => {
                        const isCustom = elementTypeSelect.value === 'custom';
                        customTagGroup.style.display = isCustom ? 'block' : 'none';
                    };
                    
                    elementTypeSelect.addEventListener('change', toggleCustomTag);
                    toggleCustomTag(); // Initialize
                }
            }, 100);
        }
        
        return options[actionType] || '';
    }

    // ===== History Handlers =====
    function initHistoryHandlers() {
        // History button
        document.getElementById('historyBtn').addEventListener('click', openHistoryModal);
        
        // History controls
        document.getElementById('historySearch').addEventListener('input', 
            debounce(refreshHistoryList, 300)
        );
        
        document.getElementById('historySort').addEventListener('change', refreshHistoryList);
        
        document.getElementById('exportHistory').addEventListener('click', exportHistory);
        
        document.getElementById('clearHistory').addEventListener('click', clearHistory);
        
        // Listen for history events
        window.historyManager.on('scriptAdded', () => {
            refreshHistoryList();
            updateHistoryCount();
        });
        
        window.historyManager.on('scriptDeleted', () => {
            refreshHistoryList();
            updateHistoryCount();
        });
    }

    function openHistoryModal() {
        refreshHistoryList();
        modalManager.openModal('historyModal');
    }

    async function exportHistory() {
        try {
            await window.historyManager.exportHistory();
            showToast('History exported successfully', 'success');
        } catch (error) {
            showToast('Failed to export history', 'error');
        }
    }

    async function clearHistory() {
        if (!confirm('Are you sure you want to clear all history? This cannot be undone.')) {
            return;
        }
        
        try {
            await window.historyManager.clearHistory();
            refreshHistoryList();
            showToast('History cleared successfully', 'success');
        } catch (error) {
            showToast('Failed to clear history', 'error');
        }
    }

    async function updateHistoryCount() {
        await window.historyManager.updateHistoryCount();
    }

    // ===== Modal Handlers =====
    function initModalHandlers() {
        // Close buttons
        document.getElementById('closeHistoryModal').addEventListener('click', () => {
            modalManager.closeModal('historyModal');
        });
        
        document.getElementById('closePreviewModal').addEventListener('click', () => {
            modalManager.closeModal('previewModal');
        });
    }

    // ===== Script Generation =====
    async function generateScript() {
        if (app.isGenerating) return;
        
        try {
            app.isGenerating = true;
            const generateBtn = document.getElementById('generateBtn');
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            
            // Gather configuration
            const config = gatherConfiguration();
            
            // Generate and save script
            const result = await window.scriptBuilder.generateAndSave(config);
            
            // Update UI
            app.lastGeneratedCode = result.code;
            app.currentConfig = config;
            
            const codeElement = document.getElementById('generatedCode');
            codeElement.textContent = result.code;
            
            // Highlight syntax
            if (window.Prism) {
                Prism.highlightElement(codeElement);
            }
            
            // Update stats
            updateScriptStats(result.code);
            
            // Enable output actions
            enableOutputActions();
            
            // Save configuration
            saveConfiguration();
            
            showToast('Script generated and saved to history!', 'success');
            
        } catch (error) {
            console.error('Failed to generate script:', error);
            showToast(error.message || 'Failed to generate script', 'error');
        } finally {
            app.isGenerating = false;
            const generateBtn = document.getElementById('generateBtn');
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Script';
        }
    }

    function gatherConfiguration() {
        // Gather action options
        const actionOptions = {};
        const actionType = getInputValue('actionType');
        
        // Get all inputs in action options container
        const optionsContainer = document.getElementById('actionOptions');
        const inputs = optionsContainer.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            actionOptions[input.id] = input.value;
        });
        
        // Determine active selector based on tab
        const activeTab = document.querySelector('.tab-btn.active');
        let targetSelector = '';
        let selectorType = 'css';
        
        if (activeTab) {
            selectorType = activeTab.dataset.tab;
            switch (selectorType) {
                case 'css':
                    targetSelector = getInputValue('targetSelector');
                    break;
                case 'xpath':
                    targetSelector = getInputValue('xpathSelector');
                    break;
                case 'advanced':
                    const generatedSelector = document.getElementById('generatedSelector');
                    if (generatedSelector && generatedSelector.textContent !== 'No conditions added') {
                        targetSelector = generatedSelector.textContent;
                    }
                    break;
            }
        } else {
            targetSelector = getInputValue('targetSelector');
        }
        
        return {
            scriptName: getInputValue('scriptName'),
            scriptDescription: getInputValue('scriptDescription'),
            targetSelector: targetSelector,
            selectorType: selectorType,
            fallbackSelectors: getInputValue('fallbackSelectors').split('\n').filter(s => s.trim()),
            waitForElement: getCheckboxValue('waitForElement'),
            multipleElements: getCheckboxValue('multipleElements'),
            actionType: actionType,
            actionOptions: actionOptions,
            features: {
                spaFriendly: getCheckboxValue('spaFriendly'),
                domReady: getCheckboxValue('domReady'),
                errorHandling: getCheckboxValue('errorHandling'),
                preventDuplicates: getCheckboxValue('preventDuplicates'),
                debouncing: getCheckboxValue('debouncing'),
                elementCaching: getCheckboxValue('elementCaching'),
                resourceCleanup: getCheckboxValue('resourceCleanup'),
                mutationObserver: getCheckboxValue('mutationObserver'),
                intervalMonitoring: getCheckboxValue('intervalMonitoring'),
                urlChangeMonitoring: getCheckboxValue('urlChangeMonitoring'),
                debugMode: getCheckboxValue('debugMode'),
                consoleLogging: getCheckboxValue('consoleLogging'),
                elementHighlighting: getCheckboxValue('elementHighlighting'),
                widgetLoader: getCheckboxValue('widgetLoader'),
                asyncLoading: getCheckboxValue('asyncLoading'),
                fallbackMechanisms: getCheckboxValue('fallbackMechanisms'),
                vdpDetection: getCheckboxValue('vdpDetection'),
                srpDetection: getCheckboxValue('srpDetection'),
                customPageDetection: getCheckboxValue('customPageDetection'),
                cleanup: getCheckboxValue('cleanup')
            }
        };
    }

    function updateScriptStats(code) {
        const stats = {
            lines: (code.match(/\n/g) || []).length + 1,
            size: new Blob([code]).size,
            characters: code.length
        };
        
        const statsElement = document.getElementById('scriptStats');
        statsElement.innerHTML = `
            <span><i class="fas fa-list-ol"></i> ${stats.lines} lines</span>
            <span><i class="fas fa-file"></i> ${window.historyManager.formatFileSize(stats.size)}</span>
            <span><i class="fas fa-text-width"></i> ${stats.characters.toLocaleString()} characters</span>
        `;
    }

    // ===== Selector Validation =====
    function validateCurrentSelector() {
        // Check if we have a generated script to validate
        if (!app.lastGeneratedCode) {
            showValidationResult('Please generate a script first before validating syntax', 'error');
            return;
        }
        
        try {
            // Create a function from the generated code to check for syntax errors
            const scriptCode = app.lastGeneratedCode;
            
            // Basic syntax validation using Function constructor
            new Function(scriptCode);
            
            // If we get here, the syntax is valid
            showValidationResult('✓ Script syntax is valid! No JavaScript errors detected.', 'success');
            
        } catch (error) {
            // Show the specific syntax error
            showValidationResult(`✗ JavaScript syntax error: ${error.message}`, 'error');
        }
    }
    
    function validateCSSSelector(selector) {
        try {
            // Test syntax
            document.querySelector(selector);
            
            // Count elements
            const elements = document.querySelectorAll(selector);
            const count = elements.length;
            
            if (count > 0) {
                showValidationResult(`✓ Valid CSS selector! Found ${count} element(s) on current page.`, 'success');
            } else {
                showValidationResult(`✓ Valid CSS selector syntax, but found 0 elements on current page.`, 'info');
            }
        } catch (error) {
            showValidationResult(`✗ Invalid CSS selector: ${error.message}`, 'error');
        }
    }
    
    function validateXPath(xpath) {
        try {
            const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            const count = result.snapshotLength;
            
            if (count > 0) {
                showValidationResult(`✓ Valid XPath expression! Found ${count} element(s) on current page.`, 'success');
            } else {
                showValidationResult(`✓ Valid XPath syntax, but found 0 elements on current page.`, 'info');
            }
        } catch (error) {
            showValidationResult(`✗ Invalid XPath expression: ${error.message}`, 'error');
        }
    }
    
    function showValidationResult(message, type) {
        const resultsDiv = document.getElementById('validationResults');
        resultsDiv.className = `validation-results show ${type}`;
        resultsDiv.textContent = message;
    }

    // ===== Code Editor Toggle =====
    function toggleCodeEditor() {
        const codeDisplay = document.getElementById('codeDisplay');
        const codeEditor = document.getElementById('codeEditor');
        const editBtn = document.getElementById('editBtn');
        
        if (!app.isEditing) {
            // Switch to edit mode
            app.isEditing = true;
            codeEditor.value = app.lastGeneratedCode || '';
            codeDisplay.style.display = 'none';
            codeEditor.style.display = 'block';
            
            // Create syntax highlighting overlay
            createSyntaxHighlightOverlay();
            
            codeEditor.focus();
            
            editBtn.innerHTML = '<i class="fas fa-save"></i> Save';
            editBtn.classList.add('btn-primary');
            editBtn.classList.remove('btn-secondary');
            
            // Add save shortcut (Ctrl/Cmd + S)
            codeEditor.addEventListener('keydown', handleEditorKeydown);
            
            // Add input event listener for real-time syntax highlighting
            codeEditor.addEventListener('input', updateSyntaxHighlighting);
            codeEditor.addEventListener('scroll', syncHighlightScroll);
            
            showToast('Edit mode enabled. Press Ctrl/Cmd+S to save changes.', 'info');
        } else {
            // Switch to view mode and save changes
            saveEditorChanges();
        }
    }
    
    function saveEditorChanges() {
        const codeDisplay = document.getElementById('codeDisplay');
        const codeEditor = document.getElementById('codeEditor');
        const editBtn = document.getElementById('editBtn');
        const generatedCode = document.getElementById('generatedCode');
        
        // Update the code with editor content
        const editedCode = codeEditor.value;
        app.lastGeneratedCode = editedCode;
        generatedCode.textContent = editedCode;
        
        // Re-highlight syntax
        if (window.Prism) {
            Prism.highlightElement(generatedCode);
        }
        
        // Update stats
        updateScriptStats(editedCode);
        
        // Switch back to view mode
        app.isEditing = false;
        codeEditor.style.display = 'none';
        codeDisplay.style.display = 'block';
        
        editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
        editBtn.classList.remove('btn-primary');
        editBtn.classList.add('btn-secondary');
        
        // Remove event listeners
        codeEditor.removeEventListener('keydown', handleEditorKeydown);
        codeEditor.removeEventListener('input', updateSyntaxHighlighting);
        codeEditor.removeEventListener('scroll', syncHighlightScroll);
        
        // Remove syntax highlighting overlay
        const highlightOverlay = document.querySelector('.code-editor-highlight');
        if (highlightOverlay) {
            highlightOverlay.remove();
        }
        
        showToast('Changes saved successfully', 'success');
    }
    
    function handleEditorKeydown(event) {
        // Save on Ctrl/Cmd + S
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            saveEditorChanges();
        }
        
        // Handle Tab key for proper indentation
        if (event.key === 'Tab') {
            event.preventDefault();
            const textarea = event.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            // Insert 4 spaces
            textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 4;
        }
    }

    // ===== Output Actions =====
    async function copyGeneratedScript() {
        const codeToUse = app.isEditing ? 
            document.getElementById('codeEditor').value : 
            app.lastGeneratedCode;
            
        if (!codeToUse) return;
        
        const success = await copyToClipboard(codeToUse);
        if (success) {
            showToast('Script copied to clipboard', 'success');
        } else {
            showToast('Failed to copy script', 'error');
        }
    }

    function downloadGeneratedScript() {
        const codeToUse = app.isEditing ? 
            document.getElementById('codeEditor').value : 
            app.lastGeneratedCode;
            
        if (!codeToUse) return;
        
        const filename = `${app.currentConfig.scriptName || 'script'}.js`;
        downloadFile(filename, codeToUse, 'application/javascript');
        showToast('Script downloaded', 'success');
    }

    async function saveCurrentScript() {
        if (!app.lastGeneratedCode) return;
        
        try {
            const scriptData = {
                name: app.currentConfig.scriptName || 'Untitled Script',
                description: app.currentConfig.scriptDescription,
                code: app.isEditing ? document.getElementById('codeEditor').value : app.lastGeneratedCode,
                config: app.currentConfig,
                features: Object.keys(app.currentConfig.features).filter(f => app.currentConfig.features[f]),
                actionType: app.currentConfig.actionType
            };
            
            await window.historyManager.saveScript(scriptData);
            showToast('Script saved to history', 'success');
        } catch (error) {
            showToast('Failed to save script', 'error');
        }
    }

    // ===== Configuration Persistence =====
    function saveConfiguration() {
        const config = gatherConfiguration();
        storage.set('scriptBuilderConfig', config);
    }

    function loadSavedConfiguration() {
        const savedConfig = storage.get('scriptBuilderConfig');
        if (savedConfig) {
            restoreScriptToEditor({ config: savedConfig });
        }
    }

    // ===== Syntax Highlighting Functions =====
    function createSyntaxHighlightOverlay() {
        const codeOutput = document.querySelector('.code-output');
        const codeEditor = document.getElementById('codeEditor');
        
        // Remove existing overlay if any
        const existingOverlay = document.querySelector('.code-editor-highlight');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Create highlight overlay
        const highlightOverlay = document.createElement('div');
        highlightOverlay.className = 'code-editor-highlight';
        highlightOverlay.innerHTML = '<pre><code class="language-javascript"></code></pre>';
        
        // Insert before the textarea
        codeOutput.insertBefore(highlightOverlay, codeEditor);
        
        // Initial highlighting
        updateSyntaxHighlighting();
    }
    
    function updateSyntaxHighlighting() {
        const codeEditor = document.getElementById('codeEditor');
        const highlightOverlay = document.querySelector('.code-editor-highlight code');
        
        if (!highlightOverlay || !codeEditor) return;
        
        // Get the current code
        const code = codeEditor.value;
        
        // Set the code content
        highlightOverlay.textContent = code;
        
        // Apply syntax highlighting using Prism
        if (window.Prism) {
            Prism.highlightElement(highlightOverlay);
        }
        
        // Sync scroll position
        syncHighlightScroll();
    }
    
    function syncHighlightScroll() {
        const codeEditor = document.getElementById('codeEditor');
        const highlightOverlay = document.querySelector('.code-editor-highlight');
        
        if (!highlightOverlay || !codeEditor) return;
        
        // Sync scroll positions
        highlightOverlay.scrollTop = codeEditor.scrollTop;
        highlightOverlay.scrollLeft = codeEditor.scrollLeft;
    }

    // ===== Initialize on DOM Ready =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

})();
