import { PawPrint } from 'lucide-react';

export function Logo({
  variant = 'dark',
  size = 'md',
}: {
  variant?: 'dark' | 'light';
  size?: 'md' | 'lg';
}) {
  const textColor = variant === 'dark' ? 'text-paw-950' : 'text-cream';
  const iconBg = variant === 'dark' ? 'bg-paw-600 text-cream' : 'bg-clay-400 text-cream';
  const iconSize = size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  const textSize = size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <span className="flex items-center gap-2">
      <span
        className={`flex ${iconSize} items-center justify-center rounded-xl ${iconBg}`}
        aria-hidden
      >
        <PawPrint className={size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'} />
      </span>
      <span className={`font-display ${textSize} font-bold tracking-tight ${textColor}`}>
        PAWVET
      </span>
    </span>
  );
}
