const { randomUUID } = require('crypto');
const { Schema } = require('@tiptap/pm/model');
const TYPES = require('../../src/components/journals/execubriiz-types.json');
const clone = (value) => JSON.parse(JSON.stringify(value));
const richAttrs = { lineHeight: { default: null }, textAlign: { default: null } };
// The board is a ProseMirror document, not generated HTML or a second ordering store.
const schema = new Schema({
  nodes: {
    doc: { content: 'execSection*' },
    execSection: { content: 'execBlock*', attrs: { id: {}, revision: { default: 1 }, kind: { default: 'themes' }, title: { default: '' }, fixed: { default: false }, edges: { default: [] } } },
    execBlock: { content: 'block+', attrs: { id: {}, revision: { default: 1 }, done: { default: false } } },
    paragraph: { group: 'block', content: 'inline*', attrs: richAttrs },
    heading: { group: 'block', content: 'inline*', attrs: { ...richAttrs, level: { default: 2 } } },
    text: { group: 'inline' },
    hardBreak: { group: 'inline', inline: true },
    horizontalRule: { group: 'block' },
    blockquote: { group: 'block', content: 'block+' },
    bulletList: { group: 'block', content: 'listItem+' },
    orderedList: { group: 'block', content: 'listItem+', attrs: { start: { default: 1 } } },
    listItem: { content: 'paragraph block*' },
    codeBlock: { group: 'block', content: 'text*', marks: '', attrs: { language: { default: null } } },
    journalImage: { group: 'block', attrs: { src: {}, alt: { default: '' } } },
  },
  marks: {
    bold: {}, italic: {}, underline: {}, strike: {}, code: {},
    link: { attrs: { href: {}, target: { default: null }, rel: { default: null }, class: { default: null } } },
    textStyle: { attrs: { fontFamily: { default: null }, fontSize: { default: null }, color: { default: null } } },
  },
});
function plain(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  return (node.content || []).map(plain).join(['paragraph', 'heading', 'text'].includes(node.type) ? '' : '\n');
}
function paragraphs(text = '') {
  return String(text).split('\n').map((line) => ({ type: 'paragraph', ...(line ? { content: [{ type: 'text', text: line }] } : {}) }));
}
function section(kind = 'themes', title = '') {
  if (!TYPES.some((type) => type.id === kind)) throw new Error('Unknown section type');
  return { type: 'execSection', attrs: { id: randomUUID(), revision: 1, kind, title, fixed: false, edges: [] }, content: [] };
}
function emptyBoard() { return { type: 'doc', content: [section()] }; }
function locate(board, id) {
  for (const parent of board.content) {
    if (parent.attrs.id === id) return { node: parent, parent: board };
    const node = parent.content.find((child) => child.attrs.id === id);
    if (node) return { node, parent };
  }
  throw new Error('That part of the board no longer exists');
}
function validate(board) {
  if (JSON.stringify(board).length > 5000000) throw new Error('Board is too large');
  schema.nodeFromJSON(board).check();
  const ids = new Set();
  for (const parent of board.content) {
    if (!TYPES.some((type) => type.id === parent.attrs.kind)) throw new Error('Unknown section type');
    for (const node of [parent, ...parent.content]) {
      if (!node.attrs.id || ids.has(node.attrs.id)) throw new Error('Board IDs must be unique');
      ids.add(node.attrs.id);
    }
    if (!Array.isArray(parent.attrs.edges) || parent.attrs.edges.some((edge) =>
      !parent.content.some((n) => n.attrs.id === edge.from) || !parent.content.some((n) => n.attrs.id === edge.to))) throw new Error('Diagram endpoints must exist in the section');
  }
  return board;
}
function applyOperation(board, op, { actor = 'user', protectedIds = [] } = {}) {
  const next = clone(board);
  const ai = actor === 'ai';
  if (op.kind === 'addSection') {
    next.content.push(section(op.sectionKind, String(op.title || '').slice(0, 200)));
    return validate(next);
  }
  const target = locate(next, op.targetId);
  if (op.expectedRevision != null && target.node.attrs.revision !== op.expectedRevision) throw new Error('This idea changed while the suggestion was being prepared');
  const guarded = protectedIds.includes(op.targetId) || (target.node.type === 'execSection' && target.node.content.some((n) => protectedIds.includes(n.attrs.id)));
  if (ai && guarded) throw new Error('You are editing this part of the board; the suggestion was held back');
  if (op.kind === 'insert') {
    if (target.node.type !== 'execSection') throw new Error('Insert requires a section');
    target.node.content.push({ type: 'execBlock', attrs: { id: randomUUID(), revision: 1, done: false }, content: op.content || paragraphs(op.text) });
  } else if (op.kind === 'edit') {
    if (target.node.type !== 'execBlock') throw new Error('Edit requires an idea');
    target.node.content = op.content || paragraphs(op.text);
  } else if (op.kind === 'done') {
    if (target.node.type !== 'execBlock') throw new Error('Checkbox requires an idea');
    target.node.attrs.done = !!op.done;
  } else if (op.kind === 'rename') {
    if (target.node.type !== 'execSection') throw new Error('Rename requires a section');
    target.node.attrs.title = String(op.title || '').slice(0, 200);
  } else if (op.kind === 'pin') {
    if (ai || target.node.type !== 'execSection') throw new Error('Only you can set a section position');
    target.node.attrs.fixed = !!op.fixed;
  } else if (op.kind === 'convert') {
    if (target.node.type !== 'execSection' || !TYPES.some((t) => t.id === op.sectionKind)) throw new Error('Invalid section conversion');
    target.node.attrs.kind = op.sectionKind;
    target.node.attrs.edges = op.edges || [];
    if (op.sectionKind === 'diagram' && !op.edges?.length) target.node.attrs.edges = target.node.content.slice(1).map((n, i) => ({ from: target.node.content[i].attrs.id, to: n.attrs.id }));
  } else if (op.kind === 'retire') {
    if (ai && (target.node.attrs.fixed || target.parent.attrs?.fixed)) throw new Error('This section stays here');
    target.parent.content = target.parent.content.filter((n) => n.attrs.id !== op.targetId);
    if (target.parent.attrs) target.parent.attrs.edges = target.parent.attrs.edges.filter((e) => e.from !== op.targetId && e.to !== op.targetId);
  } else if (op.kind === 'move') {
    const destination = op.sectionId ? locate(next, op.sectionId).node : target.parent;
    if (ai && (target.node.attrs.fixed || (destination !== target.parent && (destination.attrs?.fixed || target.parent.attrs?.fixed)))) throw new Error('This section stays here; ideas cannot cross its boundary');
    if (target.node.type === 'execSection' && destination !== next) throw new Error('Sections cannot be nested');
    if (target.node.type === 'execBlock' && destination.type !== 'execSection') throw new Error('Ideas need a section');
    if (ai && target.node.type === 'execSection') {
      const from = next.content.indexOf(target.node);
      const to = op.beforeId ? next.content.findIndex((n) => n.attrs.id === op.beforeId) : next.content.length;
      if (next.content.slice(Math.min(from, to), Math.max(from, to) + 1).some((n) => n.attrs.fixed)) throw new Error('A fixed section cannot be crossed');
    }
    target.parent.content = target.parent.content.filter((n) => n !== target.node);
    const index = op.beforeId ? destination.content.findIndex((n) => n.attrs.id === op.beforeId) : -1;
    destination.content.splice(index < 0 ? destination.content.length : index, 0, target.node);
    if (destination !== target.parent) {
      target.parent.attrs.edges = target.parent.attrs.edges.filter((e) => e.from !== op.targetId && e.to !== op.targetId);
      destination.attrs.revision += 1;
    }
  } else throw new Error('Unsupported board operation');
  target.node.attrs.revision += 1;
  if (target.parent.attrs) target.parent.attrs.revision += 1;
  return validate(next);
}
module.exports = { TYPES, plain, paragraphs, section, emptyBoard, locate, validate, applyOperation, clone };
