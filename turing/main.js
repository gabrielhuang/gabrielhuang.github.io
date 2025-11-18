/*****************************************************************************
*
*  This file is part of the Turing-Drawings project. The project is
*  distributed at:
*  https://github.com/maximecb/Turing-Drawings
*
*  Copyright (c) 2012, Maxime Chevalier-Boisvert. All rights reserved.
*  Modifications (c) 2025, Gabriel Huang (transition table visualization 
*  and interactive features).
*
*  This software is licensed under the following license (Modified BSD
*  License):
*
*  Redistribution and use in source and binary forms, with or without
*  modification, are permitted provided that the following conditions are
*  met:
*   1. Redistributions of source code must retain the above copyright
*      notice, this list of conditions and the following disclaimer.
*   2. Redistributions in binary form must reproduce the above copyright
*      notice, this list of conditions and the following disclaimer in the
*      documentation and/or other materials provided with the distribution.
*   3. The name of the author may not be used to endorse or promote
*      products derived from this software without specific prior written
*      permission.
*
*  THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESS OR IMPLIED
*  WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
*  MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN
*  NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
*  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
*  NOT LIMITED TO PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
*  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
*  THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
*  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
*  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
*****************************************************************************/

//============================================================================
// Page interface code
//============================================================================

/**
Cursor state
*/
var cursor = {
    x: 0,
    y: 0,
    size: 30,
    colorIndex: 1, // Start with black (index 1)
    visible: false,
    isDrawing: false
};

/**
Transition table history
*/
var tableHistory = [];
var MAX_HISTORY = 20;
var historyCursor = -1; // Points to current position in history (index in array)
var autoRestart = true; // Auto-restart on table changes
var isUpdatingHash = false; // Flag to prevent double-saving when we update the hash

/**
Get color name for display
*/
function getColorName(index) {
    var colorNames = ['Red', 'Black', 'White', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'];
    if (index === 9) return 'Random';
    if (index >= 0 && index < colorNames.length) return colorNames[index];
    return 'Color ' + index;
}

/**
Update cursor info display
*/
function updateCursorInfo() {
    var cursorSizeElem = document.getElementById('cursorSize');
    var cursorColorElem = document.getElementById('cursorColor');
    var cursorSymbolElem = document.getElementById('cursorSymbol');
    var cursorSizeDisplay = document.getElementById('cursorSizeDisplay');
    
    if (cursorSizeElem) cursorSizeElem.textContent = cursor.size;
    if (cursorColorElem) cursorColorElem.textContent = getColorName(cursor.colorIndex);
    if (cursorSymbolElem) cursorSymbolElem.textContent = cursor.colorIndex === 9 ? 'Random' : cursor.colorIndex;
    if (cursorSizeDisplay) cursorSizeDisplay.textContent = cursor.size;
    
    // Update button active states
    renderColorButtons();
}

/**
Render color buttons based on current number of symbols
*/
function renderColorButtons() {
    var container = document.getElementById('colorButtonsContainer');
    if (!container) return;
    
    var numSymbols = program.numSymbols;
    var html = '';
    
    for (var i = 0; i < numSymbols; i++) {
        var color = getSymbolColor(i);
        var isActive = (cursor.colorIndex === i);
        var borderStyle = isActive ? 'border: 3px solid #ffeb3b; box-shadow: 0 0 8px rgba(255, 235, 59, 0.6);' : 'border: 2px solid white;';
        html += '<button type="button" onclick="setCursorColor(' + i + ');" title="Color ' + i + '" ';
        html += 'style="padding: 0; width: 28px; height: 28px; min-height: 28px; ' + borderStyle + ' background: ' + color + ';">';
        html += '<span style="color: white; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; font-weight: bold; font-size: 11px;">' + i + '</span>';
        html += '</button>';
    }
    
    container.innerHTML = html;
    
    // Validate cursor color whenever color buttons are re-rendered
    // (This happens whenever program changes, ensuring cursor stays in valid range)
    if (cursor.colorIndex !== 9 && cursor.colorIndex >= numSymbols) {
        cursor.colorIndex = Math.max(0, numSymbols - 1);
        updateCursorInfo();
    }
    
    // Also update the random color button
    renderRandomColorButton();
}

/**
Render the random color button with multicolor grid pattern
*/
function renderRandomColorButton() {
    var canvas = document.getElementById('randomColorCanvas');
    var btn = document.getElementById('randomColorBtn');
    if (!canvas || !btn) return;
    
    var ctx = canvas.getContext('2d');
    var numColors = Math.min(8, colorMap.length / 3);
    var cellSize = 7; // 28 / 4 = 7
    
    // Draw 4x4 grid of colors
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            var colorIdx = ((i + j) % numColors);
            var r = colorMap[3 * colorIdx + 0];
            var g = colorMap[3 * colorIdx + 1];
            var b = colorMap[3 * colorIdx + 2];
            
            ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }
    
    // Update border to show if active
    var isActive = (cursor.colorIndex === 9);
    if (isActive) {
        btn.style.border = '3px solid #ffeb3b';
        btn.style.boxShadow = '0 0 8px rgba(255, 235, 59, 0.6)';
    } else {
        btn.style.border = '2px solid white';
        btn.style.boxShadow = 'none';
    }
}

