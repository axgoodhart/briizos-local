# PRD: Panel Column Stacking

## Introduction

Enable panels to be sized as full-height or half-height within a column, with half-height panels grouped into vertical stacks. Currently, briizOS arranges all panels in a single horizontal row. This feature allows any column to contain either a single full-height panel or a vertical stack of multiple panels sharing that column's height. Users create stacks by dragging a panel into the center of another panel, and separate them by dragging to the edges.

**Layout model:**

```
Row (the layout — always one, always horizontal)
├── Panel A          (column: single full-height panel)
├── Stack            (column: multiple panels stacked vertically)
│   ├── Panel B      (top)
│   └── Panel C      (bottom)
└── Panel D          (column: single full-height panel)
```

There is exactly one row. Its children are columns. A column is either a single panel or a stack. A stack is a column containing multiple panels arranged vertically. Max depth is 2 levels (row > column/stack > panels). No rows nested inside columns, no deeper nesting.

## Goals

- Allow any panel to occupy full column height or share a column with other vertically stacked panels
- Support unlimited panels stacked vertically within a single column
- Use drag-and-drop with position-aware drop zones (center = stack, edge = reorder/move)
- Maintain resize handles between both horizontal columns and vertically stacked panels
- Persist the layout structure to Firestore
- Reference waveterm's layout architecture (`/Users/alex/Documents/Cufolio/waveterm-main/frontend/layout/`) for implementation patterns

## User Stories

### US-001: Migrate data model from flat array to row/column/stack structure

**Description:** As a developer, I need a layout data model that supports columns and stacks so that panels can be grouped vertically within a column.

**Acceptance Criteria:**

- [ ] Define a `LayoutColumn` type: either a single panel reference (`{ panelId, size }`) or a stack (`{ panels: [{ panelId, size }], size }`)
- [ ] The layout is a single row containing an ordered array of `LayoutColumn` entries
- [ ] Column `size` is the horizontal width percentage within the row
- [ ] Panel `size` within a stack is the vertical height percentage within that column
- [ ] Default layout equivalent to current: `[{ panelId: 'sources', size: 20 }, { panelId: 'interaction', size: 60 }, { panelId: 'tasks', size: 20 }]`
- [ ] Write a migration function that converts the existing flat `panels[]` array into the new structure
- [ ] `useLayout` hook updated to operate on the new model
- [ ] Typecheck/lint passes

### US-002: Render layout with vertical stacking

**Description:** As a user, I want to see panels stacked vertically within a column so I can fit more panels on screen.

**Acceptance Criteria:**

- [ ] The layout renders one horizontal `react-resizable-panels` Group for the row
- [ ] Single-panel columns render the panel at full height
- [ ] Stack columns render a nested vertical `react-resizable-panels` Group containing each stacked panel
- [ ] Each panel renders its content via `renderPanel` callback
- [ ] Stacked panels share height based on their `size` values
- [ ] All panel types (sources, interaction, tasks, actiondeck) render correctly in stacked configuration
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-003: Add resize handles between vertically stacked panels

**Description:** As a user, I want to drag resize handles between stacked panels to adjust their heights.

**Acceptance Criteria:**

- [ ] Vertical resize handles (`row-resize` cursor) appear between vertically stacked panels
- [ ] Horizontal resize handles (`col-resize` cursor) continue to work between columns
- [ ] Dragging a vertical handle updates the `size` of the two adjacent panels within the stack
- [ ] Minimum panel size enforced (5% or 40px, whichever is larger)
- [ ] Resize changes persist to Firestore via existing debounced save
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-004: Implement drop-zone detection for stack vs. move

**Description:** As a user, I want the system to detect whether I'm dropping a panel in the center (stack) or at the edge (reorder) of another panel.

**Acceptance Criteria:**

- [ ] When dragging a panel, the drop target is divided into zones: center (middle ~60%) and edges (top/bottom/left/right ~20% each)
- [ ] Visual overlay indicates the active drop zone (highlight region where panel will land)
- [ ] Center zone highlighted differently from edge zones (e.g., full panel highlight vs. half-panel highlight)
- [ ] Drop zone detection uses cursor position relative to the target panel's bounding rect
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-005: Execute stack operation on center drop

**Description:** As a user, when I drag a panel and drop it in the center of another panel, the two panels should form a vertical stack in that column.

**Acceptance Criteria:**

- [ ] Dropping on center of a single-panel column: converts the column to a stack containing the original panel and the dragged panel
- [ ] Dropping on center of an existing stack: adds the dragged panel to that stack
- [ ] The dragged panel is removed from its original column/stack
- [ ] If removing the dragged panel leaves a stack with one panel, that stack is simplified back to a single-panel column
- [ ] New stack defaults to equal size distribution among panels
- [ ] Layout persists after stacking
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-006: Execute move/reorder operation on edge drop

**Description:** As a user, when I drag a panel to the edge of another panel, it should reorder or move rather than stack.

**Acceptance Criteria:**

