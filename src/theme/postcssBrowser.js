/* Browser-only PostCSS surface for Theme Studio.

   The full `postcss` entry also registers processors, source maps and file-
   backed inputs. Those capabilities are useful to Electron and maintenance
   scripts, but they import Node's path, fs and url modules when the renderer
   starts. Theme Studio only edits in-memory CSS, so keep that smaller contract
   explicit here. The package is pinned because these are its exported parser
   primitives rather than its all-in-one Node entry. */

import AtRule from 'postcss/lib/at-rule';
import Comment from 'postcss/lib/comment';
import Container from 'postcss/lib/container';
import CssSyntaxError from 'postcss/lib/css-syntax-error';
import Declaration from 'postcss/lib/declaration';
import Parser from 'postcss/lib/parser';
import Rule from 'postcss/lib/rule';
import terminalHighlight from 'postcss/lib/terminal-highlight';

const lineOffsets = new WeakMap();
let inputSequence = 0;

function offsetsFor(input) {
  if (lineOffsets.has(input)) return lineOffsets.get(input);
  const offsets = [];
  let offset = 0;
  for (const line of input.css.split('\n')) {
    offsets.push(offset);
    offset += line.length + 1;
  }
  lineOffsets.set(input, offsets);
  return offsets;
}

class BrowserCssInput {
  get from() {
    return this.id;
  }

  constructor(css, options = {}) {
    if (
      css === null
      || typeof css === 'undefined'
      || (typeof css === 'object' && !css.toString)
    ) {
      throw new Error(`PostCSS received ${css} instead of CSS text.`);
    }
    if (options.from || options.map) {
      throw new Error(
        'Theme Studio only parses in-memory CSS in the renderer. File-backed CSS and source maps must be handled by Electron.',
      );
    }

    this.css = css.toString();
    if (this.css[0] === '\uFEFF' || this.css[0] === '\uFFFE') {
      this.hasBOM = true;
      this.css = this.css.slice(1);
    } else {
      this.hasBOM = false;
    }
    this.document = options.document?.toString() || this.css;
    inputSequence += 1;
    this.id = `<browser css ${inputSequence}>`;
  }

  error(message, line, column, options = {}) {
    let endColumn;
    let endLine;
    let endOffset;
    let offset;

    if (line && typeof line === 'object') {
      const start = line;
      const end = column || start;
      if (typeof start.offset === 'number') {
        offset = start.offset;
        const position = this.fromOffset(offset);
        line = position.line;
        column = position.col;
      } else {
        line = start.line;
        column = start.column;
        offset = this.fromLineAndColumn(line, column);
      }
      if (typeof end.offset === 'number') {
        endOffset = end.offset;
        const position = this.fromOffset(endOffset);
        endLine = position.line;
        endColumn = position.col;
      } else {
        endLine = end.line;
        endColumn = end.column;
        endOffset = this.fromLineAndColumn(endLine, endColumn);
      }
    } else if (!column) {
      offset = line;
      const position = this.fromOffset(offset);
      line = position.line;
      column = position.col;
    } else {
      offset = this.fromLineAndColumn(line, column);
    }

    const error = new CssSyntaxError(
      message,
      endLine === undefined ? line : { column, line },
      endLine === undefined ? column : { column: endColumn, line: endLine },
      this.css,
      undefined,
      options.plugin,
    );
    error.input = {
      column,
      endColumn,
      endLine,
      endOffset,
      line,
      offset,
      source: this.css,
    };
    return error;
  }

  fromLineAndColumn(line, column) {
    return offsetsFor(this)[line - 1] + column - 1;
  }

  fromOffset(offset) {
    const offsets = offsetsFor(this);
    const lastLine = offsets[offsets.length - 1];
    let minimum = 0;

    if (offset >= lastLine) {
      minimum = offsets.length - 1;
    } else {
      let maximum = offsets.length - 2;
      while (minimum < maximum) {
        const middle = minimum + ((maximum - minimum) >> 1);
        if (offset < offsets[middle]) maximum = middle - 1;
        else if (offset >= offsets[middle + 1]) minimum = middle + 1;
        else {
          minimum = middle;
          break;
        }
      }
    }
    return { col: offset - offsets[minimum] + 1, line: minimum + 1 };
  }

  toJSON() {
    return {
      css: this.css,
      hasBOM: this.hasBOM,
      id: this.id,
    };
  }
}

terminalHighlight.registerInput(BrowserCssInput);

function parse(css, options = {}) {
  const input = new BrowserCssInput(css, options);
  const parser = new Parser(input);
  parser.parse();
  return parser.root;
}

Container.registerParse(parse);

function postcssBrowser() {
  throw new Error(
    'PostCSS plugin processing is not available in the renderer. Use the browser parser or move processing to Electron.',
  );
}

Object.assign(postcssBrowser, {
  atRule: (defaults) => new AtRule(defaults),
  comment: (defaults) => new Comment(defaults),
  decl: (defaults) => new Declaration(defaults),
  parse,
  rule: (defaults) => new Rule(defaults),
});
Object.freeze(postcssBrowser);

export { parse };
export default postcssBrowser;
