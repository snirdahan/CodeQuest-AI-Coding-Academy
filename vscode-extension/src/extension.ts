import * as path from "node:path";
import * as vscode from "vscode";
import { ApiError, CodeQuestApi, type CheckResult, type Exercise } from "./api";
import { exerciseFilePath, exercisesRoot, isSafeId, lessonIdForFile } from "./exercise-files";
import { ExercisePanel, type PanelMessage } from "./panel";

const TOKEN_KEY = "codequest.token";

let ctx: vscode.ExtensionContext;
let panel: ExercisePanel;
let statusBar: vscode.StatusBarItem;
let diagnostics: vscode.DiagnosticCollection;

/** Currently open exercise (the one shown in the panel). */
let current: { exercise: Exercise; file: vscode.Uri; hintsShown: number } | undefined;

function config() {
  return vscode.workspace.getConfiguration("codequest");
}
function serverUrl(): string {
  return config().get<string>("serverUrl") || "http://localhost:3000";
}
function root(): string {
  return exercisesRoot(config().get<string>("exercisesFolder"));
}
async function token() {
  return ctx.secrets.get(TOKEN_KEY);
}
async function api(): Promise<CodeQuestApi> {
  return new CodeQuestApi(serverUrl(), await token());
}

function showError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (e instanceof ApiError && e.status === 401) {
    void vscode.window.showErrorMessage(`CodeQuest: ${msg}`, "התחברות").then((c) => c && vscode.commands.executeCommand("codequest.connect"));
    return;
  }
  void vscode.window.showErrorMessage(`CodeQuest: ${msg}`);
}

async function refreshStatus() {
  if (!(await token())) {
    statusBar.text = "$(plug) CodeQuest: לא מחובר";
    statusBar.command = "codequest.connect";
    statusBar.show();
    return;
  }
  try {
    const me = await (await api()).me();
    statusBar.text = `$(rocket) CodeQuest · Lv ${me.level} · ${me.xp} XP · 🔥${me.streak}`;
    statusBar.tooltip = `${me.name} – לחצו לפתיחת תרגיל`;
    statusBar.command = "codequest.openExercise";
  } catch (e) {
    statusBar.text = "$(warning) CodeQuest";
    statusBar.tooltip = e instanceof Error ? e.message : "";
    statusBar.command = "codequest.connect";
  }
  statusBar.show();
}

// ---------- Pairing ----------

async function pairWithCode(code: string, server: string): Promise<boolean> {
  const res = await new CodeQuestApi(server).pair(code);
  if (server !== serverUrl()) await config().update("serverUrl", server, vscode.ConfigurationTarget.Global);
  await ctx.secrets.store(TOKEN_KEY, res.token);
  void vscode.window.showInformationMessage(`CodeQuest: מחובר כ־${res.user.name} ✓`);
  await refreshStatus();
  return true;
}

/** Handles vscode://codequest.codequest/open?pair=...&server=...&exercise=... */
async function handleUri(uri: vscode.Uri) {
  const q = new URLSearchParams(uri.query);
  const pair = q.get("pair");
  const exercise = q.get("exercise");
  let server = q.get("server") ?? serverUrl();
  try {
    const parsed = new URL(server);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    server = parsed.origin;
  } catch {
    void vscode.window.showErrorMessage("CodeQuest: כתובת שרת לא תקינה בקישור.");
    return;
  }
  // A link must never silently move the extension to a different server.
  if (server !== serverUrl()) {
    const ok = await vscode.window.showWarningMessage(
      `הקישור מבקש לחבר את CodeQuest לשרת ${server}. להמשיך רק אם פתחתם את הקישור בעצמכם מאתר CodeQuest.`,
      { modal: true },
      "המשך",
    );
    if (ok !== "המשך") return;
  }
  try {
    if (pair) await pairWithCode(pair, server);
    if (exercise && isSafeId(exercise)) await openExercise(exercise);
  } catch (e) {
    showError(e);
  }
}

async function connectCommand(args?: { code?: string; server?: string }) {
  const server = args?.server ?? serverUrl();
  let code = args?.code;
  if (!code) {
    const choice = await vscode.window.showInformationMessage(
      "כדי לחבר את VS Code לחשבון CodeQuest, פתחו באתר את עמוד \"VS Code\" ולחצו \"חיבור VS Code\". אפשר גם להדביק כאן קוד חיבור.",
      "פתיחת האתר",
      "הדבקת קוד",
    );
    if (choice === "פתיחת האתר") {
      await vscode.env.openExternal(vscode.Uri.parse(`${server}/connect-vscode`));
      return false;
    }
    if (choice !== "הדבקת קוד") return false;
    code = await vscode.window.showInputBox({ prompt: "קוד חיבור מהאתר", ignoreFocusOut: true, password: true });
    if (!code) return false;
  }
  try {
    return await pairWithCode(code.trim(), server);
  } catch (e) {
    showError(e);
    return false;
  }
}

