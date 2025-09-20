import './tailwind.css';
import * as monaco from 'monaco-editor';

let editor;
let currentPlayground = null;
let loadedPlaygrounds = [];
let libraries = []; // array of CDN URLs for current playground
let isPlaygroundDropdownOpen = false;


document.addEventListener('DOMContentLoaded', async () => {

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
    document.getElementById('saveBtn').addEventListener('click', showSaveModal);
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

    // keyboard: Ctrl+Enter -> run
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
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

    // ipcRenderer.on('new-playground', newPlayground)
    // ipcRenderer.on('save-playground', saveCurrentPlayground)
    // ipcRenderer.on('run-code', runCode);
    // ipcRenderer.on('clear-console', () => {
    //     document.getElementById('consoleOutput').innerHTML = '';
    // });

    window.tinkerpad.onNewPlayground(() => {
        newPlayground();
      });
    window.tinkerpad.onSavePlayground(() => {
        showSaveModal();
      });
    window.tinkerpad.onRunCode(() => {
        runCode();
      });
    window.tinkerpad.onClearConsole(() => {
    document.getElementById('consoleOutput').innerHTML = '';
    });

});


async function refreshPlaygrounds() {
    loadedPlaygrounds = await window.tinkerpad.getPlaygrounds();
    // const ul = document.getElementById('playgroundList'); 
    // ul.innerHTML = '';
    // for (const p of loadedPlaygrounds) {
    //     const li = document.createElement('li'); 
    //     li.textContent = p.title || '(untitled)'; 
    //     li.className = 'p-2 rounded-md mb-1.5 cursor-pointer bg-transparent text-slate-300 hover:bg-white/5 hover:text-white transition-colors';
    //     li.onclick = () => loadPlayground(p);
    //     ul.appendChild(li);
    // }
     
    // Update dropdown
    updatePlaygroundDropdown();
}

// function updatePlaygroundDropdown() {
//     const dropdownList = document.getElementById('playgroundDropdownList');
//     const noPlaygroundsMessage = document.getElementById('noPlaygroundsMessage');
    
//     dropdownList.innerHTML = '';
    
//     if (loadedPlaygrounds.length === 0) {
//         noPlaygroundsMessage.classList.remove('hidden');
//     } else {
//         noPlaygroundsMessage.classList.add('hidden');
//         loadedPlaygrounds.forEach(p => {
//             const li = document.createElement('li');
//             li.textContent = p.title || '(untitled)';
//             li.className = 'px-2 py-1 rounded cursor-pointer text-slate-300 hover:bg-white/5 hover:text-white transition-colors';
//             li.onclick = () => {
//                 loadPlayground(p);
//                 hidePlaygroundDropdown();
//             };
//             dropdownList.appendChild(li);
//         });
//     }
// }
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

function showSaveModal() {
    if (!currentPlayground) return;
    const modal = document.getElementById('saveModal');
    const titleInput = document.getElementById('playgroundTitle');
    titleInput.value = currentPlayground.title || 'Untitled';
    modal.classList.remove('hidden');
    titleInput.focus();
    titleInput.select();
}

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

function addLibraryFromInput() {
    const urlInput = document.getElementById('libraryUrlInput');
    const url = urlInput.value.trim();
    if (!url) return;
    
    // Check if library already exists
    if (libraries.includes(url)) {
        showNotification('Library already added');
        return;
    }
    
    libraries.push(url);
    urlInput.value = '';
    refreshLibrariesList();
    showNotification('Library added: ' + url);
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

function showNotification(message) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-slate-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}


function runCode() {
    const code = editor.getValue();
    const iframe = document.getElementById('sandbox');
    iframe.contentWindow.postMessage({
      kind: 'tinkerpad:run',
      code,
      libraries
    }, '*');
  }

// function appendConsoleLine(level, args) {
//     const out = document.getElementById('consoleOutput');
//     const row = document.createElement('div');
//     row.className = 'console-line ' + level;
//     row.textContent = args.join(' ');
//     out.appendChild(row);
//     out.scrollTop = out.scrollHeight;
// }

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

