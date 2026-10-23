import * as crypto from "node:crypto";
import * as vscode from "vscode";
import type { Block, CheckResult, Exercise } from "./api";

export type PanelMessage = { type: "check" } | { type: "hint" } | { type: "next" } | { type: "openWeb" };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Inline `code` and **bold**, after escaping. */
function rich(text: string) {
  return esc(text)
    .replace(/`([^`]+)`/g, '<code dir="ltr">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
}

function blocks(list: Block[]) {
  return list
    .map((b) => {
      switch (b.type) {
        case "p":
          return `<p>${rich(b.text ?? "")}</p>`;
        case "code":
          return `<pre dir="ltr"><code>${esc(b.code ?? "")}</code></pre>${b.output ? `<div class="out-label">פלט</div><pre dir="ltr" class="out">${esc(b.output)}</pre>` : ""}`;
        case "tip":
          return `<div class="tip">💡 ${rich(b.text ?? "")}</div>`;
        case "warn":
          return `<div class="warn">⚠️ ${rich(b.text ?? "")}</div>`;
        case "list":
          return `<ul>${(b.items ?? []).map((i) => `<li>${rich(i)}</li>`).join("")}</ul>`;
      }
    })
    .join("\n");
}

export interface PanelState {
  exercise: Exercise;
  hintsShown: number;
  result?: CheckResult;
  busy?: boolean;
  error?: string;
  webUrl: string;
}

export function renderPanel(webview: vscode.Webview, s: PanelState): string {
  const nonce = crypto.randomBytes(16).toString("base64");
  const ex = s.exercise;
  const r = s.result;
  const hints = ex.hints
    .slice(0, s.hintsShown)
    .map((h, i) => `<div class="hint"><b>רמז ${i + 1}:</b> ${rich(h)}</div>`)
    .join("");

  let resultHtml = "";
  if (s.error) resultHtml = `<div class="card bad">${esc(s.error)}</div>`;
  if (r) {
    const cls = r.passed ? "good" : r.error ? "bad" : "mid";
    resultHtml += `<div class="card ${cls}" id="result"><div class="summary">${r.passed ? "🎉" : r.error ? "🛑" : "🔍"} ${esc(r.summary)}</div>`;
    if (r.error) {
      resultHtml += `<p>${rich(r.error.explanation)}</p><pre dir="ltr" class="err">${r.error.line ? `line ${r.error.line}: ` : ""}${esc(r.error.message)}</pre>`;
    } else {
      resultHtml += `<ul class="checks">${r.checks
        .map((c) => `<li class="${c.passed ? "ok" : "no"}">${c.passed ? "✓" : "✗"} ${rich(c.label)}${c.message ? `<div class="msg">${rich(c.message)}</div>` : ""}</li>`)
        .join("")}</ul>`;
    }
    resultHtml += `</div>`;
    if (r.output.length) {
      resultHtml += `<div class="out-label">פלט התוכנית</div><pre dir="ltr" class="out">${esc(r.output.join("\n"))}${r.truncated ? "\n…" : ""}</pre>`;
    }
    if (r.passed) {
      resultHtml += `<div class="card reward">${
        r.reward.xpAwarded > 0 ? `<div class="xp" dir="ltr">+${r.reward.xpAwarded} XP</div>` : `<div>כבר קיבלתם XP על התרגיל הזה.</div>`
      }${r.reward.levelAfter > r.reward.levelBefore ? `<div>⬆️ עליתם לרמה ${r.reward.levelAfter}!</div>` : ""}${r.reward.newAchievements
        .map((a) => `<div>${esc(a.icon)} הישג חדש: <b>${esc(a.title)}</b></div>`)
        .join("")}<div class="muted">ההתקדמות סונכרנה לחשבון שלכם באתר.</div>${
        r.nextLessonId ? `<button id="next" class="primary">לשיעור הבא: ${esc(r.nextLessonTitle ?? "")} ←</button>` : ""
      }</div>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 12px 16px 40px; line-height: 1.6; }
  h1 { font-size: 1.35em; margin: 4px 0; }
  .crumb, .muted { color: var(--vscode-descriptionForeground); font-size: .9em; }
  .badge { display: inline-block; padding: 1px 8px; border-radius: 99px; background: linear-gradient(90deg,#3b82f6,#8b5cf6); color: #fff; font-size: .8em; }
  .objective { border-inline-start: 3px solid #3b82f6; padding: 6px 10px; background: rgba(59,130,246,.08); border-radius: 6px; }
  code { font-family: var(--vscode-editor-font-family); background: rgba(139,92,246,.15); padding: 0 4px; border-radius: 4px; unicode-bidi: isolate; }
  pre { direction: ltr; text-align: left; font-family: var(--vscode-editor-font-family); background: var(--vscode-textCodeBlock-background, rgba(0,0,0,.3)); padding: 10px; border-radius: 6px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  .out { color: #34d399; }
  .err { color: #f87171; }
  .out-label { font-size: .8em; color: var(--vscode-descriptionForeground); margin-top: 8px; }
  .tip, .hint { background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.3); padding: 8px 10px; border-radius: 6px; margin: 8px 0; }
  .hint { background: rgba(245,158,11,.08); border-color: rgba(245,158,11,.3); }
  .warn { background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.3); padding: 8px 10px; border-radius: 6px; }
  .card { border-radius: 8px; padding: 10px 12px; margin: 12px 0; border: 1px solid rgba(255,255,255,.1); }
  .good { border-color: rgba(16,185,129,.5); background: rgba(16,185,129,.08); }
  .bad { border-color: rgba(239,68,68,.5); background: rgba(239,68,68,.07); }
  .mid { border-color: rgba(245,158,11,.5); background: rgba(245,158,11,.06); }
  .reward { text-align: center; border-color: rgba(139,92,246,.5); background: rgba(139,92,246,.1); }
  .xp { font-size: 1.8em; font-weight: 800; color: #a78bfa; }
  .summary { font-weight: 600; }
  .checks { list-style: none; padding: 0; margin: 6px 0 0; }
  .checks .ok { color: #34d399; } .checks .no { color: #fbbf24; }
  .msg { color: var(--vscode-foreground); margin-inline-start: 18px; font-size: .95em; }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; margin: 14px 0; position: sticky; top: 0; padding: 6px 0; background: var(--vscode-editor-background); }
  button { font: inherit; border: 1px solid var(--vscode-button-border, transparent); border-radius: 6px; padding: 6px 14px; cursor: pointer;
    background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
  button.primary { background: linear-gradient(90deg,#3b82f6,#8b5cf6); color: #fff; font-weight: 600; }
  button:disabled { opacity: .5; cursor: default; }
</style>
</head>
<body>
  <div class="crumb">${esc(ex.courseTitle)} · <span class="badge" dir="ltr">+${ex.xp} XP</span>${ex.completed ? " · ✓ הושלם" : ""}</div>
  <h1>${esc(ex.title)}</h1>
  <div class="objective">🎯 ${rich(ex.objective)}</div>
  ${blocks(ex.instructions)}
  <div class="muted">הקובץ שלכם: <code dir="ltr">${esc(ex.fileName)}</code> · שמירה ובדיקה: <code dir="ltr">Ctrl+Alt+Enter</code></div>
  <div class="actions">
    <button id="check" class="primary" ${s.busy ? "disabled" : ""}>${s.busy ? "בודק..." : "▶ Check Solution"}</button>
    <button id="hint" ${s.hintsShown >= ex.hints.length ? "disabled" : ""}>💡 ${s.hintsShown === 0 ? "רמז" : "רמז נוסף"}</button>
    <button id="web">פתיחה באתר</button>
  </div>
  ${hints}
  ${resultHtml}
<script nonce="${nonce}">
  const vscode = acquireVsCodeApi();
  const on = (id, type) => { const el = document.getElementById(id); if (el) el.addEventListener("click", () => vscode.postMessage({ type })); };
  on("check", "check"); on("hint", "hint"); on("next", "next"); on("web", "openWeb");
  const res = document.getElementById("result"); if (res) res.scrollIntoView({ block: "nearest" });
</script>
</body>
</html>`;
}

export class ExercisePanel {
  private panel: vscode.WebviewPanel | undefined;
  state: PanelState | undefined;

  constructor(private onMessage: (m: PanelMessage) => void) {}

  show(state: PanelState) {
    this.state = state;
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel("codequestExercise", `CodeQuest: ${state.exercise.title}`, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }, {
        enableScripts: true,
        localResourceRoots: [],
        retainContextWhenHidden: true,
      });
      this.panel.onDidDispose(() => (this.panel = undefined));
      this.panel.webview.onDidReceiveMessage((m: PanelMessage) => this.onMessage(m));
    } else {
      this.panel.reveal(vscode.ViewColumn.Beside, true);
    }
    this.render();
  }

  update(patch: Partial<PanelState>) {
    if (!this.state) return;
    this.state = { ...this.state, ...patch };
    this.render();
  }

  get visible() {
    return !!this.panel;
  }

  private render() {
    if (this.panel && this.state) {
      this.panel.title = `CodeQuest: ${this.state.exercise.title}`;
      this.panel.webview.html = renderPanel(this.panel.webview, this.state);
    }
  }

  dispose() {
    this.panel?.dispose();
  }
}
