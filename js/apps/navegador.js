OS.registerApp({
  id: 'navegador',
  name: 'Navegador',
  icon: '🌐',
  width: 800,
  height: 600,

  mount(body, win) {
    const historico = OS.settings.get('navegador:historico', []);
    let indiceHistorico = historico.length - 1;
    let urlAtual = '';
    let termoAtual = '';

    body.innerHTML = `
      <style scoped>
        .nav-wrapper {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        }

        .nav-toolbar {
          display: flex;
          gap: 8px;
          padding: 8px;
          background: #2a2a2a;
          border-bottom: 1px solid #444;
          flex-shrink: 0;
          align-items: center;
        }

        .nav-spacer {
          flex: 1;
        }

        .nav-open-external-btn {
          background: transparent;
          border: 1px solid #666;
          color: #999;
          padding: 4px 8px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .nav-open-external-btn:hover {
          border-color: #0066cc;
          color: #0066cc;
        }

        .nav-btn {
          background: #444;
          border: 1px solid #555;
          color: #fff;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .nav-btn:hover {
          background: #555;
        }

        .nav-address {
          flex: 1;
          padding: 6px 10px;
          background: #333;
          border: 1px solid #555;
          color: #fff;
          border-radius: 4px;
          font-size: 14px;
        }

        .nav-address::placeholder {
          color: #999;
        }

        .nav-address:focus {
          outline: none;
          border-color: #0066cc;
        }

        .nav-search-btn {
          background: #0066cc;
          border: 1px solid #0052a3;
          color: #fff;
          padding: 6px 14px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .nav-search-btn:hover {
          background: #0052a3;
        }

        .nav-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .nav-home {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #1a1a1a;
          color: #fff;
        }

        .nav-home h1 {
          font-size: 32px;
          margin-bottom: 32px;
          color: #0066cc;
        }

        .nav-search-box {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
          width: 100%;
          max-width: 500px;
          padding: 0 20px;
        }

        .nav-search-input {
          flex: 1;
          padding: 10px 14px;
          background: #333;
          border: 1px solid #555;
          color: #fff;
          border-radius: 4px;
          font-size: 14px;
        }

        .nav-search-input::placeholder {
          color: #999;
        }

        .nav-search-input:focus {
          outline: none;
          border-color: #0066cc;
        }

        .nav-home-search-btn {
          background: #0066cc;
          border: 1px solid #0052a3;
          color: #fff;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .nav-home-search-btn:hover {
          background: #0052a3;
        }

        .nav-help-text {
          font-size: 12px;
          color: #666;
          margin-bottom: 24px;
          line-height: 1.4;
        }

        .nav-shortcuts {
          display: grid;
          grid-template-columns: repeat(4, 80px);
          gap: 20px;
        }

        .nav-shortcut {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #fff;
          cursor: pointer;
        }

        .nav-shortcut:hover {
          opacity: 0.7;
        }

        .nav-shortcut .icon {
          font-size: 32px;
        }

        .nav-shortcut .label {
          font-size: 12px;
          text-align: center;
        }

        .nav-iframe-container {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .nav-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        .nav-error {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #1a1a1a;
          color: #fff;
          gap: 20px;
        }

        .nav-error p {
          font-size: 16px;
        }

        .nav-open-external {
          background: #0066cc;
          border: 1px solid #0052a3;
          color: #fff;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .nav-open-external:hover {
          background: #0052a3;
        }

        .hidden {
          display: none !important;
        }
      </style>

      <div class="nav-wrapper">
        <div class="nav-toolbar">
          <button class="nav-btn nav-back" title="Voltar">←</button>
          <button class="nav-btn nav-forward" title="Avançar">→</button>
          <button class="nav-btn nav-reload" title="Recarregar">⟳</button>
          <input class="nav-address" type="text" placeholder="Digite uma URL ou faça uma busca">
          <button class="nav-search-btn">Buscar</button>
          <div class="nav-spacer"></div>
          <button class="nav-open-external-btn nav-toolbar-google" title="Buscar no Google em nova aba">Google</button>
          <button class="nav-open-external-btn nav-toolbar-open-external" title="Abrir em nova aba">Abrir em nova aba</button>
        </div>
        <div class="nav-content">
          <div class="nav-home">
            <h1>Navegador</h1>
            <div class="nav-search-box">
              <input class="nav-search-input" type="text" placeholder="Pesquise na web...">
              <button class="nav-home-search-btn">Buscar</button>
            </div>
            <p class="nav-help-text">Busca dentro da janela usa Bing. Use o botão Google para buscar no Google.</p>
            <div class="nav-shortcuts">
              <a class="nav-shortcut" href="https://www.google.com">
                <span class="icon">🔍</span><span class="label">Google</span>
              </a>
              <a class="nav-shortcut" href="https://www.github.com">
                <span class="icon">💻</span><span class="label">GitHub</span>
              </a>
              <a class="nav-shortcut" href="https://www.youtube.com">
                <span class="icon">▶️</span><span class="label">YouTube</span>
              </a>
              <a class="nav-shortcut" href="https://www.wikipedia.org">
                <span class="icon">📖</span><span class="label">Wikipedia</span>
              </a>
            </div>
          </div>
          <div class="nav-iframe-container hidden">
            <iframe class="nav-iframe" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>
          </div>
          <div class="nav-error hidden">
            <p>Este site não pode ser aberto dentro da janela.</p>
            <button class="nav-open-external">Abrir em nova aba →</button>
          </div>
        </div>
      </div>
    `;

    const btnVoltar = body.querySelector('.nav-back');
    const btnAvancar = body.querySelector('.nav-forward');
    const btnRecarregar = body.querySelector('.nav-reload');
    const inputEndereco = body.querySelector('.nav-address');
    const btnBuscarToolbar = body.querySelector('.nav-search-btn');
    const divHome = body.querySelector('.nav-home');
    const iframeContainer = body.querySelector('.nav-iframe-container');
    let iframe = body.querySelector('.nav-iframe');
    const divErro = body.querySelector('.nav-error');
    const btnAbrirAba = body.querySelector('.nav-open-external');
    const btnAbrirAbaToolbar = body.querySelector('.nav-toolbar-open-external');
    const btnGoogleToolbar = body.querySelector('.nav-toolbar-google');
    const inputBuscaHome = body.querySelector('.nav-search-input');
    const btnBuscaHome = body.querySelector('.nav-home-search-btn');

    // Trocar o src do iframe existente dá dor de cabeça: `src = ''` recarrega a
    // própria página do OS, e o evento `load` dessa recarga se mistura com o do
    // site que a gente quer. Cada navegação ganha um iframe novo, com os
    // ouvintes ligados antes de existir qualquer src.
    const carregarURL = (url) => {
      if (!url.trim()) {
        divHome.classList.remove('hidden');
        iframeContainer.classList.add('hidden');
        divErro.classList.add('hidden');
        return;
      }

      divHome.classList.add('hidden');
      divErro.classList.add('hidden');
      iframeContainer.classList.remove('hidden');

      urlAtual = url;
      inputEndereco.value = url;

      const novoIframe = document.createElement('iframe');
      novoIframe.className = iframe.className;
      // Sem sandbox: o Google (e qualquer site sério) precisa de cookies e
      // navegação próprios para renderizar, e o iframe já é outra origem.
      novoIframe.setAttribute('referrerpolicy', 'no-referrer');

      // Não dá para ler o conteúdo de outra origem — tentar isso só levanta um
      // SecurityError que acontece igual quando a página carregou bem. O único
      // sinal honesto é o `load` não chegar.
      let decidido = false;
      const prazo = setTimeout(() => {
        if (decidido) return;
        decidido = true;
        mostrarErro();
      }, 8000);

      novoIframe.addEventListener('load', () => {
        if (decidido) return;
        decidido = true;
        clearTimeout(prazo);
      }, { once: true });

      novoIframe.addEventListener('error', () => {
        if (decidido) return;
        decidido = true;
        clearTimeout(prazo);
        mostrarErro();
      }, { once: true });

      iframe.replaceWith(novoIframe);
      iframe = novoIframe;
      novoIframe.src = url;
    };

    const mostrarErro = () => {
      iframeContainer.classList.add('hidden');
      divErro.classList.remove('hidden');
      btnAbrirAba.onclick = () => {
        window.open(urlAtual, '_blank');
      };
    };

    const abrirEmNovaAba = () => {
      if (urlAtual) {
        window.open(urlAtual, '_blank');
      }
    };

    const abrirGoogleEmNovaAba = () => {
      if (termoAtual) {
        window.open('https://www.google.com/search?q=' + encodeURIComponent(termoAtual), '_blank');
      }
    };

    btnAbrirAbaToolbar.addEventListener('click', abrirEmNovaAba);
    btnGoogleToolbar.addEventListener('click', abrirGoogleEmNovaAba);

    const procesarEntrada = (entrada) => {
      entrada = entrada.trim();
      if (!entrada) return;

      let url;

      if (entrada.includes('://')) {
        url = entrada;
      } else if (entrada.includes('.')) {
        url = 'https://' + entrada;
      } else {
        termoAtual = entrada;
        url = 'https://www.bing.com/search?q=' + encodeURIComponent(entrada);
      }

      if (historico[indiceHistorico] !== url) {
        historico.splice(indiceHistorico + 1);
        historico.push(url);
        indiceHistorico = historico.length - 1;
        OS.settings.set('navegador:historico', historico);
      }

      carregarURL(url);
    };

    btnVoltar.addEventListener('click', () => {
      if (indiceHistorico > 0) {
        indiceHistorico--;
        carregarURL(historico[indiceHistorico]);
      }
    });

    btnAvancar.addEventListener('click', () => {
      if (indiceHistorico < historico.length - 1) {
        indiceHistorico++;
        carregarURL(historico[indiceHistorico]);
      }
    });

    btnRecarregar.addEventListener('click', () => {
      if (urlAtual) {
        iframe.src = '';
        setTimeout(() => {
          iframe.src = urlAtual;
        }, 50);
      } else {
        divHome.classList.remove('hidden');
        iframeContainer.classList.add('hidden');
        divErro.classList.add('hidden');
      }
    });

    inputEndereco.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        procesarEntrada(inputEndereco.value);
      }
    });

    btnBuscarToolbar.addEventListener('click', () => {
      procesarEntrada(inputEndereco.value);
    });

    inputBuscaHome.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        procesarEntrada(inputBuscaHome.value);
      }
    });

    btnBuscaHome.addEventListener('click', () => {
      procesarEntrada(inputBuscaHome.value);
    });

    body.querySelectorAll('.nav-shortcut').forEach(atalho => {
      atalho.addEventListener('click', (e) => {
        e.preventDefault();
        const url = atalho.getAttribute('href');
        procesarEntrada(url);
      });
    });

    divHome.classList.remove('hidden');
  }
});
