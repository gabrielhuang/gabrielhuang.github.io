/**
 * Variant Explorer - Optional Feature
 * Self-contained module for exploring multiple mutation variants
 * To remove: delete this file, variants.css, and the script/link tags in index.html
 */

var variantManager = {
    enabled: false,
    variants: [],
    numVariants: 6,
    thumbnailSize: 128,
    simulationSteps: 500
};

/**
 * Toggle the variant explorer panel
 */
function toggleVariantExplorer() {
    variantManager.enabled = !variantManager.enabled;
    var button = document.getElementById('variantExplorerBtn');
    var panel = document.getElementById('variantPanel');
    
    if (variantManager.enabled) {
        button.classList.add('active');
        button.textContent = 'Hide Variants';
        panel.style.display = 'block';
        generateVariants();
    } else {
        button.classList.remove('active');
        button.textContent = 'Explore Variants';
        panel.style.display = 'none';
        clearVariants();
    }
}

/**
 * Generate all variant thumbnails from current state
 */
function generateVariants() {
    variantManager.variants = [];
    
    // Create variants with different mutations
    variantManager.variants.push(
        createVariant('Full Random', function(prog) {
            for (var i = 0; i < prog.table.length; i += 3) {
                prog.table[i + 0] = randomInt(0, prog.numStates - 1);
                prog.table[i + 1] = randomInt(0, prog.numSymbols - 1);
                prog.table[i + 2] = randomInt(0, 3);
            }
        })
    );
    
    variantManager.variants.push(
        createVariant('Heavy Mutation', function(prog) {
            mutateProgram(prog, 0.5);
        })
    );
    
    variantManager.variants.push(
        createVariant('Light Mutation', function(prog) {
            mutateProgram(prog, 0.1);
        })
    );
    
    variantManager.variants.push(
        createVariant('Random States', function(prog) {
            for (var i = 0; i < prog.table.length; i += 3) {
                if (Math.random() < 0.2) {
                    prog.table[i + 0] = randomInt(0, prog.numStates - 1);
                }
            }
        })
    );
    
    variantManager.variants.push(
        createVariant('Random Colors', function(prog) {
            for (var i = 0; i < prog.table.length; i += 3) {
                if (Math.random() < 0.2) {
                    prog.table[i + 1] = randomInt(0, prog.numSymbols - 1);
                }
            }
        })
    );
    
    variantManager.variants.push(
        createVariant('Random Arrows', function(prog) {
            for (var i = 0; i < prog.table.length; i += 3) {
                if (Math.random() < 0.2) {
                    prog.table[i + 2] = randomInt(0, 3);
                }
            }
        })
    );
    
    renderVariantThumbnails();
}

/**
 * Create a single variant
 */
function createVariant(label, mutationFn) {
    // Create a copy of current program
    var tempProgram = new Program(
        program.numStates,
        program.numSymbols,
        variantManager.thumbnailSize,
        variantManager.thumbnailSize
    );
    tempProgram.table = program.table.slice();
    
    // Apply mutation
    mutationFn(tempProgram);
    
    // Store the mutated table
    var mutatedTable = tempProgram.table.slice();
    
    // Reset and simulate
    tempProgram.reset();
    for (var i = 0; i < variantManager.simulationSteps; i++) {
        tempProgram.update(1);
    }
    
    // Create canvas and render
    var canvas = document.createElement('canvas');
    canvas.width = variantManager.thumbnailSize;
    canvas.height = variantManager.thumbnailSize;
    var ctx = canvas.getContext('2d');
    var imgData = ctx.createImageData(canvas.width, canvas.height);
    
    // Render program to canvas
    var data = imgData.data;
    var map = tempProgram.map;
    for (var i = 0; i < map.length; i++) {
        var sy = map[i];
        var r = colorMap[3 * sy + 0];
        var g = colorMap[3 * sy + 1];
        var b = colorMap[3 * sy + 2];
        data[4 * i + 0] = r;
        data[4 * i + 1] = g;
        data[4 * i + 2] = b;
        data[4 * i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    
    return {
        label: label,
        table: mutatedTable,
        canvas: canvas
    };
}

/**
 * Helper: mutate program with given rate
 */
function mutateProgram(prog, rate) {
    var totalCells = prog.numStates * prog.numSymbols;
    var cellsToMutate = Math.ceil(totalCells * rate);
    
    for (var i = 0; i < cellsToMutate; i++) {
        var st = randomInt(0, prog.numStates - 1);
        var sy = randomInt(0, prog.numSymbols - 1);
        var component = randomInt(0, 2);
        var idx = (prog.numStates * sy + st) * 3;
        
        if (component === 0) {
            prog.table[idx + 0] = randomInt(0, prog.numStates - 1);
        } else if (component === 1) {
            prog.table[idx + 1] = randomInt(0, prog.numSymbols - 1);
        } else {
            prog.table[idx + 2] = randomInt(0, 3);
        }
    }
}

/**
 * Render all variant thumbnails to the panel
 */
function renderVariantThumbnails() {
    var container = document.getElementById('variantContainer');
    container.innerHTML = '';
    
    variantManager.variants.forEach(function(variant, index) {
        var wrapper = document.createElement('div');
        wrapper.className = 'variant-thumbnail';
        wrapper.onclick = function() { applyVariant(index); };
        
        wrapper.appendChild(variant.canvas);
        
        var label = document.createElement('div');
        label.className = 'variant-label';
        label.textContent = variant.label;
        wrapper.appendChild(label);
        
        container.appendChild(wrapper);
    });
}

/**
 * Apply selected variant to main program
 */
function applyVariant(index) {
    var variant = variantManager.variants[index];
    program.table = variant.table.slice();
    program.reset();
    
    saveToHistory();
    renderTransitionTable();
    updateShareURL();
    
    showNotification('Applied: ' + variant.label);
    
    // Regenerate variants from new state
    generateVariants();
}

/**
 * Clear all variants and free memory
 */
function clearVariants() {
    variantManager.variants = [];
    var container = document.getElementById('variantContainer');
    if (container) {
        container.innerHTML = '';
    }
}
