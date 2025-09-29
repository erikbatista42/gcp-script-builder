/**
 * History Management Module
 * 
 * Handles storage and retrieval of generated scripts using IndexedDB for robust
 * persistent storage. Provides full CRUD operations, search, sorting, and export
 * functionality for script generation history.
 */

class ScriptHistoryManager {
    constructor() {
        this.dbName = 'ScriptBuilderHistory';
        this.dbVersion = 1;
        this.storeName = 'scripts';
        this.db = null;
        this.isInitialized = false;
        this.listeners = new Map();
        
        // Initialize IndexedDB
        this.initDB();
    }

    /**
     * Initialize IndexedDB connection
     */
    async initDB() {
        try {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);

                request.onerror = () => {
                    console.error('Failed to open IndexedDB:', request.error);
                    reject(request.error);
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    this.isInitialized = true;
                    console.log('IndexedDB initialized successfully');
                    this.emit('initialized');
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // Create object store if it doesn't exist
                    if (!db.objectStoreNames.contains(this.storeName)) {
                        const objectStore = db.createObjectStore(this.storeName, { 
                            keyPath: 'id', 
                            autoIncrement: false 
                        });
                        
                        // Create indexes for efficient searching
                        objectStore.createIndex('name', 'name', { unique: false });
                        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                        objectStore.createIndex('actionType', 'actionType', { unique: false });
                        
                        console.log('Object store created with indexes');
                    }
                };
            });
        } catch (error) {
            console.error('Error initializing IndexedDB:', error);
            // Fallback to localStorage if IndexedDB fails
            this.useFallbackStorage = true;
        }
    }

    /**
     * Generate unique ID for scripts
     */
    generateId() {
        return `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Save a script to history
     */
    async saveScript(scriptData) {
        if (!this.isInitialized) {
            await this.initDB();
        }

        const script = {
            id: this.generateId(),
            name: scriptData.name || 'Untitled Script',
            description: scriptData.description || '',
            code: scriptData.code,
            config: scriptData.config || {},
            features: scriptData.features || [],
            actionType: scriptData.actionType || '',
            timestamp: Date.now(),
            version: scriptData.version || 'V1',
            stats: {
                lines: (scriptData.code.match(/\n/g) || []).length + 1,
                size: new Blob([scriptData.code]).size,
                characters: scriptData.code.length
            }
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(script);

            request.onsuccess = () => {
                console.log('Script saved to history:', script.id);
                this.emit('scriptAdded', script);
                this.updateHistoryCount();
                resolve(script);
            };

            request.onerror = () => {
                console.error('Error saving script:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all scripts from history
     */
    async getAllScripts() {
        if (!this.isInitialized) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                const scripts = request.result || [];
                resolve(scripts);
            };

            request.onerror = () => {
                console.error('Error fetching scripts:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get a single script by ID
     */
    async getScript(id) {
        if (!this.isInitialized) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Error fetching script:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Update an existing script
     */
    async updateScript(id, updates) {
        if (!this.isInitialized) {
            await this.initDB();
        }

        const script = await this.getScript(id);
        if (!script) {
            throw new Error('Script not found');
        }

        const updatedScript = {
            ...script,
            ...updates,
            id: script.id, // Ensure ID doesn't change
            lastModified: Date.now()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(updatedScript);

            request.onsuccess = () => {
                console.log('Script updated:', id);
                this.emit('scriptUpdated', updatedScript);
                resolve(updatedScript);
            };

            request.onerror = () => {
                console.error('Error updating script:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Delete a script from history
     */
    async deleteScript(id) {
        if (!this.isInitialized) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('Script deleted:', id);
                this.emit('scriptDeleted', id);
                this.updateHistoryCount();
                resolve();
            };

            request.onerror = () => {
                console.error('Error deleting script:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Clear all history
     */
    async clearHistory() {
        if (!this.isInitialized) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('History cleared');
                this.emit('historyCleared');
                this.updateHistoryCount();
                resolve();
            };

            request.onerror = () => {
                console.error('Error clearing history:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Search scripts by query
     */
    async searchScripts(query) {
        const allScripts = await this.getAllScripts();
        const searchTerm = query.toLowerCase();

        return allScripts.filter(script => {
            return (
                script.name.toLowerCase().includes(searchTerm) ||
                script.description.toLowerCase().includes(searchTerm) ||
                script.actionType.toLowerCase().includes(searchTerm)
            );
        });
    }

    /**
     * Sort scripts by criteria
     */
    sortScripts(scripts, sortBy = 'date-desc') {
        const sorted = [...scripts];

        switch (sortBy) {
            case 'date-desc':
                return sorted.sort((a, b) => b.timestamp - a.timestamp);
            case 'date-asc':
                return sorted.sort((a, b) => a.timestamp - b.timestamp);
            case 'name-asc':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            default:
                return sorted;
        }
    }

    /**
     * Export history to JSON
     */
    async exportHistory() {
        const scripts = await this.getAllScripts();
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            totalScripts: scripts.length,
            scripts: scripts
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `script-history-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return exportData;
    }

    /**
     * Import history from JSON
     */
    async importHistory(fileContent) {
        try {
            const importData = JSON.parse(fileContent);
            
            if (!importData.scripts || !Array.isArray(importData.scripts)) {
                throw new Error('Invalid import file format');
            }

            let imported = 0;
            for (const script of importData.scripts) {
                // Generate new IDs to avoid conflicts
                script.id = this.generateId();
                script.imported = true;
                script.importDate = Date.now();
                
                await this.saveScript(script);
                imported++;
            }

            this.emit('historyImported', { count: imported });
            return imported;
        } catch (error) {
            console.error('Error importing history:', error);
            throw error;
        }
    }

    /**
     * Update history count in UI
     */
    async updateHistoryCount() {
        const scripts = await this.getAllScripts();
        const count = scripts.length;
        
        const countElement = document.getElementById('historyCount');
        if (countElement) {
            countElement.textContent = count > 0 ? count : '';
        }
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /**
     * Format date for display
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }

        // Less than 1 hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }

        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }

        // Less than 7 days
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }

        // Default to full date
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Event emitter functionality
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;
        
        this.listeners.get(event).forEach(callback => {
            callback(data);
        });
    }

    /**
     * Create history item HTML
     */
    createHistoryItemHTML(script) {
        const date = this.formatDate(script.timestamp);
        const size = this.formatFileSize(script.stats?.size || 0);
        const lines = script.stats?.lines || 0;

        return `
            <div class="history-item" data-id="${script.id}">
                <div class="history-item-header">
                    <div class="history-item-title">${script.name}</div>
                    <div class="history-item-date">${date}</div>
                </div>
                <div class="history-item-meta">
                    ${script.actionType ? `<span><i class="fas fa-code"></i> ${script.actionType}</span>` : ''}
                    <span><i class="fas fa-file"></i> ${size}</span>
                    <span><i class="fas fa-list-ol"></i> ${lines} lines</span>
                </div>
                ${script.description ? `<div class="history-item-description">${script.description}</div>` : ''}
                <div class="history-item-actions">
                    <button class="btn btn-small btn-primary" onclick="historyManager.previewScript('${script.id}')">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="historyManager.downloadScript('${script.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="historyManager.copyScript('${script.id}')">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Preview a script in modal
     */
    async previewScript(id) {
        const script = await this.getScript(id);
        if (!script) return;

        // Show preview modal with script details
        window.showScriptPreview(script);
    }

    /**
     * Download a script
     */
    async downloadScript(id) {
        const script = await this.getScript(id);
        if (!script) return;

        const blob = new Blob([script.code], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${script.name}.js`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        window.showToast('Script downloaded successfully', 'success');
    }

    /**
     * Copy script to clipboard
     */
    async copyScript(id) {
        const script = await this.getScript(id);
        if (!script) return;

        try {
            await navigator.clipboard.writeText(script.code);
            window.showToast('Script copied to clipboard', 'success');
        } catch (error) {
            console.error('Failed to copy script:', error);
            window.showToast('Failed to copy script', 'error');
        }
    }
}

// Initialize history manager as a global instance
window.historyManager = new ScriptHistoryManager();
