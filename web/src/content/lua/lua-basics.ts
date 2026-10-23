import type { Course, Lesson } from "../types";
import {
  casesHarness, caseCheck, expectBoolean, expectNumber, expectString, functionExists, hasOutput, uses,
} from "./helpers";

const COURSE = "lua-basics";

const hello: Lesson = {
  id: "lua-01-hello",
  courseId: COURSE,
  title: "שלום עולם",
  summary: "התוכנית הראשונה שלכם ב־Lua",
  minutes: 5,
  premium: false,
  xp: 50,
  objective: "להריץ תוכנית Lua ראשונה ולהבין מה עושה הפקודה `print`.",
  explanation: [
    { type: "p", text: "Lua היא שפת תכנות קלה ומהירה. משתמשים בה כדי לכתוב סקריפטים למשחקים – למשל שרתי FiveM של GTA, משחקים ב־Roblox (בגרסה שנקראת Luau) ועוד הרבה מנועים." },
    { type: "p", text: "תוכנית היא רשימה של הוראות שהמחשב מבצע לפי הסדר, מלמעלה למטה. ההוראה הראשונה שנלמד היא `print` – היא מדפיסה טקסט למסך." },
    { type: "code", code: 'print("Hello, World!")', output: "Hello, World!", caption: "הטקסט עצמו נכתב בתוך מירכאות" },
    { type: "p", text: "שימו לב לשלושה דברים: שם הפקודה `print`, סוגריים עגולים שבתוכם מה שרוצים להדפיס, ומירכאות סביב הטקסט. טקסט בתוך מירכאות נקרא **string** (מחרוזת)." },
    { type: "code", code: 'print("שורה ראשונה")\nprint("שורה שנייה")\n-- זו הערה. Lua מתעלמת משורות שמתחילות בשני מקפים', output: "שורה ראשונה\nשורה שנייה" },
    { type: "tip", text: "שורה שמתחילה ב־`--` היא **הערה**: הסבר בשביל בני אדם, שהמחשב מדלג עליו." },
  ],
  quiz: {
    question: "מה ידפיס הקוד הבא?",
    code: 'print("Lua")\nprint("Rocks")',
    options: [
      { text: "Lua Rocks (באותה שורה)", why: "כל קריאה ל־print מדפיסה שורה חדשה, אז הם לא יופיעו באותה שורה." },
      { text: "Lua ואז Rocks בשורה הבאה", correct: true, why: "נכון! כל `print` מדפיס שורה משלו, לפי הסדר." },
      { text: "שגיאה, כי אסור שני print", why: "מותר לכתוב כמה פקודות שרוצים – הן רצות אחת אחרי השנייה." },
    ],
  },
  challenge: {
    instructions: [
      { type: "p", text: "כתבו תוכנית שמדפיסה ברכה. למשל: `שלום, CodeQuest!` – אבל אתם יכולים לכתוב כל ברכה שתרצו." },
      { type: "p", text: "לחצו **בדיקה** כדי להריץ את הקוד ולקבל משוב." },
    ],
    fileName: "hello.lua",
    starterCode: "-- כתבו את הקוד שלכם מתחת לשורה הזו\n",
    hints: [
      "הפקודה להדפסה היא `print`.",
      "אחרי `print` באים סוגריים עגולים, ובתוכם הטקסט – בתוך מירכאות.",
      'המבנה הוא: `print("...")` – החליפו את שלוש הנקודות בברכה שלכם.',
    ],
    checks: [
      uses(/\bprint\s*\(/, "נעשה שימוש ב־`print`", "לא מצאתי קריאה ל־`print(...)` בקוד. זו הפקודה שמדפיסה למסך."),
      hasOutput(),
    ],
    solution: 'print("שלום, CodeQuest!")',
    solutionExplanation: "`print` מקבלת את מה שבתוך הסוגריים ומדפיסה אותו. הטקסט חייב להיות בתוך מירכאות כדי ש־Lua תדע שזה טקסט ולא שם של משהו.",
  },
};

const variables: Lesson = {
  id: "lua-02-variables",
  courseId: COURSE,
  title: "משתנים",
  summary: "לשמור מידע ולתת לו שם",
  minutes: 8,
  premium: false,
  xp: 60,
  objective: "ליצור משתנה עם `local`, לשמור בו ערך, ולהשתמש בו.",
  explanation: [
    { type: "p", text: "משתנה הוא כמו קופסה עם תווית: נותנים לו שם, ושמים בתוכו ערך. אחר כך אפשר להשתמש בשם במקום בערך עצמו." },
    { type: "code", code: 'local playerName = "Nova"\nprint(playerName)', output: "Nova" },
    { type: "list", items: [
      "`local` – אומר ל־Lua שאנחנו יוצרים משתנה חדש (מקומי). זה ההרגל הנכון ב־Lua.",
      "`playerName` – השם שבחרנו. אפשר אותיות באנגלית, ספרות וקו תחתון, אבל לא להתחיל בספרה.",
      "`=` – \"שים בתוך\". זה לא שוויון כמו במתמטיקה, אלא השמה.",
      '`"Nova"` – הערך. כאן זה טקסט, ולכן במירכאות.',
    ] },
    { type: "p", text: "שימו לב להבדל החשוב: `print(playerName)` מדפיס את **מה שבתוך** המשתנה, ואילו `print(\"playerName\")` מדפיס את המילה playerName עצמה." },
    { type: "code", code: 'local score = 10\nscore = 25 -- משנים את הערך. בלי local, כי המשתנה כבר קיים\nprint(score)', output: "25" },
    { type: "tip", text: "ב־Lua יש הבדל בין אותיות גדולות לקטנות: `Score` ו־`score` הם שני משתנים שונים." },
  ],
  quiz: {
    question: "מה ידפיס הקוד?",
    code: 'local city = "Haifa"\nprint("city")',
    options: [
      { text: "Haifa", why: "בגלל המירכאות, Lua לא מסתכלת במשתנה – היא מדפיסה את הטקסט city כמו שהוא." },
      { text: "city", correct: true, why: "נכון! `\"city\"` במירכאות הוא טקסט רגיל. כדי להדפיס את התוכן כותבים `print(city)` בלי מירכאות." },
      { text: "שגיאה", why: "אין כאן שגיאה – זה קוד תקין שפשוט מדפיס את המילה city." },
    ],
  },
  challenge: {
    instructions: [
      { type: "p", text: "צרו משתנה בשם `username` ושמרו בו את שם המשתמש שלכם (טקסט)." },
      { type: "p", text: "אחר כך הדפיסו את המשתנה בעזרת `print` – **השתמשו בשם המשתנה**, לא בטקסט עצמו." },
    ],
    fileName: "variables.lua",
    starterCode: "-- 1. צרו כאן משתנה בשם username\n\n-- 2. הדפיסו אותו\n",
    hints: [
      "יוצרים משתנה עם המילה `local`, אחריה השם, ואז `=` והערך.",
      'שם משתמש הוא טקסט, ולכן הערך צריך להיות בתוך מירכאות: `"..."`.',
      "כדי להדפיס את התוכן של המשתנה, כתבו את השם שלו בתוך הסוגריים של print – בלי מירכאות.",
    ],
    harness: `
__cq.report({ t = __cq.type(username), v = tostring(username) })
`,
    checks: [
      {
        label: "קיים משתנה `username`",
        test: (ctx) =>
          ctx.r.t !== "nil"
            ? true
            : /\bUsername\b|\bUserName\b|\buserName\b/.test(ctx.code)
              ? "מצאתי משתנה עם שם דומה, אבל לא זהה. ב־Lua אותיות גדולות וקטנות משנות – השם צריך להיות `username` בדיוק."
              : "לא מצאתי משתנה בשם `username`. צרו אותו עם `local username = ...`",
      },
      {
        label: "הערך הוא טקסט",
        test: (ctx) =>
          ctx.r.t === "string"
            ? ctx.r.v.trim().length > 0
              ? true
              : "המשתנה ריק. שימו בתוך המירכאות את שם המשתמש שלכם."
            : ctx.r.t === "nil"
              ? "קודם צריך ליצור את המשתנה."
              : `הערך של username הוא ${ctx.r.t === "number" ? "מספר" : ctx.r.t}, אבל שם משתמש הוא טקסט – עטפו אותו במירכאות.`,
      },
      uses(/\blocal\s+username\b/, "נעשה שימוש ב־`local`", "המשתנה עובד, אבל הרגל טוב ב־Lua הוא ליצור משתנים עם `local` לפני השם."),
      {
        label: "הערך של המשתנה הודפס",
        test: (ctx) => {
          if (ctx.r.t !== "string") return "קודם צריך משתנה עם טקסט.";
          if (!ctx.output.some((l) => l.includes(ctx.r.v))) {
            if (ctx.output.some((l) => l.includes("username"))) {
              return "הודפסה המילה username במקום התוכן שלה. כשהשם נמצא במירכאות, Lua מדפיסה אותו כטקסט. נסו בלי מירכאות.";
            }
            return "התוכן של username לא הופיע בפלט. ודאו שקראתם ל־print עם המשתנה.";
          }
          return true;
        },
      },
      uses(/\bprint\s*\([^)]*\busername\b/, "ההדפסה משתמשת בשם המשתנה", "הטקסט הודפס, אבל לא דרך המשתנה. נסו להעביר ל־print את `username` עצמו, כך שאם הערך ישתנה – גם ההדפסה תשתנה."),
    ],
    solution: 'local username = "snir"\nprint(username)',
    solutionExplanation: "בשורה הראשונה יוצרים משתנה ושומרים בו טקסט. בשורה השנייה מעבירים ל־print את שם המשתנה (בלי מירכאות), ולכן מודפס התוכן שלו.",
  },
};

const numbers: Lesson = {
  id: "lua-03-numbers",
  courseId: COURSE,
  title: "מספרים וחשבון",
  summary: "חיבור, חיסור, כפל וחילוק",
  minutes: 8,
  premium: false,
  xp: 60,
  objective: "לבצע חישובים עם משתנים מספריים ולשמור את התוצאה במשתנה חדש.",
  explanation: [
    { type: "p", text: "מספרים נכתבים בלי מירכאות. Lua יודעת לחשב איתם בעזרת הסימנים: `+` חיבור, `-` חיסור, `*` כפל, `/` חילוק, `%` שארית ו־`^` חזקה." },
    { type: "code", code: "local coins = 120\nlocal price = 45\nlocal left = coins - price\nprint(left)", output: "75" },
    { type: "p", text: "הכוח של משתנים: אם `coins` ישתנה, החישוב יתעדכן לבד. לכן מחשבים מתוך המשתנים, ולא כותבים את התשובה ביד." },
    { type: "code", code: "print(7 / 2)   -- חילוק רגיל\nprint(7 // 2)  -- חילוק שלם (מעגל למטה)\nprint(7 % 2)   -- שארית", output: "3.5\n3\n1" },
    { type: "tip", text: "כמו במתמטיקה, כפל וחילוק קודמים לחיבור וחיסור. `2 + 3 * 4` שווה 14. סוגריים משנים את הסדר: `(2 + 3) * 4` שווה 20." },
  ],
  quiz: {
    question: "מה הערך של `total`?",
    code: "local total = 10 + 2 * 5",
    options: [
      { text: "60", why: "זה היה נכון אם החיבור היה קודם. אבל כפל מתבצע לפני חיבור." },
      { text: "20", correct: true, why: "נכון! קודם 2 * 5 = 10, ואז 10 + 10 = 20." },
      { text: "17", why: "בדקו שוב את החישוב: 2 * 5 זה 10." },
    ],
  },
  challenge: {
    instructions: [
      { type: "p", text: "שחקן קונה כמה פריטים בחנות במשחק. יש לכם שלושה משתנים מוכנים: מחיר לפריט, כמות, והנחה." },
      { type: "p", text: "צרו משתנה בשם `total` ששווה ל: **מחיר × כמות פחות ההנחה**, והדפיסו אותו." },
      { type: "warn", text: "חשבו מתוך המשתנים. הבדיקה מריצה את הקוד שלכם גם עם מחירים אחרים, אז מספר שנכתב ביד לא יעבור." },
    ],
    fileName: "numbers.lua",
    starterCode: "local price = 25\nlocal quantity = 4\nlocal discount = 10\n\n-- צרו כאן את המשתנה total\n\n-- הדפיסו אותו\n",
    hints: [
      "הכפל ב־Lua הוא הסימן `*`.",
      "קודם כופלים את המחיר בכמות, ואז מחסירים את ההנחה.",
      "התחילו כך: `local total = price * ...` והשלימו.",
    ],
    harness: `
__cq.mute(true)
__cq.report({ t = __cq.type(total), v = total })
`,
    checks: [
      {
        label: "קיים משתנה `total` עם מספר",
        test: (ctx) =>
          ctx.r.t === "number" ? true : ctx.r.t === "nil" ? "לא מצאתי משתנה בשם `total`." : `total צריך להיות מספר, אבל הוא ${ctx.r.t === "string" ? "טקסט – אולי שמתם מירכאות?" : ctx.r.t}.`,
      },
      {
        label: "החישוב נכון",
        test: (ctx) => {
          if (ctx.r.t !== "number") return "קודם צריך משתנה total.";
          if (ctx.r.v === 90) return true;
          if (ctx.r.v === 110) return "יצא 110 – הוספתם את ההנחה במקום להחסיר אותה.";
          if (ctx.r.v === 100) return "יצא 100 – שכחתם להחסיר את ההנחה.";
          if (ctx.r.v === -15) return "יצא ‎-15 – ככל הנראה סדר הפעולות התבלבל. כפל מתבצע לפני חיסור, אז אין צורך בסוגריים סביב quantity - discount.";
          return `יצא ${ctx.r.v}. נסו לחשב בראש: 25 × 4 פחות 10.`;
        },
      },
      {
        label: "עובד גם עם מחירים אחרים",
        // Re-run the learner's code with different inputs, so a typed-in 90 cannot pass.
        rerun: {
          transform: (src) => {
            const out = src.replace(/local\s+price\s*=\s*25\b/, "local price = 13").replace(/local\s+quantity\s*=\s*4\b/, "local quantity = 3");
            return out === src ? null : out;
          },
          harness: "__cq.mute(true)\n__cq.report({ v = total })",
        },
        test: (ctx) => {
          if (ctx.r.v === 29) return true;
          if (ctx.r.v === undefined) return "השאירו את שורות ה־price וה־quantity כמו שהן – הבודק משנה אותן כדי לבדוק את החישוב.";
          return "כשהבודק שינה את המחיר ל־13 ואת הכמות ל־3, total לא השתנה בהתאם. חשבו את total מתוך המשתנים ולא כמספר קבוע.";
        },
      },
      uses(/\btotal\s*=[^\n]*\bprice\b/, "החישוב משתמש במשתנים", "נראה שהתוצאה נכתבה ביד. השתמשו במשתנים price, quantity ו־discount בתוך החישוב, כדי שהקוד יעבוד גם אם המחיר ישתנה."),
      {
        label: "התוצאה הודפסה",
        test: (ctx) => (ctx.output.some((l) => l.trim() === String(ctx.r.v)) ? true : "התוצאה לא הודפסה. אל תשכחו `print(total)`."),
      },
    ],
    solution: "local price = 25\nlocal quantity = 4\nlocal discount = 10\n\nlocal total = price * quantity - discount\nprint(total)",
    solutionExplanation: "Lua מחשבת קודם את הכפל (25 × 4 = 100) ואז את החיסור (100 − 10 = 90). התוצאה נשמרת ב־total ומודפסת.",
  },
};

const strings: Lesson = {
  id: "lua-04-strings",
  courseId: COURSE,
  title: "מחרוזות וחיבור טקסט",
  summary: "לחבר טקסטים עם `..`",
  minutes: 8,
  premium: false,
  xp: 70,
  objective: "לחבר טקסט ומשתנים בעזרת `..` ולמדוד אורך טקסט עם `#`.",
  explanation: [
    { type: "p", text: "בהרבה שפות מחברים טקסט עם `+`. ב־Lua זה **לא** עובד – `+` שמור למספרים. במקום זה משתמשים בשתי נקודות: `..`" },
    { type: "code", code: 'local name = "Nova"\nprint("Hello " .. name .. "!")', output: "Hello Nova!" },
    { type: "p", text: "אפשר לחבר גם מספרים לטקסט – Lua הופכת אותם לטקסט אוטומטית:" },
    { type: "code", code: 'local hp = 80\nprint("HP: " .. hp)', output: "HP: 80" },
    { type: "p", text: "הסימן `#` לפני טקסט נותן את האורך שלו (מספר התווים):" },
    { type: "code", code: 'local tag = "Lua"\nprint(#tag)', output: "3" },
    { type: "warn", text: "רווחים לא נוספים לבד! `\"Hello\" .. name` ייתן `HelloNova`. צריך לשים את הרווח בתוך המירכאות." },
  ],
  quiz: {
    question: "מה יקרה בקוד הזה?",
    code: 'local a = "Level "\nprint(a + 5)',
    options: [
      { text: "יודפס Level 5", why: "כדי לקבל את זה צריך `..` ולא `+`." },
      { text: "תתקבל שגיאה", correct: true, why: "נכון! `+` הוא חיבור מספרים. Lua מנסה להפוך את \"Level \" למספר ונכשלת. לחיבור טקסט משתמשים ב־`..`." },
      { text: "יודפס 5", why: "Lua לא מתעלמת מהטקסט – היא תיכשל בניסיון לחבר אותו כמספר." },
    ],
  },
  challenge: {
    instructions: [
      { type: "p", text: "צרו משתנה בשם `message` שמכיל את המשפט הבא, בנוי **מתוך המשתנים** player ו־level:" },
      { type: "code", code: "Player Nova reached level 7!" },
      { type: "p", text: "ואז הדפיסו את `message`." },
    ],
    fileName: "strings.lua",
    starterCode: 'local player = "Nova"\nlocal level = 7\n\n-- צרו כאן את message\n\n',
    hints: [
      "מחברים טקסטים עם `..` (שתי נקודות).",
      "חלקי הטקסט הקבועים הם \"Player \", \" reached level \" ו־\"!\". שימו לב לרווחים.",
      'המבנה: `local message = "Player " .. player .. ...` – המשיכו באותה צורה.',
    ],
    harness: `
__cq.mute(true)
__cq.report({ t = __cq.type(message), v = tostring(message) })
`,
    checks: [
      {
        label: "קיים משתנה `message` עם טקסט",
        test: (ctx) => (ctx.r.t === "string" ? true : ctx.r.t === "nil" ? "לא מצאתי משתנה בשם `message`." : "message צריך להיות טקסט."),
      },
      {
        label: "המשפט מדויק",
        test: (ctx) => {
          const v = String(ctx.r.v ?? "");
          if (v === "Player Nova reached level 7!") return true;
          if (v.replace(/\s+/g, "") === "PlayerNovareachedlevel7!") return `כמעט! הרווחים לא במקום. קיבלתי: "${v}". זכרו ש־\`..\` לא מוסיף רווחים לבד.`;
          if (/\bplayer\b|\blevel\b(?! 7)/.test(v)) return `קיבלתי: "${v}". אולי שמתם את שם המשתנה בתוך מירכאות? אז Lua מדפיסה את השם ולא את הערך.`;
          return `קיבלתי: "${v}". השוו אותו אות־אות למשפט המבוקש.`;
        },
      },
      uses(/\bmessage\s*=[^\n]*\.\.\s*player\b|\bmessage\s*=[^\n]*\bplayer\s*\.\./, "נעשה שימוש במשתנים ובחיבור `..`", "בנו את המשפט עם `..` ועם המשתנים player ו־level, ולא כטקסט אחד שלם."),
      {
        label: "ההודעה הודפסה",
        test: (ctx) => (ctx.output.includes(String(ctx.r.v)) ? true : "אל תשכחו להדפיס: `print(message)`."),
      },
    ],
    solution: 'local player = "Nova"\nlocal level = 7\n\nlocal message = "Player " .. player .. " reached level " .. level .. "!"\nprint(message)',
    solutionExplanation: "`..` מדביק את כל החלקים לטקסט אחד. המספר level הופך לטקסט אוטומטית. הרווחים נמצאים בתוך המירכאות של החלקים הקבועים.",
  },
};

const conditions: Lesson = {
  id: "lua-05-conditions",
  courseId: COURSE,
  title: "תנאים: if",
  summary: "לקבל החלטות בקוד",
  minutes: 10,
  premium: false,
  xp: 80,
  objective: "לכתוב פונקציה שמחליטה מה להחזיר בעזרת `if`, `elseif` ו־`else`.",
  explanation: [
    { type: "p", text: "תנאי מאפשר לקוד לבחור: אם משהו נכון – עשה X, אחרת – עשה Y." },
    { type: "code", code: 'local hp = 15\nif hp <= 0 then\n  print("Game over")\nelseif hp < 20 then\n  print("Low health!")\nelse\n  print("OK")\nend', output: "Low health!" },
    { type: "list", items: [
      "אחרי התנאי כותבים `then`, ובסוף כל הבלוק `end`.",
      "Lua בודקת את התנאים לפי הסדר ועוצרת בראשון שמתקיים.",
      "השוואות: `==` שווה, `~=` לא שווה, `<`, `>`, `<=`, `>=`.",
    ] },
    { type: "p", text: "בשיעור הזה נכתוב **פונקציה** – קוד עם שם שמקבל ערך ומחזיר תשובה עם `return`. (נעמיק בפונקציות בהמשך.)" },
    { type: "code", code: 'function isAdult(age)\n  if age >= 18 then\n    return true\n  end\n  return false\nend\n\nprint(isAdult(20))', output: "true" },
    { type: "warn", text: "שימו לב: לא שווה ב־Lua הוא `~=` (ולא `!=` כמו בשפות אחרות). ו־`=` בודד הוא השמה, לא השוואה." },
  ],
  quiz: {
    question: "מה יודפס כש־score = 75?",
    code: 'if score > 75 then\n  print("high")\nelse\n  print("low")\nend',
    options: [
      { text: "high", why: "`>` פירושו \"גדול מ־\" בלבד. 75 לא גדול מ־75." },
      { text: "low", correct: true, why: "נכון! 75 > 75 זה false, ולכן רץ החלק של else. אם רוצים לכלול את 75 משתמשים ב־`>=`." },
      { text: "שניהם", why: "if/else מריץ תמיד רק אחד מהחלקים." },
    ],
  },
  challenge: {
    instructions: [
      { type: "p", text: "כתבו פונקציה בשם `getRank(score)` שמחזירה דרגה לפי הציון:" },
      { type: "list", items: ['90 ומעלה → `"A"`', '75 עד 89 → `"B"`', '60 עד 74 → `"C"`', 'מתחת ל־60 → `"F"`'] },
      { type: "p", text: "הבודק יקרא לפונקציה שלכם עם ציונים שונים, כולל ציוני גבול." },
    ],
    fileName: "conditions.lua",
    starterCode: 'function getRank(score)\n  -- כתבו כאן את התנאים\n\nend\n\n-- אפשר לבדוק בעצמכם:\nprint(getRank(95))\n',
    hints: [
      "התחילו מהתנאי הגבוה ביותר: `if score >= 90 then return \"A\"`.",
      "את שאר המקרים כתבו עם `elseif`, ואת המקרה האחרון עם `else`.",
      "בדקו את הגבולות: האם 75 יוצא B? שימו לב להבדל בין `>` לבין `>=`.",
    ],
    harness: casesHarness("getRank", ["getRank(100)", "getRank(90)", "getRank(89)", "getRank(75)", "getRank(74)", "getRank(60)", "getRank(59)", "getRank(0)"]),
    checks: [
      functionExists("getRank"),
      caseCheck("ציון 100 → A", 0, expectString("A")),
      caseCheck("ציון 90 (גבול) → A", 1, expectString("A", () => "90 צריך להיות A. בדקו אם השתמשתם ב־`>` במקום `>=`.")),
      caseCheck("ציון 89 → B", 2, expectString("B")),
      caseCheck("ציון 75 (גבול) → B", 3, expectString("B", (c) => `75 החזיר "${c.value}" במקום B. בדקו את סימן ההשוואה בגבול של 75.`)),
      caseCheck("ציון 74 → C", 4, expectString("C")),
      caseCheck("ציון 60 (גבול) → C", 5, expectString("C", (c) => `60 החזיר "${c.value}" במקום C. בדקו את הגבול של 60.`)),
      caseCheck("ציון 59 → F", 6, expectString("F")),
      caseCheck("ציון 0 → F", 7, expectString("F")),
    ],
    solution: 'function getRank(score)\n  if score >= 90 then\n    return "A"\n  elseif score >= 75 then\n    return "B"\n  elseif score >= 60 then\n    return "C"\n  else\n    return "F"\n  end\nend',
    solutionExplanation: "בודקים מהגבוה לנמוך. כיוון ש־Lua עוצרת בתנאי הראשון שמתקיים, כשמגיעים ל־`score >= 75` כבר ידוע שהציון קטן מ־90, אז אין צורך לבדוק את זה שוב.",
  },
};

const loops: Lesson = {
  id: "lua-06-loops",
  courseId: COURSE,
  title: "לולאות",
  summary: "לחזור על פעולה הרבה פעמים",
  minutes: 10,
  premium: true,
  xp: 80,
  objective: "להשתמש בלולאת `for` כדי לחזור על פעולה ולצבור תוצאה.",
  explanation: [
    { type: "p", text: "לולאה מריצה את אותו קוד שוב ושוב. לולאת `for` מספרית סופרת ממספר אחד למספר אחר:" },
    { type: "code", code: "for i = 1, 3 do\n  print(\"Round \" .. i)\nend", output: "Round 1\nRound 2\nRound 3" },
    { type: "p", text: "דפוס נפוץ מאוד הוא **צבירה**: מתחילים ממשתנה 0, ובכל סיבוב מוסיפים לו:" },
    { type: "code", code: "local coins = 0\nfor day = 1, 5 do\n  coins = coins + 10\nend\nprint(coins)", output: "50" },
    { type: "p", text: "יש גם לולאת `while`, שרצה כל עוד תנאי מתקיים:" },
    { type: "code", code: "local hp = 30\nwhile hp > 0 do\n  hp = hp - 12\nend\nprint(hp)", output: "-6" },
    { type: "warn", text: "לולאת while שהתנאי שלה תמיד נכון לא תיגמר לעולם (לולאה אינסופית). בפלטפורמה נעצור אותה אחרי זמן קצר ונספר לכם." },
  ],
  quiz: {
    question: "כמה פעמים תודפס המילה Hi?",
    code: 'for i = 2, 6 do\n  print("Hi")\nend',
    options: [
      { text: "4", why: "שני המספרים כלולים: 2, 3, 4, 5, 6." },
      { text: "5", correct: true, why: "נכון! הלולאה רצה עבור 2, 3, 4, 5 ו־6 – חמש פעמים." },
      { text: "6", why: "הלולאה מתחילה ב־2, לא ב־1." },
    ],
  },
  challenge: {
    instructions: [
      { type: "p", text: "כתבו פונקציה `sumTo(n)` שמחזירה את הסכום של כל המספרים מ־1 עד n. למשל `sumTo(4)` מחזירה 10 (כי 1+2+3+4)." },
      { type: "p", text: "אם n הוא 0, התשובה היא 0. השתמשו בלולאה." },
    ],
    fileName: "loops.lua",
    starterCode: "function sumTo(n)\n  local total = 0\n  -- הוסיפו כאן לולאה\n\n  return total\nend\n\nprint(sumTo(4))\n",
    hints: [
      "לולאה שעוברת על 1 עד n: `for i = 1, n do ... end`.",
      "בתוך הלולאה, הוסיפו את i ל־total.",
      "השורה שבתוך הלולאה נראית כך: `total = total + i`.",
    ],
    harness: casesHarness("sumTo", ["sumTo(1)", "sumTo(4)", "sumTo(10)", "sumTo(0)", "sumTo(100)"]),
    checks: [
      functionExists("sumTo"),
      caseCheck("sumTo(1) = 1", 0, expectNumber(1)),
      caseCheck("sumTo(4) = 10", 1, expectNumber(10, (c) => (c.num === 6 ? "יצא 6 – הלולאה עוצרת מספר אחד מוקדם מדי. האם היא מגיעה עד n?" : c.num === 0 ? "יצא 0 – נראה שהלולאה לא מוסיפה ל־total." : `יצא ${c.value} במקום 10.`))),
      caseCheck("sumTo(10) = 55", 2, expectNumber(55)),
      caseCheck("sumTo(0) = 0", 3, expectNumber(0)),
      caseCheck("sumTo(100) = 5050", 4, expectNumber(5050)),
      uses(/\b(for|while)\b/, "נעשה שימוש בלולאה", "התוצאות נכונות – אבל המטרה בשיעור היא לתרגל לולאה. נסו לפתור עם `for`."),
    ],
    solution: "function sumTo(n)\n  local total = 0\n  for i = 1, n do\n    total = total + i\n  end\n  return total\nend",
    solutionExplanation: "total מתחיל ב־0. הלולאה עוברת על כל i מ־1 עד n ומוסיפה אותו. כש־n הוא 0, הלולאה לא רצה בכלל ומוחזר 0.",
  },
};

const functionsLesson: Lesson = {
  id: "lua-07-functions",
  courseId: COURSE,
  title: "פונקציות",
  summary: "קוד שאפשר להשתמש בו שוב",
  minutes: 10,
  premium: true,
  xp: 90,
  objective: "לכתוב פונקציה עם כמה פרמטרים, ולטפל במקרי קצה.",
  explanation: [
    { type: "p", text: "פונקציה היא מתכון עם שם. מגדירים אותה פעם אחת, וקוראים לה כמה פעמים שרוצים – כל פעם עם ערכים אחרים." },
    { type: "code", code: "function damage(base, multiplier)\n  return base * multiplier\nend\n\nprint(damage(10, 2))\nprint(damage(7, 3))", output: "20\n21" },
    { type: "list", items: [
      "`base` ו־`multiplier` הם **פרמטרים** – משתנים שמקבלים ערך בכל קריאה.",
      "`return` מחזיר תשובה למי שקרא לפונקציה, ומסיים אותה מיד.",
      "פונקציה בלי return מחזירה `nil` (כלום).",
    ] },
    { type: "tip", text: "אפשר גם `local function name()` – פונקציה מקומית. בתרגילים שבודקים פונקציה נשתמש ב־`function name()` הרגיל, כדי שהבודק ימצא אותה." },
  ],
  quiz: {
    question: "מה ידפיס הקוד?",
    code: "function double(x)\n  local result = x * 2\nend\n\nprint(double(5))",
    options: [
      { text: "10", why: "התוצאה חושבה, אבל לא הוחזרה – אין `return`." },
      { text: "nil", correct: true, why: "נכון! בלי `return` הפונקציה מחזירה nil. צריך `return x * 2`." },
      { text: "שגיאה", why: "זה קוד תקין – פשוט שום ערך לא חוזר." },
    ],
  },
  challenge: {
    instructions: [
      { type: "p", text: "במשחקים צריך לעיתים קרובות להגביל ערך לטווח – למשל HP לא יכול לרדת מתחת ל־0 או לעלות מעל המקסימום." },
      { type: "p", text: "כתבו פונקציה `clamp(value, low, high)` שמחזירה:" },
      { type: "list", items: ["את `low` אם value קטן ממנו", "את `high` אם value גדול ממנו", "אחרת – את value עצמו"] },
    ],
    fileName: "functions.lua",
    starterCode: "function clamp(value, low, high)\n\nend\n\nprint(clamp(150, 0, 100)) -- צריך להדפיס 100\n",
    hints: [
      "יש שלושה מקרים – מתאים להם if / elseif / else.",
      "המקרה הראשון: `if value < low then return low`.",
      "אל תשכחו את המקרה שבו value בתוך הטווח: אז מחזירים את value.",
    ],
    harness: casesHarness("clamp", ["clamp(50, 0, 100)", "clamp(-5, 0, 100)", "clamp(150, 0, 100)", "clamp(0, 0, 100)", "clamp(100, 0, 100)", "clamp(7, 10, 20)", "clamp(2.5, 1, 3)"]),
    checks: [
      functionExists("clamp"),
      caseCheck("ערך בתוך הטווח נשאר כמו שהוא", 0, expectNumber(50, (c) => `clamp(50, 0, 100) החזיר ${c.value}. ערך בתוך הטווח צריך לחזור כמו שהוא.`)),
      caseCheck("ערך נמוך מדי → low", 1, expectNumber(0)),
      caseCheck("ערך גבוה מדי → high", 2, expectNumber(100)),
      caseCheck("בדיוק על הגבול התחתון", 3, expectNumber(0)),
      caseCheck("בדיוק על הגבול העליון", 4, expectNumber(100)),
      caseCheck("טווח אחר (10–20)", 5, expectNumber(10, () => "נראה שהמספרים 0 ו־100 כתובים בקוד ביד. השתמשו בפרמטרים low ו־high.")),
      caseCheck("עובד גם עם מספרים עשרוניים", 6, expectNumber(2.5)),
    ],
    solution: "function clamp(value, low, high)\n  if value < low then\n    return low\n  elseif value > high then\n    return high\n  else\n    return value\n  end\nend",
    solutionExplanation: "שני התנאים הראשונים מטפלים בחריגה מהטווח. אם אף אחד מהם לא מתקיים, value בתוך הטווח ומוחזר כמו שהוא.",
  },
};

const lists: Lesson = {
  id: "lua-08-tables-lists",
  courseId: COURSE,
  title: "טבלאות כרשימות",
  summary: "לשמור הרבה ערכים במקום אחד",
  minutes: 12,
  premium: true,
  xp: 100,
  objective: "ליצור רשימה, לעבור עליה עם `ipairs` ולחשב ממנה תוצאה.",
  explanation: [
    { type: "p", text: "ב־Lua יש מבנה נתונים אחד מרכזי: **טבלה** (table). השימוש הראשון בה הוא רשימה של ערכים:" },
    { type: "code", code: 'local weapons = {"Sword", "Bow", "Staff"}\nprint(weapons[1])\nprint(#weapons)', output: "Sword\n3" },
    { type: "warn", text: "ב־Lua הספירה מתחילה מ־1, לא מ־0 כמו בהרבה שפות אחרות." },
    { type: "p", text: "כדי לעבור על כל הרשימה משתמשים ב־`ipairs`, שנותן בכל סיבוב את המיקום ואת הערך:" },
    { type: "code", code: "local scores = {10, 25, 5}\nlocal best = 0\nfor i, s in ipairs(scores) do\n  if s > best then best = s end\nend\nprint(best)", output: "25" },
    { type: "code", code: 'local bag = {}\ntable.insert(bag, "Potion")\nprint(#bag)', output: "1", caption: "הוספת ערך לסוף רשימה" },
  ],
  quiz: {
    question: "מה ידפיס `print(colors[2])`?",
    code: 'local colors = {"red", "green", "blue"}',
    options: [
      { text: "red", why: "red נמצא במקום 1." },
      { text: "green", correct: true, why: "נכון! ב־Lua המקום הראשון הוא 1, ולכן המקום השני הוא green." },
      { text: "blue", why: "זה היה נכון אם הספירה הייתה מתחילה מ־0 – אבל ב־Lua היא מתחילה מ־1." },
    ],
  },
  challenge: {
    instructions: [
      { type: "p", text: "כתבו פונקציה `average(numbers)` שמקבלת רשימה של מספרים ומחזירה את הממוצע שלהם." },
      { type: "p", text: "אם הרשימה ריקה – החזירו 0 (אסור לחלק באפס!)." },
    ],
    fileName: "lists.lua",
    starterCode: "function average(numbers)\n\nend\n\nprint(average({10, 20, 30})) -- צריך להדפיס 20\n",
    hints: [
      "ממוצע = סכום כל המספרים חלקי כמה מספרים יש. את הכמות נותן `#numbers`.",
      "צברו סכום בלולאת `for _, n in ipairs(numbers) do ... end`.",
      "בתחילת הפונקציה, בדקו: `if #numbers == 0 then return 0 end`.",
    ],
    harness: casesHarness("average", ["average({10, 20, 30})", "average({5})", "average({1, 2})", "average({})", "average({-4, 4, 9})"]),
    checks: [
      functionExists("average"),
      caseCheck("ממוצע של {10, 20, 30} = 20", 0, expectNumber(20, (c) => (c.num === 60 ? "יצא 60 – זה הסכום. נשאר לחלק בכמות המספרים." : `יצא ${c.value} במקום 20.`))),
      caseCheck("רשימה עם מספר אחד", 1, expectNumber(5)),
      caseCheck("ממוצע לא שלם {1, 2} = 1.5", 2, expectNumber(1.5, (c) => (c.num === 1 ? "יצא 1 – נראה שהשתמשתם ב־`//` (חילוק שלם). השתמשו ב־`/`." : `יצא ${c.value}.`))),
      caseCheck("רשימה ריקה → 0", 3, (c) => (c.type === "number" && c.num === 0 ? true : c.value === "nan" || c.value === "-nan" ? "רשימה ריקה גרמה לחילוק 0 ב־0. הוסיפו בדיקה בתחילת הפונקציה." : expectNumber(0)(c))),
      caseCheck("עובד עם מספרים שליליים", 4, expectNumber(3)),
    ],
    solution: "function average(numbers)\n  if #numbers == 0 then\n    return 0\n  end\n  local sum = 0\n  for _, n in ipairs(numbers) do\n    sum = sum + n\n  end\n  return sum / #numbers\nend",
    solutionExplanation: "קודם מטפלים במקרה המיוחד של רשימה ריקה. אחר כך צוברים סכום עם ipairs ומחלקים במספר האיברים. `_` הוא שם מקובל למשתנה שלא משתמשים בו.",
  },
};

const dictionaries: Lesson = {
  id: "lua-09-tables-maps",
  courseId: COURSE,
  title: "טבלאות כמילון",
  summary: "מפתח וערך – כמו מלאי של שחקן",
  minutes: 12,
  premium: true,
  xp: 100,
  objective: "לשמור נתונים לפי שם (מפתח), לקרוא ולעדכן אותם, ולעבור עליהם עם `pairs`.",
  explanation: [
    { type: "p", text: "טבלה יכולה לשמור ערכים גם לפי **שם** במקום לפי מספר. זה מושלם לתיאור שחקן, הגדרות או מלאי:" },
    { type: "code", code: 'local player = { name = "Nova", hp = 100 }\nprint(player.name)\nplayer.hp = player.hp - 30\nprint(player.hp)', output: "Nova\n70" },
    { type: "p", text: "כשהמפתח נמצא בתוך משתנה, משתמשים בסוגריים מרובעים:" },
    { type: "code", code: 'local inventory = { apple = 3, sword = 1 }\nlocal item = "apple"\nprint(inventory[item])\nprint(inventory["shield"])', output: "3\nnil" },
    { type: "p", text: "מפתח שלא קיים מחזיר `nil`. כדי לעבור על כל המפתחות משתמשים ב־`pairs` (הסדר לא מובטח):" },
    { type: "code", code: "for item, count in pairs(inventory) do\n  print(item, count)\nend" },
  ],
  quiz: {
    question: "מה הערך של `stats.mana` אחרי הקוד?",
    code: "local stats = { hp = 50 }\nstats.mana = 20\nstats.mana = stats.mana + 5",
    options: [
      { text: "nil", why: "השורה השנייה יוצרת את המפתח mana – אפשר להוסיף מפתחות בכל רגע." },
      { text: "20", why: "השורה השלישית מוסיפה עוד 5." },
      { text: "25", correct: true, why: "נכון! מוסיפים מפתח חדש עם ערך 20, ואז מעדכנים אותו ל־25." },
    ],
  },
  challenge: {
    instructions: [
      { type: "p", text: "המלאי של שחקן הוא טבלה שבה המפתח הוא שם הפריט והערך הוא הכמות, למשל `{ apple = 3, potion = 5 }`. כתבו שתי פונקציות:" },
      { type: "list", items: [
        "`countItems(inventory)` – מחזירה את הכמות הכוללת של כל הפריטים (בדוגמה: 8).",
        "`hasItem(inventory, name)` – מחזירה `true` אם יש לפחות פריט אחד בשם הזה, אחרת `false`.",
      ] },
    ],
    fileName: "inventory.lua",
    starterCode: "function countItems(inventory)\n\nend\n\nfunction hasItem(inventory, name)\n\nend\n\nlocal bag = { apple = 3, potion = 5 }\nprint(countItems(bag), hasItem(bag, \"apple\"))\n",
    hints: [
      "ב־countItems עברו על הטבלה עם `for name, count in pairs(inventory) do` וצברו את count.",
      "ב־hasItem, `inventory[name]` נותן את הכמות – או nil אם הפריט לא קיים.",
      "פריט עם כמות 0 לא נחשב. אפשר לכתוב: `local count = inventory[name]` ואז לבדוק `count ~= nil and count > 0`.",
    ],
    harness: `
__cq.mute(true)
local __exprs = {
  function() return countItems({ apple = 3, potion = 5 }) end,
  function() return countItems({}) end,
  function() return countItems({ sword = 1, gold = 250, arrow = 40 }) end,
  function() return hasItem({ apple = 3 }, "apple") end,
  function() return hasItem({ apple = 3 }, "shield") end,
  function() return hasItem({ apple = 0 }, "apple") end,
}
local __res = { exists = __cq.type(countItems) == "function" and __cq.type(hasItem) == "function", cases = {}, missing = {} }
if __cq.type(countItems) ~= "function" then __res.missing[#__res.missing + 1] = "countItems" end
if __cq.type(hasItem) ~= "function" then __res.missing[#__res.missing + 1] = "hasItem" end
if __res.exists then
  for __i = 1, #__exprs do
    local __ok, __v = __cq.call(__exprs[__i])
    __res.cases[__i] = { ok = __ok, type = __cq.type(__v), value = tostring(__v), num = (__cq.type(__v) == "number") and __v or nil }
  end
end
__cq.report(__res)
`,
    checks: [
      {
        label: "שתי הפונקציות קיימות",
        test: (ctx) => (ctx.r.exists ? true : `חסרה פונקציה: ${(ctx.r.missing as string[]).map((m) => "`" + m + "`").join(", ")}.`),
      },
      caseCheck("countItems סופר כמויות (לא סוגי פריטים)", 0, expectNumber(8, (c) => (c.num === 2 ? "יצא 2 – ספרתם כמה סוגי פריטים יש, במקום לחבר את הכמויות." : `יצא ${c.value} במקום 8.`))),
      caseCheck("countItems של מלאי ריק = 0", 1, expectNumber(0)),
      caseCheck("countItems עם מלאי גדול", 2, expectNumber(291)),
      caseCheck("hasItem מוצא פריט קיים", 3, expectBoolean(true)),
      caseCheck("hasItem לפריט שלא קיים → false", 4, expectBoolean(false, "לפריט שלא קיים צריך להחזיר false. שימו לב: `inventory[name]` מחזיר nil, ו־nil הוא לא false – החזירו false במפורש.")),
      caseCheck("hasItem לפריט עם כמות 0 → false", 5, expectBoolean(false, "פריט עם כמות 0 – אין לשחקן אותו בפועל. בדקו שהכמות גדולה מ־0.")),
    ],
    solution: "function countItems(inventory)\n  local total = 0\n  for _, count in pairs(inventory) do\n    total = total + count\n  end\n  return total\nend\n\nfunction hasItem(inventory, name)\n  local count = inventory[name]\n  return count ~= nil and count > 0\nend",
    solutionExplanation: "pairs עובר על כל זוגות המפתח־ערך, ואנחנו צוברים רק את הערכים. ב־hasItem הביטוי `count ~= nil and count > 0` כבר מחזיר true או false בעצמו.",
  },
};

const project: Lesson = {
  id: "lua-10-project-xp",
  courseId: COURSE,
  title: "פרויקט: מערכת XP למשחק",
  summary: "לחבר את כל מה שלמדתם",
  minutes: 20,
  premium: true,
  xp: 150,
  objective: "לבנות מערכת קטנה ואמיתית שמשלבת משתנים, תנאים, פונקציות וטבלאות.",
  explanation: [
    { type: "p", text: "הגיע הזמן לבנות משהו שלם! כמעט בכל משחק יש מערכת ניסיון (XP) ורמות. נבנה אחת כזו." },
    { type: "p", text: "שחקן יתואר כטבלה:" },
    { type: "code", code: "local player = { name = \"Nova\", xp = 0, level = 1 }" },
    { type: "p", text: "החוקים: כל 100 XP הם רמה. 0–99 XP זו רמה 1, 100–199 רמה 2, וכן הלאה. כדי לעגל מספר כלפי מטה משתמשים ב־`//` (חילוק שלם) או ב־`math.floor`:" },
    { type: "code", code: "print(250 // 100)\nprint(math.floor(7.9))", output: "2\n7" },
    { type: "p", text: "פונקציה יכולה **לשנות** טבלה שהיא מקבלת – השינוי נשאר גם אחרי שהפונקציה מסתיימת:" },
    { type: "code", code: "function heal(p)\n  p.hp = 100\nend\nlocal hero = { hp = 10 }\nheal(hero)\nprint(hero.hp)", output: "100" },
  ],
  quiz: {
    question: "באיזו רמה נמצא שחקן עם 199 XP לפי החוקים?",
    options: [
      { text: "רמה 1", why: "רמה 1 היא 0–99." },
      { text: "רמה 2", correct: true, why: "נכון! 199 // 100 = 1, ועוד 1 = רמה 2." },
      { text: "רמה 3", why: "רמה 3 מתחילה רק ב־200 XP." },
    ],
  },
  challenge: {
    instructions: [
      { type: "p", text: "כתבו שתי פונקציות:" },
      { type: "list", items: [
        "`levelFromXp(xp)` – מחזירה את הרמה לפי החוקים (0 → 1, 99 → 1, 100 → 2, 250 → 3).",
        "`addXp(player, amount)` – מוסיפה amount ל־player.xp ומעדכנת את player.level. אם amount לא חיובי (0 או שלילי) – לא משנה כלום ומחזירה `false`. אחרת מחזירה `true`.",
      ] },
      { type: "tip", text: "addXp יכולה להשתמש ב־levelFromXp. פונקציות שמשתמשות זו בזו – זה בדיוק תכנות טוב." },
    ],
    fileName: "xp_system.lua",
    starterCode: "function levelFromXp(xp)\n\nend\n\nfunction addXp(player, amount)\n\nend\n\nlocal hero = { name = \"Nova\", xp = 0, level = 1 }\naddXp(hero, 150)\nprint(hero.xp, hero.level) -- צריך להדפיס 150  2\n",
    hints: [
      "levelFromXp: חלקו ב־100 עם `//` והוסיפו 1.",
      "addXp: התחילו בבדיקה `if amount <= 0 then return false end`.",
      "אחרי שמוסיפים ל־player.xp, עדכנו: `player.level = levelFromXp(player.xp)` ואז `return true`.",
    ],
    harness: `
__cq.mute(true)
local __exprs = {
  function() return levelFromXp(0) end,
  function() return levelFromXp(99) end,
  function() return levelFromXp(100) end,
  function() return levelFromXp(250) end,
  function() local p = { xp = 0, level = 1 }; addXp(p, 150); return p.xp end,
  function() local p = { xp = 0, level = 1 }; addXp(p, 150); return p.level end,
  function() local p = { xp = 90, level = 1 }; addXp(p, 20); addXp(p, 300); return p.level end,
  function() local p = { xp = 50, level = 1 }; return addXp(p, 10) end,
  function() local p = { xp = 50, level = 1 }; return addXp(p, -40) end,
  function() local p = { xp = 50, level = 1 }; addXp(p, -40); addXp(p, 0); return p.xp end,
}
local __res = { exists = __cq.type(levelFromXp) == "function" and __cq.type(addXp) == "function", cases = {} }
if __res.exists then
  for __i = 1, #__exprs do
    local __ok, __v = __cq.call(__exprs[__i])
    __res.cases[__i] = { ok = __ok, type = __cq.type(__v), value = tostring(__v), num = (__cq.type(__v) == "number") and __v or nil }
  end
end
__cq.report(__res)
`,
    checks: [
      { label: "שתי הפונקציות קיימות", test: (ctx) => (ctx.r.exists ? true : "צריך את שתי הפונקציות: `levelFromXp` ו־`addXp`.") },
      caseCheck("0 XP → רמה 1", 0, expectNumber(1, (c) => (c.num === 0 ? "יצא 0. הרמה הראשונה היא 1 – אל תשכחו להוסיף 1." : `יצא ${c.value}.`))),
      caseCheck("99 XP → רמה 1", 1, expectNumber(1, (c) => (c.num !== undefined && !Number.isInteger(c.num) ? `יצא ${c.value} – צריך לעגל למטה עם \`//\` או \`math.floor\`.` : `יצא ${c.value}.`))),
      caseCheck("100 XP → רמה 2", 2, expectNumber(2)),
      caseCheck("250 XP → רמה 3", 3, expectNumber(3)),
      caseCheck("addXp מוסיף ל־xp", 4, expectNumber(150, (c) => `אחרי הוספה של 150, player.xp הוא ${c.value}.`)),
      caseCheck("addXp מעדכן level", 5, expectNumber(2, () => "ה־XP עודכן אבל הרמה לא. עדכנו את player.level אחרי ההוספה.")),
      caseCheck("כמה הוספות ברצף", 6, expectNumber(5)),
      caseCheck("addXp מחזיר true בהצלחה", 7, expectBoolean(true, "בהוספה תקינה addXp צריכה להחזיר true.")),
      caseCheck("כמות שלילית → false", 8, expectBoolean(false, "כמות שלילית צריכה להחזיר false.")),
      caseCheck("כמות שלילית או 0 לא משנה את xp", 9, expectNumber(50, (c) => `xp השתנה ל־${c.value}, אבל כמות לא חיובית לא אמורה לשנות כלום.`)),
    ],
    solution: "function levelFromXp(xp)\n  return xp // 100 + 1\nend\n\nfunction addXp(player, amount)\n  if amount <= 0 then\n    return false\n  end\n  player.xp = player.xp + amount\n  player.level = levelFromXp(player.xp)\n  return true\nend",
    solutionExplanation: "levelFromXp מחלקת בחילוק שלם ומוסיפה 1. addXp מסננת קודם קלט לא תקין (\"guard clause\"), ורק אז משנה את הטבלה של השחקן ומשתמשת שוב ב־levelFromXp.",
  },
};

export const luaBasics: Course = {
  id: COURSE,
  trackId: "lua-general",
  title: "Lua מאפס",
  description: "המסלול המלא למתחילים: מההדפסה הראשונה ועד מערכת XP אמיתית למשחק.",
  level: "מתחילים",
  status: "available",
  lessons: [hello, variables, numbers, strings, conditions, loops, functionsLesson, lists, dictionaries, project],
};
