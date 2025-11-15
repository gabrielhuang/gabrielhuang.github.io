/**
 * Reusable slider component with embedded value display
 */

/**
 * Create a reusable slider component with embedded value display
 * @param {string} label - Label text for the slider
 * @param {string} id - Unique identifier for the slider
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} value - Initial value
 * @param {number} step - Step increment
 * @param {function} onChange - Callback function when value changes
 * @returns {HTMLElement} Container element with the slider
 */
function createSlider(label, id, min, max, value, step, onChange) {
    var sliderId = id + 'Slider';
    var fillId = id + 'Fill';
    var invertedId = id + 'Inverted';
    
    var container = document.createElement('div');
    container.className = 'slider-container';
    container.id = id + 'Container';
    
    // Create the filled portion
    var fill = document.createElement('div');
    fill.className = 'slider-fill';
    fill.id = fillId;
    
    // Create the normal text (white on black)
    var textNormal = document.createElement('div');
    textNormal.className = 'slider-text';
    var labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    var valueSpan = document.createElement('span');
    valueSpan.id = id + 'Value';
    valueSpan.textContent = value;
    textNormal.appendChild(labelSpan);
    textNormal.appendChild(valueSpan);
    
    // Create the inverted text (black on white)
    var textInverted = document.createElement('div');
    textInverted.className = 'slider-text-inverted';
    textInverted.id = invertedId;
    var labelSpanInv = document.createElement('span');
    labelSpanInv.textContent = label;
    var valueSpanInv = document.createElement('span');
    valueSpanInv.id = id + 'ValueInverted';
    valueSpanInv.textContent = value;
    textInverted.appendChild(labelSpanInv);
    textInverted.appendChild(valueSpanInv);
    
    // Create hidden range input
    var slider = document.createElement('input');
    slider.type = 'range';
    slider.id = sliderId;
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.step = step;
    
    // Update function
    var updateSlider = function(val) {
        var percent = ((val - min) / (max - min)) * 100;
        fill.style.width = percent + '%';
        textInverted.style.clipPath = 'inset(0 ' + (100 - percent) + '% 0 0)';
        valueSpan.textContent = val;
        valueSpanInv.textContent = val;
        if (onChange) onChange(val);
    };
    
    slider.oninput = function() {
        updateSlider(this.value);
    };
    
    // Allow clicking anywhere on the container to set value
    container.onclick = function(e) {
        var rect = container.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var percent = x / rect.width;
        var newValue = min + (percent * (max - min));
        newValue = Math.round(newValue / step) * step;
        newValue = Math.max(min, Math.min(max, newValue));
        slider.value = newValue;
        updateSlider(newValue);
    };
    
    container.appendChild(fill);
    container.appendChild(textNormal);
    container.appendChild(textInverted);
    container.appendChild(slider);
    
    // Initialize
    updateSlider(value);
    
    return container;
}

/**
 * Update slider value programmatically
 * @param {string} id - Slider identifier (without 'Slider' suffix)
 * @param {number} value - New value to set
 */
function updateSliderValue(id, value) {
    var slider = document.getElementById(id + 'Slider');
    if (!slider) return;
    
    var fill = document.getElementById(id + 'Fill');
    var inverted = document.getElementById(id + 'Inverted');
    var valueDisplay = document.getElementById(id + 'Value');
    var valueDisplayInv = document.getElementById(id + 'ValueInverted');
    
    var min = parseFloat(slider.min);
    var max = parseFloat(slider.max);
    var percent = ((value - min) / (max - min)) * 100;
    
    slider.value = value;
    if (fill) fill.style.width = percent + '%';
    if (inverted) inverted.style.clipPath = 'inset(0 ' + (100 - percent) + '% 0 0)';
    if (valueDisplay) valueDisplay.textContent = value;
    if (valueDisplayInv) valueDisplayInv.textContent = value;
}

/**
 * Get current slider value
 * @param {string} id - Slider identifier (without 'Slider' suffix)
 * @returns {number} Current slider value
 */
function getSliderValue(id) {
    var slider = document.getElementById(id + 'Slider');
    return slider ? parseInt(slider.value) : 0;
}
