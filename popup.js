// Popup Control Script - Enhanced with error handling and better UX
// Version 2.0

let petEnabled = false;
let currentTab = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadSettings();
        await getCurrentTab();
        setupEventListeners();
        console.log('Popup initialized successfully');
    } catch (error) {
        console.error('Failed to initialize popup:', error);
        showError('Failed to initialize. Please refresh the page.');
    }
});

// Load settings from storage
async function loadSettings() {
    try {
        const settings = await chrome.storage.local.get({
            petEnabled: false,
            size: 100,
            speed: 5,
            interval: 10,
            soundEnabled: true
        });

        petEnabled = settings.petEnabled;

        // Update UI with loaded settings
        document.getElementById('sizeSlider').value = settings.size;
        document.getElementById('speedSlider').value = settings.speed;
        document.getElementById('intervalSlider').value = settings.interval;
        document.getElementById('soundToggle').checked = settings.soundEnabled;

        updateValueDisplays();
        updateStatusUI();
    } catch (error) {
        console.error('Failed to load settings:', error);
        throw error;
    }
}

// Get current active tab
async function getCurrentTab() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTab = tab;

        // Check if we can inject scripts on this page
        if (!currentTab || currentTab.url.startsWith('chrome://') || currentTab.url.startsWith('chrome-extension://')) {
            showWarning('Cannot run on this page. Try a regular website!');
        }
    } catch (error) {
        console.error('Failed to get current tab:', error);
        throw error;
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Toggle pet on/off
    document.getElementById('togglePet').addEventListener('click', togglePet);

    // Reset position
    document.getElementById('resetPosition').addEventListener('click', resetPosition);

    // Animation buttons
    document.querySelectorAll('[data-anim]').forEach(button => {
        button.addEventListener('click', () => {
            const animType = button.dataset.anim;
            sendAnimation(animType);
        });
    });

    // Size presets
    document.getElementById('sizeSmall').addEventListener('click', () => setSizePreset(75));
    document.getElementById('sizeMedium').addEventListener('click', () => setSizePreset(100));
    document.getElementById('sizeLarge').addEventListener('click', () => setSizePreset(150));

    // Settings sliders
    document.getElementById('sizeSlider').addEventListener('input', handleSizeChange);
    document.getElementById('speedSlider').addEventListener('input', handleSpeedChange);
    document.getElementById('intervalSlider').addEventListener('input', handleIntervalChange);

    // Sound toggle
    document.getElementById('soundToggle').addEventListener('change', handleSoundToggle);
}

// Toggle pet enabled/disabled
async function togglePet() {
    try {
        if (!currentTab) {
            showError('No active tab found');
            return;
        }

        petEnabled = !petEnabled;

        // Save to storage
        await chrome.storage.local.set({ petEnabled });

        // Send message to content script
        try {
            await chrome.tabs.sendMessage(currentTab.id, {
                action: petEnabled ? 'enablePet' : 'disablePet'
            });
        } catch (error) {
            // If content script not loaded, inject it
            if (petEnabled) {
                await injectContentScript();
            }
        }

        updateStatusUI();
    } catch (error) {
        console.error('Failed to toggle pet:', error);
        showError('Failed to toggle pet. Please refresh the page.');
        // Revert state
        petEnabled = !petEnabled;
        updateStatusUI();
    }
}

// Inject content script if not already loaded
async function injectContentScript() {
    try {
        await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['content.js']
        });

        // Wait a bit for script to load
        await new Promise(resolve => setTimeout(resolve, 100));

        // Try to enable pet again
        await chrome.tabs.sendMessage(currentTab.id, {
            action: 'enablePet'
        });
    } catch (error) {
        console.error('Failed to inject content script:', error);
        throw new Error('Cannot inject script on this page');
    }
}

// Reset pet position
async function resetPosition() {
    try {
        if (!currentTab) return;

        await chrome.tabs.sendMessage(currentTab.id, {
            action: 'resetPosition'
        });

        showSuccess('Position reset!');
    } catch (error) {
        console.error('Failed to reset position:', error);
        showError('Failed to reset position');
    }
}

// Send animation command
async function sendAnimation(type) {
    try {
        if (!currentTab) return;
        if (!petEnabled) {
            showWarning('Please enable pet first!');
            return;
        }

        await chrome.tabs.sendMessage(currentTab.id, {
            action: 'triggerAnimation',
            animationType: type
        });
    } catch (error) {
        console.error('Failed to trigger animation:', error);
        showError('Failed to trigger animation');
    }
}

