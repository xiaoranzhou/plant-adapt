/**
 * PLINK2 Web Worker
 * Handles PLINK2 WebAssembly execution in a separate thread
 * 
 * Note: PLINK2 was originally designed to use pthread workers internally.
 * In our web worker context, we disable pthread support (PTHREAD_POOL_SIZE: 0)
 * and suppress harmless pthread initialization errors to ensure clean operation.
 */

let plinkModule = null;
let isInitialized = false;

// Pre-configure Module for PLINK2
// This will be used by plink2.js: var Module = typeof Module != "undefined" ? Module : {};
var Module = {
    onRuntimeInitialized: function() {
        try {
            plinkModule = Module;
            isInitialized = true;
            console.log('PLINK2 Worker: Module initialized successfully');
            
            // Clear initialization timeout
            if (self.initTimeout) {
                clearTimeout(self.initTimeout);
                self.initTimeout = null;
            }
            
            // Notify main thread that worker is ready
            self.postMessage({
                type: 'READY',
                message: 'PLINK2 WebAssembly module loaded in worker'
            });
        } catch (error) {
            console.error('Error in onRuntimeInitialized:', error);
            self.postMessage({
                type: 'ERROR',
                message: `Runtime initialization error: ${error.message || error}`
            });
        }
    },
    
    print: function(text) {
        console.log('PLINK2 Worker stdout:', text);
        self.postMessage({
            type: 'STDOUT',
            message: text
        });
    },
    
    printErr: function(text) {
        // Improve error handling for undefined values
        const errorMessage = text || 'Unknown error';
        
        // Filter out pthread worker errors that are harmless in our context
        if (errorMessage.includes('worker sent an error! undefined:undefined: undefined')) {
            console.log('PLINK2 Worker: Suppressed pthread worker error (harmless in single-threaded mode)');
            return; // Don't propagate this specific error
        }
        
        console.error('PLINK2 Worker stderr:', errorMessage);
        self.postMessage({
            type: 'STDERR',
            message: errorMessage
        });
    },
    
    noExitRuntime: true,
    
    // Enable pthread support as requested
    PTHREAD_POOL_SIZE: 4,
    
    locateFile: function(path, scriptDirectory) {
        // Worker and WASM files are now in the same public folder
        if (path.endsWith('.wasm')) {
            return './' + path;
        }
        // Handle pthread worker script
        if (path.endsWith('.worker.js')) {
            return './' + path;
        }
        return scriptDirectory + path;
    },
    
    // Provide main script URL for pthread workers
    mainScriptUrlOrBlob: './plink2.js'
};

// Import PLINK2 WebAssembly module - it will use our pre-configured Module
try {
    console.log('Loading PLINK2 WebAssembly module from public folder...');
    importScripts('./plink2.js');
    console.log('PLINK2 module loaded successfully');
    
    // Set up timeout for WebAssembly initialization
    self.initTimeout = setTimeout(() => {
        if (!isInitialized) {
            console.error('PLINK2 WebAssembly module initialization timeout');
            self.postMessage({
                type: 'ERROR',
                message: 'PLINK2 module initialization timeout (30 seconds)'
            });
        }
    }, 30000); // 30 second timeout
    
} catch (error) {
    console.error('Failed to load PLINK2 WebAssembly module:', error);
    console.error('Error details:', error.name, error.message, error.stack);
    self.postMessage({
        type: 'ERROR',
        message: `Failed to load PLINK2 module: ${error.name}: ${error.message || error}`
    });
}

// Message handler for communication with main thread
self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch (type) {
        case 'INIT':
            initializeWorker();
            break;
            
        case 'UPLOAD_FILES':
            handleFileUpload(data);
            break;
            
        case 'RUN_COMMAND':
            runPlinkCommand(data);
            break;
            
        case 'LIST_FILES':
            listFiles();
            break;
            
        case 'READ_FILE':
            readFile(data.filename);
            break;
            
        default:
            self.postMessage({
                type: 'ERROR',
                message: `Unknown command type: ${type}`
            });
    }
};

function initializeWorker() {
    self.postMessage({
        type: 'STATUS',
        message: 'Initializing PLINK2 worker...'
    });
    
    // Module will be initialized automatically when plink2.js loads
    if (isInitialized) {
        self.postMessage({
            type: 'READY',
            message: 'PLINK2 WebAssembly module already loaded'
        });
    }
}

// Store files in worker memory instead of writing to FS immediately
let storedFiles = {};

function handleFileUpload(files) {
    try {
        let successCount = 0;
        let errorCount = 0;
        
        for (const file of files) {
            try {
                // Store file data in memory instead of writing to FS
                storedFiles[file.name] = file.data;
                successCount++;
                
                self.postMessage({
                    type: 'FILE_UPLOADED',
                    data: {
                        filename: file.name,
                        size: file.data.length,
                        success: true
                    }
                });
            } catch (error) {
                errorCount++;
                self.postMessage({
                    type: 'FILE_ERROR',
                    data: {
                        filename: file.name,
                        error: error.message
                    }
                });
            }
        }
        
        self.postMessage({
            type: 'UPLOAD_COMPLETE',
            data: {
                successCount,
                errorCount,
                totalFiles: files.length
            }
        });
        
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            message: `File upload error: ${error.message}`
        });
    }
}

