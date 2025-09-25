# TinkerPad

A modern JavaScript playground built with Electron, featuring a Monaco Editor, live console output, and external library support. TinkerPad provides a safe, sandboxed environment for experimenting with JavaScript code.

<img src="assets/icon-png.png" alt="TinkerPad Screenshot" width="100" />

## Features

- **Monaco Editor** - VS Code's editor with syntax highlighting, IntelliSense, and keyboard shortcuts
- **Live Console** - Real-time console output with colored log levels, timestamps, and 1000-line memory limit
- **External Libraries** - Add CDN libraries from trusted sources (cdnjs, unpkg, jsdelivr, esm.sh, etc.)
- **Playground Management** - Save, load, delete, and switch between multiple code snippets
- **Smart Save System** - Auto-save existing playgrounds, modal for naming new ones
- **Playground Dropdown** - Quick access to all saved playgrounds from the top bar
- **Library Management UI** - Visual interface to add/remove external libraries
- **Resizable Panels** - Drag to resize sidebar and console panels
- **Collapsible UI** - Hide/show panels to maximize coding space
- **Frameless Design** - Native macOS traffic lights with custom title bar
- **Keyboard Shortcuts** - Ctrl/Cmd+Enter to run, Ctrl/Cmd+S to save, Ctrl/Cmd+K to clear console
- **Toast Notifications** - User feedback for all actions
- **Sandboxed Execution** - Secure code execution in isolated iframe environment

## Download
- macOS: [Download .dmg](https://github.com/dohji/tinkerpad/releases/download/v1.1.0/TinkerPad-macOS-1.1.0.dmg)
- Windows: [Download .exe](https://github.com/dohji/tinkerpad/releases/download/v1.1.0/TinkerPad-windows-1.1.0.exe)
- Linux: [Download .deb](https://github.com/dohji/tinkerpad/releases/download/v1.1.0/TinkerPad-linux-1.1.0.deb)
- Linux: [Download .rpm](https://github.com/dohji/tinkerpad/releases/download/v1.1.0/TinkerPad-linux-1.1.0.rpm)

## Installation

### Prerequisites

- Node.js (v18 or higher) - Required for Electron 38.1.2
- npm or yarn

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/dohji/tinkerpad.git
cd tinkerpad
npm install
npm start
```

### Building for Production

```bash
# Package the application
npm run package

# Create distributables
npm run make

# Available for Windows, macOS, and Linux
```

## Basic Operations

### Playground Management
- **New Playground**: Click "New" or Ctrl/Cmd+N
- **Save Playground**: Click "Save" or Ctrl/Cmd+S (shows modal for new playgrounds)
- **Load Playground**: Click playground dropdown in top bar
- **Delete Playground**: Click × next to playground name in dropdown

### Code Execution
- **Run Code**: Click "Run" or Ctrl/Cmd+Enter
- **Clear Console**: Click "Clear" in console panel or Ctrl/Cmd+K

### Library Management
- **Add Library**: Enter CDN URL in sidebar and click "Add"
- **Remove Library**: Click × next to library name in sidebar
- **Supported Libraries**: JavaScript files from trusted CDN sources

## Supported Libraries

TinkerPad supports adding external JavaScript libraries from these trusted CDN sources:

- **cdnjs.cloudflare.com** - Cloudflare's CDN
- **unpkg.com** - npm package CDN
- **cdn.jsdelivr.net** - jsDelivr CDN
- **esm.sh** - ES modules CDN
- **cdn.skypack.dev** - Skypack CDN
- **ga.jspm.io** - JSPM CDN
- **esm.run** - ESM.run CDN

**Requirements:**
- Must be HTTPS URLs
- Must be JavaScript files (.js, .min.js, .mjs)
- Must be from trusted CDN domains

## Security

TinkerPad prioritizes security through several measures:

- **Sandboxed Execution**: All user code runs in an isolated iframe with strict CSP headers
- **CDN Validation**: Only allows JavaScript files from trusted CDN domains
- **No Node Integration**: Renderer process is completely isolated from Node.js APIs
- **Secure IPC**: Preload script provides controlled API access between processes

## Data Storage

Playgrounds are stored as JSON files in your system's user data directory:
- **macOS**: `~/Library/Application Support/tinkerpad/playgrounds/`
- **Windows**: `%APPDATA%/tinkerpad/playgrounds/`
- **Linux**: `~/.config/tinkerpad/playgrounds/`

Each playground includes:
- Unique ID and timestamps
- Code content
- External library URLs
- Title and metadata

## Architecture

### Tech Stack
- **Electron** - Cross-platform desktop framework
- **Monaco Editor** - VS Code editor component
- **Tailwind CSS** - Utility-first CSS framework with PostCSS
- **Webpack** - Module bundler with Electron Forge integration
- **Electron Forge** - Build, package, and distribution system

### Dependencies
- **Core**: Electron 38.1.2, Monaco Editor 0.53.0
- **Utilities**: UUID for ID generation, fs-extra for file operations
- **Build**: Webpack, PostCSS, Tailwind CSS, Copy Webpack Plugin

## Troubleshooting

### Common Issues

**Library not loading:**
- Ensure URL is from a trusted CDN domain
- Check that URL points to a JavaScript file
- Verify the URL is accessible via HTTPS

**Code not executing:**
- Check browser console for errors
- Ensure all required libraries are loaded
- Verify syntax is correct

**Playground not saving:**
- Check file permissions in user data directory
- Ensure playground has a valid title
- Try creating a new playground

## Development

### Project Structure
```
tinkerpad/
├── src/
│   ├── main.js          # Main Electron process
│   ├── preload.js       # Secure bridge between main/renderer
│   ├── renderer.js      # Frontend logic
│   ├── index.html       # Main UI template
│   ├── sandbox.html     # Code execution iframe
│   ├── menu.js          # Application menu
│   └── *.css            # Styling files
├── assets/              # App icons and resources
└── webpack.*.js         # Build configurations
```

### Contributing
Contributions are welcome! Please open an issue or submit a pull request for feature requests, bug fixes, or improvements.

## License
This project is licensed under the MIT License.