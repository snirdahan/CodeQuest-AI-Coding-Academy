import * as assert from "node:assert";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";
import type { CheckResult } from "../../api";

// Full workflow against a real CodeQuest server, inside a real VS Code:
// website pairing link → URI handler → exercise file + panel → check (fail, then pass) → XP synced to website.

const SERVER = process.env.CODEQUEST_SERVER ?? "http://localhost:3000";
const exercisesDir = fs.mkdtempSync(path.join(os.tmpdir(), "cq-exercises-"));
let cookie = "";

async function web(pathname: string, init: { method?: string; body?: unknown } = {}) {
  const res = await fetch(SERVER + pathname, {
    method: init.method ?? "GET",
    headers: { "content-type": "application/json", cookie },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  return { status: res.status, json: (await res.json()) as any };
}

async function waitFor<T>(fn: () => T | undefined, ms = 15000): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const v = fn();
    if (v) return v;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("timed out waiting");
}

/** Optional: CQ_SCREENSHOT_DIR=... saves screenshots of the real VS Code window (needs ImageMagick `import`). */
async function screenshot(name: string) {
  const dir = process.env.CQ_SCREENSHOT_DIR;
  if (!dir) return;
  await new Promise((r) => setTimeout(r, 1500));
  require("node:child_process").execSync(`import -window root ${path.join(dir, name)}.png`);
}

async function setEditorText(text: string) {
  const editor = vscode.window.activeTextEditor!;
  const doc = editor.document;
  await editor.edit((e) => e.replace(new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length)), text));
}

suite("CodeQuest extension – real end-to-end workflow", () => {
  let ext: any;

  suiteSetup(async () => {
    await vscode.workspace.getConfiguration("codequest").update("serverUrl", SERVER, vscode.ConfigurationTarget.Global);
    await vscode.workspace.getConfiguration("codequest").update("exercisesFolder", exercisesDir, vscode.ConfigurationTarget.Global);
    const email = `vscode${Date.now()}@example.com`;
    const signup = await web("/api/auth/signup", { method: "POST", body: { email, password: "password123", name: "VS Tester" } });
    assert.strictEqual(signup.status, 200, JSON.stringify(signup.json));
    const e = vscode.extensions.getExtension("codequest.codequest");
    assert.ok(e, "extension is installed");
    ext = await e!.activate();
  });

  test("commands are registered", async () => {
    const cmds = await vscode.commands.getCommands(true);
    for (const c of ["codequest.connect", "codequest.openExercise", "codequest.checkSolution", "codequest.showHint", "codequest.nextLesson", "codequest.disconnect"]) {
      assert.ok(cmds.includes(c), c);
    }
  });

  test("'Practice in VS Code' link pairs the account and opens the exercise", async () => {
    const pair = await web("/api/vscode/pair", { method: "POST", body: { exercise: "lua-01-hello" } });
    assert.strictEqual(pair.status, 200);
    assert.match(pair.json.uri, /^vscode:\/\/codequest\.codequest\/open\?/);
    // Deliver the exact link the website produces to the extension's URI handler.
    const uri = vscode.Uri.parse(pair.json.uri);
    await ext.handleUri(uri);
    await waitFor(() => ext.current?.exercise.id === "lua-01-hello");

    const file = path.join(exercisesDir, "lua-basics", "lua-01-hello", "hello.lua");
    assert.ok(fs.existsSync(file), "exercise file created inside the exercises folder only");
    assert.strictEqual(vscode.window.activeTextEditor?.document.uri.fsPath, file);
    assert.strictEqual(ext.panelState.exercise.title, "שלום עולם");

    const me = await web("/api/me");
    assert.strictEqual(me.json.vscodeConnections, 1);
  });

  test("the pairing code cannot be reused", async () => {
    const pair = await web("/api/vscode/pair", { method: "POST", body: {} });
    const code = new URLSearchParams(vscode.Uri.parse(pair.json.uri).query).get("pair")!;
    const first = await fetch(`${SERVER}/api/ext/pair`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
    const second = await fetch(`${SERVER}/api/ext/pair`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
    assert.strictEqual(first.status, 200);
    assert.strictEqual(second.status, 400);
  });

  test("wrong code: real runtime error, Hebrew explanation and an editor diagnostic", async () => {
    await setEditorText('prnt("hi")\n');
    const r = (await vscode.commands.executeCommand("codequest.checkSolution")) as CheckResult;
    assert.strictEqual(r.passed, false);
    assert.strictEqual(r.error?.kind, "runtime");
    assert.strictEqual(r.error?.line, 1);
    assert.match(r.error!.explanation, /prnt/);
    await screenshot("vscode-1-error");
    const diags = vscode.languages.getDiagnostics(ext.current.file);
    assert.strictEqual(diags.length, 1);
    assert.strictEqual(diags[0].range.start.line, 0);
    assert.strictEqual(diags[0].source, "CodeQuest");
  });

  test("correct code passes, awards XP once, and syncs to the website", async () => {
    await setEditorText('print("שלום מ-VS Code")\n');
    const r = (await vscode.commands.executeCommand("codequest.checkSolution")) as CheckResult;
    assert.strictEqual(r.passed, true, JSON.stringify(r.checks));
    assert.deepStrictEqual(r.output, ["שלום מ-VS Code"]);
    assert.strictEqual(r.reward.xpAwarded, 50);
    await screenshot("vscode-2-success");
    assert.ok(r.reward.newAchievements.some((a) => a.id === "vscode"));
    assert.strictEqual(vscode.languages.getDiagnostics(ext.current.file).length, 0);
    assert.ok(fs.readFileSync(ext.current.file.fsPath, "utf8").includes("שלום"), "file was saved before checking");

    const me = await web("/api/me");
    assert.strictEqual(me.json.xp, 50);
    assert.deepStrictEqual(me.json.completed, [{ lesson: "lua-01-hello", via: "vscode" }]);

    const again = (await vscode.commands.executeCommand("codequest.checkSolution")) as CheckResult;
    assert.strictEqual(again.passed, true);
    assert.strictEqual(again.reward.xpAwarded, 0, "no XP for repeating a solved exercise");
  });

  test("next lesson opens the following exercise; hints are progressive", async () => {
    await vscode.commands.executeCommand("codequest.nextLesson");
    await waitFor(() => ext.current?.exercise.id === "lua-02-variables");
    assert.ok(fs.existsSync(path.join(exercisesDir, "lua-basics", "lua-02-variables", "variables.lua")));
    await vscode.commands.executeCommand("codequest.showHint");
    assert.strictEqual(ext.panelState.hintsShown, 1);

    await setEditorText('local username = "snir"\nprint("username")\n');
    const fail = (await vscode.commands.executeCommand("codequest.checkSolution")) as CheckResult;
    assert.strictEqual(fail.passed, false);
    assert.ok(fail.checks.some((c) => !c.passed && /מירכאות/.test(c.message ?? "")));

    await setEditorText('local username = "snir"\nprint(username)\n');
    const pass = (await vscode.commands.executeCommand("codequest.checkSolution")) as CheckResult;
    assert.strictEqual(pass.passed, true);
    assert.strictEqual((await web("/api/me")).json.xp, 110);
  });

  test("disconnect revokes the token on the server", async () => {
    // (the "cannot be reused" test above created one extra connection that stays)
    const before = (await web("/api/me")).json.vscodeConnections;
    await vscode.commands.executeCommand("codequest.disconnect");
    const me = await web("/api/me");
    assert.strictEqual(me.json.vscodeConnections, before - 1);
  });
});
