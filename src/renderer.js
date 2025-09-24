import './tailwind.css';
import * as monaco from 'monaco-editor';

let editor;
let currentPlayground = null;
let loadedPlaygrounds = [];
let libraries = []; // array of CDN URLs for current playground
let isPlaygroundDropdownOpen = false;

document.addEventListener('DOMContentLoaded', async () => {

    setupPlatformHeader()

    setTimeout(() => {
        document.getElementById('splash').style.display = 'none';
    }, 300);

    // ==========================================================================================
    // Resizable panels functionality ===========================================================
    let isResizing = false;
    let currentResizeHandle = null;

    // Console resizing  
    document.getElementById('consoleHandle').addEventListener('mousedown', (e) => {
        isResizing = true;
        currentResizeHandle = 'console';
        document.body.style.cursor = 'col-resize';
        document.getElementById('consoleHandle').classList.add('dragging');
        e.preventDefault();
    });
 
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        if (currentResizeHandle === 'sidebar') {
            const sidebar = document.getElementById('sidebar');
            const newWidth = Math.max(200, Math.min(500, e.clientX - 12)); // 12px padding
            sidebar.style.width = newWidth + 'px';
        } else if (currentResizeHandle === 'console') {
            const console = document.getElementById('console');
            const container = document.getElementById('split');
            const containerRect = container.getBoundingClientRect();
            const newWidth = Math.max(250, Math.min(600, containerRect.right - e.clientX - 12));
            console.style.width = newWidth + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            currentResizeHandle = null;
            document.body.style.cursor = '';
            // document.getElementById('sidebarHandle').classList.remove('dragging');
            document.getElementById('consoleHandle').classList.remove('dragging');
        }
    });

    // Collapse/expand functionality
    const sidebar = document.getElementById('sidebar');
    const console = document.getElementById('console');
    // const sidebarHandle = document.getElementById('sidebarHandle');
    const consoleHandle = document.getElementById('consoleHandle');
    const collapseSidebarBtn = document.getElementById('collapseSidebar');
    const collapseConsoleBtn = document.getElementById('collapseConsole');
    const expandSidebarBtn = document.getElementById('expandSidebar');
    const expandConsoleBtn = document.getElementById('expandConsole');

    let sidebarWidth = '280px';
    let consoleWidth = '400px';

    // Sidebar collapse/expand
    collapseSidebarBtn.addEventListener('click', () => {
        sidebarWidth = sidebar.style.width || '280px';
        sidebar.classList.add('collapsed');
        // sidebarHandle.style.display = 'none';
        expandSidebarBtn.classList.remove('hidden');
        collapseSidebarBtn.classList.add('rotated');
    });

    expandSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('collapsed');
        sidebar.style.width = sidebarWidth;
        // sidebarHandle.style.display = 'block';
        expandSidebarBtn.classList.add('hidden');
        collapseSidebarBtn.classList.remove('rotated');
    });

    // Console collapse/expand
    collapseConsoleBtn.addEventListener('click', () => {
        consoleWidth = console.style.width || '400px';
        console.classList.add('collapsed');
        consoleHandle.style.display = 'none';
        expandConsoleBtn.classList.remove('hidden');
        collapseConsoleBtn.classList.add('rotated');
    });

    expandConsoleBtn.addEventListener('click', () => {
        console.classList.remove('collapsed');
        console.style.width = consoleWidth;
        consoleHandle.style.display = 'block';
        expandConsoleBtn.classList.add('hidden');
        collapseConsoleBtn.classList.remove('rotated');
    });

    // Prevent text selection during resize
    document.addEventListener('selectstart', (e) => {
        if (isResizing) e.preventDefault();
    });
    // End resizing panels =============================================================
    // =================================================================================

    // create editor
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: `// Welcome to TinkerPad\nconsole.log('Hello TinkerPad 👋🏽')`,
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
    });

    // load saved playgrounds
    await refreshPlaygrounds();

    // wire UI
    document.getElementById('runBtn').addEventListener('click', runCode);
    document.getElementById('saveBtn').addEventListener('click', handleSave);
    document.getElementById('newBtn').addEventListener('click', newPlayground);
    document.getElementById('clearConsoleBtn').addEventListener('click', () => {
        document.getElementById('consoleOutput').innerHTML = '';
    });
    
    // Playground dropdown
    document.getElementById('playgroundDropdown').addEventListener('click', togglePlaygroundDropdown);
    
    // Library management
    document.getElementById('addLibraryBtn').addEventListener('click', addLibraryFromInput);
    document.getElementById('libraryUrlInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addLibraryFromInput();
    });
    
    // Modal event listeners
    document.getElementById('confirmSave').addEventListener('click', saveCurrentPlayground);
    document.getElementById('cancelSave').addEventListener('click', hideSaveModal);
    
    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideSaveModal();
            hidePlaygroundDropdown();
        }
    });
    
    // Close modals when clicking outside
    document.getElementById('saveModal').addEventListener('click', (e) => {
        if (e.target.id === 'saveModal') hideSaveModal();
    });
    
    // Close playground dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#playgroundDropdown') && !e.target.closest('#playgroundDropdownMenu')) {
            hidePlaygroundDropdown();
        }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        // Ctrl+Enter or Cmd+Enter -> run
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
        
        // Ctrl+S or Cmd+S -> save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
        }
    });

    // messages from iframe
    window.addEventListener('message', ev => {
        // only accept messages from our sandbox iframe
        const data = ev.data || {};
        if (data && data.kind === 'tinkerpad:console') {
            appendConsoleLine(data.level, data.args);
        }
    });

    // initial new playground
    newPlayground();

    function setAutocomplete(enabled) {
        editor.updateOptions({
            quickSuggestions: enabled,
            suggestOnTriggerCharacters: enabled
        });
    }
    // default true
    setAutocomplete(true);

    // Menu event handlers
    window.tinkerpad.onNewPlayground(() => {
        newPlayground();
    });
    window.tinkerpad.onSavePlayground(() => {
        handleSave();
    });
    window.tinkerpad.onRunCode(() => {
        runCode();
    });
    window.tinkerpad.onClearConsole(() => {
        document.getElementById('consoleOutput').innerHTML = '';
    });

});

