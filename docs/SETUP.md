# הוראות התקנה והרצה (בשפה פשוטה)

> המטרה: להריץ את CodeQuest על המחשב שלכם, לפתוח את האתר בדפדפן, ולחבר את VS Code.
> לא צריך לדעת לתכנת – רק להעתיק פקודות ולהדביק אותן.

## מה צריך להתקין (פעם אחת, הכול חינמי)

1. **Node.js** (גרסה 22 ומעלה) – https://nodejs.org → מורידים את הגרסה שמסומנת "LTS" ומתקינים עם "הבא, הבא, סיום".
2. **Visual Studio Code** – https://code.visualstudio.com
3. **Git** – https://git-scm.com (צריך רק כדי להוריד את הקוד מ־GitHub).

## הורדת הקוד

פותחים "Terminal" (ב־Windows: מחפשים בתפריט התחל "PowerShell"; ב־Mac: מחפשים "Terminal") ומדביקים:

```bash
git clone <כתובת הריפו שלכם ב-GitHub> codequest
cd codequest/web
```

## הפעלת האתר

```bash
npm install
npm run build
npm start
```

כשמופיע `Ready` – פותחים בדפדפן: **http://localhost:3000**
כדי לעצור: לוחצים `Ctrl + C` בחלון ה־Terminal.

> הנתונים (משתמשים, התקדמות) נשמרים בקובץ `web/data/codequest.db` על המחשב שלכם.

## הרצת הבדיקות האוטומטיות

```bash
npm test
```

צריך לראות בסוף: `Tests 55 passed`.

## התקנת התוסף ל־VS Code

```bash
cd ../vscode-extension
npm install
npm run compile
npm run package
```

נוצר קובץ בשם `codequest-0.1.0.vsix`. עכשיו ב־VS Code:
1. לוחצים על סמל ה־Extensions בצד (ארבעה ריבועים).
2. לוחצים על `⋯` למעלה → `Install from VSIX...` → בוחרים את הקובץ.

## חיבור VS Code לחשבון

1. באתר, נכנסים לשיעור ולוחצים **"🧩 תרגל ב־VS Code"**.
2. הדפדפן ישאל אם לפתוח את VS Code – מאשרים.
3. VS Code נפתח עם קובץ התרגיל ופאנל הוראות. כותבים קוד ולוחצים **Check Solution**.
4. ה־XP מתעדכן באתר מיד.

## בעיות נפוצות

| הבעיה | הפתרון |
|---|---|
| `npm: command not found` | Node.js לא הותקן, או שצריך לסגור ולפתוח מחדש את ה־Terminal |
| `Port 3000 is already in use` | האתר כבר רץ בחלון אחר. סגרו אותו, או הריצו `npm start -- -p 3001` |
| VS Code לא נפתח מהכפתור | ודאו שהתוסף מותקן. אפשרות חלופית: ב־VS Code הקישו `Ctrl+Shift+P` → `CodeQuest: Connect Account` |
| התוסף כותב "לא הצלחנו להתחבר לשרת" | ודאו שהאתר רץ (`npm start`) ושבהגדרות VS Code הערך `codequest.serverUrl` הוא `http://localhost:3000` |

## דרישות לכל סביבת לימוד

| מסלול | מה צריך | איפה הקוד רץ |
|---|---|---|
| Lua כללי | דפדפן בלבד (או VS Code + התוסף) | Lua 5.4 אמיתי ב־sandbox מבודד בשרת |
| HTML/CSS (בפיתוח) | דפדפן בלבד | iframe מבודד בדפדפן של הלומד |
| FiveM (בפיתוח) | לשיעורי Lua טהור – כלום. לשיעורי מנוע – שרת FiveM מקומי (FXServer) + GTA V | בדיקות Lua בפלטפורמה; התנהגות מנוע רק בשרת FiveM אמיתי |
| Roblox Luau (מתוכנן) | Roblox Studio (חינמי, Windows/Mac) | חלקי שפה – Luau sandbox (עתידי); מנוע – Roblox Studio בלבד |
| Java (מתוכנן) | לאתר: כלום; בשרת: JVM בקונטיינר נפרד | קונטיינר מבודד, לא על שרת האתר |
| JavaScript (מתוכנן) | דפדפן בלבד | Web Worker / iframe מבודד בדפדפן |
