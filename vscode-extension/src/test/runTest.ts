import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { runTests } from "@vscode/test-electron";

// Runs the integration tests inside a real VS Code instance.
// VSCODE_PATH: path to a VS Code executable (otherwise @vscode/test-electron downloads one).
// CODEQUEST_SERVER: a running CodeQuest web server (default http://localhost:3000).
async function main() {
  const extensionDevelopmentPath = path.resolve(__dirname, "../../");
  const extensionTestsPath = path.resolve(__dirname, "./suite/index");
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cq-vscode-user-"));
  await runTests({
    vscodeExecutablePath: process.env.VSCODE_PATH || undefined,
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: ["--disable-extensions", "--no-sandbox", "--disable-gpu", "--disable-workspace-trust", `--user-data-dir=${userDataDir}`],
    extensionTestsEnv: { CODEQUEST_SERVER: process.env.CODEQUEST_SERVER ?? "http://localhost:3000", CQ_SCREENSHOT_DIR: process.env.CQ_SCREENSHOT_DIR ?? "" },
  });
}

main().catch((err) => {
  console.error("Failed to run tests", err);
  process.exit(1);
});