- [ ] Dropping on top/bottom edge of a panel within a stack: inserts the dragged panel above/below the target in that stack
- [ ] Dropping on left/right edge of a panel: places the dragged panel as a new column before/after the target's column
- [ ] The dragged panel is removed from its original position
- [ ] Single-panel stacks are simplified after removal
- [ ] Layout persists after move
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-007: Unstack a panel by dragging it out

**Description:** As a user, I want to drag a panel out of a stack to make it its own full-height column again.

**Acceptance Criteria:**

- [ ] Dragging a panel from a stack to the left/right edge of any panel creates a new column
- [ ] If the source stack has only one panel remaining after removal, it is simplified to a single-panel column
- [ ] The unstacked panel becomes full-height in its new column position
- [ ] Typecheck/lint passes
- [ ] Verify in browser using dev-browser skill

### US-008: Simplify stacks after mutations

**Description:** As a developer, I need automatic cleanup so that stacks with a single panel are simplified back to plain columns.

**Acceptance Criteria:**

- [ ] After any layout mutation, check all columns: if a stack has only one panel, convert it to a single-panel column
- [ ] Empty columns (no panels) are removed entirely
- [ ] Column sizes are renormalized if a column is added or removed
- [ ] Typecheck/lint passes

### US-009: Persist layout to Firestore

**Description:** As a user, I want my stacked panel layout to persist across sessions.

**Acceptance Criteria:**

- [ ] Firestore layout schema updated to store the row/column/stack structure
- [ ] Migration handles loading old flat-array layouts and converting to the new structure
- [ ] Saving writes the full layout with debounced auto-save
- [ ] Loading reconstructs the layout and renders correctly
- [ ] `version` field incremented to distinguish new schema from old
- [ ] Typecheck/lint passes

## Functional Requirements

- FR-1: The layout is a single row containing an ordered array of columns
- FR-2: A column is either a single panel (full-height) or a stack (multiple panels arranged vertically)
- FR-3: Column widths are stored as relative percentages summing to ~100
- FR-4: Panel heights within a stack are stored as relative percentages summing to ~100
- FR-5: Drop-zone detection must divide the target panel into 5 zones: center (~60% area), top edge, bottom edge, left edge, right edge (~20% each)
- FR-6: Dropping on center must create or join a vertical stack
- FR-7: Dropping on top/bottom edge must insert above/below within the same stack
- FR-8: Dropping on left/right edge must insert as a new column before/after
- FR-9: After any mutation, single-panel stacks must be simplified to plain columns, and empty columns removed
- FR-10: Resize handles must appear between all columns (horizontal) and between all panels within a stack (vertical)
- FR-11: Minimum panel size must be enforced during resize (5% or 40px minimum)
- FR-12: The full layout must persist to Firestore and load correctly on app start
- FR-13: Old flat-array layout configs must be migrated to the new structure on load

## Non-Goals

- No nested rows inside columns (max depth is row > column/stack > panels)
- No tab grouping within panels (each panel slot is one panel, not a tab group)
- No magnification/zoom mode for individual panels (existing maximize behavior is separate)
- No keyboard shortcuts for stacking/unstacking (drag-and-drop only for now)
- No predefined layout presets or templates

## Design Considerations

- Drop zone overlay should use semi-transparent highlight regions matching the existing cyan/orange accent palette
- Center drop zone: full panel highlight with cyan tint
- Edge drop zones: half-panel highlight showing where the panel will land (top half, bottom half, left half, right half)
- Resize handles should match existing 8px styling with cyan hover indicator
- Vertical resize handles use `row-resize` cursor; horizontal use `col-resize`
- Panel headers remain draggable handles for initiating drag operations

## Technical Considerations

- **Reference implementation**: Waveterm's layout system at `/Users/alex/Documents/Cufolio/waveterm-main/frontend/layout/lib/` — specifically `utils.ts` (drop zone detection), `layoutNode.ts` (node operations), `layoutTree.ts` (move/swap logic), and `TileLayout.tsx` (rendering). Adapt the patterns but simplify — waveterm supports unlimited recursive nesting; we only need row > column/stack > panels.
- **Existing dependencies**: `react-resizable-panels` supports nested Groups with mixed orientations — one horizontal Group for the row, vertical Groups inside for stacks
- **react-dnd**: Already in use; extend `useDrop` hover callback to compute drop zones from cursor position relative to target bounds
- **NestedTileLayout**: The existing `NestedTileLayout` component in `TileLayout.jsx` already has a skeleton for recursive rendering — extend this rather than building from scratch
- **Firestore schema**: Increment `version` to 2; add migration logic in `useLayout` to detect v1 (flat array) and convert to v2 (row/column/stack)
- **Performance**: Stack simplification should run synchronously after each mutation before render

## Success Metrics

- Users can stack any two panels vertically via drag-and-drop in under 3 seconds
- Users can unstack a panel back to full-height via drag-and-drop
- Stacked layouts persist correctly across page reloads
- No regression in horizontal resize or panel drag-swap behavior
- Drop zone visual feedback is clear enough that users intuit the difference between stack and move on first use

## Open Questions

- When a panel is closed/hidden from a stack, should remaining panels auto-resize to fill the space, or maintain their sizes? Answer: Remaining panels should always auto resize to fill the space.
