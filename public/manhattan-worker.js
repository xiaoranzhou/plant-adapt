// Web Worker for processing GWAS Manhattan plot data
// This worker handles heavy data processing off the main thread

let processedData = null;

self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch(type) {
        case 'PROCESS_DATA':
            processGWASData(data);
            break;
        case 'CREATE_TRACES':
            createPlotTraces(data);
            break;
        case 'PREPROCESS_OPTIMIZED':
            preprocessOptimizedData(data);
            break;
    }
};

function processGWASData(data) {
    postMessage({ type: 'STATUS', message: 'Starting data processing...' });
    
    const processed = [];
    let currentOffset = 0;
    const chromosomes = [...new Set(data.map(d => d[0]))].sort((a, b) => a - b);
    const totalChromosomes = chromosomes.length;
    
    // Process each chromosome
    for (let chrIndex = 0; chrIndex < totalChromosomes; chrIndex++) {
        const chr = chromosomes[chrIndex];
        
        postMessage({ 
            type: 'PROGRESS', 
            progress: (chrIndex / totalChromosomes) * 60, // 60% for processing
            message: `Processing chromosome ${chr} (${chrIndex + 1}/${totalChromosomes})...`
        });
        
        const chrData = data.filter(d => d[0] === chr)
            .sort((a, b) => a[1] - b[1]); // Sort by position
        
        if (chrData.length === 0) continue;
        
        // Find max position efficiently without spread operator
        let maxPos = 0;
        for (let i = 0; i < chrData.length; i++) {
            if (chrData[i][1] > maxPos) {
                maxPos = chrData[i][1];
            }
        }
        
        // Process each data point in this chromosome
        for (let i = 0; i < chrData.length; i++) {
            const d = chrData[i];
            processed.push({
                chr: d[0],
                originalPos: d[1],
                position: currentOffset + d[1],
                pValue: d[2],
                logP: -Math.log10(Math.max(d[2], 1e-300)) // Prevent log(0)
            });
        }
        
        currentOffset += maxPos; // No gap between chromosomes
    }
    
    processedData = processed;
    postMessage({ 
        type: 'DATA_PROCESSED', 
        data: processed,
        progress: 60,
        message: `Data processing complete. Processed ${processed.length.toLocaleString()} points.`
    });
}

function createPlotTraces(config) {
    if (!processedData) {
        postMessage({ type: 'ERROR', message: 'No processed data available' });
        return;
    }
    
    postMessage({ type: 'STATUS', message: 'Creating plot traces...' });
    
    const traces = [];
    const chromosomes = [...new Set(processedData.map(d => d.chr))].sort((a, b) => a - b);
    const chrColors = config.chrColors;
    const totalChromosomes = chromosomes.length;
    
    // Create trace for each chromosome
    for (let index = 0; index < totalChromosomes; index++) {
        const chr = chromosomes[index];
        
        postMessage({ 
            type: 'PROGRESS', 
            progress: 60 + (index / totalChromosomes) * 30, // 60-90%
            message: `Creating trace for chromosome ${chr} (${index + 1}/${totalChromosomes})...`
        });
        
        const chrData = processedData.filter(d => d.chr === chr);
        if (chrData.length === 0) continue;
        
        // Create optimized trace data
        const trace = {
            x: chrData.map(d => d.position),
            y: chrData.map(d => d.logP),
            mode: 'markers',
            type: 'scattergl', // Use WebGL for performance
            name: `Chr ${chr}`,
            marker: {
                color: chrColors[(chr - 1) % chrColors.length],
                size: 2, // Smaller points for large datasets
                opacity: 0.6,
                line: { width: 0 } // Remove marker borders for performance
            },
            hovertemplate: 
                '<b>Chr %{customdata[0]}</b><br>' +
                'Position: %{customdata[1]:,}<br>' +
                'P-value: %{customdata[2]:.2e}<br>' +
                '-log10(P): %{y:.2f}<br>' +
                '<extra></extra>',
            customdata: chrData.map(d => [d.chr, d.originalPos, d.pValue]),
            showlegend: false
        };
        
        traces.push(trace);
    }
    
    postMessage({ 
        type: 'PROGRESS', 
        progress: 90,
        message: 'Adding significance line and calculating ticks...'
    });
    
    // Add significance line if requested
    if (config.showSignificanceLine && processedData.length > 0) {
        let maxPos = 0;
        for (let i = 0; i < processedData.length; i++) {
            if (processedData[i].position > maxPos) {
                maxPos = processedData[i].position;
            }
        }
        
        traces.push({
            x: [0, maxPos],
            y: [config.significanceThreshold, config.significanceThreshold],
            mode: 'lines',
            type: 'scatter',
            name: 'Significance (5×10⁻⁸)',
            line: {
                color: 'red',
                width: 2,
                dash: 'dash'
            },
            hoverinfo: 'none',
            showlegend: false
        });
    }
    
    // Calculate chromosome ticks efficiently
    const ticks = [];
    const labels = [];
    for (let i = 0; i < chromosomes.length; i++) {
        const chr = chromosomes[i];
        const chrData = processedData.filter(d => d.chr === chr);
        if (chrData.length > 0) {
            let minPos = Infinity;
            let maxPos = -Infinity;
            for (let j = 0; j < chrData.length; j++) {
                const pos = chrData[j].position;
                if (pos < minPos) minPos = pos;
                if (pos > maxPos) maxPos = pos;
            }
            ticks.push((minPos + maxPos) / 2);
            labels.push(chr.toString());
        }
    }
    
    postMessage({ 
        type: 'TRACES_READY', 
        traces: traces,
        ticks: ticks,
        labels: labels,
        dataCount: processedData.length,
        progress: 100,
        message: `Plot ready! Displaying ${processedData.length.toLocaleString()} points across ${traces.length - (config.showSignificanceLine ? 1 : 0)} chromosomes.`
    });
}

