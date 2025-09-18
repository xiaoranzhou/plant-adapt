/**
 * Plant Adaptation Hub - GWAS Module
 * Handles PLINK2 WebAssembly interface and related functionality
 */

class GWASModule {
    constructor() {
        this.plinkWorker = null;
        this.isWorkerReady = false;
        this.currentTab = 'console';
        this.uploadedFiles = {};
        this.gwasWorker = null;
        this.manhattanWorker = null;
        this.manhattanCurrentData = null;
        this.showSignificanceLine = true;
        this.manhattanProcessingStartTime = 0;
        this.significanceThreshold = -Math.log10(5e-8);
        
        // Define colors for each chromosome
        this.chrColors = [
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
            '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
            '#c49c94', '#f7b6d3', '#c7c7c7', '#dbdb8d', '#9edae5',
            '#393b79', '#637939'
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupWorker();
    }

    setupEventListeners() {
        // File upload handler
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleMultipleFileUpload(e.target.files);
            });
        }

        // Handle Enter key in command input
        const commandInput = document.getElementById('commandInput');
        if (commandInput) {
            commandInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.runPlink();
                }
            });
        }

        // GWAS button click handler - with delay for DOM loading
        const setupGwasButton = () => {
            const gwasButton = document.getElementById('runGwasButton');
            if (gwasButton) {
                console.log('GWAS button found, adding event listener');
                gwasButton.addEventListener('click', () => {
                    console.log('GWAS button clicked via event listener');
                    this.runGwasDataClean();
                });
            } else {
                console.log('GWAS button not found, retrying...');
                setTimeout(setupGwasButton, 100);
            }
        };
        setupGwasButton();

        // Manhattan plot button handlers - with delay for DOM loading
        const setupManhattanButtons = () => {
            const plotButton = document.getElementById('plotFromCleanedButton');
            const toggleButton = document.querySelector('button[onclick="toggleSignificanceLinePlot()"]');
            const exportPngButton = document.querySelector('button[onclick="exportPlotImage()"]');
            const exportSvgButton = document.querySelector('button[onclick="exportPlotSVG()"]');
            const clearButton = document.querySelector('button[onclick="clearManhattanPlot()"]');

            if (plotButton) {
                console.log('Manhattan plot button found, adding event listener');
                plotButton.addEventListener('click', () => {
                    console.log('Plot from cleaned data button clicked via event listener');
                    this.plotFromCleanedData();
                });
            }

            if (toggleButton) {
                toggleButton.addEventListener('click', () => {
                    console.log('Toggle significance line clicked');
                    this.toggleSignificanceLinePlot();
                });
            }

            if (exportPngButton) {
                exportPngButton.addEventListener('click', () => {
                    console.log('Export PNG clicked');
                    this.exportPlotImage();
                });
            }

            if (exportSvgButton) {
                exportSvgButton.addEventListener('click', () => {
                    console.log('Export SVG clicked');
                    this.exportPlotSVG();
                });
            }

            if (clearButton) {
                clearButton.addEventListener('click', () => {
                    console.log('Clear plot clicked');
                    this.clearManhattanPlot();
                });
            }

            // Retry if buttons not found yet
            if (!plotButton || !toggleButton || !exportPngButton || !exportSvgButton || !clearButton) {
                console.log('Some Manhattan buttons not found, retrying...');
                setTimeout(setupManhattanButtons, 100);
            }
        };
        setupManhattanButtons();
    }

    setupWorker() {
        // Create PLINK2 worker
        this.plinkWorker = new Worker('public/plink2.interface.worker.js');
        
        // Set up worker message handler
        this.plinkWorker.onmessage = (e) => {
            this.handleWorkerMessage(e.data);
        };
        
        this.plinkWorker.onerror = (error) => {
            console.error('PLINK2 Worker error:', error);
            const errorMessage = error.message || 'Unknown worker error occurred';
            this.appendToOutput('console', `Worker Error: ${errorMessage}`);
            this.showError(`Worker Error: ${errorMessage}`);
            
            // Mark worker as not ready if initialization fails
            this.isWorkerReady = false;
        };
        
        // Initialize the worker
        this.plinkWorker.postMessage({ type: 'INIT' });
        
        this.appendToOutput('console', 'Initializing PLINK2 worker...');
    }

    handleWorkerMessage(message) {
        const { type, data, message: msg } = message;
        
        switch (type) {
            case 'STATUS':
                this.appendToOutput('console', `Status: ${msg}`);
                break;
                
            case 'READY':
                this.isWorkerReady = true;
                this.appendToOutput('console', 'PLINK2 worker ready! Upload files to begin.');
                break;
                
            case 'STDOUT':
                this.appendToOutput('console', msg);
                break;
                
            case 'STDERR':
                // Handle undefined error messages better
                const errorMsg = msg || 'Unknown PLINK2 error';
                this.appendToOutput('console', `ERROR: ${errorMsg}`);
                break;
                
            case 'FILE_UPLOADED':
                this.handleFileUploadResponse(data);
                break;
                
            case 'UPLOAD_COMPLETE':
                this.handleUploadComplete(data);
                break;
                
            case 'EXECUTION_START':
                this.appendToOutput('console', `\n=== Running PLINK2 ===`);
                this.appendToOutput('console', `Command: ${data.command}`);
                this.appendToOutput('console', `Arguments: ${data.args.join(' ')}`);
                break;
                
            case 'EXECUTION_COMPLETE':
                this.appendToOutput('console', `\nPLINK2 finished with exit code: ${data.exitCode}`);
                this.handleExecutionComplete();
                break;
                
            case 'EXECUTION_ERROR':
                this.appendToOutput('console', `Error running PLINK2: ${data.error}`);
                this.showError(`Error: ${data.error}`);
                this.handleExecutionComplete();
                break;
                
            case 'FILE_LIST':
                this.handleFileList(data);
                break;
                
            case 'FILE_CONTENT':
                this.handleFileContent(data);
                break;
                
            case 'ERROR':
                console.error('Worker error:', msg);
                this.appendToOutput('console', `Error: ${msg}`);
                this.showError(msg);
                break;
                
            case 'WORKER_ERROR':
                console.error('Worker internal error:', message);
                const workerErrorMsg = msg || 'Unknown worker error';
                this.showError(`Worker internal error: ${workerErrorMsg}`);
                this.appendToOutput('console', `Worker Error: ${workerErrorMsg}`);
                break;
        }
    }

    async handleMultipleFileUpload(files) {
        if (!files || files.length === 0) return;

        if (!this.isWorkerReady) {
            this.showError('PLINK2 worker not ready yet. Please wait.');
            return;
        }

        const statusDiv = document.getElementById('fileStatus');
        statusDiv.textContent = `Loading ${files.length} file(s)...`;
        statusDiv.className = 'file-status';

        // Prepare files for worker
        const filesToUpload = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const arrayBuffer = await file.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);

                // Check if rename .fam checkbox is checked and file has .fam extension
                const renameFamCheckbox = document.getElementById('renameFamCheckbox');
                let finalFileName = file.name;
                if (renameFamCheckbox && renameFamCheckbox.checked && file.name.toLowerCase().endsWith('.fam')) {
                    finalFileName = 'plink.fam';
                }

                this.uploadedFiles[finalFileName] = {
                    originalName: file.name,
                    name: finalFileName,
                    data: uint8Array,
                    size: uint8Array.length
                };

                filesToUpload.push({
                    name: finalFileName,
                    data: uint8Array,
                    originalName: file.name
                });

                this.appendToOutput('console', `Prepared: ${file.name}${finalFileName !== file.name ? ` → ${finalFileName}` : ''} (${this.formatFileSize(uint8Array.length)})`);

            } catch (error) {
                this.appendToOutput('console', `Error reading ${file.name}: ${error.message}`);
                this.showError(`Error reading ${file.name}: ${error.message}`);
            }
        }

        // Send files to worker
        if (filesToUpload.length > 0) {
            this.plinkWorker.postMessage({
                type: 'UPLOAD_FILES',
                data: filesToUpload
            });
        }
    }

    handleFileUploadResponse(data) {
        const { filename, size, success, originalName } = data;
        const statusDiv = document.getElementById('fileStatus');
        
        if (success) {
            let message = `✓ <strong>${originalName || filename}</strong>`;
            if (originalName && originalName !== filename) {
                message += ` <span style="color: #007bff;">→ ${filename}</span> <em style="color: #28a745;">[RENAMED]</em>`;
            }
            message += ` (${this.formatFileSize(size)})`;
            
            this.appendToOutput('console', `Uploaded: ${originalName || filename}${originalName && originalName !== filename ? ` → ${filename}` : ''} (${this.formatFileSize(size)})`);
        }
    }

    handleUploadComplete(data) {
        const { successCount, errorCount, totalFiles } = data;
        const statusDiv = document.getElementById('fileStatus');
        
        if (errorCount === 0) {
            statusDiv.className = 'file-status success';
            statusDiv.innerHTML = `✓ Successfully uploaded ${successCount} file(s)`;
        } else if (successCount === 0) {
            statusDiv.className = 'file-status error';
            statusDiv.innerHTML = `✗ Failed to upload all ${totalFiles} file(s)`;
        } else {
            statusDiv.className = 'file-status';
            statusDiv.innerHTML = `⚠ Uploaded ${successCount} file(s), ${errorCount} failed`;
        }
        
        this.appendToOutput('console', `Upload complete: ${successCount} successful, ${errorCount} failed`);
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    runPlink() {
        if (!this.isWorkerReady) {
            this.showError('PLINK2 worker not ready yet. Please wait.');
            return;
        }

        if (Object.keys(this.uploadedFiles).length === 0) {
            this.showError('Please upload at least one file.');
            return;
        }

        const commandInput = document.getElementById('commandInput');
        const command = commandInput ? commandInput.value.trim() : '';
        if (!command) {
            this.showError('Please enter a PLINK2 command.');
            return;
        }

        const loading = document.getElementById('loading');
        const runButton = document.getElementById('runButton');
        
        if (loading) loading.style.display = 'block';
        if (runButton) runButton.disabled = true;

        // Send command to worker
        this.plinkWorker.postMessage({
            type: 'RUN_COMMAND',
            data: { command }
        });
    }

    handleExecutionComplete() {
        const loading = document.getElementById('loading');
        const runButton = document.getElementById('runButton');
        
        if (loading) loading.style.display = 'none';
        if (runButton) runButton.disabled = false;
        
        // Request file list from worker
        this.plinkWorker.postMessage({ type: 'LIST_FILES' });
    }

    handleFileList(fileList) {
        const filesOutput = document.getElementById('filesOutput');
        if (!filesOutput) return;

        if (fileList.length > 0) {
            let filesContent = 'Output files generated:\n\n';
            
            fileList.forEach(file => {
                const size = this.formatFileSize(file.size);
                filesContent += `📄 ${file.name} (${size})\n`;
                
                // Request file content for preview if it's a text file
                if (file.name.endsWith('.log') || file.name.endsWith('.txt') || 
                    file.name.includes('freq') || file.name.includes('missing') || 
                    file.name.includes('hardy') || file.name.includes('pca') ||
                    file.name.includes('.glm.')) {
                    
                    // Request file content from worker
                    this.plinkWorker.postMessage({
                        type: 'READ_FILE',
                        data: { filename: file.name }
                    });
                } else {
                    filesContent += '(Binary file - no preview available)\n\n';
                }
            });
            
            filesOutput.innerHTML = filesContent;
            this.switchTab('files');
        } else {
            filesOutput.textContent = 'No output files generated.';
        }
    }

    handleFileContent(data) {
        const { filename, content, size, isText } = data;
        const filesOutput = document.getElementById('filesOutput');
        if (!filesOutput) return;

        if (isText) {
            const preview = content.length > 1000 ? 
                content.substring(0, 1000) + '\n... (truncated)' : content;
            
            // Find the file entry in the current display and add preview
            const currentContent = filesOutput.innerHTML;
            const filePattern = new RegExp(`📄 ${filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\([^)]+\\)\\n`);
            
            if (filePattern.test(currentContent)) {
                const newContent = currentContent.replace(
                    filePattern,
                    `📄 ${filename} (${this.formatFileSize(size)})\n\nContent preview:\n${preview}\n\n<a href="#" onclick="downloadFileContent('${filename}', '${btoa(content)}')">Download ${filename}</a>\n\n`
                );
                filesOutput.innerHTML = newContent;
            }
        }
    }

    // Legacy method for compatibility
    listOutputFiles() {
        // Request file list from worker
        if (this.plinkWorker) {
            this.plinkWorker.postMessage({ type: 'LIST_FILES' });
        }
    }

    switchTab(tab, targetElement = null) {
        // Update tab appearance
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        
        // If called programmatically, find the tab element by data attribute or text
        if (!targetElement) {
            const tabElements = document.querySelectorAll('.tab');
            for (const tabEl of tabElements) {
                if (tabEl.textContent.toLowerCase().includes(tab) || 
                    tabEl.getAttribute('data-tab') === tab) {
                    targetElement = tabEl;
                    break;
                }
            }
        }
        
        if (targetElement) {
            targetElement.classList.add('active');
        }

        // Show/hide content
        const outputs = ['console', 'files', 'gwas', 'manhattan', 'log'];
        outputs.forEach(outputType => {
            const element = document.getElementById(`${outputType}Output`);
            if (element) {
                element.style.display = tab === outputType ? 'block' : 'none';
            }
        });

        this.currentTab = tab;
    }

    appendToOutput(tab, text) {
        const outputDiv = document.getElementById(tab + 'Output');
        if (outputDiv) {
            outputDiv.textContent += text + '\n';
            outputDiv.scrollTop = outputDiv.scrollHeight;
        }
    }

    clearOutput() {
        const consoleOutput = document.getElementById('consoleOutput');
        const filesOutput = document.getElementById('filesOutput');
        const logOutput = document.getElementById('logOutput');
        
        if (consoleOutput) consoleOutput.textContent = 'Output cleared.\n';
        if (filesOutput) filesOutput.textContent = '';
        if (logOutput) logOutput.textContent = '';
    }

    // Cleanup method for worker termination
    cleanup() {
        if (this.plinkWorker) {
            this.plinkWorker.terminate();
            this.plinkWorker = null;
        }
        if (this.gwasWorker) {
            this.gwasWorker.terminate();
            this.gwasWorker = null;
        }
        if (this.manhattanWorker) {
            this.manhattanWorker.terminate();
            this.manhattanWorker = null;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const container = document.querySelector('.container-fluid');
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
            setTimeout(() => errorDiv.remove(), 5000);
        }
    }

    // GWAS Data Cleaning functionality
    async runGwasDataClean() {
        const statusEl = document.getElementById('gwasStatus');
        const resultsEl = document.getElementById('gwasResults');
        const buttonEl = document.getElementById('runGwasButton');

        try {
            if (!this.isWorkerReady) {
                throw new Error('PLINK2 worker not ready yet. Please wait for initialization.');
            }

            buttonEl.disabled = true;
            statusEl.textContent = 'Reading GWAS file from worker filesystem...';
            resultsEl.innerHTML = 'Initializing...';

            // Request the GWAS linear file content from the worker
            const filename = 'plink2.PHENO1.glm.linear';
            
            // Set up a promise to handle the file reading
            const fileContent = await this.readFileFromWorker(filename);
            
            if (!fileContent) {
                throw new Error(`File ${filename} not found. Please run PLINK2 first to generate GWAS results.`);
            }

            statusEl.textContent = 'Processing GWAS data...';
            
            // Create GWAS cleaning worker
            if (this.gwasWorker) {
                this.gwasWorker.terminate();
            }
            
            this.gwasWorker = new Worker('public/clean-data-worker.js');
            
            // Set up worker message handler
            this.gwasWorker.onmessage = (e) => {
                const { type, data, message } = e.data;
                
                switch (type) {
                    case 'status':
                        statusEl.textContent = message;
                        break;
                        
                    case 'progress':
                        const { processed, total, valid } = data;
                        const percentage = Math.round((processed / total) * 100);
                        statusEl.textContent = `Processing: ${percentage}% (${valid} valid entries)`;
                        break;
                        
                    case 'complete':
                        this.handleGwasCleaningComplete(data);
                        buttonEl.disabled = false;
                        break;
                        
                    case 'error':
                        throw new Error(message);
                }
            };
            
            this.gwasWorker.onerror = (error) => {
                throw new Error(`GWAS worker error: ${error.message}`);
            };
            
            // Send file content to worker for processing
            this.gwasWorker.postMessage({
                inputContent: fileContent,
                outputType: 'full'
            });
            
        } catch (error) {
            console.error('GWAS cleaning error:', error);
            statusEl.textContent = 'Error occurred during GWAS cleaning';
            resultsEl.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            buttonEl.disabled = false;
            this.showError(error.message);
        }
    }

    // Helper method to read file content from worker
    readFileFromWorker(filename) {
        return new Promise((resolve, reject) => {
            const originalHandler = this.plinkWorker.onmessage;
            const timeout = setTimeout(() => {
                this.plinkWorker.onmessage = originalHandler;
                reject(new Error(`Timeout reading file: ${filename}`));
            }, 10000);
            
            this.plinkWorker.onmessage = (e) => {
                const { type, data } = e.data;
                
                if (type === 'FILE_CONTENT' && data.filename === filename) {
                    clearTimeout(timeout);
                    this.plinkWorker.onmessage = originalHandler;
                    
                    if (data.isText) {
                        resolve(data.content);
                    } else {
                        reject(new Error(`File ${filename} is not a text file`));
                    }
                } else if (type === 'FILE_READ_ERROR' && data.filename === filename) {
                    clearTimeout(timeout);
                    this.plinkWorker.onmessage = originalHandler;
                    reject(new Error(data.error));
                } else {
                    // Pass other messages to original handler
                    originalHandler(e);
                }
            };
            
            // Request the file
            this.plinkWorker.postMessage({
                type: 'READ_FILE',
                data: { filename }
            });
        });
    }

    // Handle GWAS cleaning completion
    handleGwasCleaningComplete(cleanedData) {
        const statusEl = document.getElementById('gwasStatus');
        const resultsEl = document.getElementById('gwasResults');
        
        statusEl.textContent = 'GWAS data cleaning completed successfully!';
        
        const { header, data, stats } = cleanedData;
        
        // Display cleaning results
        resultsEl.innerHTML = `
            <div class="alert alert-success">
                <h5>✅ GWAS Data Cleaning Complete</h5>
                <p><strong>Statistics:</strong></p>
                <ul>
                    <li>Total lines processed: ${stats.totalLines.toLocaleString()}</li>
                    <li>Valid entries: ${stats.validLines.toLocaleString()}</li>
                    <li>Filtered out: ${stats.filteredLines.toLocaleString()}</li>
                </ul>
                <p><strong>Cleaned data format:</strong> ${header.join(', ')}</p>
                <p>Data is now ready for Manhattan plot visualization.</p>
            </div>
        `;
        
        // Store cleaned data for Manhattan plot
        this.manhattanCurrentData = cleanedData;
        
        // Switch to GWAS results tab
        this.switchTab('gwas');
        
        console.log('GWAS cleaning completed:', stats);
    }

    // Manhattan Plot functionality
    async plotFromCleanedData(targetContainer = 'manhattanPlotDiv') {
        console.log('plotFromCleanedData method called');
        console.log('manhattanCurrentData:', this.manhattanCurrentData);
        console.log('Target container:', targetContainer);

        if (!this.manhattanCurrentData) {
            console.error('No cleaned GWAS data available');
            this.showError('No cleaned GWAS data available. Please run GWAS Data Clean first.');
            return;
        }

        // Determine if this is standalone or embedded plotting
        const isStandalone = targetContainer.includes('Standalone');
        const suffix = isStandalone ? 'Standalone' : '';

        const plotDiv = document.getElementById('manhattanPlotDiv' + suffix);
        const progressSection = document.getElementById('manhattanProgressSection' + suffix);
        const progressMessage = document.getElementById('manhattanProgressMessage' + suffix);
        const progressFill = document.getElementById('manhattanProgressFill' + suffix);
        const progressText = document.getElementById('manhattanProgressText' + suffix);
        const statsDiv = document.getElementById('manhattanStats' + suffix);
        const plotButton = document.getElementById('plotFromCleanedButton' + suffix);

        try {
            // Show progress section
            progressSection.style.display = 'block';
            if (plotButton) plotButton.disabled = true;

            // Clear previous plot
            plotDiv.innerHTML = '';
            this.manhattanProcessingStartTime = Date.now();

            // Update stats
            if (statsDiv) {
                statsDiv.textContent = `Processing ${this.manhattanCurrentData.stats.validLines.toLocaleString()} GWAS variants...`;
            }

            // Initialize Manhattan worker
            if (this.manhattanWorker) {
                this.manhattanWorker.terminate();
            }

            this.manhattanWorker = new Worker('public/manhattan-worker.js');

            // Set up worker message handler
            this.manhattanWorker.onmessage = (e) => {
                const { type, progress, message, traces, ticks, labels, dataCount } = e.data;

                switch (type) {
                    case 'STATUS':
                        if (progressMessage) progressMessage.textContent = message;
                        break;

                    case 'PROGRESS':
                        if (progressFill) progressFill.style.width = `${progress}%`;
                        if (progressText) progressText.textContent = `${Math.round(progress)}%`;
                        if (progressMessage) progressMessage.textContent = message;
                        break;

                    case 'DATA_PROCESSED':
                        // Data processing complete, now create traces
                        this.manhattanWorker.postMessage({
                            type: 'CREATE_TRACES',
                            data: {
                                chrColors: this.chrColors,
                                showSignificanceLine: this.showSignificanceLine,
                                significanceThreshold: this.significanceThreshold
                            }
                        });
                        break;

                    case 'TRACES_READY':
                        this.displayManhattanPlot(traces, ticks, labels, dataCount, suffix);
                        break;

                    case 'ERROR':
                        throw new Error(message);
                }
            };

            this.manhattanWorker.onerror = (error) => {
                throw new Error(`Manhattan worker error: ${error.message}`);
            };

            // Send cleaned data to worker for processing
            this.manhattanWorker.postMessage({
                type: 'PROCESS_DATA',
                data: this.manhattanCurrentData.data
            });

            // Switch to Manhattan plot tab (only for embedded version)
            if (!isStandalone) {
                this.switchTab('manhattan');
            }

        } catch (error) {
            console.error('Manhattan plot error:', error);
            if (progressSection) progressSection.style.display = 'none';
            if (plotButton) plotButton.disabled = false;
            if (statsDiv) statsDiv.textContent = 'Error creating Manhattan plot';
            this.showError(`Manhattan plot error: ${error.message}`);
        }
    }

    displayManhattanPlot(traces, ticks, labels, dataCount, suffix = '') {
        const plotDiv = document.getElementById('manhattanPlotDiv' + suffix);
        const progressSection = document.getElementById('manhattanProgressSection' + suffix);
        const statsDiv = document.getElementById('manhattanStats' + suffix);
        const plotButton = document.getElementById('plotFromCleanedButton' + suffix);

        try {
            // Create layout for Manhattan plot
            const layout = {
                title: {
                    text: 'Manhattan Plot - GWAS Results',
                    font: { size: 18, family: 'Arial, sans-serif' },
                    x: 0.5
                },
                xaxis: {
                    title: {
                        text: 'Chromosome',
                        font: { size: 14, family: 'Arial, sans-serif' }
                    },
                    tickvals: ticks,
                    ticktext: labels,
                    showgrid: true,
                    gridcolor: '#e0e0e0',
                    zeroline: false,
                    tickfont: { size: 12 }
                },
                yaxis: {
                    title: {
                        text: '-log₁₀(P-value)',
                        font: { size: 14, family: 'Arial, sans-serif' }
                    },
                    showgrid: true,
                    gridcolor: '#e0e0e0',
                    zeroline: false,
                    tickfont: { size: 12 }
                },
                hovermode: 'closest',
                showlegend: false,
                margin: { t: 60, r: 50, b: 80, l: 80 },
                plot_bgcolor: 'white',
                paper_bgcolor: 'white'
            };

            // Plot configuration
            const config = {
                displayModeBar: true,
                modeBarButtonsToAdd: ['pan2d', 'select2d', 'lasso2d'],
                modeBarButtonsToRemove: ['autoScale2d'],
                displaylogo: false,
                responsive: true
            };

            // Create the plot
            Plotly.newPlot(plotDiv, traces, layout, config);

            // Add click event listener for navigation
            plotDiv.on('plotly_click', (data) => {
                if (data.points && data.points.length > 0) {
                    const point = data.points[0];
                    const chr = point.customdata[0];
                    const position = point.customdata[1];

                    // Create location string for jbNav: "chr:start-end"
                    const start = Math.max(1, position - 500);
                    const end = position + 500;
                    const location = `${chr}:${start}-${end}`;

                    // Call jbNav function if it exists
                    if (typeof jbNav === 'function') {
                        jbNav(location);
                    } else {
                        console.warn('jbNav function not found');
                    }
                }
            });

            // Hide progress section
            progressSection.style.display = 'none';
            if (plotButton) plotButton.disabled = false;

            // Update stats
            const processingTime = ((Date.now() - this.manhattanProcessingStartTime) / 1000).toFixed(1);
            if (statsDiv) {
                statsDiv.innerHTML = `
                    <strong>Manhattan Plot Complete</strong><br>
                    Data points: ${dataCount.toLocaleString()}<br>
                    Processing time: ${processingTime}s<br>
                    Chromosomes: ${labels.length}
                `;
            }

            console.log('Manhattan plot created successfully');

        } catch (error) {
            console.error('Display error:', error);
            if (progressSection) progressSection.style.display = 'none';
            if (plotButton) plotButton.disabled = false;
            if (statsDiv) statsDiv.textContent = 'Error displaying plot';
            this.showError(`Plot display error: ${error.message}`);
        }
    }

    // Toggle significance line
    toggleSignificanceLinePlot() {
        this.showSignificanceLine = !this.showSignificanceLine;
        
        if (this.manhattanCurrentData) {
            // Re-plot with updated settings
            this.plotFromCleanedData();
        } else {
            this.showError('No plot data available. Please create a plot first.');
        }
    }

    // Export plot as PNG
    exportPlotImage() {
        this.exportPlot('png');
    }

    // Export plot as SVG
    exportPlotSVG() {
        this.exportPlot('svg');
    }

    // Generic export function for both PNG and SVG
    exportPlot(format = 'png') {
        const plotDiv = document.getElementById('manhattanPlotDiv');
        
        if (!plotDiv || !plotDiv.data || plotDiv.data.length === 0) {
            this.showError('No plot available to export');
            return;
        }

        const exportOptions = {
            format: format,
            width: format === 'svg' ? 1200 : 1200,
            height: format === 'svg' ? 600 : 600,
            scale: format === 'png' ? 2 : 1
        };

        Plotly.toImage(plotDiv, exportOptions)
            .then(function(dataurl) {
                const link = document.createElement('a');
                const timestamp = new Date().toISOString().slice(0, 10);
                link.download = `manhattan_plot_${timestamp}.${format}`;
                link.href = dataurl;
                link.click();
                console.log(`${format.toUpperCase()} export completed successfully`);
            })
            .catch((error) => {
                console.error(`${format.toUpperCase()} export error:`, error);
                this.showError(`Failed to export plot as ${format.toUpperCase()}`);
            });
    }

    // Clear Manhattan plot
    clearManhattanPlot() {
        const plotDiv = document.getElementById('manhattanPlotDiv');
        const statsDiv = document.getElementById('manhattanStats');
        
        if (plotDiv) {
            plotDiv.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">Manhattan plot cleared. Click "Plot from Cleaned Data" to create a new plot.</div>';
        }
        
        if (statsDiv) {
            statsDiv.textContent = 'Ready to plot Manhattan plot from cleaned GWAS data';
        }

        // Terminate worker
        if (this.manhattanWorker) {
            this.manhattanWorker.terminate();
            this.manhattanWorker = null;
        }
    }
}