// Size preset handler
async function setSizePreset(size) {
    try {
        const slider = document.getElementById('sizeSlider');
        slider.value = size;

        await handleSizeChange({ target: slider });
    } catch (error) {
        console.error('Failed to set size preset:', error);
    }
}

// Handle size slider change
async function handleSizeChange(e) {
    try {
        const value = parseInt(e.target.value);
        document.getElementById('sizeValue').textContent = value + '%';

        await chrome.storage.local.set({ size: value });

        if (currentTab && petEnabled) {
            await chrome.tabs.sendMessage(currentTab.id, {
                action: 'updateSize',
                value: value
            });
        }
    } catch (error) {
        console.error('Failed to update size:', error);
    }
}

// Handle speed slider change
async function handleSpeedChange(e) {
    try {
        const value = parseInt(e.target.value);
        document.getElementById('speedValue').textContent = value;

        await chrome.storage.local.set({ speed: value });

        if (currentTab && petEnabled) {
            await chrome.tabs.sendMessage(currentTab.id, {
                action: 'updateSpeed',
                value: value
            });
        }
    } catch (error) {
        console.error('Failed to update speed:', error);
    }
}

// Handle interval slider change
async function handleIntervalChange(e) {
    try {
        const value = parseInt(e.target.value);
        document.getElementById('intervalValue').textContent = value + 's';

        await chrome.storage.local.set({ interval: value });

        if (currentTab && petEnabled) {
            await chrome.tabs.sendMessage(currentTab.id, {
                action: 'updateInterval',
                value: value * 1000
            });
        }
    } catch (error) {
        console.error('Failed to update interval:', error);
    }
}

// Handle sound toggle
async function handleSoundToggle(e) {
    try {
        const enabled = e.target.checked;

        await chrome.storage.local.set({ soundEnabled: enabled });

        if (currentTab && petEnabled) {
            await chrome.tabs.sendMessage(currentTab.id, {
                action: 'toggleSound',
                value: enabled
            });
        }
    } catch (error) {
        console.error('Failed to toggle sound:', error);
    }
}

// Update value displays
function updateValueDisplays() {
    document.getElementById('sizeValue').textContent =
        document.getElementById('sizeSlider').value + '%';
    document.getElementById('speedValue').textContent =
        document.getElementById('speedSlider').value;
    document.getElementById('intervalValue').textContent =
        document.getElementById('intervalSlider').value + 's';
}

// Update status UI
function updateStatusUI() {
    const toggleBtn = document.getElementById('togglePet');
    const status = document.getElementById('status');

    if (petEnabled) {
        toggleBtn.textContent = 'Disable Pet';
        toggleBtn.classList.remove('off');
        status.textContent = 'Status: Active ✅';
        status.classList.remove('inactive');
        status.classList.add('active');
    } else {
        toggleBtn.textContent = 'Enable Pet';
        toggleBtn.classList.add('off');
        status.textContent = 'Status: Inactive ❌';
        status.classList.remove('active');
        status.classList.add('inactive');
    }
}

// Notification helpers
function showError(message) {
    showNotification(message, 'error');
}

function showWarning(message) {
    showNotification(message, 'warning');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showNotification(message, type) {
    const status = document.getElementById('status');
    const originalText = status.textContent;
    const originalClass = status.className;

    status.textContent = message;
    status.className = 'status ' + type;

    setTimeout(() => {
        status.textContent = originalText;
        status.className = originalClass;
    }, 2000);
}

// Listen for storage changes from other tabs
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.petEnabled) {
            petEnabled = changes.petEnabled.newValue;
            updateStatusUI();
        }

        if (changes.size) {
            document.getElementById('sizeSlider').value = changes.size.newValue;
            updateValueDisplays();
        }

        if (changes.speed) {
            document.getElementById('speedSlider').value = changes.speed.newValue;
            updateValueDisplays();
        }

        if (changes.interval) {
            document.getElementById('intervalSlider').value = changes.interval.newValue;
            updateValueDisplays();
        }

        if (changes.soundEnabled) {
            document.getElementById('soundToggle').checked = changes.soundEnabled.newValue;
        }
    }
});

console.log('Popup script loaded');
