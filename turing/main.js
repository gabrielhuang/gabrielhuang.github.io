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
    size: 100,
    colorIndex: 1, // Start with black (index 1)
    visible: false,
    isDrawing: false
};

/**
Transition table history
*/
var tableHistory = [];
var MAX_HISTORY = 20;
var currentHistoryIndex = -1; // -1 means we're at the latest state (not in history)
var tableCounter = 0; // Incrementing counter for each table, never reused
var autoRestart = false; // Auto-restart on table changes

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
    document.getElementById('cursorSize').textContent = cursor.size;
    document.getElementById('cursorColor').textContent = getColorName(cursor.colorIndex);
    document.getElementById('cursorSymbol').textContent = cursor.colorIndex === 9 ? 'Random' : cursor.colorIndex;
}

/**
Check if auto-restart is enabled and trigger restart if so
*/
function checkAutoRestart() {
    var checkbox = document.getElementById('autoRestart');
    if (checkbox && checkbox.checked) {
        restartProg();
    }
}

/**
Save current table to history
*/
function saveToHistory() {
    // Create a copy of the current table
    var tableCopy = program.table.slice();
    
    // If we're in the middle of history (viewing old state), discard all future history
    if (currentHistoryIndex >= 0) {
        // Remove all entries before currentHistoryIndex (those are the "future" we're discarding)
        tableHistory.splice(0, currentHistoryIndex);
        currentHistoryIndex = -1; // Back to latest
        // Clear any saved snapshot
        window.currentStateSnapshot = null;
        
        // Set the counter to continue from current table number
        // Get the number from the first history entry (which is the one we just went back to)
        if (tableHistory.length > 0) {
            tableCounter = tableHistory[0].number;
        }
    }
    
    // Increment from wherever we are now
    tableCounter++;
    
    var historyEntry = {
        table: tableCopy,
        numStates: program.numStates,
        numSymbols: program.numSymbols,
        number: tableCounter
    };
    
    // Add to beginning of history
    tableHistory.unshift(historyEntry);
    
    // Limit history size
    if (tableHistory.length > MAX_HISTORY) {
        // Remove from end
        tableHistory.pop();
    }
    
    // Update history UI
    renderHistory();
}

/**
Go back in history (undo)
*/
function historyUndo() {
    if (currentHistoryIndex === -1) {
        // We're at latest, save current state first, then go to index 0
        if (tableHistory.length > 0) {
            // Save the current state as a temporary snapshot (not added to history)
            window.currentStateSnapshot = {
                table: program.table.slice(),
                numStates: program.numStates,
                numSymbols: program.numSymbols,
                number: tableCounter
            };
            
            currentHistoryIndex = 0;
            restoreFromHistory(0);
            showNotification('Undo → Table #' + tableHistory[0].number);
        }
    } else if (currentHistoryIndex < tableHistory.length - 1) {
        currentHistoryIndex++;
        restoreFromHistory(currentHistoryIndex);
        showNotification('Undo → Table #' + tableHistory[currentHistoryIndex].number);
    }
}

/**
Go forward in history (redo)
*/
function historyRedo() {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        restoreFromHistory(currentHistoryIndex);
        showNotification('Redo → Table #' + tableHistory[currentHistoryIndex].number);
    } else if (currentHistoryIndex === 0 && window.currentStateSnapshot) {
        // Go back to latest (restore the snapshot we saved)
        var snapshot = window.currentStateSnapshot;
        currentHistoryIndex = -1;
        tableCounter = snapshot.number;
        program.table = snapshot.table.slice();
        
        // Clear the snapshot immediately
        window.currentStateSnapshot = null;
        
        renderTransitionTable();
        updateShareURL();
        renderHistory();
        showNotification('Redo → Table #' + snapshot.number);
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
        currentHistoryIndex = index;
        tableCounter = entry.number; // Show the historical table number
        program.table = entry.table.slice();
        renderTransitionTable();
        updateShareURL();
        renderHistory();
        checkAutoRestart();
        console.log('Restored history #' + entry.number);
    } else {
        console.log('Cannot restore: dimension mismatch');
    }
}

/**
Render history UI (update button states)
*/
function renderHistory() {
    var prevButton = document.getElementById('historyPrev');
    var nextButton = document.getElementById('historyNext');
    
    if (prevButton) {
        // Can go back if we're at latest (index -1) and have history, or if we can go deeper
        prevButton.disabled = !(currentHistoryIndex === -1 && tableHistory.length > 0) && !(currentHistoryIndex < tableHistory.length - 1);
    }
    
    if (nextButton) {
        // Can go forward if we're in history (index >= 0)
        nextButton.disabled = currentHistoryIndex < 0;
    }
}

