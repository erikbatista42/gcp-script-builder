/**
 * GCP Script Builder - Main JavaScript File
 * 
 * This file handles the interactive functionality of the script builder UI.
 * It manages user interactions, form validation, and script generation.
 */

class ScriptBuilder {
    constructor() {
        this.conditions = [];
        this.conditionCounter = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTooltips();
        this.setupTabs();
        // Initialize with one condition for the advanced builder
        this.addCondition();
    }

    setupEventListeners() {
        // Selector type change
        document.getElementById('selectorType').addEventListener('change', (e) => {
            this.toggleSelectorType(e.target.value);
        });

        // Add condition button
        document.getElementById('addCondition').addEventListener('click', () => {
            this.addCondition();
        });

        // Action type change
        document.getElementById('actionType').addEventListener('change', (e) => {
            this.showActionConfig(e.target.value);
        });

        // Generate script button
        document.getElementById('generateScript').addEventListener('click', () => {
            this.generateScript();
        });

        // Copy script button
        document.getElementById('copyScript').addEventListener('click', () => {
            this.copyScript();
        });

        // Download script button
        document.getElementById('downloadScript').addEventListener('click', () => {
            this.downloadScript();
        });

        // Validate selector button
        document.getElementById('validateSelector').addEventListener('click', () => {
            this.validateSelector();
        });

        // Test script button
        document.getElementById('testScript').addEventListener('click', () => {
            this.testScript();
        });

        // Feature checkboxes change
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateScriptPreview();
            });
        });

        // Input fields change
        document.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('input', () => {
                this.updateScriptPreview();
            });
        });
    }

    setupTooltips() {
        const tooltip = document.getElementById('tooltip');
        const tooltipTriggers = document.querySelectorAll('[data-tooltip]');

        console.log('Setting up tooltips for', tooltipTriggers.length, 'elements');

        tooltipTriggers.forEach(trigger => {
            trigger.addEventListener('mouseenter', (e) => {
                const text = e.target.getAttribute('data-tooltip');
                if (text) {
                    tooltip.textContent = text;
                    tooltip.style.display = 'block';
                    tooltip.classList.add('show');
                    this.positionTooltip(e, tooltip);
                }
            });

            trigger.addEventListener('mouseleave', () => {
                tooltip.classList.remove('show');
                setTimeout(() => {
                    if (!tooltip.classList.contains('show')) {
                        tooltip.style.display = 'none';
                    }
                }, 200);
            });

            trigger.addEventListener('mousemove', (e) => {
                if (tooltip.classList.contains('show')) {
                    this.positionTooltip(e, tooltip);
                }
            });
        });
    }

    positionTooltip(e, tooltip) {
        // Set initial position to measure tooltip dimensions
        tooltip.style.left = '0px';
        tooltip.style.top = '0px';
        
        const rect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Get the icon's position and dimensions
        const iconRect = e.target.getBoundingClientRect();
        const iconCenterX = iconRect.left + (iconRect.width / 2);
        const iconCenterY = iconRect.top + (iconRect.height / 2);
        
        // Center tooltip horizontally on the icon
        let x = iconCenterX - (rect.width / 2);
        let y = iconCenterY - rect.height - 10; // Position above the icon
        
        // Adjust horizontal position if tooltip would go off-screen
        if (x < 10) {
            x = 10;
        } else if (x + rect.width > viewportWidth - 10) {
            x = viewportWidth - rect.width - 10;
        }
        
        // Adjust vertical position if tooltip would go off-screen
        let isBelow = false;
        if (y < 10) {
            y = iconCenterY + iconRect.height + 10; // Position below the icon instead
            isBelow = true;
        }
        
        // Update arrow direction based on position
        tooltip.classList.toggle('below', isBelow);
        
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Add active class to clicked button and corresponding pane
                button.classList.add('active');
                document.getElementById(tabName + 'Tab').classList.add('active');
            });
        });
    }

    toggleSelectorType(type) {
        const basicSelector = document.getElementById('basicSelector');
        const advancedSelector = document.getElementById('advancedSelector');

        if (type === 'advanced') {
            basicSelector.style.display = 'none';
            advancedSelector.style.display = 'block';
        } else {
            basicSelector.style.display = 'block';
            advancedSelector.style.display = 'none';
        }
    }

    addCondition() {
        const conditionsList = document.getElementById('conditionsList');
        const conditionId = `condition_${this.conditionCounter++}`;
        
        const conditionHTML = `
            <div class="condition-item" data-condition-id="${conditionId}">
                <div class="condition-row">
                    <div class="form-group">
                        <label>Attribute:</label>
                        <select class="form-control condition-attribute">
                            <option value="class">Class</option>
                            <option value="id">ID</option>
                            <option value="tag">Tag Name</option>
                            <option value="attribute">Data Attribute</option>
                            <option value="text">Text Content</option>
                            <option value="parent">Parent Element</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Condition:</label>
                        <select class="form-control condition-operator">
                            <option value="contains">Contains</option>
                            <option value="equals">Equals</option>
                            <option value="starts">Starts With</option>
                            <option value="ends">Ends With</option>
                            <option value="exists">Exists</option>
                            <option value="not-exists">Does Not Exist</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Value:</label>
                        <input type="text" class="form-control condition-value" placeholder="Enter value">
                    </div>
                    <div class="form-group">
                        <button type="button" class="btn btn-small btn-outline" onclick="scriptBuilder.removeCondition('${conditionId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        conditionsList.insertAdjacentHTML('beforeend', conditionHTML);
        this.conditions.push(conditionId);
        
        // Add event listeners to the new condition for real-time preview updates
        const newCondition = document.querySelector(`[data-condition-id="${conditionId}"]`);
        const inputs = newCondition.querySelectorAll('select, input');
        inputs.forEach(input => {
            input.addEventListener('change', () => this.updateSelectorPreview());
            input.addEventListener('input', () => this.updateSelectorPreview());
        });
        
        // Update preview
        this.updateSelectorPreview();
    }

    removeCondition(conditionId) {
        const conditionElement = document.querySelector(`[data-condition-id="${conditionId}"]`);
        if (conditionElement) {
            conditionElement.remove();
            this.conditions = this.conditions.filter(id => id !== conditionId);
            this.updateSelectorPreview();
        }
    }

    updateSelectorPreview() {
        const selectorPreview = document.getElementById('selectorPreview');
        if (!selectorPreview) return;
        
        const selector = this.buildAdvancedSelector();
        
        if (selector) {
            selectorPreview.innerHTML = `<code>${selector}</code>`;
        } else {
            selectorPreview.innerHTML = `<code style="color: #6c757d;">No conditions added yet</code>`;
        }
    }

    showActionConfig(actionType) {
        const actionConfig = document.getElementById('actionConfig');
        
        if (!actionType) {
            actionConfig.style.display = 'none';
            return;
        }

        actionConfig.style.display = 'block';
        
        let configHTML = '';
        
        switch (actionType) {
            case 'modify':
                configHTML = this.getModifyConfig();
                break;
            case 'add':
                configHTML = this.getAddConfig();
                break;
            case 'remove':
                configHTML = this.getRemoveConfig();
                break;
            case 'style':
                configHTML = this.getStyleConfig();
                break;
            case 'event':
                configHTML = this.getEventConfig();
                break;
            case 'widget':
                configHTML = this.getWidgetConfig();
                break;
            case 'form':
                configHTML = this.getFormConfig();
                break;
            case 'custom':
                configHTML = this.getCustomConfig();
                break;
        }
        
        actionConfig.innerHTML = configHTML;
    }

    getModifyConfig() {
        return `
            <h3>Modify Element</h3>
            <div class="form-group">
                <label>Property to Modify:</label>
                <select class="form-control" id="modifyProperty">
                    <option value="textContent">Text Content</option>
                    <option value="innerHTML">HTML Content</option>
                    <option value="src">Source (src)</option>
                    <option value="href">Link (href)</option>
                    <option value="value">Value</option>
                    <option value="placeholder">Placeholder</option>
                    <option value="title">Title</option>
                    <option value="alt">Alt Text</option>
                    <option value="custom">Custom Attribute</option>
                </select>
            </div>
            <div class="form-group" id="customAttributeGroup" style="display: none;">
                <label>Custom Attribute Name:</label>
                <input type="text" class="form-control" id="customAttribute" placeholder="data-custom">
            </div>
            <div class="form-group">
                <label>New Value:</label>
                <textarea class="form-control" id="modifyValue" rows="3" placeholder="Enter the new value"></textarea>
            </div>
        `;
    }

    getAddConfig() {
        return `
            <h3>Add Element</h3>
            <div class="form-group">
                <label>Element Type:</label>
                <select class="form-control" id="elementType">
                    <option value="div">Div</option>
                    <option value="span">Span</option>
                    <option value="button">Button</option>
                    <option value="a">Link</option>
                    <option value="img">Image</option>
                    <option value="p">Paragraph</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="custom">Custom HTML</option>
                </select>
            </div>
            <div class="form-group">
                <label>Position:</label>
                <select class="form-control" id="addPosition">
                    <option value="append">Inside (End)</option>
                    <option value="prepend">Inside (Beginning)</option>
                    <option value="before">Before Element</option>
                    <option value="after">After Element</option>
                </select>
            </div>
            <div class="form-group">
                <label>Content/HTML:</label>
                <textarea class="form-control" id="addContent" rows="4" placeholder="Enter content or HTML"></textarea>
            </div>
            <div class="form-group">
                <label>CSS Classes (optional):</label>
                <input type="text" class="form-control" id="addClasses" placeholder="class1 class2 class3">
            </div>
        `;
    }

    getRemoveConfig() {
        return `
            <h3>Remove Element</h3>
            <div class="form-group">
                <label>Remove Action:</label>
                <select class="form-control" id="removeAction">
                    <option value="element">Remove Entire Element</option>
                    <option value="content">Remove Content Only</option>
                    <option value="attribute">Remove Specific Attribute</option>
                    <option value="class">Remove CSS Class</option>
                </select>
            </div>
            <div class="form-group" id="removeValueGroup">
                <label>Value to Remove:</label>
                <input type="text" class="form-control" id="removeValue" placeholder="Enter attribute name or class name">
            </div>
        `;
    }

    getStyleConfig() {
        return `
            <h3>Style Changes</h3>
            <div class="form-group">
                <label>CSS Properties:</label>
                <textarea class="form-control" id="cssProperties" rows="6" placeholder="Enter CSS properties, one per line:&#10;color: red;&#10;background-color: #f0f0f0;&#10;font-size: 16px;&#10;display: block;"></textarea>
            </div>
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="importantStyles">
                    <span class="checkmark"></span>
                    Add !important to styles
                </label>
            </div>
        `;
    }

    getEventConfig() {
        return `
            <h3>Event Listeners</h3>
            <div class="form-group">
                <label>Event Type:</label>
                <select class="form-control" id="eventType">
                    <option value="click">Click</option>
                    <option value="mouseover">Mouse Over</option>
                    <option value="mouseout">Mouse Out</option>
                    <option value="focus">Focus</option>
                    <option value="blur">Blur</option>
                    <option value="change">Change</option>
                    <option value="submit">Submit</option>
                    <option value="load">Load</option>
                    <option value="scroll">Scroll</option>
                    <option value="resize">Resize</option>
                </select>
            </div>
            <div class="form-group">
                <label>JavaScript Code:</label>
                <textarea class="form-control" id="eventCode" rows="6" placeholder="Enter JavaScript code to execute:&#10;console.log('Element clicked');&#10;alert('Hello World!');"></textarea>
            </div>
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="preventDefault">
                    <span class="checkmark"></span>
                    Prevent Default Action
                </label>
            </div>
        `;
    }

    getWidgetConfig() {
        return `
            <h3>Widget Integration</h3>
            <div class="form-group">
                <label>Widget Type:</label>
                <select class="form-control" id="widgetType">
                    <option value="accutrade">AccuTrade</option>
                    <option value="elfsight">Elfsight</option>
                    <option value="autofusion">AutoFusion</option>
                    <option value="complyauto">ComplyAuto</option>
                    <option value="knack">Knack</option>
                    <option value="motomate">MotoMate</option>
                    <option value="custom">Custom Widget</option>
                </select>
            </div>
            <div class="form-group">
                <label>Widget Configuration:</label>
                <textarea class="form-control" id="widgetConfig" rows="4" placeholder="Enter widget-specific configuration"></textarea>
            </div>
            <div class="form-group">
                <label>Container ID/Class:</label>
                <input type="text" class="form-control" id="widgetContainer" placeholder="widget-container">
            </div>
        `;
    }

    getFormConfig() {
        return `
            <h3>Form Handling</h3>
            <div class="form-group">
                <label>Form Action:</label>
                <select class="form-control" id="formAction">
                    <option value="intercept">Intercept Submission</option>
                    <option value="validate">Add Validation</option>
                    <option value="modify">Modify Form Data</option>
                    <option value="webhook">Send to Webhook</option>
                </select>
            </div>
            <div class="form-group">
                <label>Configuration:</label>
                <textarea class="form-control" id="formConfig" rows="4" placeholder="Enter form handling configuration"></textarea>
            </div>
        `;
    }

    getCustomConfig() {
        return `
            <h3>Custom JavaScript</h3>
            <div class="form-group">
                <label>Custom JavaScript Code:</label>
                <textarea class="form-control" id="customCode" rows="8" placeholder="Enter your custom JavaScript code here..."></textarea>
            </div>
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="wrapInTryCatch">
                    <span class="checkmark"></span>
                    Wrap in try-catch block
                </label>
            </div>
        `;
    }

    generateScript() {
        const config = this.getScriptConfig();
        
        // Validate configuration
        const validation = this.validateConfig(config);
        if (!validation.isValid) {
            this.showNotification(validation.message, 'error');
            return;
        }
        
        try {
            const script = this.buildScript(config);
            
            // Update the generated script tab
            document.getElementById('scriptOutput').textContent = script;
            
            // Generate minified version (basic minification)
            const minified = this.minifyScript(script);
            document.getElementById('minifiedOutput').textContent = minified;
            
            // Generate documentation
            const documentation = this.generateDocumentation(config);
            document.getElementById('docOutput').innerHTML = documentation;
            
            // Trigger syntax highlighting if available
            if (typeof Prism !== 'undefined') {
                Prism.highlightAll();
            }
            
            this.showNotification('Script generated successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating script:', error);
            this.showNotification('Error generating script: ' + error.message, 'error');
        }
    }

    validateConfig(config) {
        // Basic validation
        if (!config.selector) {
            if (config.selectorType === 'advanced') {
                return {
                    isValid: false,
                    message: 'Please add at least one condition in the Advanced Builder'
                };
            } else {
                return {
                    isValid: false,
                    message: 'Please enter a CSS selector or use the Advanced Builder'
                };
            }
        }
        
        // Action-specific validation
        if (config.actionType) {
            switch (config.actionType) {
                case 'modify':
                    if (!config.modifyValue) {
                        return {
                            isValid: false,
                            message: 'Please enter a value for the modification'
                        };
                    }
                    break;
                case 'add':
                    if (!config.addContent) {
                        return {
                            isValid: false,
                            message: 'Please enter content for the new element'
                        };
                    }
                    break;
                case 'style':
                    if (!config.cssProperties) {
                        return {
                            isValid: false,
                            message: 'Please enter CSS properties to apply'
                        };
                    }
                    break;
                case 'event':
                    if (!config.eventCode) {
                        return {
                            isValid: false,
                            message: 'Please enter JavaScript code for the event handler'
                        };
                    }
                    break;
                case 'custom':
                    if (!config.customCode) {
                        return {
                            isValid: false,
                            message: 'Please enter custom JavaScript code'
                        };
                    }
                    break;
            }
        }
        
        return { isValid: true };
    }

    getScriptConfig() {
        const selectorType = document.getElementById('selectorType').value;
        let selector = '';
        
        if (selectorType === 'advanced') {
            selector = this.buildAdvancedSelector();
        } else {
            selector = document.getElementById('cssSelector').value.trim();
        }
        
        return {
            selector: selector,
            selectorType: selectorType,
            fallbackSelectors: document.getElementById('fallbackSelectors').value
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0),
            features: this.getSelectedFeatures(),
            actionType: document.getElementById('actionType').value,
            
            // Action-specific configurations
            modifyProperty: document.getElementById('modifyProperty')?.value || '',
            modifyValue: document.getElementById('modifyValue')?.value || '',
            customAttribute: document.getElementById('customAttribute')?.value || '',
            
            elementType: document.getElementById('elementType')?.value || '',
            addPosition: document.getElementById('addPosition')?.value || '',
            addContent: document.getElementById('addContent')?.value || '',
            addClasses: document.getElementById('addClasses')?.value || '',
            
            removeAction: document.getElementById('removeAction')?.value || '',
            removeValue: document.getElementById('removeValue')?.value || '',
            
            cssProperties: document.getElementById('cssProperties')?.value || '',
            importantStyles: document.getElementById('importantStyles')?.checked || false,
            
            eventType: document.getElementById('eventType')?.value || '',
            eventCode: document.getElementById('eventCode')?.value || '',
            preventDefault: document.getElementById('preventDefault')?.checked || false,
            
            widgetType: document.getElementById('widgetType')?.value || '',
            widgetConfig: document.getElementById('widgetConfig')?.value || '',
            widgetContainer: document.getElementById('widgetContainer')?.value || '',
            
            formAction: document.getElementById('formAction')?.value || '',
            formConfig: document.getElementById('formConfig')?.value || '',
            
            customCode: document.getElementById('customCode')?.value || '',
            wrapInTryCatch: document.getElementById('wrapInTryCatch')?.checked || false
        };
    }

    getSelectedFeatures() {
        const features = {};
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            features[checkbox.id] = checkbox.checked;
        });
        
        return features;
    }

    buildScript(config) {
        const scriptParts = [];
        
        // Generate header documentation
        scriptParts.push(this.generateHeader(config));
        
        // Generate utility functions
        scriptParts.push(this.generateUtilityFunctions(config));
        
        // Generate main function
        scriptParts.push(this.generateMainFunction(config));
        
        // Generate wrapper with all selected features
        scriptParts.push(this.generateWrapper(config));
        
        return scriptParts.join('\n\n');
    }

    generateHeader(config) {
        const now = new Date();
        const dealerId = this.extractDealerId();
        const actionDescription = this.getActionDescription(config);
        
        return `/**
 * ${actionDescription} - GCP Script Builder
 * 
 * AUTO-GENERATED CODE - DO NOT EDIT MANUALLY
 * Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}
 * Dealer ID: ${dealerId}
 * 
 * PURPOSE:
 * ${this.generatePurposeDescription(config)}
 * 
 * KEY FEATURES:
${this.generateFeaturesList(config)}
 * 
 * TECHNICAL DETAILS:
 * - Target Selector: ${config.selector ? config.selector.replace(/"/g, '\\"') : 'Not specified'}
 * - Selector Type: ${config.selectorType}
 * - Action Type: ${config.actionType || 'None'}
 * 
 * USAGE:
 * This script should be injected into the browser console or added to the website.
 * It will automatically execute based on the configured settings.
 * 
 * @version 1.0
 * @author GCP Script Builder
 * @compatible Modern browsers with ES6+ support
 */`;
    }

    generateUtilityFunctions(config) {
        const utilities = [];
        
        // Always include selector validation
        utilities.push(`/**
 * Validates and finds elements using the configured selector with fallbacks
 * @param {string} primarySelector - The main CSS selector
 * @param {Array} fallbackSelectors - Array of fallback selectors
 * @returns {Element|null} - Found element or null
 */
function findTargetElement(primarySelector, fallbackSelectors = []) {
    try {
        // Try primary selector first
        if (primarySelector) {
            let element = null;
            
            // Handle special text-based selectors that can't be done with pure CSS
            if (primarySelector.includes('[data-text-')) {
                element = findElementByTextContent(primarySelector);
            } else {
                element = document.querySelector(primarySelector);
            }
            
            if (element) {
                ${config.features.debugging ? 'console.log("✅ Found element with primary selector:", primarySelector, element);' : ''}
                return element;
            }
            ${config.features.debugging ? 'console.warn("⚠️ Primary selector found no elements:", primarySelector);' : ''}
        }
        
        // Try fallback selectors
        for (const fallback of fallbackSelectors) {
            if (fallback.trim()) {
                let element = null;
                
                if (fallback.includes('[data-text-')) {
                    element = findElementByTextContent(fallback.trim());
                } else {
                    element = document.querySelector(fallback.trim());
                }
                
                if (element) {
                    ${config.features.debugging ? 'console.log("✅ Found element with fallback selector:", fallback, element);' : ''}
                    return element;
                }
                ${config.features.debugging ? 'console.warn("⚠️ Fallback selector found no elements:", fallback);' : ''}
            }
        }
        
        ${config.features.debugging ? 'console.error("❌ No elements found with any selector");' : ''}
        return null;
    } catch (error) {
        ${config.features.errorHandling ? 'console.error("Error finding target element:", error);' : ''}
        return null;
    }
}

/**
 * Finds elements based on text content (for advanced selector builder)
 * @param {string} selector - The pseudo selector with text conditions
 * @returns {Element|null} - Found element or null
 */
function findElementByTextContent(selector) {
    // Parse the text condition from the selector
    const textConditions = {
        contains: selector.match(/\\[data-text-contains="([^"]+)"\\]/),
        equals: selector.match(/\\[data-text-equals="([^"]+)"\\]/),
        starts: selector.match(/\\[data-text-starts="([^"]+)"\\]/),
        ends: selector.match(/\\[data-text-ends="([^"]+)"\\]/)
    };
    
    let condition = null;
    let searchText = '';
    
    for (const [type, match] of Object.entries(textConditions)) {
        if (match) {
            condition = type;
            searchText = match[1];
            break;
        }
    }
    
    if (!condition || !searchText) return null;
    
    // Search all elements for matching text content
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
        const textContent = element.textContent.trim();
        
        switch (condition) {
            case 'contains':
                if (textContent.includes(searchText)) return element;
                break;
            case 'equals':
                if (textContent === searchText) return element;
                break;
            case 'starts':
                if (textContent.startsWith(searchText)) return element;
                break;
            case 'ends':
                if (textContent.endsWith(searchText)) return element;
                break;
        }
    }
    
    return null;
}`);

        // Add page detection utilities if needed
        if (config.features.vdpDetection || config.features.srpDetection || config.features.customPageDetection) {
            utilities.push(this.generatePageDetectionFunctions(config));
        }

        // Add debouncing utility if needed
        if (config.features.debouncing) {
            utilities.push(`/**
 * Debouncing utility to prevent excessive function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait = 1000) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}`);
        }

        // Add cleanup utilities if needed
        if (config.features.cleanup) {
            utilities.push(`/**
 * Cleanup function to remove event listeners and intervals
 */