function preprocessOptimizedData(config) {
    const { data, options } = config;
    
    postMessage({ type: 'STATUS', message: 'Preprocessing data for optimal performance...' });
    
    // Advanced preprocessing options
    const {
        densityReduction = false,
        significanceThreshold = 1e-4,
        maxPointsPerChromosome = 50000,
        preserveSignificant = true
    } = options;
    
    let optimizedData = data;
    
    if (densityReduction && data.length > 100000) {
        postMessage({ type: 'STATUS', message: 'Applying density reduction...' });
        
        const chromosomes = [...new Set(data.map(d => d[0]))].sort((a, b) => a - b);
        optimizedData = [];
        
        for (let chr of chromosomes) {
            const chrData = data.filter(d => d[0] === chr);
            
            if (preserveSignificant) {
                // Separate significant and non-significant points
                const significant = chrData.filter(d => d[2] < significanceThreshold);
                const nonSignificant = chrData.filter(d => d[2] >= significanceThreshold);
                
                // Keep all significant points
                optimizedData.push(...significant);
                
                // Sample non-significant points if too many
                if (nonSignificant.length > maxPointsPerChromosome) {
                    const step = Math.floor(nonSignificant.length / maxPointsPerChromosome);
                    for (let i = 0; i < nonSignificant.length; i += step) {
                        optimizedData.push(nonSignificant[i]);
                    }
                } else {
                    optimizedData.push(...nonSignificant);
                }
            } else {
                // Simple uniform sampling
                if (chrData.length > maxPointsPerChromosome) {
                    const step = Math.floor(chrData.length / maxPointsPerChromosome);
                    for (let i = 0; i < chrData.length; i += step) {
                        optimizedData.push(chrData[i]);
                    }
                } else {
                    optimizedData.push(...chrData);
                }
            }
        }
        
        postMessage({ 
            type: 'STATUS', 
            message: `Density reduction complete. Reduced from ${data.length.toLocaleString()} to ${optimizedData.length.toLocaleString()} points.`
        });
    }
    
    // Continue with normal processing
    processedData = null; // Reset
    processGWASData(optimizedData);
}

// Error handling
self.onerror = function(error) {
    postMessage({ 
        type: 'ERROR', 
        message: 'Worker error: ' + error.message,
        error: error
    });
};