/**
Initialize all steppers
*/
function initializeSteppers() {
    // Cursor size stepper (in Drawing Tools section)
    var speedSizeContainer = document.getElementById('speedSizeSliders');
    if (speedSizeContainer) {
        var sizeStepper = createStepper('Cursor size (Z/X)', 'cursorSize', 10, 200, 30, 10, function(value) {
            cursor.size = parseInt(value);
            updateCursorInfo();
        });
        speedSizeContainer.appendChild(sizeStepper);
    }
    
    // States and Symbols steppers (in Advanced section)
    var steppersContainer = document.getElementById('steppersContainer');
    if (steppersContainer) {
        // Number of states stepper
        var statesStepper = createStepper('States', 'numStates', 1, 24, 4, 1, function(value) {
            if (value !== program.numStates) {
                randomProg();
            }
        });
        steppersContainer.appendChild(statesStepper);
        
        // Number of symbols stepper
        var symbolsStepper = createStepper('Symbols', 'numSymbols', 2, 12, 3, 1, function(value) {
            if (value !== program.numSymbols) {
                randomProg();
            }
        });
        steppersContainer.appendChild(symbolsStepper);
    }
    
    // Speed stepper (in Advanced section)
    var speedControl = document.getElementById('speedControl');
    if (speedControl) {
        var speedStepper = createStepper('Speed (-/+)', 'speed', 0, SPEED_LEVELS.length - 1, SPEED_LEVELS[currentSpeedIndex], SPEED_LEVELS, function(value) {
            currentSpeedIndex = SPEED_LEVELS.indexOf(value);
            updateSpeedInfo();
        });
        speedControl.appendChild(speedStepper);
    }
}

/**
Check if auto-restart is enabled and trigger restart if so
*/
function checkAutoRestart() {
    if (autoRestart) {
        restartProg();
    }
}

/**
Toggle auto-restart state
*/
function toggleAutoRestart() {
    autoRestart = !autoRestart;
    var btn = document.getElementById('autoRestartBtn');
    if (btn) {
        if (autoRestart) {
            btn.classList.add('active');
            btn.textContent = 'Auto-restart: ON';
        } else {
            btn.classList.remove('active');
            btn.textContent = 'Auto-restart: OFF';
        }
    }
}

/**
Save current table to history
*/
function saveToHistory() {
    // If viewing old state, discard all future history
    if (historyCursor < tableHistory.length - 1) {
        tableHistory.splice(historyCursor + 1);
    }
    
    var historyEntry = {
        table: program.table.slice(),
        numStates: program.numStates,
        numSymbols: program.numSymbols
    };
    
    // Add to end of history (index becomes version number)
    tableHistory.push(historyEntry);
    
    historyCursor = tableHistory.length - 1;
    console.log('saveToHistory: now at v' + historyCursor + ', history length: ' + tableHistory.length);
    renderHistory();
}

/**
Go back in history (undo)
*/
function historyUndo() {
    if (historyCursor > 0) {
        historyCursor--;
        restoreFromHistory(historyCursor);
        showNotification('Undo → v' + historyCursor);
        // Refresh variants if feature is enabled
        if (typeof generateVariants === 'function' && typeof variantManager !== 'undefined' && variantManager.enabled) {
            generateVariants();
        }
    }
}

/**
Go forward in history (redo)
*/
function historyRedo() {
    if (historyCursor < tableHistory.length - 1) {
        historyCursor++;
        restoreFromHistory(historyCursor);
        showNotification('Redo → v' + historyCursor);
        // Refresh variants if feature is enabled
        if (typeof generateVariants === 'function' && typeof variantManager !== 'undefined' && variantManager.enabled) {
            generateVariants();
        }
    }
}

/**
Show a temporary notification
*/
function showNotification(message) {
    var notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.getElementById('transitionTable').parentElement.appendChild(notification);
    }
    
    notification.style.cssText = 'margin-top: 4px; padding: 4px 8px; background-color: #f0f0f0; color: #555; border-radius: 3px; font-family: monospace; font-size: 0.75em; text-align: center; opacity: 0; transition: opacity 0.2s;';
    notification.textContent = message;
    notification.style.opacity = '1';
    
    setTimeout(function() {
        notification.style.opacity = '0';
    }, 600);
}

/**
Restore table from history
*/
function restoreFromHistory(index) {
    if (index < 0 || index >= tableHistory.length) return;
    
    var entry = tableHistory[index];
    
    // Only restore if dimensions match
    if (entry.numStates === program.numStates && entry.numSymbols === program.numSymbols) {
        program.table = entry.table.slice();
        renderTransitionTable();
        updateShareURL();
        renderHistory();
        checkAutoRestart();
    }
}

