# CodeQuest – אקדמיית תכנות אינטראקטיבית

פלטפורמה ללימוד תכנות דרך כתיבת קוד אמיתי: שיעורים קצרים בעברית, בדיקת קוד אוטומטית ואמיתית, XP ורמות, ותוסף אמיתי ל־Visual Studio Code.

| תיקייה | מה יש בה |
|---|---|
| [`web/`](web) | האתר וה־API (Next.js 16, React 19, TypeScript, Tailwind 4, SQLite) |
| [`web/runner/`](web/runner) | ה־sandbox שמריץ Lua 5.4 אמיתי בתהליך נפרד ומבודד |
| [`vscode-extension/`](vscode-extension) | תוסף VS Code (TypeScript, VS Code Extension API) |
| [`docs/`](docs) | תכנון, הוראות התקנה, דוח בדיקות, תוכנית השקה |

- 📐 [מסמך תכנון ראשי](docs/PLAN.md)
- 🛠️ [הוראות התקנה והרצה](docs/SETUP.md)
- ✅ [דוח בדיקות](docs/TESTING.md)
- 🚀 [תוכנית השקה ל־30 יום](docs/LAUNCH-PLAN.md)
- 📍 [סטטוס שלבים](docs/STATUS.md)

## הרצה מהירה (למפתחים)

```bash
cd web && npm install && npm run build && npm start      # http://localhost:3000
npm test                                                  # 55 בדיקות יחידה ובדיקות פתרונות
cd ../vscode-extension && npm install && npm run compile && npm run package   # codequest-0.1.0.vsix
```
