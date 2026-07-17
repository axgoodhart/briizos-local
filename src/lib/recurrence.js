/**
 * Recurrence logic for organizer events.
 * Ported from briizOS-Dev v1's eventOccursOnDate (index.html:8125).
 */
import { parseDateYMD, formatDateYMD, normalizeDateStr } from './dates';

/**
 * Determine if an event occurs on a given date, considering recurrence rules.
 * @param {Object} event - Normalized organizer item
 * @param {string} dateStr - Target date in YYYY-MM-DD format
 * @returns {boolean}
 */
export function eventOccursOnDate(event, dateStr) {
  if (!event || event.type !== 'event') return false;

  const compareDates = [
    event.scheduledDate,
    event.due,
    event.dateValue,
  ].filter(Boolean);

  // Non-recurring: simple date match
  if (!event.recurrence || !event.recurrence.enabled) {
    return compareDates.includes(dateStr);
  }

  // Exact match on any date field
  if (compareDates.includes(dateStr)) return true;
  const anchorIso = normalizeDateStr(
    event.recurrence.anchorDate || event.scheduledDate || event.dateValue || compareDates[0]
  );
  if (!anchorIso) return false;
  return recurrenceOccursOnDate(anchorIso, event.recurrence, dateStr);
}

/** Shared rule evaluator for organizer events and renderer-side previews. */
export function recurrenceOccursOnDate(anchorDate, recurrence, targetDate) {
  const anchorIso = normalizeDateStr(anchorDate);
  const targetIso = normalizeDateStr(targetDate);
  if (!anchorIso || !targetIso) return false;
  if (!recurrence?.enabled) return anchorIso === targetIso;

  const anchor = parseDateYMD(anchorIso);
  const target = parseDateYMD(targetIso);
  const anchorStart = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  if (targetStart < anchorStart) return false;

  if (recurrence.endDate) {
    const endDate = parseDateYMD(normalizeDateStr(recurrence.endDate));
    if (targetStart > endDate) return false;
  } else {
    const fallbackEnd = new Date(anchorStart);
    fallbackEnd.setFullYear(fallbackEnd.getFullYear() + 2);
    if (targetStart > fallbackEnd) return false;
  }

  const type = recurrence.type || recurrence.frequency || 'weekly';
  const interval = Math.max(1, Number(recurrence.interval) || 1);
  const diffDays = Math.round((targetStart - anchorStart) / 86400000);

  if (type === 'daily') return diffDays % interval === 0;
  if (type === 'monthly') {
    const monthsApart =
      (targetStart.getFullYear() - anchorStart.getFullYear()) * 12 +
      (targetStart.getMonth() - anchorStart.getMonth());
    return monthsApart >= 0
      && monthsApart % interval === 0
      && targetStart.getDate() === (recurrence.dayOfMonth || anchorStart.getDate());
  }
  if (type === 'yearly') {
    return (targetStart.getFullYear() - anchorStart.getFullYear()) % interval === 0
      && targetStart.getMonth() === anchorStart.getMonth()
      && targetStart.getDate() === anchorStart.getDate();
  }

  const daysOfWeek = Array.isArray(recurrence.daysOfWeek) && recurrence.daysOfWeek.length
    ? recurrence.daysOfWeek.map(Number)
    : [anchorStart.getDay()];
  return daysOfWeek.includes(targetStart.getDay()) && Math.floor(diffDays / 7) % interval === 0;
}

/**
 * Get all events that occur on a given date from an array of organizer items.
 */
export function getEventsForDate(items, dateStr) {
  return items.filter(item => eventOccursOnDate(item, dateStr));
}

/**
 * Build a Map<dateStr, event[]> for all dates in a given month.
 * Used for rendering dots on the monthly calendar grid.
 */
export function buildMonthEventMap(items, year, month) {
  const eventItems = items.filter(i => i.type === 'event');
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const map = new Map();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateYMD(new Date(year, month, d));
    const dayEvents = eventItems.filter(e => eventOccursOnDate(e, dateStr));
    if (dayEvents.length > 0) {
      map.set(dateStr, dayEvents);
    }
  }
  return map;
}
