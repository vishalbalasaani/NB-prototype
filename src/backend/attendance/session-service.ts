/**
 * NodeBricks Backend Attendance Session Service
 * Encapsulates attendance session matching, state transitions, date calculations, and operational rules.
 */
import { SCHOOL_ID, SCHOOL_TIMEZONE } from '@/lib/data-service';

export const ATTENDANCE_TIMEZONE = SCHOOL_TIMEZONE || 'Asia/Kolkata';

export function getSchoolTodayDate(timeZone: string = ATTENDANCE_TIMEZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

export function getSchoolCurrentTime(timeZone: string = ATTENDANCE_TIMEZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
}

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Calculate the next valid working school day, skipping Sundays (0) and configured school holidays.
 */
export function calculateNextWorkingDay(dateStr: string, holidays?: Set<string>): string {
  try {
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return dateStr;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    do {
      date.setDate(date.getDate() + 1);
    } while (date.getDay() === 0 || (holidays && holidays.has(toDateString(date))));

    return toDateString(date);
  } catch {
    return dateStr;
  }
}

/**
 * Returns a list of upcoming valid working school days (skipping Sundays and holidays).
 */
export function getUpcomingSchoolDays(
  count: number = 5,
  startDateStr: string = getSchoolTodayDate(),
  holidays: Set<string> = new Set()
) {
  const days: Array<{
    date: string;
    dayNum: number;
    month: string;
    weekday: string;
    dayName: string;
    monthName: string;
    isToday: boolean;
    formattedLabel: string;
  }> = [];

  const [y, m, d] = startDateStr.split('-').map(Number);
  const current = new Date(y, m - 1, d);

  const dayNamesTitle = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNamesTitle = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const iter = new Date(current);
  let added = 0;
  for (let i = 0; added < count && i < 30; i++) {
    const dStr = toDateString(iter);
    const dayOfWeek = iter.getDay();

    if (dayOfWeek !== 0 && !holidays.has(dStr)) {
      const isToday = dStr === startDateStr;
      days.push({
        date: dStr,
        dayNum: iter.getDate(),
        month: monthNamesTitle[iter.getMonth()],
        monthName: monthNamesTitle[iter.getMonth()],
        weekday: dayNamesTitle[dayOfWeek],
        dayName: dayNamesTitle[dayOfWeek].toUpperCase(),
        isToday,
        formattedLabel: isToday ? 'TODAY' : added === 1 ? 'TOMORROW' : '',
      });
      added++;
    }
    iter.setDate(iter.getDate() + 1);
  }

  return days;
}

/**
 * Natural date formatting:
 * Today: "Today • Thu, 1 Oct 2026"
 * Yesterday: "Yesterday • Wed, 30 Sep 2026"
 * Older: "Tue, 29 Sep 2026"
 */
export function formatNaturalHistoryDate(dateStr: string, timeZone: string = ATTENDANCE_TIMEZONE): string {
  try {
    const today = getSchoolTodayDate(timeZone);
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    const [ty, tm, td] = today.split('-').map(Number);
    const todayDate = new Date(ty, tm - 1, td);
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(todayDate.getDate() - 1);
    const yStr = toDateString(yesterdayDate);

    const formatted = date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    if (dateStr === today) {
      return `Today \u2022 ${formatted}`;
    }
    if (dateStr === yStr) {
      return `Yesterday \u2022 ${formatted}`;
    }
    return formatted;
  } catch {
    return dateStr;
  }
}

export function formatDisplayDate(dateStr?: string): string {
  const target = dateStr || getSchoolTodayDate();
  try {
    const [y, m, d] = target.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return target;
  }
}

export function calculateAttendancePercentage(present: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((present / total) * 100).toFixed(1));
}