// Platform detection and header adaptation
function setupPlatformHeader() {
    const trafficLightsSpace = document.getElementById('trafficLightsSpace');
    const brandIcon = document.getElementById('brandIcon');
    const brandTitle = document.getElementById('brandTitle');
    const headerRight = document.getElementById('headerRight');
    const windowControls = document.getElementById('windowControls');
    const minimizeBtn = document.getElementById('minimizeBtn');
    const maximizeBtn = document.getElementById('maximizeBtn');
    const closeBtn = document.getElementById('closeBtn');

    // Detect platform via user agent or electron API
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
        (window.process && window.process.platform === 'darwin');
    const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0 ||
        (window.process && window.process.platform === 'win32');
    const isLinux = navigator.platform.toUpperCase().indexOf('LINUX') >= 0 ||
        (window.process && window.process.platform === 'linux');

    if (isMac) {
        // macOS: Show traffic lights space, no custom controls
        trafficLightsSpace.classList.remove('hidden');
        brandTitle.classList.remove('pl-4');
    } else if (isWindows || isLinux) {
        // Windows/Linux: Show custom window controls, no traffic lights space
        windowControls.classList.remove('hidden');
        windowControls.classList.add('flex');
        brandTitle.classList.add('pl-0');
        headerRight.classList.add('pr-2'); // Reduce right padding
        brandIcon.classList.add('inline-block');

        // Add window control functionality
        if (window.tinkerpad) {
            minimizeBtn.addEventListener('click', () => window.tinkerpad.minimize());
            maximizeBtn.addEventListener('click', () => window.tinkerpad.maximize());
            closeBtn.addEventListener('click', () => window.tinkerpad.close());
        }
    }
}

async function refreshPlaygrounds() {
    loadedPlaygrounds = await window.tinkerpad.getPlaygrounds();
    updatePlaygroundDropdown();
}

function updatePlaygroundDropdown() {
    const dropdownList = document.getElementById('playgroundDropdownList');
    const noPlaygroundsMessage = document.getElementById('noPlaygroundsMessage');
    
    dropdownList.innerHTML = '';
    
    if (loadedPlaygrounds.length === 0) {
        noPlaygroundsMessage.classList.remove('hidden');
    } else {
        noPlaygroundsMessage.classList.add('hidden');
        loadedPlaygrounds.forEach(p => {
            const li = document.createElement('li');
            li.className = 'flex items-center justify-between px-2 py-1 rounded text-slate-300 hover:bg-white/5 hover:text-white transition-colors';

            const nameBtn = document.createElement('button');
            nameBtn.textContent = p.title || '(untitled)';
            nameBtn.className = 'flex-1 text-left truncate text-sm';
            nameBtn.onclick = () => {
                loadPlayground(p);
                hidePlaygroundDropdown();
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '×';
            deleteBtn.className = 'ml-2 text-red-400 hover:text-red-300 font-bold text-sm leading-none';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                showDeleteModal(p);
            };

            li.appendChild(nameBtn);
            li.appendChild(deleteBtn);
            dropdownList.appendChild(li);
        });
    }
}

