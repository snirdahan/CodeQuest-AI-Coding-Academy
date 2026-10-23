import type { Course, Language, Lesson, Track } from "./types";
import { luaBasics } from "./lua/lua-basics";

// The full product catalog. Only content with status "available" is playable;
// everything else is shown honestly as "בקרוב" / "בפיתוח".
export const LANGUAGES: Language[] = [
  {
    id: "lua",
    name: "Lua",
    tagline: "השפה של FiveM, Roblox ומנועי משחק",
    status: "available",
    color: "from-blue-500 to-indigo-600",
    glyph: "🌙",
    tracks: [
      {
        id: "lua-general",
        languageId: "lua",
        title: "Lua כללי",
        subtitle: "הבסיס לכל השאר",
        description: "לומדים את שפת Lua האמיתית (גרסה 5.4) – משתנים, תנאים, לולאות, פונקציות וטבלאות. הקוד שלכם רץ ונבדק באמת.",
        status: "available",
        premium: false,
        icon: "🌙",
        courses: [luaBasics],
      },
      {
        id: "lua-fivem",
        languageId: "lua",
        title: "FiveM Development",
        subtitle: "סקריפטים לשרתי GTA V",
        description: "client ו־server scripts, ‏fxmanifest.lua, אירועים ופקודות – לפי ה־API המתועד של FiveM (Cfx.re).",
        status: "in-progress",
        premium: true,
        icon: "🚓",
        environmentNote: "חלקי ה־Lua הטהורים נבדקים כאן. התנהגות מנוע אמיתית (Natives, רשת, שחקנים) דורשת שרת FiveM מקומי – נסביר בדיוק איך להקים אותו.",
        courses: [],
        roadmap: ["מבנה resource ו־fxmanifest.lua", "client מול server", "RegisterCommand – פקודה ראשונה", "אירועים: RegisterNetEvent ו־TriggerServerEvent", "Threads: CreateThread ו־Wait", "פרויקט: מערכת כסף פשוטה"],
      },
      {
        id: "lua-roblox",
        languageId: "lua",
        title: "Roblox Luau",
        subtitle: "פיתוח משחקים ב־Roblox",
        description: "Luau היא שפה שנבנתה מ־Lua 5.1 עם תוספות משלה (טיפוסים, continue, ‏+=). נלמד את ההבדלים ואת העבודה עם Roblox Studio.",
        status: "planned",
        premium: true,
        icon: "🧱",
        environmentNote: "כל מה שקשור ל־Instances, Services ו־Parts דורש Roblox Studio (חינמי, Windows/Mac).",
        courses: [],
        roadmap: ["Luau מול Lua – מה שונה", "Roblox Studio – סיור ראשון", "Scripts, LocalScripts ו־ModuleScripts", "אירועים: Touched ו־PlayerAdded", "פרויקט: Obby עם נקודות"],
      },
    ],
  },
  {
    id: "html-css",
    name: "HTML & CSS",
    tagline: "לבנות דפי אינטרנט יפים",
    status: "in-progress",
    color: "from-orange-500 to-pink-600",
    glyph: "🎨",
    tracks: [
      {
        id: "html-css-basics",
        languageId: "html-css",
        title: "HTML & CSS למתחילים",
        subtitle: "הדף הראשון שלכם",
        description: "מבנה מסמך, טפסים וקישורים, עיצוב, Flexbox ו־Grid ועיצוב רספונסיבי – עם תצוגה מקדימה חיה ומבודדת בדפדפן.",
        status: "in-progress",
        premium: false,
        icon: "🎨",
        courses: [],
        roadmap: ["מבנה מסמך HTML", "כותרות, פסקאות ותמונות", "קישורים וטפסים", "אלמנטים סמנטיים", "CSS: צבעים וגופנים", "Flexbox", "Grid", "פרויקט: כרטיס פרופיל רספונסיבי"],
      },
    ],
  },
  {
    id: "javascript",
    name: "JavaScript",
    tagline: "להפוך דפים לאינטראקטיביים",
    status: "planned",
    color: "from-yellow-400 to-amber-600",
    glyph: "⚡",
    tracks: [
      {
        id: "js-basics",
        languageId: "javascript",
        title: "JavaScript מאפס",
        subtitle: "יסודות, DOM ואירועים",
        description: "יסודות, פונקציות ומערכים, DOM, אירועים ותכנות אסינכרוני.",
        status: "planned",
        premium: false,
        icon: "⚡",
        courses: [],
        roadmap: ["יסודות", "פונקציות ומערכים", "DOM", "אירועים", "async/await", "פרויקט בדפדפן"],
      },
    ],
  },
  {
    id: "java",
    name: "Java",
    tagline: "תכנות מונחה עצמים ברמה מקצועית",
    status: "planned",
    color: "from-red-500 to-orange-600",
    glyph: "☕",
    tracks: [
      {
        id: "java-basics",
        languageId: "java",
        title: "Java מהבסיס ועד מתקדם",
        subtitle: "משתנים ועד OOP",
        description: "משתנים וטיפוסים, תנאים ולולאות, מתודות ומחלקות, OOP, Collections וטיפול בשגיאות.",
        status: "planned",
        premium: true,
        icon: "☕",
        environmentNote: "הרצת Java דורשת JVM בסביבה מבודדת בשרת נפרד, או JDK מקומי דרך תוסף VS Code.",
        courses: [],
        roadmap: ["משתנים וטיפוסים", "תנאים ולולאות", "מתודות ומחלקות", "OOP", "Collections", "Exceptions", "פרויקטים"],
      },
    ],
  },
  {
    id: "python",
    name: "Python",
    tagline: "בעתיד",
    status: "planned",
    color: "from-sky-500 to-emerald-500",
    glyph: "🐍",
    tracks: [],
  },
];

export const ALL_TRACKS: Track[] = LANGUAGES.flatMap((l) => l.tracks);
export const ALL_COURSES: Course[] = ALL_TRACKS.flatMap((t) => t.courses);
export const ALL_LESSONS: Lesson[] = ALL_COURSES.flatMap((c) => c.lessons);

export const getLanguage = (id: string) => LANGUAGES.find((l) => l.id === id);
export const getTrack = (id: string) => ALL_TRACKS.find((t) => t.id === id);
export const getCourse = (id: string) => ALL_COURSES.find((c) => c.id === id);
export const getLesson = (id: string) => ALL_LESSONS.find((l) => l.id === id);

export function nextLessonOf(lessonId: string): Lesson | undefined {
  const lesson = getLesson(lessonId);
  if (!lesson) return undefined;
  const course = getCourse(lesson.courseId)!;
  const i = course.lessons.findIndex((l) => l.id === lessonId);
  return course.lessons[i + 1];
}

export const QUIZ_XP = 10;