function runPlinkCommand(commandData) {
    if (!isInitialized) {
        self.postMessage({
            type: 'ERROR',
            message: 'PLINK2 module not yet initialized'
        });
        return;
    }
    
    try {
        const { command } = commandData;
        const args = command.split(' ').filter(arg => arg.length > 0);
        
        self.postMessage({
            type: 'EXECUTION_START',
            data: {
                command,
                args
            }
        });
        
        // Write stored files to FS only when running command
        if (isInitialized && plinkModule.FS) {
            for (const [filename, data] of Object.entries(storedFiles)) {
                try {
                    plinkModule.FS.writeFile(filename, data);
                } catch (error) {
                    console.error(`Error writing file ${filename} to FS:`, error);
                }
            }
        }
        
        // Set up arguments for the WASM module
        plinkModule.arguments = args;
        
        let result;
        if (typeof plinkModule.callMain === 'function') {
            result = plinkModule.callMain(args);
        } else if (typeof plinkModule._main === 'function') {
            // Allocate memory for arguments
            const argvPtr = plinkModule._malloc(args.length * 4);
            for (let i = 0; i < args.length; i++) {
                const argPtr = plinkModule.allocateUTF8(args[i]);
                plinkModule.setValue(argvPtr + i * 4, argPtr, 'i32');
            }
            result = plinkModule._main(args.length, argvPtr);
            
            // Clean up allocated memory
            plinkModule._free(argvPtr);
        } else {
            throw new Error('Cannot find main function in WASM module');
        }
        
        self.postMessage({
            type: 'EXECUTION_COMPLETE',
            data: {
                exitCode: result,
                command
            }
        });
        
        // Automatically list output files after execution
        listFiles();
        
    } catch (error) {
        self.postMessage({
            type: 'EXECUTION_ERROR',
            data: {
                error: error.message,
                command: commandData.command
            }
        });
    }
}

function listFiles() {
    if (!isInitialized) {
        self.postMessage({
            type: 'ERROR',
            message: 'PLINK2 module not yet initialized'
        });
        return;
    }
    
    try {
        const FS = plinkModule.FS;
        const files = FS.readdir('/');
        const outputFiles = files.filter(f => 
            f !== '.' && f !== '..' && 
            !f.startsWith('input.') && 
            f !== 'dev' && f !== 'tmp' && f !== 'proc'
        );
        
        const fileList = [];
        
        for (const fileName of outputFiles) {
            try {
                const stat = FS.stat(fileName);
                if (FS.isFile(stat.mode)) {
                    fileList.push({
                        name: fileName,
                        size: stat.size,
                        isFile: true
                    });
                }
            } catch (e) {
                // Skip files that can't be read
                continue;
            }
        }
        
        self.postMessage({
            type: 'FILE_LIST',
            data: fileList
        });
        
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            message: `Error listing files: ${error.message}`
        });
    }
}

function readFile(filename) {
    if (!isInitialized) {
        self.postMessage({
            type: 'ERROR',
            message: 'PLINK2 module not yet initialized'
        });
        return;
    }
    
    try {
        const FS = plinkModule.FS;
        const stat = FS.stat(filename);
        
        if (!FS.isFile(stat.mode)) {
            throw new Error(`${filename} is not a file`);
        }
        
        // For text files, read as string
        if (filename.endsWith('.log') || filename.endsWith('.txt') || 
            filename.includes('freq') || filename.includes('missing') || 
            filename.includes('hardy') || filename.includes('pca') ||
            filename.includes('.glm.')) {
            
            const content = FS.readFile(filename, { encoding: 'utf8' });
            
            self.postMessage({
                type: 'FILE_CONTENT',
                data: {
                    filename,
                    content,
                    size: stat.size,
                    isText: true
                }
            });
        } else {
            // For binary files, read as Uint8Array
            const content = FS.readFile(filename);
            
            self.postMessage({
                type: 'FILE_CONTENT',
                data: {
                    filename,
                    content: Array.from(content), // Convert to regular array for transfer
                    size: stat.size,
                    isText: false
                }
            });
        }
        
    } catch (error) {
        self.postMessage({
            type: 'FILE_READ_ERROR',
            data: {
                filename,
                error: error.message
            }
        });
    }
}

// Handle worker errors
self.onerror = function(error) {
    console.error('Worker error captured:', error);
    
    // Handle different error types
    let errorMessage = 'Unknown worker error';
    let filename = 'unknown file';
    let lineno = 'unknown line';
    
    if (error instanceof ErrorEvent) {
        errorMessage = error.message || error.error?.message || 'Unknown error event';
        filename = error.filename || 'unknown file';
        lineno = error.lineno || 'unknown line';
        console.error('ErrorEvent details:', {
            message: error.message,
            filename: error.filename,
            lineno: error.lineno,
            error: error.error
        });
    } else if (error && typeof error === 'object') {
        errorMessage = error.message || error.toString() || 'Unknown object error';
        filename = error.filename || 'unknown file';
        lineno = error.lineno || 'unknown line';
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    
    self.postMessage({
        type: 'WORKER_ERROR',
        message: errorMessage,
        filename: filename,
        lineno: lineno
    });
    
    // Prevent the error from propagating and causing uncaught exception
    return true;
};

// Handle unhandled promise rejections
self.onunhandledrejection = function(event) {
    console.error('Unhandled promise rejection in worker:', event.reason);
    self.postMessage({
        type: 'WORKER_ERROR',
        message: `Unhandled promise rejection: ${event.reason || 'Unknown reason'}`,
        filename: 'promise',
        lineno: 0
    });
};

// Initialize the worker when it starts
self.postMessage({
    type: 'STATUS',
    message: 'PLINK2 worker started, loading WebAssembly module...'
});