/**
Render history UI (update button states)
*/
function renderHistory() {
    var prevButton = document.getElementById('historyPrev');
    var nextButton = document.getElementById('historyNext');
    var variantPrevButton = document.getElementById('variantHistoryPrev');
    var variantPrevVersion = document.getElementById('variantHistoryPrevVersion');
    
    if (prevButton) {
        prevButton.disabled = historyCursor <= 0;
    }
    
    if (nextButton) {
        nextButton.disabled = historyCursor >= tableHistory.length - 1;
    }
    
    if (variantPrevButton) {
        variantPrevButton.disabled = historyCursor <= 0;
    }
    
    if (variantPrevVersion) {
        if (historyCursor > 0) {
            variantPrevVersion.textContent = '(v' + (historyCursor - 1) + ')';
        } else {
            variantPrevVersion.textContent = '';
        }
    }
}

/**
Update the shareable URL based on current program
*/
function updateShareURL() {
    var str = program.toString();
    var url = location.protocol + '//' + location.host + location.pathname;
    var shareURL = url + '#' + str;
    
    // Set flag to prevent hashchange from triggering a save
    isUpdatingHash = true;
    
    // Update browser URL without reloading
    window.location.hash = str;
    
    // Reset flag after a brief delay to allow hashchange event to fire
    setTimeout(function() {
        isUpdatingHash = false;
    }, 10);
}

