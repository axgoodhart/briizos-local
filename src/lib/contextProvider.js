export function formatAppContext({ notes = [], tasks = [], events = [], projects = [] }) {
  const now = new Date();
  const currentTime = now.toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const activeNotes = notes.slice(0, 10);
  const activeTasks = tasks.filter(t => t.status !== 'completed').slice(0, 10);
  const upcomingEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    return eventDate >= now;
  }).slice(0, 10);

  return `# Current BriizOS State

**Time:** ${currentTime}

## Active Notes (${activeNotes.length})
${activeNotes.length === 0 ? 'No notes.' : activeNotes.map(n => `- "${n.title}"`).join('\n')}

## Active Tasks (${activeTasks.length})
${activeTasks.length === 0 ? 'No active tasks.' : activeTasks.map(t => `- ${t.title} [${t.priority}]${t.due_date ? ` (due: ${t.due_date})` : ''}`).join('\n')}

## Upcoming Events (${upcomingEvents.length})
${upcomingEvents.length === 0 ? 'No upcoming events.' : upcomingEvents.map(e => `- ${e.date}: ${e.title}`).join('\n')}

## Projects (${projects.length})
${projects.length === 0 ? 'No projects.' : projects.slice(0, 5).map(p => `- ${p.name} [${p.status}]`).join('\n')}`.trim();
}