function showDeleteModal(playground) {
    const modal = document.getElementById('deleteModal');
    const nameEl = document.getElementById('deletePlaygroundName');
    nameEl.textContent = playground.title || '(untitled)';
    
    modal.classList.remove('hidden');

    document.getElementById('confirmDelete').onclick = async () => {
        await window.tinkerpad.deletePlayground(playground.id);
        hideDeleteModal();
        await refreshPlaygrounds();
        showNotification('Playground deleted');
    };

    document.getElementById('cancelDelete').onclick = hideDeleteModal;
}

function hideDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
}

function togglePlaygroundDropdown() {
    if (isPlaygroundDropdownOpen) {
        hidePlaygroundDropdown();
    } else {
        showPlaygroundDropdown();
    }
}

function showPlaygroundDropdown() {
    const dropdown = document.getElementById('playgroundDropdownMenu');
    dropdown.classList.remove('hidden');
    isPlaygroundDropdownOpen = true;
}

function hidePlaygroundDropdown() {
    const dropdown = document.getElementById('playgroundDropdownMenu');
    dropdown.classList.add('hidden');
    isPlaygroundDropdownOpen = false;
}

function newPlayground() {
    currentPlayground = {
        title: 'Untitled',
        code: `// New Playground\nconsole.log('Hello TinkerPad 👋🏽')`,
        libraries: []
    };
    editor.setValue(currentPlayground.code);
    libraries = currentPlayground.libraries || [];
    updateCurrentPlaygroundName();
    refreshLibrariesList();
}

function loadPlayground(p) {
    currentPlayground = p;
    editor.setValue(p.code || '');
    libraries = p.libraries || [];
    updateCurrentPlaygroundName();
    refreshLibrariesList();
}

function updateCurrentPlaygroundName() {
    const nameElement = document.getElementById('currentPlaygroundName');
    if (currentPlayground && currentPlayground.id) {
        nameElement.textContent = currentPlayground.title || 'Untitled';
    } else {
        nameElement.textContent = 'Unsaved';
    }
}

// Smart save handler - checks if playground already exists
function handleSave() {
    if (!currentPlayground) return;
    
    // If playground already has an ID (is saved), save directly without modal
    if (currentPlayground.id) {
        saveCurrentPlaygroundDirect();
    } else {
        // New playground, show modal to get title
        showSaveModal();
    }
}

function showSaveModal() {
    if (!currentPlayground) return;
    const modal = document.getElementById('saveModal');
    const titleInput = document.getElementById('playgroundTitle');
    titleInput.value = currentPlayground.title || 'Untitled';
    modal.classList.remove('hidden');
    titleInput.focus();
    titleInput.select();
}

// Save existing playground without showing modal
async function saveCurrentPlaygroundDirect() {
    if (!currentPlayground) return;
    
    // Update the code and libraries but keep existing title and ID
    currentPlayground.code = editor.getValue();
    currentPlayground.libraries = libraries;
    
    const saved = await window.tinkerpad.savePlayground(currentPlayground);
    currentPlayground = saved;
    await refreshPlaygrounds();
    updateCurrentPlaygroundName();
    showNotification('Playground saved!');
}

// Save with modal (for new playgrounds or when explicitly naming)
async function saveCurrentPlayground() {
    if (!currentPlayground) return;
    currentPlayground.title = document.getElementById('playgroundTitle').value || 'Untitled';
    currentPlayground.code = editor.getValue();
    currentPlayground.libraries = libraries;
    const saved = await window.tinkerpad.savePlayground(currentPlayground);
    currentPlayground = saved;
    await refreshPlaygrounds();
    updateCurrentPlaygroundName();
    hideSaveModal();
    showNotification('Playground saved successfully!');
}

function hideSaveModal() {
    document.getElementById('saveModal').classList.add('hidden');
}

// function addLibraryFromInput() {
//     const urlInput = document.getElementById('libraryUrlInput');
//     const url = urlInput.value.trim();
//     if (!url) return;
    
//     // Check if library already exists
//     if (libraries.includes(url)) {
//         showNotification('Library already added');
//         return;
//     }
    
//     libraries.push(url);
//     urlInput.value = '';
//     refreshLibrariesList();
//     showNotification('Library added: ' + url);
// }
function addLibraryFromInput() {
    const urlInput = document.getElementById('libraryUrlInput');
    const url = urlInput.value.trim();
    if (!url) return;
    
    // Validate CDN URL
    if (!isValidCdnUrl(url)) {
        showNotification('Please enter a valid CDN URL (https://)', 'error');
        return;
    }
    
    // Check if library already exists
    if (libraries.includes(url)) {
        showNotification('Library already added', 'warning');
        return;
    }
    
    libraries.push(url);
    urlInput.value = '';
    refreshLibrariesList();
    showNotification('Library added: ' + getLibraryName(url), 'success');
}

