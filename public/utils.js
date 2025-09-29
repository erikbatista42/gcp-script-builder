/**
 * Utility Functions Module
 * 
 * Shared helper functions and utilities for the Script Builder application.
 * Includes toast notifications, modal management, and common UI operations.
 */

// ===== Toast Notifications =====
window.showToast = function(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');
    const toastIcon = toast.querySelector('.toast-icon');
    
    // Set message
    toastMessage.textContent = message;
    
    // Clear previous classes
    toast.className = 'toast';
    
    // Set type-specific styling
    const icons = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    
    toast.classList.add(type);
    toastIcon.className = `toast-icon ${icons[type] || icons.info}`;
    
    // Show toast
    toast.classList.add('show');
    
    // Auto-hide after duration
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
};

// ===== Modal Management =====
class ModalManager {
    constructor() {
        this.activeModals = [];
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Close modal on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.length > 0) {
                this.closeTopModal();
            }
        });
        
        // Close modal on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.add('show');
        this.activeModals.push(modalId);
        document.body.style.overflow = 'hidden';
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.remove('show');
        const index = this.activeModals.indexOf(modalId);
        if (index > -1) {
            this.activeModals.splice(index, 1);
        }
        
        if (this.activeModals.length === 0) {
            document.body.style.overflow = '';
        }
    }
    
    closeTopModal() {
        if (this.activeModals.length > 0) {
            this.closeModal(this.activeModals[this.activeModals.length - 1]);
        }
    }
}

const modalManager = new ModalManager();

// ===== Script Preview Modal =====
window.showScriptPreview = function(script) {
    // Update modal content
    document.getElementById('previewTitle').textContent = script.name;
    
    // Update metadata
    const metadata = document.getElementById('previewMetadata');
    metadata.innerHTML = `
        <div>
            <strong>Script Name:</strong>
            <span>${script.name}</span>
        </div>
        <div>
            <strong>Action Type:</strong>
            <span>${script.actionType || 'N/A'}</span>
        </div>
        <div>
            <strong>Generated:</strong>
            <span>${new Date(script.timestamp).toLocaleString()}</span>
        </div>
        <div>
            <strong>Size:</strong>
            <span>${window.historyManager.formatFileSize(script.stats?.size || 0)}</span>
        </div>
        <div>
            <strong>Lines:</strong>
            <span>${script.stats?.lines || 0}</span>
        </div>
    `;
    
    // Update code preview
    const codeElement = document.getElementById('previewCode');
    codeElement.textContent = script.code;
    
    // Highlight syntax
    if (window.Prism) {
        Prism.highlightElement(codeElement);
    }
    
    // Setup action buttons
    document.getElementById('previewCopy').onclick = () => {
        navigator.clipboard.writeText(script.code)
            .then(() => showToast('Script copied to clipboard', 'success'))
            .catch(() => showToast('Failed to copy script', 'error'));
    };
    
    document.getElementById('previewDownload').onclick = () => {
        downloadFile(`${script.name}.js`, script.code, 'application/javascript');
    };
    
    document.getElementById('previewRestore').onclick = () => {
        restoreScriptToEditor(script);
        modalManager.closeModal('previewModal');
    };
    
    document.getElementById('previewDelete').onclick = async () => {
        if (confirm(`Are you sure you want to delete "${script.name}"?`)) {
            try {
                await window.historyManager.deleteScript(script.id);
                showToast('Script deleted successfully', 'success');
                modalManager.closeModal('previewModal');
                refreshHistoryList();
            } catch (error) {
                showToast('Failed to delete script', 'error');
            }
        }
    };
    
    // Open modal
    modalManager.openModal('previewModal');
};

// ===== File Download Helper =====
window.downloadFile = function(filename, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// ===== Restore Script to Editor =====
window.restoreScriptToEditor = function(script) {
    // Restore configuration
    if (script.config) {
        const config = script.config;
        
        // Basic info
        setInputValue('scriptName', config.scriptName);
        setInputValue('scriptDescription', config.scriptDescription);
        
        // Target selector
        setInputValue('targetSelector', config.targetSelector);
        setInputValue('fallbackSelectors', (config.fallbackSelectors || []).join('\n'));
        setCheckboxValue('waitForElement', config.waitForElement);
        
        // Action type and options
        setInputValue('actionType', config.actionType);
        
        // Trigger action type change to show options
        const actionSelect = document.getElementById('actionType');
        if (actionSelect) {
            actionSelect.dispatchEvent(new Event('change'));
            
            // Restore action options after a small delay
            setTimeout(() => {
                if (config.actionOptions) {
                    Object.keys(config.actionOptions).forEach(key => {
                        setInputValue(key, config.actionOptions[key]);
                    });
                }
            }, 100);
        }
        
        // Features
        if (config.features) {
            Object.keys(config.features).forEach(feature => {
                setCheckboxValue(feature, config.features[feature]);
            });
        }
    }
    
    // Update generated code
    const codeElement = document.getElementById('generatedCode');
    if (codeElement) {
        codeElement.textContent = script.code;
        if (window.Prism) {
            Prism.highlightElement(codeElement);
        }
    }
    
    // Enable output actions
    enableOutputActions();
    
    showToast('Script restored to editor', 'success');
};

// ===== Form Helpers =====
window.setInputValue = function(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value || '';
    }
};

