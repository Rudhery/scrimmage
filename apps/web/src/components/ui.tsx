import type { CSSProperties, ReactNode } from 'react';
import type { ScrimmageStatus } from '../api';

const STATUS: Record<ScrimmageStatus, { label: string; className: string }> = {
  proposed: { label: 'Proposed', className: 'text-proposed border-proposed/40 bg-proposed/10' },
  confirmed: {
    label: 'Confirmed',
    className: 'text-confirmed border-confirmed/40 bg-confirmed/10',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'text-cancelled border-cancelled/40 bg-cancelled/10',
  },
  played: { label: 'Played', className: 'text-played border-played/40 bg-played/10' },
};

export function StatusBadge({ status }: { status: ScrimmageStatus }) {
  const style = STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${style.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {style.label}
    </span>
  );
}

export function Crest({ tag, size = 'md' }: { tag: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims =
    size === 'lg' ? 'h-16 w-16 text-2xl' : size === 'sm' ? 'h-9 w-9 text-sm' : 'h-12 w-12 text-lg';
  return (
    <span
      className={`grid ${dims} shrink-0 place-items-center rounded-xl border border-line bg-surface2 font-display tracking-wider text-lime`}
    >
      {tag.slice(0, 3).toUpperCase()}
    </span>
  );
}

export function Panel({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`rounded-2xl border border-line bg-surface/70 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-baseline gap-3">
      <h2 className="font-display text-3xl tracking-tight">{label}</h2>
      {count !== undefined ? <span className="font-mono text-sm text-muted">{count}</span> : null}
    </div>
  );
}

export function StateBlock({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface/40 px-6 py-16 text-center">
      <p className="font-display text-2xl tracking-wide text-muted">{title}</p>
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
