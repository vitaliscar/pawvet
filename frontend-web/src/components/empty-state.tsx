import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-paw-200 bg-white px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paw-50 text-paw-500">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <p className="font-display text-lg font-semibold text-paw-950">{title}</p>
      {description && <p className="max-w-sm text-sm leading-relaxed text-ink/60">{description}</p>}
    </div>
  );
}