function isValidCdnUrl(url) {
    try {
        const urlObj = new URL(url);
        
        // Must be HTTPS
        if (urlObj.protocol !== 'https:') {
            return false;
        }
        
        // Must be a JavaScript file
        const validExtensions = ['.js', '.min.js', '.mjs'];
        const pathname = urlObj.pathname.toLowerCase();
        if (!validExtensions.some(ext => pathname.endsWith(ext))) {
            return false;
        }
        
        // Known CDN domains (add more as needed)
        const allowedCdnDomains = [
            'cdnjs.cloudflare.com',
            'unpkg.com',
            'cdn.jsdelivr.net',
            'esm.sh',
            'cdn.skypack.dev',
            'ga.jspm.io',
            'esm.run'
        ];
        
        return allowedCdnDomains.includes(urlObj.hostname);
        
    } catch (error) {
        // Invalid URL format
        return false;
    }
}

function getLibraryName(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const filename = pathname.split('/').pop();
        return filename || url;
    } catch {
        return url;
    }
}

// Updated showNotification to support different types
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    let bgColor = 'bg-slate-600'; // default
    switch(type) {
        case 'success':
            bgColor = 'bg-green-600';
            break;
        case 'error':
            bgColor = 'bg-red-600';
            break;
        case 'warning':
            bgColor = 'bg-yellow-600';
            break;
    }
    
    notification.className = `fixed bottom-6 ${bgColor} text-white px-4 py-2 rounded-md shadow-lg z-50 transition-all duration-300 ease-in-out max-w-sm`;
    notification.textContent = message;
    
    // Use CSS to properly center horizontally
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%) translateY(20px)';
    notification.style.opacity = '0';
    
    document.body.appendChild(notification);
    
    // Trigger animation
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    // Remove after 3 seconds with fade out animation
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(20px)';
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function removeLibrary(url) {
    const index = libraries.indexOf(url);
    if (index > -1) {
        libraries.splice(index, 1);
        refreshLibrariesList();
        showNotification('Library removed');
    }
}

function refreshLibrariesList() {
    const librariesList = document.getElementById('librariesList');
    librariesList.innerHTML = '';
    
    libraries.forEach(url => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between p-2 bg-slate-700 rounded text-sm';
        
        const urlSpan = document.createElement('span');
        urlSpan.textContent = url;
        urlSpan.className = 'text-slate-300 truncate flex-1 mr-2';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.className = 'text-red-400 hover:text-red-300 font-bold text-lg leading-none';
        deleteBtn.onclick = () => removeLibrary(url);
        
        li.appendChild(urlSpan);
        li.appendChild(deleteBtn);
        librariesList.appendChild(li);
    });
}

// function showNotification(message) {
//     // Create a simple notification
//     const notification = document.createElement('div');
//     notification.className = 'fixed top-4 right-4 bg-slate-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
//     notification.textContent = message;
//     document.body.appendChild(notification);
    
//     // Remove after 3 seconds
//     setTimeout(() => {
//         notification.remove();
//     }, 3000);
// }

function runCode() {
    const code = editor.getValue();
    const iframe = document.getElementById('sandbox');
    iframe.contentWindow.postMessage({
        kind: 'tinkerpad:run',
        code,
        libraries
    }, '*');
}

function appendConsoleLine(level, args) {
    const consoleOutput = document.getElementById('consoleOutput');
    const line = document.createElement('div');
    line.className = `console-line mb-1 ${level}`;
    
    // Apply different colors for different log levels
    switch(level) {
        case 'error':
            line.className += ' text-red-400';
            break;
        case 'warn':
            line.className += ' text-yellow-400';
            break;
        case 'info':
            line.className += ' text-blue-400';
            break;
        case 'debug':
            line.className += ' text-purple-400';
            break;
        default:
            line.className += ' text-slate-300';
    }
    
    // Add timestamp
    const timestamp = new Date().toLocaleTimeString();
    const timestampSpan = document.createElement('span');
    timestampSpan.className = 'text-slate-500 text-[10px] mr-2';
    timestampSpan.textContent = `[${timestamp}]`;
    
    const contentSpan = document.createElement('span');
    contentSpan.textContent = args.join(' ');
    
    line.appendChild(timestampSpan);
    line.appendChild(contentSpan);
    consoleOutput.appendChild(line);
    
    // Auto-scroll to bottom, but only if user was already at bottom
    const isScrolledToBottom = consoleOutput.scrollHeight - consoleOutput.clientHeight <= consoleOutput.scrollTop + 1;
    if (isScrolledToBottom) {
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
    
    // Limit console lines to prevent memory issues (keep last 1000 lines)
    while (consoleOutput.children.length > 1000) {
        consoleOutput.removeChild(consoleOutput.firstChild);
    }
}