let cleanupFunctions = [];
function addCleanupFunction(fn) {
    cleanupFunctions.push(fn);
}

function cleanup() {
    ${config.features.debugging ? 'console.log("🧹 Cleaning up resources...");' : ''}
    cleanupFunctions.forEach(fn => {
        try {
            fn();
        } catch (error) {
            ${config.features.errorHandling ? 'console.error("Error during cleanup:", error);' : ''}
        }
    });
    cleanupFunctions = [];
}`);
        }

        return utilities.join('\n\n');
    }

    generateMainFunction(config) {
        const functionName = this.generateFunctionName(config);
        const actionCode = this.generateActionCode(config);
        
        return `/**
 * Main function that performs the configured action
 */
function ${functionName}() {
    ${config.features.errorHandling ? 'try {' : ''}
        ${config.features.debugging ? `console.log("🚀 Starting ${functionName}...");` : ''}
        
        // Find target element(s)
        const targetElement = findTargetElement(
            ${JSON.stringify(config.selector || '')},
            ${JSON.stringify(config.fallbackSelectors || [])}
        );
        
        if (!targetElement) {
            ${config.features.debugging ? 'console.error("❌ Target element not found. Script will not execute.");' : ''}
            return false;
        }
        
        ${config.features.elementHighlighting ? this.generateHighlightCode() : ''}
        
        ${actionCode}
        
        ${config.features.debugging ? `console.log("✅ ${functionName} completed successfully");` : ''}
        return true;
        
    ${config.features.errorHandling ? `} catch (error) {
        ${config.features.consoleLogging ? 'console.error("Error in ' + functionName + ':", error);' : ''}
        return false;
    }` : ''}
}`;
    }

    generateActionCode(config) {
        const actionType = config.actionType;
        
        switch (actionType) {
            case 'modify':
                return this.generateModifyCode(config);
            case 'add':
                return this.generateAddCode(config);
            case 'remove':
                return this.generateRemoveCode(config);
            case 'style':
                return this.generateStyleCode(config);
            case 'event':
                return this.generateEventCode(config);
            case 'widget':
                return this.generateWidgetCode(config);
            case 'form':
                return this.generateFormCode(config);
            case 'custom':
                return this.generateCustomCode(config);
            default:
                return `        // No action configured
        ${config.features.debugging ? 'console.log("ℹ️ No action specified - element found successfully");' : ''}`;
        }
    }

    generateWrapper(config) {
        const functionName = this.generateFunctionName(config);
        const wrapperParts = [];
        
        // Start wrapper
        wrapperParts.push('// Self-executing wrapper with comprehensive feature support');
        wrapperParts.push('(function() {');
        wrapperParts.push("    'use strict';");
        wrapperParts.push('');
        
        // Prevent duplicates
        if (config.features.preventDuplicates) {
            const scriptId = this.generateScriptId(config);
            wrapperParts.push(`    // Prevent multiple script executions`);
            wrapperParts.push(`    if (window.${scriptId}) {`);
            wrapperParts.push(`        ${config.features.debugging ? 'console.log("Script already running, skipping execution");' : ''}`);
            wrapperParts.push(`        return;`);
            wrapperParts.push(`    }`);
            wrapperParts.push(`    window.${scriptId} = true;`);
            wrapperParts.push('');
        }
        
        // Add SPA navigation handling
        if (config.features.spaFriendly || config.features.urlMonitoring) {
            wrapperParts.push(this.generateNavigationHandling(config, functionName));
        }
        
        // Add mutation observer
        if (config.features.mutationObserver) {
            wrapperParts.push(this.generateMutationObserver(config, functionName));
        }
        
        // Add interval monitoring
        if (config.features.intervalMonitoring) {
            wrapperParts.push(this.generateIntervalMonitoring(config, functionName));
        }
        
        // Main execution logic
        wrapperParts.push(`    // Main execution function`);
        wrapperParts.push(`    function executeScript() {`);
        
        if (config.features.debouncing) {
            wrapperParts.push(`        const debouncedExecution = debounce(${functionName}, 1000);`);
            wrapperParts.push(`        debouncedExecution();`);
        } else {
            wrapperParts.push(`        ${functionName}();`);
        }
        
        wrapperParts.push(`    }`);
        wrapperParts.push('');
        
        // DOM ready handling
        if (config.features.domReady) {
            wrapperParts.push(`    // DOM ready state handling`);
            wrapperParts.push(`    if (document.readyState === 'loading') {`);
            wrapperParts.push(`        document.addEventListener('DOMContentLoaded', executeScript);`);
            wrapperParts.push(`    } else {`);
            wrapperParts.push(`        executeScript();`);
            wrapperParts.push(`    }`);
        } else {
            wrapperParts.push(`    // Execute immediately`);
            wrapperParts.push(`    executeScript();`);
        }
        
        // Add additional execution attempts for dynamic content
        if (config.features.asyncLoading) {
            wrapperParts.push('');
            wrapperParts.push(`    // Additional attempts for dynamically loaded content`);
            wrapperParts.push(`    setTimeout(executeScript, 1000);`);
            wrapperParts.push(`    setTimeout(executeScript, 3000);`);
        }
        
        // Cleanup on page unload
        if (config.features.cleanup) {
            wrapperParts.push('');
            wrapperParts.push(`    // Cleanup on page unload`);
            wrapperParts.push(`    window.addEventListener('beforeunload', cleanup);`);
        }
        
        // Close wrapper
        wrapperParts.push('');
        wrapperParts.push('})();');
        
        return wrapperParts.join('\n');
    }

    // Helper functions for script generation

    extractDealerId() {
        // Try to extract dealer ID from current URL or generate a random one
        const urlMatch = window.location.hostname.match(/(\d{3,4})/);
        return urlMatch ? urlMatch[1] : Math.floor(Math.random() * 9000) + 1000;
    }

    getActionDescription(config) {
        const actionType = config.actionType;
        const actionMap = {
            'modify': 'Element Modification Script',
            'add': 'Element Addition Script', 
            'remove': 'Element Removal Script',
            'style': 'CSS Styling Script',
            'event': 'Event Handler Script',
            'widget': 'Widget Integration Script',
            'form': 'Form Handler Script',
            'custom': 'Custom JavaScript Script'
        };
        return actionMap[actionType] || 'General Purpose Script';
    }

    generatePurposeDescription(config) {
        const selectorText = config.selector ? config.selector.replace(/"/g, '\\"') : 'unspecified selector';
        let purpose = `This script targets elements using "${selectorText}" and `;
        
        switch (config.actionType) {
            case 'modify':
                purpose += 'modifies their properties or content.';
                break;
            case 'add':
                purpose += 'adds new elements to the page.';
                break;
            case 'remove':
                purpose += 'removes elements or their content.';
                break;
            case 'style':
                purpose += 'applies custom CSS styling.';
                break;
            case 'event':
                purpose += 'adds interactive event listeners.';
                break;
            case 'widget':
                purpose += 'integrates third-party widgets.';
                break;
            case 'form':
                purpose += 'handles form submissions and data.';
                break;
            case 'custom':
                purpose += 'executes custom JavaScript code.';
                break;
            default:
                purpose += 'performs general page modifications.';
        }
        
        return purpose;
    }

    generateFeaturesList(config) {
        const enabledFeatures = Object.entries(config.features)
            .filter(([key, value]) => value)
            .map(([key, value]) => ` * ✅ ${this.formatFeatureName(key)}`);
        
        return enabledFeatures.length > 0 ? enabledFeatures.join('\n') : ' * ✅ Basic functionality';
    }

    generateFunctionName(config) {
        const actionType = config.actionType || 'general';
        const actionMap = {
            'modify': 'modifyTargetElement',
            'add': 'addElementToPage',
            'remove': 'removeTargetElement', 
            'style': 'applyCustomStyling',
            'event': 'addEventHandlers',
            'widget': 'insertWidget',
            'form': 'handleFormSubmission',
            'custom': 'executeCustomCode'
        };
        return actionMap[actionType] || 'executeMainScript';
    }

    generateScriptId(config) {
        const actionType = config.actionType || 'general';
        return `gcpScript${actionType.charAt(0).toUpperCase() + actionType.slice(1)}Active`;
    }

    generateHighlightCode() {
        return `        // Highlight target element for debugging
        if (targetElement) {
            const originalStyle = targetElement.style.cssText;
            targetElement.style.outline = '3px solid #ff0000';
            targetElement.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
            setTimeout(() => {
                targetElement.style.cssText = originalStyle;
            }, 3000);
        }`;
    }

    generatePageDetectionFunctions(config) {
        const functions = [];
        
        if (config.features.vdpDetection) {
            functions.push(`/**
 * Detects if current page is a Vehicle Detail Page (VDP)
 * @returns {boolean} - True if current page is a VDP
 */
function isVDPPage() {
    const currentUrl = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    const vdpPatterns = [
        /\\/vdp\\//,
        /\\/vehicle\\//,
        /\\/inventory\\/.*\\/details/,
        /\\/cars\\/.*\\/details/,
        /\\/used\\/.*\\/details/,
        /\\/new\\/.*\\/details/,
        /\\/detail\\//,
        /\\/vehicles\\/\\d+/,
        /\\/inventory\\/\\d+/,
        /\\/listing\\/\\d+/,
        /\\/car\\/\\d+/,
        /\\/auto\\/.*\\/\\d+/
    ];
    
    return vdpPatterns.some(pattern => pattern.test(pathname) || pattern.test(currentUrl));
}`);
        }

        if (config.features.srpDetection) {
            functions.push(`/**
 * Detects if current page is a Search Results Page (SRP)
 * @returns {boolean} - True if current page is a SRP
 */
function isSRPPage() {
    const pathname = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    
    const srpPatterns = [
        /\\/inventory/,
        /\\/search/,
        /\\/vehicles/,
        /\\/cars/,
        /\\/used/,
        /\\/new/
    ];
    
    const srpParams = ['search', 'make', 'model', 'year', 'price'];
    const hasSearchParams = srpParams.some(param => search.includes(param));
    
    return srpPatterns.some(pattern => pattern.test(pathname)) || hasSearchParams;
}`);
        }

        return functions.join('\n\n');
    }

    generateNavigationHandling(config, functionName) {
        return `    // Navigation change detection for SPA support
    let currentUrl = window.location.href;
    
    function handleUrlChange() {
        const newUrl = window.location.href;
        if (newUrl !== currentUrl) {
            currentUrl = newUrl;
            ${config.features.debugging ? 'console.log("🔄 URL changed, re-executing script:", newUrl);' : ''}
            setTimeout(executeScript, 100);
        }
    }
    
    // Listen for navigation events
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    
    // Override history methods for SPA detection
    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(history, arguments);
        handleUrlChange();
    };
    
    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
        originalReplaceState.apply(history, arguments);
        handleUrlChange();
    };
    
    ${config.features.cleanup ? 'addCleanupFunction(() => { history.pushState = originalPushState; history.replaceState = originalReplaceState; });' : ''}`;
    }

    generateMutationObserver(config, functionName) {
        return `    // DOM Mutation Observer for dynamic content
    const observer = new MutationObserver((mutations) => {
        let shouldRerun = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                shouldRerun = true;
            }
        });
        
        if (shouldRerun) {
            ${config.features.debugging ? 'console.log("🔄 DOM mutations detected, re-executing script");' : ''}
            ${config.features.debouncing ? 'debounce(executeScript, 500)();' : 'setTimeout(executeScript, 500);'}
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    ${config.features.cleanup ? 'addCleanupFunction(() => observer.disconnect());' : ''}`;
    }

    generateIntervalMonitoring(config, functionName) {
        return `    // Interval monitoring for periodic checks
    const monitoringInterval = setInterval(() => {
        ${config.features.debugging ? 'console.log("⏱️ Periodic check executing");' : ''}
        executeScript();
    }, 5000);
    
    ${config.features.cleanup ? 'addCleanupFunction(() => clearInterval(monitoringInterval));' : ''}`;
    }

    // Action-specific code generators

    generateModifyCode(config) {
        const modifyProperty = document.getElementById('modifyProperty')?.value || 'textContent';
        const modifyValue = document.getElementById('modifyValue')?.value || '';
        const customAttribute = document.getElementById('customAttribute')?.value || '';
        
        let code = '';
        
        if (modifyProperty === 'custom' && customAttribute) {
            code = `        // Modify custom attribute
        targetElement.setAttribute('${customAttribute}', \`${modifyValue}\`);
        ${config.features.debugging ? `console.log("✅ Modified ${customAttribute} to:", \`${modifyValue}\`);` : ''}`;
        } else {
            code = `        // Modify element ${modifyProperty}
        targetElement.${modifyProperty} = \`${modifyValue}\`;
        ${config.features.debugging ? `console.log("✅ Modified ${modifyProperty} to:", \`${modifyValue}\`);` : ''}`;
        }
        
        return code;
    }

    generateAddCode(config) {
        const elementType = document.getElementById('elementType')?.value || 'div';
        const addPosition = document.getElementById('addPosition')?.value || 'append';
        const addContent = document.getElementById('addContent')?.value || '';
        const addClasses = document.getElementById('addClasses')?.value || '';
        
        const isCustomHTML = elementType === 'custom';
        
        let code = '';
        
        if (isCustomHTML) {
            code = `        // Add custom HTML content
        const newElement = document.createElement('div');
        newElement.innerHTML = \`${addContent}\`;
        const elementToAdd = newElement.firstElementChild || newElement;`;
        } else {
            code = `        // Create new ${elementType} element
        const elementToAdd = document.createElement('${elementType}');
        elementToAdd.innerHTML = \`${addContent}\`;`;
        }
        
        if (addClasses) {
            code += `\n        elementToAdd.className = '${addClasses}';`;
        }
        
        const positionMap = {
            'append': 'targetElement.appendChild(elementToAdd);',
            'prepend': 'targetElement.insertBefore(elementToAdd, targetElement.firstChild);',
            'before': 'targetElement.parentNode.insertBefore(elementToAdd, targetElement);',
            'after': 'targetElement.parentNode.insertBefore(elementToAdd, targetElement.nextSibling);'
        };
        
        code += `
        
        // Insert element at specified position
        ${positionMap[addPosition] || positionMap['append']}
        ${config.features.debugging ? `console.log("✅ Added ${elementType} element");` : ''}`;
        
        return code;
    }

    generateRemoveCode(config) {
        const removeAction = document.getElementById('removeAction')?.value || 'element';
        const removeValue = document.getElementById('removeValue')?.value || '';
        
        let code = '';
        
        switch (removeAction) {
            case 'element':
                code = `        // Remove entire element
        targetElement.remove();
        ${config.features.debugging ? 'console.log("✅ Element removed");' : ''}`;
                break;
            case 'content':
                code = `        // Remove element content
        targetElement.innerHTML = '';
        ${config.features.debugging ? 'console.log("✅ Element content cleared");' : ''}`;
                break;
            case 'attribute':
                code = `        // Remove specific attribute
        targetElement.removeAttribute('${removeValue}');
        ${config.features.debugging ? `console.log("✅ Removed attribute: ${removeValue}");` : ''}`;
                break;
            case 'class':
                code = `        // Remove CSS class
        targetElement.classList.remove('${removeValue}');
        ${config.features.debugging ? `console.log("✅ Removed class: ${removeValue}");` : ''}`;
                break;
        }
        
        return code;
    }

    generateStyleCode(config) {
        const cssProperties = document.getElementById('cssProperties')?.value || '';
        const importantStyles = document.getElementById('importantStyles')?.checked || false;
        
        const properties = cssProperties.split('\n')
            .filter(line => line.trim())
            .map(line => line.trim());
        
        let code = `        // Apply custom CSS styles
        const styles = {`;
        
        properties.forEach(prop => {
            const [property, value] = prop.split(':').map(s => s.trim());
            if (property && value) {
                const cleanValue = value.replace(/;$/, '');
                const finalValue = importantStyles ? `${cleanValue} !important` : cleanValue;
                const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                code += `\n            '${camelProperty}': '${finalValue}',`;
            }
        });
        
        code += `
        };
        
        Object.assign(targetElement.style, styles);
        ${config.features.debugging ? 'console.log("✅ Applied custom styles:", styles);' : ''}`;
        
        return code;
    }

    generateEventCode(config) {
        const eventType = document.getElementById('eventType')?.value || 'click';
        const eventCode = document.getElementById('eventCode')?.value || '';
        const preventDefault = document.getElementById('preventDefault')?.checked || false;
        
        let code = `        // Add ${eventType} event listener
        const eventHandler = function(event) {
            ${preventDefault ? 'event.preventDefault();' : ''}
            ${config.features.debugging ? `console.log("🎯 ${eventType} event triggered");` : ''}
            
            try {
                ${eventCode}
            } catch (error) {
                ${config.features.errorHandling ? 'console.error("Event handler error:", error);' : ''}
            }
        };
        
        targetElement.addEventListener('${eventType}', eventHandler);
        ${config.features.cleanup ? 'addCleanupFunction(() => targetElement.removeEventListener(\'' + eventType + '\', eventHandler));' : ''}
        ${config.features.debugging ? `console.log("✅ Added ${eventType} event listener");` : ''}`;
        
        return code;
    }

    generateWidgetCode(config) {
        const widgetType = document.getElementById('widgetType')?.value || 'custom';
        const widgetConfig = document.getElementById('widgetConfig')?.value || '';
        const widgetContainer = document.getElementById('widgetContainer')?.value || 'widget-container';
        
        let code = '';
        
        switch (widgetType) {
            case 'accutrade':
                code = `        // Insert AccuTrade widget
        const accuTradeContainer = document.createElement('div');
        accuTradeContainer.id = '${widgetContainer}';
        targetElement.appendChild(accuTradeContainer);
        
        // Load AccuTrade script
        const script = document.createElement('script');
        script.src = 'https://cashoffer.accu-trade.com/embed/embed.js';
        script.onload = function() {
            ${config.features.debugging ? 'console.log("✅ AccuTrade widget loaded");' : ''}
        };
        document.head.appendChild(script);`;
                break;
            case 'elfsight':
                code = `        // Insert Elfsight widget
        const elfsightWidget = document.createElement('div');
        elfsightWidget.className = 'elfsight-app-${widgetConfig || 'widget-id'}';
        targetElement.appendChild(elfsightWidget);
        
        // Load Elfsight script
        const elfsightScript = document.createElement('script');
        elfsightScript.src = 'https://apps.elfsight.com/p/platform.js';
        elfsightScript.defer = true;
        document.head.appendChild(elfsightScript);`;
                break;
            default:
                code = `        // Insert custom widget
        const widgetContainer = document.createElement('div');
        widgetContainer.id = '${widgetContainer}';
        widgetContainer.innerHTML = \`${widgetConfig}\`;
        targetElement.appendChild(widgetContainer);`;
        }
        
        code += `\n        ${config.features.debugging ? `console.log("✅ ${widgetType} widget inserted");` : ''}`;
        
        return code;
    }

    generateFormCode(config) {
        const formAction = document.getElementById('formAction')?.value || 'intercept';
        const formConfig = document.getElementById('formConfig')?.value || '';
        
        let code = '';
        
        switch (formAction) {
            case 'intercept':
                code = `        // Intercept form submission
        if (targetElement.tagName === 'FORM') {
            targetElement.addEventListener('submit', function(event) {
                event.preventDefault();
                ${config.features.debugging ? 'console.log("📋 Form submission intercepted");' : ''}
                
                const formData = new FormData(targetElement);
                const data = Object.fromEntries(formData.entries());
                ${config.features.debugging ? 'console.log("Form data:", data);' : ''}
                
                // Custom form handling
                ${formConfig}
            });
        }`;
                break;
            case 'validate':
                code = `        // Add form validation
        if (targetElement.tagName === 'FORM') {
            targetElement.addEventListener('submit', function(event) {
                ${config.features.debugging ? 'console.log("🔍 Validating form");' : ''}
                
                // Custom validation logic
                ${formConfig}
            });
        }`;
                break;
            case 'webhook':
                code = `        // Send form data to webhook
        if (targetElement.tagName === 'FORM') {
            targetElement.addEventListener('submit', function(event) {
                event.preventDefault();
                
                const formData = new FormData(targetElement);
                const data = Object.fromEntries(formData.entries());
                
                fetch('${formConfig}', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                }).then(response => {
                    ${config.features.debugging ? 'console.log("✅ Form data sent to webhook");' : ''}
                }).catch(error => {
                    ${config.features.errorHandling ? 'console.error("Webhook error:", error);' : ''}
                });
            });
        }`;
                break;
            default:
                code = `        // Custom form handling
        ${formConfig}`;
        }
        
        return code;
    }

    generateCustomCode(config) {
        const customCode = document.getElementById('customCode')?.value || '';
        const wrapInTryCatch = document.getElementById('wrapInTryCatch')?.checked || false;
        
        let code = '';
        
        if (wrapInTryCatch) {
            code = `        // Custom JavaScript code (wrapped in try-catch)
        try {
            ${customCode}
            ${config.features.debugging ? 'console.log("✅ Custom code executed successfully");' : ''}
        } catch (error) {
            ${config.features.errorHandling ? 'console.error("Custom code error:", error);' : ''}
        }`;
        } else {
            code = `        // Custom JavaScript code
        ${customCode}
        ${config.features.debugging ? 'console.log("✅ Custom code executed");' : ''}`;
        }
        
        return code;
    }

    // Advanced Selector Builder Functions

    buildAdvancedSelector() {
        const conditions = document.querySelectorAll('.condition-item');
        const selectorParts = [];
        
        console.log('Building advanced selector from', conditions.length, 'conditions');
        
        conditions.forEach((condition, index) => {
            const attribute = condition.querySelector('.condition-attribute').value;
            const operator = condition.querySelector('.condition-operator').value;
            const value = condition.querySelector('.condition-value').value;
            
            console.log(`Condition ${index + 1}:`, { attribute, operator, value });
            
            if (attribute && value) {
                const selectorPart = this.buildConditionSelector(attribute, operator, value);
                if (selectorPart) {
                    selectorParts.push(selectorPart);
                    console.log(`Generated selector part:`, selectorPart);
                }
            }
        });
        
        // Combine all conditions - for now, we'll use a simple approach
        // In the future, this could be enhanced to support AND/OR logic
        let finalSelector = '';
        
        if (selectorParts.length === 0) {
            finalSelector = '';
        } else if (selectorParts.length === 1) {
            finalSelector = selectorParts[0];
        } else {
            // For multiple conditions, we'll create a selector that matches all conditions
            // This creates a more specific selector
            finalSelector = selectorParts.join('');
        }
        
        console.log('Final advanced selector:', finalSelector);
        return finalSelector;
    }

    buildConditionSelector(attribute, operator, value) {
        switch (attribute) {
            case 'class':
                return this.buildClassSelector(operator, value);
            case 'id':
                return this.buildIdSelector(operator, value);
            case 'tag':
                return this.buildTagSelector(operator, value);
            case 'attribute':
                return this.buildAttributeSelector(operator, value);
            case 'text':
                return this.buildTextSelector(operator, value);
            case 'parent':
                return this.buildParentSelector(operator, value);
            default:
                return '';
        }
    }

    buildClassSelector(operator, value) {
        switch (operator) {
            case 'contains':
                return `[class*="${value}"]`;
            case 'equals':
                return `.${value}`;
            case 'starts':
                return `[class^="${value}"], [class*=" ${value}"]`;
            case 'ends':
                return `[class$="${value}"], [class*="${value} "]`;
            case 'exists':
                return '[class]';
            case 'not-exists':
                return ':not([class])';
            default:
                return `.${value}`;
        }
    }

    buildIdSelector(operator, value) {
        switch (operator) {
            case 'contains':
                return `[id*="${value}"]`;
            case 'equals':
                return `#${value}`;
            case 'starts':
                return `[id^="${value}"]`;
            case 'ends':
                return `[id$="${value}"]`;
            case 'exists':
                return '[id]';
            case 'not-exists':
                return ':not([id])';
            default:
                return `#${value}`;
        }
    }

    buildTagSelector(operator, value) {
        switch (operator) {
            case 'equals':
                return value.toLowerCase();
            case 'exists':
                return '*';
            default:
                return value.toLowerCase();
        }
    }

    buildAttributeSelector(operator, value) {
        // Expect format like "data-attr" or "data-attr=somevalue"
        const [attrName, attrValue] = value.includes('=') ? value.split('=') : [value, ''];
        
        switch (operator) {
            case 'contains':
                return attrValue ? `[${attrName}*="${attrValue}"]` : `[${attrName}]`;
            case 'equals':
                return attrValue ? `[${attrName}="${attrValue}"]` : `[${attrName}]`;
            case 'starts':
                return attrValue ? `[${attrName}^="${attrValue}"]` : `[${attrName}]`;
            case 'ends':
                return attrValue ? `[${attrName}$="${attrValue}"]` : `[${attrName}]`;
            case 'exists':
                return `[${attrName}]`;
            case 'not-exists':
                return `:not([${attrName}])`;
            default:
                return `[${attrName}]`;
        }
    }

    buildTextSelector(operator, value) {
        // CSS doesn't have direct text content selectors, so we'll use a pseudo approach
        // This will need to be handled differently in the generated script
        switch (operator) {
            case 'contains':
                return `*[data-text-contains="${value}"]`;
            case 'equals':
                return `*[data-text-equals="${value}"]`;
            case 'starts':
                return `*[data-text-starts="${value}"]`;
            case 'ends':
                return `*[data-text-ends="${value}"]`;
            default:
                return `*[data-text-contains="${value}"]`;
        }
    }

    buildParentSelector(operator, value) {
        switch (operator) {
            case 'contains':
                return `${value} *`;
            case 'equals':
                return `${value} > *`;
            default:
                return `${value} *`;
        }
    }

    minifyScript(script) {
        // Basic minification - remove comments and extra whitespace
        return script
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .replace(/\/\/.*$/gm, '') // Remove line comments
            .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
            .replace(/;\s*}/g, ';}') // Remove space before closing braces
            .trim();
    }

    generateDocumentation(config) {
        return `
            <h3>Script Documentation</h3>
            <h4>Configuration Summary</h4>
            <ul>
                <li><strong>Selector:</strong> ${config.selector || 'Not specified'}</li>
                <li><strong>Selector Type:</strong> ${config.selectorType}</li>
                <li><strong>Action Type:</strong> ${config.actionType || 'None'}</li>
            </ul>
            
            <h4>Enabled Features</h4>
            <ul>
                ${Object.entries(config.features)
                    .filter(([key, value]) => value)
                    .map(([key, value]) => `<li>${this.formatFeatureName(key)}</li>`)
                    .join('')}
            </ul>
            
            <h4>Usage Instructions</h4>
            <ol>
                <li>Copy the generated script</li>
                <li>Open the browser console on your target website</li>
                <li>Paste and execute the script</li>
                <li>The script will run automatically based on your configuration</li>
            </ol>
        `;
    }

    formatFeatureName(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    copyScript() {
        const scriptOutput = document.getElementById('scriptOutput');
        const script = scriptOutput.textContent;
        
        navigator.clipboard.writeText(script).then(() => {
            this.showNotification('Script copied to clipboard!', 'success');
        }).catch(() => {
            this.showNotification('Failed to copy script', 'error');
        });
    }

    downloadScript() {
        const scriptOutput = document.getElementById('scriptOutput');
        const script = scriptOutput.textContent;
        
        const blob = new Blob([script], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated-script-${Date.now()}.js`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.showNotification('Script downloaded!', 'success');
    }

    validateSelector() {
        const selectorType = document.getElementById('selectorType').value;
        let selector = '';
        
        if (selectorType === 'advanced') {
            selector = this.buildAdvancedSelector();
        } else {
            selector = document.getElementById('cssSelector').value;
        }
        
        if (!selector) {
            if (selectorType === 'advanced') {
                this.showTestResult('Please add at least one condition in the Advanced Builder', 'error');
            } else {
                this.showTestResult('Please enter a CSS selector', 'error');
            }
            return;
        }
        
        try {
            // Test if selector is valid CSS (skip text-based pseudo selectors)
            if (selector.includes('[data-text-')) {
                this.showTestResult('Advanced text-based selector - will be handled by custom function', 'success');
            } else {
                document.querySelector(selector);
                this.showTestResult('Selector syntax is valid', 'success');
            }
        } catch (error) {
            this.showTestResult(`Invalid selector: ${error.message}`, 'error');
        }
    }

    testScript() {
        this.showTestResult('Script testing functionality will be implemented in future versions', 'info');
    }

    showTestResult(message, type) {
        const testResults = document.getElementById('testResults');
        testResults.style.display = 'block';
        testResults.className = `test-results test-result-${type}`;
        testResults.textContent = message;
        
        setTimeout(() => {
            testResults.style.display = 'none';
        }, 5000);
    }

    showNotification(message, type) {
        // Create a simple notification (can be enhanced with a proper notification system)
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            transition: opacity 0.3s ease;
        `;
        
        if (type === 'success') {
            notification.style.backgroundColor = '#28a745';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#dc3545';
        } else {
            notification.style.backgroundColor = '#17a2b8';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    updateScriptPreview() {
        // Auto-update preview when settings change (debounced)
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
            // Only auto-generate if there's already content
            const currentScript = document.getElementById('scriptOutput').textContent;
            if (currentScript && !currentScript.includes('Your generated script will appear here')) {
                this.generateScript();
            }
        }, 1000);
    }
}

// Initialize the script builder when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Script Builder...');
    window.scriptBuilder = new ScriptBuilder();
    console.log('Script Builder initialized successfully');
});

// Handle dynamic content in action config
document.addEventListener('change', (e) => {
    if (e.target.id === 'modifyProperty' && e.target.value === 'custom') {
        document.getElementById('customAttributeGroup').style.display = 'block';
    } else if (e.target.id === 'modifyProperty') {
        document.getElementById('customAttributeGroup').style.display = 'none';
    }
    
    if (e.target.id === 'removeAction') {
        const removeValueGroup = document.getElementById('removeValueGroup');
        if (removeValueGroup) {
            if (e.target.value === 'element' || e.target.value === 'content') {
                removeValueGroup.style.display = 'none';
            } else {
                removeValueGroup.style.display = 'block';
            }
        }
    }
});

