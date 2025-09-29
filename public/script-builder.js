/**
 * Script Builder Module
 * 
 * Core logic for generating custom JavaScript scripts based on user configuration.
 * Follows the GCP Scripts standards and patterns for browser console execution.
 */

class ScriptBuilder {
    constructor() {
        this.config = {};
        this.templates = this.loadTemplates();
    }

    /**
     * Load script templates
     */
    loadTemplates() {
        return {
            header: (description, enabledFeatures = []) => {
                const parts = [];
                parts.push('/**');
                
                if (description) {
                    parts.push(` * ${description}`);
                    parts.push(' * ' + '-'.repeat(60));
                }
                
                // Usage instructions removed - not needed in generated scripts
                
                // Add enabled features
                if (enabledFeatures.length > 0) {
                    parts.push(' * ');
                    parts.push(' * Enabled Features:');
                    enabledFeatures.forEach(feature => {
                        const featureName = feature.replace(/([A-Z])/g, ' $1').toLowerCase();
                        parts.push(` * - ${featureName.charAt(0).toUpperCase() + featureName.slice(1)}`);
                    });
                }
                
                parts.push(' */');
                
                return parts.join('\n');
            },

            domReady: () => `
    // DOM ready state handling
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mainFunction);
    } else {
        mainFunction();
    }`,

            spaNavigation: () => `
    // SPA navigation handling
    let navigationObserver = null;
    
    function handleNavigation() {
        // Clean up previous instance
        if (navigationObserver) {
            navigationObserver.disconnect();
        }
        
        // Re-run main function after navigation
        setTimeout(() => {
            mainFunction();
        }, 500);
    }
    
    // Listen for navigation events
    window.addEventListener('popstate', handleNavigation);
    
    // Override pushState for SPA detection
    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(history, arguments);
        handleNavigation();
    };
    
    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
        originalReplaceState.apply(history, arguments);
        handleNavigation();
    };`,

            debouncing: () => `
    // Debouncing mechanism
    let lastExecutionTime = 0;
    const DEBOUNCE_DELAY = 1000; // Minimum time between executions
    
    function shouldExecute() {
        const now = Date.now();
        if (now - lastExecutionTime < DEBOUNCE_DELAY) {
            console.log('Execution debounced');
            return false;
        }
        lastExecutionTime = now;
        return true;
    }`,

            mutationObserver: () => `
    // DOM mutation observer
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Re-apply modifications if target elements are added
                applyModifications();
            }
        }
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Store observer for cleanup
    window.__scriptObserver = observer;`,

            cleanup: () => `
    // Cleanup function
    function cleanup() {
        // Remove event listeners
        window.removeEventListener('popstate', handleNavigation);
        
        // Disconnect observers
        if (window.__scriptObserver) {
            window.__scriptObserver.disconnect();
            delete window.__scriptObserver;
        }
        
        // Clear intervals/timeouts
        if (window.__scriptInterval) {
            clearInterval(window.__scriptInterval);
            delete window.__scriptInterval;
        }
        
        console.log('Script cleanup completed');
    }
    
    // Auto-cleanup on page unload
    window.addEventListener('beforeunload', cleanup);`,

            waitForElement: (selector, timeout = 10000) => `
    /**
     * Wait for element to appear in DOM
     */
    function waitForElement(selector, timeout = ${timeout}) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(\`Element \${selector} not found after \${timeout}ms\`));
            }, timeout);
        });
    }`,

            errorHandling: () => `
    // Global error handling
    try {
        // Main execution
        applyModifications();
    } catch (error) {
        console.error('Script execution error:', error);
        // Attempt recovery
        setTimeout(() => {
            try {
                applyModifications();
            } catch (retryError) {
                console.error('Retry failed:', retryError);
            }
        }, 1000);
    }`,

            preventDuplicates: () => `
    // Prevent duplicate execution
    if (window.__scriptExecuted) {
        console.log('Script already executed, skipping');
        return;
    }
    window.__scriptExecuted = true;`,

            elementCaching: () => `
    // Element caching for performance
    const elementCache = new Map();
    
    function getCachedElement(selector) {
        if (!elementCache.has(selector)) {
            elementCache.set(selector, document.querySelector(selector));
        }
        return elementCache.get(selector);
    }
    
    function clearElementCache() {
        elementCache.clear();
    }`,

            resourceCleanup: () => `
    // Resource cleanup
    function cleanupResources() {
        // Clear intervals
        if (window.__scriptIntervals) {
            window.__scriptIntervals.forEach(id => clearInterval(id));
            window.__scriptIntervals = [];
        }
        
        // Clear timeouts
        if (window.__scriptTimeouts) {
            window.__scriptTimeouts.forEach(id => clearTimeout(id));
            window.__scriptTimeouts = [];
        }
        
        // Clear event listeners
        if (window.__scriptListeners) {
            window.__scriptListeners.forEach(({element, event, handler}) => {
                element.removeEventListener(event, handler);
            });
            window.__scriptListeners = [];
        }
    }
    
    window.addEventListener('beforeunload', cleanupResources);`,

            intervalMonitoring: () => `
    // Interval monitoring for dynamic content
    window.__scriptIntervals = window.__scriptIntervals || [];
    
    const monitoringInterval = setInterval(() => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            applyModifications();
        }
    }, 2000); // Check every 2 seconds
    
    window.__scriptIntervals.push(monitoringInterval);`,

            urlChangeMonitoring: () => `
    // URL change monitoring
    let lastUrl = location.href;
    
    const urlObserver = new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('URL changed:', url);
            setTimeout(() => applyModifications(), 500);
        }
    });
    
    urlObserver.observe(document, { subtree: true, childList: true });`,

            consoleLogging: () => `
    // Enhanced console logging
    const log = {
        info: (msg, ...args) => console.log(\`[Script] \${msg}\`, ...args),
        warn: (msg, ...args) => console.warn(\`[Script] \${msg}\`, ...args),
        error: (msg, ...args) => console.error(\`[Script] \${msg}\`, ...args),
        debug: (msg, ...args) => DEBUG && console.log(\`[Script Debug] \${msg}\`, ...args)
    };`,

            elementHighlighting: () => `
    // Element highlighting for debugging
    function highlightElement(element) {
        const originalStyle = element.style.cssText;
        element.style.outline = '2px solid #ff0000';
        element.style.backgroundColor = 'rgba(255,0,0,0.1)';
        
        setTimeout(() => {
            element.style.cssText = originalStyle;
        }, 3000);
    }`,

            widgetLoader: () => `
    // Widget loader with retry mechanism
    function loadWidget(url, containerId, retries = 3) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Widget container not found:', containerId);
            return;
        }
        
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        
        script.onload = () => {
            console.log('Widget loaded successfully:', url);
        };
        
        script.onerror = () => {
            if (retries > 0) {
                console.warn(\`Widget load failed, retrying... (\${retries} left)\`);
                setTimeout(() => loadWidget(url, containerId, retries - 1), 2000);
            } else {
                console.error('Failed to load widget after all retries:', url);
            }
        };
        
        container.appendChild(script);
    }`,

            asyncLoading: () => `
    // Async resource loading
    async function loadResourceAsync(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
            return await response.text();
        } catch (error) {
            console.error('Failed to load resource:', error);
            return null;
        }
    }`,

            fallbackMechanisms: () => `
    // Fallback mechanisms for resilience
    function tryMultipleSelectors(selectors) {
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    return elements;
                }
            } catch (e) {
                console.warn(\`Invalid selector: \${selector}\`);
            }
        }
        return [];
    }`,

            vdpDetection: () => `
    // VDP (Vehicle Detail Page) detection
    function isVDP() {
        const indicators = [
            window.location.pathname.includes('/vehicle/'),
            window.location.pathname.includes('/inventory/'),
            document.querySelector('.vehicle-details') !== null,
            document.querySelector('[data-vehicle-id]') !== null
        ];
        return indicators.some(indicator => indicator);
    }
    
    if (!isVDP()) {
        console.log('Not a VDP page, skipping');
        return;
    }`,

            srpDetection: () => `
    // SRP (Search Results Page) detection
    function isSRP() {
        const indicators = [
            window.location.pathname.includes('/search'),
            window.location.pathname.includes('/inventory'),
            document.querySelector('.search-results') !== null,
            document.querySelector('.vehicle-grid') !== null
        ];
        return indicators.some(indicator => indicator);
    }
    
    if (!isSRP()) {
        console.log('Not an SRP page, skipping');
        return;
    }`,

            customPageDetection: () => `
    // Custom page detection
    function detectPageType() {
        const path = window.location.pathname;
        const pageTypes = {
            'home': path === '/' || path === '/index',
            'contact': path.includes('/contact'),
            'about': path.includes('/about'),
            'service': path.includes('/service')
        };
        
        for (const [type, match] of Object.entries(pageTypes)) {
            if (match) return type;
        }
        return 'unknown';
    }
    
    const pageType = detectPageType();
    console.log('Detected page type:', pageType);`
        };
    }

