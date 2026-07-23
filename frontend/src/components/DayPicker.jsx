import { useState } from 'react';

const TIMEZONE = 'America/Sao_Paulo';
const WEEKDAY_LABELS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTH_FMT = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

function todayStrInTZ() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function dayOfWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function formatMonthLabel(dateStr) {
  const raw = MONTH_FMT.format(new Date(`${dateStr}T12:00:00Z`));
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default function DayPicker({ workingHours, daysAhead, selectedDate, onSelectDate }) {
  const todayStr = todayStrInTZ();
  const lastAllowedStr = addDays(todayStr, daysAhead - 1);
  const [todayY, todayM] = todayStr.split('-').map(Number);
  const [lastY, lastM] = lastAllowedStr.split('-').map(Number);

  const [viewYear, setViewYear] = useState(todayY);
  const [viewMonth, setViewMonth] = useState(todayM - 1); // 0-indexado

  const firstOfMonthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-01`;
  const totalDays = daysInMonth(viewYear, viewMonth);
  const leadingBlanks = dayOfWeek(firstOfMonthStr);

  const cells = Array(leadingBlanks).fill(null);
  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }

  const canGoPrev = viewYear > todayY || (viewYear === todayY && viewMonth > todayM - 1);
  const canGoNext = viewYear < lastY || (viewYear === lastY && viewMonth < lastM - 1);

  function goPrevMonth() {
    if (!canGoPrev) return;
    setViewMonth((prev) => (prev === 0 ? 11 : prev - 1));
    setViewYear((prev) => (viewMonth === 0 ? prev - 1 : prev));
  }

  function goNextMonth() {
    if (!canGoNext) return;
    setViewMonth((prev) => (prev === 11 ? 0 : prev + 1));
    setViewYear((prev) => (viewMonth === 11 ? prev + 1 : prev));
  }

  return (
    <div className="max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goPrevMonth}
          disabled={!canGoPrev}
          className="px-3 py-2 rounded-lg border border-neutral-800 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-neutral-600"
        >
          ←
        </button>
        <span className="text-sm font-medium text-white">{formatMonthLabel(firstOfMonthStr)}</span>
        <button
          type="button"
          onClick={goNextMonth}
          disabled={!canGoNext}
          className="px-3 py-2 rounded-lg border border-neutral-800 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-neutral-600"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((dateStr, index) => {
          if (!dateStr) return <div key={`blank-${index}`} />;

          const weekday = dayOfWeek(dateStr);
          const isOpenWeekday = Boolean(workingHours[weekday]);
          const inRange = dateStr >= todayStr && dateStr <= lastAllowedStr;
          const enabled = isOpenWeekday && inRange;
          const isSelected = dateStr === selectedDate;
          const dayNumber = Number(dateStr.slice(-2));

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!enabled}
              onClick={() => onSelectDate(dateStr)}
              className={[
                'aspect-square rounded-lg text-sm flex items-center justify-center transition-colors',
                !enabled && 'text-neutral-700 cursor-not-allowed',
                enabled && !isSelected &&
                  'text-neutral-200 border border-neutral-800 hover:border-barber-gold hover:text-barber-gold',
                isSelected && 'bg-barber-gold text-neutral-950 font-semibold',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}
