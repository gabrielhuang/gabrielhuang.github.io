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
 * Toggle the variant explorer panel
 */
function toggleVariantExplorer() {
    variantManager.enabled = !variantManager.enabled;
    var showButton = document.getElementById('variantExplorerBtn');
    var hideButton = document.getElementById('hideVariantsBtn');
    var panel = document.getElementById('variantPanel');
    
    if (variantManager.enabled) {
        if (showButton) {
            showButton.style.display = 'none';
        }
        if (hideButton) {
            hideButton.style.display = 'inline-block';
        }
        panel.style.display = 'block';
        generateVariants();
        startVariantAnimation();
    } else {
        if (showButton) {
            showButton.style.display = 'inline-block';
        }
        if (hideButton) {
            hideButton.style.display = 'none';
        }
        panel.style.display = 'none';
        stopVariantAnimation();
        clearVariants();
    }
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
            
            // Update and render each variant
            for (var i = 0; i < variantManager.variants.length; i++) {
                var variant = variantManager.variants[i];
                variant.program.update(10000);
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
 * Generate all variant thumbnails from current state
 */
function generateVariants() {
    variantManager.variants = [];
    
    // Create variants with different mutations
    // 3 Light mutations
    variantManager.variants.push(
        createVariant('Light Mutation 1', function(prog) {
            mutateProgram(prog, 0.1);
        })
    );
    
    variantManager.variants.push(
        createVariant('Light Mutation 2', function(prog) {
            mutateProgram(prog, 0.1);
        })
    );
    
    variantManager.variants.push(
        createVariant('Light Mutation 3', function(prog) {
            mutateProgram(prog, 0.1);
        })
    );
    
    // 3 Heavy mutations
    variantManager.variants.push(
        createVariant('Heavy Mutation 1', function(prog) {
            mutateProgram(prog, 0.5);
        })
    );
    
    variantManager.variants.push(
        createVariant('Heavy Mutation 2', function(prog) {
            mutateProgram(prog, 0.5);
        })
    );
    
    variantManager.variants.push(
        createVariant('Heavy Mutation 3', function(prog) {
            mutateProgram(prog, 0.5);
        })
    );
    
    // 3 Specific mutations
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

/**
 * Move variant panel based on screen size
 * On mobile: inside controls-section
 * On desktop: inside canvas-section
 */
function repositionVariantPanel() {
    var panel = document.getElementById('variantPanel');
    var canvasSection = document.querySelector('.canvas-section');
    var controlsSection = document.querySelector('.controls-section');
    
    if (!panel || !canvasSection || !controlsSection) return;
    
    var isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // Move to top of controls section (after the form opening tag)
        var form = controlsSection.querySelector('form');
        if (form && panel.parentElement !== form) {
            form.insertBefore(panel, form.firstChild);
        }
    } else {
        // Move to canvas section (after canvas_frame)
        var canvasFrame = canvasSection.querySelector('.canvas_frame');
        if (canvasFrame && panel.parentElement !== canvasSection) {
            canvasFrame.parentNode.insertBefore(panel, canvasFrame.nextSibling);
        }
    }
}

// Reposition on load and window resize
window.addEventListener('load', function() {
    repositionVariantPanel();
    // Generate variants on load if enabled
    if (variantManager.enabled) {
        generateVariants();
        startVariantAnimation();
    }
});
window.addEventListener('resize', repositionVariantPanel);

