import React, { useEffect, useState } from 'react';
import { Clock, Calendar } from 'lucide-react';

interface DateTimePickerProps {
  label: string;
  value: string; // ISO string or YYYY-MM-DDTHH:mm
  onChange: (isoString: string) => void;
  required?: boolean;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
}) => {
  // Parse incoming value into date (YYYY-MM-DD), 12-hr hour (1-12), minute (00-59), and AM/PM
  const parseInitial = (val: string): { date: string; hour: number; minute: string; ampm: 'AM' | 'PM' } => {
    let d = new Date(val);
    if (isNaN(d.getTime())) {
      d = new Date();
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const rawHours = d.getHours();
    const ampm: 'AM' | 'PM' = rawHours >= 12 ? 'PM' : 'AM';
    const hour12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
    const minuteStr = String(d.getMinutes()).padStart(2, '0');

    return {
      date: dateStr,
      hour: hour12,
      minute: minuteStr,
      ampm,
    };
  };

  const [datePart, setDatePart] = useState(() => parseInitial(value).date);
  const [hourPart, setHourPart] = useState<number>(() => parseInitial(value).hour);
  const [minutePart, setMinutePart] = useState<string>(() => parseInitial(value).minute);
  const [ampmPart, setAmpmPart] = useState<'AM' | 'PM'>(() => parseInitial(value).ampm);

  // Sync state if external value changes (e.g. opening edit modal with different tournament)
  useEffect(() => {
    if (value) {
      const parsed = parseInitial(value);
      setDatePart(parsed.date);
      setHourPart(parsed.hour);
      setMinutePart(parsed.minute);
      setAmpmPart(parsed.ampm);
    }
  }, [value]);

  // When any piece changes, construct local date and emit ISO string
  const notifyChange = (newDate: string, newHour: number, newMin: string, newAmpm: 'AM' | 'PM') => {
    let h24 = newHour % 12;
    if (newAmpm === 'PM') {
      h24 += 12;
    }
    const [y, m, d] = newDate.split('-').map(Number);
    const minNum = parseInt(newMin, 10) || 0;

    const dt = new Date(y, m - 1, d, h24, minNum, 0, 0);
    if (!isNaN(dt.getTime())) {
      onChange(dt.toISOString());
    }
  };

  const handleDateChange = (d: string) => {
    setDatePart(d);
    notifyChange(d, hourPart, minutePart, ampmPart);
  };

  const handleHourChange = (h: number) => {
    setHourPart(h);
    notifyChange(datePart, h, minutePart, ampmPart);
  };

  const handleMinuteChange = (m: string) => {
    const cleaned = m.slice(0, 2);
    setMinutePart(cleaned);
    notifyChange(datePart, hourPart, cleaned, ampmPart);
  };

  const handleAmpmChange = (a: 'AM' | 'PM') => {
    setAmpmPart(a);
    notifyChange(datePart, hourPart, minutePart, a);
  };

  // Human readable preview in IST
  const previewFormatted = (() => {
    let h24 = hourPart % 12;
    if (ampmPart === 'PM') h24 += 12;
    const [y, m, d] = datePart.split('-').map(Number);
    const minNum = parseInt(minutePart, 10) || 0;
    const dt = new Date(y, m - 1, d, h24, minNum);
    if (isNaN(dt.getTime())) return '';
    return dt.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }) + ' IST';
  })();

  return (
    <div className="space-y-1.5 bg-midnight/80 p-3 rounded-lg border border-aroraborder">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-icewhite flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-cyan" />
          {label} {required && <span className="text-neongreen">*</span>}
        </label>
        {previewFormatted && (
          <span className="text-[10px] font-mono text-cyan bg-deepteal/60 px-2 py-0.5 rounded border border-cyan/30">
            {previewFormatted}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
        {/* Date Input */}
        <div className="sm:col-span-6">
          <input
            type="date"
            required={required}
            value={datePart}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full bg-deepteal/50 border border-aroraborder rounded-lg px-2.5 py-1.5 text-xs text-icewhite focus:outline-none focus:border-cyan"
          />
        </div>

        {/* 12-Hour Select */}
        <div className="sm:col-span-2">
          <select
            value={hourPart}
            onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
            className="w-full bg-deepteal/50 border border-aroraborder rounded-lg px-2 py-1.5 text-xs font-mono text-icewhite font-bold focus:outline-none focus:border-cyan"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>

        {/* Minute Select */}
        <div className="sm:col-span-2">
          <select
            value={minutePart}
            onChange={(e) => handleMinuteChange(e.target.value)}
            className="w-full bg-deepteal/50 border border-aroraborder rounded-lg px-2 py-1.5 text-xs font-mono text-icewhite font-bold focus:outline-none focus:border-cyan"
          >
            {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
              <option key={m} value={m}>
                :{m}
              </option>
            ))}
          </select>
        </div>

        {/* AM / PM Toggle */}
        <div className="sm:col-span-2 flex rounded-lg overflow-hidden border border-aroraborder">
          <button
            type="button"
            onClick={() => handleAmpmChange('AM')}
            className={`flex-1 py-1 text-xs font-mono font-bold transition-colors ${
              ampmPart === 'AM'
                ? 'bg-neongreen text-midnight'
                : 'bg-deepteal/60 text-subtext hover:text-icewhite'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => handleAmpmChange('PM')}
            className={`flex-1 py-1 text-xs font-mono font-bold transition-colors ${
              ampmPart === 'PM'
                ? 'bg-cyan text-midnight'
                : 'bg-deepteal/60 text-subtext hover:text-icewhite'
            }`}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
};
