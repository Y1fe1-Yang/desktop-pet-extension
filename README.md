# Desktop Pet Browser Extension v2.0

An adorable desktop pet that lives in your browser! This extension adds an interactive, animated pet to any webpage you visit. Click, drag, pet, and watch your companion come to life with various animations and behaviors.

## Features

### Interactive Behaviors
- **Click**: Make your pet jump
- **Double-click**: See a happy animation
- **Long-press (1s)**: Pet your companion and see hearts
- **Drag**: Move your pet anywhere on the page (switches to walk animation)
- **Hover**: Your pet gets curious when you hover over it
- **Right-click**: Access context menu with animation options

### Customization Options
- **Size Control**: Adjust pet size from 50% to 200%
- **Animation Speed**: Control how fast animations play (1-10)
- **Auto-Animation**: Set interval for random animations (3-30 seconds)
- **Sound Effects**: Toggle sound on/off
- **Position Memory**: Pet remembers where you left it

### Smart Behaviors
- **Idle Detection**: Returns to idle animation after 5 seconds of no interaction
- **Sleep Mode**: Falls asleep after 60 seconds (with floating Z's!)
- **Smooth Animations**: Pixel-perfect sprite-based animations
- **Collision-Aware**: Stays within browser viewport bounds

## Installation Instructions

### Method 1: Load Unpacked Extension (For Development)

1. **Download or clone this extension folder**
   ```
   /tmp/desktop-pet-v2/browser-extension/
   ```

2. **Add sprite files**
   - Create a `sprites/` folder in the extension directory
   - Add your sprite PNG files:
     - `idle.png` - Default resting animation
     - `walk.png` - Walking animation
     - `jump.png` - Jumping animation
     - `sleep.png` - Sleeping animation
     - `happy.png` - Happy/excited animation
     - `pet.png` - Being petted animation
     - `eat.png` - Eating animation
     - `curious.png` - Curious/alert animation

3. **Add icon files**
   - Create an `icons/` folder
   - Add these icon sizes:
     - `icon16.png` (16x16)
     - `icon48.png` (48x48)
     - `icon128.png` (128x128)

4. **Open Chrome/Edge**
   - Navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (toggle in top-right corner)

5. **Load the extension**
   - Click "Load unpacked"
   - Select the `browser-extension` folder
   - The extension should now appear in your extensions list

6. **Pin the extension**
   - Click the puzzle piece icon in your browser toolbar
   - Find "Desktop Pet Browser Extension"
   - Click the pin icon to keep it visible

### Method 2: Create and Install .CRX Package

1. **Prepare the extension** (complete steps 2-3 from Method 1)

2. **Pack the extension**
   - Go to `chrome://extensions/`
   - Click "Pack extension"
   - Select the extension folder
   - Click "Pack Extension"
   - This creates a `.crx` file

3. **Install the packed extension**
   - Drag the `.crx` file to the extensions page
   - Click "Add extension" when prompted

## Usage Guide

### Getting Started

1. **Enable your pet**
   - Click the extension icon in your toolbar
   - Click the green "Enable Pet" button
   - Your pet will appear in the bottom-left of the page

2. **Interact with your pet**
   - **Single click**: Jump
   - **Double click**: Happy dance
   - **Hold for 1 second**: Pet (shows hearts)
   - **Drag**: Move around the page
   - **Right-click**: Open animation menu

3. **Customize settings**
   - Open the extension popup
   - Use sliders to adjust size, speed, and interval
   - Try size presets: Small (75%), Medium (100%), Large (150%)
   - Toggle sound effects on/off

### Animation Controls

From the popup, you can manually trigger animations:
- 😌 **Idle**: Default resting state
- 🚶 **Walk**: Walking animation
- 🦘 **Jump**: Bouncing jump
- 😊 **Happy**: Excited celebration
- 😴 **Sleep**: Sleeping peacefully
- 🍔 **Eat**: Eating food

### Tips & Tricks

- **Reset Position**: If your pet gets stuck off-screen, use "Reset Position" button
- **Multiple Tabs**: Each tab has its own pet instance
- **Auto Animations**: Your pet randomly changes animations based on your interval setting
- **Idle Behavior**: Pet automatically sleeps after 60 seconds of no interaction
- **Viewport Bounds**: Pet cannot be dragged outside the visible area

## Sprite Requirements

### Sprite Sheet Format

Each sprite should be a horizontal strip of frames:
```
[Frame1][Frame2][Frame3][Frame4]...
```

### Recommended Specifications

- **Frame size**: 64x64 pixels per frame
- **Format**: PNG with transparency
- **Image rendering**: Pixel art style works best
- **Frame count**: 3-6 frames per animation
- **File naming**: Match the animation names in `animationsConfig`

### Example Sprite Configuration

Edit `content.js` to customize sprite paths and frame counts:

```javascript
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
```

## Browser Compatibility

### Supported Browsers
- ✅ Google Chrome (v88+)
- ✅ Microsoft Edge (v88+)
- ✅ Brave Browser
- ✅ Opera
- ✅ Any Chromium-based browser with Manifest V3 support

### Not Supported
- ❌ Firefox (uses different extension format)
- ❌ Safari (requires different approach)

## Troubleshooting

### Pet Not Appearing

1. **Check if extension is enabled**
   - Open popup and verify status shows "Active ✅"

2. **Refresh the page**
   - The content script injects on page load
   - Press `F5` or `Ctrl+R` to reload

3. **Check browser console**
   - Press `F12` to open DevTools
   - Look for errors in Console tab
   - Should see "Desktop Pet activated on page!"

### Pet Won't Move or Interact

1. **Clear hasMoved flag**
   - The drag detection prevents click events
   - Try clicking without moving the mouse

2. **Check z-index conflicts**
   - Some sites have high z-index elements
   - Pet uses z-index: 999999

3. **Verify sprite files exist**
   - Check that all sprite files are in `sprites/` folder
   - Paths must match in `animationsConfig`

### Popup Not Working

1. **Check manifest.json**
   - Ensure `popup.html` path is correct
   - Verify `action` field is properly configured

2. **Reload extension**
   - Go to `chrome://extensions/`
   - Click the refresh icon on your extension

### Animations Not Playing

1. **Verify sprite configuration**
   - Check `animationsConfig` in `content.js`
   - Ensure sprite paths are correct
   - Verify frame counts match your sprite sheets

2. **Check file permissions**
   - Sprites must be in `web_accessible_resources`
   - Already configured in `manifest.json`

## Performance Notes

- **Memory Usage**: ~10-20MB per tab with pet enabled
- **CPU Impact**: Minimal (CSS animations are GPU-accelerated)
- **Storage**: Settings stored locally, <1KB
- **Best Practices**:
  - Use optimized PNG sprites (compress with tools like TinyPNG)
  - Keep sprite sheets under 500KB each
  - Limit animation intervals to 5+ seconds for lower CPU usage

## Privacy & Permissions

### Required Permissions

- **storage**: Save your settings and pet position
- **activeTab**: Inject pet into current webpage
- **scripting**: Execute content script for pet functionality
- **host_permissions**: Access all URLs to display pet

### Data Collection

This extension does NOT:
- ❌ Collect personal information
- ❌ Track browsing history
- ❌ Send data to external servers
- ❌ Include analytics or telemetry

All settings are stored locally on your device.

## Customization Guide

### Change Pet Appearance

1. Replace sprite files in `sprites/` folder
2. Keep the same file names or update `animationsConfig`
3. Reload extension

### Add New Animations

1. Create new sprite sheet
2. Add to `sprites/` folder
3. Add configuration to `animationsConfig` in `content.js`:

```javascript
myNewAnimation: {
    sprite: 'sprites/mynew.png',
    frames: 5,
    duration: 0.7
}
```

4. Add button in `popup.html`:
```html
<button id="myNewAnim" data-anim="myNewAnimation">🎨 My Animation</button>
```

### Modify Interaction Timers

In `content.js`, adjust these values:

```javascript
// Long press duration (default: 1000ms)
pressTimer = setTimeout(() => { ... }, 1000);

// Idle timeout (default: 5000ms)
idleTimer = setTimeout(() => { ... }, 5000);

// Sleep timeout (default: 60000ms)
sleepTimer = setTimeout(() => { ... }, 60000);
```

## Development

### File Structure
```
browser-extension/
├── manifest.json         # Extension configuration (Manifest V3)
├── background.js         # Service worker for lifecycle management
├── content.js           # Main pet logic (injected into pages)
├── popup.html           # Control panel UI
├── popup.js             # Popup logic and settings
├── README.md            # This file
├── icons/               # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── sprites/             # Animation sprite sheets
    ├── idle.png
    ├── walk.png
    ├── jump.png
    ├── sleep.png
    ├── happy.png
    ├── pet.png
    ├── eat.png
    └── curious.png
```

### Key Improvements in v2.0

1. **Fixed Click/Drag Conflict**
   - Added `hasMoved` flag to track actual dragging
   - Click events only fire if no movement detected
   - Prevents accidental clicks when dragging

2. **Better Long-Press Detection**
   - Fixed timer management to prevent conflicts
   - Won't trigger if dragging
   - Clears timer on mouse leave

3. **Improved Animation Switching**
   - Dynamic sprite loading per animation
   - Proper cleanup between animations
   - Smooth transitions

4. **Enhanced Error Handling**
   - Try-catch blocks throughout
   - Graceful fallbacks for missing sprites
   - Better console logging

5. **Settings Persistence**
   - Position saved automatically
   - Settings sync across page reloads
   - Storage change listeners for multi-tab sync

## Credits

**Version**: 2.0.0
**License**: MIT
**Created by**: Desktop Pet Generator

Made with ❤️ for pet lovers everywhere!

## Support

For issues, questions, or feature requests:
- Check the troubleshooting section above
- Review browser console for errors
- Ensure all sprite files are present
- Verify extension permissions are granted

Enjoy your new desktop pet companion! 🐾
