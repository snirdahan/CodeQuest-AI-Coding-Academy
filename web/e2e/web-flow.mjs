// End-to-end check of the real vertical slice in a real browser:
// sign up → dashboard → choose Lua → open lesson → answer quiz → write wrong code → get feedback → fix → XP.
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS ?? "/tmp/claude-0/shots";
const email = `e2e${Date.now()}@example.com`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const step = (s) => console.log("•", s);

async function typeCode(code) {
  const editor = page.locator(".cm-content");
  await editor.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Delete");
  // insertText avoids CodeMirror auto-indent/auto-close changing what we type
  await page.keyboard.insertText(code);
}

await page.goto(BASE);
await page.waitForTimeout(1000);
await page.screenshot({ path: `${SHOTS}/01-landing.png` });
step("landing ok");

await page.goto(`${BASE}/signup`);
await page.fill('input[name="name"]', "שניר");
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', "password123");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard");
await page.waitForTimeout(900);
await page.screenshot({ path: `${SHOTS}/02-dashboard-new.png` });
step("signup → dashboard ok");

await page.goto(`${BASE}/learn`);
await page.waitForTimeout(900);
await page.screenshot({ path: `${SHOTS}/03-languages.png` });
await page.click('a[href="/learn/lua"]');
await page.waitForURL("**/learn/lua");
await page.waitForTimeout(900);
await page.screenshot({ path: `${SHOTS}/04-lua-tracks.png` });
await page.click('a[href="/course/lua-basics"]');
await page.waitForURL("**/course/lua-basics");
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOTS}/05-course-map.png` });
step("language → track → course ok");

await page.click('a[href="/lesson/lua-01-hello"]');
await page.waitForURL("**/lesson/lua-01-hello");
await page.getByText("Lua ואז Rocks בשורה הבאה").click();
await page.getByText("✓ נכון!").waitFor();
step("quiz answered");

await typeCode('prnt("שלום, CodeQuest!")');
await page.getByTestId("check-button").click();
await page.getByTestId("result").waitFor();
const errText = await page.getByTestId("result").innerText();
if (!errText.includes("prnt")) throw new Error("expected explanation about prnt, got: " + errText);
await page.getByTestId("result").scrollIntoViewIfNeeded();
await page.screenshot({ path: `${SHOTS}/06-lesson-error.png`, fullPage: false });
step("wrong code → real error explained: " + errText.split("\n")[1]);

await typeCode('print("שלום, CodeQuest!")');
await page.getByTestId("check-button").click();
await page.getByTestId("result").getByText("+50 XP").waitFor();
const out = await page.locator("pre").filter({ hasText: "שלום, CodeQuest!" }).last().innerText();
await page.getByTestId("result").getByText("+50 XP").scrollIntoViewIfNeeded();
await page.screenshot({ path: `${SHOTS}/07-lesson-success.png` });
step("correct code → passed, output: " + out.trim());

// Lesson 2 – hint + behaviour check
await page.getByRole("link", { name: /לשיעור הבא/ }).click();
await page.waitForURL("**/lesson/lua-02-variables");
await page.getByRole("button", { name: /רמז/ }).click();
await typeCode('local username = "snir"\nprint("username")');
await page.getByTestId("check-button").click();
await page.getByTestId("result").waitFor();
await page.getByTestId("result").scrollIntoViewIfNeeded();
await page.screenshot({ path: `${SHOTS}/08-lesson2-feedback.png` });
const fb = await page.getByTestId("result").innerText();
if (!fb.includes("מירכאות")) throw new Error("expected quote explanation: " + fb);
step("lesson 2 behavioural feedback ok");
await typeCode('local username = "snir"\nprint(username)');
await page.getByTestId("check-button").click();
await page.getByTestId("result").getByText("+60 XP").waitFor();
step("lesson 2 passed");

await page.goto(`${BASE}/dashboard`);
await page.waitForTimeout(900);
const dash = await page.locator("main").innerText();
if (!dash.includes("120")) throw new Error("dashboard XP not updated: " + dash.slice(0, 300));
await page.screenshot({ path: `${SHOTS}/09-dashboard-progress.png` });
step("dashboard shows XP 120 (50+10 quiz+60)");

await page.goto(`${BASE}/pricing`);
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOTS}/10-pricing.png` });
await page.goto(`${BASE}/achievements`);
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOTS}/11-achievements.png` });

// mobile
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/lesson/lua-01-hello`);
await page.screenshot({ path: `${SHOTS}/12-mobile-lesson.png` });

if (errors.length) {
  console.log("BROWSER ERRORS:\n" + errors.join("\n"));
  process.exitCode = 1;
}
console.log("E2E OK", email);
await browser.close();
