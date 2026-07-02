import { useEffect, useMemo, useRef, useState } from 'react';

interface DateFieldProps {
  /** `YYYY-MM-DD`, or `YYYY-MM-DDTHH:mm` when `withTime`. */
  value: string;
  onChange: (value: string) => void;
  withTime?: boolean;
  placeholder?: string;
  locale?: string;
}

const pad = (n: number): string => String(n).padStart(2, '0');
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Parts {
  year: number;
  month: number; // 0-based
  day: number;
  hour: number;
  minute: number;
}

function parse(value: string): Parts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(value);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]) - 1,
    day: Number(match[3]),
    hour: match[4] ? Number(match[4]) : 20,
    minute: match[5] ? Number(match[5]) : 0,
  };
}

function serialize(parts: Parts, withTime: boolean): string {
  const date = `${parts.year}-${pad(parts.month + 1)}-${pad(parts.day)}`;
  return withTime ? `${date}T${pad(parts.hour)}:${pad(parts.minute)}` : date;
}

function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from(
    { length: 42 },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  );
}

const trigger =
  'flex w-full items-center justify-between rounded-lg border border-line bg-surface2 px-3 py-2 text-left text-sm text-fg transition hover:border-lime/60';

export function DateField({
  value,
  onChange,
  withTime = false,
  placeholder,
  locale,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const parts = parse(value);
  const now = new Date();

  const [view, setView] = useState(() => ({
    year: parts?.year ?? now.getFullYear(),
    month: parts?.month ?? now.getMonth(),
  }));

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const grid = useMemo(() => buildGrid(view.year, view.month), [view]);
  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  const label = parts
    ? new Date(parts.year, parts.month, parts.day).toLocaleDateString(locale, {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + (withTime ? ` · ${pad(parts.hour)}:${pad(parts.minute)}` : '')
    : (placeholder ?? 'Select a date');

  function pick(date: Date) {
    const next: Parts = {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hour: parts?.hour ?? 20,
      minute: parts?.minute ?? 0,
    };
    onChange(serialize(next, withTime));
    if (!withTime) setOpen(false);
  }

  function setTime(hour: number, minute: number) {
    const base = parts ?? {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
      hour,
      minute,
    };
    onChange(serialize({ ...base, hour, minute }, withTime));
  }

  const shift = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" className={trigger} onClick={() => setOpen((v) => !v)}>
        <span className={parts ? '' : 'text-muted'}>{label}</span>
        <span className="text-muted">📅</span>
      </button>

      {open ? (
        <div className="absolute z-20 mt-2 w-72 rounded-xl border border-line bg-surface p-3 shadow-2xl shadow-black/40">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-muted transition hover:text-fg"
              onClick={() => shift(-1)}
            >
              ‹
            </button>
            <span className="font-display text-sm capitalize tracking-wide">{monthLabel}</span>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-muted transition hover:text-fg"
              onClick={() => shift(1)}
            >
              ›
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-muted">
            {WEEKDAYS.map((day, i) => (
              <span key={i}>{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {grid.map((date) => {
              const inMonth = date.getMonth() === view.month;
              const selected =
                parts &&
                date.getFullYear() === parts.year &&
                date.getMonth() === parts.month &&
                date.getDate() === parts.day;
              const isToday =
                date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth() &&
                date.getDate() === now.getDate();
              return (
                <button
                  type="button"
                  key={date.toISOString()}
                  onClick={() => pick(date)}
                  className={`h-8 rounded-md text-sm transition ${
                    selected
                      ? 'bg-lime font-bold text-ink'
                      : inMonth
                        ? 'text-fg hover:bg-surface2'
                        : 'text-muted/40 hover:bg-surface2'
                  } ${isToday && !selected ? 'ring-1 ring-lime/50' : ''}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {withTime ? (
            <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Time</span>
              <select
                className="rounded-md border border-line bg-surface2 px-2 py-1 text-sm outline-none focus:border-lime/60"
                value={parts?.hour ?? 20}
                onChange={(e) => setTime(Number(e.target.value), parts?.minute ?? 0)}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>
                    {pad(h)}
                  </option>
                ))}
              </select>
              <span className="text-muted">:</span>
              <select
                className="rounded-md border border-line bg-surface2 px-2 py-1 text-sm outline-none focus:border-lime/60"
                value={parts?.minute ?? 0}
                onChange={(e) => setTime(parts?.hour ?? 20, Number(e.target.value))}
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <option key={m} value={m}>
                    {pad(m)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="ml-auto rounded-md bg-lime px-3 py-1 text-xs font-bold text-ink"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
