// Desktop Pet Content Script - Injected into webpages
// Version 2.0 - Fixed interaction bugs and improved features

let petContainer = null;
let isDragging = false;
let hasMoved = false; // Track if mouse moved during drag
let currentX, currentY, initialX, initialY;
let xOffset = 100;
let yOffset = 100;
let autoAnimationInterval = null;
let petEnabled = false;
let settings = {
    size: 100,
    speed: 5,
    interval: 10000,
    soundEnabled: true
};

// Animation state management
let currentAnimation = 'idle';
let pressTimer = null;
let clickCount = 0;
let clickTimer = null;
let idleTimer = null;
let sleepTimer = null;
let lastInteractionTime = Date.now();

// Animation configuration - will be injected by generator or can be customized
const animationsConfig = {
    idle: { sprite: 'sprites/idle.png', frames: 4, duration: 0.8 },
    walk: { sprite: 'sprites/walk.png', frames: 6, duration: 0.6 },
    jump: { sprite: 'sprites/jump.png', frames: 4, duration: 0.5 },
    sleep: { sprite: 'sprites/sleep.png', frames: 3, duration: 1.2 },
    happy: { sprite: 'sprites/happy.png', frames: 4, duration: 0.6 },
    pet: { sprite: 'sprites/pet.png', frames: 4, duration: 0.8 },
    eat: { sprite: 'sprites/eat.png', frames: 5, duration: 0.7 },
    curious: { sprite: 'sprites/curious.png', frames: 3, duration: 0.9 }
};

// Initialize on load
(async function init() {
    try {
        // Load settings from storage
        const stored = await chrome.storage.local.get({
            petEnabled: false,
            size: 100,
            speed: 5,
            interval: 10,
            soundEnabled: true,
            position: { x: 100, y: 100 }
        });

        settings = {
            size: stored.size,
            speed: stored.speed,
            interval: stored.interval * 1000,
            soundEnabled: stored.soundEnabled
        };

        xOffset = stored.position.x;
        yOffset = stored.position.y;
        petEnabled = stored.petEnabled;

        if (petEnabled) {
            createPet();
        }
    } catch (error) {
        console.error('Failed to initialize pet:', error);
    }
})();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        switch (request.action) {
            case 'enablePet':
                if (!petContainer) {
                    createPet();
                }
                petEnabled = true;
                sendResponse({ success: true });
                break;

            case 'disablePet':
                if (petContainer) {
                    removePet();
                }
                petEnabled = false;
                sendResponse({ success: true });
                break;

            case 'resetPosition':
                resetPosition();
                sendResponse({ success: true });
                break;

            case 'triggerAnimation':
                triggerAnimation(request.animationType);
                sendResponse({ success: true });
                break;

            case 'updateSize':
                settings.size = request.value;
                updatePetSize();
                sendResponse({ success: true });
                break;

            case 'updateSpeed':
                settings.speed = request.value;
                sendResponse({ success: true });
                break;

            case 'updateInterval':
                settings.interval = request.value;
                restartAutoAnimation();
                sendResponse({ success: true });
                break;

            case 'toggleSound':
                settings.soundEnabled = request.value;
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
    }
    return true; // Keep message channel open for async response
});

// Create the pet on the page
function createPet() {
    if (petContainer) return;

    petContainer = document.createElement('div');
    petContainer.id = 'desktop-pet-container';

    // Create sprite image element
    const spriteImg = document.createElement('div');
    spriteImg.id = 'pet-sprite';
    spriteImg.style.width = '64px';
    spriteImg.style.height = '64px';
    spriteImg.style.imageRendering = 'pixelated';

    petContainer.appendChild(spriteImg);

    // Inject styles
    injectStyles();

    document.body.appendChild(petContainer);

    // Set initial position
    petContainer.style.left = xOffset + 'px';
    petContainer.style.top = yOffset + 'px';
    petContainer.style.transform = `scale(${settings.size / 100})`;

    // Bind event handlers
    setupEventHandlers();

    // Start animations and idle detection
    switchAnimation('idle');
    startAutoAnimation();
    resetIdleTimer();

    console.log('Desktop Pet activated on page!');
}

