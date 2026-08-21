// Navegador web com barra de endereço, busca do Google e homepage.

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

    // HTML da interface
    body.innerHTML = `
      <div class="nav-toolbar">
        <button class="nav-btn nav-back" title="Voltar">←</button>
        <button class="nav-btn nav-forward" title="Avançar">→</button>
        <button class="nav-btn nav-reload" title="Recarregar">⟳</button>
        <input class="nav-address" type="text" placeholder="Digite uma URL ou faça uma busca">
      </div>
      <div class="nav-content">
        <div class="nav-home hidden">
          <h2>Navegador</h2>
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
        <div class="nav-iframe-container">
          <iframe class="nav-iframe hidden" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>
        </div>
        <div class="nav-error hidden">
          <p>Este site não pode ser aberto dentro da janela.</p>
          <button class="nav-open-external">Abrir em nova aba →</button>
        </div>
      </div>
    `;

    const btnVoltar = body.querySelector('.nav-back');
    const btnAvancar = body.querySelector('.nav-forward');
    const btnRecarregar = body.querySelector('.nav-reload');
    const inputEndereco = body.querySelector('.nav-address');
    const divHome = body.querySelector('.nav-home');
    const iframe = body.querySelector('.nav-iframe');
    const divErro = body.querySelector('.nav-error');
    const btnAbrirAba = body.querySelector('.nav-open-external');

    // Carregar URL em iframe
    const carregarURL = (url) => {
      if (!url.trim()) {
        divHome.classList.remove('hidden');
        iframe.classList.add('hidden');
        divErro.classList.add('hidden');
        return;
      }

      divHome.classList.add('hidden');
      divErro.classList.add('hidden');
      iframe.classList.remove('hidden');

      urlAtual = url;
      inputEndereco.value = url;

      // Limpar iframe
      iframe.src = '';

      // Tentar carregar a URL no iframe
      setTimeout(() => {
        iframe.src = url;
      }, 50);

      // Detectar se o site recusou o iframe (X-Frame-Options)
      setTimeout(() => {
        try {
          // Se conseguir acessar o documento, funcionou
          const doc = iframe.contentDocument || iframe.contentWindow.document;
        } catch (e) {
          // Acesso negado, provavelmente X-Frame-Options
          if (e.name === 'SecurityError') {
            mostrarErro();
          }
        }
      }, 2000);

      iframe.addEventListener('load', () => {
        try {
          iframe.contentDocument;
        } catch (e) {
          if (e.name === 'SecurityError') {
            mostrarErro();
          }
        }
      }, { once: true });

      iframe.addEventListener('error', () => {
        mostrarErro();
      }, { once: true });
    };

    const mostrarErro = () => {
      iframe.classList.add('hidden');
      divErro.classList.remove('hidden');
      btnAbrirAba.onclick = () => {
        window.open(urlAtual, '_blank');
      };
    };

    // Voltar no histórico
    btnVoltar.addEventListener('click', () => {
      if (indiceHistorico > 0) {
        indiceHistorico--;
        carregarURL(historico[indiceHistorico]);
      }
    });

    // Avançar no histórico
    btnAvancar.addEventListener('click', () => {
      if (indiceHistorico < historico.length - 1) {
        indiceHistorico++;
        carregarURL(historico[indiceHistorico]);
      }
    });

    // Recarregar
    btnRecarregar.addEventListener('click', () => {
      if (urlAtual) {
        iframe.src = '';
        setTimeout(() => {
          iframe.src = urlAtual;
        }, 50);
      } else {
        divHome.classList.remove('hidden');
        iframe.classList.add('hidden');
        divErro.classList.add('hidden');
      }
    });

    // Processar entrada (URL ou busca do Google)
    const procesarEntrada = (entrada) => {
      entrada = entrada.trim();
      if (!entrada) return;

      let url;

      // Se não tem protocolo, assumir HTTPS
      if (entrada.includes('://')) {
        url = entrada;
      } else if (entrada.includes('.')) {
        // Parece ser um domínio
        url = 'https://' + entrada;
      } else {
        // É uma busca: usar Google
        url = 'https://www.google.com/search?q=' + encodeURIComponent(entrada);
      }

      // Adicionar ao histórico
      if (historico[indiceHistorico] !== url) {
        historico.splice(indiceHistorico + 1);
        historico.push(url);
        indiceHistorico = historico.length - 1;
        OS.settings.set('navegador:historico', historico);
      }

      carregarURL(url);
    };

    inputEndereco.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        procesarEntrada(inputEndereco.value);
      }
    });

    // Clicar nos atalhos da home
    body.querySelectorAll('.nav-shortcut').forEach(atalho => {
      atalho.addEventListener('click', (e) => {
        e.preventDefault();
        const url = atalho.getAttribute('href');
        procesarEntrada(url);
      });
    });

    // Mostrar homepage no início
    divHome.classList.remove('hidden');
  }
});
