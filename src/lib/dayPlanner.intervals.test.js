import { describe, it, expect } from 'vitest';
import { intervalsOverlap, toInterval, filterConflictingProposals } from './dayPlanner';

const proposal = (over) => ({ kind: 'task', taskId: 't1', title: 'x', startMinute: 540, durationMinutes: 60, ...over });

describe('intervalsOverlap', () => {
  it('treats touching ends as free', () => {
    expect(intervalsOverlap(toInterval(540, 60), toInterval(600, 60))).toBe(false);
  });
  it('catches partial and full overlaps', () => {
    expect(intervalsOverlap(toInterval(540, 60), toInterval(570, 60))).toBe(true);
    expect(intervalsOverlap(toInterval(540, 120), toInterval(570, 15))).toBe(true);
  });
});

describe('filterConflictingProposals', () => {
  it('keeps a proposal in a free slot', () => {
    const { kept, dropped } = filterConflictingProposals([proposal()], { events: [{ start: 600, duration: 60 }] });
    expect(kept).toHaveLength(1);
    expect(dropped).toHaveLength(0);
  });
  it('drops overlaps with events and placements', () => {
    const { kept, dropped } = filterConflictingProposals(
      [proposal(), proposal({ taskId: 't2', startMinute: 720 })],
      { events: [{ start: 570, duration: 30 }], placements: [{ start_minute: 700, duration_minutes: 30 }] },
    );
    expect(kept).toHaveLength(0);
    expect(dropped.map((d) => d.reason)).toEqual(['overlaps schedule', 'overlaps schedule']);
  });
  it('drops a proposal that overlaps an earlier kept proposal', () => {
    const { kept } = filterConflictingProposals([proposal(), proposal({ taskId: 't2', startMinute: 570 })]);
    expect(kept.map((p) => p.taskId)).toEqual(['t1']);
  });
  it('drops duplicate task and project references', () => {
    const { kept, dropped } = filterConflictingProposals([
      proposal(),
      proposal({ startMinute: 720 }),
      proposal({ kind: 'island_project', taskId: null, projectId: 'p1', startMinute: 840 }),
      proposal({ kind: 'island_project', taskId: null, projectId: 'p1', startMinute: 960 }),
    ]);
    expect(kept).toHaveLength(2);
    expect(dropped.map((d) => d.reason)).toEqual(['duplicate task', 'duplicate project']);
  });
});
