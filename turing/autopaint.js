/**
 * Auto-Paint - Optional Feature
 * Self-contained module for automatic cursor painting with multiple modes
 * To remove: delete this file, the script tag in index.html, the UI elements, and the hook in updateRender()
 */

var autoPaint = {
    enabled: false,
    mode: 'momentum',
    
    // Auto-paint cursor (separate from manual cursor)
    x: 256,
    y: 256,
    
    // Velocity for momentum-based modes
    velocityX: 0,
    velocityY: 0,
    
    // Target for teleport mode
    targetX: 0,
    targetY: 0,
    stepsToTarget: 0,
    
    // Perlin noise state
    noiseTime: 0,
    
    // Circle pattern state
    circleAngle: 0,
    circleRadius: 100,
    circleCenterX: 256,
    circleCenterY: 256,
    
    // Speed control (base steps per UPDATE_TIME interval)
    speedMultiplier: 2.0,
    
    // Duty cycle: 0 (off), 1 (10% on), 2 (100% on)
    dutyCycleMode: 0,
    dutyCyclePeriod: 1000, // 2 seconds in ms
    dutyCycleStart: 0
};

/**
 * Toggle auto-paint duty cycle: OFF -> 100% -> 10% -> OFF
 */
function toggleAutoPaint() {
    var btn = document.getElementById('autoPaintBtn');
    
    // Cycle through duty cycle modes: 0 (off) -> 2 (100%) -> 1 (10%) -> 0
    if (autoPaint.dutyCycleMode === 0) {
        autoPaint.dutyCycleMode = 2;
    } else if (autoPaint.dutyCycleMode === 2) {
        autoPaint.dutyCycleMode = 1;
    } else {
        autoPaint.dutyCycleMode = 0;
    }
    autoPaint.dutyCycleStart = Date.now();
    
    if (btn) {
        if (autoPaint.dutyCycleMode === 0) {
            // OFF
            autoPaint.enabled = false;
            btn.classList.remove('active');
            btn.textContent = 'Auto-paint: OFF';
            showNotification('Auto-paint: OFF');
        } else if (autoPaint.dutyCycleMode === 1) {
            // 10% duty cycle
            autoPaint.enabled = true;
            btn.classList.add('active');
            btn.textContent = 'Auto-paint: 10%';
            autoPaint.x = canvas.width / 2;
            autoPaint.y = canvas.height / 2;
            showNotification('Auto-paint: 10% duty cycle');
        } else {
            // 100% duty cycle
            autoPaint.enabled = true;
            btn.classList.add('active');
            btn.textContent = 'Auto-paint: 100%';
            autoPaint.x = canvas.width / 2;
            autoPaint.y = canvas.height / 2;
            showNotification('Auto-paint: 100% duty cycle');
        }
    }
}

/**
 * Set auto-paint mode
 */
function setAutoPaintMode(mode) {
    autoPaint.mode = mode;
    
    // Reset mode-specific state
    if (mode === 'momentum') {
        autoPaint.velocityX = (Math.random() - 0.5) * 10;
        autoPaint.velocityY = (Math.random() - 0.5) * 10;
    } else if (mode === 'teleport') {
        setRandomTarget();
    } else if (mode === 'circle') {
        autoPaint.circleAngle = 0;
        autoPaint.circleCenterX = canvas.width / 2;
        autoPaint.circleCenterY = canvas.height / 2;
        autoPaint.circleRadius = Math.min(canvas.width, canvas.height) / 3;
    } else if (mode === 'noise') {
        autoPaint.noiseTime = Math.random() * 1000;
    }
    
    if (autoPaint.enabled) {
        showNotification('Auto-paint mode: ' + getModeName(mode));
    }
}

/**
 * Get human-readable mode name
 */
function getModeName(mode) {
    var names = {
        'momentum': 'Momentum',
        'teleport': 'Teleport',
        'circle': 'Circle',
        'noise': 'Smooth Noise'
    };
    return names[mode] || mode;
}

/**
 * Set a random target for teleport mode
 */
function setRandomTarget() {
    autoPaint.targetX = Math.random() * canvas.width;
    autoPaint.targetY = Math.random() * canvas.height;
    autoPaint.stepsToTarget = 20 + Math.random() * 40; // 20-60 steps
}

/**
 * Simple 1D noise function (approximation)
 */
function noise1D(x) {
    var n = Math.sin(x) * 43758.5453123;
    return n - Math.floor(n);
}

/**
 * 2D noise approximation
 */
function noise2D(x, y) {
    return noise1D(x + y * 57.0);
}

/**
 * Write auto-paint cursor to map (similar to writeCursorToMap but uses autoPaint.x/y)
 */
