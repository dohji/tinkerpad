import './tailwind.css';
import * as monaco from 'monaco-editor';

let editor;
let currentPlayground = null;
let loadedPlaygrounds = [];
let libraries = []; // array of CDN URLs for current playground
let isPlaygroundDropdownOpen = false;

document.addEventListener('DOMContentLoaded', async () => {
    // create editor
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: `// Welcome to TinkerPad\nconsole.log('Hello TinkerPad')`,
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

    // toggle autocomplete
    const autorun = document.getElementById('autorun');
    autorun.addEventListener('change', (e) => {
        // run on change if enabled
    });
    function setAutocomplete(enabled) {
        editor.updateOptions({
            quickSuggestions: enabled,
            suggestOnTriggerCharacters: enabled
        });
    }
// default true
    setAutocomplete(true);

});

async function refreshPlaygrounds() {
    loadedPlaygrounds = await window.tinkerpad.getPlaygrounds();
    const ul = document.getElementById('playgroundList');
    ul.innerHTML = '';
    for (const p of loadedPlaygrounds) {
        const li = document.createElement('li');
        li.textContent = p.title || '(untitled)';
        li.className = 'p-2 rounded-md mb-1.5 cursor-pointer bg-transparent text-slate-300 hover:bg-white/5 hover:text-white transition-colors';
        li.onclick = () => loadPlayground(p);
        ul.appendChild(li);
    }
    
    // Update dropdown
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
            li.textContent = p.title || '(untitled)';
            li.className = 'px-2 py-1 rounded cursor-pointer text-slate-300 hover:bg-white/5 hover:text-white transition-colors';
            li.onclick = () => {
                loadPlayground(p);
                hidePlaygroundDropdown();
            };
            dropdownList.appendChild(li);
        });
    }
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
        code: `// New Playground\nconsole.log('hello')`,
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
        nameElement.textContent = 'New Playground';
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
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}


function buildSandboxHtml(code, libs = []) {
    // script that intercepts console.* and forwards to parent
    const consoleShim = `
    (function(){
      function send(level,args){
        try{ parent.postMessage({ kind: 'tinkerpad:console', level: level, args: args }, '*');}catch(e){}
      }
      ['log','info','warn','error','debug'].forEach(fn=>{
        console[fn] = function(){
          send(fn, Array.from(arguments).map(a => {
            try { return (typeof a === 'object') ? JSON.stringify(a) : String(a); }
            catch(e){ return String(a); }
          }));
        };
      });
      window.onerror = function(msg, src, ln, col, err){ send('error', [msg + ' (line:' + ln + ')']); };
    })();
  `;

    // Generate library script tags (static approach)
    const libraryScripts = libs.map(lib => `<script src="${lib}"></script>`).join('\n    ');

    // User code execution script
    const userCodeScript = `
    <script>
      ${consoleShim}
      
      // Wait for all libraries to load, then execute user code
      window.addEventListener('load', function() {
        // Small delay to ensure all libraries are fully initialized
        setTimeout(function() {
          try {
            ${code}
          } catch(e) { 
            console.error(e && e.stack ? e.stack : e); 
          }
        }, 100);
      });
    </script>`;

    return `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline';">
</head>
<body>
    ${libraryScripts}
    ${userCodeScript}
</body>
</html>`;
}

// Modified runCode with data URL approach
// function runCode() {
//     const code = editor.getValue();
//     const iframe = document.getElementById('sandbox');
//     const srcdoc = buildSandboxHtml(code, libraries);
//     console.log(srcdoc);
//     // use srcdoc to fully reinitialize iframe on each run
//     iframe.srcdoc = srcdoc;
//     // unhide console area in case hidden
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
    const out = document.getElementById('consoleOutput');
    const row = document.createElement('div');
    row.className = 'console-line ' + level;
    row.textContent = args.join(' ');
    out.appendChild(row);
    out.scrollTop = out.scrollHeight;
}

