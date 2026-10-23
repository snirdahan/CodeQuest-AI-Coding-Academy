"use client";

import { useState } from "react";
import { Button } from "./ui";

export function VsCodeConnect({ connected }: { connected: number }) {
  const [link, setLink] = useState<string | null>(null);
  const [revoked, setRevoked] = useState(false);

  async function connect() {
    const res = await fetch("/api/vscode/pair", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    const j = await res.json();
    setLink(j.uri);
    window.location.href = j.uri;
  }
  async function revoke() {
    await fetch("/api/vscode/revoke", { method: "POST" });
    setRevoked(true);
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-400">{revoked ? "כל החיבורים נותקו." : connected > 0 ? `מחובר: ${connected} התקנות של VS Code.` : "עוד לא חיברתם VS Code."}</div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={connect} size="lg">🧩 חיבור VS Code</Button>
        {connected > 0 && !revoked && <Button variant="secondary" onClick={revoke}>ניתוק כל החיבורים</Button>}
      </div>
      {link && (
        <p className="text-sm text-slate-400">
          אם VS Code לא נפתח, ודאו שהתוסף מותקן ולחצו שוב. הקישור תקף ל־10 דקות ולשימוש אחד.
        </p>
      )}
    </div>
  );
}
