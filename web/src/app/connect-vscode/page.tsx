import { AppShell } from "@/components/app-shell";
import { CodeBlock } from "@/components/rich-text";
import { Card } from "@/components/ui";
import { VsCodeConnect } from "@/components/vscode-connect";
import { listExtensionTokens } from "@/lib/auth";
import { requireUser } from "@/lib/session";

export default async function ConnectVsCodePage() {
  const user = await requireUser();
  const tokens = listExtensionTokens(user.id);
  return (
    <AppShell user={user} active="/connect-vscode">
      <h1 className="text-3xl font-bold">תרגול ב־Visual Studio Code</h1>
      <p className="mt-1 mb-8 max-w-2xl text-slate-400">מתכנתים אמיתיים עובדים בעורך קוד. התוסף של CodeQuest פותח את התרגיל ב־VS Code, מציג את ההוראות בפאנל צד, בודק את הפתרון ומסנכרן את ה־XP לכאן.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">1. התקנה (פעם אחת)</h2>
          <ol className="list-decimal space-y-2 ps-5 text-slate-300">
            <li>התקינו את <a className="text-blue-300 hover:underline" href="https://code.visualstudio.com/" target="_blank" rel="noreferrer">Visual Studio Code</a> (חינמי).</li>
            <li>התקינו את תוסף CodeQuest מקובץ ה־VSIX: ב־VS Code פתחו את לשונית Extensions, לחצו על ⋯ ובחרו <span dir="ltr">Install from VSIX…</span></li>
            <li>מומלץ: התקינו גם תוסף Lua (למשל של sumneko) בשביל צביעת קוד והשלמה אוטומטית.</li>
          </ol>
          <p className="text-xs text-slate-500">התוסף עוד לא פורסם ב־Marketplace – זה יקרה לקראת ההשקה.</p>
        </Card>
        <Card className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">2. חיבור החשבון</h2>
          <VsCodeConnect connected={tokens.length} />
          <p className="text-xs text-slate-500">החיבור מאובטח: הקישור מכיל קוד חד־פעמי שמוחלף בטוקן שנשמר מוצפן ב־VS Code. התוסף שולח לשרת רק את קובץ התרגיל, ולא נוגע בשום קובץ אחר במחשב.</p>
        </Card>
        <Card className="space-y-3 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">3. תרגול</h2>
          <p className="text-slate-300">בכל שיעור יש כפתור <b>&quot;תרגל ב־VS Code&quot;</b>. הוא פותח את התרגיל, ואז ב־VS Code לוחצים <b>Check Solution</b> בפאנל או משתמשים בפקודה:</p>
          <CodeBlock caption="Command Palette (Ctrl+Shift+P)" code="CodeQuest: Check Solution" />
        </Card>
      </div>
    </AppShell>
  );
}
