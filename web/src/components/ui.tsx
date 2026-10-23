import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-glow disabled:opacity-50 disabled:pointer-events-none";
const variants = {
  primary:
    "bg-gradient-to-l from-electric to-violet text-white shadow-[0_8px_30px_-8px_rgb(99_102_241/0.6)] hover:shadow-[0_10px_40px_-6px_rgb(139_92_246/0.75)] hover:-translate-y-0.5",
  secondary: "glass text-slate-100 hover:bg-white/10",
  ghost: "text-slate-300 hover:text-white hover:bg-white/5",
  success: "bg-emerald-500/90 text-white hover:bg-emerald-500",
};
const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

export function Button({ variant = "primary", size = "md", className = "", ...rest }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}

export function LinkButton({ variant = "primary", size = "md", className = "", ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}

export function Card({ className = "", children, ...rest }: ComponentProps<"div">) {
  return (
    <div className={`glass rounded-2xl p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

const badgeTones = {
  blue: "bg-electric/15 text-blue-300 border-electric/30",
  violet: "bg-violet/15 text-violet-300 border-violet/30",
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  gray: "bg-white/5 text-slate-400 border-white/10",
  red: "bg-red-500/15 text-red-300 border-red-500/30",
};

export function Badge({ tone = "blue", children, className = "" }: { tone?: keyof typeof badgeTones; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeTones[tone]} ${className}`}>{children}</span>;
}

export function ProgressBar({ value, max, className = "" }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-white/5 ${className}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-l from-electric to-violet transition-[width] duration-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatusBadge({ status }: { status: "available" | "in-progress" | "planned" }) {
  if (status === "available") return <Badge tone="green">● זמין עכשיו</Badge>;
  if (status === "in-progress") return <Badge tone="amber">בפיתוח</Badge>;
  return <Badge tone="gray">בקרוב</Badge>;
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${className}`} dir="ltr">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-electric to-violet text-sm text-white shadow-lg shadow-violet/30">{"</>"}</span>
      <span>
        Code<span className="text-gradient">Quest</span>
      </span>
    </span>
  );
}