    /**
     * Generate action-specific code
     */
    generateActionCode(actionType, options) {
        const actions = {
            'modify-text': (opts) => `
        // Modify text content
        element.textContent = '${opts.newText || ''}';`,

            'modify-html': (opts) => `
        // Modify HTML content
        element.innerHTML = \`${opts.newHTML || ''}\`;`,

            'add-element': (opts) => {
                // Handle custom HTML mode
                if (opts.elementCreationMode === 'custom-html' && opts.customHtmlContent) {
                    const position = opts.customHtmlPosition || opts.position || 'afterend';
                    return `
        // Insert custom HTML content
        const customHtmlContent = \`${opts.customHtmlContent}\`;
        ${this.getCustomHtmlInsertionCode(position)}`;
                }
                
                // Handle standard element creation
                const tagName = opts.elementType === 'custom' ? (opts.customTagName || 'div') : (opts.elementType || 'div');
                
                let attributesCode = '';
                if (opts.elementAttributes) {
                    const attributes = opts.elementAttributes.split('\n')
                        .map(attr => attr.trim())
                        .filter(attr => attr.length > 0);
                    
                    attributes.forEach(attr => {
                        const match = attr.match(/^([^=]+)=["']([^"']*)["']$/);
                        if (match) {
                            const [, attrName, attrValue] = match;
                            attributesCode += `\n        newElement.setAttribute('${attrName}', '${attrValue}');`;
                        }
                    });
                }
                
                return `
        // Create and add new element
        const newElement = document.createElement('${tagName}');
        ${opts.className ? `newElement.className = '${opts.className}';` : ''}
        ${opts.elementId ? `newElement.id = '${opts.elementId}';` : ''}
        ${opts.innerHTML ? `newElement.innerHTML = \`${opts.innerHTML}\`;` : 
          opts.elementText ? `newElement.textContent = '${opts.elementText}';` : ''}${attributesCode}
        
        // Insert element
        ${this.getInsertionCode(opts.position || 'afterend')}`;
            },

            'remove-element': () => `
        // Remove element
        element.remove();`,

            'add-class': (opts) => `
        // Add CSS class
        element.classList.add('${opts.className || ''}');`,

            'remove-class': (opts) => `
        // Remove CSS class
        element.classList.remove('${opts.className || ''}');`,

            'set-attribute': (opts) => `
        // Set attribute
        element.setAttribute('${opts.attrName || ''}', '${opts.attrValue || ''}');`,

            'apply-styles': (opts) => {
                const styles = opts.styles || '';
                const styleLines = styles.split(';').filter(s => s.trim());
                return `
        // Apply CSS styles
        ${styleLines.map(style => {
            const [prop, value] = style.split(':').map(s => s.trim());
            if (prop && value) {
                const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                return `element.style.${camelProp} = '${value}';`;
            }
            return '';
        }).filter(s => s).join('\n        ')}`;
            },

            'add-listener': (opts) => `
        // Add event listener
        element.addEventListener('${opts.eventType || 'click'}', function(event) {
            ${opts.eventCode || '// Event handler code'}
        });`,

            'insert-widget': (opts) => `
        // Insert widget
        const widgetContainer = document.createElement('div');
        widgetContainer.id = '${opts.widgetId || 'custom-widget'}';
        widgetContainer.innerHTML = \`${opts.widgetHTML || ''}\`;
        ${opts.widgetScript ? `
        // Load widget script
        const script = document.createElement('script');
        script.src = '${opts.widgetScript}';
        script.async = true;
        document.body.appendChild(script);` : ''}
        
        element.appendChild(widgetContainer);`,

            'toggle-visibility': (opts) => {
                const action = opts.visibilityAction || 'toggle';
                if (action === 'toggle') {
                    return `
        // Toggle visibility
        element.style.display = element.style.display === 'none' ? '' : 'none';`;
                } else if (action === 'show') {
                    return `
        // Show element
        element.style.display = '';
        element.style.visibility = 'visible';`;
                } else {
                    return `
        // Hide element
        element.style.display = 'none';`;
                }
            },

            'scroll-to': (opts) => `
        // Scroll to element
        element.scrollIntoView({
            behavior: '${opts.scrollBehavior || 'smooth'}',
            block: '${opts.scrollBlock || 'center'}'
        });`,

            'clone-element': (opts) => `
        // Clone element
        const clone = element.cloneNode(${opts.cloneDeep === 'true'});
        ${opts.clonePosition === 'after' ? 
            'element.parentNode.insertBefore(clone, element.nextSibling);' :
            opts.clonePosition === 'before' ? 
            'element.parentNode.insertBefore(clone, element);' :
            'element.parentNode.appendChild(clone);'}`,

            'wrap-element': (opts) => `
        // Wrap element
        const wrapper = document.createElement('${opts.wrapperTag || 'div'}');
        ${opts.wrapperClass ? `wrapper.className = '${opts.wrapperClass}';` : ''}
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);`,

            'unwrap-element': () => `
        // Unwrap element
        const parent = element.parentNode;
        if (parent && parent.parentNode) {
            while (element.firstChild) {
                parent.parentNode.insertBefore(element.firstChild, parent);
            }
            parent.parentNode.removeChild(parent);
        }`,

            'form-manipulation': (opts) => {
                const formActions = {
                    'disable': 'element.disabled = true;',
                    'enable': 'element.disabled = false;',
                    'readonly': 'element.readOnly = true;',
                    'required': 'element.required = true;',
                    'setValue': `element.value = '${opts.formValue || ''}';`,
                    'clear': 'element.value = \'\';'
                };
                return `
        // Form manipulation
        ${formActions[opts.formAction] || ''}`;
            },

            'ajax-request': (opts) => `
        // AJAX request
        fetch('${opts.ajaxUrl || ''}', {
            method: '${opts.ajaxMethod || 'GET'}',
            headers: {
                'Content-Type': 'application/json'
            }${opts.ajaxData ? `,
            body: '${opts.ajaxData}'` : ''}
        })
        .then(response => response.json())
        .then(data => {
            console.log('AJAX response:', data);
            // Process response data
        })
        .catch(error => console.error('AJAX error:', error));`,

            'cookie-management': (opts) => {
                if (opts.cookieAction === 'set') {
                    return `
        // Set cookie
        const expires = new Date();
        expires.setDate(expires.getDate() + ${opts.cookieExpiry || 30});
        document.cookie = '${opts.cookieName}=${opts.cookieValue}; expires=' + expires.toUTCString() + '; path=/';`;
                } else if (opts.cookieAction === 'get') {
                    return `
        // Get cookie
        const name = '${opts.cookieName}=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for(let c of ca) {
            while (c.charAt(0) === ' ') c = c.substring(1);
            if (c.indexOf(name) === 0) {
                console.log('Cookie value:', c.substring(name.length));
            }
        }`;
                } else {
                    return `
        // Delete cookie
        document.cookie = '${opts.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';`;
                }
            },

            'local-storage': (opts) => {
                if (opts.storageAction === 'set') {
                    return `
        // Set localStorage item
        localStorage.setItem('${opts.storageKey}', '${opts.storageValue || ''}');`;
                } else if (opts.storageAction === 'get') {
                    return `
        // Get localStorage item
        const value = localStorage.getItem('${opts.storageKey}');
        console.log('Storage value:', value);`;
                } else if (opts.storageAction === 'remove') {
                    return `
        // Remove localStorage item
        localStorage.removeItem('${opts.storageKey}');`;
                } else {
                    return `
        // Clear all localStorage
        localStorage.clear();`;
                }
            },

            'custom': (opts) => `
        // Custom JavaScript code
        ${opts.customCode || '// Your custom code here'}`
        };

        return actions[actionType] ? actions[actionType](options) : '';
    }

