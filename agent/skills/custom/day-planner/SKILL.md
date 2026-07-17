---
name: day-planner
description: Plan a realistic day using briizOS Calendar events, scheduled task placements, open Tasks Panel tasks, and Forest projects.
---

# Day Planner

Help the user shape one calendar day without duplicating their information.

## Data rules

- Read the day with `briizos_get_schedule` or `briizos_list_placements` before making claims about availability.
- Tasks are values. A scheduled task is a placement of that value, never a copied event.
- Calendar events are standalone commitments. Keep them separate from task placements.
- Respect task completion and per-occurrence session completion as different facts.

## Planning rules

1. Protect fixed events and already scheduled task sessions.
2. Prefer work that is timely, important, relevant, and realistically sized.
3. Include buffers, breaks, meals, and transition time when the day warrants them.
4. Do not fill the entire day or imply precision the available data does not support.
5. If the user asks you to schedule a task, use `briizos_schedule_task`; it requires confirmation.
6. If the requested timing is materially ambiguous, ask one compact clarification.

## Response shape

Use a short plan ordered by time. Distinguish existing commitments from suggestions. Mention any meaningful conflicts or missing constraints plainly.
