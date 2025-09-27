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
    }

    removeCondition(conditionId) {
        const conditionElement = document.querySelector(`[data-condition-id="${conditionId}"]`);
        if (conditionElement) {
            conditionElement.remove();
            this.conditions = this.conditions.filter(id => id !== conditionId);
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
    }

    getScriptConfig() {
        // This will be implemented to gather all configuration from the UI
        return {
            selector: document.getElementById('cssSelector').value,
            selectorType: document.getElementById('selectorType').value,
            fallbackSelectors: document.getElementById('fallbackSelectors').value.split('\n').filter(s => s.trim()),
            features: this.getSelectedFeatures(),
            actionType: document.getElementById('actionType').value,
            // Add more configuration gathering here
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
        // This is a placeholder - the actual script generation will be implemented
        return `/**
 * Generated Script - GCP Script Builder
 * 
 * AUTO-GENERATED CODE - DO NOT EDIT MANUALLY
 * Generated on: ${new Date().toISOString()}
 */

// This is a placeholder for the generated script
// The actual implementation will create a complete script based on configuration

(function() {
    'use strict';
    
    console.log('Generated script placeholder');
    console.log('Configuration:', ${JSON.stringify(config, null, 2)});
    
})();`;
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
        const selector = document.getElementById('cssSelector').value;
        const testUrl = document.getElementById('testUrl').value;
        
        if (!selector) {
            this.showTestResult('Please enter a CSS selector', 'error');
            return;
        }
        
        try {
            // Test if selector is valid CSS
            document.querySelector(selector);
            this.showTestResult('Selector syntax is valid', 'success');
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