    /**
     * Get insertion code based on position
     */
    getInsertionCode(position) {
        const positions = {
            'beforebegin': 'element.parentNode.insertBefore(newElement, element);',
            'afterbegin': 'element.insertBefore(newElement, element.firstChild);',
            'beforeend': 'element.appendChild(newElement);',
            'afterend': 'element.parentNode.insertBefore(newElement, element.nextSibling);',
            'replace': 'element.parentNode.replaceChild(newElement, element);'
        };
        return positions[position] || positions['afterend'];
    }

    /**
     * Get custom HTML insertion code based on position
     */
    getCustomHtmlInsertionCode(position) {
        const positions = {
            'beforebegin': 'element.insertAdjacentHTML("beforebegin", customHtmlContent);',
            'afterbegin': 'element.insertAdjacentHTML("afterbegin", customHtmlContent);',
            'beforeend': 'element.insertAdjacentHTML("beforeend", customHtmlContent);',
            'afterend': 'element.insertAdjacentHTML("afterend", customHtmlContent);',
            'replace': 'element.outerHTML = customHtmlContent;'
        };
        return positions[position] || positions['afterend'];
    }

    /**
     * Generate complete script
     */
    generateScript(config) {
        const {
            scriptName = 'custom-script',
            scriptDescription = '',
            targetSelector = '',
            fallbackSelectors = [],
            actionType = '',
            actionOptions = {},
            features = {},
            waitForElement: shouldWaitForElement = false
        } = config;

        let script = [];

        // Add header with features
        const enabledFeatures = Object.keys(features).filter(f => features[f]);
        script.push(this.templates.header(scriptDescription, enabledFeatures));
        script.push('');

        // Main function wrapper
        script.push('// Main function with descriptive name');
        script.push(`function ${this.functionNameFromScriptName(scriptName)}() {`);
        script.push('    \'use strict\';');
        script.push('    ');
        
        // Add prevent duplicates if enabled
        if (features.preventDuplicates) {
            script.push(this.indent(this.templates.preventDuplicates(), 1));
            script.push('    ');
        }
        
        // Add debouncing if enabled
        if (features.debouncing) {
            script.push(this.indent(this.templates.debouncing(), 1));
            script.push('    ');
            script.push('    if (!shouldExecute()) return;');
            script.push('    ');
        }

        // Add debug mode
        if (features.debugMode) {
            script.push('    const DEBUG = true;');
            script.push('    if (DEBUG) console.log(\'Script executing...\');');
            script.push('    ');
        }
        
        // Add console logging if enabled
        if (features.consoleLogging) {
            script.push(this.indent(this.templates.consoleLogging(), 1));
            script.push('    ');
        }
        
        // Add element caching if enabled
        if (features.elementCaching) {
            script.push(this.indent(this.templates.elementCaching(), 1));
            script.push('    ');
        }
        
        // Add page detection if enabled
        if (features.vdpDetection) {
            script.push(this.indent(this.templates.vdpDetection(), 1));
            script.push('    ');
        }
        
        if (features.srpDetection) {
            script.push(this.indent(this.templates.srpDetection(), 1));
            script.push('    ');
        }
        
        if (features.customPageDetection) {
            script.push(this.indent(this.templates.customPageDetection(), 1));
            script.push('    ');
        }
        
        // Add widget loader if enabled
        if (features.widgetLoader) {
            script.push(this.indent(this.templates.widgetLoader(), 1));
            script.push('    ');
        }
        
        // Add async loading if enabled
        if (features.asyncLoading) {
            script.push(this.indent(this.templates.asyncLoading(), 1));
            script.push('    ');
        }
        
        // Add fallback mechanisms if enabled
        if (features.fallbackMechanisms) {
            script.push(this.indent(this.templates.fallbackMechanisms(), 1));
            script.push('    ');
        }
        
        // Add element highlighting if enabled
        if (features.elementHighlighting) {
            script.push(this.indent(this.templates.elementHighlighting(), 1));
            script.push('    ');
        }

        // Add modification function
        script.push('    /**');
        script.push('     * Apply modifications to target elements');
        script.push('     */');
        script.push('    function applyModifications() {');
        
        // Element selection based on selector type
        const selectorType = config.selectorType || 'css';
        
        if (selectorType === 'xpath') {
            script.push('        // XPath selector');
            script.push(`        const xpath = '${targetSelector}';`);
            script.push('        const xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);');
            script.push('        const elements = [];');
            script.push('        for (let i = 0; i < xpathResult.snapshotLength; i++) {');
            script.push('            elements.push(xpathResult.snapshotItem(i));');
            script.push('        }');
        } else if (fallbackSelectors && fallbackSelectors.length > 0) {
            const allSelectors = [targetSelector, ...fallbackSelectors].filter(s => s);
            script.push('        // Try selectors with fallbacks');
            script.push(`        const selectors = ${JSON.stringify(allSelectors)};`);
            script.push('        let elements = null;');
            script.push('        ');
            script.push('        for (const selector of selectors) {');
            script.push('            try {');
            script.push('                elements = document.querySelectorAll(selector);');
            script.push('                if (elements.length > 0) {');
            script.push('                    if (DEBUG) console.log(`Found ${elements.length} elements with selector: ${selector}`);');
            script.push('                    break;');
            script.push('                }');
            script.push('            } catch (e) {');
            script.push('                console.warn(`Invalid selector: ${selector}`);');
            script.push('            }');
            script.push('        }');
        } else {
            script.push('        // Select target elements');
            script.push(`        const elements = document.querySelectorAll('${targetSelector}');`);
        }

        script.push('        ');
        script.push('        if (!elements || elements.length === 0) {');
        script.push(`            console.warn('No elements found for selector: ${targetSelector}');`);
        script.push('            return;');
        script.push('        }');
        script.push('        ');

        // Apply action to elements
        script.push('        // Apply modifications to each element');
        script.push('        elements.forEach((element, index) => {');
        script.push('            try {');
        
        // Add action code
        const actionCode = this.generateActionCode(actionType, actionOptions);
        script.push(this.indent(actionCode, 4));
        
        script.push('                ');
        script.push('                if (DEBUG) console.log(`Modified element ${index + 1}/${elements.length}`);');
        script.push('            } catch (error) {');
        script.push('                console.error(`Failed to modify element ${index}:`, error);');
        script.push('            }');
        script.push('        });');
        script.push('    }');
        script.push('    ');

        // Add wait for element if needed
        if (shouldWaitForElement) {
            script.push(this.indent(this.templates.waitForElement(targetSelector), 1));
            script.push('    ');
            script.push('    // Wait for element and apply modifications');
            script.push(`    waitForElement('${targetSelector}')`);
            script.push('        .then(() => applyModifications())');
            script.push('        .catch(error => console.error(\'Element wait failed:\', error));');
        } else {
            // Add error handling wrapper
            if (features.errorHandling) {
                script.push(this.indent(this.templates.errorHandling(), 1));
            } else {
                script.push('    // Execute modifications');
                script.push('    applyModifications();');
            }
        }

        // Add mutation observer if enabled
        if (features.mutationObserver) {
            script.push('    ');
            script.push(this.indent(this.templates.mutationObserver(), 1));
        }
        
        // Add interval monitoring if enabled
        if (features.intervalMonitoring) {
            script.push('    ');
            script.push(this.indent(this.templates.intervalMonitoring(), 1));
        }
        
        // Add URL change monitoring if enabled
        if (features.urlChangeMonitoring) {
            script.push('    ');
            script.push(this.indent(this.templates.urlChangeMonitoring(), 1));
        }
        
        // Add resource cleanup if enabled
        if (features.resourceCleanup) {
            script.push('    ');
            script.push(this.indent(this.templates.resourceCleanup(), 1));
        }

        script.push('}');
        script.push('');

        // Self-executing wrapper
        script.push('// Self-executing wrapper with DOM ready checks');
        script.push('(function() {');
        script.push('    \'use strict\';');
        
        // Add SPA navigation if enabled
        if (features.spaFriendly) {
            script.push(this.indent(this.templates.spaNavigation(), 1));
            script.push('    ');
        }

        // Add cleanup if enabled
        if (features.cleanup) {
            script.push(this.indent(this.templates.cleanup(), 1));
            script.push('    ');
        }

        // Main function reference
        script.push(`    const mainFunction = ${this.functionNameFromScriptName(scriptName)};`);
        script.push('    ');

        // Add DOM ready check
        if (features.domReady) {
            script.push(this.indent(this.templates.domReady(), 1));
        } else {
            script.push('    // Execute immediately');
            script.push('    mainFunction();');
        }

        script.push('})();');

        return script.join('\n');
    }

