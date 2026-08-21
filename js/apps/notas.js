OS.registerApp({
  id: 'notas',
  name: 'Notas',
  icon: '📝',
  width: 520,
  height: 380,
  mount(body, win) {
    let currentFilename = '';

    body.innerHTML = `
      <style>
        .notas-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          box-sizing: border-box;
          padding: 8px;
          gap: 8px;
          font-family: inherit;
        }
        .notas-toolbar {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .notas-filename {
          flex: 1;
          padding: 6px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(0, 0, 0, 0.2);
          color: inherit;
          font-size: 13px;
          outline: none;
        }
        .notas-btn {
          padding: 6px 12px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: inherit;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .notas-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .notas-main {
          display: flex;
          flex: 1;
          gap: 8px;
          min-height: 0;
        }
        .notas-sidebar {
          width: 140px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          padding-right: 8px;
          overflow-y: auto;
        }
        .notas-sidebar-title {
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          opacity: 0.6;
          margin-bottom: 4px;
        }
        .notas-file-item {
          padding: 6px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          background: transparent;
          border: none;
          text-align: left;
          color: inherit;
        }
        .notas-file-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .notas-file-item.active {
          background: rgba(255, 255, 255, 0.2);
          font-weight: bold;
        }
        .notas-empty-list {
          font-size: 12px;
          opacity: 0.5;
          font-style: italic;
          padding: 4px;
        }
        .notas-editor {
          flex: 1;
          resize: none;
          padding: 8px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.15);
          color: inherit;
          font-family: monospace, monospace;
          font-size: 13px;
          line-height: 1.5;
          outline: none;
        }
      </style>
      <div class="notas-container">
        <div class="notas-toolbar">
          <input type="text" class="notas-filename" placeholder="nome-do-arquivo.txt" />
          <button class="notas-btn notas-btn-save">Salvar</button>
          <button class="notas-btn notas-btn-open">Abrir</button>
          <button class="notas-btn notas-btn-new">Novo</button>
        </div>
        <div class="notas-main">
          <div class="notas-sidebar">
            <div class="notas-sidebar-title">Documentos</div>
            <div class="notas-file-list"></div>
          </div>
          <textarea class="notas-editor" placeholder="Digite seu texto aqui..."></textarea>
        </div>
      </div>
    `;

    const inputFilename = body.querySelector('.notas-filename');
    const btnSave = body.querySelector('.notas-btn-save');
    const btnOpen = body.querySelector('.notas-btn-open');
    const btnNew = body.querySelector('.notas-btn-new');
    const sidebarList = body.querySelector('.notas-file-list');
    const editor = body.querySelector('.notas-editor');

    function updateFileList() {
      sidebarList.innerHTML = '';
      let items = [];
      try {
        items = OS.fs.list('/documentos') || [];
      } catch (e) {
        items = [];
      }

      const txtFiles = items.filter(item => {
        const name = typeof item === 'string' ? item : item.name;
        const isDir = typeof item === 'object' && item.dir;
        return name && name.endsWith('.txt') && !isDir;
      });

      if (txtFiles.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'notas-empty-list';
        emptyMsg.textContent = 'Nenhum .txt';
        sidebarList.appendChild(emptyMsg);
        return;
      }

      txtFiles.forEach(item => {
        const fileName = typeof item === 'string' ? item : item.name;
        const btn = document.createElement('button');
        btn.className = 'notas-file-item';
        if (fileName === currentFilename) {
          btn.classList.add('active');
        }
        btn.textContent = fileName;
        btn.title = fileName;
        btn.addEventListener('click', () => {
          openFile(fileName);
        });
        sidebarList.appendChild(btn);
      });
    }

    function openFile(filename) {
      if (!filename) return;
      let name = filename.trim();
      if (!name) return;
      if (!name.endsWith('.txt')) {
        name += '.txt';
      }

      const path = '/documentos/' + name;
      const content = OS.fs.read(path);

      if (content !== null && content !== undefined) {
        currentFilename = name;
        inputFilename.value = name;
        editor.value = content;
        if (win && win.setTitle) {
          win.setTitle('Notas - ' + name);
        }
        if (OS.notify) {
          OS.notify('Arquivo ' + name + ' aberto.');
        }
        updateFileList();
      } else {
        if (OS.notify) {
          OS.notify('Arquivo ' + name + ' não encontrado em /documentos.');
        }
      }
    }

    function saveFile() {
      let name = inputFilename.value.trim();
      if (!name) {
        name = 'sem-titulo.txt';
        inputFilename.value = name;
      }
      if (!name.endsWith('.txt')) {
        name += '.txt';
        inputFilename.value = name;
      }

      const path = '/documentos/' + name;
      const content = editor.value;

      try {
        OS.fs.write(path, content);
        currentFilename = name;
        if (win && win.setTitle) {
          win.setTitle('Notas - ' + name);
        }
        if (OS.notify) {
          OS.notify('Arquivo ' + name + ' salvo.');
        }
        updateFileList();
      } catch (err) {
        if (OS.notify) {
          OS.notify('Erro ao salvar arquivo.');
        }
      }
    }

    function newFile() {
      currentFilename = '';
      inputFilename.value = '';
      editor.value = '';
      if (win && win.setTitle) {
        win.setTitle('Notas');
      }
      if (OS.notify) {
        OS.notify('Nova nota');
      }
      updateFileList();
    }

    btnSave.addEventListener('click', saveFile);
    btnOpen.addEventListener('click', () => {
      const name = inputFilename.value.trim();
      if (!name) {
        if (OS.notify) {
          OS.notify('Digite o nome do arquivo para abrir.');
        }
        return;
      }
      openFile(name);
    });
    btnNew.addEventListener('click', newFile);

    updateFileList();
  }
});