// Remove pet from page
function removePet() {
    if (petContainer) {
        // Save position before removing
        savePosition();
        petContainer.remove();
        petContainer = null;
    }

    if (autoAnimationInterval) {
        clearInterval(autoAnimationInterval);
        autoAnimationInterval = null;
    }

    clearAllTimers();
}

// Inject CSS styles
function injectStyles() {
    const style = document.createElement('style');
    style.id = 'desktop-pet-styles';
    style.textContent = `
        #desktop-pet-container {
            position: fixed;
            cursor: grab;
            user-select: none;
            z-index: 999999;
            pointer-events: auto;
            transform-origin: center center;
            transition: transform 0.1s ease-out;
        }

        #desktop-pet-container.dragging {
            cursor: grabbing;
        }

        #pet-sprite {
            width: 64px;
            height: 64px;
            image-rendering: pixelated;
            background-size: auto 100%;
            transition: transform 0.2s;
        }

        #pet-sprite:hover {
            transform: scale(1.05);
        }

        /* Animation classes */
        .pet-bounce {
            animation: bounce 0.6s ease-in-out;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }

        /* Visual effects */
        .heart-effect {
            position: fixed;
            font-size: 20px;
            animation: float-up 1s ease-out forwards;
            pointer-events: none;
            z-index: 1000000;
        }

        @keyframes float-up {
            from { transform: translateY(0) scale(0.5); opacity: 1; }
            to { transform: translateY(-60px) scale(1.2); opacity: 0; }
        }

        .sleep-z {
            position: fixed;
            font-size: 24px;
            animation: float-up-z 2s ease-out;
            pointer-events: none;
            z-index: 1000000;
            opacity: 0.7;
        }

        @keyframes float-up-z {
            0% { transform: translate(0, 0) scale(0.5); opacity: 0.8; }
            100% { transform: translate(20px, -40px) scale(1); opacity: 0; }
        }

        /* Context menu */
        .pet-context-menu {
            position: fixed;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 8px 0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 1000001;
            display: none;
            min-width: 160px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .pet-context-menu-item {
            padding: 10px 20px;
            cursor: pointer;
            font-size: 14px;
            color: #333;
            transition: background 0.15s;
        }

        .pet-context-menu-item:hover {
            background: #f5f5f5;
        }

        .pet-context-menu-separator {
            height: 1px;
            background: #e0e0e0;
            margin: 5px 0;
        }
    `;
    document.head.appendChild(style);
}

// Setup all event handlers with bug fixes
function setupEventHandlers() {
    // Drag handlers with hasMoved flag to prevent click/drag conflicts
    petContainer.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // Click handler - only triggers if no drag occurred
    petContainer.addEventListener('click', (e) => {
        if (hasMoved) return; // Don't trigger click if dragged

        clickCount++;

        if (clickCount === 1) {
            clickTimer = setTimeout(() => {
                // Single click - jump animation
                switchAnimation('jump');
                petContainer.classList.add('pet-bounce');
                setTimeout(() => petContainer.classList.remove('pet-bounce'), 600);
                clickCount = 0;
            }, 300);
        } else if (clickCount === 2) {
            // Double click - happy animation
            clearTimeout(clickTimer);
            switchAnimation('happy');
            clickCount = 0;
        }

        resetIdleTimer();
    });

    // Long-press detection with fixed timer management
    let longPressStartTime = 0;

    petContainer.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            longPressStartTime = Date.now();
            pressTimer = setTimeout(() => {
                if (!hasMoved) { // Only trigger if not dragging
                    switchAnimation('pet');
                    showHearts();
                }
                pressTimer = null;
            }, 1000); // 1 second for long press
        }
    });

    petContainer.addEventListener('mouseup', () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    });

    // Mouse leave - clear press timer
    petContainer.addEventListener('mouseleave', () => {
        if (pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
        }
    });

    // Hover effect
    petContainer.addEventListener('mouseenter', () => {
        if (!isDragging && animationsConfig.curious) {
            switchAnimation('curious');
        }
        resetIdleTimer();
    });

    petContainer.addEventListener('mouseleave', () => {
        if (!isDragging && currentAnimation === 'curious') {
            switchAnimation('idle');
        }
    });

    // Right-click context menu
    petContainer.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showContextMenu(e.clientX, e.clientY);
        resetIdleTimer();
    });
}