    /**
     * Convert script name to function name
     */
    functionNameFromScriptName(scriptName) {
        return scriptName
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/^[0-9]/, '_$&')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '') || 'mainFunction';
    }

    /**
     * Indent text
     */
    indent(text, level = 1) {
        const spaces = '    '.repeat(level);
        return text.split('\n').map(line => spaces + line).join('\n');
    }

    /**
     * Validate configuration
     */
    validateConfig(config) {
        const errors = [];

        if (!config.scriptName) {
            errors.push('Script name is required');
        }

        if (!config.targetSelector) {
            errors.push('Target selector is required');
        }

        if (!config.actionType) {
            errors.push('Action type is required');
        }

        // Validate CSS selector
        try {
            document.querySelector(config.targetSelector);
        } catch (e) {
            errors.push('Invalid CSS selector');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Generate and save script
     */
    async generateAndSave(config) {
        // Validate config
        const validation = this.validateConfig(config);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // Generate script
        const code = this.generateScript(config);

        // Save to history
        const scriptData = {
            name: config.scriptName,
            description: config.scriptDescription,
            code: code,
            config: config,
            features: Object.keys(config.features).filter(f => config.features[f]),
            actionType: config.actionType,
            version: 'V1'
        };

        const savedScript = await window.historyManager.saveScript(scriptData);
        
        return {
            code,
            script: savedScript
        };
    }
}

// Export as global
window.scriptBuilder = new ScriptBuilder();
