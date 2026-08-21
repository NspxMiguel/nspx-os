# Quem escreveu cada parte do NspxOS

Este arquivo não é depoimento: é o que ficou gravado em disco. Cada execução de
agente deixou em `~/.ia-team/runs/<id>/` o briefing enviado, o relatório de
volta, o log do processo e o patch. Os números abaixo saíram de lá.

## O código que está no repositório hoje

| Arquivo | Linhas | Quem escreveu | Quanto do texto original dele sobreviveu |
| --- | --- | --- | --- |
| `js/kernel.js` | 374 | Codex | 100% |
| `js/wm.js` | 513 | Codex | 100% |
| `js/apps/calc.js` | 277 | Codex | 100% |
| `js/apps/config.js` | 361 | Codex | 100% |
| `css/os.css` | 1216 | Antigravity | 68% (duas rodadas: o sistema, depois o interior dos apps) |
| `js/apps/notas.js` | 262 | Antigravity | 100% |
| `js/apps/campominado.js` | 516 | Antigravity | 100% |
| `js/apps/terminal.js` | 278 | Claude (sessão separada) | 100% |
| `js/apps/arquivos.js` | 279 | Claude (sessão separada) | 100% |
| `js/apps/navegador.js` | 522 | Claude (sessão separada) | 61% — o resto são correções, uma delas escrita pelo líder |
| `index.html`, `CONTRATO.md` | — | o líder | contrato e esqueleto, escritos antes do sprint |

Total escrito por agentes: **cerca de 4.600 linhas** em 16 execuções.

## O que cada execução fez, em ordem

| Hora | Agente | Duração | Linhas | Arquivo |
| --- | --- | --- | --- | --- |
| 15:34 | codex | 445s | 887 | `js/kernel.js`, `js/wm.js` |
| 15:34 | antigravity | 41s | 559 | `css/os.css` |
| 15:34 | claude | 92s | 475 | `js/apps/navegador.js`, `js/apps/terminal.js` |
| 15:34 | groq | 259s | 308 | 3 apps — **descartado**, morreu no limite por minuto |
| 15:43 | codex | 158s | 277 | `js/apps/calc.js` |
| 15:43 | claude | 55s | 279 | `js/apps/arquivos.js` |
| 15:43 | groq | 588s | 0 | **falhou** — cota diária do Groq acabou |
| 15:54 | antigravity | 28s | 262 | `js/apps/notas.js` (tarefa que era do groq) |
| 16:00 | antigravity | 47s | 657 | `css/os.css` — estilo do interior dos apps |
| 16:00 | claude | 69s | 284 | `js/apps/navegador.js` reescrito |
| 16:00 | codex | 156s | 361 | `js/apps/config.js` |
| 16:00 | opencode | 94s | 0 | **não entregou** — descreveu o que faria e parou |
| 16:03 | antigravity | 39s | 516 | `js/apps/campominado.js` (tarefa que era do opencode) |
| 16:09 | claude | 59s | 57 | correção do navegador |
| 16:26 | claude | 89s | 20 | busca pelo Bing |
| 16:32 | claude | 82s | 67 | seletor Google/Bing |

Quatro rodaram ao mesmo tempo às 15:34: os quatro primeiros patches nasceram
dentro do mesmo minuto, em worktrees separadas.

## A digital de cada processo

O log de cada execução carrega a assinatura do programa que rodou — não dá para
falsificar sem ter rodado:

```
codex-20260821-153430   OpenAI Codex v0.146.0 · model: gpt-5.6-sol · sandbox: workspace-write
opencode-20260821-160031   > build · big-pickle
groq-20260821-153431   · read_file {"path": "CONTRATO.md"} ... [team] rate limited, waiting 7.0s
antigravity-20260821-153430   ### Relatório de Execução (o formato que o agy devolve)
```

## O que o líder fez com as próprias mãos

Vale dizer o que **não** foi delegado, senão a conta não fecha:

- `CONTRATO.md` e `index.html` — escritos antes do sprint, para os quatro
  construírem contra a mesma interface;
- a divisão das tarefas, os briefings e a revisão de cada patch antes de aplicar;
- a reescrita da função `carregarURL` em `js/apps/navegador.js` (~50 linhas),
  depois de três tentativas do autor não resolverem: o iframe reaproveitado
  recarregava a própria página do OS e embaralhava o evento `load`;
- o diagnóstico que virou briefing: medir no navegador real que o Google
  renderiza dentro do iframe e que o `SecurityError` do `contentDocument` não
  significa bloqueio.

## Como conferir sozinho

```bash
team runs 30                              # todas as execuções, com agente e hora
cat ~/.ia-team/runs/<id>/brief.md         # o que foi pedido àquele agente
cat ~/.ia-team/runs/<id>/report.md        # o que ele respondeu, nas palavras dele
head -20 ~/.ia-team/runs/<id>/log.txt     # a assinatura do processo que rodou
team diff <id>                            # o patch inteiro que ele entregou
team board --dir .                        # o mural, com os recados entre eles
```