window.setCheckboxValue = function(id, checked) {
    const element = document.getElementById(id);
    if (element) {
        element.checked = !!checked;
    }
};

window.getInputValue = function(id) {
    const element = document.getElementById(id);
    return element ? element.value : '';
};

window.getCheckboxValue = function(id) {
    const element = document.getElementById(id);
    return element ? element.checked : false;
};

// ===== History List Refresh =====
window.refreshHistoryList = async function() {
    const historyList = document.getElementById('historyList');
    const historyEmpty = document.getElementById('historyEmpty');
    const searchInput = document.getElementById('historySearch');
    const sortSelect = document.getElementById('historySort');
    
    if (!historyList) return;
    
    try {
        // Get all scripts
        let scripts = await window.historyManager.getAllScripts();
        
        // Apply search filter
        const searchTerm = searchInput ? searchInput.value : '';
        if (searchTerm) {
            scripts = await window.historyManager.searchScripts(searchTerm);
        }
        
        // Apply sorting
        const sortBy = sortSelect ? sortSelect.value : 'date-desc';
        scripts = window.historyManager.sortScripts(scripts, sortBy);
        
        // Update UI
        if (scripts.length === 0) {
            historyList.style.display = 'none';
            if (historyEmpty) historyEmpty.style.display = 'block';
        } else {
            historyList.style.display = 'grid';
            if (historyEmpty) historyEmpty.style.display = 'none';
            
            // Render history items
            historyList.innerHTML = scripts.map(script => 
                window.historyManager.createHistoryItemHTML(script)
            ).join('');
        }
        
        // Update count
        window.historyManager.updateHistoryCount();
    } catch (error) {
        console.error('Failed to refresh history list:', error);
        showToast('Failed to load history', 'error');
    }
};

// ===== Enable/Disable Output Actions =====
window.enableOutputActions = function() {
    document.getElementById('editBtn').disabled = false;
    document.getElementById('copyBtn').disabled = false;
    document.getElementById('downloadBtn').disabled = false;
    document.getElementById('saveToHistoryBtn').disabled = false;
};

window.disableOutputActions = function() {
    document.getElementById('editBtn').disabled = true;
    document.getElementById('copyBtn').disabled = true;
    document.getElementById('downloadBtn').disabled = true;
    document.getElementById('saveToHistoryBtn').disabled = true;
};

// ===== CSS Selector Validation =====
window.validateSelector = function(selector) {
    try {
        document.querySelector(selector);
        return { valid: true, error: null };
    } catch (error) {
        return { valid: false, error: error.message };
    }
};

// ===== Debounce Helper =====
window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// ===== Copy to Clipboard =====
window.copyToClipboard = async function(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (error) {
            document.body.removeChild(textArea);
            return false;
        }
    }
};

// ===== Local Storage Helpers =====
window.storage = {
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Failed to get from storage:', error);
            return null;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Failed to save to storage:', error);
            return false;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from storage:', error);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }
};

// ===== Export Config =====
window.exportConfig = function(config) {
    const exportData = {
        version: '1.0',
        timestamp: Date.now(),
        config: config
    };
    
    const filename = `script-config-${Date.now()}.json`;
    const content = JSON.stringify(exportData, null, 2);
    downloadFile(filename, content, 'application/json');
};

// ===== Import Config =====
window.importConfig = function(fileContent) {
    try {
        const data = JSON.parse(fileContent);
        if (data.config) {
            restoreScriptToEditor({ config: data.config });
            showToast('Configuration imported successfully', 'success');
            return true;
        }
        throw new Error('Invalid configuration file');
    } catch (error) {
        showToast('Failed to import configuration', 'error');
        return false;
    }
};

// ===== Format Code =====
window.formatCode = function(code) {
    // Basic code formatting (can be enhanced with a proper formatter)
    try {
        // Remove extra blank lines
        code = code.replace(/\n{3,}/g, '\n\n');
        
        // Ensure consistent indentation
        const lines = code.split('\n');
        let indentLevel = 0;
        const formattedLines = [];
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            // Decrease indent for closing braces
            if (trimmedLine.startsWith('}') || trimmedLine.startsWith(']')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            // Add indented line
            if (trimmedLine) {
                formattedLines.push('    '.repeat(indentLevel) + trimmedLine);
            } else {
                formattedLines.push('');
            }
            
            // Increase indent for opening braces
            if (trimmedLine.endsWith('{') || trimmedLine.endsWith('[')) {
                indentLevel++;
            }
        });
        
        return formattedLines.join('\n');
    } catch (error) {
        console.error('Failed to format code:', error);
        return code;
    }
};

// ===== Initialize Tooltips =====
window.initializeTooltips = function() {
    const tooltips = document.querySelectorAll('[title]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.dataset.tooltip = this.getAttribute('title');
            this.removeAttribute('title');
        });
        
        element.addEventListener('mouseleave', function() {
            this.setAttribute('title', this.dataset.tooltip);
            delete this.dataset.tooltip;
        });
    });
};
