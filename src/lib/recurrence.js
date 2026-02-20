/**
 * Recurrence logic for organizer events.
 * Ported from briizOS-Dev v1's eventOccursOnDate (index.html:8125).
 */
import { parseDateYMD, formatDateYMD, normalizeDateStr } from './firestore';

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

  const recurrence = event.recurrence;
  const anchorIso = normalizeDateStr(
    recurrence.anchorDate || event.scheduledDate || event.dateValue || compareDates[0]
  );
  if (!anchorIso) return compareDates.includes(dateStr);

  const anchor = parseDateYMD(anchorIso);
  const target = parseDateYMD(dateStr);
  const anchorStart = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  // Exact match on any date field
  if (compareDates.includes(dateStr)) return true;

  // Before anchor
  if (targetStart < anchorStart) return false;

  // Check end date
  if (recurrence.endDate) {
    const endDate = parseDateYMD(normalizeDateStr(recurrence.endDate));
    if (targetStart > endDate) return false;
  } else {
    const fallbackEnd = new Date(anchorStart);
    fallbackEnd.setFullYear(fallbackEnd.getFullYear() + 2);
    if (targetStart > fallbackEnd) return false;
  }

  const type = recurrence.type || 'weekly';
  const interval = Math.max(1, recurrence.interval || 1);

  if (type === 'monthly') {
    const anchorDay = anchorStart.getDate();
    const monthsApart =
      (targetStart.getFullYear() - anchorStart.getFullYear()) * 12 +
      (targetStart.getMonth() - anchorStart.getMonth());
    if (monthsApart < 0) return false;
    if (monthsApart % interval !== 0) return false;
    return targetStart.getDate() === anchorDay;
  } else {
    // Weekly (default)
    const daysOfWeek =
      Array.isArray(recurrence.daysOfWeek) && recurrence.daysOfWeek.length
        ? recurrence.daysOfWeek.map(Number)
        : [anchorStart.getDay()];

    if (!daysOfWeek.includes(targetStart.getDay())) return false;

    const diffDays = Math.floor((targetStart - anchorStart) / 86400000);
    if (diffDays < 0) return false;
    return Math.floor(diffDays / 7) % interval === 0;
  }
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
