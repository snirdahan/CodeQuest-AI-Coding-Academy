import type { Block } from "@/content/types";
import { Fragment } from "react";

/** Renders inline `code` and **bold** inside Hebrew text. Code spans are isolated LTR. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("`") && p.endsWith("`")) return <code key={i} className="inline-code">{p.slice(1, -1)}</code>;
        if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold text-white">{p.slice(2, -2)}</strong>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

export function CodeBlock({ code, output, caption }: { code: string; output?: string; caption?: string }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-white/10 bg-ink-900">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 text-xs text-slate-500">
        <span>{caption ?? "דוגמה"}</span>
        <span dir="ltr" className="font-mono">lua</span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-slate-200"><code>{code}</code></pre>
      {output !== undefined && (
        <div className="border-t border-white/5 bg-black/30 px-4 py-2">
          <div className="mb-1 text-xs text-slate-500">פלט</div>
          <pre className="font-mono text-sm text-emerald-300"><code>{output}</code></pre>
        </div>
      )}
    </figure>
  );
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4 leading-relaxed text-slate-300">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return <p key={i}><RichText text={b.text} /></p>;
          case "code":
            return <CodeBlock key={i} code={b.code} output={b.output} caption={b.caption} />;
          case "tip":
            return (
              <div key={i} className="flex gap-3 rounded-xl border border-electric/25 bg-electric/10 p-4 text-blue-100">
                <span aria-hidden>💡</span>
                <p><RichText text={b.text} /></p>
              </div>
            );
          case "warn":
            return (
              <div key={i} className="flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-4 text-amber-100">
                <span aria-hidden>⚠️</span>
                <p><RichText text={b.text} /></p>
              </div>
            );
          case "list":
            return (
              <ul key={i} className="list-disc space-y-1.5 ps-6 marker:text-violet-400">
                {b.items.map((it, j) => <li key={j}><RichText text={it} /></li>)}
              </ul>
            );
        }
      })}
    </div>
  );
}
