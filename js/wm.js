(function () {
  'use strict';

  const windows = new Map();
  const appEntries = new Map();
  let desktop = null;
  let icons = null;
  let taskbar = null;
  let tasks = null;
  let startButton = null;
  let startMenu = null;
  let clock = null;
  let notifications = null;
  let zIndex = 10;
  let cascade = 0;
  let booted = false;
  let pointerAction = null;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined) {
      node.textContent = text;
    }
    return node;
  }

  function number(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function workArea() {
    const desktopRect = desktop.getBoundingClientRect();
    const taskbarRect = taskbar.getBoundingClientRect();
    let height = taskbarRect.top - desktopRect.top;

    if (height <= 0 || height > desktop.clientHeight) {
      height = desktop.clientHeight - taskbar.offsetHeight;
    }

    return {
      width: Math.max(0, desktop.clientWidth),
      height: Math.max(0, height)
    };
  }

  function currentBounds(record) {
    const windowRect = record.window.getBoundingClientRect();
    const desktopRect = desktop.getBoundingClientRect();
    return {
      left: windowRect.left - desktopRect.left,
      top: windowRect.top - desktopRect.top,
      width: windowRect.width,
      height: windowRect.height
    };
  }

  function applyBounds(record, bounds) {
    record.window.style.left = Math.round(bounds.left) + 'px';
    record.window.style.top = Math.round(bounds.top) + 'px';
    record.window.style.width = Math.round(bounds.width) + 'px';
    record.window.style.height = Math.round(bounds.height) + 'px';
  }

  function setTaskState(activeRecord) {
    windows.forEach(function (record) {
      const active = record === activeRecord && !record.window.classList.contains('minimized');
      record.task.classList.toggle('active', active);
    });
  }

  function focus(record) {
    if (!record || !record.window.isConnected) {
      return;
    }

    if (record.window.classList.contains('minimized')) {
      record.window.classList.remove('minimized');
    }

    windows.forEach(function (candidate) {
      candidate.window.classList.toggle('focused', candidate === record);
    });
    record.window.style.zIndex = String(++zIndex);
    setTaskState(record);
  }

  function focusTopWindow() {
    let next = null;
    let highest = -Infinity;

    windows.forEach(function (record) {
      if (record.window.classList.contains('minimized')) {
        return;
      }
      const candidateZ = number(record.window.style.zIndex, 0);
      if (candidateZ > highest) {
        highest = candidateZ;
        next = record;
      }
    });

    if (next) {
      focus(next);
    } else {
      setTaskState(null);
    }
  }

  function minimize(record) {
    record.window.classList.add('minimized');
    record.window.classList.remove('focused');
    record.task.classList.remove('active');
    focusTopWindow();
  }

  function maximize(record) {
    if (record.window.classList.contains('maximized')) {
      record.window.classList.remove('maximized');
      if (record.restoreBounds) {
        applyBounds(record, record.restoreBounds);
      }
      record.restoreBounds = null;
    } else {
      record.restoreBounds = currentBounds(record);
      record.window.classList.add('maximized');
      const area = workArea();
      applyBounds(record, {
        left: 0,
        top: 0,
        width: area.width,
        height: area.height
      });
    }
    focus(record);
  }

  function close(record) {
    if (!record || !windows.has(record.app.id)) {
      return;
    }

    const wasFocused = record.window.classList.contains('focused');
    windows.delete(record.app.id);
    record.window.remove();
    record.task.remove();

    if (wasFocused) {
      focusTopWindow();
    }
  }

  function setTitle(record, title) {
    const text = String(title);
    record.title.textContent = text;
    record.task.textContent = record.app.icon + ' ' + text;
    record.task.title = text;
  }

  function beginDrag(event, record) {
    if (event.button !== 0 || record.window.classList.contains('maximized')) {
      return;
    }

    const bounds = currentBounds(record);
    pointerAction = {
      type: 'drag',
      pointerId: event.pointerId,
      record: record,
      startX: event.clientX,
      startY: event.clientY,
      bounds: bounds
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function beginResize(event, record) {
    if (event.button !== 0 || record.window.classList.contains('maximized')) {
      return;
    }

    pointerAction = {
      type: 'resize',
      pointerId: event.pointerId,
      record: record,
      startX: event.clientX,
      startY: event.clientY,
      bounds: currentBounds(record)
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function movePointer(event) {
    if (!pointerAction || event.pointerId !== pointerAction.pointerId) {
      return;
    }

    const action = pointerAction;
    const deltaX = event.clientX - action.startX;
    const deltaY = event.clientY - action.startY;
    const area = workArea();

    if (action.type === 'drag') {
      const visibleWidth = Math.min(120, action.bounds.width, area.width);
      const titleHeight = Math.min(36, action.bounds.height, area.height);
      applyBounds(action.record, {
        left: Math.min(
          Math.max(action.bounds.left + deltaX, visibleWidth - action.bounds.width),
          Math.max(0, area.width - visibleWidth)
        ),
        top: Math.min(
          Math.max(action.bounds.top + deltaY, 0),
          Math.max(0, area.height - titleHeight)
        ),
        width: action.bounds.width,
        height: action.bounds.height
      });
    } else {
      const availableWidth = Math.max(120, area.width - action.bounds.left);
      const availableHeight = Math.max(100, area.height - action.bounds.top);
      applyBounds(action.record, {
        left: action.bounds.left,
        top: action.bounds.top,
        width: Math.min(Math.max(240, action.bounds.width + deltaX), availableWidth),
        height: Math.min(Math.max(140, action.bounds.height + deltaY), availableHeight)
      });
    }

    event.preventDefault();
  }

  function endPointer(event) {
    if (pointerAction && event.pointerId === pointerAction.pointerId) {
      pointerAction = null;
    }
  }

  function createWindow(app) {
    const windowNode = element('div', 'window');
    windowNode.dataset.app = app.id;
    windowNode.setAttribute('role', 'dialog');
    windowNode.setAttribute('aria-label', app.name);

    const titlebar = element('div', 'win-titlebar');
    const icon = element('span', 'win-icon', app.icon);
    const title = element('span', 'win-title', app.name);
    const buttons = element('div', 'win-buttons');
    const minButton = element('button', 'win-min', '–');
    const maxButton = element('button', 'win-max', '▢');
    const closeButton = element('button', 'win-close', '×');
    const body = element('div', 'win-body');
    const resize = element('div', 'win-resize');

    minButton.type = 'button';
    maxButton.type = 'button';
    closeButton.type = 'button';
    minButton.title = 'Minimizar';
    maxButton.title = 'Maximizar';
    closeButton.title = 'Fechar';
    buttons.append(minButton, maxButton, closeButton);
    titlebar.append(icon, title, buttons);
    windowNode.append(titlebar, body, resize);
    desktop.insertBefore(windowNode, taskbar);

    const task = element('button', 'task', app.icon + ' ' + app.name);
    task.type = 'button';
    task.dataset.app = app.id;
    task.title = app.name;
    tasks.appendChild(task);

    const publicWindow = {
      id: app.id,
      close: function () {
        close(record);
      },
      setTitle: function (text) {
        setTitle(record, text);
      }
    };

    const record = {
      app: app,
      window: windowNode,
      title: title,
      body: body,
      task: task,
      restoreBounds: null,
      publicWindow: publicWindow
    };
    windows.set(app.id, record);

    const area = workArea();
    const desiredWidth = number(app.width, 480);
    const desiredHeight = number(app.height, 360);
    const width = Math.max(120, Math.min(Math.max(240, desiredWidth), area.width || desiredWidth));
    const height = Math.max(100, Math.min(Math.max(140, desiredHeight), area.height || desiredHeight));
    const offset = (cascade++ % 9) * 28;
    applyBounds(record, {
      left: Math.max(0, Math.min(32 + offset, area.width - width)),
      top: Math.max(0, Math.min(28 + offset, area.height - height)),
      width: width,
      height: height
    });

    windowNode.addEventListener('pointerdown', function () {
      focus(record);
    });
    titlebar.addEventListener('pointerdown', function (event) {
      if (!event.target.closest('.win-buttons')) {
        beginDrag(event, record);
      }
    });
    titlebar.addEventListener('dblclick', function (event) {
      if (!event.target.closest('.win-buttons')) {
        maximize(record);
      }
    });
    resize.addEventListener('pointerdown', function (event) {
      beginResize(event, record);
    });
    minButton.addEventListener('click', function (event) {
      event.stopPropagation();
      minimize(record);
    });
    maxButton.addEventListener('click', function (event) {
      event.stopPropagation();
      maximize(record);
    });
    closeButton.addEventListener('click', function (event) {
      event.stopPropagation();
      close(record);
    });
    task.addEventListener('click', function () {
      if (windowNode.classList.contains('minimized')) {
        focus(record);
      } else if (windowNode.classList.contains('focused')) {
        minimize(record);
      } else {
        focus(record);
      }
    });

    focus(record);

    try {
      app.mount(body, publicWindow);
    } catch (error) {
      console.error('NspxOS: erro ao abrir ' + app.name + '.', error);
      body.textContent = 'Não foi possível iniciar este aplicativo.';
      manager.notify('Falha ao abrir ' + app.name + '.');
    }

    return publicWindow;
  }

  function addAppEntry(app) {
    if (appEntries.has(app.id)) {
      return;
    }

    const shortcut = element('button', 'desktop-icon');
    shortcut.type = 'button';
    shortcut.title = 'Abrir ' + app.name;
    shortcut.append(
      element('span', 'icon', app.icon),
      element('span', 'label', app.name)
    );
    shortcut.addEventListener('click', function () {
      OS.open(app.id);
    });
    icons.appendChild(shortcut);

    const startItem = element('button', 'start-item', app.icon + ' ' + app.name);
    startItem.type = 'button';
    startItem.dataset.app = app.id;
    startItem.addEventListener('click', function () {
      OS.open(app.id);
      startMenu.classList.add('hidden');
    });
    startMenu.appendChild(startItem);

    appEntries.set(app.id, {
      shortcut: shortcut,
      startItem: startItem
    });
  }

  function updateClock() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    clock.title = now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  function fitWindows() {
    const area = workArea();
    windows.forEach(function (record) {
      if (record.window.classList.contains('maximized')) {
        applyBounds(record, {
          left: 0,
          top: 0,
          width: area.width,
          height: area.height
        });
        return;
      }

      const bounds = currentBounds(record);
      const visibleWidth = Math.min(120, bounds.width, area.width);
      const titleHeight = Math.min(36, bounds.height, area.height);
      applyBounds(record, {
        left: Math.min(
          Math.max(bounds.left, visibleWidth - bounds.width),
          Math.max(0, area.width - visibleWidth)
        ),
        top: Math.min(Math.max(bounds.top, 0), Math.max(0, area.height - titleHeight)),
        width: bounds.width,
        height: bounds.height
      });
    });
  }

  const manager = {
    boot: function (apps) {
      if (!booted) {
        desktop = document.getElementById('desktop');
        icons = document.getElementById('icons');
        taskbar = document.getElementById('taskbar');
        tasks = document.getElementById('tasks');
        startButton = document.getElementById('start');
        startMenu = document.getElementById('start-menu');
        clock = document.getElementById('clock');
        notifications = document.getElementById('notifications');

        if (!desktop || !icons || !taskbar || !tasks || !startButton ||
            !startMenu || !clock || !notifications) {
          throw new Error('A área de trabalho do NspxOS está incompleta.');
        }

        startButton.addEventListener('click', function (event) {
          event.stopPropagation();
          startMenu.classList.toggle('hidden');
        });
        startMenu.addEventListener('click', function (event) {
          event.stopPropagation();
        });
        document.addEventListener('pointerdown', function (event) {
          if (!startMenu.contains(event.target) && event.target !== startButton) {
            startMenu.classList.add('hidden');
          }
        });
        document.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') {
            startMenu.classList.add('hidden');
          }
        });
        document.addEventListener('pointermove', movePointer);
        document.addEventListener('pointerup', endPointer);
        document.addEventListener('pointercancel', endPointer);
        window.addEventListener('resize', fitWindows);

        updateClock();
        window.setInterval(updateClock, 1000);
        booted = true;
      }

      apps.forEach(addAppEntry);
    },

    registerApp: function (app) {
      if (booted) {
        addAppEntry(app);
      }
    },

    open: function (app) {
      const existing = windows.get(app.id);
      if (existing) {
        focus(existing);
        return existing.publicWindow;
      }
      return createWindow(app);
    },

    notify: function (message) {
      if (!notifications) {
        return null;
      }

      const notification = element('div', 'notification', message);
      notifications.appendChild(notification);
      window.setTimeout(function () {
        notification.remove();
      }, 3500);
      return notification;
    }
  };

  OS._setWindowManager(manager);
}());
