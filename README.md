# NspxOS

A desktop that runs in a browser tab. Windows you can drag, resize, minimise and
maximise, a taskbar, a start menu, a file system, and seven small programs —
including a browser that really loads pages and a working Minesweeper.

**No framework, no CDN, no build step.** Open `index.html` and it boots.

Live: https://www.nspx.dev/nspx-os/

## What is inside

| Program | What it does |
| --- | --- |
| Navegador | Address bar, back/forward/reload, Google search inside the window (`igu=1` allows embedding); sites that refuse framing offer a new tab |
| Terminal | `ls`, `cd`, `cat`, `echo`, `mkdir`, `rm`, `abrir <app>`, history with the arrow keys — on the real file system |
| Notas | Writes and opens `.txt` files under `/documentos` |
| Arquivos | Browses the file system, opens text files in Notas, deletes with confirmation |
| Calculadora | Clickable keypad and physical keyboard |
| Campo Minado | 9×9, 10 mines, flood reveal, flags, timer |
| Ajustes | Wallpaper, accent colour, user name, and wiping the disk |

The file system lives in `localStorage` under `nspxos:fs`, so files survive a
reload.

## How it was built

Every file was written by a different AI, in parallel, through
[ia-team](https://github.com/NspxMiguel/ia-team):

| File | Written by |
| --- | --- |
| `js/kernel.js`, `js/wm.js`, `js/apps/calc.js`, `js/apps/config.js` | Codex |
| `css/os.css`, `js/apps/notas.js`, `js/apps/campominado.js` | Antigravity |
| `js/apps/navegador.js`, `js/apps/terminal.js`, `js/apps/arquivos.js` | Claude |
| `index.html`, `CONTRATO.md` | the lead |

`CONTRATO.md` is why it fits together: the kernel API, the CSS class names and
the file ownership were fixed **before** anyone started, so four agents built
against one interface instead of inventing four.

## Running it

```bash
python3 -m http.server 8899   # or just open index.html
```

## License

MIT.
