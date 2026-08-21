// Terminal com comandos: ajuda, ls, cd, cat, echo, rm, mkdir, limpar, abrir.

OS.registerApp({
  id: 'terminal',
  name: 'Terminal',
  icon: '⚫',
  width: 600,
  height: 400,

  mount(body, win) {
    let diretorioAtual = '/';
    const historico = OS.settings.get('terminal:historico', []);
    let indiceHistorico = historico.length;
    let linhaEditando = '';

    // HTML do terminal
    body.innerHTML = `
      <div class="term-output"></div>
      <div class="term-input-line">
        <span class="term-prompt"></span>
        <input class="term-input" type="text" autofocus>
      </div>
    `;

    const termOutput = body.querySelector('.term-output');
    const termPrompt = body.querySelector('.term-prompt');
    const termInput = body.querySelector('.term-input');

    // Atualizar prompt
    const atualizarPrompt = () => {
      termPrompt.textContent = `${diretorioAtual} $ `;
    };

    // Imprimir linha no terminal
    const imprimir = (texto, classe = '') => {
      const linha = document.createElement('div');
      if (classe) linha.className = classe;
      linha.textContent = texto;
      termOutput.appendChild(linha);
      termOutput.scrollTop = termOutput.scrollHeight;
    };

    // Normalizar caminho absoluto
    const normalizarCaminho = (caminho) => {
      if (!caminho.startsWith('/')) {
        caminho = diretorioAtual + (diretorioAtual === '/' ? '' : '/') + caminho;
      }
      const partes = caminho.split('/').filter(p => p && p !== '.');
      return '/' + partes.join('/');
    };

    // Verificar se um caminho é diretório
    const ehDiretorio = (caminho) => {
      const lista = OS.fs.list(caminho);
      return lista !== null;
    };

    // Comando: ajuda
    const cmd_ajuda = () => {
      imprimir('Comandos disponíveis:', 'term-info');
      imprimir('  ajuda             - mostra esta mensagem');
      imprimir('  ls [caminho]      - listar arquivos e pastas');
      imprimir('  cd <caminho>      - mudar de diretório');
      imprimir('  cat <arquivo>     - mostrar conteúdo do arquivo');
      imprimir('  echo <texto>      - imprimir texto');
      imprimir('  mkdir <pasta>     - criar diretório');
      imprimir('  rm <caminho>      - remover arquivo ou pasta');
      imprimir('  limpar            - limpar a tela');
      imprimir('  abrir <app>       - abrir um aplicativo');
    };

    // Comando: ls
    const cmd_ls = (args) => {
      let caminho = diretorioAtual;
      if (args.length > 0) {
        caminho = normalizarCaminho(args[0]);
      }

      if (!ehDiretorio(caminho)) {
        imprimir(`erro: não é um diretório: ${args[0]}`, 'term-error');
        return;
      }

      const lista = OS.fs.list(caminho);
      if (lista.length === 0) {
        imprimir('(diretório vazio)');
        return;
      }

      lista.forEach(item => {
        const tipo = item.dir ? '📁' : '📄';
        const tamanho = item.size ? ` (${item.size} bytes)` : '';
        imprimir(`${tipo} ${item.name}${tamanho}`);
      });
    };

    // Comando: cd
    const cmd_cd = (args) => {
      if (args.length === 0) {
        imprimir('uso: cd <caminho>');
        return;
      }

      let novoCaminho = args[0];

      if (novoCaminho === '..') {
        if (diretorioAtual === '/') {
          return;
        }
        const partes = diretorioAtual.split('/').filter(p => p);
        partes.pop();
        novoCaminho = '/' + partes.join('/');
      } else if (novoCaminho !== '/') {
        novoCaminho = normalizarCaminho(novoCaminho);
      }

      if (!ehDiretorio(novoCaminho)) {
        imprimir(`erro: diretório não encontrado: ${args[0]}`, 'term-error');
        return;
      }

      diretorioAtual = novoCaminho;
      atualizarPrompt();
    };

    // Comando: cat
    const cmd_cat = (args) => {
      if (args.length === 0) {
        imprimir('uso: cat <arquivo>');
        return;
      }

      const caminho = normalizarCaminho(args[0]);
      const conteudo = OS.fs.read(caminho);

      if (conteudo === null) {
        imprimir(`erro: arquivo não encontrado: ${args[0]}`, 'term-error');
        return;
      }

      imprimir(conteudo);
    };

    // Comando: echo
    const cmd_echo = (args) => {
      imprimir(args.join(' '));
    };

    // Comando: mkdir
    const cmd_mkdir = (args) => {
      if (args.length === 0) {
        imprimir('uso: mkdir <pasta>');
        return;
      }

      const caminho = normalizarCaminho(args[0]);
      OS.fs.mkdir(caminho);
      imprimir(`pasta criada: ${args[0]}`);
    };

    // Comando: rm
    const cmd_rm = (args) => {
      if (args.length === 0) {
        imprimir('uso: rm <caminho>');
        return;
      }

      const caminho = normalizarCaminho(args[0]);
      OS.fs.remove(caminho);
      imprimir(`removido: ${args[0]}`);
    };

    // Comando: limpar
    const cmd_limpar = () => {
      termOutput.innerHTML = '';
    };

    // Comando: abrir
    const cmd_abrir = (args) => {
      if (args.length === 0) {
        imprimir('uso: abrir <app>');
        return;
      }

      const app = args[0];
      OS.open(app);
      imprimir(`abrindo ${app}...`);
    };

    // Executar comando
    const executarComando = (linha) => {
      linha = linha.trim();
      if (!linha) return;

      // Adicionar ao histórico
      if (historico[historico.length - 1] !== linha) {
        historico.push(linha);
        OS.settings.set('terminal:historico', historico);
      }
      indiceHistorico = historico.length;

      // Imprimir comando
      imprimir(`${diretorioAtual} $ ${linha}`, 'term-command');

      // Parsear comando
      const partes = linha.split(/\s+/);
      const comando = partes[0];
      const args = partes.slice(1);

      // Executar
      switch (comando) {
        case 'ajuda':
          cmd_ajuda();
          break;
        case 'ls':
          cmd_ls(args);
          break;
        case 'cd':
          cmd_cd(args);
          break;
        case 'cat':
          cmd_cat(args);
          break;
        case 'echo':
          cmd_echo(args);
          break;
        case 'mkdir':
          cmd_mkdir(args);
          break;
        case 'rm':
          cmd_rm(args);
          break;
        case 'limpar':
          cmd_limpar();
          break;
        case 'abrir':
          cmd_abrir(args);
          break;
        default:
          imprimir(`comando não encontrado: ${comando}`, 'term-error');
      }
    };

    // Processar entrada
    termInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        executarComando(termInput.value);
        termInput.value = '';
        indiceHistorico = historico.length;
      }
    });

    // Histórico com setas
    termInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (indiceHistorico > 0) {
          indiceHistorico--;
          termInput.value = historico[indiceHistorico];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (indiceHistorico < historico.length - 1) {
          indiceHistorico++;
          termInput.value = historico[indiceHistorico];
        } else if (indiceHistorico === historico.length - 1) {
          indiceHistorico++;
          termInput.value = '';
        }
      }
    });

    // Inicializar
    atualizarPrompt();
    imprimir('NspxOS Terminal', 'term-info');
    imprimir('Digite "ajuda" para ver os comandos disponíveis.', 'term-info');
  }
});