// Drag functionality with hasMoved flag
function dragStart(e) {
    if (e.button !== 0) return;

    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
    hasMoved = false; // Reset movement flag

    petContainer.classList.add('dragging');

    // Switch to walk animation while dragging
    if (animationsConfig.walk) {
        switchAnimation('walk');
    }

    resetIdleTimer();
}

function drag(e) {
    if (!isDragging || !petContainer) return;

    e.preventDefault();

    const newX = e.clientX - initialX;
    const newY = e.clientY - initialY;

    // Check if actually moved (more than 5px)
    if (Math.abs(newX - xOffset) > 5 || Math.abs(newY - yOffset) > 5) {
        hasMoved = true;
    }

    currentX = newX;
    currentY = newY;
    xOffset = currentX;
    yOffset = currentY;

    // Keep pet within viewport bounds
    const rect = petContainer.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    xOffset = Math.max(0, Math.min(xOffset, maxX));
    yOffset = Math.max(0, Math.min(yOffset, maxY));

    petContainer.style.left = xOffset + 'px';
    petContainer.style.top = yOffset + 'px';
}

function dragEnd(e) {
    if (!isDragging) return;

    isDragging = false;
    petContainer.classList.remove('dragging');

    // Save position
    savePosition();

    // Return to idle animation after drag
    setTimeout(() => {
        if (!hasMoved) return; // Don't switch if no movement
        switchAnimation('idle');
    }, 100);

    resetIdleTimer();
}

// Reset position to default
function resetPosition() {
    if (!petContainer) return;

    xOffset = 100;
    yOffset = 100;
    petContainer.style.left = xOffset + 'px';
    petContainer.style.top = yOffset + 'px';

    savePosition();
}

// Save current position to storage
function savePosition() {
    chrome.storage.local.set({
        position: { x: xOffset, y: yOffset }
    }).catch(err => console.error('Failed to save position:', err));
}

// Switch animation with proper sprite management
function switchAnimation(type) {
    if (!petContainer || !animationsConfig[type]) {
        console.warn('Animation not available:', type);
        return;
    }

    const config = animationsConfig[type];
    const spriteImg = petContainer.querySelector('#pet-sprite');
    if (!spriteImg) return;

    // Update sprite image
    const spriteUrl = chrome.runtime.getURL(config.sprite);
    spriteImg.style.backgroundImage = `url(${spriteUrl})`;

    // Calculate animation
    const duration = config.duration || 0.8;
    const frames = config.frames || 4;
    const spriteWidth = 64 * frames;

    spriteImg.style.animation = `sprite-anim-${type} ${duration}s steps(${frames}) infinite`;

    // Inject keyframe animation
    const animId = `sprite-anim-${type}`;
    if (!document.getElementById(animId)) {
        const keyframes = document.createElement('style');
        keyframes.id = animId;
        keyframes.textContent = `
            @keyframes ${animId} {
                from { background-position: 0 0; }
                to { background-position: -${spriteWidth}px 0; }
            }
        `;
        document.head.appendChild(keyframes);
    }

    currentAnimation = type;
    console.log('Switched to animation:', type);
}

// Trigger animation manually
function triggerAnimation(type) {
    if (!petContainer) return;
    switchAnimation(type);
}

// Update pet size
function updatePetSize() {
    if (!petContainer) return;
    petContainer.style.transform = `scale(${settings.size / 100})`;
}

