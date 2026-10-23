// Deterministic, free explanations of common Lua errors in simple Hebrew.
// The AI mentor is only needed when none of these patterns match.

interface Rule {
  re: RegExp;
  explain: (m: RegExpMatchArray) => string;
}

const RULES: Rule[] = [
  {
    re: /attempt to call a nil value \((?:global|local|field|method) '([^']+)'\)/,
    explain: (m) =>
      `ניסיתם להפעיל פונקציה בשם \`${m[1]}\`, אבל אין פונקציה כזו. בדקו טעויות הקלדה (למשל \`prnt\` במקום \`print\`) ואותיות גדולות/קטנות. אם זו פונקציה שלכם – ודאו שהיא מוגדרת לפני השורה שקוראת לה.`,
  },
  {
    re: /attempt to concatenate a nil value \((?:global|local|field) '([^']+)'\)/,
    explain: (m) =>
      `ניסיתם לחבר טקסט עם \`${m[1]}\`, אבל הערך שלו הוא nil (כלום). כנראה שהמשתנה לא נוצר, או שיש טעות הקלדה בשם שלו.`,
  },
  {
    re: /attempt to perform arithmetic on a string value|attempt to (?:add|sub|mul|div|mod|pow|unm|idiv) a 'string' with/,
    explain: () =>
      "ניסיתם לעשות חשבון (+, -, *, /) עם טקסט. אם רציתם לחבר טקסטים – ב־Lua משתמשים ב־`..` ולא ב־`+`. אם זה מספר שנשמר במירכאות – הורידו את המירכאות.",
  },
  {
    re: /attempt to perform arithmetic on a nil value \((?:global|local|field) '([^']+)'\)/,
    explain: (m) => `ניסיתם לחשב עם \`${m[1]}\`, אבל הערך שלו הוא nil. ודאו שהמשתנה קיים ושהשם שלו כתוב נכון.`,
  },
  {
    re: /attempt to perform arithmetic on a nil value/,
    explain: () => "ניסיתם לחשב עם ערך שהוא nil (כלום). אחד המשתנים בחישוב לא קיים או לא קיבל ערך.",
  },
  {
    re: /attempt to index a nil value \((?:global|local|field) '([^']+)'\)/,
    explain: (m) =>
      `ניסיתם לגשת לתוך \`${m[1]}\` (עם נקודה או סוגריים מרובעים), אבל הוא nil – לא טבלה. בדקו שהטבלה נוצרה ושהשם נכון.`,
  },
  {
    re: /attempt to compare (\w+) with (\w+)/,
    explain: (m) => `ניסיתם להשוות ${heb(m[1])} עם ${heb(m[2])}. אפשר להשוות בעזרת < או > רק בין שני מספרים או בין שני טקסטים.`,
  },
  {
    re: /attempt to get length of a (\w+) value/,
    explain: (m) => `הסימן \`#\` עובד רק על טקסט או טבלה, אבל קיבל ${heb(m[1])}.`,
  },
  {
    re: /'end' expected/,
    explain: () =>
      "חסרה המילה `end`. כל `function`, ‏`if`, ‏`for` ו־`while` צריכים `end` משלהם. ספרו אותם – לכל פתיחה צריכה להיות סגירה.",
  },
  {
    re: /'then' expected/,
    explain: () => "אחרי התנאי של `if` או `elseif` צריך לכתוב `then`.",
  },
  {
    re: /'do' expected/,
    explain: () => "אחרי ההגדרה של `for` או `while` צריך לכתוב `do`.",
  },
  {
    re: /'=' expected near/,
    explain: () =>
      "Lua ציפתה ל־`=` במקום הזה. זה קורה בדרך כלל כשכותבים מילה בלי פקודה – למשל שם משתנה לבד בשורה, או `print` עם טעות.",
  },
  {
    re: /'\)' expected/,
    explain: () => "חסר סוגר עגול `)`. בדקו שלכל `(` יש סגירה. גם פסיק חסר בין ערכים יכול לגרום לזה.",
  },
  {
    re: /unfinished string/,
    explain: () => "טקסט נפתח במירכאות ולא נסגר. ודאו שיש מירכאות גם בסוף הטקסט, ושהן מאותו סוג (\" או ').",
  },
  {
    re: /unexpected symbol near '!'|unexpected symbol near '!='/,
    explain: () => "ב־Lua \"לא שווה\" נכתב `~=` ולא `!=`.",
  },
  {
    re: /unexpected symbol near/,
    explain: () =>
      "יש תו או מילה במקום לא צפוי. בדקו את השורה המסומנת: מירכאות חסרות, סימן מיותר, או `=` בתוך תנאי במקום `==`.",
  },
  {
    re: /'<eof>' expected near 'end'/,
    explain: () => "יש `end` מיותר – יותר סגירות מפתיחות. מחקו את ה־end העודף.",
  },
];

function heb(t: string) {
  return ({ number: "מספר", string: "טקסט", nil: "nil", table: "טבלה", boolean: "ערך אמת" } as Record<string, string>)[t] ?? t;
}

export function explainLuaError(kind: string, message: string): string {
  if (kind === "timeout") {
    return "התוכנית רצה יותר מדי זמן ונעצרה. בדרך כלל זו לולאה שלא נגמרת – בדקו שהתנאי של ה־while מפסיק להתקיים בשלב מסוים.";
  }
  if (kind === "memory") {
    return "התוכנית ניסתה להשתמש ביותר מדי זיכרון. כנראה לולאה שמוסיפה לטבלה או לטקסט בלי סוף.";
  }
  if (kind === "internal") {
    return "משהו השתבש בצד שלנו בזמן הבדיקה. נסו שוב בעוד רגע.";
  }
  for (const r of RULES) {
    const m = message.match(r.re);
    if (m) return r.explain(m);
  }
  return kind === "syntax"
    ? "Lua לא הצליחה להבין את הקוד בשורה המסומנת. בדקו מירכאות, סוגריים, ומילים כמו then / do / end."
    : "התוכנית נעצרה בגלל שגיאה בזמן הריצה. קראו את ההודעה באנגלית ואת השורה המסומנת – ואם צריך, בקשו רמז.";
}
