/**
 * Reusable stepper component (button-based number input)
 */

/**
 * Create a reusable stepper component with +/- buttons
 * @param {string} label - Label text for the stepper
 * @param {string} id - Unique identifier for the stepper
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} value - Initial value
 * @param {number|Array} step - Step increment (number or array of values for scale)
 * @param {function} onChange - Callback function when value changes
 * @returns {HTMLElement} Container element with the stepper
 */
function createStepper(label, id, min, max, value, step, onChange) {
    var container = document.createElement('div');
    container.className = 'stepper-container';
    container.id = id + 'StepperContainer';
    
    // Create label
    var labelElem = document.createElement('strong');
    labelElem.textContent = label + ':';
    labelElem.style.marginRight = '8px';
    
    // Create minus button
    var minusBtn = document.createElement('button');
    minusBtn.type = 'button';
    minusBtn.textContent = '-';
    minusBtn.className = 'stepper-button';
    minusBtn.style.cssText = 'padding: 2px 8px; margin: 0 2px;';
    
    // Create value display
    var valueDisplay = document.createElement('span');
    valueDisplay.id = id + 'StepperValue';
    valueDisplay.className = 'stepper-value';
    valueDisplay.textContent = value;
    valueDisplay.style.cssText = 'display: inline-block; min-width: 30px; text-align: center; font-weight: bold; margin: 0 4px;';
    
    // Create plus button
    var plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.textContent = '+';
    plusBtn.className = 'stepper-button';
    plusBtn.style.cssText = 'padding: 2px 8px; margin: 0 2px;';
    
    // Store current value
    var currentValue = value;
    
    // Check if step is an array (scale mode)
    var isScaleMode = Array.isArray(step);
    var scale = isScaleMode ? step : null;
    var currentIndex = isScaleMode ? scale.indexOf(value) : -1;
    
    // Update function
    function updateValue(newValue) {
        if (isScaleMode) {
            // In scale mode, newValue is an index
            if (newValue >= 0 && newValue < scale.length) {
                currentIndex = newValue;
                currentValue = scale[currentIndex];
                valueDisplay.textContent = currentValue;
                
                // Update button states
                minusBtn.disabled = currentIndex <= 0;
                plusBtn.disabled = currentIndex >= scale.length - 1;
                
                if (onChange) {
                    onChange(currentValue);
                }
            }
        } else {
            // Normal mode with min/max
            currentValue = Math.max(min, Math.min(max, newValue));
            valueDisplay.textContent = currentValue;
            
            // Update button states
            minusBtn.disabled = currentValue <= min;
            plusBtn.disabled = currentValue >= max;
            
            if (onChange) {
                onChange(currentValue);
            }
        }
    }
    
    // Minus button click
    minusBtn.addEventListener('click', function() {
        if (isScaleMode) {
            updateValue(currentIndex - 1);
        } else {
            updateValue(currentValue - step);
        }
    });
    
    // Plus button click
    plusBtn.addEventListener('click', function() {
        if (isScaleMode) {
            updateValue(currentIndex + 1);
        } else {
            updateValue(currentValue + step);
        }
    });
    
    // Initial button state
    if (isScaleMode) {
        minusBtn.disabled = currentIndex <= 0;
        plusBtn.disabled = currentIndex >= scale.length - 1;
    } else {
        minusBtn.disabled = currentValue <= min;
        plusBtn.disabled = currentValue >= max;
    }
    
    // Assemble the component
    container.appendChild(labelElem);
    container.appendChild(minusBtn);
    container.appendChild(valueDisplay);
    container.appendChild(plusBtn);
    
    // Store getter/setter for external access
    container.getValue = function() {
        return currentValue;
    };
    
    container.setValue = function(newValue) {
        if (isScaleMode) {
            var index = scale.indexOf(newValue);
            if (index !== -1) {
                updateValue(index);
            }
        } else {
            updateValue(newValue);
        }
    };
    
    return container;
}

/**
 * Get the value of a stepper by ID
 */
function getStepperValue(id) {
    var container = document.getElementById(id + 'StepperContainer');
    return container ? container.getValue() : null;
}

/**
 * Update the value of a stepper by ID
 */
function updateStepperValue(id, value) {
    var container = document.getElementById(id + 'StepperContainer');
    if (container && container.setValue) {
        container.setValue(value);
    }
}
