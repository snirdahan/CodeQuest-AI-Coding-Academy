"use client";

export function LogoutButton() {
  return (
    <button
      className="w-full rounded-lg px-3 py-2 text-start text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      התנתקות
    </button>
  );
}