async function requireToken(): Promise<boolean> {
  if (await token()) return true;
  return connectCommand();
}

// ---------- Exercises ----------

async function openExercise(lessonId?: string): Promise<vscode.TextEditor | undefined> {
  if (!(await requireToken())) return;
  const client = await api();
  if (!lessonId) {
    const list = await client.lessons();
    const items = list.courses.flatMap((c) =>
      c.lessons.map((l) => ({
        label: `${l.completed ? "$(pass-filled)" : l.access === "open" ? "$(circle-large-outline)" : "$(lock)"} ${l.title}`,
        description: c.title,
        detail: l.access === "locked-premium" ? "Premium" : l.access === "locked-order" ? "נפתח אחרי השיעור הקודם" : undefined,
        id: l.id,
        open: l.access === "open",
      })),
    );
    const pick = await vscode.window.showQuickPick(items, { placeHolder: "בחרו תרגיל" });
    if (!pick) return;
    if (!pick.open) {
      void vscode.window.showWarningMessage("התרגיל הזה עוד נעול.");
      return;
    }
    lessonId = pick.id;
  }

  const exercise = await client.exercise(lessonId);
  const filePath = exerciseFilePath(root(), exercise.courseId, exercise.id, exercise.fileName);
  const file = vscode.Uri.file(filePath);
  let exists = true;
  try {
    await vscode.workspace.fs.stat(file);
  } catch {
    exists = false;
  }
  if (!exists) {
    await vscode.workspace.fs.createDirectory(vscode.Uri.file(path.dirname(filePath)));
    await vscode.workspace.fs.writeFile(file, Buffer.from(exercise.starterCode, "utf8"));
  }
  const doc = await vscode.workspace.openTextDocument(file);
  const editor = await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.One, preview: false });
  current = { exercise, file, hintsShown: 0 };
  diagnostics.delete(file);
  panel.show({ exercise, hintsShown: 0, webUrl: `${serverUrl()}/lesson/${exercise.id}` });
  updateContext();
  return editor;
}

async function exerciseForActiveEditor(): Promise<{ exercise: Exercise; file: vscode.Uri; hintsShown: number } | undefined> {
  const doc = vscode.window.activeTextEditor?.document;
  if (doc) {
    const lessonId = lessonIdForFile(root(), doc.uri.fsPath);
    if (lessonId && (!current || current.exercise.id !== lessonId)) {
      const exercise = await (await api()).exercise(lessonId);
      current = { exercise, file: doc.uri, hintsShown: 0 };
      panel.show({ exercise, hintsShown: 0, webUrl: `${serverUrl()}/lesson/${exercise.id}` });
    }
  }
  return current;
}

async function checkSolution(): Promise<CheckResult | undefined> {
  if (!(await requireToken())) return;
  try {
    const ex = await exerciseForActiveEditor();
    if (!ex) {
      void vscode.window.showWarningMessage("פתחו קודם תרגיל: CodeQuest: Open Exercise");
      return;
    }
    const doc = await vscode.workspace.openTextDocument(ex.file);
    if (doc.isDirty) await doc.save();
    if (!panel.visible) panel.show({ exercise: ex.exercise, hintsShown: ex.hintsShown, webUrl: `${serverUrl()}/lesson/${ex.exercise.id}` });
    panel.update({ busy: true, error: undefined });
    // Only the content of this exercise file is sent – never other files from the computer.
    const result = await (await api()).check(ex.exercise.id, doc.getText(), ex.hintsShown);
    panel.update({ busy: false, result, exercise: { ...ex.exercise, completed: ex.exercise.completed || result.passed } });
    ex.exercise = { ...ex.exercise, completed: ex.exercise.completed || result.passed };

    if (result.error?.line) {
      const line = Math.max(0, Math.min(result.error.line - 1, doc.lineCount - 1));
      const d = new vscode.Diagnostic(doc.lineAt(line).range, `${result.error.explanation}\n(${result.error.message})`, vscode.DiagnosticSeverity.Error);
      d.source = "CodeQuest";
      diagnostics.set(ex.file, [d]);
    } else {
      diagnostics.delete(ex.file);
    }

    if (result.passed) {
      const msg = result.reward.xpAwarded > 0 ? `🎉 כל הכבוד! +${result.reward.xpAwarded} XP` : "🎉 הפתרון נכון!";
      const action = result.nextLessonId ? "לשיעור הבא" : undefined;
      void vscode.window.showInformationMessage(msg, ...(action ? [action] : [])).then((c) => c && vscode.commands.executeCommand("codequest.nextLesson"));
    }
    void refreshStatus();
    return result;
  } catch (e) {
    panel.update({ busy: false, error: e instanceof Error ? e.message : String(e) });
    showError(e);
  }
}