/**
Copy shareable URL to clipboard and show confirmation
*/
function shareDrawing() {
    var str = program.toString();
    var url = location.protocol + '//' + location.host + location.pathname;
    var shareURL = url + '#' + str;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareURL).then(function() {
        // Show confirmation message
        var button = document.getElementById('shareButton');
        var originalText = button.innerHTML;
        button.innerHTML = '✓ URL Copied!';
        button.classList.add('copied');
        
        setTimeout(function() {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(function(err) {
        // Fallback: show prompt with URL
        prompt('Copy this URL to share your drawing:', shareURL);
    });
}

/**
Write cursor values to the map at current position
*/
function writeCursorToMap() {
    if (!cursor.visible) return;
    
    var halfSize = cursor.size / 2;
    var startX = Math.floor(cursor.x - halfSize);
    var startY = Math.floor(cursor.y - halfSize);
    var endX = Math.floor(cursor.x + halfSize);
    var endY = Math.floor(cursor.y + halfSize);
    
    // Write to all pixels in the cursor square on main canvas
    for (var y = startY; y <= endY; y++) {
        for (var x = startX; x <= endX; x++) {
            // Check bounds
            if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                var mapIndex = y * canvas.width + x;
                
                // If random mode (9), pick random color for each pixel
                if (cursor.colorIndex === 9) {
                    program.map[mapIndex] = Math.floor(Math.random() * program.numSymbols);
                } else {
                    program.map[mapIndex] = cursor.colorIndex;
                }
            }
        }
    }
    
    // Also write to all variant canvases at the same position
    if (typeof variantManager !== 'undefined' && variantManager.enabled && variantManager.variants) {
        for (var i = 0; i < variantManager.variants.length; i++) {
            var variant = variantManager.variants[i];
            var prog = variant.program;
            
            // Scale coordinates from main canvas to variant canvas size
            var scaleX = prog.mapWidth / canvas.width;
            var scaleY = prog.mapHeight / canvas.height;
            var scaledSize = cursor.size * Math.min(scaleX, scaleY);
            var scaledHalfSize = scaledSize / 2;
            var scaledX = cursor.x * scaleX;
            var scaledY = cursor.y * scaleY;
            
            var vStartX = Math.floor(scaledX - scaledHalfSize);
            var vStartY = Math.floor(scaledY - scaledHalfSize);
            var vEndX = Math.floor(scaledX + scaledHalfSize);
            var vEndY = Math.floor(scaledY + scaledHalfSize);
            
            // Write to variant map
            for (var vy = vStartY; vy <= vEndY; vy++) {
                for (var vx = vStartX; vx <= vEndX; vx++) {
                    if (vx >= 0 && vx < prog.mapWidth && vy >= 0 && vy < prog.mapHeight) {
                        var vMapIndex = vy * prog.mapWidth + vx;
                        
                        // If random mode (9), pick random color for each pixel
                        if (cursor.colorIndex === 9) {
                            prog.map[vMapIndex] = Math.floor(Math.random() * prog.numSymbols);
                        } else {
                            prog.map[vMapIndex] = cursor.colorIndex;
                        }
                    }
                }
            }
        }
    }
}

/**
Update simulation speed display
*/
function updateSpeedInfo() {
    UPDATE_ITRS = SPEED_LEVELS[currentSpeedIndex];
    var speedInfoElem = document.getElementById('speedInfo');
    var speedDisplayElem = document.getElementById('speedDisplay');
    
    if (speedInfoElem) speedInfoElem.textContent = UPDATE_ITRS;
    if (speedDisplayElem) speedDisplayElem.textContent = UPDATE_ITRS;
    console.log('Simulation speed: ' + UPDATE_ITRS + ' iterations per update');
}

/**
Get action arrow symbol
*/
function getActionArrow(action) {
    switch(action) {
        case 0: return '→'; // ACTION_LEFT
        case 1: return '←'; // ACTION_RIGHT
        case 2: return '↑'; // ACTION_UP
        case 3: return '↓'; // ACTION_DOWN
        default: return '?';
    }
}

/**
Get RGB color for symbol
*/
function getSymbolColor(symbolIndex) {
    var r = colorMap[3 * symbolIndex + 0];
    var g = colorMap[3 * symbolIndex + 1];
    var b = colorMap[3 * symbolIndex + 2];
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}

/**
Cycle transition component (state, symbol, or action)
*/
function cycleTransition(st0, sy0, component) {
    console.log('cycleTransition called: st=' + st0 + ', sy=' + sy0 + ', component=' + component);
    // Save current state to history BEFORE making the change
    saveToHistory();
    
    var idx = (program.numStates * sy0 + st0) * 3;
    
    if (component === 'state') {
        // Cycle next state
        program.table[idx + 0] = (program.table[idx + 0] + 1) % program.numStates;
    } else if (component === 'symbol') {
        // Cycle next symbol (0 to numSymbols-1)
        program.table[idx + 1] = (program.table[idx + 1] + 1) % program.numSymbols;
    } else if (component === 'action') {
        // Cycle action
        program.table[idx + 2] = (program.table[idx + 2] + 1) % 4;
    }
    
    renderTransitionTable();
    updateShareURL();
    checkAutoRestart();
}

/**
Glitch: Random mutation (mutate a percentage of transitions)
Note: This function is now used internally by the variant generator
*/
function glitchMutate(intensity) {
    saveToHistory();
    
    var mutationRate = intensity || 0.1; // Default 10%
    var totalCells = program.numStates * program.numSymbols;
    var cellsToMutate = Math.ceil(totalCells * mutationRate);
    
    for (var i = 0; i < cellsToMutate; i++) {
        var st = randomInt(0, program.numStates - 1);
        var sy = randomInt(0, program.numSymbols - 1);
        
        // Randomly choose what to mutate: 0=state, 1=symbol, 2=action
        var component = randomInt(0, 2);
        var idx = (program.numStates * sy + st) * 3;
        
        if (component === 0) {
            program.table[idx + 0] = randomInt(0, program.numStates - 1);
        } else if (component === 1) {
            program.table[idx + 1] = randomInt(0, program.numSymbols - 1);
        } else {
            program.table[idx + 2] = randomInt(0, 3);
        }
    }
    
    renderTransitionTable();
    updateShareURL();
    checkAutoRestart();
    console.log('Mutated ' + cellsToMutate + ' cells (' + (mutationRate * 100) + '%)');
}

/**
Glitch: Randomize all (states, symbols, and actions) - INSTANT mutation, not a filter
*/
function glitchRandomizeAll() {
    saveToHistory();
    
    for (var st = 0; st < program.numStates; st++) {
        for (var sy = 0; sy < program.numSymbols; sy++) {
            var idx = (program.numStates * sy + st) * 3;
            program.table[idx + 0] = randomInt(0, program.numStates - 1);
            program.table[idx + 1] = randomInt(0, program.numSymbols - 1);
            program.table[idx + 2] = randomInt(0, 3);
        }
    }
    
    renderTransitionTable();
    updateShareURL();
    checkAutoRestart();
    console.log('Randomized all table entries');
    
    // Regenerate variants after mutation
    if (typeof generateVariants === 'function' && typeof variantManager !== 'undefined' && variantManager.enabled) {
        generateVariants();
    }
}

/**
Render the transition table
*/

/**
Render the transition table
*/
function renderTransitionTable() {
    var tableStr = program.toString();
    
    var html = '<table class="transition-table"><thead><tr><th>State</th>';
    
    // Header row with symbol colors
    for (var sy = 0; sy < program.numSymbols; sy++) {
        html += '<th><div style="width:16px; height:16px; background-color:' + 
                getSymbolColor(sy) + '; border:1px solid #000; margin:auto;"></div></th>';
    }
    html += '</tr></thead><tbody>';
    
    // Rows for each state
    for (var st = 0; st < program.numStates; st++) {
        html += '<tr><td><strong>' + st + '</strong></td>';
        
        // Cells for each symbol
        for (var sy = 0; sy < program.numSymbols; sy++) {
            var idx = (program.numStates * sy + st) * 3;
            var nextState = program.table[idx + 0];
            var nextSymbol = program.table[idx + 1];
            var action = program.table[idx + 2];
            
            // Add a unique ID for each cell
            var cellId = 'cell-' + st + '-' + sy;
            
            html += '<td id="' + cellId + '"><div class="transition-cell">';
            html += '<span class="cell-state" onclick="cycleTransition(' + st + ',' + sy + ',\'state\')">' + nextState + '</span>';
            html += '<span class="cell-symbol" style="background-color:' + getSymbolColor(nextSymbol) + 
                    '" onclick="cycleTransition(' + st + ',' + sy + ',\'symbol\')"></span>';
            html += '<span class="cell-arrow" onclick="cycleTransition(' + st + ',' + sy + ',\'action\')">' + 
                    getActionArrow(action) + '</span>';
            html += '</div></td>';
        }
        
        html += '</tr>';
    }
    
    html += '</tbody></table>';
    document.getElementById('transitionTable').innerHTML = html;
    
    // Update table number in header
    var tableNumberDisplay = document.getElementById('tableNumberDisplay');
    if (tableNumberDisplay) {
        tableNumberDisplay.textContent = 'v' + historyCursor;
    }
    
    // Update button states via renderHistory()
    renderHistory();
}

/**
Show a temporary notification
*/
function showNotification(message) {
    var notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background-color: rgba(0, 0, 0, 0.8); color: white; padding: 12px 24px; border-radius: 6px; font-family: Arial, sans-serif; font-size: 14px; z-index: 10000; opacity: 0; transition: opacity 0.3s;';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.opacity = '1';
    
    setTimeout(function() {
        notification.style.opacity = '0';
    }, 800);
}

/**
Update active cell highlighting without re-rendering the whole table
*/
function updateActiveCell() {
    // Remove previous active cell
    var previousActive = document.querySelector('.active-cell');
    if (previousActive) {
        previousActive.classList.remove('active-cell');
    }
    
    // Highlight current active cell
    var currentState = program.state;
    var currentSymbol = program.map[program.mapWidth * program.yPos + program.xPos];
    var cellId = 'cell-' + currentState + '-' + currentSymbol;
    var activeCell = document.getElementById(cellId);
    if (activeCell) {
        activeCell.classList.add('active-cell');
    }
}

/**
Called after page load to initialize needed resources
*/
function init()
{
    // Get a reference to the canvas
    canvas = document.getElementById("canvas");

    // Set the canvas size
    canvas.width = 512;
    canvas.height = 512;

    // Get a 2D context for the drawing canvas
    canvas.ctx = canvas.getContext("2d");

    // Create an image data array
    canvas.imgData = canvas.ctx.createImageData(canvas.width, canvas.height);

    // Create a default program first (steppers need program to exist)
    program = new Program(4, 3, canvas.width, canvas.height);
    
    // Now initialize steppers (they can safely reference program)
    initializeSteppers();
    
    // If a location hash is specified, load it
    if (location.hash !== '')
    {
        console.log('parsing program from hash');

        program = Program.fromString(
            location.hash.substr(1),
            canvas.width,
            canvas.height
        );
        
        // Update the steppers to match the loaded program
        updateStepperValue('numStates', program.numStates);
        updateStepperValue('numSymbols', program.numSymbols);
        
        // Update share URL
        updateShareURL();
    }
    else
    {
        console.log('no program in URL, using default random program');
        
        // Already created above with default 4 states, 3 symbols
        // Update share URL for the default program
        updateShareURL();
    }
    
    // Save initial state to history as v0
    saveToHistory();
    
    // Render UI elements now that program is ready
    renderColorButtons();
    renderTransitionTable();

    // Set the update function to be called regularly
    updateInterv = setInterval(
        updateRender,
        UPDATE_TIME
    );

    // Add mouse move event listener for cursor
    canvas.addEventListener('mousemove', function(e) {
        var rect = canvas.getBoundingClientRect();
        // Scale coordinates for actual canvas size vs display size
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        cursor.x = (e.clientX - rect.left) * scaleX;
        cursor.y = (e.clientY - rect.top) * scaleY;
        cursor.visible = true;
        updateCursorInfo();
        
        // If dragging, continuously write to map
        if (cursor.isDrawing) {
            writeCursorToMap();
        }
    }, false);

    // Hide cursor when mouse leaves canvas
    canvas.addEventListener('mouseleave', function(e) {
        cursor.visible = false;
        cursor.isDrawing = false;
        updateCursorInfo();
    }, false);

    // Start drawing on mouse down
    canvas.addEventListener('mousedown', function(e) {
        cursor.isDrawing = true;
        writeCursorToMap();
        e.preventDefault();
    }, false);

    // Stop drawing on mouse up
    canvas.addEventListener('mouseup', function(e) {
        cursor.isDrawing = false;
    }, false);

    // Also stop drawing if mouse is released anywhere on document
    document.addEventListener('mouseup', function(e) {
        cursor.isDrawing = false;
    }, false);
    
    // Touch support for mobile
    canvas.addEventListener('touchstart', function(e) {
        var touch = e.touches[0];
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        cursor.x = (touch.clientX - rect.left) * scaleX;
        cursor.y = (touch.clientY - rect.top) * scaleY;
        cursor.visible = true;
        cursor.isDrawing = true;
        writeCursorToMap();
        updateCursorInfo();
        e.preventDefault();
    }, false);
    
    canvas.addEventListener('touchmove', function(e) {
        var touch = e.touches[0];
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        cursor.x = (touch.clientX - rect.left) * scaleX;
        cursor.y = (touch.clientY - rect.top) * scaleY;
        cursor.visible = true;
        updateCursorInfo();
        
        if (cursor.isDrawing) {
            writeCursorToMap();
        }
        e.preventDefault();
    }, false);
    
    canvas.addEventListener('touchend', function(e) {
        cursor.isDrawing = false;
        cursor.visible = false;
        updateCursorInfo();
        e.preventDefault();
    }, false);

    // Add click event listener to write to map
    canvas.addEventListener('click', function(e) {
        if (!cursor.visible) return;
        
        var halfSize = cursor.size / 2;
        var startX = Math.floor(cursor.x - halfSize);
        var startY = Math.floor(cursor.y - halfSize);
        var endX = Math.floor(cursor.x + halfSize);
        var endY = Math.floor(cursor.y + halfSize);
        
        // Write to all pixels in the cursor square
        for (var y = startY; y <= endY; y++) {
            for (var x = startX; x <= endX; x++) {
                // Check bounds
                if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                    var mapIndex = y * canvas.width + x;
                    
                    // If random mode (9), pick random color for each pixel
                    if (cursor.colorIndex === 9) {
                        var numSymbols = parseInt(document.getElementById("numSymbols").value);
                        program.map[mapIndex] = Math.floor(Math.random() * numSymbols);
                    } else {
                        program.map[mapIndex] = cursor.colorIndex;
                    }
                }
            }
        }
        writeCursorToMap();
    }, false);

    // Add keyboard event listeners
    document.addEventListener('keydown', function(e) {
        var key = e.key.toLowerCase();
        
        // Escape to restart
        if (key === 'escape') {
            restartProg();
            showNotification('Restarted');
            // Restart variants if feature is enabled
            if (typeof restartVariants === 'function' && typeof variantManager !== 'undefined' && variantManager.enabled) {
                restartVariants();
            }
            e.preventDefault();
            return;
        }
        
        // Cmd/Ctrl+Z for undo
        if ((e.metaKey || e.ctrlKey) && key === 'z' && !e.shiftKey) {
            historyUndo();
            e.preventDefault();
            return;
        }
        
        // Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y for redo
        if ((e.metaKey || e.ctrlKey) && ((key === 'z' && e.shiftKey) || key === 'y')) {
            historyRedo();
            e.preventDefault();
            return;
        }
        
        // X to increase size
        if (key === 'x') {
            cursor.size = Math.min(cursor.size + 10, 200);
            updateStepperValue('cursorSize', cursor.size);
            updateCursorInfo();
            showNotification('Cursor size: ' + cursor.size);
            e.preventDefault();
        }
        // Z to decrease size
        else if (key === 'z') {
            cursor.size = Math.max(cursor.size - 10, 10);
            updateStepperValue('cursorSize', cursor.size);
            updateCursorInfo();
            showNotification('Cursor size: ' + cursor.size);
            e.preventDefault();
        }
        // + to increase simulation speed
        else if (key === '+' || key === '=') {
            if (currentSpeedIndex < SPEED_LEVELS.length - 1) {
                currentSpeedIndex++;
                updateStepperValue('speed', SPEED_LEVELS[currentSpeedIndex]);
                updateSpeedInfo();
                showNotification('Speed: ' + SPEED_LEVELS[currentSpeedIndex] + ' itr/update');
            }
            e.preventDefault();
        }
        // - to decrease simulation speed
        else if (key === '-' || key === '_') {
            if (currentSpeedIndex > 0) {
                currentSpeedIndex--;
                updateStepperValue('speed', SPEED_LEVELS[currentSpeedIndex]);
                updateSpeedInfo();
                showNotification('Speed: ' + SPEED_LEVELS[currentSpeedIndex] + ' itr/update');
            }
            e.preventDefault();
        }
        // 0-8 to set colors, 9 for random mode
        else if (key >= '0' && key <= '9') {
            var colorIndex = parseInt(key);
            
            // Special case: 9 is random mode
            if (colorIndex === 9) {
                cursor.colorIndex = 9;
                showNotification('Cursor: Random mode');
            }
            // Only allow color indices that exist
            else if (colorIndex < program.numSymbols && colorIndex < colorMap.length / 3) {
                cursor.colorIndex = colorIndex;
                showNotification('Cursor: ' + getColorName(colorIndex));
            }
            
            updateCursorInfo();
            e.preventDefault();
        }
        // M for glitch mutations (mutate)
        else if (key === 'm') {
            if (e.shiftKey) {
                // Shift+M: Heavy mutation variants
                if (typeof generateMutationVariants === 'function') {
                    generateMutationVariants('glitchHeavy');
                    showNotification('Generating Heavy mutants');
                }
            } else {
                // M: Light mutation variants
                if (typeof generateMutationVariants === 'function') {
                    generateMutationVariants('glitchLight');
                    showNotification('Generating Light mutants');
                }
            }
            e.preventDefault();
        }
        // F for full random mutation variants
        else if (key === 'f') {
            if (typeof generateMutationVariants === 'function') {
                generateMutationVariants('fullRandom');
                showNotification('Generating Full Random mutants');
            }
            e.preventDefault();
        }
        // A for arrow mutation variants
        else if (key === 'a') {
            if (typeof generateMutationVariants === 'function') {
                generateMutationVariants('arrows');
                showNotification('Generating Arrow mutants');
            }
            e.preventDefault();
        }
        // S for state mutation variants
        else if (key === 's') {
            if (typeof generateMutationVariants === 'function') {
                generateMutationVariants('states');
                showNotification('Generating State mutants');
            }
            e.preventDefault();
        }
        // C for color mutation variants
        else if (key === 'c') {
            if (typeof generateMutationVariants === 'function') {
                generateMutationVariants('colors');
                showNotification('Generating Color mutants');
            }
            e.preventDefault();
        }
        // R for rotate mutation variants
        else if (key === 'r' && !e.metaKey && !e.ctrlKey) {
            if (typeof generateMutationVariants === 'function') {
                generateMutationVariants('rotate');
                showNotification('Generating Rotate mutants');
            }
            e.preventDefault();
        }
        // Space for randomize all
        else if (key === ' ') {
            glitchRandomizeAll();
            showNotification('Randomized all');
            e.preventDefault();
        }
        // V for refresh variants
        else if (key === 'v') {
            if (typeof generateVariants === 'function' && typeof variantManager !== 'undefined' && variantManager.enabled) {
                generateVariants();
                showNotification('Variants refreshed');
            }
            e.preventDefault();
        }
    }, false);
    
    // Initialize cursor info display
    updateCursorInfo();
    
    // Initialize speed
    updateSpeedInfo();
    
    // Update active cell in transition table
    updateActiveCell();
    
    // Listen for hash changes (bookmarks or manual URL edits)
    window.addEventListener('hashchange', function() {
        // Skip if we're updating the hash ourselves (to avoid double-saving)
        if (isUpdatingHash) {
            console.log('hash changed by our own code, skipping reload');
            return;
        }
        
        if (location.hash !== '') {
            console.log('hash changed externally, loading program from URL');
            
            var newProgram = Program.fromString(
                location.hash.substr(1),
                canvas.width,
                canvas.height
            );
            
            // Update program
            program = newProgram;
            
            // Update UI
            updateStepperValue('numStates', program.numStates);
            updateStepperValue('numSymbols', program.numSymbols);
            renderColorButtons();
            renderTransitionTable();
            
            // Save to history
            saveToHistory();
            
            // Refresh variants if enabled
            if (typeof generateVariants === 'function' && typeof variantManager !== 'undefined' && variantManager.enabled) {
                generateVariants();
            }
            
            showNotification('Loaded from URL');
        }
    }, false);
}
window.addEventListener("load", init, false);

/**
Generate a new random program
*/
function randomProg()
{
    var numStates = getStepperValue('numStates');
    var numSymbols = getStepperValue('numSymbols');

    assert (
        numSymbols <= colorMap.length,
        colorMap.length + ' states currently supported'
    );

    console.log('num states: ' + numStates);
    console.log('num symbols: ' + numSymbols);

    program = new Program(numStates, numSymbols, canvas.width, canvas.height);

    // Update the sharing URL
    updateShareURL();
    
    // Re-render color buttons (numSymbols may have changed)
    renderColorButtons();
    
    // Re-render transition table
    renderTransitionTable();
}

/**
Reset the program state
*/
function restartProg()
{
    program.reset();
}

/**
Reset to default 4 states, 3 symbols program
*/
function resetProgram()
{
    // Create new program with default settings
    program = new Program(4, 3, canvas.width, canvas.height);
    
    // Update the steppers
    updateStepperValue('numStates', 4);
    updateStepperValue('numSymbols', 3);
    
    // Update share URL
    updateShareURL();
    
    // Re-render color buttons
    renderColorButtons();
    
    // Re-render transition table
    renderTransitionTable();
    
    // Save to history
    saveToHistory();
    
    showNotification('Reset to default (4 states, 3 symbols)');
}

// Default console logging function implementation
if (!window.console) console = {};
console.log = console.log || function(){};
console.warn = console.warn || function(){};
console.error = console.error || function(){};
console.info = console.info || function(){};

//============================================================================
// Image update code
//============================================================================

/**
Map of symbols (numbers) to colors
*/
var colorMap = [
    255,0  ,0  ,    // Initial symbol color
    0  ,0  ,0  ,    // Black
    255,255,255,    // White
    0  ,255,0  ,    // Green
    0  ,0  ,255,    // Blue
    255,255,0  ,
    0  ,255,255,
    255,0  ,255,
];

/***
Time per update, in milliseconds
*/
var UPDATE_TIME = 40;

/**
Maximum iterations per update
*/
var UPDATE_ITRS = 1000;

/**
Available simulation speeds (logarithmic scale)
*/
var SPEED_LEVELS = [1, 10, 100, 1000, 10000, 100000, 1000000];
var currentSpeedIndex = 4;

/**
Button control functions - wrappers for keyboard shortcuts
*/
function increaseSpeed() {
    if (currentSpeedIndex < SPEED_LEVELS.length - 1) {
        currentSpeedIndex++;
        updateStepperValue('speed', SPEED_LEVELS[currentSpeedIndex]);
        updateSpeedInfo();
        showNotification('Speed: ' + SPEED_LEVELS[currentSpeedIndex] + ' itr/update');
    }
}

function decreaseSpeed() {
    if (currentSpeedIndex > 0) {
        currentSpeedIndex--;
        updateStepperValue('speed', SPEED_LEVELS[currentSpeedIndex]);
        updateSpeedInfo();
        showNotification('Speed: ' + SPEED_LEVELS[currentSpeedIndex] + ' itr/update');
    }
}

function increaseBrushSize() {
    cursor.size = Math.min(cursor.size + 10, 200);
    updateStepperValue('cursorSize', cursor.size);
    updateCursorInfo();
    showNotification('Cursor size: ' + cursor.size);
}

function decreaseBrushSize() {
    cursor.size = Math.max(cursor.size - 10, 10);
    updateStepperValue('cursorSize', cursor.size);
    updateCursorInfo();
    showNotification('Cursor size: ' + cursor.size);
}

function setCursorColor(colorIndex) {
    // Special case: 9 is random mode
    if (colorIndex === 9) {
        cursor.colorIndex = 9;
        showNotification('Cursor: Random mode');
    }
    // Only allow color indices that exist
    else if (colorIndex < program.numSymbols && colorIndex < colorMap.length / 3) {
        cursor.colorIndex = colorIndex;
        showNotification('Cursor: ' + getColorName(colorIndex));
    }
    
    updateCursorInfo();
}

/**
Throttle transition table updates
*/
var lastTableUpdate = 0;
var TABLE_UPDATE_INTERVAL = 100; // Update table every 100ms

/**
Update the rendering
*/
function updateRender()
{
    var startTime = (new Date()).getTime();
    var startItrc = program.itrCount;

    // Until the update time is exhausted
    for (;;)
    {
        // Update the program
        program.update(Math.min(UPDATE_ITRS, 5000));

        var curTime = (new Date()).getTime();
        var curItrc = program.itrCount;

        if (curItrc - startItrc >= UPDATE_ITRS ||
            curTime - startTime >= UPDATE_TIME)
            break;
    }
    
    // Update transition table highlighting periodically
    if (startTime - lastTableUpdate >= TABLE_UPDATE_INTERVAL) {
        updateActiveCell();
        lastTableUpdate = startTime;
    }
    
    // OPTIONAL: Auto Paint - DELETE THESE 3 LINES TO REMOVE
    if (typeof updateAutoPaint === 'function') {
        updateAutoPaint();
    }

    /*
    console.log(
        'x: ' + program.xPos + 
        ', y: ' + program.yPos + 
        ', st: ' + program.curState +
        ', cc: ' + program.itrCount
    );
    */

    // Produce the image data
    var data = canvas.imgData.data;
    var map = program.map;
    for (var i = 0; i < map.length; ++i)
    {
        var sy = map[i];

        var r = colorMap[3 * sy + 0];
        var g = colorMap[3 * sy + 1];
        var b = colorMap[3 * sy + 2];

        data[4 * i + 0] = r;
        data[4 * i + 1] = g;
        data[4 * i + 2] = b;
        data[4 * i + 3] = 255;
    }

    assert (
        program.map.length * 4 === data.length,
        'invalid image data length'
    );

    // Show the image data
    canvas.ctx.putImageData(canvas.imgData, 0, 0);

    // Draw cursor if visible
    if (cursor.visible) {
        var halfSize = cursor.size / 2;
        
        // Special handling for random mode (9)
        if (cursor.colorIndex === 9) {
            // Draw a multicolor pattern for random mode
            var numColors = Math.min(8, colorMap.length / 3);
            var cellSize = cursor.size / 4; // 4x4 grid
            
            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    var colorIdx = ((i + j) % numColors);
                    var r = colorMap[3 * colorIdx + 0];
                    var g = colorMap[3 * colorIdx + 1];
                    var b = colorMap[3 * colorIdx + 2];
                    
                    canvas.ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.5)';
                    canvas.ctx.fillRect(
                        cursor.x - halfSize + j * cellSize,
                        cursor.y - halfSize + i * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        } else {
            // Get cursor color from colorMap
            var r = colorMap[3 * cursor.colorIndex + 0];
            var g = colorMap[3 * cursor.colorIndex + 1];
            var b = colorMap[3 * cursor.colorIndex + 2];
            
            // Draw filled square
            canvas.ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.5)';
            canvas.ctx.fillRect(
                cursor.x - halfSize,
                cursor.y - halfSize,
                cursor.size,
                cursor.size
            );
        }
        
        // Draw border
        canvas.ctx.strokeStyle = '#000000';
        canvas.ctx.lineWidth = 2;
        canvas.ctx.strokeRect(
            cursor.x - halfSize,
            cursor.y - halfSize,
            cursor.size,
            cursor.size
        );
    }
}