/**
Update the shareable URL based on current program
*/
function updateShareURL() {
    var str = program.toString();
    var url = location.protocol + '//' + location.host + location.pathname;
    var shareURL = url + '#' + str;
    document.getElementById("shareURL").value = shareURL;
    
    // Update browser URL without reloading
    window.location.hash = str;
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
}

/**
Update simulation speed display
*/
function updateSpeedInfo() {
    UPDATE_ITRS = SPEED_LEVELS[currentSpeedIndex];
    document.getElementById('speedInfo').textContent = UPDATE_ITRS;
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
Glitch: Randomize all actions
*/
function glitchRandomizeActions() {
    saveToHistory();
    
    for (var st = 0; st < program.numStates; st++) {
        for (var sy = 0; sy < program.numSymbols; sy++) {
            var idx = (program.numStates * sy + st) * 3;
            program.table[idx + 2] = randomInt(0, 3);
        }
    }
    
    renderTransitionTable();
    updateShareURL();
    checkAutoRestart();
    console.log('Randomized all actions');
}

/**
Glitch: Randomize all states
*/
function glitchRandomizeStates() {
    saveToHistory();
    
    for (var st = 0; st < program.numStates; st++) {
        for (var sy = 0; sy < program.numSymbols; sy++) {
            var idx = (program.numStates * sy + st) * 3;
            program.table[idx + 0] = randomInt(0, program.numStates - 1);
        }
    }
    
    renderTransitionTable();
    updateShareURL();
    checkAutoRestart();
    console.log('Randomized all states');
}

/**
Glitch: Randomize all symbols (colors)
*/
function glitchRandomizeSymbols() {
    saveToHistory();
    
    for (var st = 0; st < program.numStates; st++) {
        for (var sy = 0; sy < program.numSymbols; sy++) {
            var idx = (program.numStates * sy + st) * 3;
            program.table[idx + 1] = randomInt(0, program.numSymbols - 1);
        }
    }
    
    renderTransitionTable();
    updateShareURL();
    checkAutoRestart();
    console.log('Randomized all symbols');
}

/**
Glitch: Rotate all actions clockwise
*/
function glitchRotate() {
    saveToHistory();
    
    for (var st = 0; st < program.numStates; st++) {
        for (var sy = 0; sy < program.numSymbols; sy++) {
            var idx = (program.numStates * sy + st) * 3;
            var action = program.table[idx + 2];
            
            // Rotate clockwise: LEFT->UP->RIGHT->DOWN->LEFT
            program.table[idx + 2] = (action + 1) % 4;
        }
    }
    
    renderTransitionTable();
    updateShareURL();
    checkAutoRestart();
    console.log('Rotated all actions clockwise');
}

/**
Glitch: Randomize all (states, symbols, and actions)
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
}

/**
Analyze transition table for patterns and properties
*/
function analyzeTransitionTable() {
    console.log('\n=== TRANSITION TABLE ANALYSIS ===');
    
    // 1. Calculate entropy (measure of randomness)
    var entropy = calculateTableEntropy();
    console.log('Table Entropy: ' + entropy.toFixed(3) + ' (0=ordered, higher=chaotic)');
    
    // 2. Detect state cycles
    var cycles = detectStateCycles();
    console.log('State Cycles Found: ' + cycles.length);
    cycles.forEach(function(cycle, i) {
        console.log('  Cycle ' + (i+1) + ': ' + cycle.join(' → ') + ' → ' + cycle[0]);
    });
    
    // 3. Analyze symbol distribution
    var symbolStats = analyzeSymbolDistribution();
    console.log('Symbol Write Distribution:');
    for (var i = 0; i < symbolStats.length; i++) {
        console.log('  Symbol ' + i + ': ' + symbolStats[i].toFixed(1) + '%');
    }
    
    // 4. Analyze action bias
    var actionStats = analyzeActionDistribution();
    var actionNames = ['→ (Right)', '← (Left)', '↑ (Up)', '↓ (Down)'];
    console.log('Action Distribution:');
    for (var i = 0; i < 4; i++) {
        console.log('  ' + actionNames[i] + ': ' + actionStats[i].toFixed(1) + '%');
    }
    
    // 5. Check for fixed points (state maps to itself)
    var fixedPoints = findFixedPoints();
    if (fixedPoints.length > 0) {
        console.log('Fixed Points (state→state): ' + fixedPoints.join(', '));
    }
    
    // 6. Estimate complexity
    var complexity = estimateComplexity(entropy, cycles.length, fixedPoints.length);
    console.log('Estimated Complexity: ' + complexity);
    
    console.log('================================\n');
    
}

/**
Calculate Shannon entropy of the transition table
*/
function calculateTableEntropy() {
    var transitions = {};
    var total = 0;
    
    // Count each unique transition
    for (var st = 0; st < program.numStates; st++) {
        for (var sy = 0; sy < program.numSymbols; sy++) {
            var idx = (program.numStates * sy + st) * 3;
            var key = program.table[idx] + ',' + program.table[idx+1] + ',' + program.table[idx+2];
            transitions[key] = (transitions[key] || 0) + 1;
            total++;
        }
    }
    
    // Calculate Shannon entropy
    var entropy = 0;
    for (var key in transitions) {
        var p = transitions[key] / total;
        entropy -= p * Math.log2(p);
    }
    
    return entropy;
}

/**
Detect cycles in state transitions
*/
function detectStateCycles() {
    var cycles = [];
    var visited = new Array(program.numStates).fill(false);
    
    for (var startState = 0; startState < program.numStates; startState++) {
        if (visited[startState]) continue;
        
        var path = [];
        var state = startState;
        var stateSet = {};
        
        // Follow state transitions (using symbol 0)
        while (!stateSet[state] && path.length < program.numStates * 2) {
            stateSet[state] = true;
            path.push(state);
            visited[state] = true;
            
            // Get next state for symbol 0
            var idx = (program.numStates * 0 + state) * 3;
            state = program.table[idx];
        }
        
        // Check if we found a cycle
        var cycleStart = path.indexOf(state);
        if (cycleStart >= 0 && cycleStart < path.length - 1) {
            var cycle = path.slice(cycleStart);
            if (cycle.length > 1 || (cycle.length === 1 && cycle[0] === state)) {
                cycles.push(cycle);
            }
        }
    }
    
    return cycles;
}

/**
Analyze symbol write distribution
*/
function analyzeSymbolDistribution() {
    var counts = new Array(program.numSymbols).fill(0);
    var total = program.numStates * program.numSymbols;
    
    for (var st = 0; st < program.numStates; st++) {
        for (var sy = 0; sy < program.numSymbols; sy++) {
            var idx = (program.numStates * sy + st) * 3;
            var symbol = program.table[idx + 1];
            counts[symbol]++;
        }
    }
    
    return counts.map(function(c) { return (c / total) * 100; });
}

/**
Analyze action distribution
*/
function analyzeActionDistribution() {
    var counts = [0, 0, 0, 0];
    var total = program.numStates * program.numSymbols;
    
    for (var st = 0; st < program.numStates; st++) {
        for (var sy = 0; sy < program.numSymbols; sy++) {
            var idx = (program.numStates * sy + st) * 3;
            var action = program.table[idx + 2];
            counts[action]++;
        }
    }
    
    return counts.map(function(c) { return (c / total) * 100; });
}

/**
Find fixed points (states that transition to themselves)
*/
function findFixedPoints() {
    var fixedPoints = [];
    
    for (var st = 0; st < program.numStates; st++) {
        var isFixed = true;
        for (var sy = 0; sy < program.numSymbols; sy++) {
            var idx = (program.numStates * sy + st) * 3;
            if (program.table[idx] !== st) {
                isFixed = false;
                break;
            }
        }
        if (isFixed) {
            fixedPoints.push(st);
        }
    }
    
    return fixedPoints;
}

/**
Estimate overall complexity based on various metrics
*/
function estimateComplexity(entropy, numCycles, numFixed) {
    // Simple heuristic classification
    if (numFixed > program.numStates / 2) return 'Simple/Convergent';
    if (entropy < 1.0) return 'Ordered/Repetitive';
    if (numCycles > 0 && entropy < 2.5) return 'Periodic/Cyclic';
    if (entropy > 3.5) return 'Chaotic/Complex';
    return 'Moderate/Structured';
}

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
        tableNumberDisplay.textContent = tableCounter;
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

    // If a location hash is specified
    if (location.hash !== '')
    {
        console.log('parsing program');

        program = Program.fromString(
            location.hash.substr(1),
            canvas.width,
            canvas.height
        );
        
        // Update the input fields to match the loaded program
        document.getElementById('numStates').value = program.numStates;
        document.getElementById('numSymbols').value = program.numSymbols;
        
        // Update share URL
        updateShareURL();
    }
    else
    {
        // Create a random program
        randomProg();
    }

    // Set the update function to be called regularly
    updateInterv = setInterval(
        updateRender,
        UPDATE_TIME
    );

    // Add listeners to num states and num symbols inputs
    document.getElementById('numStates').addEventListener('change', function() {
        // Only randomize if the number of states changed
        var newStates = parseInt(this.value);
        if (newStates !== program.numStates) {
            randomProg();
        }
    });
    
    document.getElementById('numSymbols').addEventListener('change', function() {
        // Only randomize if the number of symbols changed
        var newSymbols = parseInt(this.value);
        if (newSymbols !== program.numSymbols) {
            randomProg();
        }
    });

    // Add mouse move event listener for cursor
    canvas.addEventListener('mousemove', function(e) {
        var rect = canvas.getBoundingClientRect();
        cursor.x = e.clientX - rect.left;
        cursor.y = e.clientY - rect.top;
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
            cursor.size = Math.min(cursor.size + 5, 200);
            updateCursorInfo();
            showNotification('Cursor size: ' + cursor.size);
            e.preventDefault();
        }
        // Z to decrease size
        else if (key === 'z') {
            cursor.size = Math.max(cursor.size - 5, 5);
            updateCursorInfo();
            showNotification('Cursor size: ' + cursor.size);
            e.preventDefault();
        }
        // + to increase simulation speed
        else if (key === '+' || key === '=') {
            if (currentSpeedIndex < SPEED_LEVELS.length - 1) {
                currentSpeedIndex++;
                updateSpeedInfo();
                showNotification('Speed: ' + SPEED_LEVELS[currentSpeedIndex] + ' itr/update');
            }
            e.preventDefault();
        }
        // - to decrease simulation speed
        else if (key === '-' || key === '_') {
            if (currentSpeedIndex > 0) {
                currentSpeedIndex--;
                updateSpeedInfo();
                showNotification('Speed: ' + SPEED_LEVELS[currentSpeedIndex] + ' itr/update');
            }
            e.preventDefault();
        }
        // 0-8 to set colors, 9 for random mode
        else if (key >= '0' && key <= '9') {
            var numSymbols = parseInt(document.getElementById("numSymbols").value);
            var colorIndex = parseInt(key);
            
            // Special case: 9 is random mode
            if (colorIndex === 9) {
                cursor.colorIndex = 9;
                showNotification('Cursor: Random mode');
            }
            // Only allow color indices that exist
            else if (colorIndex < numSymbols && colorIndex < colorMap.length / 3) {
                cursor.colorIndex = colorIndex;
                showNotification('Cursor: ' + getColorName(colorIndex));
            }
            
            updateCursorInfo();
            e.preventDefault();
        }
        // G for glitch mutations
        else if (key === 'g') {
            if (e.shiftKey) {
                // Shift+G: Heavy mutation (50%)
                glitchMutate(0.5);
                showNotification('Heavy glitch (50%)');
            } else {
                // G: Light mutation (10%)
                glitchMutate(0.1);
                showNotification('Light glitch (10%)');
            }
            e.preventDefault();
        }
        // I for randomize actions (arrows)
        else if (key === 'i') {
            glitchRandomizeActions();
            showNotification('Randomized arrows');
            e.preventDefault();
        }
        // O for randomize states
        else if (key === 'o') {
            glitchRandomizeStates();
            showNotification('Randomized states');
            e.preventDefault();
        }
        // P for randomize symbols (colors)
        else if (key === 'p') {
            glitchRandomizeSymbols();
            showNotification('Randomized colors');
            e.preventDefault();
        }
        // R for rotate actions
        else if (key === 'r' && !e.metaKey && !e.ctrlKey) {
            glitchRotate();
            showNotification('Rotated arrows');
            e.preventDefault();
        }
        // Space for randomize all
        else if (key === ' ') {
            glitchRandomizeAll();
            showNotification('Randomized all');
            e.preventDefault();
        }
        // A for analyze table
        else if (key === 'a') {
            analyzeTransitionTable();
            showNotification('Analysis in console');
            e.preventDefault();
        }
    }, false);

    // Initialize cursor info display
    updateCursorInfo();
    
    // Initialize speed
    updateSpeedInfo();
    
    // Render transition table
    renderTransitionTable();
    updateActiveCell();
}
window.addEventListener("load", init, false);

/**
Generate a new random program
*/
function randomProg()
{
    var numStates = parseInt(document.getElementById("numStates").value);
    var numSymbols = parseInt(document.getElementById("numSymbols").value);

    assert (
        numSymbols <= colorMap.length,
        colorMap.length + ' states currently supported'
    );

    console.log('num states: ' + numStates);
    console.log('num symbols: ' + numSymbols);

    program = new Program(numStates, numSymbols, canvas.width, canvas.height);

    // Update the sharing URL
    updateShareURL();
    
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

