/**
 * Web Worker for cleaning and optimizing GWAS data for Manhattan plot
 * Memory-optimized version that reads from WASM filesystem
 */

// Memory-efficient function to clean GWAS data from WASM filesystem
function cleanGwasDataFromWASM(ModuleInstance, filename) {
    console.log('Starting GWAS data cleaning from WASM filesystem...');

    let fileData;
    try {
        // Read file from WASM filesystem as Uint8Array
        fileData = ModuleInstance.FS.readFile(filename);
    } catch (error) {
        throw new Error(`Failed to read ${filename} from WASM filesystem: ${error.message}`);
    }

    // Convert Uint8Array to string efficiently using chunks to avoid call stack overflow
    const chunkSize = 65536; // 64KB chunks
    let inputContent = '';

    for (let i = 0; i < fileData.length; i += chunkSize) {
        const chunk = fileData.subarray(i, Math.min(i + chunkSize, fileData.length));
        inputContent += String.fromCharCode.apply(null, chunk);
    }

    // Clear the original fileData from memory
    fileData = null;

    console.log(`File content loaded (${inputContent.length} characters)`);

    // Process the file content line by line to minimize memory usage
    return processGwasContent(inputContent);
}

// Optimized function to process GWAS content with minimal memory usage
function processGwasContent(inputContent) {
    // Split content into lines - handle both literal \n and actual newlines
    let lines;
    if (inputContent.includes('\\n')) {
        lines = inputContent.split('\\n');
    } else {
        lines = inputContent.split('\n');
    }

    // Clear original content from memory
    inputContent = null;

    if (lines.length === 0) {
        throw new Error('No data found in input file');
    }

    const headerLine = lines[0];

    // Extract header - handle both literal \t and actual tabs
    let header;
    if (headerLine.includes('\\t')) {
        header = headerLine.split('\\t');
    } else {
        header = headerLine.split('\t');
    }

    console.log('Header:', header);

    // Find relevant column indices
    const chromIdx = header.findIndex(col => col === '#CHROM');
    const posIdx = header.findIndex(col => col === 'POS');
    const pIdx = header.findIndex(col => col === 'P');

    if (chromIdx === -1 || posIdx === -1 || pIdx === -1) {
        throw new Error(`Required columns not found. Found: CHROM=${chromIdx}, POS=${posIdx}, P=${pIdx}`);
    }

    console.log(`Column indices - CHROM: ${chromIdx}, POS: ${posIdx}, P: ${pIdx}`);

    // Process data lines with memory-efficient streaming approach
    const cleanedData = [];
    const totalLines = lines.length - 1; // Exclude header
    let processedCount = 0;
    let validCount = 0;

    // Process lines in batches to control memory usage
    const batchSize = 10000;
    for (let batchStart = 1; batchStart < lines.length; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, lines.length);

        // Process current batch
        for (let i = batchStart; i < batchEnd; i++) {
            processedCount++;

            // Progress reporting
            if (processedCount % 100000 === 0) {
                console.log(`Processed ${processedCount} lines`);
                // Send progress update to main thread
                self.postMessage({
                    type: 'progress',
                    processed: processedCount,
                    total: totalLines,
                    valid: validCount
                });
            }

            const line = lines[i];
            if (!line || !line.trim()) continue; // Skip empty lines

            // Handle both literal \t and actual tab characters
            let parts;
            if (line.includes('\\t')) {
                parts = line.split('\\t');
            } else {
                parts = line.split('\t');
            }

            if (parts.length <= Math.max(chromIdx, posIdx, pIdx)) {
                continue; // Skip malformed lines
            }

            const chrom = parts[chromIdx].replace(/'/g, "").replace(/"/g, '');
            const pos = parts[posIdx];
            const pVal = parts[pIdx];

            // Skip if we can't parse chromosome or p-value
            try {
                const chromNum = parseInt(chrom, 10);
                const pFloat = parseFloat(pVal);
                const posInt = parseInt(pos, 10);

                // Only keep valid p-values and chromosomes
                if (!isNaN(chromNum) && !isNaN(pFloat) && !isNaN(posInt) &&
                    pFloat > 0 && pFloat <= 1 && chromNum > 0) {
                    cleanedData.push([chromNum, posInt, pFloat]);
                    validCount++;
                }
            } catch (error) {
                // Skip invalid entries
                continue;
            }
        }

        // Clear processed lines from memory to reduce memory usage
        if (batchEnd < lines.length) {
            // Keep header and unprocessed lines
            lines = [lines[0]].concat(lines.slice(batchEnd));
            // Adjust batch start for next iteration
            batchStart = 1 - batchSize; // Will be incremented by batchSize in next iteration
        }
    }

    // Clear lines array from memory
    lines = null;

    console.log(`Processed ${processedCount} total lines`);
    console.log(`Cleaned data has ${cleanedData.length} valid rows`);

    // Create the result object
    const result = {
        header: ['CHR', 'POS', 'P'],
        data: cleanedData,
        stats: {
            totalLines: processedCount,
            validLines: validCount,
            filteredLines: processedCount - validCount
        }
    };

    // Create test data without duplicating the full array
    const testData = {
        header: ['CHR', 'POS', 'P'],
        data: cleanedData.slice(0, Math.min(1000, cleanedData.length)),
        stats: {
            totalLines: Math.min(1000, validCount),
            validLines: Math.min(1000, validCount),
            filteredLines: 0
        }
    };

    return { full: result, test: testData };
}

// Worker message handler
self.onmessage = function(e) {
    const { inputContent, outputType = 'full' } = e.data;

    try {
        console.log('Worker received file content, starting GWAS processing...');

        // Validate input content
        if (!inputContent || typeof inputContent !== 'string') {
            throw new Error('Invalid input content - expected string data');
        }

        // Send initial status
        self.postMessage({
            type: 'status',
            message: 'Processing GWAS data...'
        });

        // Process the data content
        const results = processGwasContent(inputContent);

        // Send completion status
        self.postMessage({
            type: 'status',
            message: `Processing complete. ${results.full.stats.validLines} valid entries found.`
        });

        // Send the results
        if (outputType === 'test') {
            self.postMessage({
                type: 'complete',
                data: results.test
            });
        } else {
            self.postMessage({
                type: 'complete',
                data: results.full
            });
        }

    } catch (error) {
        console.error('Worker error:', error);
        self.postMessage({
            type: 'error',
            message: error.message
        });
    }
};

// Handle worker errors
self.onerror = function(error) {
    console.error('Worker runtime error:', error);
    self.postMessage({
        type: 'error',
        message: 'Worker runtime error: ' + error.message
    });
};