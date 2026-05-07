export interface CalendarDay {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: PostCalendarItem[];
}

export interface PostCalendarItem {
  id: string;
  title: string;
  status: 'draft' | 'scheduled' | 'approved' | 'published' | 'awaiting_approval';
  scheduledAt: string | null;
  platforms: string[];
}

export function getDaysInMonth(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  const days: CalendarDay[] = [];

  const startPad = firstDay.getDay();
  for (let i = startPad - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    days.push(makeDay(date, false, today));
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    days.push(makeDay(date, true, today));
  }

  const endPad = 6 - lastDay.getDay();
  for (let i = 1; i <= endPad; i++) {
    const date = new Date(year, month + 1, i);
    days.push(makeDay(date, false, today));
  }

  return days;
}

function makeDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
  return {
    date,
    dateStr: toDateStr(date),
    isCurrentMonth,
    isToday: isSameDay(date, today),
    posts: [],
  };
}

export function getPostsByDate(posts: PostCalendarItem[], date: Date): PostCalendarItem[] {
  return posts.filter(post => {
    if (!post.scheduledAt) return false;
    return isSameDay(new Date(post.scheduledAt), date);
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86486400) + 1) / 7);
}