const UNIT_MINUTES = {
  m: 1,
  min: 1,
  mins: 1,
  minute: 1,
  minutes: 1,
  h: 60,
  hr: 60,
  hrs: 60,
  hour: 60,
  hours: 60,
};

/** Parse "9am 90m Rehearse set" into a Calendar event draft. */
export function parseCalendarQuickAdd(text) {
  const input = String(text || '').trim();
  if (!input) return { title: '', startMinutes: null, durationMinutes: null };

  const match = input.match(
    /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?:\s+(\d{1,4})\s*(m|mins?|minutes?|h|hrs?|hours?))?\s+(.+)$/i,
  );
  if (!match) return { title: input, startMinutes: null, durationMinutes: null };

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const period = match[3]?.toLowerCase();
  if (minutes > 59 || (period && (hours < 1 || hours > 12)) || (!period && hours > 23)) {
    return { title: input, startMinutes: null, durationMinutes: null };
  }
  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;

  const durationValue = match[4] ? Number(match[4]) : 60;
  const durationUnit = match[5]?.toLowerCase() || 'm';
  const durationMinutes = Math.min(1440, Math.max(1, durationValue * (UNIT_MINUTES[durationUnit] || 1)));
  return {
    title: match[6].trim(),
    startMinutes: hours * 60 + minutes,
    durationMinutes,
  };
}

export default parseCalendarQuickAdd;
