OS.registerApp({
  id: 'arquivos',
  name: 'Arquivos',
  icon: '📁',
  width: 600,
  height: 400,
  mount(body, win) {
    let pastaAtual = '/';
    let confirmacaoDeletar = null;

    const criarInterface = () => {
      body.innerHTML = `
        <div class="arquivos-container">
          <div class="arquivos-caminho">
            <button class="btn-voltar" id="voltar">← Voltar</button>
            <span class="caminho-texto">${pastaAtual}</span>
          </div>
          <div class="arquivos-lista" id="lista"></div>
        </div>
        <style scoped>
          .arquivos-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            font-family: inherit;
          }
          .arquivos-caminho {
            display: flex;
            gap: 10px;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #333;
            background: #1a1a1a;
          }
          .btn-voltar {
            padding: 4px 12px;
            background: #333;
            color: #aaa;
            border: 1px solid #555;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
          }
          .btn-voltar:hover {
            background: #444;
            color: #fff;
          }
          .btn-voltar:disabled {
            opacity: 0.5;
            cursor: default;
          }
          .caminho-texto {
            font-size: 13px;
            color: #999;
            flex: 1;
            font-family: monospace;
          }
          .arquivos-lista {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
          }
          .arquivo-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            margin-bottom: 4px;
            background: #222;
            border: 1px solid #333;
            border-radius: 3px;
            cursor: pointer;
            transition: background 0.2s;
          }
          .arquivo-item:hover {
            background: #2a2a2a;
          }
          .arquivo-icon {
            font-size: 16px;
            min-width: 20px;
            text-align: center;
          }
          .arquivo-nome {
            flex: 1;
            font-size: 13px;
            color: #ccc;
            word-break: break-all;
          }
          .arquivo-acoes {
            display: flex;
            gap: 4px;
          }
          .btn-acao {
            padding: 2px 6px;
            font-size: 11px;
            background: #333;
            color: #999;
            border: 1px solid #555;
            border-radius: 2px;
            cursor: pointer;
          }
          .btn-acao:hover {
            background: #444;
            color: #fff;
          }
          .confirmacao {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #2a2a2a;
            border: 2px solid #555;
            border-radius: 5px;
            padding: 20px;
            z-index: 1000;
            min-width: 300px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.7);
          }
          .confirmacao-titulo {
            color: #fff;
            font-size: 14px;
            margin-bottom: 10px;
            font-weight: bold;
          }
          .confirmacao-arquivo {
            color: #aaa;
            font-size: 12px;
            margin-bottom: 15px;
            font-family: monospace;
            word-break: break-all;
          }
          .confirmacao-botoes {
            display: flex;
            gap: 10px;
          }
          .btn-confirmar {
            flex: 1;
            padding: 6px;
            background: #c00;
            color: #fff;
            border: 1px solid #a00;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
          }
          .btn-confirmar:hover {
            background: #d00;
          }
          .btn-cancelar {
            flex: 1;
            padding: 6px;
            background: #333;
            color: #aaa;
            border: 1px solid #555;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
          }
          .btn-cancelar:hover {
            background: #444;
            color: #fff;
          }
        </style>
      `;

      const listaDiv = document.getElementById('lista');
      const voltarBtn = document.getElementById('voltar');

      // Desabilitar botão "Voltar" se estiver na raiz
      if (pastaAtual === '/') {
        voltarBtn.disabled = true;
      } else {
        voltarBtn.addEventListener('click', () => {
          const partes = pastaAtual.split('/').filter(Boolean);
          if (partes.length > 0) {
            partes.pop();
            pastaAtual = '/' + partes.join('/');
          }
          criarInterface();
        });
      }

      // Listar arquivos
      const items = OS.fs.list(pastaAtual);
      if (!items || items.length === 0) {
        listaDiv.innerHTML = '<div style="color: #666; padding: 20px; text-align: center;">Pasta vazia</div>';
        return;
      }

      items.sort((a, b) => {
        // Pastas primeiro, depois alfabético
        if (a.dir !== b.dir) return a.dir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      items.forEach((item) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'arquivo-item';

        const icon = document.createElement('span');
        icon.className = 'arquivo-icon';
        icon.textContent = item.dir ? '📁' : '📄';

        const nome = document.createElement('span');
        nome.className = 'arquivo-nome';
        nome.textContent = item.name;

        const acoes = document.createElement('div');
        acoes.className = 'arquivo-acoes';

        // Ação principal ao clicar no item
        if (item.dir) {
          itemDiv.addEventListener('click', () => {
            pastaAtual = item.path;
            criarInterface();
          });
          itemDiv.style.cursor = 'pointer';
        } else if (item.name.endsWith('.txt')) {
          nome.style.cursor = 'pointer';
          nome.addEventListener('click', () => {
            OS.open('notas', item.path);
          });
        }

        // Botão de deletar
        if (!item.dir) {
          const btnDel = document.createElement('button');
          btnDel.className = 'btn-acao';
          btnDel.textContent = 'Deletar';
          btnDel.addEventListener('click', (e) => {
            e.stopPropagation();
            mostrarConfirmacao(item.path, item.name);
          });
          acoes.appendChild(btnDel);
        }

        itemDiv.appendChild(icon);
        itemDiv.appendChild(nome);
        if (acoes.children.length > 0) {
          itemDiv.appendChild(acoes);
        }

        listaDiv.appendChild(itemDiv);
      });
    };

    const mostrarConfirmacao = (caminho, nome) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 999;';

      const caixa = document.createElement('div');
      caixa.className = 'confirmacao';
      caixa.innerHTML = `
        <div class="confirmacao-titulo">Deletar arquivo?</div>
        <div class="confirmacao-arquivo">${nome}</div>
        <div class="confirmacao-botoes">
          <button class="btn-confirmar" id="confirmar">Deletar</button>
          <button class="btn-cancelar" id="cancelar">Cancelar</button>
        </div>
      `;

      overlay.appendChild(caixa);
      document.body.appendChild(overlay);

      caixa.querySelector('#confirmar').addEventListener('click', () => {
        OS.fs.remove(caminho);
        OS.notify('Arquivo deletado');
        document.body.removeChild(overlay);
        criarInterface();
      });

      caixa.querySelector('#cancelar').addEventListener('click', () => {
        document.body.removeChild(overlay);
      });
    };

    criarInterface();
  }
});