async function showHint() {
  const ex = await exerciseForActiveEditor();
  if (!ex) return;
  if (ex.hintsShown >= ex.exercise.hints.length) {
    void vscode.window.showInformationMessage("אין עוד רמזים לתרגיל הזה.");
    return;
  }
  ex.hintsShown++;
  panel.update({ hintsShown: ex.hintsShown });
  try {
    await (await api()).hint(ex.exercise.id, ex.hintsShown);
  } catch {
    /* hint tracking is best-effort */
  }
}

async function nextLesson() {
  const ex = current;
  const next = panel.state?.result?.nextLessonId ?? ex?.exercise.nextLessonId;
  if (!next) {
    void vscode.window.showInformationMessage("אין שיעור הבא כרגע – כל הכבוד!");
    return;
  }
  try {
    return await openExercise(next);
  } catch (e) {
    showError(e);
  }
}

async function disconnect() {
  const t = await token();
  if (t) {
    try {
      await new CodeQuestApi(serverUrl(), t).disconnect();
    } catch {
      /* revoke locally even if the server is unreachable */
    }
  }
  await ctx.secrets.delete(TOKEN_KEY);
  panel.dispose();
  current = undefined;
  void vscode.window.showInformationMessage("CodeQuest: נותק.");
  await refreshStatus();
}

function updateContext() {
  const doc = vscode.window.activeTextEditor?.document;
  const isEx = !!doc && !!lessonIdForFile(root(), doc.uri.fsPath);
  void vscode.commands.executeCommand("setContext", "codequest.isExerciseFile", isEx);
}

function onPanelMessage(m: PanelMessage) {
  if (m.type === "check") void checkSolution();
  if (m.type === "hint") void showHint();
  if (m.type === "next") void nextLesson();
  if (m.type === "openWeb" && current) void vscode.env.openExternal(vscode.Uri.parse(`${serverUrl()}/lesson/${current.exercise.id}`));
}

export function activate(context: vscode.ExtensionContext) {
  ctx = context;
  panel = new ExercisePanel(onPanelMessage);
  diagnostics = vscode.languages.createDiagnosticCollection("codequest");
  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

  const wrap = <T>(fn: (...a: any[]) => Promise<T>) => async (...a: any[]) => {
    try {
      return await fn(...a);
    } catch (e) {
      showError(e);
    }
  };

  context.subscriptions.push(
    diagnostics,
    statusBar,
    { dispose: () => panel.dispose() },
    vscode.window.registerUriHandler({ handleUri }),
    vscode.commands.registerCommand("codequest.connect", wrap(connectCommand)),
    vscode.commands.registerCommand("codequest.openExercise", wrap((id?: string) => openExercise(typeof id === "string" ? id : undefined))),
    vscode.commands.registerCommand("codequest.checkSolution", checkSolution),
    vscode.commands.registerCommand("codequest.showHint", wrap(showHint)),
    vscode.commands.registerCommand("codequest.nextLesson", nextLesson),
    vscode.commands.registerCommand("codequest.showPanel", wrap(async () => {
      const ex = await exerciseForActiveEditor();
      if (ex) panel.show({ exercise: ex.exercise, hintsShown: ex.hintsShown, webUrl: `${serverUrl()}/lesson/${ex.exercise.id}` });
    })),
    vscode.commands.registerCommand("codequest.disconnect", wrap(disconnect)),
    vscode.window.onDidChangeActiveTextEditor(updateContext),
  );
  updateContext();
  void refreshStatus();

  // Exposed for integration tests.
  return {
    handleUri,
    get current() {
      return current;
    },
    get panelState() {
      return panel.state;
    },
    diagnostics: () => diagnostics,
  };
}

export function deactivate() {}
