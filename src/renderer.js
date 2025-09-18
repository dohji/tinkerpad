import './index.css';
import * as monaco from 'monaco-editor';

let editor;
let currentPlayground = null;
let loadedPlaygrounds = [];
let libraries = []; // array of CDN URLs for current playground

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
    document.getElementById('saveBtn').addEventListener('click', saveCurrentPlayground);
    document.getElementById('newBtn').addEventListener('click', newPlayground);
    document.getElementById('clearConsoleBtn').addEventListener('click', () => {
        document.getElementById('consoleOutput').innerHTML = '';
    });
    document.getElementById('addLibBtn').addEventListener('click', addLibraryPrompt);

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
        li.onclick = () => loadPlayground(p);
        ul.appendChild(li);
    }
}

function newPlayground() {
    currentPlayground = {
        title: 'Untitled',
        code: `// New Playground\nconsole.log('hello')`,
        libraries: []
    };
    editor.setValue(currentPlayground.code);
    libraries = currentPlayground.libraries || [];
    // select UI state update if needed
}

function loadPlayground(p) {
    currentPlayground = p;
    editor.setValue(p.code || '');
    libraries = p.libraries || [];
}

async function saveCurrentPlayground() {
    if (!currentPlayground) return;
    currentPlayground.title = prompt('Playground title', currentPlayground.title || 'Untitled') || currentPlayground.title;
    currentPlayground.code = editor.getValue();
    currentPlayground.libraries = libraries;
    const saved = await window.tinkerpad.savePlayground(currentPlayground);
    currentPlayground = saved;
    await refreshPlaygrounds();
    alert('Saved');
}

function addLibraryPrompt() {
    const url = prompt('Enter CDN URL for a library (e.g. https://cdn.jsdelivr.net/npm/lodash/lodash.min.js)');
    if (!url) return;
    libraries.push(url);
    alert('Library added: ' + url);
}

function buildSandboxHtml(code, libs = []) {
    // libs must appear BEFORE user script so they are available in global scope
    const libsHtml = libs.map(u => `<script src="${u}"></script>`).join('\n');
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

    return `<!doctype html><html><head><meta charset="utf-8"></head><body>
    ${libsHtml}
    <script>${consoleShim}</script>
    <script>
      try {
        ${code}
      } catch(e) { console.error(e && e.stack ? e.stack : e); }
    </script>
  </body></html>`;
}

function runCode() {
    const code = editor.getValue();
    const iframe = document.getElementById('sandbox');
    const srcdoc = buildSandboxHtml(code, libraries);
    // use srcdoc to fully reinitialize iframe on each run
    iframe.srcdoc = srcdoc;
    // unhide console area in case hidden
}

function appendConsoleLine(level, args) {
    const out = document.getElementById('consoleOutput');
    const row = document.createElement('div');
    row.className = 'console-line ' + level;
    row.textContent = args.join(' ');
    out.appendChild(row);
    out.scrollTop = out.scrollHeight;
}

