/**
 * Variant Explorer - Optional Feature
 * Self-contained module for exploring multiple mutation variants
 * To remove: delete this file, variants.css, and the script/link tags in index.html
 */

var variantManager = {
    enabled: true,  // Start enabled by default
    variants: [],
    numVariants: 9,
    thumbnailSize: 128,
    simulationSteps: 500,
    animationFrameId: null,
    updateInterval: 40  // Match main canvas update time
};

/**
 * Generate variants with a specific mutation type
 */
function generateMutationVariants(mutationType) {
    variantManager.variants = [];
    
    var label = getMutationLabel(mutationType);
    var mutateFn = getMutationFunction(mutationType);
    
    // Generate all 9 variants with this mutation type
    for (var i = 0; i < variantManager.numVariants; i++) {
        var variant = createVariant(label + ' ' + (i + 1), mutateFn, mutationType);
        variantManager.variants.push(variant);
    }
    
    renderVariantThumbnails();
    console.log('Generated ' + variantManager.numVariants + ' variants of type: ' + mutationType);
}

/**
 * Get label for mutation type
 */
function getMutationLabel(type) {
    var labels = {
        'fullRandom': 'Full Random',
        'states': 'Random States',
        'colors': 'Random Colors',
        'arrows': 'Random Arrows',
        'rotate': 'Rotate Arrows',
        'glitchLight': 'Light Mutation',
        'glitchHeavy': 'Heavy Mutation'
    };
    return labels[type] || 'Unknown';
}

/**
 * Get mutation function for a specific type
 */
function getMutationFunction(type) {
    var mutations = {
        'fullRandom': function(prog) {
            for (var i = 0; i < prog.table.length; i += 3) {
                prog.table[i + 0] = randomInt(0, prog.numStates - 1);
                prog.table[i + 1] = randomInt(0, prog.numSymbols - 1);
                prog.table[i + 2] = randomInt(0, 3);
            }
        },
        'states': function(prog) {
            for (var i = 0; i < prog.table.length; i += 3) {
                if (Math.random() < 0.2) {
                    prog.table[i + 0] = randomInt(0, prog.numStates - 1);
                }
            }
        },
        'colors': function(prog) {
            for (var i = 0; i < prog.table.length; i += 3) {
                if (Math.random() < 0.2) {
                    prog.table[i + 1] = randomInt(0, prog.numSymbols - 1);
                }
            }
        },
        'arrows': function(prog) {
            for (var i = 0; i < prog.table.length; i += 3) {
                if (Math.random() < 0.2) {
                    prog.table[i + 2] = randomInt(0, 3);
                }
            }
        },
        'rotate': function(prog) {
            for (var i = 0; i < prog.table.length; i += 3) {
                prog.table[i + 2] = (prog.table[i + 2] + 1) % 4;
            }
        },
        'glitchLight': function(prog) {
            mutateProgram(prog, 0.1);
        },
        'glitchHeavy': function(prog) {
            mutateProgram(prog, 0.5);
        }
    };
    return mutations[type] || function() {};
}

/**
 * Render a single variant to its canvas
 */
function renderVariant(variant) {
    var data = variant.imgData.data;
    var map = variant.program.map;
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
    variant.ctx.putImageData(variant.imgData, 0, 0);
}

/**
 * Start animation loop for all variants
 */
function startVariantAnimation() {
    if (variantManager.animationFrameId !== null) return;
    
    var lastTime = Date.now();
    
    function animate() {
        var now = Date.now();
        if (now - lastTime >= variantManager.updateInterval) {
            lastTime = now;
            
            // Update and render each variant using the same speed as main canvas
            for (var i = 0; i < variantManager.variants.length; i++) {
                var variant = variantManager.variants[i];
                variant.program.update(UPDATE_ITRS);
                renderVariant(variant);
            }
        }
        
        variantManager.animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();
}

/**
 * Stop animation loop for variants
 */
function stopVariantAnimation() {
    if (variantManager.animationFrameId !== null) {
        cancelAnimationFrame(variantManager.animationFrameId);
        variantManager.animationFrameId = null;
    }
}

/**
 * Generate mixed variants (one of each type, cycling through)
 */
function generateVariants() {
    variantManager.variants = [];
    
    var mutationTypes = ['fullRandom', 'states', 'colors', 'arrows', 'rotate', 'glitchLight', 'glitchHeavy'];
    
    // Generate 9 variants, cycling through mutation types
    for (var i = 0; i < variantManager.numVariants; i++) {
        var mutationType = mutationTypes[i % mutationTypes.length];
        var label = getMutationLabel(mutationType);
        var mutateFn = getMutationFunction(mutationType);
        
        var variant = createVariant(label, mutateFn, mutationType);
        variantManager.variants.push(variant);
    }
    
    renderVariantThumbnails();
    console.log('Generated ' + variantManager.numVariants + ' mixed variants');
}

/**
 * Restart all variant simulations from their initial state
 */
function restartVariants() {
    if (!variantManager.enabled || variantManager.variants.length === 0) return;
    
    // Reset each variant's program to initial state
    for (var i = 0; i < variantManager.variants.length; i++) {
        variantManager.variants[i].program.reset();
    }
}

/**
 * Create a single variant
 */
function createVariant(label, mutationFn, variantType) {
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
    
    // Reset and run initial simulation
    tempProgram.reset();
    for (var i = 0; i < variantManager.simulationSteps; i++) {
        tempProgram.update(1);
    }
    
    // Create canvas
    var canvas = document.createElement('canvas');
    canvas.width = variantManager.thumbnailSize;
    canvas.height = variantManager.thumbnailSize;
    var ctx = canvas.getContext('2d');
    var imgData = ctx.createImageData(canvas.width, canvas.height);
    
    return {
        label: label,
        type: variantType,
        table: mutatedTable,
        canvas: canvas,
        ctx: ctx,
        imgData: imgData,
        program: tempProgram  // Keep the program for continuous updates
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
    
    // Hide the mutation notice after first click
    var notice = document.getElementById('mutationNotice');
    if (notice) {
        notice.style.display = 'none';
    }
    
    // Refresh mutants to show new mutations based on the applied mutant
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

// Initialize on load
window.addEventListener('load', function() {
    // Generate initial variants
    if (variantManager.enabled) {
        generateVariants();
        startVariantAnimation();
    }
});

