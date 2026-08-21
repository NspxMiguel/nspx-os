# Contrato do NspxOS

Sistema operacional de mentira que roda no navegador. **HTML, CSS e JavaScript
puros — sem framework, sem CDN, sem build.** Abre com um duplo clique no
`index.html`.

Ninguém muda este arquivo. Quem precisar de algo que não está aqui, escreve no
quadro (`team note`) em vez de inventar.

## Arquivos e dono

| Arquivo | Quem escreve |
| --- | --- |
| `index.html` | o líder (já está pronto — ninguém mexe) |
| `js/kernel.js` | núcleo: registro de apps, sistema de arquivos, ajustes, boot |
| `js/wm.js` | janelas, barra de tarefas, menu iniciar |
| `css/os.css` | todo o visual |
| `js/apps/notas.js`, `js/apps/calc.js`, `js/apps/arquivos.js` | apps simples |
| `js/apps/navegador.js`, `js/apps/terminal.js` | navegador e terminal |
| `js/apps/config.js` | ajustes do sistema |
| `js/apps/campominado.js` | jogo |

Cada um mexe **só nos seus arquivos**. O `index.html` já carrega todos eles.

## A API do kernel

`js/kernel.js` cria o objeto global `OS` antes de qualquer app carregar:

```js
OS.registerApp({
  id: 'notas',                 // único, minúsculo
  name: 'Notas',               // aparece no menu e na barra de título
  icon: '📝',                  // um emoji
  width: 480, height: 360,     // tamanho inicial da janela
  mount(body, win) { ... }     // body é um <div> vazio; desenhe dentro dele
});

OS.open('notas')               // abre (ou foca) a janela do app
OS.notify('mensagem')          // aviso curto no canto
OS.settings.get(chave, padrao) // ajustes, gravados em localStorage
OS.settings.set(chave, valor)

// Sistema de arquivos, gravado em localStorage sob a chave "nspxos:fs".
// Caminho é sempre absoluto e com barra: '/documentos/lista.txt'
OS.fs.list('/documentos')      // -> [{ name, path, dir: true|false, size }]
OS.fs.read('/documentos/a.txt')   // -> string, ou null se não existir
OS.fs.write('/documentos/a.txt', 'conteúdo')   // cria as pastas que faltarem
OS.fs.remove('/documentos/a.txt')
OS.fs.mkdir('/fotos')
```

`mount(body, win)` recebe:

- `body`: o `<div class="win-body">` da janela, vazio, para o app desenhar;
- `win`: `{ id, close(), setTitle(texto) }`.

O kernel dispara `OS.boot()` sozinho quando a página carrega, depois que todos
os apps se registraram.

## As classes que o CSS precisa (o WM gera exatamente estas)

```html
<div id="desktop">
  <div id="icons">        <!-- atalhos na área de trabalho -->
    <button class="desktop-icon"><span class="icon">📝</span><span class="label">Notas</span></button>
  </div>

  <div class="window" data-app="notas">      <!-- .window.focused quando ativa -->
    <div class="win-titlebar">
      <span class="win-icon">📝</span>
      <span class="win-title">Notas</span>
      <div class="win-buttons">
        <button class="win-min">–</button>
        <button class="win-max">▢</button>
        <button class="win-close">×</button>
      </div>
    </div>
    <div class="win-body"></div>
    <div class="win-resize"></div>          <!-- canto de redimensionar -->
  </div>

  <div id="taskbar">
    <button id="start">Iniciar</button>
    <div id="tasks">
      <button class="task" data-app="notas">📝 Notas</button>   <!-- .task.active -->
    </div>
    <div id="clock">14:32</div>
  </div>

  <div id="start-menu" class="hidden">       <!-- .hidden quando fechado -->
    <button class="start-item" data-app="notas">📝 Notas</button>
  </div>

  <div id="notifications">
    <div class="notification">texto</div>
  </div>
</div>
```

Janela minimizada ganha a classe `.minimized`; maximizada, `.maximized`.

## Regras de todo mundo

- Português na interface. Comentário no código também.
- Nada de dependência externa, nada de CDN, nada de fonte remota.
- Nada de `alert()`, `confirm()` ou `prompt()` — use `OS.notify` e a própria janela.
- Guarde estado com `OS.fs` ou `OS.settings`, nunca direto no `localStorage`.
- Não use `git`. Deixe os arquivos como estão que o líder recolhe.