function writeAutoPaintToMap() {
    var halfSize = cursor.size / 2;
    var startX = Math.floor(autoPaint.x - halfSize);
    var startY = Math.floor(autoPaint.y - halfSize);
    var endX = Math.floor(autoPaint.x + halfSize);
    var endY = Math.floor(autoPaint.y + halfSize);
    
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
            var scaledX = autoPaint.x * scaleX;
            var scaledY = autoPaint.y * scaleY;
            
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
 * Main update function - called each frame when auto-paint is enabled
 */
function updateAutoPaint() {
    if (!autoPaint.enabled) return;
    
    // Check duty cycle
    var shouldPaint = true;
    if (autoPaint.dutyCycleMode === 1) {
        // 10% duty cycle: paint for 0.4s every 4s
        var elapsed = (Date.now() - autoPaint.dutyCycleStart) % autoPaint.dutyCyclePeriod;
        shouldPaint = elapsed < (autoPaint.dutyCyclePeriod * 0.1);
    }
    // dutyCycleMode === 2 means 100%, always paint
    
    if (!shouldPaint) return;
    
    // Calculate steps normalized by UPDATE_TIME (40ms default)
    // Base: 5 steps per 40ms = ~125 steps/sec at 1.0x speed
    var stepsThisFrame = Math.round(5 * autoPaint.speedMultiplier);
    
    // Perform multiple steps per frame for smoother movement
    for (var step = 0; step < stepsThisFrame; step++) {
        switch (autoPaint.mode) {
            case 'momentum':
                updateMomentum();
                break;
            case 'teleport':
                updateTeleport();
                break;
            case 'circle':
                updateCircle();
                break;
            case 'noise':
                updateNoise();
                break;
        }
        
        // Draw at current position using auto-paint cursor
        writeAutoPaintToMap();
    }
}

/**
 * Momentum mode: smooth motion with gradually changing velocity
 */
function updateMomentum() {
    // Add random acceleration
    autoPaint.velocityX += (Math.random() - 0.5) * 2;
    autoPaint.velocityY += (Math.random() - 0.5) * 2;
    
    // Limit velocity
    var maxVelocity = 8;
    var speed = Math.sqrt(autoPaint.velocityX * autoPaint.velocityX + autoPaint.velocityY * autoPaint.velocityY);
    if (speed > maxVelocity) {
        autoPaint.velocityX = (autoPaint.velocityX / speed) * maxVelocity;
        autoPaint.velocityY = (autoPaint.velocityY / speed) * maxVelocity;
    }
    
    // Apply friction
    autoPaint.velocityX *= 0.95;
    autoPaint.velocityY *= 0.95;
    
    // Update position
    autoPaint.x += autoPaint.velocityX;
    autoPaint.y += autoPaint.velocityY;
    
    // Wrap around edges
    if (autoPaint.x < 0) autoPaint.x += canvas.width;
    if (autoPaint.x >= canvas.width) autoPaint.x -= canvas.width;
    if (autoPaint.y < 0) autoPaint.y += canvas.height;
    if (autoPaint.y >= canvas.height) autoPaint.y -= canvas.height;
}

/**
 * Teleport mode: move toward target, then pick new target
 */
function updateTeleport() {
    if (autoPaint.stepsToTarget <= 0) {
        setRandomTarget();
    }
    
    // Move toward target
    var dx = autoPaint.targetX - autoPaint.x;
    var dy = autoPaint.targetY - autoPaint.y;
    
    autoPaint.x += dx / autoPaint.stepsToTarget;
    autoPaint.y += dy / autoPaint.stepsToTarget;
    
    autoPaint.stepsToTarget--;
}

/**
 * Circle mode: draw circular/spiral patterns
 */
function updateCircle() {
    autoPaint.circleAngle += 0.05;
    
    // Slowly change radius for spiral effect
    autoPaint.circleRadius += Math.sin(autoPaint.circleAngle * 0.1) * 0.5;
    
    // Keep radius in reasonable bounds
    var minRadius = 50;
    var maxRadius = Math.min(canvas.width, canvas.height) / 2.5;
    if (autoPaint.circleRadius < minRadius) autoPaint.circleRadius = minRadius;
    if (autoPaint.circleRadius > maxRadius) autoPaint.circleRadius = maxRadius;
    
    // Slowly drift center
    autoPaint.circleCenterX += Math.sin(autoPaint.circleAngle * 0.03) * 0.5;
    autoPaint.circleCenterY += Math.cos(autoPaint.circleAngle * 0.03) * 0.5;
    
    // Keep center on canvas
    autoPaint.circleCenterX = Math.max(50, Math.min(canvas.width - 50, autoPaint.circleCenterX));
    autoPaint.circleCenterY = Math.max(50, Math.min(canvas.height - 50, autoPaint.circleCenterY));
    
    autoPaint.x = autoPaint.circleCenterX + Math.cos(autoPaint.circleAngle) * autoPaint.circleRadius;
    autoPaint.y = autoPaint.circleCenterY + Math.sin(autoPaint.circleAngle) * autoPaint.circleRadius;
}

/**
 * Noise mode: smooth, organic movement using Perlin-like noise
 */
function updateNoise() {
    autoPaint.noiseTime += 0.02;
    
    // Use noise to determine direction
    var angle = noise2D(autoPaint.noiseTime, 0) * Math.PI * 2;
    var speed = 3;
    
    autoPaint.x += Math.cos(angle) * speed;
    autoPaint.y += Math.sin(angle) * speed;
    
    // Wrap around edges
    if (autoPaint.x < 0) autoPaint.x += canvas.width;
    if (autoPaint.x >= canvas.width) autoPaint.x -= canvas.width;
    if (autoPaint.y < 0) autoPaint.y += canvas.height;
    if (autoPaint.y >= canvas.height) autoPaint.y -= canvas.height;
}
