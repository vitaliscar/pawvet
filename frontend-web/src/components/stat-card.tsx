import type { LucideIcon } from 'lucide-react';

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-paw-100 bg-white p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-paw-50 text-paw-600">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <span className="text-sm font-medium text-ink/60">{label}</span>
      </div>
      <p className="mt-4 font-display text-4xl font-bold tracking-tight text-paw-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
    </div>
  );
}