// Auto animation system
function startAutoAnimation() {
    if (autoAnimationInterval) return;

    autoAnimationInterval = setInterval(() => {
        if (!isDragging && petContainer) {
            const animations = ['idle', 'walk', 'curious'];
            const randomAnim = animations[Math.floor(Math.random() * animations.length)];

            if (animationsConfig[randomAnim]) {
                switchAnimation(randomAnim);
            }
        }
    }, settings.interval);
}

function restartAutoAnimation() {
    if (autoAnimationInterval) {
        clearInterval(autoAnimationInterval);
        autoAnimationInterval = null;
    }
    startAutoAnimation();
}

// Visual effects
function showHearts() {
    if (!petContainer) return;

    const hearts = ['❤️', '💕', '💖', '💗', '💝'];
    const rect = petContainer.getBoundingClientRect();

    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'heart-effect';
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            heart.style.left = (rect.left + 20 + Math.random() * 30) + 'px';
            heart.style.top = (rect.top + 10) + 'px';
            document.body.appendChild(heart);

            setTimeout(() => heart.remove(), 1000);
        }, i * 200);
    }
}

function showSleepZ() {
    if (!petContainer) return;

    const rect = petContainer.getBoundingClientRect();
    const z = document.createElement('div');
    z.className = 'sleep-z';
    z.textContent = 'Z';
    z.style.left = (rect.left + 50) + 'px';
    z.style.top = (rect.top - 10) + 'px';
    document.body.appendChild(z);

    setTimeout(() => z.remove(), 2000);
}

// Context menu
function showContextMenu(x, y) {
    // Remove existing menu
    const existingMenu = document.querySelector('.pet-context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'pet-context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    // Build menu items
    const menuItems = [
        { label: '😊 Happy', action: 'happy' },
        { label: '🏃 Walk', action: 'walk' },
        { label: '🦘 Jump', action: 'jump' },
        { label: '🍔 Eat', action: 'eat' },
        { label: '😴 Sleep', action: 'sleep' }
    ];

    let menuHTML = '';
    menuItems.forEach(item => {
        if (animationsConfig[item.action]) {
            menuHTML += `<div class="pet-context-menu-item" data-action="${item.action}">${item.label}</div>`;
        }
    });
    menuHTML += '<div class="pet-context-menu-separator"></div>';
    menuHTML += '<div class="pet-context-menu-item" data-action="reset">🔄 Reset Position</div>';

    menu.innerHTML = menuHTML;
    document.body.appendChild(menu);
    menu.style.display = 'block';

    // Handle menu clicks
    menu.querySelectorAll('.pet-context-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.dataset.action;
            if (action === 'reset') {
                resetPosition();
            } else {
                triggerAnimation(action);
            }
            menu.remove();
        });
    });

    // Close menu on outside click
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

// Idle detection system
function resetIdleTimer() {
    lastInteractionTime = Date.now();

    clearAllTimers();

    // Return to idle after 5 seconds
    idleTimer = setTimeout(() => {
        if (!isDragging && animationsConfig.idle) {
            switchAnimation('idle');
        }
    }, 5000);

    // Sleep after 60 seconds
    sleepTimer = setTimeout(() => {
        if (!isDragging && animationsConfig.sleep) {
            switchAnimation('sleep');

            // Show Z's periodically while sleeping
            const sleepInterval = setInterval(() => {
                if (Date.now() - lastInteractionTime >= 60000) {
                    showSleepZ();
                } else {
                    clearInterval(sleepInterval);
                }
            }, 3000);
        }
    }, 60000);
}

function clearAllTimers() {
    if (idleTimer) clearTimeout(idleTimer);
    if (sleepTimer) clearTimeout(sleepTimer);
    if (pressTimer) clearTimeout(pressTimer);
    if (clickTimer) clearTimeout(clickTimer);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    savePosition();
    clearAllTimers();
});

console.log('Desktop Pet content script loaded');
