(function () {
  'use strict';

  const FS_KEY = 'nspxos:fs';
  const SETTINGS_KEY = 'nspxos:settings';
  const apps = new Map();
  const pendingOpens = [];
  const pendingNotifications = [];

  let windowManager = null;
  let booted = false;
  let settingsCache = null;
  let fsCache = null;

  function flushPending() {
    if (!booted || !windowManager) {
      return;
    }

    while (pendingNotifications.length) {
      windowManager.notify(pendingNotifications.shift());
    }
    while (pendingOpens.length) {
      const app = apps.get(pendingOpens.shift());
      if (app) {
        windowManager.open(app);
      }
    }
  }

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn('NspxOS: não foi possível ler o armazenamento local.', error);
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('NspxOS: não foi possível salvar no armazenamento local.', error);
      return false;
    }
  }

  function loadSettings() {
    if (settingsCache) {
      return settingsCache;
    }

    const saved = readStorage(SETTINGS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          settingsCache = parsed;
        }
      } catch (error) {
        console.warn('NspxOS: os ajustes salvos estavam danificados.', error);
      }
    }

    settingsCache = settingsCache || {};
    return settingsCache;
  }

  function saveSettings() {
    writeStorage(SETTINGS_KEY, JSON.stringify(loadSettings()));
  }

  function initialFileSystem() {
    return {
      version: 1,
      nodes: {
        '/': { dir: true },
        '/documentos': { dir: true },
        '/fotos': { dir: true }
      }
    };
  }

  function validFileSystem(value) {
    return Boolean(
      value &&
      typeof value === 'object' &&
      value.nodes &&
      typeof value.nodes === 'object' &&
      !Array.isArray(value.nodes) &&
      value.nodes['/'] &&
      value.nodes['/'].dir === true
    );
  }

  function loadFileSystem() {
    if (fsCache) {
      return fsCache;
    }

    const saved = readStorage(FS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (validFileSystem(parsed)) {
          fsCache = parsed;
          return fsCache;
        }
      } catch (error) {
        console.warn('NspxOS: o sistema de arquivos salvo estava danificado.', error);
      }
    }

    fsCache = initialFileSystem();
    saveFileSystem();
    return fsCache;
  }

  function saveFileSystem() {
    if (fsCache) {
      writeStorage(FS_KEY, JSON.stringify(fsCache));
    }
  }

  function normalizePath(path) {
    if (typeof path !== 'string' || path.charAt(0) !== '/') {
      throw new TypeError('O caminho deve ser absoluto e começar com “/”.');
    }

    const parts = [];
    path.split('/').forEach(function (part) {
      if (!part || part === '.') {
        return;
      }
      if (part === '..') {
        parts.pop();
        return;
      }
      if (part.indexOf('\0') !== -1) {
        throw new TypeError('O caminho contém um caractere inválido.');
      }
      parts.push(part);
    });

    return parts.length ? '/' + parts.join('/') : '/';
  }

  function parentPath(path) {
    const separator = path.lastIndexOf('/');
    return separator <= 0 ? '/' : path.slice(0, separator);
  }

  function pathName(path) {
    return path === '/' ? '/' : path.slice(path.lastIndexOf('/') + 1);
  }

  function makeDirectories(path, fileSystem) {
    const parts = path.split('/').filter(Boolean);
    let current = '';

    parts.forEach(function (part) {
      current += '/' + part;
      const existing = fileSystem.nodes[current];
      if (existing && !existing.dir) {
        throw new Error('Não é uma pasta: ' + current);
      }
      if (!existing) {
        fileSystem.nodes[current] = { dir: true };
      }
    });
  }

  function contentSize(content) {
    try {
      return new Blob([content]).size;
    } catch (error) {
      return content.length;
    }
  }

  const settings = {
    get: function (key, fallback) {
      const values = loadSettings();
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : fallback;
    },

    set: function (key, value) {
      const values = loadSettings();
      Object.defineProperty(values, String(key), {
        value: value,
        configurable: true,
        enumerable: true,
        writable: true
      });
      saveSettings();
      return value;
    }
  };

  const fs = {
    list: function (path) {
      const normalized = normalizePath(path);
      const fileSystem = loadFileSystem();
      const directory = fileSystem.nodes[normalized];
      if (!directory || !directory.dir) {
        return [];
      }

      return Object.keys(fileSystem.nodes)
        .filter(function (candidate) {
          return candidate !== normalized && parentPath(candidate) === normalized;
        })
        .map(function (candidate) {
          const node = fileSystem.nodes[candidate];
          return {
            name: pathName(candidate),
            path: candidate,
            dir: node.dir === true,
            size: node.dir ? 0 : contentSize(String(node.content || ''))
          };
        })
        .sort(function (left, right) {
          if (left.dir !== right.dir) {
            return left.dir ? -1 : 1;
          }
          return left.name.localeCompare(right.name, 'pt-BR', { sensitivity: 'base' });
        });
    },

    read: function (path) {
      const normalized = normalizePath(path);
      const node = loadFileSystem().nodes[normalized];
      return node && !node.dir ? String(node.content || '') : null;
    },

    write: function (path, content) {
      const normalized = normalizePath(path);
      if (normalized === '/') {
        throw new Error('Não é possível gravar sobre a raiz.');
      }

      const fileSystem = loadFileSystem();
      const existing = fileSystem.nodes[normalized];
      if (existing && existing.dir) {
        throw new Error('O caminho já é uma pasta: ' + normalized);
      }

      makeDirectories(parentPath(normalized), fileSystem);
      fileSystem.nodes[normalized] = {
        dir: false,
        content: String(content)
      };
      saveFileSystem();
      return true;
    },

    remove: function (path) {
      const normalized = normalizePath(path);
      if (normalized === '/') {
        return false;
      }

      const fileSystem = loadFileSystem();
      if (!fileSystem.nodes[normalized]) {
        return false;
      }

      const prefix = normalized + '/';
      Object.keys(fileSystem.nodes).forEach(function (candidate) {
        if (candidate === normalized || candidate.indexOf(prefix) === 0) {
          delete fileSystem.nodes[candidate];
        }
      });
      saveFileSystem();
      return true;
    },

    mkdir: function (path) {
      const normalized = normalizePath(path);
      const fileSystem = loadFileSystem();
      makeDirectories(normalized, fileSystem);
      saveFileSystem();
      return true;
    }
  };

  const OS = {
    settings: settings,
    fs: fs,

    registerApp: function (app) {
      if (!app || typeof app !== 'object') {
        throw new TypeError('O aplicativo precisa ser um objeto.');
      }
      if (typeof app.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(app.id)) {
        throw new TypeError('O id do aplicativo deve ser único e usar letras minúsculas.');
      }
      if (apps.has(app.id)) {
        throw new Error('Já existe um aplicativo com o id “' + app.id + '”.');
      }
      if (typeof app.name !== 'string' || typeof app.mount !== 'function') {
        throw new TypeError('O aplicativo precisa ter nome e função mount.');
      }

      const registered = Object.assign({
        icon: '▣',
        width: 480,
        height: 360
      }, app);
      apps.set(registered.id, registered);

      if (booted && windowManager && typeof windowManager.registerApp === 'function') {
        windowManager.registerApp(registered);
      }
      return registered;
    },

    open: function (id) {
      const app = apps.get(id);
      if (!app) {
        OS.notify('Aplicativo não encontrado: ' + id);
        return null;
      }
      if (!booted || !windowManager) {
        if (pendingOpens.indexOf(id) === -1) {
          pendingOpens.push(id);
        }
        return null;
      }
      return windowManager.open(app);
    },

    notify: function (message) {
      const text = String(message);
      if (!booted || !windowManager) {
        pendingNotifications.push(text);
        return null;
      }
      return windowManager.notify(text);
    },

    boot: function () {
      if (booted) {
        return OS;
      }

      loadFileSystem();
      booted = true;

      if (windowManager && typeof windowManager.boot === 'function') {
        windowManager.boot(Array.from(apps.values()));
      }
      flushPending();

      return OS;
    },

    _setWindowManager: function (manager) {
      windowManager = manager;
      if (booted && manager && typeof manager.boot === 'function') {
        manager.boot(Array.from(apps.values()));
        flushPending();
      }
    }
  };

  window.OS = OS;

  window.addEventListener('DOMContentLoaded', function () {
    OS.boot();
  });
}());
