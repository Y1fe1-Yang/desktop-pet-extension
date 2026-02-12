// Background Service Worker - Enhanced with better storage and lifecycle management
// Version 2.0

// Installation and update handler
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('Desktop Pet Extension event:', details.reason);

    if (details.reason === 'install') {
        console.log('Desktop Pet Extension installed!');

        // Initialize default settings
        await chrome.storage.local.set({
            petEnabled: false,
            size: 100,
            speed: 5,
            interval: 10,
            soundEnabled: true,
            position: { x: 100, y: 100 },
            installDate: Date.now(),
            version: '2.0.0'
        });

        // Show welcome notification
        chrome.notifications.create('welcome', {
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Welcome to Desktop Pet!',
            message: 'Click the extension icon to get started. Your new pet is ready to play!',
            priority: 2
        });

    } else if (details.reason === 'update') {
        console.log('Desktop Pet Extension updated to version 2.0.0');

        // Migrate settings if needed
        await migrateSettings(details.previousVersion);

        // Update version in storage
        await chrome.storage.local.set({ version: '2.0.0' });
    }
});

// Migrate settings from older versions
async function migrateSettings(previousVersion) {
    try {
        const settings = await chrome.storage.local.get();

        // Add any missing new settings with defaults
        const newSettings = {};

        if (settings.soundEnabled === undefined) {
            newSettings.soundEnabled = true;
        }

        if (settings.position === undefined) {
            newSettings.position = { x: 100, y: 100 };
        }

        if (Object.keys(newSettings).length > 0) {
            await chrome.storage.local.set(newSettings);
            console.log('Settings migrated:', newSettings);
        }
    } catch (error) {
        console.error('Failed to migrate settings:', error);
    }
}

// Handle extension icon click (alternative to popup)
chrome.action.onClicked.addListener(async (tab) => {
    // This won't fire if popup is defined in manifest, but keeping for flexibility
    try {
        const { petEnabled } = await chrome.storage.local.get({ petEnabled: false });
        const newState = !petEnabled;

        await chrome.storage.local.set({ petEnabled: newState });

        await chrome.tabs.sendMessage(tab.id, {
            action: newState ? 'enablePet' : 'disablePet'
        });

        updateBadge(newState);
    } catch (error) {
        console.error('Failed to handle icon click:', error);
    }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request.action);

    switch (request.action) {
        case 'getPetStatus':
            handleGetStatus(sendResponse);
            return true; // Keep channel open for async response

        case 'logEvent':
            console.log(`[Pet Event: ${request.event}]`, request.data || '');
            sendResponse({ success: true });
            break;

        case 'savePosition':
            handleSavePosition(request.position, sendResponse);
            return true;

        case 'getSettings':
            handleGetSettings(sendResponse);
            return true;

        default:
            console.warn('Unknown action:', request.action);
            sendResponse({ success: false, error: 'Unknown action' });
    }

    return false;
});

// Handle get status request
async function handleGetStatus(sendResponse) {
    try {
        const { petEnabled } = await chrome.storage.local.get({ petEnabled: false });
        sendResponse({ enabled: petEnabled });
    } catch (error) {
        console.error('Failed to get status:', error);
        sendResponse({ enabled: false, error: error.message });
    }
}

// Handle save position request
async function handleSavePosition(position, sendResponse) {
    try {
        await chrome.storage.local.set({ position });
        sendResponse({ success: true });
    } catch (error) {
        console.error('Failed to save position:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle get settings request
async function handleGetSettings(sendResponse) {
    try {
        const settings = await chrome.storage.local.get({
            petEnabled: false,
            size: 100,
            speed: 5,
            interval: 10,
            soundEnabled: true,
            position: { x: 100, y: 100 }
        });
        sendResponse({ success: true, settings });
    } catch (error) {
        console.error('Failed to get settings:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Listen for tab updates to re-inject pet if needed
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Wait for page to fully load
    if (changeInfo.status !== 'complete') return;

    // Skip chrome:// and extension pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        return;
    }

    try {
        const { petEnabled } = await chrome.storage.local.get({ petEnabled: false });

        if (petEnabled) {
            // Try to ping content script
            try {
                await chrome.tabs.sendMessage(tabId, { action: 'ping' });
            } catch (error) {
                // Content script not loaded, pet will auto-init via content_scripts in manifest
                console.log('Content script will auto-load on:', tab.url);
            }
        }
    } catch (error) {
        console.error('Failed to handle tab update:', error);
    }
});

// Update extension badge
function updateBadge(enabled) {
    if (enabled) {
        chrome.action.setBadgeText({ text: '✓' });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
}

// Monitor storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace !== 'local') return;

    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.log(`Setting changed: ${key}`, { old: oldValue, new: newValue });

        // Update badge when pet state changes
        if (key === 'petEnabled') {
            updateBadge(newValue);
        }
    }
});

// Periodic cleanup and maintenance
chrome.alarms.create('dailyMaintenance', {
    delayInMinutes: 1440, // 24 hours
    periodInMinutes: 1440
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'dailyMaintenance') {
        console.log('Running daily maintenance...');

        try {
            // Clean up old data if needed
            const settings = await chrome.storage.local.get();

            // Log usage stats (optional)
            console.log('Current settings:', settings);

            // Could add analytics or cleanup here
        } catch (error) {
            console.error('Maintenance failed:', error);
        }
    }
});

// Handle extension suspension/resume (for Manifest V3 service workers)
self.addEventListener('activate', (event) => {
    console.log('Service worker activated');
});

self.addEventListener('suspend', (event) => {
    console.log('Service worker suspending');
});

// Initialize badge on startup
(async function initBadge() {
    try {
        const { petEnabled } = await chrome.storage.local.get({ petEnabled: false });
        updateBadge(petEnabled);
    } catch (error) {
        console.error('Failed to initialize badge:', error);
    }
})();

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId === 'welcome') {
        // Open a new tab or the popup
        chrome.notifications.clear(notificationId);
    }
});

// Command shortcuts (if defined in manifest)
chrome.commands.onCommand.addListener(async (command) => {
    console.log('Command received:', command);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    switch (command) {
        case 'toggle-pet':
            const { petEnabled } = await chrome.storage.local.get({ petEnabled: false });
            const newState = !petEnabled;
            await chrome.storage.local.set({ petEnabled: newState });
            await chrome.tabs.sendMessage(tab.id, {
                action: newState ? 'enablePet' : 'disablePet'
            });
            break;
    }
});

console.log('Desktop Pet background service worker initialized');