// Global functions for backwards compatibility
window.runPlink = function() {
    window.gwasModule?.runPlink();
};

window.clearOutput = function() {
    window.gwasModule?.clearOutput();
};

window.switchTab = function(tab, event = null) {
    const targetElement = event ? event.target : null;
    window.gwasModule?.switchTab(tab, targetElement);
};

window.runGwasAnalysis = function() {
    console.log('runGwasAnalysis called');
    if (!window.gwasModule) {
        console.error('gwasModule not found');
        alert('GWAS module not initialized');
        return;
    }
    console.log('Calling runGwasDataClean...');
    window.gwasModule.runGwasDataClean();
};

// Manhattan plot global functions
window.plotFromCleanedData = function() {
    console.log('plotFromCleanedData global function called');
    if (!window.gwasModule) {
        console.error('gwasModule not found for Manhattan plot');
        alert('GWAS module not initialized');
        return;
    }
    console.log('Calling gwasModule.plotFromCleanedData...');
    window.gwasModule.plotFromCleanedData();
};

window.toggleSignificanceLinePlot = function() {
    window.gwasModule?.toggleSignificanceLinePlot();
};

window.exportPlotImage = function() {
    window.gwasModule?.exportPlotImage();
};

window.exportPlotSVG = function() {
    window.gwasModule?.exportPlotSVG();
};

window.clearManhattanPlot = function() {
    window.gwasModule?.clearManhattanPlot();
};

// Export for use in other modules
window.GWASModule = GWASModule;