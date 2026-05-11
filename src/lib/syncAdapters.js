/**
 * Sync Adapters for briizOS.Local
 * Implements SyncContract.md §7 — one adapter per bucket.
 *
 * Each adapter:
 *  - normalizeOnRead(id, data)  — maps legacy aliases to canonical schema
 *  - prepareForWrite(doc)       — validates required fields, enforces string id,
 *                                  attaches updatedAt (serverTimestamp), sets
 *                                  createdAt on new docs only
 */
import { serverTimestamp } from 'firebase/firestore';

// ── helpers ────────────────────────────────────────────────────────
function requireFields(doc, fields, adapterName) {
  const missing = fields.filter(f => doc[f] === undefined || doc[f] === null);
  if (missing.length) {
    throw new Error(`[${adapterName}] missing required fields: ${missing.join(', ')}`);
  }
}

function ensureStringId(doc) {
  if (doc.id !== undefined && doc.id !== null) {
    doc.id = String(doc.id);
  }
}

function stamp(doc, isNew) {
  doc.updatedAt = serverTimestamp();
  if (isNew) {
    doc.createdAt = doc.createdAt || Date.now();
  }
}

// ── taskAdapter ────────────────────────────────────────────────────
export const taskAdapter = {
  /** Map a raw Firestore doc into the canonical read shape. */
  normalizeOnRead(id, data) {
    return {
      id: String(id),
      type: data.type || 'task',
      title: data.title || data.text || data.name || data.message || '',
      status: (data.completed || data.completedAt) ? 'completed' : (data.status || 'pending'),
      completed: !!(data.completed || data.completedAt),
      completedAt: data.completedAt || null,
      priority: data.priority || 'medium',
      dueDate: data.dueDate || data.due_date || null,
      parentId: data.parentId || null,
      actions: Array.isArray(data.actions) ? data.actions : [],
      position: data.position || null,
      createdAt: data.createdAt || data.created || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
    };
  },

  /** Prepare a document for Firestore write. Canonical keys only. */
  prepareForWrite(doc, isNew = false) {
    ensureStringId(doc);
    stamp(doc, isNew);
    // Ensure canonical key
    if (!doc.title && (doc.text || doc.name || doc.message)) {
      doc.title = doc.text || doc.name || doc.message;
    }
    // Strip legacy alias keys — writers MUST emit only canonical keys
    delete doc.text;
    delete doc.name;
    delete doc.message;
    requireFields(doc, ['id', 'type', 'title', 'status', 'createdAt'], 'taskAdapter');
    if (doc.completed === undefined) doc.completed = false;
    return doc;
  },
};

// ── organizerAdapter ───────────────────────────────────────────────
export const organizerAdapter = {
  normalizeOnRead(id, data) {
    return {
      id: String(id),
      type: data.type || 'note',
      title: data.title || data.name || '',
      body: data.body || data.description || data.content || '',
      status: data.completedAt ? 'done' : (data.status === 'done' ? 'done' : (data.status || 'todo')),
      completedAt: data.completedAt || null,
      createdAt: data.createdAt || data.updatedAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
      tags: Array.isArray(data.tags) ? data.tags : [],
      importance: data.importance || null,
      size: data.size || null,
      relevance: data.relevance || null,
      deadline: data.deadline || null,
      attachments: data.attachments || [],
      links: data.links || [],
      completed: !!(data.completedAt || data.status === 'done'),
      // pass through everything else for organizer-specific fields
      scheduledDate: data.scheduledDate || null,
      start: data.start ?? data.startMinute ?? null,
      end: data.end ?? null,
      duration: data.duration ?? data.durationMinutes ?? null,
      due: data.due || null,
      dateMode: data.dateMode || (data.type === 'event' ? 'event' : 'created'),
      dateValue: data.dateValue || null,
      priority: data.priority || 'auto',
      source: data.source || { mode: 'manual' },
      recurrence: data.recurrence || null,
      domain: data.domain || null,
      color: data.color || null,
      chat: data.chat || null,
      external: data.external || null,
      tasks: data.tasks || [],
      milestones: data.milestones || [],
    };
  },

  prepareForWrite(doc, isNew = false) {
    ensureStringId(doc);
    stamp(doc, isNew);
    // Canonical key normalization
    if (!doc.title && doc.name) doc.title = doc.name;
    if (!doc.body && (doc.description || doc.content)) {
      doc.body = doc.description || doc.content;
    }
    // Strip legacy alias keys
    delete doc.name;
    delete doc.text;
    delete doc.description;
    delete doc.content;
    requireFields(doc, ['id', 'type', 'title', 'status', 'createdAt'], 'organizerAdapter');
    return doc;
  },
};

