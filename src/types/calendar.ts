export type CalendarEventType = "task_due";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string; // YYYY-MM-DD
  link: string;
}

export interface CalendarDay {
  date: Date;
  iso: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}
