(function () {
  'use strict';

  const WALLPAPERS = [
    {
      id: 'aurora',
      name: 'Aurora',
      value: 'radial-gradient(circle at 15% 15%, rgba(56, 189, 248, 0.35), transparent 42%), radial-gradient(circle at 85% 85%, rgba(139, 92, 246, 0.38), transparent 45%), linear-gradient(135deg, #090d16 0%, #111827 45%, #1e1b4b 72%, #0f172a 100%)'
    },
    {
      id: 'oceano',
      name: 'Oceano',
      value: 'radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.32), transparent 38%), linear-gradient(145deg, #082f49 0%, #075985 42%, #172554 100%)'
    },
    {
      id: 'por-do-sol',
      name: 'Pôr do sol',
      value: 'radial-gradient(circle at 75% 18%, rgba(253, 224, 71, 0.42), transparent 25%), linear-gradient(145deg, #7c2d12 0%, #be123c 48%, #312e81 100%)'
    },
    {
      id: 'floresta',
      name: 'Floresta',
      value: 'radial-gradient(circle at 75% 25%, rgba(74, 222, 128, 0.26), transparent 38%), linear-gradient(140deg, #052e16 0%, #14532d 45%, #134e4a 100%)'
    },
    {
      id: 'nebulosa',
      name: 'Nebulosa',
      value: 'radial-gradient(circle at 25% 70%, rgba(236, 72, 153, 0.4), transparent 38%), radial-gradient(circle at 75% 25%, rgba(129, 140, 248, 0.38), transparent 36%), linear-gradient(140deg, #1e1b4b 0%, #581c87 50%, #0f172a 100%)'
    },
    {
      id: 'grafite',
      name: 'Grafite',
      value: 'radial-gradient(circle at 50% 0%, rgba(148, 163, 184, 0.18), transparent 44%), linear-gradient(145deg, #020617 0%, #1e293b 50%, #0f172a 100%)'
    }
  ];

  const DEFAULT_ACCENT = '#38bdf8';

  function findWallpaper(saved) {
    return WALLPAPERS.find(function (wallpaper) {
      return wallpaper.value === saved || wallpaper.id === saved;
    }) || WALLPAPERS[0];
  }

  function validAccent(saved) {
    return typeof saved === 'string' && /^#[0-9a-f]{6}$/i.test(saved)
      ? saved.toLowerCase()
      : DEFAULT_ACCENT;
  }

  function applyAppearance(wallpaper, accent) {
    const root = document.documentElement;
    root.style.setProperty('--wallpaper', wallpaper.value);
    root.style.setProperty('--accent', accent);

    // Mantém compatibilidade com os nomes usados pelo visual atual do sistema.
    root.style.setProperty('--bg-gradient', 'var(--wallpaper)');
    root.style.setProperty('--color-accent', 'var(--accent)');
  }

  const savedWallpaper = findWallpaper(OS.settings.get('wallpaper', WALLPAPERS[0].value));
  const savedAccent = validAccent(OS.settings.get('accent', DEFAULT_ACCENT));
  applyAppearance(savedWallpaper, savedAccent);

  OS.registerApp({
    id: 'config',
    name: 'Ajustes',
    icon: '⚙️',
    width: 560,
    height: 540,

    mount(body) {
      const username = OS.settings.get('username', 'Usuário');

      body.innerHTML = `
        <style>
          .config-app {
            display: flex;
            flex-direction: column;
            gap: 18px;
            min-height: 100%;
            padding: 4px;
          }

          .config-section {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .config-heading {
            font-size: 14px;
            font-weight: 700;
          }

          .config-hint {
            color: var(--color-text-muted, #94a3b8);
            font-size: 12px;
            line-height: 1.45;
          }

          .config-wallpapers {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .config-wallpaper {
            display: flex;
            flex-direction: column;
            gap: 7px;
            padding: 6px !important;
            text-align: left;
          }

          .config-wallpaper[aria-pressed="true"] {
            border-color: var(--accent) !important;
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 28%, transparent);
          }

          .config-wallpaper-preview {
            width: 100%;
            height: 54px;
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 5px;
          }

          .config-wallpaper-name {
            padding: 0 2px;
            overflow: hidden;
            font-size: 12px;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .config-field {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .config-field label {
            min-width: 128px;
            font-size: 13px;
          }

          .config-field input[type="color"] {
            width: 48px;
            height: 34px;
            padding: 3px;
            border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.12));
            border-radius: 6px;
            background: rgba(15, 23, 42, 0.6);
            cursor: pointer;
          }

          .config-accent-value {
            min-width: 68px;
            color: var(--color-text-muted, #94a3b8);
            font-family: monospace;
            font-size: 12px;
          }

          .config-danger {
            margin-top: auto;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .config-danger-button,
          .config-confirm-button {
            border-color: rgba(239, 68, 68, 0.55) !important;
            color: #fecaca !important;
          }

          .config-danger-button:hover,
          .config-confirm-button:hover {
            background: rgba(239, 68, 68, 0.25) !important;
          }

          .config-confirm {
            padding: 12px;
            border: 1px solid rgba(239, 68, 68, 0.42);
            border-radius: 8px;
            background: rgba(127, 29, 29, 0.2);
          }

          .config-confirm[hidden] {
            display: none;
          }

          .config-confirm-title {
            margin-bottom: 5px;
            font-size: 13px;
            font-weight: 700;
          }

          .config-confirm-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 12px;
          }

          @media (max-width: 440px) {
            .config-wallpapers {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .config-field {
              align-items: flex-start;
              flex-direction: column;
              gap: 6px;
            }
          }
        </style>

        <div class="config-app">
          <section class="config-section" aria-labelledby="config-wallpaper-title">
            <div>
              <h2 class="config-heading" id="config-wallpaper-title">Papel de parede</h2>
              <p class="config-hint">Escolha um gradiente para a área de trabalho.</p>
            </div>
            <div class="config-wallpapers">
              ${WALLPAPERS.map(function (wallpaper) {
                return `
                  <button class="config-wallpaper" type="button" data-wallpaper="${wallpaper.id}" aria-pressed="false">
                    <span class="config-wallpaper-preview" style="background: ${wallpaper.value}"></span>
                    <span class="config-wallpaper-name">${wallpaper.name}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </section>

          <section class="config-section" aria-labelledby="config-personal-title">
            <h2 class="config-heading" id="config-personal-title">Personalização</h2>
            <div class="config-field">
              <label for="config-accent">Cor de destaque</label>
              <input id="config-accent" type="color" value="${savedAccent}" aria-label="Cor de destaque">
              <output class="config-accent-value" for="config-accent">${savedAccent}</output>
            </div>
            <div class="config-field">
              <label for="config-username">Nome do usuário</label>
              <input id="config-username" type="text" maxlength="40" autocomplete="off">
            </div>
            <p class="config-hint">As alterações são salvas automaticamente.</p>
          </section>

          <section class="config-section config-danger" aria-labelledby="config-storage-title">
            <div>
              <h2 class="config-heading" id="config-storage-title">Armazenamento</h2>
              <p class="config-hint">Apague todos os arquivos e pastas criados no NspxOS.</p>
            </div>
            <div>
              <button class="config-danger-button" type="button">Apagar tudo</button>
            </div>
            <div class="config-confirm" role="alertdialog" aria-labelledby="config-confirm-title" aria-describedby="config-confirm-text" hidden>
              <p class="config-confirm-title" id="config-confirm-title">Apagar todo o sistema de arquivos?</p>
              <p class="config-hint" id="config-confirm-text">Esta ação remove todos os arquivos e pastas e não pode ser desfeita.</p>
              <div class="config-confirm-actions">
                <button class="config-cancel-button" type="button">Cancelar</button>
                <button class="config-confirm-button" type="button">Sim, apagar tudo</button>
              </div>
            </div>
          </section>
        </div>
      `;

      const currentWallpaper = findWallpaper(OS.settings.get('wallpaper', savedWallpaper.value));
      const accentInput = body.querySelector('#config-accent');
      const accentValue = body.querySelector('.config-accent-value');
      const usernameInput = body.querySelector('#config-username');
      const wallpaperButtons = body.querySelectorAll('.config-wallpaper');
      const deleteButton = body.querySelector('.config-danger-button');
      const confirmation = body.querySelector('.config-confirm');
      const cancelButton = body.querySelector('.config-cancel-button');
      const confirmButton = body.querySelector('.config-confirm-button');

      usernameInput.value = typeof username === 'string' ? username.slice(0, 40) : 'Usuário';

      function selectWallpaper(wallpaper, save) {
        wallpaperButtons.forEach(function (button) {
          button.setAttribute('aria-pressed', String(button.dataset.wallpaper === wallpaper.id));
        });
        applyAppearance(wallpaper, validAccent(accentInput.value));
        if (save) {
          OS.settings.set('wallpaper', wallpaper.value);
        }
      }

      wallpaperButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          const wallpaper = WALLPAPERS.find(function (candidate) {
            return candidate.id === button.dataset.wallpaper;
          });
          if (wallpaper) {
            selectWallpaper(wallpaper, true);
          }
        });
      });

      accentInput.addEventListener('input', function () {
        const accent = validAccent(accentInput.value);
        accentValue.value = accent;
        OS.settings.set('accent', accent);
        applyAppearance(findWallpaper(OS.settings.get('wallpaper', currentWallpaper.value)), accent);
      });

      usernameInput.addEventListener('input', function () {
        OS.settings.set('username', usernameInput.value);
      });

      usernameInput.addEventListener('change', function () {
        usernameInput.value = usernameInput.value.trim();
        OS.settings.set('username', usernameInput.value);
      });

      function hideConfirmation() {
        confirmation.hidden = true;
        deleteButton.focus();
      }

      deleteButton.addEventListener('click', function () {
        confirmation.hidden = false;
        cancelButton.focus();
      });

      cancelButton.addEventListener('click', hideConfirmation);

      confirmButton.addEventListener('click', function () {
        try {
          const items = OS.fs.list('/');
          let removed = 0;

          items.forEach(function (item) {
            if (OS.fs.remove(item.path)) {
              removed += 1;
            }
          });

          confirmation.hidden = true;
          OS.notify(removed
            ? 'Todos os arquivos e pastas foram apagados.'
            : 'O sistema de arquivos já estava vazio.');
          deleteButton.focus();
        } catch (error) {
          OS.notify('Não foi possível apagar o sistema de arquivos.');
        }
      });

      body.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !confirmation.hidden) {
          hideConfirmation();
        }
      });

      selectWallpaper(currentWallpaper, false);
    }
  });
}());