// ── calendarAdapter ────────────────────────────────────────────────
export const calendarAdapter = {
  normalizeOnRead(id, data) {
    return {
      id: String(id),
      type: data.type || 'event',
      title: data.title || data.text || data.name || '',
      body: data.body || data.description || '',
      scheduledDate: data.scheduledDate || data.date || data.dateValue || null,
      status: (data.completed || data.completedAt) ? 'done' : (data.status || 'todo'),
      completed: !!(data.completed || data.completedAt),
      completedAt: data.completedAt || null,
      time: data.time || null,
      start: data.start ?? data.startMinute ?? null,
      end: data.end ?? null,
      durationMinutes: data.durationMinutes ?? data.duration ?? null,
      allDay: data.allDay || false,
      color: data.color || '#3b82f6',
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
    };
  },

  prepareForWrite(doc, isNew = false) {
    ensureStringId(doc);
    stamp(doc, isNew);
    // Canonical key normalization
    if (!doc.title && (doc.text || doc.name)) {
      doc.title = doc.text || doc.name;
    }
    if (!doc.body && doc.description) {
      doc.body = doc.description;
    }
    if (!doc.scheduledDate && (doc.date || doc.dateValue)) {
      doc.scheduledDate = doc.date || doc.dateValue;
    }
    // Strip legacy alias keys
    delete doc.text;
    delete doc.name;
    delete doc.date;
    delete doc.dateValue;
    delete doc.description;
    requireFields(doc, ['id', 'type', 'title', 'scheduledDate', 'status', 'createdAt'], 'calendarAdapter');
    return doc;
  },
};

// ── noteAdapter ────────────────────────────────────────────────────
export const noteAdapter = {
  /**
   * Normalize a raw Firestore panel doc (type=='note') for Local consumption.
   * Maps legacy flat x/y/w/h and nested ui branches.
   */
  normalizeOnRead(id, data) {
    // Resolve Local UI position: prefer nested ui.local.xywh, fallback to flat fields
    const localUI = data.ui?.local?.xywh;
    const x = localUI?.x ?? data.x ?? data.positionX ?? 100;
    const y = localUI?.y ?? data.y ?? data.positionY ?? 100;
    const w = localUI?.w ?? data.w ?? data.width ?? 250;
    const h = localUI?.h ?? data.h ?? data.height ?? 200;

    return {
      id: String(id),
      type: data.type || 'note',
      title: data.title || '',
      body: data.body || data.content || '',
      customColor: data.customColor || null,
      // Local reads its own branch for positioning
      position_x: x,
      position_y: y,
      width: w,
      height: h,
      active: data.active !== false,
      isDocked: data.isDocked !== false,
      tags: Array.isArray(data.tags) ? data.tags : [],
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
    };
  },

  /**
   * Prepare a note doc for Firestore write from Local.
   * Writes position under ui.local.xywh — MUST NOT touch ui.web.xywh.
   */
  prepareForWrite(doc, isNew = false) {
    ensureStringId(doc);
    stamp(doc, isNew);

    // Canonical key: body, not content
    if (doc.content !== undefined && doc.body === undefined) {
      doc.body = doc.content;
    }
    delete doc.content;

    // Move flat position fields into ui.local.xywh
    const x = doc.position_x ?? doc.x;
    const y = doc.position_y ?? doc.y;
    const w = doc.width ?? doc.w;
    const h = doc.height ?? doc.h;

    // Only write position fields that are explicitly provided (partial updates)
    if (x !== undefined || y !== undefined || w !== undefined || h !== undefined) {
      if (!doc.ui) doc.ui = {};
      if (!doc.ui.local) doc.ui.local = {};

      // Preserve existing ui.local.xywh if present (for partial updates)
      const existingXywh = doc.ui.local.xywh || {};

      doc.ui.local.xywh = {
        x: x !== undefined ? Number(x) : (existingXywh.x ?? 0),
        y: y !== undefined ? Number(y) : (existingXywh.y ?? 0),
        w: w !== undefined ? Number(w) : (existingXywh.w ?? 250),
        h: h !== undefined ? Number(h) : (existingXywh.h ?? 200),
      };
    }
    // Remove flat position fields — prohibited by contract §9
    delete doc.x;
    delete doc.y;
    delete doc.w;
    delete doc.h;
    delete doc.position_x;
    delete doc.position_y;
    delete doc.width;
    delete doc.height;
    delete doc.positionX;
    delete doc.positionY;

    // On new notes, seed ui.web.xywh so briizOS.Web can display them (§4.4)
    if (isNew) {
      if (!doc.ui) doc.ui = {};
      if (!doc.ui.web) {
        doc.ui.web = {
          xywh: {
            x: doc.ui?.local?.xywh?.x ?? 0,
            y: doc.ui?.local?.xywh?.y ?? 0,
            w: doc.ui?.local?.xywh?.w ?? 250,
            h: doc.ui?.local?.xywh?.h ?? 200,
          },
        };
      }
    }

    // Full validation only on new docs; partial updates (merge:true) may omit fields
    if (isNew) {
      requireFields(doc, ['id', 'type', 'title', 'createdAt'], 'noteAdapter');
      if (doc.body === undefined) doc.body = '';
      if (doc.customColor === undefined) doc.customColor = null;
    } else {
      requireFields(doc, ['id'], 'noteAdapter');
    }
    return doc;
  },
};
